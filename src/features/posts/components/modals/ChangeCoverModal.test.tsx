import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChangeCoverModal from "@/features/posts/components/modals/ChangeCoverModal";
import { initialState as postsInitialState } from "@/features/posts/states/reducer";
import type { PostsState } from "@/features/posts/states/reducer";
import { renderWithProviders } from "@/test-utils";
import type { Post } from "@/types";

/* -------------------------------------------------------------------------- */
/*                     Mock state action & helper dialog                      */
/* -------------------------------------------------------------------------- */

/** Mock thunk state action; action creator sinkron milik modul asli dipertahankan. */
const thunkMocks = vi.hoisted(() => ({
  asyncChangePostCover: vi.fn(),
}));

vi.mock("@/features/posts/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/posts/states/action")>();

  return {
    ...actual,
    asyncChangePostCover: Object.assign(thunkMocks.asyncChangePostCover, {
      pending: actual.asyncChangePostCover.pending,
      fulfilled: actual.asyncChangePostCover.fulfilled,
      rejected: actual.asyncChangePostCover.rejected,
    }),
  };
});

/** Mock fungsi dialog SweetAlert2; `resolveImageUrl` dan helper lain tetap asli. */
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

/** Berkas gambar valid untuk diunggah. */
function makeImageFile(name = "cover.png"): File {
  return new File(["isi-gambar"], name, { type: "image/png" });
}

/**
 * jsdom versi ini sudah menyediakan `URL.createObjectURL`, sehingga stub pada
 * `src/setupTests.ts` tidak terpasang. Spy lokal dipakai agar hasil URL
 * pratinjau deterministik dan pemanggilan `revokeObjectURL` dapat diperiksa.
 */
const createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL");

const successDialogResult = { isConfirmed: true, isDismissed: false };

describe("ChangeCoverModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    createObjectURLSpy.mockReturnValue("blob:mock-preview");
    revokeObjectURLSpy.mockImplementation(() => undefined);

    thunkMocks.asyncChangePostCover.mockImplementation(
      thunkResult(() => Promise.resolve(7)),
    );
    dialogMocks.showSuccessDialog.mockResolvedValue(successDialogResult);
    dialogMocks.showErrorDialog.mockResolvedValue(successDialogResult);
  });

  it("tidak merender apa pun saat open=false", () => {
    renderWithProviders(
      <ChangeCoverModal
        open={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Ganti Cover")).not.toBeInTheDocument();
  });

  it("menampilkan placeholder 'Belum ada cover' saat postingan tanpa cover", () => {
    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost({ cover: null })}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Ganti Cover" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Belum ada cover")).toBeInTheDocument();
  });

  it("menampilkan gambar cover saat ini bila postingan memiliki cover", () => {
    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost({ cover: "img/cover/7_1709251633.png" })}
      />,
    );

    const currentCover = screen.getByAltText("Cover saat ini");
    expect(currentCover).toBeInTheDocument();
    expect(currentCover.getAttribute("src")).toContain(
      "img/cover/7_1709251633.png",
    );
    expect(screen.queryByText("Belum ada cover")).not.toBeInTheDocument();
  });

  it("menampilkan dialog error saat submit tanpa memilih berkas", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Unggah Cover" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Belum ada berkas",
        "Pilih gambar cover terlebih dahulu.",
      );
    });
    expect(thunkMocks.asyncChangePostCover).not.toHaveBeenCalled();
  });

  it("menampilkan pratinjau berkas gambar yang dipilih", async () => {
    const user = userEvent.setup();
    const file = makeImageFile();

    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    await user.upload(screen.getByLabelText("Berkas Cover"), file);

    const preview = await screen.findByAltText("Pratinjau cover baru");
    expect(preview).toHaveAttribute("src", "blob:mock-preview");
    expect(createObjectURLSpy).toHaveBeenCalledWith(file);
    expect(
      screen.getByText("Berkas dipilih: cover.png"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Belum ada cover")).not.toBeInTheDocument();
  });

  it("mengunggah cover lalu memanggil onSuccess, onClose, dan revokeObjectURL", async () => {
    const user = userEvent.setup();
    const file = makeImageFile("sampul-baru.png");
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={onClose}
        onSuccess={onSuccess}
        post={makePost({ id: 7 })}
      />,
    );

    await user.upload(screen.getByLabelText("Berkas Cover"), file);
    await user.click(screen.getByRole("button", { name: "Unggah Cover" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(thunkMocks.asyncChangePostCover).toHaveBeenCalledWith({
      postId: 7,
      cover: file,
    });
    expect(dialogMocks.showSuccessDialog).toHaveBeenCalledWith(
      "Berhasil",
      "Cover postingan berhasil diperbarui.",
    );
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-preview");
  });

  it("menolak berkas non-gambar dan tidak memakainya sebagai cover", async () => {    const file = new File(["catatan"], "catatan.txt", { type: "text/plain" });

    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Berkas Cover"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Berkas tidak didukung",
        "Pilih berkas gambar (JPG, PNG, atau WEBP).",
      );
    });
    expect(
      screen.queryByAltText("Pratinjau cover baru"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Berkas dipilih/)).not.toBeInTheDocument();

    fireEvent.submit(
      screen.getByRole("button", { name: "Unggah Cover" }).closest("form")!,
    );

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Belum ada berkas",
        "Pilih gambar cover terlebih dahulu.",
      );
    });
    expect(thunkMocks.asyncChangePostCover).not.toHaveBeenCalled();
  });

  it("tidak mengubah apa pun saat tidak ada berkas yang dipilih", () => {
    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Berkas Cover"), {
      target: { files: [] },
    });

    expect(dialogMocks.showErrorDialog).not.toHaveBeenCalled();
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(
      screen.queryByAltText("Pratinjau cover baru"),
    ).not.toBeInTheDocument();
  });

  it("menampilkan dialog error saat unggah gagal", async () => {
    thunkMocks.asyncChangePostCover.mockImplementation(
      thunkResult(() => Promise.reject(new Error("unggah gagal"))),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const file = makeImageFile();

    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={onClose}
        onSuccess={onSuccess}
        post={makePost()}
      />,
    );

    await user.upload(screen.getByLabelText("Berkas Cover"), file);
    await user.click(screen.getByRole("button", { name: "Unggah Cover" }));

    await waitFor(() => {
      expect(dialogMocks.showErrorDialog).toHaveBeenCalledWith(
        "Gagal mengunggah cover",
        expect.stringContaining("unggah gagal"),
      );
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("menutup modal lewat tombol Tutup, overlay, dan Batal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={onClose}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tutup" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Tutup dialog" }));
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
  });

  it("mencabut URL pratinjau saat modal ditutup setelah memilih berkas", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={onClose}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
    );

    await user.upload(screen.getByLabelText("Berkas Cover"), makeImageFile());
    await screen.findByAltText("Pratinjau cover baru");

    await user.click(screen.getByRole("button", { name: "Tutup" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-preview");
  });

  it("menonaktifkan tombol dan menampilkan label 'Mengunggah...' saat isPostChangeCover true", () => {
    renderWithProviders(
      <ChangeCoverModal
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        post={makePost()}
      />,
      { preloadedState: preloadedPosts({ isPostChangeCover: true }) },
    );

    const submit = screen.getByRole("button", { name: "Mengunggah..." });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Unggah Cover" }),
    ).not.toBeInTheDocument();
  });
});
