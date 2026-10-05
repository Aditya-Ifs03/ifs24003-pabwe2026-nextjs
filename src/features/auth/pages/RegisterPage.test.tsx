import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { asyncRegister } from "@/features/auth/states/action";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import { navigationMock, renderWithProviders } from "@/test-utils";

import RegisterPage, { MIN_PASSWORD_LENGTH } from "./RegisterPage";

/**
 * Pengujian halaman pendaftaran.
 *
 * Thunk `asyncRegister` dan helper dialog dimock agar cabang validasi
 * kelengkapan data, panjang kata sandi, keberhasilan, dan kegagalan teruji.
 */
vi.mock("@/helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/helpers/toolsHelper")>();

  return {
    ...actual,
    showSuccessDialog: vi.fn(),
    showErrorDialog: vi.fn(),
    showWarningDialog: vi.fn(),
    showConfirmDialog: vi.fn(),
  };
});

vi.mock("@/features/auth/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/states/action")>();

  const asyncRegisterMock = vi.fn();

  // `reducer.ts` membaca `pending`/`fulfilled`/`rejected` saat slice dibuat,
  // sehingga sub-action creator asli harus tetap dipertahankan.
  Object.assign(asyncRegisterMock, {
    pending: actual.asyncRegister.pending,
    fulfilled: actual.asyncRegister.fulfilled,
    rejected: actual.asyncRegister.rejected,
  });

  return { ...actual, asyncRegister: asyncRegisterMock };
});

const asyncRegisterMock = vi.mocked(asyncRegister);

/**
 * Mengatur thunk pendaftaran tiruan.
 *
 * Nilai kembalian `dispatch` pada pemakaian nyata adalah promise ber-`unwrap()`
 * dari thunk middleware, sehingga mock mengembalikan sebuah fungsi thunk yang
 * menghasilkan objek `{ unwrap }` — bukan action biasa — agar tidak memicu
 * peringatan "non-serializable value" dari Redux.
 */
function mockRegisterThunk(unwrap: () => Promise<string>): void {
  asyncRegisterMock.mockReturnValue((() => ({ unwrap })) as never);
}

/** Mengatur thunk pendaftaran agar mengembalikan hasil sukses. */
function mockRegisterSuccess(): void {
  mockRegisterThunk(vi.fn().mockResolvedValue("Pendaftaran berhasil"));
}

/** Mengatur thunk pendaftaran agar menolak dengan pesan tertentu. */
function mockRegisterFailure(message: string): void {
  mockRegisterThunk(vi.fn().mockRejectedValue(message));
}

/** Mengisi seluruh kolom formulir pendaftaran. */
async function fillForm(
  userEventApi: ReturnType<typeof userEvent.setup>,
  password: string,
): Promise<void> {
  await userEventApi.type(screen.getByLabelText("Nama Lengkap"), "Siti Aminah");
  await userEventApi.type(screen.getByLabelText("Email"), "siti@example.com");
  await userEventApi.type(screen.getByLabelText("Kata Sandi"), password);
}

beforeEach(() => {
  asyncRegisterMock.mockClear();
  vi.mocked(showErrorDialog).mockClear();
  vi.mocked(showSuccessDialog).mockClear();
});

describe("RegisterPage", () => {
  it("menampilkan dialog error dan tidak memanggil thunk saat kolom kosong", async () => {
    const userEventApi = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await userEventApi.click(screen.getByRole("button", { name: "Daftar" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith(
        "Data belum lengkap",
        "Nama, email, dan kata sandi wajib diisi.",
      ),
    );
    expect(asyncRegisterMock).not.toHaveBeenCalled();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("menolak kata sandi yang lebih pendek dari batas minimum", async () => {
    const userEventApi = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await fillForm(userEventApi, "12345");
    await userEventApi.click(screen.getByRole("button", { name: "Daftar" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith(
        "Kata sandi terlalu pendek",
        `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
      ),
    );
    expect(asyncRegisterMock).not.toHaveBeenCalled();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("menampilkan dialog sukses lalu mengarahkan ke halaman login", async () => {
    mockRegisterSuccess();
    const userEventApi = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await fillForm(userEventApi, "rahasia123");
    await userEventApi.click(screen.getByRole("button", { name: "Daftar" }));

    await waitFor(() =>
      expect(showSuccessDialog).toHaveBeenCalledWith(
        "Pendaftaran berhasil",
        "Akun Anda sudah dibuat. Silakan masuk.",
      ),
    );
    expect(asyncRegisterMock).toHaveBeenCalledWith({
      name: "Siti Aminah",
      email: "siti@example.com",
      password: "rahasia123",
    });
    expect(navigationMock.push).toHaveBeenCalledWith("/auth/login");
    expect(showErrorDialog).not.toHaveBeenCalled();
  });

  it("menampilkan dialog error berisi pesan thunk saat pendaftaran gagal", async () => {
    mockRegisterFailure("Email sudah terdaftar");
    const userEventApi = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await fillForm(userEventApi, "rahasia123");
    await userEventApi.click(screen.getByRole("button", { name: "Daftar" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith(
        "Pendaftaran gagal",
        "Email sudah terdaftar",
      ),
    );
    expect(showSuccessDialog).not.toHaveBeenCalled();
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("menonaktifkan tombol dan menampilkan status proses saat isAuthRegister true", () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: {
        auth: { isAuthLogin: false, isAuthRegister: true, isAuthLogout: false },
      },
    });

    const submitButton = screen.getByRole("button", { name: "Memproses..." });

    expect(submitButton).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Daftar" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Masuk di sini" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });
});
