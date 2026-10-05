import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DetailPage from "@/features/posts/pages/DetailPage";
import { initialState as postsInitialState } from "@/features/posts/states/reducer";
import type { PostsState } from "@/features/posts/states/reducer";
import { initialState as usersInitialState } from "@/features/users/states/reducer";
import { formatDate } from "@/helpers/toolsHelper";
import {
  navigationMock,
  renderWithProviders,
  setRouteParams,
} from "@/test-utils";
import type { Post, User } from "@/types";

/* -------------------------------------------------------------------------- */
/*                     Mock state action & helper dialog                      */
/* -------------------------------------------------------------------------- */

/** Mock thunk state action; action creator sinkron milik modul asli dipertahankan. */
const thunkMocks = vi.hoisted(() => ({
  asyncAddComment: vi.fn(),
  asyncChangePost: vi.fn(),
  asyncChangePostCover: vi.fn(),
  asyncDeleteComment: vi.fn(),
  asyncDeletePost: vi.fn(),
  asyncGetAllPosts: vi.fn(),
  asyncGetPostById: vi.fn(),
  asyncLikePost: vi.fn(),
  asyncAddPost: vi.fn(),
}));

vi.mock("@/features/posts/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/posts/states/action")>();

  return {
    ...actual,
    asyncGetPostById: Object.assign(thunkMocks.asyncGetPostById, {
      pending: actual.asyncGetPostById.pending,
      fulfilled: actual.asyncGetPostById.fulfilled,
      rejected: actual.asyncGetPostById.rejected,
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
    asyncDeletePost: Object.assign(thunkMocks.asyncDeletePost, {
      pending: actual.asyncDeletePost.pending,
      fulfilled: actual.asyncDeletePost.fulfilled,
      rejected: actual.asyncDeletePost.rejected,
    }),
    asyncGetAllPosts: Object.assign(thunkMocks.asyncGetAllPosts, {
      pending: actual.asyncGetAllPosts.pending,
      fulfilled: actual.asyncGetAllPosts.fulfilled,
      rejected: actual.asyncGetAllPosts.rejected,
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

/**
 * Modal ubah postingan & ubah cover digantikan komponen sederhana agar
 * pengujian tetap fokus pada DetailPage. Tombol tiruan memanggil `onClose`
 * sehingga callback penutup modal pada DetailPage ikut teruji.
 */
vi.mock("../components/modals/ChangeModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <button type="button" onClick={onClose}>
        change-modal-open
      </button>
    ) : null,
}));

vi.mock("../components/modals/ChangeCoverModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <button type="button" onClick={onClose}>
        change-cover-modal-open
      </button>
    ) : null,
}));

/* -------------------------------------------------------------------------- */
/*                                  Helper                                    */
/* -------------------------------------------------------------------------- */

/**
 * Membuat nilai kembalian thunk tiruan berupa fungsi thunk yang menyediakan
 * `unwrap()`, sesuai cara komponen memanggil `dispatch(...).unwrap()`.
 */
function thunkResult(behavior: () => Promise<unknown>) {
  return () => () => ({ unwrap: behavior });
}

/** Objek pengguna contoh yang lengkap. */
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 3,
    name: "Budi Santoso",
    email: "budi@example.com",
    email_verified_at: null,
    photo: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Objek postingan contoh yang lengkap. */
function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 5,
    user_id: 3,
    cover: null,
    description: "Deskripsi lengkap postingan",
    created_at: "2024-10-05T03:07:00.000Z",
    updated_at: "2024-10-05T03:07:00.000Z",
    author: { name: "Budi Santoso", photo: null },
    likes: [],
    comments: [],
    ...overrides,
  };
}

/** State awal store pengujian dengan penyesuaian slice posts/users. */
function makeState(
  options: { posts?: Partial<PostsState>; profile?: User | null } = {},
) {
  return {
    posts: { ...postsInitialState, ...(options.posts ?? {}) },
    users: {
      ...usersInitialState,
      profile: options.profile === undefined ? null : options.profile,
    },
  };
}

const successDialogResult = { isConfirmed: true, isDismissed: false };

