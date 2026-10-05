import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/features/posts/pages/HomePage";
import { initialState as postsInitialState } from "@/features/posts/states/reducer";
import type { PostsState } from "@/features/posts/states/reducer";
import { formatDate } from "@/helpers/toolsHelper";
import {
  navigationMock,
  renderWithProviders,
  setSearchParams,
} from "@/test-utils";
import type { Post } from "@/types";

/* -------------------------------------------------------------------------- */
/*                     Mock state action & helper dialog                      */
/* -------------------------------------------------------------------------- */

/** Mock thunk state action; action creator sinkron milik modul asli dipertahankan. */
const thunkMocks = vi.hoisted(() => ({
  asyncAddPost: vi.fn(),
  asyncChangePost: vi.fn(),
  asyncChangePostCover: vi.fn(),
  asyncDeletePost: vi.fn(),
  asyncGetAllPosts: vi.fn(),
  asyncGetPostById: vi.fn(),
  asyncLikePost: vi.fn(),
  asyncAddComment: vi.fn(),
  asyncDeleteComment: vi.fn(),
}));

vi.mock("@/features/posts/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/posts/states/action")>();

  return {
    ...actual,
    asyncGetAllPosts: Object.assign(thunkMocks.asyncGetAllPosts, {
      pending: actual.asyncGetAllPosts.pending,
      fulfilled: actual.asyncGetAllPosts.fulfilled,
      rejected: actual.asyncGetAllPosts.rejected,
    }),
    asyncGetPostById: Object.assign(thunkMocks.asyncGetPostById, {
      pending: actual.asyncGetPostById.pending,
      fulfilled: actual.asyncGetPostById.fulfilled,
      rejected: actual.asyncGetPostById.rejected,
    }),
    asyncAddPost: Object.assign(thunkMocks.asyncAddPost, {
      pending: actual.asyncAddPost.pending,
      fulfilled: actual.asyncAddPost.fulfilled,
      rejected: actual.asyncAddPost.rejected,
    }),
    asyncChangePost: Object.assign(thunkMocks.asyncChangePost, {
      pending: actual.asyncChangePost.pending,
      fulfilled: actual.asyncChangePost.fulfilled,
      rejected: actual.asyncChangePost.rejected,
    }),
    asyncChangePostCover: Object.assign(thunkMocks.asyncChangePostCover, {
      pending: actual.asyncChangePostCover.pending,
      fulfilled: actual.asyncChangePostCover.fulfilled,
      rejected: actual.asyncChangePostCover.rejected,
    }),
    asyncDeletePost: Object.assign(thunkMocks.asyncDeletePost, {
      pending: actual.asyncDeletePost.pending,
      fulfilled: actual.asyncDeletePost.fulfilled,
      rejected: actual.asyncDeletePost.rejected,
    }),
    asyncLikePost: Object.assign(thunkMocks.asyncLikePost, {
      pending: actual.asyncLikePost.pending,
      fulfilled: actual.asyncLikePost.fulfilled,
      rejected: actual.asyncLikePost.rejected,
    }),
    asyncAddComment: Object.assign(thunkMocks.asyncAddComment, {
      pending: actual.asyncAddComment.pending,
      fulfilled: actual.asyncAddComment.fulfilled,
      rejected: actual.asyncAddComment.rejected,
    }),
    asyncDeleteComment: Object.assign(thunkMocks.asyncDeleteComment, {
      pending: actual.asyncDeleteComment.pending,
      fulfilled: actual.asyncDeleteComment.fulfilled,
      rejected: actual.asyncDeleteComment.rejected,
    }),
  };
});

/** Mock fungsi dialog SweetAlert2; `formatDate` dan helper lain tetap asli. */
const dialogMocks = vi.hoisted(() => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showWarningDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

vi.mock("@/helpers/toolsHelper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/helpers/toolsHelper")>();

  return {
    ...actual,
    showSuccessDialog: dialogMocks.showSuccessDialog,
    showErrorDialog: dialogMocks.showErrorDialog,
    showWarningDialog: dialogMocks.showWarningDialog,
    showConfirmDialog: dialogMocks.showConfirmDialog,
  };
});

/* -------------------------------------------------------------------------- */
/*                                  Helper                                    */
/* -------------------------------------------------------------------------- */

/**
 * Membuat nilai kembalian thunk tiruan berupa fungsi thunk yang menyediakan
 * `unwrap()`, sesuai cara komponen memanggil `dispatch(...)`.
 */
function thunkResult(behavior: () => Promise<unknown>) {
  return () => () => ({ unwrap: behavior });
}

/** State slice posts dengan penyesuaian. */
function preloadedPosts(overrides: Partial<PostsState> = {}) {
  return { posts: { ...postsInitialState, ...overrides } };
}

/** Objek postingan contoh yang lengkap. */
function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 12,
    user_id: 3,
    cover: null,
    description: "Deskripsi postingan contoh",
    created_at: "2024-10-05T03:07:00.000Z",
    updated_at: "2024-10-05T03:07:00.000Z",
    author: { name: "Budi Santoso", photo: null },
    likes: [1, 2, 3],
    comments: [1, 2],
    ...overrides,
  };
}

