import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MIN_PASSWORD_LENGTH } from "@/features/auth/pages/RegisterPage";
import ProfilePage from "@/features/users/pages/ProfilePage";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import { renderWithProviders } from "@/test-utils";
import type { User } from "@/types";

/**
 * Pengujian halaman profil pengguna.
 *
 * Seluruh thunk digantikan mock terkendali sehingga hasil tiap proses
 * (berhasil / gagal) dapat ditentukan per skenario, sementara dialog
 * SweetAlert2 pada `toolsHelper` digantikan mock agar dapat diperiksa.
 */
const actionMocks = vi.hoisted(() => ({
  asyncGetProfile: vi.fn(),
  asyncChangeProfile: vi.fn(),
  asyncChangeProfilePhoto: vi.fn(),
  asyncChangeProfilePassword: vi.fn(),
}));

vi.mock("@/features/users/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/users/states/action")>();

  /**
   * Menyalin action creator `pending` / `fulfilled` / `rejected` milik thunk
   * asli, karena `extraReducers` pada `reducer.ts` mendaftarkan ketiganya
   * melalui `builder.addCase`.
   */
  const keepThunkMeta = (
    real: { pending: unknown; fulfilled: unknown; rejected: unknown },
    mock: unknown,
  ) =>
    Object.assign(mock as object, {
      pending: real.pending,
      fulfilled: real.fulfilled,
      rejected: real.rejected,
    });

  return {
    ...actual,
    asyncGetProfile: keepThunkMeta(
      actual.asyncGetProfile,
      actionMocks.asyncGetProfile,
    ),
    asyncChangeProfile: keepThunkMeta(
      actual.asyncChangeProfile,
      actionMocks.asyncChangeProfile,
    ),
    asyncChangeProfilePhoto: keepThunkMeta(
      actual.asyncChangeProfilePhoto,
      actionMocks.asyncChangeProfilePhoto,
    ),
    asyncChangeProfilePassword: keepThunkMeta(
      actual.asyncChangeProfilePassword,
      actionMocks.asyncChangeProfilePassword,
    ),
  };
});

vi.mock("@/helpers/toolsHelper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/helpers/toolsHelper")>();

  return {
    ...actual,
    showSuccessDialog: vi.fn(),
    showErrorDialog: vi.fn(),
  };
});

const createObjectURLMock = vi.fn(() => "blob:mock-preview");
const revokeObjectURLMock = vi.fn();

/** Membuat objek pengguna lengkap untuk kebutuhan pengujian. */
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "Budi Santoso",
    email: "budi@example.com",
    email_verified_at: null,
    photo: null,
    created_at: "2024-10-05T03:07:00.000Z",
    updated_at: "2024-10-05T03:07:00.000Z",
    ...overrides,
  };
}

const profile = makeUser();
const updatedProfile = makeUser({
  name: "Budi Baru",
  email: "budi.baru@example.com",
});

/** State awal slice `users` yang dipakai seluruh skenario. */
function makePreloadedState(
  options: {
    profile?: User | null;
    isChangeProfile?: boolean;
    isChangeProfilePhoto?: boolean;
    isChangeProfilePassword?: boolean;
  } = {},
) {
  return {
    users: {
      users: [],
      user: null,
      profile: options.profile ?? null,
      isProfile: false,
      isChangeProfile: options.isChangeProfile ?? false,
      isChangeProfilePhoto: options.isChangeProfilePhoto ?? false,
      isChangeProfilePassword: options.isChangeProfilePassword ?? false,
    },
  };
}

/** Tombol submit pada masing-masing formulir. */
function getSaveProfileButton(): HTMLElement {
  return screen.getByRole("button", { name: /Simpan Profil/ });
}

function getUploadPhotoButton(): HTMLElement {
  return screen.getByRole("button", { name: /Unggah Foto/ });
}

function getPasswordField(label: string): HTMLElement {
  return screen.getByLabelText(label);
}

/**
 * Menyusun nilai kembalian thunk tiruan yang dapat di-`unwrap()`.
 *
 * `unwrap` sengaja dibuat non-enumerable agar middleware pemeriksa nilai
 * serializable milik Redux Toolkit tidak melaporkan peringatan ketika action
 * tiruan ini di-`dispatch`.
 */
