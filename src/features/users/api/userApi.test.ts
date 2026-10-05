import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELCOM_BASEURL } from "@/lib/config";
import type { ApiResult, User } from "@/types";

import {
  CHANGE_PASSWORD_ENDPOINT,
  changeMyPassword,
  getAllUsers,
  getMyProfile,
  updateMyPhoto,
  updateMyProfile,
} from "./userApi";

/**
 * Pengujian modul `userApi`.
 *
 * Lapisan jaringan (`globalThis.fetch`) di-stub sehingga `userApi` diuji
 * bersama `apiFetch` yang sesungguhnya: endpoint, metode HTTP, header, dan body
 * yang benar-benar dikirim ke server.
 *
 * Catatan: pendekatan ini dipilih agar penyusunan URL oleh `buildUrl`, header
 * `Accept`/`Content-Type`, dan penulisan body JSON maupun `FormData` ikut
 * terverifikasi, bukan hanya argumen pemanggilan `apiFetch`.
 */
const fetchMock = vi.fn();

/** Basis URL tanpa sufiks garis miring, sama seperti `buildUrl`. */
const BASE_URL = DELCOM_BASEURL.replace(/\/+$/, "");

/** Membuat respons `fetch` tiruan yang mengembalikan `ApiResult` tertentu. */
function mockFetchResult<T>(result: ApiResult<T>): void {
  fetchMock.mockResolvedValue({ json: async () => result });
}

/** Mengambil URL dan opsi dari pemanggilan `fetch` pertama. */
function firstFetchCall(): [string, RequestInit] {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

  return [url, init];
}

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

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("userApi", () => {
  describe("CHANGE_PASSWORD_ENDPOINT", () => {
    it("memakai jalur /users/password sesuai dokumentasi resmi API", () => {
      expect(CHANGE_PASSWORD_ENDPOINT).toBe("/users/password");
    });
  });

  describe("getAllUsers", () => {
    it("memanggil GET /users dan meneruskan hasilnya", async () => {
      const expected: ApiResult<{ users: User[] }> = {
        status: "success",
        message: "OK",
        data: { users: [makeUser(), makeUser({ id: 2, name: "Siti Aminah" })] },
      };
      mockFetchResult(expected);

      await expect(getAllUsers()).resolves.toEqual(expected);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = firstFetchCall();
      expect(url).toBe(`${BASE_URL}/users`);
      expect(init.method).toBe("GET");
      expect(init.body).toBeUndefined();
      expect(init.headers).toMatchObject({ Accept: "application/json" });
    });
  });

  describe("getMyProfile", () => {
    it("memanggil GET /users/me dan meneruskan hasilnya", async () => {
      const expected: ApiResult<{ user: User }> = {
        status: "success",
        message: "OK",
        data: { user: makeUser() },
      };
      mockFetchResult(expected);

      await expect(getMyProfile()).resolves.toEqual(expected);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = firstFetchCall();
      expect(url).toBe(`${BASE_URL}/users/me`);
      expect(init.method).toBe("GET");
    });
  });

  describe("updateMyProfile", () => {
    it("memanggil PUT /users/me dengan body JSON nama dan email", async () => {
      const payload = { name: "Budi Baru", email: "budi.baru@example.com" };
      const expected: ApiResult<{ user: User }> = {
        status: "success",
        message: "OK",
        data: { user: makeUser(payload) },
      };
      mockFetchResult(expected);

      await expect(updateMyProfile(payload)).resolves.toEqual(expected);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = firstFetchCall();
      expect(url).toBe(`${BASE_URL}/users/me`);
      expect(init.method).toBe("PUT");
      expect(JSON.parse(String(init.body))).toEqual(payload);
      expect(init.headers).toMatchObject({
        "Content-Type": "application/json",
      });
    });
  });

  describe("updateMyPhoto", () => {
    it("mengirim berkas foto sebagai multipart ke POST /users/me/photo", async () => {
      const photo = new File(["isi-foto"], "foto.png", { type: "image/png" });
      const expected: ApiResult<{ user: User }> = {
        status: "success",
        message: "OK",
        data: { user: makeUser({ photo: "img/profile/foto.png" }) },
      };
      mockFetchResult(expected);

      await expect(updateMyPhoto(photo)).resolves.toEqual(expected);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = firstFetchCall();
      expect(url).toBe(`${BASE_URL}/users/me/photo`);
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(FormData);
      // Content-Type sengaja tidak diset agar browser menuliskan boundary.
      expect(init.headers).not.toHaveProperty("Content-Type");
      expect((init.body as FormData).get("photo")).toBe(photo);
    });
  });

  describe("changeMyPassword", () => {
    it("memanggil PUT /users/password dengan payload kata sandi", async () => {
      const payload = {
        password: "lama123",
        new_password: "baru123",
        new_password_confirmation: "baru123",
      };
      const expected: ApiResult = {
        status: "success",
        message: "Kata sandi berhasil diubah.",
      };
      mockFetchResult(expected);

      await expect(changeMyPassword(payload)).resolves.toEqual(expected);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = firstFetchCall();
      expect(url).toBe(`${BASE_URL}${CHANGE_PASSWORD_ENDPOINT}`);
      expect(init.method).toBe("PUT");
      expect(JSON.parse(String(init.body))).toEqual(payload);
    });
  });
});
