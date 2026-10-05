import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddModal from "@/features/posts/components/modals/AddModal";
import { initialState as postsInitialState } from "@/features/posts/states/reducer";
import type { PostsState } from "@/features/posts/states/reducer";
import { renderWithProviders } from "@/test-utils";

/* -------------------------------------------------------------------------- */
/*                     Mock state action & helper dialog                      */
/* -------------------------------------------------------------------------- */

/**
 * Mock thunk state action.
 *
 * Action creator sinkron (pending/fulfilled/rejected) milik modul asli tetap
 * dipertahankan agar `createSlice` pada reducer tidak gagal saat modul dimuat.
 */
const thunkMocks = vi.hoisted(() => ({
  asyncAddPost: vi.fn(),
}));

vi.mock("@/features/posts/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/posts/states/action")>();

  return {
    ...actual,
    asyncAddPost: Object.assign(thunkMocks.asyncAddPost, {
      pending: actual.asyncAddPost.pending,
      fulfilled: actual.asyncAddPost.fulfilled,
      rejected: actual.asyncAddPost.rejected,
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
 * Membuat nilai kembalian thunk tiruan.
 *
 * Komponen memanggil `dispatch(asyncAddPost(...))`, sehingga nilai kembalian
 * harus berupa fungsi thunk (agar dapat diproses redux-thunk) yang sekaligus
 * menyediakan `unwrap()`.
 */
function thunkResult(behavior: () => Promise<unknown>) {
  return () => () => ({ unwrap: behavior });
}

/** State awal slice posts dengan penyesuaian. */
function preloadedPosts(overrides: Partial<PostsState> = {}) {
  return { posts: { ...postsInitialState, ...overrides } };
}

const successDialogResult = { isConfirmed: true, isDismissed: false };

describe("AddModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    thunkMocks.asyncAddPost.mockImplementation(
      thunkResult(() => Promise.resolve(1)),
    );
    dialogMocks.showSuccessDialog.mockResolvedValue(successDialogResult);
    dialogMocks.showErrorDialog.mockResolvedValue(successDialogResult);
  });

  it("tidak merender dialog saat open=false", () => {
    renderWithProviders(
      <AddModal open={false} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Postingan Baru")).not.toBeInTheDocument();
  });

  it("menampilkan dialog beserta formulir saat open=true", () => {
    renderWithProviders(
      <AddModal open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    expect(
      screen.getByRole("dialog", { name: "Postingan Baru" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Deskripsi")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Publikasikan" }),
    ).toBeInTheDocument();
  });

  it("menampilkan dialog error dan tidak memanggil asyncAddPost saat deskripsi kosong", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AddModal open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Publikasikan" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Deskripsi masih kosong",
        "Tuliskan sesuatu sebelum mempublikasikan postingan.",
      );
    });
    expect(thunkMocks.asyncAddPost).not.toHaveBeenCalled();
  });

  it("menampilkan dialog error saat deskripsi hanya berisi spasi", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AddModal open onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    await user.type(screen.getByLabelText("Deskripsi"), "   ");
    await user.click(screen.getByRole("button", { name: "Publikasikan" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledTimes(1);
    });
    expect(thunkMocks.asyncAddPost).not.toHaveBeenCalled();
  });

  it("mempublikasikan postingan valid lalu memanggil onSuccess dan onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithProviders(
      <AddModal open onClose={onClose} onSuccess={onSuccess} />,
    );

    await user.type(screen.getByLabelText("Deskripsi"), "Halo dunia");
    await user.click(screen.getByRole("button", { name: "Publikasikan" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(thunkMocks.asyncAddPost).toHaveBeenCalledWith({
      description: "Halo dunia",
    });
    expect(dialogMocks.showSuccessDialog).toHaveBeenCalledWith(
      "Berhasil",
      "Postingan berhasil dipublikasikan.",
    );
    expect(screen.getByLabelText("Deskripsi")).toHaveValue("");
  });

  it("menampilkan dialog error saat publikasi gagal", async () => {
    thunkMocks.asyncAddPost.mockImplementation(
      thunkResult(() => Promise.reject(new Error("jaringan bermasalah"))),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithProviders(
      <AddModal open onClose={onClose} onSuccess={onSuccess} />,
    );

    await user.type(screen.getByLabelText("Deskripsi"), "Halo dunia");
    await user.click(screen.getByRole("button", { name: "Publikasikan" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Gagal mempublikasikan",
        expect.stringContaining("jaringan bermasalah"),
      );
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("menonaktifkan tombol dan menampilkan label 'Menyimpan...' saat isPostAdd true", () => {
    renderWithProviders(
      <AddModal open onClose={vi.fn()} onSuccess={vi.fn()} />,
      { preloadedState: preloadedPosts({ isPostAdd: true }) },
    );

    const submit = screen.getByRole("button", { name: "Menyimpan..." });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Publikasikan" }),
    ).not.toBeInTheDocument();
  });

  it("memanggil onClose saat tombol Tutup diklik", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<AddModal open onClose={onClose} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Tutup" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("memanggil onClose saat tombol Batal diklik", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<AddModal open onClose={onClose} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Batal" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
