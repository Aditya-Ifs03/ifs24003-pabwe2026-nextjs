import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthLoginData } from "@/features/auth/api/authApi";
import { asyncLogin } from "@/features/auth/states/action";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import { navigationMock, renderWithProviders } from "@/test-utils";
import type { User } from "@/types";

import LoginPage from "./LoginPage";

/**
 * Pengujian halaman login.
 *
 * Thunk `asyncLogin` dan helper dialog dimock agar seluruh cabang validasi,
 * keberhasilan, serta kegagalan dapat diuji tanpa jaringan.
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

  const asyncLoginMock = vi.fn();

  // `reducer.ts` membaca `pending`/`fulfilled`/`rejected` saat slice dibuat,
  // sehingga sub-action creator asli harus tetap dipertahankan.
  Object.assign(asyncLoginMock, {
    pending: actual.asyncLogin.pending,
    fulfilled: actual.asyncLogin.fulfilled,
    rejected: actual.asyncLogin.rejected,
  });

  return { ...actual, asyncLogin: asyncLoginMock };
});

const asyncLoginMock = vi.mocked(asyncLogin);

/** Pengguna contoh untuk payload sukses login. */
const user: User = {
  id: 1,
  name: "Siti Aminah",
  email: "siti@example.com",
  email_verified_at: null,
  photo: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const loginData: AuthLoginData = { user, token: "token-abc" };

/**
 * Mengatur thunk login tiruan.
 *
 * Nilai kembalian `dispatch` pada pemakaian nyata adalah promise ber-`unwrap()`
 * dari thunk middleware, sehingga mock mengembalikan sebuah fungsi thunk yang
 * menghasilkan objek `{ unwrap }` — bukan action biasa — agar tidak memicu
 * peringatan "non-serializable value" dari Redux.
 */
function mockLoginThunk(unwrap: () => Promise<AuthLoginData>): void {
  asyncLoginMock.mockReturnValue((() => ({ unwrap })) as never);
}

/** Mengatur thunk login agar mengembalikan hasil sukses. */
function mockLoginSuccess(): void {
  mockLoginThunk(vi.fn().mockResolvedValue(loginData));
}

/** Mengatur thunk login agar menolak dengan pesan tertentu. */
function mockLoginFailure(message: string): void {
  mockLoginThunk(vi.fn().mockRejectedValue(message));
}

beforeEach(() => {
  asyncLoginMock.mockClear();
  vi.mocked(showErrorDialog).mockClear();
  vi.mocked(showSuccessDialog).mockClear();
});

describe("LoginPage", () => {
  it("menampilkan dialog error dan tidak memanggil thunk saat kolom kosong", async () => {
    const userEventApi = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await userEventApi.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith(
        "Data belum lengkap",
        "Email dan kata sandi wajib diisi.",
      ),
    );
    expect(asyncLoginMock).not.toHaveBeenCalled();
    expect(navigationMock.replace).not.toHaveBeenCalled();
  });

  it("menampilkan dialog sukses lalu mengalihkan ke dashboard saat login berhasil", async () => {
    mockLoginSuccess();
    const userEventApi = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await userEventApi.type(screen.getByLabelText("Email"), "siti@example.com");
    await userEventApi.type(screen.getByLabelText("Kata Sandi"), "rahasia123");
    await userEventApi.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() =>
      expect(showSuccessDialog).toHaveBeenCalledWith(
        "Berhasil masuk",
        "Selamat datang kembali di Delcom Postingan!",
      ),
    );
    expect(asyncLoginMock).toHaveBeenCalledWith({
      email: "siti@example.com",
      password: "rahasia123",
    });
    expect(navigationMock.replace).toHaveBeenCalledWith("/");
    expect(showErrorDialog).not.toHaveBeenCalled();
  });

  it("menampilkan dialog error berisi pesan thunk saat login gagal", async () => {
    mockLoginFailure("Email atau kata sandi salah");
    const userEventApi = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await userEventApi.type(screen.getByLabelText("Email"), "siti@example.com");
    await userEventApi.type(screen.getByLabelText("Kata Sandi"), "rahasia123");
    await userEventApi.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() =>
      expect(showErrorDialog).toHaveBeenCalledWith(
        "Gagal masuk",
        "Email atau kata sandi salah",
      ),
    );
    expect(showSuccessDialog).not.toHaveBeenCalled();
    expect(navigationMock.replace).not.toHaveBeenCalled();
  });

  it("menonaktifkan tombol dan menampilkan status proses saat isAuthLogin true", () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: { isAuthLogin: true, isAuthRegister: false, isAuthLogout: false },
      },
    });

    const submitButton = screen.getByRole("button", { name: "Memproses..." });

    expect(submitButton).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Masuk" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Daftar sekarang" })).toHaveAttribute(
      "href",
      "/auth/register",
    );
  });
});