describe("DetailPage", () => {
  beforeEach(() => {
    setRouteParams({ postId: "5" });

    vi.clearAllMocks();

    thunkMocks.asyncGetPostById.mockImplementation(
      thunkResult(() => Promise.resolve(makePost())),
    );
    thunkMocks.asyncLikePost.mockImplementation(
      thunkResult(() => Promise.resolve({ postId: 5, like: 1 })),
    );
    thunkMocks.asyncAddComment.mockImplementation(
      thunkResult(() => Promise.resolve({ postId: 5, comment: "Halo" })),
    );
    thunkMocks.asyncDeleteComment.mockImplementation(
      thunkResult(() => Promise.resolve(5)),
    );
    thunkMocks.asyncDeletePost.mockImplementation(
      thunkResult(() => Promise.resolve(5)),
    );

    dialogMocks.showSuccessDialog.mockResolvedValue(successDialogResult);
    dialogMocks.showErrorDialog.mockResolvedValue(successDialogResult);
    dialogMocks.showConfirmDialog.mockResolvedValue(true);
  });

  it("menampilkan skeleton saat postingan sedang dimuat", async () => {
    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({ posts: { isPost: true, post: null } }),
    });

    const skeleton = screen.getByLabelText("Memuat postingan");
    expect(skeleton).toHaveAttribute("aria-busy", "true");

    await waitFor(() => {
      expect(thunkMocks.asyncGetPostById).toHaveBeenCalledWith(5);
    });
  });

  it("menampilkan pesan tidak ditemukan saat postingan null", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({ posts: { isPost: false, post: null } }),
    });

    expect(
      screen.getByText("Postingan tidak ditemukan."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Kembali ke linimasa" }));

    expect(navigationMock.push).toHaveBeenCalledWith("/");
  });

  it("menampilkan detail postingan beserta komentar objek saja", async () => {
    const post = makePost({
      id: 5,
      cover: "img/cover/5_1709251633.png",
      description: "Deskripsi lengkap postingan",
      author: { name: "Budi Santoso", photo: "img/profile/3.png" },
      likes: [3],
      comments: [
        1,
        {
          id: 2,
          comment: "Halo",
          created_at: "2024-10-06T03:07:00.000Z",
          updated_at: "2024-10-06T03:07:00.000Z",
        },
      ],
    });

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { isPost: true, post },
        profile: makeUser({ id: 3 }),
      }),
    });

    await waitFor(() => {
      expect(thunkMocks.asyncGetPostById).toHaveBeenCalledWith(5);
    });

    expect(screen.getByText("Deskripsi lengkap postingan")).toBeVisible();
    expect(screen.getAllByText("Budi Santoso").length).toBeGreaterThan(0);
    expect(
      screen.getByText(`Dipublikasikan ${formatDate(post.created_at)}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 suka" })).toBeInTheDocument();
    expect(screen.getByText("1 komentar")).toBeInTheDocument();

    // Hanya komentar berbentuk objek yang dirender.
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByText("Halo")).toBeInTheDocument();

    // Cover dan foto penulis tersedia.
    expect(
      screen.getByAltText("Cover postingan Budi Santoso"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Budi Santoso")).toBeInTheDocument();
  });

  it("memakai placeholder tanpa cover dan ikon fallback tanpa foto penulis", () => {
    const post = makePost({
      cover: null,
      author: { name: "Tanpa Foto", photo: null },
      comments: [],
    });

    const { container } = renderWithProviders(<DetailPage />, {
      preloadedState: makeState({ posts: { isPost: false, post } }),
    });

    expect(
      screen.queryByAltText("Cover postingan Tanpa Foto"),
    ).not.toBeInTheDocument();
    expect(screen.queryByAltText("Tanpa Foto")).not.toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(screen.getByText("Belum ada komentar. Jadilah yang pertama!")).toBeInTheDocument();
  });

  it("memanggil asyncLikePost dengan like 0 saat profil menyukai postingan", async () => {
    const user = userEvent.setup();
    const post = makePost({ id: 5, likes: [3, 9] });

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post },
        profile: makeUser({ id: 3 }),
      }),
    });

    const likeButton = screen.getByRole("button", { name: "2 suka" });
    expect(likeButton).toHaveAttribute("aria-pressed", "true");

    await user.click(likeButton);

    await waitFor(() => {
      expect(thunkMocks.asyncLikePost).toHaveBeenCalledWith({
        postId: 5,
        like: 0,
      });
    });
  });

  it("memanggil asyncLikePost dengan like 1 saat profil belum menyukai postingan", async () => {
    const user = userEvent.setup();
    const post = makePost({ id: 5, likes: [] });

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post },
        profile: makeUser({ id: 3 }),
      }),
    });

    const likeButton = screen.getByRole("button", { name: "0 suka" });
    expect(likeButton).toHaveAttribute("aria-pressed", "false");

    await user.click(likeButton);

    await waitFor(() => {
      expect(thunkMocks.asyncLikePost).toHaveBeenCalledWith({
        postId: 5,
        like: 1,
      });
    });
  });

  it("menandai belum menyukai dan mengirim like 1 saat profil belum dimuat", async () => {
    const user = userEvent.setup();
    const post = makePost({ id: 5, likes: [] });

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({ posts: { post }, profile: null }),
    });

    const likeButton = screen.getByRole("button", { name: "0 suka" });
    expect(likeButton).toHaveAttribute("aria-pressed", "false");

    await user.click(likeButton);

    await waitFor(() => {
      expect(thunkMocks.asyncLikePost).toHaveBeenCalledWith({
        postId: 5,
        like: 1,
      });
    });
  });

  it("menampilkan dialog error saat gagal menyukai postingan", async () => {
    thunkMocks.asyncLikePost.mockImplementation(
      thunkResult(() => Promise.reject(new Error("like gagal"))),
    );

    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ likes: [] }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    await user.click(screen.getByRole("button", { name: "0 suka" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Gagal mengubah suka",
        expect.stringContaining("like gagal"),
      );
    });
  });

  it("menolak komentar kosong", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({ posts: { post: makePost() } }),
    });

    await user.click(screen.getByRole("button", { name: "Kirim" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Komentar masih kosong",
        "Tuliskan komentar terlebih dahulu.",
      );
    });
    expect(thunkMocks.asyncAddComment).not.toHaveBeenCalled();
  });

  it("mengirim komentar valid lalu mengosongkan kolom komentar", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({ posts: { post: makePost() } }),
    });

    const input = screen.getByLabelText("Tulis komentar");
    await user.type(input, "Komentar baru saya");
    await user.click(screen.getByRole("button", { name: "Kirim" }));

    await waitFor(() => {
      expect(thunkMocks.asyncAddComment).toHaveBeenCalledWith({
        postId: 5,
        comment: "Komentar baru saya",
      });
    });
    expect(dialogMocks.showSuccessDialog).toHaveBeenCalledWith(
      "Berhasil",
      "Komentar berhasil dikirim.",
    );
    await waitFor(() => {
      expect(screen.getByLabelText("Tulis komentar")).toHaveValue("");
    });
  });

  it("menampilkan dialog error saat komentar gagal dikirim", async () => {
    thunkMocks.asyncAddComment.mockImplementation(
      thunkResult(() => Promise.reject(new Error("komentar gagal"))),
    );

    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({ posts: { post: makePost() } }),
    });

    await user.type(screen.getByLabelText("Tulis komentar"), "Komentar saya");
    await user.click(screen.getByRole("button", { name: "Kirim" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Gagal mengirim komentar",
        expect.stringContaining("komentar gagal"),
      );
    });
  });

  it("menghapus komentar sendiri setelah dikonfirmasi", async () => {
    const user = userEvent.setup();
    const myComment = {
      id: 11,
      comment: "Komentar milik saya",
      created_at: "2024-10-06T03:07:00.000Z",
      updated_at: "2024-10-06T03:07:00.000Z",
    };

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ comments: [myComment], my_comment: myComment }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    expect(screen.getByText("Komentar Anda")).toBeInTheDocument();
    // Tampil pada daftar komentar dan pada blok "Komentar Anda".
    expect(screen.getAllByText("Komentar milik saya")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Hapus" }));

    expect(dialogMocks.showConfirmDialog).toHaveBeenCalledWith(
      "Hapus komentar?",
      "Komentar Anda akan dihapus permanen.",
    );
    await waitFor(() => {
      expect(thunkMocks.asyncDeleteComment).toHaveBeenCalledWith(5);
    });
    expect(dialogMocks.showSuccessDialog).toHaveBeenCalledWith(
      "Berhasil",
      "Komentar berhasil dihapus.",
    );
  });

  it("tidak menghapus komentar bila konfirmasi dibatalkan", async () => {
    dialogMocks.showConfirmDialog.mockResolvedValue(false);

    const user = userEvent.setup();
    const myComment = {
      id: 11,
      comment: "Komentar milik saya",
      created_at: "2024-10-06T03:07:00.000Z",
      updated_at: "2024-10-06T03:07:00.000Z",
    };

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ my_comment: myComment }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    await user.click(screen.getByRole("button", { name: "Hapus" }));

    await waitFor(() => {
      expect(dialogMocks.showConfirmDialog).toHaveBeenCalled();
    });
    expect(thunkMocks.asyncDeleteComment).not.toHaveBeenCalled();
  });

  it("menampilkan dialog error saat gagal menghapus komentar", async () => {
    thunkMocks.asyncDeleteComment.mockImplementation(
      thunkResult(() => Promise.reject(new Error("hapus komentar gagal"))),
    );

    const user = userEvent.setup();
    const myComment = {
      id: 11,
      comment: "Komentar milik saya",
      created_at: "2024-10-06T03:07:00.000Z",
      updated_at: "2024-10-06T03:07:00.000Z",
    };

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ my_comment: myComment }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    await user.click(screen.getByRole("button", { name: "Hapus" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Gagal menghapus komentar",
        expect.stringContaining("hapus komentar gagal"),
      );
    });
  });

  it("menampilkan aksi pemilik dan membuka kedua modal perubahan", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ user_id: 3 }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    expect(
      screen.getByRole("button", { name: "Ubah Cover" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ubah Postingan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hapus Postingan" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ubah Cover" }));
    const coverModal = screen.getByRole("button", {
      name: "change-cover-modal-open",
    });
    expect(coverModal).toBeInTheDocument();

    // Menutup modal ubah cover ikut memanggil callback DetailPage.
    await user.click(coverModal);
    expect(
      screen.queryByRole("button", { name: "change-cover-modal-open" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ubah Postingan" }));
    const changeModal = screen.getByRole("button", {
      name: "change-modal-open",
    });
    expect(changeModal).toBeInTheDocument();

    // Menutup modal ubah postingan ikut memanggil callback DetailPage.
    await user.click(changeModal);
    expect(
      screen.queryByRole("button", { name: "change-modal-open" }),
    ).not.toBeInTheDocument();
  });

  it("menyembunyikan aksi pemilik untuk postingan milik pengguna lain", () => {
    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ user_id: 99 }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    expect(
      screen.queryByRole("button", { name: "Ubah Cover" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ubah Postingan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hapus Postingan" }),
    ).not.toBeInTheDocument();
  });

  it("menghapus postingan setelah dikonfirmasi lalu kembali ke linimasa", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ user_id: 3 }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    await user.click(screen.getByRole("button", { name: "Hapus Postingan" }));

    expect(dialogMocks.showConfirmDialog).toHaveBeenCalledWith(
      "Hapus postingan?",
      "Postingan ini beserta komentarnya akan dihapus permanen.",
    );
    await waitFor(() => {
      expect(thunkMocks.asyncDeletePost).toHaveBeenCalledWith(5);
    });
    expect(dialogMocks.showSuccessDialog).toHaveBeenCalledWith(
      "Berhasil",
      "Postingan berhasil dihapus.",
    );
    expect(navigationMock.push).toHaveBeenCalledWith("/");
  });

  it("tidak menghapus postingan bila konfirmasi dibatalkan", async () => {
    dialogMocks.showConfirmDialog.mockResolvedValue(false);

    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ user_id: 3 }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    await user.click(screen.getByRole("button", { name: "Hapus Postingan" }));

    await waitFor(() => {
      expect(dialogMocks.showConfirmDialog).toHaveBeenCalled();
    });
    expect(thunkMocks.asyncDeletePost).not.toHaveBeenCalled();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("menampilkan dialog error saat gagal menghapus postingan", async () => {
    thunkMocks.asyncDeletePost.mockImplementation(
      thunkResult(() => Promise.reject(new Error("hapus gagal"))),
    );

    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ user_id: 3 }) },
        profile: makeUser({ id: 3 }),
      }),
    });

    await user.click(screen.getByRole("button", { name: "Hapus Postingan" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Gagal menghapus postingan",
        expect.stringContaining("hapus gagal"),
      );
    });
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("menonaktifkan tombol hapus dan menampilkan label 'Menghapus...' saat isPostDelete true", () => {
    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({
        posts: { post: makePost({ user_id: 3 }), isPostDelete: true },
        profile: makeUser({ id: 3 }),
      }),
    });

    const deleteButton = screen.getByRole("button", { name: "Menghapus..." });
    expect(deleteButton).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Hapus Postingan" }),
    ).not.toBeInTheDocument();
  });

  it("kembali ke linimasa lewat tombol di atas halaman", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DetailPage />, {
      preloadedState: makeState({ posts: { post: makePost() } }),
    });

    await user.click(screen.getByRole("button", { name: "Kembali ke linimasa" }));

    expect(navigationMock.push).toHaveBeenCalledWith("/");
  });
});