const successDialogResult = { isConfirmed: true, isDismissed: false };

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    thunkMocks.asyncGetAllPosts.mockImplementation(
      thunkResult(() => Promise.resolve([])),
    );
    thunkMocks.asyncAddPost.mockImplementation(
      thunkResult(() => Promise.resolve(1)),
    );
    dialogMocks.showSuccessDialog.mockResolvedValue(successDialogResult);
    dialogMocks.showErrorDialog.mockResolvedValue(successDialogResult);
  });

  it("memuat seluruh postingan saat pertama kali dirender", async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(thunkMocks.asyncGetAllPosts).toHaveBeenCalledWith(false);
    });
    expect(
      screen.getByText("Menampilkan seluruh postingan publik."),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Semua" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("menginisialisasi filter dari parameter is_me=1", async () => {
    setSearchParams({ is_me: "1" });

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(thunkMocks.asyncGetAllPosts).toHaveBeenCalledWith(true);
    });
    expect(
      screen.getByText("Menampilkan postingan milik Anda."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Postingan Saya" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("menampilkan skeleton saat posts.isPost true", () => {
    renderWithProviders(<HomePage />, {
      preloadedState: preloadedPosts({ isPost: true }),
    });

    const skeleton = screen.getByLabelText("Memuat postingan");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(
      screen.queryByText("Tidak ada postingan yang ditampilkan."),
    ).not.toBeInTheDocument();
  });

  it("menampilkan empty state saat daftar kosong dan tidak memuat", () => {
    renderWithProviders(<HomePage />, {
      preloadedState: preloadedPosts({ isPost: false, posts: [] }),
    });

    expect(
      screen.getByText("Tidak ada postingan yang ditampilkan."),
    ).toBeInTheDocument();
  });

  it("menampilkan kartu postingan lengkap dengan tautan detail", () => {
    const post = makePost({
      id: 12,
      cover: "img/cover/12_1709251633.png",
      description: "Deskripsi yang tampil pada kartu",
      author: { name: "Siti Aminah", photo: "img/profile/3.png" },
      likes: [1, 2, 3],
      comments: [1, 2],
    });

    renderWithProviders(<HomePage />, {
      preloadedState: preloadedPosts({ posts: [post] }),
    });

    const card = screen.getByRole("link", { name: /Siti Aminah/ });
    expect(card).toHaveAttribute("href", "/posts/12");

    expect(screen.getByText("Deskripsi yang tampil pada kartu")).toBeVisible();
    expect(
      within(card).getByText(formatDate("2024-10-05T03:07:00.000Z")),
    ).toBeInTheDocument();
    expect(within(card).getByText("3 suka")).toBeInTheDocument();
    expect(within(card).getByText("2 komentar")).toBeInTheDocument();

    // Cover dan foto penulis tersedia.
    expect(
      screen.getByAltText("Cover postingan Siti Aminah"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Siti Aminah")).toBeInTheDocument();
  });

  it("tidak menampilkan cover dan memakai ikon fallback tanpa foto penulis", () => {
    const post = makePost({
      cover: null,
      author: { name: "Tanpa Foto", photo: null },
    });

    const { container } = renderWithProviders(<HomePage />, {
      preloadedState: preloadedPosts({ posts: [post] }),
    });

    expect(
      screen.queryByAltText("Cover postingan Tanpa Foto"),
    ).not.toBeInTheDocument();
    expect(screen.queryByAltText("Tanpa Foto")).not.toBeInTheDocument();

    // Ikon fallback dirender sebagai svg di dalam kartu.
    const card = screen.getByRole("link", { name: /Tanpa Foto/ });
    expect(card.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("memfilter postingan berdasarkan deskripsi dan nama penulis", async () => {
    const user = userEvent.setup();
    const posts = [
      makePost({
        id: 1,
        description: "Belajar Redux Toolkit",
        author: { name: "Andi Wijaya", photo: null },
      }),
      makePost({
        id: 2,
        description: "Liburan ke pantai",
        author: { name: "Budi Santoso", photo: null },
      }),
    ];

    renderWithProviders(<HomePage />, {
      preloadedState: preloadedPosts({ posts }),
    });

    expect(screen.getAllByRole("link")).toHaveLength(2);

    const search = screen.getByLabelText("Cari postingan");

    // Cocok dengan deskripsi.
    await user.type(search, "redux");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("Belajar Redux Toolkit")).toBeVisible();

    // Cocok dengan nama penulis.
    await user.clear(search);
    await user.type(search, "budi");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("Liburan ke pantai")).toBeVisible();

    // Tidak cocok sama sekali.
    await user.clear(search);
    await user.type(search, "tidak-ada");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(
      screen.getByText("Tidak ada postingan yang ditampilkan."),
    ).toBeInTheDocument();
  });

  it("mengganti filter lewat tab dan memuat ulang postingan", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(thunkMocks.asyncGetAllPosts).toHaveBeenCalledWith(false);
    });

    await user.click(screen.getByRole("tab", { name: "Postingan Saya" }));

    expect(navigationMock.replace).toHaveBeenCalledWith("/?is_me=1");
    await waitFor(() => {
      expect(thunkMocks.asyncGetAllPosts).toHaveBeenLastCalledWith(true);
    });
    expect(
      screen.getByText("Menampilkan postingan milik Anda."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Semua" }));

    expect(navigationMock.replace).toHaveBeenLastCalledWith("/");
    await waitFor(() => {
      expect(thunkMocks.asyncGetAllPosts).toHaveBeenLastCalledWith(false);
    });
    expect(
      screen.getByText("Menampilkan seluruh postingan publik."),
    ).toBeInTheDocument();
  });

  it("membuka modal postingan baru saat tombol Postingan Baru diklik", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HomePage />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Postingan Baru" }));

    expect(
      screen.getByRole("dialog", { name: "Postingan Baru" }),
    ).toBeInTheDocument();

    // Menutup modal dari dalam AddModal memanggil callback milik HomePage.
    await user.click(screen.getByRole("button", { name: "Batal" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
