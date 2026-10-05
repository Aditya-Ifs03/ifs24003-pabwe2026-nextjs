import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_KEY, buildUrl } from "@/helpers/apiHelper";
import type { ApiResult, User } from "@/types";
import type { AuthLoginRequest, AuthRegisterRequest } from "@/types/action";

import { login, logout, register, type AuthLoginData } from "./authApi";

/**
 * Pengujian modul API autentikasi.
 *
 * Lapisan jaringan (`globalThis.fetch`) di-stub sehingga berkas ini menguji
 * `authApi` sekaligus `apiFetch` secara nyata: endpoint, method, header
 * `Authorization` (atau ketiadaannya saat `skipAuth`), dan body JSON.
 *
 * Catatan: memock modul `@/helpers/apiHelper` tidak berpengaruh di sini karena
 * `authApi.ts` sudah ter-instansiasi lebih dulu melalui rantai `setupTests` →
 * `test-utils` → reducer → action → authApi, sehingga binding aslinya bertahan.
 */

const fetchMock = vi.fn();

/** Membuat respons `fetch` tiruan yang mengembalikan `ApiResult` tertentu. */
function mockFetchResult<T>(result: ApiResult<T>): void {
  fetchMock.mockResolvedValue({ json: async () => result });
}

/** Pengguna contoh yang dipakai pada payload sukses login. */
const user: User = {
  id: 1,
  name: "Siti Aminah",
  email: "siti@example.com",
  email_verified_at: null,
  photo: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

/** Payload kredensial login yang dipakai berulang. */
const loginPayload: AuthLoginRequest = {
  email: "siti@example.com",
  password: "rahasia123",
};

/** Payload pendaftaran akun yang dipakai berulang. */
const registerPayload: AuthRegisterRequest = {
  name: "Siti Aminah",
  email: "siti@example.com",
  password: "rahasia123",
};

/** Data sukses login (user + token). */
const loginData: AuthLoginData = { user, token: "token-abc" };

/** Mengambil URL dan opsi dari pemanggilan `fetch` pertama. */
function firstFetchCall(): [string, RequestInit] {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

  return [url, init];
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authApi.login", () => {
  it("mengirim kredensial ke POST /auth/login tanpa header Authorization", async () => {
    const response: ApiResult<AuthLoginData> = {
      status: "success",
      message: "Login berhasil",
      data: loginData,
    };
    mockFetchResult(response);
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "token-lama");

    const result = await login(loginPayload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = firstFetchCall();
    const headers = init.headers as Record<string, string>;

    expect(url).toBe(buildUrl("/auth/login"));
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(loginPayload));
    expect(headers["Content-Type"]).toBe("application/json");
    // `skipAuth: true` membuat token lama tidak ikut dikirim.
    expect(headers.Authorization).toBeUndefined();
    expect(result).toEqual(response);
  });

  it("meneruskan respons gagal dari API apa adanya", async () => {
    const response: ApiResult<AuthLoginData> = {
      status: "fail",
      message: "Email atau kata sandi salah",
    };
    mockFetchResult(response);

    await expect(login(loginPayload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("authApi.register", () => {
  it("mengirim data pendaftaran ke POST /auth/register tanpa header Authorization", async () => {
    const response: ApiResult = {
      status: "success",
      message: "Pendaftaran berhasil",
    };
    mockFetchResult(response);

    const result = await register(registerPayload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = firstFetchCall();
    const headers = init.headers as Record<string, string>;

    expect(url).toBe(buildUrl("/auth/register"));
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(registerPayload));
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.Authorization).toBeUndefined();
    expect(result).toEqual(response);
  });

  it("meneruskan respons gagal dari API apa adanya", async () => {
    const response: ApiResult = {
      status: "fail",
      message: "Email sudah terdaftar",
    };
    mockFetchResult(response);

    await expect(register(registerPayload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("authApi.logout", () => {
  it("memanggil POST /auth/logout dengan bearer token dan tanpa body", async () => {
    const response: ApiResult = {
      status: "success",
      message: "Berhasil keluar",
    };
    mockFetchResult(response);
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "token-abc");

    const result = await logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = firstFetchCall();
    const headers = init.headers as Record<string, string>;

    expect(url).toBe(buildUrl("/auth/logout"));
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    // Tanpa `skipAuth`, token aktif wajib disertakan agar sesi dapat dicabut.
    expect(headers.Authorization).toBe("Bearer token-abc");
    expect(result).toEqual(response);
  });

  it("meneruskan respons gagal dari API apa adanya", async () => {
    const response: ApiResult = {
      status: "fail",
      message: "Sesi tidak valid",
    };
    mockFetchResult(response);

    await expect(logout()).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan status fail saat koneksi gagal", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(logout()).resolves.toEqual({
      status: "fail",
      message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
    });
  });
});