function mockThunkResult<T>(
  type: string,
  unwrap: () => Promise<T>,
): { type: string; unwrap: () => Promise<T> } {
  return Object.defineProperty({ type }, "unwrap", {
    value: unwrap,
    enumerable: false,
  }) as { type: string; unwrap: () => Promise<T> };
}

beforeEach(() => {
  vi.clearAllMocks();

  createObjectURLMock.mockReset();
  createObjectURLMock.mockReturnValue("blob:mock-preview");
  revokeObjectURLMock.mockReset();

  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: createObjectURLMock,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: revokeObjectURLMock,
  });

  actionMocks.asyncGetProfile.mockReturnValue({
    type: "users/asyncGetProfile/mock",
  });
  actionMocks.asyncChangeProfile.mockReturnValue(
    mockThunkResult("users/asyncChangeProfile/mock", () =>
      Promise.resolve(updatedProfile),
    ),
  );
  actionMocks.asyncChangeProfilePhoto.mockReturnValue(
    mockThunkResult("users/asyncChangeProfilePhoto/mock", () =>
      Promise.resolve(updatedProfile),
    ),
  );
  actionMocks.asyncChangeProfilePassword.mockReturnValue(
    mockThunkResult("users/asyncChangeProfilePassword/mock", () =>
      Promise.resolve("Kata sandi berhasil diubah."),
    ),
  );
});

