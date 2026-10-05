import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChangeModal from "@/features/posts/components/modals/ChangeModal";
import { initialState as postsInitialState } from "@/features/posts/states/reducer";
import type { PostsState } from "@/features/posts/states/reducer";
import { renderWithProviders } from "@/test-utils";
import type { Post } from "@/types";

/* -------------------------------------------------------------------------- */
/*                     Mock state action & helper dialog                      */
/* -------------------------------------------------------------------------- */

/** Mock thunk state action; action creator sinkron milik modul asli dipertahankan. */
const thunkMocks = vi.hoisted(() => ({
  asyncChangePost: vi.fn(),
}));

vi.mock("@/features/posts/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/posts/states/action")>();

  return {
    ...actual,
    asyncChangePost: Object.assign(thunkMocks.asyncChangePost, {
      pending: actual.asyncChangePost.pending,
      fulfilled: actual.asyncChangePost.fulfilled,
      rejected: actual.asyncChangePost.rejected,
    }),
  };
});

/** Mock fungsi dialog SweetAlert2; fungsi helper lain tetap asli. */
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
 * `unwrap()`, sesuai cara komponen memanggil `dispatch(...).unwrap()`.
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
    id: 7,
    user_id: 3,
    cover: null,
    description: "Deskripsi awal postingan",
    created_at: "2024-10-05T03:07:00.000Z",
    updated_at: "2024-10-05T03:07:00.000Z",
    author: { name: "Budi Santoso", photo: null },
    likes: [],
    comments: [],
    ...overrides,
  };
}

const successDialogResult = { isConfirmed: true, isDismissed: false };

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    thunkMocks.asyncChangePost.mockImplementation(
      thunkResult(() => Promise.resolve(7)),
    );
    dialogMocks.showSuccessDialog.mockResolvedValue(successDialogResult);
    dialogMocks.showErrorDialog.mockResolvedValue(successDialogResult);
  });

  it("tidak merender apa pun saat open=false", () => {
    renderWithProviders(
      <ChangeModal
        open={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Ubah Postingan")).not.toBeInTheDocument();
  });

  it("menampilkan textarea berisi deskripsi postingan saat open=true", () => {
    const post = makePost({ description: "Deskripsi dari server" });

    renderWithProviders(
      <ChangeModal open onClose={vi.fn()} onSuccess={vi.fn()} post={post} />,
    );

    expect(
      screen.getByRole("dialog", { name: "Ubah Postingan" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Deskripsi")).toHaveValue(
      "Deskripsi dari server",
    );
  });

  it("mengirim deskripsi yang diubah lalu memanggil onSuccess dan onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const post = makePost({ id: 7, description: "Deskripsi lama" });

    renderWithProviders(
      <ChangeModal open onClose={onClose} onSuccess={onSuccess} post={post} />,
    );

    const textarea = screen.getByLabelText("Deskripsi");
    await user.clear(textarea);
    await user.type(textarea, "Deskripsi baru");
    await user.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(thunkMocks.asyncChangePost).toHaveBeenCalledWith({
      postId: 7,
      description: "Deskripsi baru",
    });
    expect(dialogMocks.showSuccessDialog).toHaveBeenCalledWith(
      "Berhasil",
      "Postingan berhasil diperbarui.",
    );
  });

  it("menampilkan dialog error dan tidak mengirim saat deskripsi kosong", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ChangeModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    await user.clear(screen.getByLabelText("Deskripsi"));
    await user.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Deskripsi masih kosong",
        "Deskripsi postingan tidak boleh kosong.",
      );
    });
    expect(thunkMocks.asyncChangePost).not.toHaveBeenCalled();
  });

  it("menampilkan dialog error saat penyimpanan gagal", async () => {
    thunkMocks.asyncChangePost.mockImplementation(
      thunkResult(() => Promise.reject(new Error("gagal simpan"))),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithProviders(
      <ChangeModal
        open
        onClose={onClose}
        onSuccess={onSuccess}
        post={makePost()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Gagal memperbarui",
        expect.stringContaining("gagal simpan"),
      );
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("menonaktifkan tombol dan menampilkan label 'Menyimpan...' saat isPostChange true", () => {
    renderWithProviders(
      <ChangeModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
      { preloadedState: preloadedPosts({ isPostChange: true }) },
    );

    const submit = screen.getByRole("button", { name: "Menyimpan..." });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Simpan Perubahan" }),
    ).not.toBeInTheDocument();
  });

  it("menyelaraskan isi formulir saat open berubah dari false ke true", async () => {
    const first = makePost({ description: "Deskripsi pertama" });
    const second = makePost({ description: "Deskripsi hasil pembaruan" });

    const { rerender } = renderWithProviders(
      <ChangeModal open={false} onClose={vi.fn()} onSuccess={vi.fn()} post={first} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <ChangeModal open onClose={vi.fn()} onSuccess={vi.fn()} post={second} />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Deskripsi")).toHaveValue(
        "Deskripsi hasil pembaruan",
      );
    });
  });

  it("menyelaraskan isi formulir saat deskripsi postingan berubah", async () => {
    const first = makePost({ description: "Deskripsi pertama" });
    const second = makePost({ description: "Deskripsi kedua" });

    const { rerender } = renderWithProviders(
      <ChangeModal open onClose={vi.fn()} onSuccess={vi.fn()} post={first} />,
    );

    expect(screen.getByLabelText("Deskripsi")).toHaveValue("Deskripsi pertama");

    rerender(
      <ChangeModal open onClose={vi.fn()} onSuccess={vi.fn()} post={second} />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Deskripsi")).toHaveValue("Deskripsi kedua");
    });
  });

  it("memanggil onClose saat tombol Tutup dan Batal diklik", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <ChangeModal
        open
        onClose={onClose}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tutup" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
