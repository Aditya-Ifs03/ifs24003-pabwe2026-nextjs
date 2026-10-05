import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_KEY, buildUrl } from "@/helpers/apiHelper";
import type { User } from "@/types";
import type { AuthLoginRequest, AuthRegisterRequest } from "@/types/action";
import { makeStore } from "@/test-utils";

import type { AuthLoginData } from "../api/authApi";
import {
  asyncLogin,
  asyncLogout,
  asyncRegister,
  setAuthLogin,
  setAuthLogout,
  setAuthRegister,
} from "./action";

/**
 * Pengujian action creator dan async thunk fitur autentikasi.
 *
 * Thunk dijalankan melalui `store.dispatch` yang sesungguhnya, sedangkan
 * lapisan jaringan (`globalThis.fetch`) di-stub. Dengan begitu setiap cabang
 * thunk (berhasil, gagal karena status, dan gagal karena data tidak ada) teruji
 * bersama efek nyata `putAccessToken` pada `localStorage`.
 *
 * Catatan: memock modul `@/features/auth/api/authApi` maupun
 * `@/helpers/apiHelper` tidak berpengaruh di sini karena `action.ts` sudah
 * ter-instansiasi lebih dulu melalui rantai `setupTests` → `test-utils` →
 * reducer → action, sehingga binding aslinya bertahan.
 */

const fetchMock = vi.fn();

/** Membuat respons `fetch` tiruan yang mengembalikan `ApiResult` tertentu. */
function mockFetchResult(result: unknown): void {
  fetchMock.mockResolvedValue({ json: async () => result });
}

/** Mengambil URL dan opsi dari pemanggilan `fetch` pertama. */
function firstFetchCall(): [string, RequestInit] {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

  return [url, init];
}

/** Pengguna contoh untuk payload login. */
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

const loginRequest: AuthLoginRequest = {
  email: "siti@example.com",
  password: "rahasia123",
};

const registerRequest: AuthRegisterRequest = {
  name: "Siti Aminah",
  email: "siti@example.com",
  password: "rahasia123",
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("action creator sinkron", () => {
  it("setAuthLogin membawa payload boolean", () => {
    const action = setAuthLogin(true);

    expect(action.type).toBe("auth/setAuthLogin");
    expect(action.payload).toBe(true);
    expect(setAuthLogin(false).payload).toBe(false);
  });

  it("setAuthRegister membawa payload boolean", () => {
    const action = setAuthRegister(true);

    expect(action.type).toBe("auth/setAuthRegister");
    expect(action.payload).toBe(true);
    expect(setAuthRegister(false).payload).toBe(false);
  });

  it("setAuthLogout membawa payload boolean", () => {
    const action = setAuthLogout(true);

    expect(action.type).toBe("auth/setAuthLogout");
    expect(action.payload).toBe(true);
    expect(setAuthLogout(false).payload).toBe(false);
  });
});

describe("asyncLogin", () => {
  it("menyimpan token dan mengembalikan data saat status success", async () => {
    mockFetchResult({
      status: "success",
      message: "Login berhasil",
      data: loginData,
    });
    const store = makeStore({
      auth: { isAuthLogin: true, isAuthRegister: false, isAuthLogout: false },
    });

    const action = await store.dispatch(asyncLogin(loginRequest));

    expect(action.type).toBe("auth/asyncLogin/fulfilled");
    expect(action.payload).toEqual(loginData);
    // Efek `putAccessToken`: token tersimpan sehingga permintaan berikutnya terautentikasi.
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("token-abc");

    const [url, init] = firstFetchCall();
    expect(url).toBe(buildUrl("/auth/login"));
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(loginRequest));

    expect(store.getState().auth.isAuthLogin).toBe(false);
  });

  it("menolak dengan pesan API saat status fail", async () => {
    mockFetchResult({
      status: "fail",
      message: "Email atau kata sandi salah",
    });
    const store = makeStore({
      auth: { isAuthLogin: true, isAuthRegister: false, isAuthLogout: false },
    });

    const action = await store.dispatch(asyncLogin(loginRequest));

    expect(action.type).toBe("auth/asyncLogin/rejected");
    expect(action.payload).toBe("Email atau kata sandi salah");
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(store.getState().auth.isAuthLogin).toBe(false);
  });

  it("menolak dengan pesan API saat status success tanpa data", async () => {
    mockFetchResult({
      status: "success",
      message: "Data pengguna tidak ditemukan",
    });
    const store = makeStore({
      auth: { isAuthLogin: true, isAuthRegister: false, isAuthLogout: false },
    });

    const action = await store.dispatch(asyncLogin(loginRequest));

    expect(action.type).toBe("auth/asyncLogin/rejected");
    expect(action.payload).toBe("Data pengguna tidak ditemukan");
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });
});

describe("asyncRegister", () => {
  it("mengembalikan pesan sukses saat pendaftaran berhasil", async () => {
    mockFetchResult({ status: "success", message: "Pendaftaran berhasil" });
    const store = makeStore({
      auth: { isAuthLogin: false, isAuthRegister: true, isAuthLogout: false },
    });

    const action = await store.dispatch(asyncRegister(registerRequest));

    expect(action.type).toBe("auth/asyncRegister/fulfilled");
    expect(action.payload).toBe("Pendaftaran berhasil");

    const [url, init] = firstFetchCall();
    expect(url).toBe(buildUrl("/auth/register"));
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(registerRequest));

    expect(store.getState().auth.isAuthRegister).toBe(false);
  });

  it("menolak dengan pesan API saat pendaftaran gagal", async () => {
    mockFetchResult({ status: "fail", message: "Email sudah terdaftar" });
    const store = makeStore({
      auth: { isAuthLogin: false, isAuthRegister: true, isAuthLogout: false },
    });

    const action = await store.dispatch(asyncRegister(registerRequest));

    expect(action.type).toBe("auth/asyncRegister/rejected");
    expect(action.payload).toBe("Email sudah terdaftar");
    expect(store.getState().auth.isAuthRegister).toBe(false);
  });
});

describe("asyncLogout", () => {
  it("menghapus token dan mengembalikan pesan server saat berhasil", async () => {
    mockFetchResult({ status: "success", message: "Berhasil keluar" });
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "token-abc");
    const store = makeStore({
      auth: { isAuthLogin: false, isAuthRegister: false, isAuthLogout: true },
    });

    const action = await store.dispatch(asyncLogout());

    expect(action.type).toBe("auth/asyncLogout/fulfilled");
    expect(action.payload).toBe("Berhasil keluar");
    // Efek `putAccessToken(null)`: token dicabut dari penyimpanan lokal.
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();

    const [url, init] = firstFetchCall();
    const headers = init.headers as Record<string, string>;
    expect(url).toBe(buildUrl("/auth/logout"));
    expect(init.method).toBe("POST");
    expect(headers.Authorization).toBe("Bearer token-abc");

    expect(store.getState().auth.isAuthLogout).toBe(false);
  });

  it("menolak dengan pesan API dan mempertahankan token saat logout gagal", async () => {
    mockFetchResult({ status: "fail", message: "Gagal mencabut sesi" });
    window.localStorage.setItem(ACCESS_TOKEN_KEY, "token-abc");
    const store = makeStore({
      auth: { isAuthLogin: false, isAuthRegister: false, isAuthLogout: true },
    });

    const action = await store.dispatch(asyncLogout());

    expect(action.type).toBe("auth/asyncLogout/rejected");
    expect(action.payload).toBe("Gagal mencabut sesi");
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("token-abc");
    expect(store.getState().auth.isAuthLogout).toBe(false);
  });
});