describe("ProfilePage", () => {
  describe("pemuatan profil", () => {
    it("menampilkan skeleton selama profil belum tersedia", () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState(),
      });

      expect(screen.getByLabelText("Memuat profil")).toBeInTheDocument();
      expect(actionMocks.asyncGetProfile).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole("button", { name: /Simpan Profil/ }),
      ).not.toBeInTheDocument();
    });

    it("mengisi kolom identitas dari data profil", () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      expect(screen.getByLabelText("Nama Lengkap")).toHaveValue(profile.name);
      expect(screen.getByLabelText("Email")).toHaveValue(profile.email);
    });

    it("menampilkan foto profil saat tersedia", () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({
          profile: makeUser({ photo: "img/profile/budi.png" }),
        }),
      });

      expect(
        screen.getByRole("img", { name: profile.name }),
      ).toBeInTheDocument();
    });

    it("menampilkan ikon fallback saat profil tidak memiliki foto", () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({
          profile: makeUser({ photo: null }),
        }),
      });

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("formulir identitas", () => {
    it("menolak submit dan menampilkan dialog kesalahan bila kolom kosong", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.clear(screen.getByLabelText("Nama Lengkap"));
      await user.click(getSaveProfileButton());

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Data belum lengkap",
          "Nama dan email wajib diisi.",
        ),
      );
      expect(actionMocks.asyncChangeProfile).not.toHaveBeenCalled();
      expect(showSuccessDialog).not.toHaveBeenCalled();
    });

    it("menyimpan identitas dan menampilkan dialog sukses", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.clear(screen.getByLabelText("Nama Lengkap"));
      await user.type(
        screen.getByLabelText("Nama Lengkap"),
        updatedProfile.name,
      );
      await user.clear(screen.getByLabelText("Email"));
      await user.type(
        screen.getByLabelText("Email"),
        updatedProfile.email,
      );
      await user.click(getSaveProfileButton());

      await waitFor(() =>
        expect(showSuccessDialog).toHaveBeenCalledWith(
          "Berhasil",
          "Profil berhasil diperbarui.",
        ),
      );
      expect(actionMocks.asyncChangeProfile).toHaveBeenCalledWith({
        name: updatedProfile.name,
        email: updatedProfile.email,
      });
    });

    it("menampilkan dialog kesalahan bila penyimpanan identitas gagal", async () => {
      const user = userEvent.setup();
      actionMocks.asyncChangeProfile.mockReturnValue(
        mockThunkResult("users/asyncChangeProfile/mock", () =>
          Promise.reject(new Error("gagal simpan")),
        ),
      );
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.click(getSaveProfileButton());

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Gagal memperbarui profil",
          "Error: gagal simpan",
        ),
      );
      expect(showSuccessDialog).not.toHaveBeenCalled();
    });
  });

  describe("formulir foto profil", () => {
    it("menampilkan dialog kesalahan bila submit tanpa berkas", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.click(getUploadPhotoButton());

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Belum ada berkas",
          "Pilih foto profil terlebih dahulu.",
        ),
      );
      expect(actionMocks.asyncChangeProfilePhoto).not.toHaveBeenCalled();
    });

    it("mengabaikan perubahan input tanpa berkas terpilih", () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      const input = screen.getByLabelText("Pilih foto profil");

      fireEvent.change(input, { target: { files: null } });
      fireEvent.change(input, { target: { files: [] } });

      expect(createObjectURLMock).not.toHaveBeenCalled();
      expect(showErrorDialog).not.toHaveBeenCalled();
    });

    it("menampilkan pratinjau dan mengunggah berkas gambar", async () => {
      const user = userEvent.setup();
      const photo = new File(["isi-foto"], "foto.png", { type: "image/png" });
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.upload(screen.getByLabelText("Pilih foto profil"), photo);

      expect(createObjectURLMock).toHaveBeenCalledWith(photo);
      expect(
        screen.getByAltText("Pratinjau foto profil"),
      ).toBeInTheDocument();

      await user.click(getUploadPhotoButton());

      await waitFor(() =>
        expect(showSuccessDialog).toHaveBeenCalledWith(
          "Berhasil",
          "Foto profil berhasil diperbarui.",
        ),
      );
      expect(actionMocks.asyncChangeProfilePhoto).toHaveBeenCalledWith(photo);
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-preview");
      await waitFor(() =>
        expect(
          screen.queryByAltText("Pratinjau foto profil"),
        ).not.toBeInTheDocument(),
      );
    });

    it("mengunggah foto meski pratinjau tidak terbentuk", async () => {
      const user = userEvent.setup();
      const photo = new File(["isi-foto"], "foto.png", { type: "image/png" });
      createObjectURLMock.mockReturnValueOnce("");
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.upload(screen.getByLabelText("Pilih foto profil"), photo);

      expect(
        screen.queryByAltText("Pratinjau foto profil"),
      ).not.toBeInTheDocument();

      await user.click(getUploadPhotoButton());

      await waitFor(() =>
        expect(showSuccessDialog).toHaveBeenCalledWith(
          "Berhasil",
          "Foto profil berhasil diperbarui.",
        ),
      );
      expect(actionMocks.asyncChangeProfilePhoto).toHaveBeenCalledWith(photo);
      expect(revokeObjectURLMock).not.toHaveBeenCalled();
    });

    it("menolak berkas non-gambar dan tidak memakainya", async () => {
      const user = userEvent.setup({ applyAccept: false });
      const document_ = new File(["catatan"], "catatan.txt", {
        type: "text/plain",
      });
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.upload(
        screen.getByLabelText("Pilih foto profil"),
        document_,
      );

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Berkas tidak didukung",
          "Pilih berkas gambar (JPG, PNG, atau WEBP).",
        ),
      );
      expect(createObjectURLMock).not.toHaveBeenCalled();
      expect(
        screen.queryByAltText("Pratinjau foto profil"),
      ).not.toBeInTheDocument();

      await user.click(getUploadPhotoButton());

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Belum ada berkas",
          "Pilih foto profil terlebih dahulu.",
        ),
      );
      expect(actionMocks.asyncChangeProfilePhoto).not.toHaveBeenCalled();
    });

    it("menampilkan dialog kesalahan bila unggah foto gagal", async () => {
      const user = userEvent.setup();
      const photo = new File(["isi-foto"], "foto.png", { type: "image/png" });
      actionMocks.asyncChangeProfilePhoto.mockReturnValue(
        mockThunkResult("users/asyncChangeProfilePhoto/mock", () =>
          Promise.reject(new Error("gagal unggah")),
        ),
      );
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.upload(screen.getByLabelText("Pilih foto profil"), photo);
      await user.click(getUploadPhotoButton());

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Gagal mengunggah foto",
          "Error: gagal unggah",
        ),
      );
      expect(showSuccessDialog).not.toHaveBeenCalled();
      expect(revokeObjectURLMock).not.toHaveBeenCalled();
    });
  });

  describe("formulir kata sandi", () => {
    it("menampilkan dialog kesalahan bila kolom kata sandi kosong", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.click(
        screen.getByRole("button", { name: "Ubah Kata Sandi" }),
      );

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Data belum lengkap",
          "Semua kolom kata sandi wajib diisi.",
        ),
      );
      expect(actionMocks.asyncChangeProfilePassword).not.toHaveBeenCalled();
    });

    it("menampilkan dialog kesalahan bila konfirmasi tidak cocok", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.type(
        getPasswordField("Kata Sandi Saat Ini"),
        "lama123",
      );
      await user.type(getPasswordField("Kata Sandi Baru"), "baru123");
      await user.type(getPasswordField("Konfirmasi"), "beda123");
      await user.click(
        screen.getByRole("button", { name: "Ubah Kata Sandi" }),
      );

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Konfirmasi tidak cocok",
          "Konfirmasi kata sandi baru tidak sama.",
        ),
      );
      expect(actionMocks.asyncChangeProfilePassword).not.toHaveBeenCalled();
    });

    it("menampilkan dialog kesalahan bila kata sandi baru terlalu pendek", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.type(
        getPasswordField("Kata Sandi Saat Ini"),
        "lama123",
      );
      await user.type(getPasswordField("Kata Sandi Baru"), "abc");
      await user.type(getPasswordField("Konfirmasi"), "abc");
      await user.click(
        screen.getByRole("button", { name: "Ubah Kata Sandi" }),
      );

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Kata sandi terlalu pendek",
          `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
        ),
      );
      expect(MIN_PASSWORD_LENGTH).toBeGreaterThan(3);
      expect(actionMocks.asyncChangeProfilePassword).not.toHaveBeenCalled();
    });

    it("mengubah kata sandi, menampilkan dialog sukses, dan mengosongkan kolom", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.type(
        getPasswordField("Kata Sandi Saat Ini"),
        "lama123",
      );
      await user.type(getPasswordField("Kata Sandi Baru"), "baru123");
      await user.type(getPasswordField("Konfirmasi"), "baru123");
      await user.click(
        screen.getByRole("button", { name: "Ubah Kata Sandi" }),
      );

      await waitFor(() =>
        expect(showSuccessDialog).toHaveBeenCalledWith(
          "Berhasil",
          "Kata sandi berhasil diubah.",
        ),
      );
      expect(actionMocks.asyncChangeProfilePassword).toHaveBeenCalledWith({
        password: "lama123",
        new_password: "baru123",
        new_password_confirmation: "baru123",
      });

      await waitFor(() => {
        expect(getPasswordField("Kata Sandi Saat Ini")).toHaveValue("");
        expect(getPasswordField("Kata Sandi Baru")).toHaveValue("");
        expect(getPasswordField("Konfirmasi")).toHaveValue("");
      });
    });

    it("menampilkan dialog kesalahan bila perubahan kata sandi gagal", async () => {
      const user = userEvent.setup();
      actionMocks.asyncChangeProfilePassword.mockReturnValue(
        mockThunkResult("users/asyncChangeProfilePassword/mock", () =>
          Promise.reject(new Error("sandi lama salah")),
        ),
      );
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({ profile }),
      });

      await user.type(
        getPasswordField("Kata Sandi Saat Ini"),
        "lama123",
      );
      await user.type(getPasswordField("Kata Sandi Baru"), "baru123");
      await user.type(getPasswordField("Konfirmasi"), "baru123");
      await user.click(
        screen.getByRole("button", { name: "Ubah Kata Sandi" }),
      );

      await waitFor(() =>
        expect(showErrorDialog).toHaveBeenCalledWith(
          "Gagal mengubah kata sandi",
          "Error: sandi lama salah",
        ),
      );
      expect(showSuccessDialog).not.toHaveBeenCalled();
    });
  });

  describe("penanda proses berjalan", () => {
    it("menonaktifkan tombol identitas dan mengubah labelnya", () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({
          profile,
          isChangeProfile: true,
        }),
      });

      const button = screen.getByRole("button", { name: /Menyimpan/ });

      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Menyimpan...");
    });

    it("menonaktifkan tombol unggah foto dan mengubah labelnya", () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({
          profile,
          isChangeProfilePhoto: true,
        }),
      });

      const button = screen.getByRole("button", { name: /Mengunggah/ });

      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Mengunggah...");
    });

    it("menonaktifkan tombol kata sandi dan mengubah labelnya", () => {
      renderWithProviders(<ProfilePage />, {
        preloadedState: makePreloadedState({
          profile,
          isChangeProfilePassword: true,
        }),
      });

      const button = screen.getByRole("button", { name: /Menyimpan/ });

      expect(button).toBeDisabled();
      expect(button).toHaveTextContent("Menyimpan...");
    });
  });
});
