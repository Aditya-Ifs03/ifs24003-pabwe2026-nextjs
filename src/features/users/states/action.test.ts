import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CHANGE_PASSWORD_ENDPOINT } from "@/features/users/api/userApi";
import {
  asyncChangeProfile,
  asyncChangeProfilePassword,
  asyncChangeProfilePhoto,
  asyncGetAllUsers,
  asyncGetProfile,
  setIsChangeProfile,
  setIsChangeProfilePassword,
  setIsChangeProfilePhoto,
  setIsProfile,
} from "@/features/users/states/action";
import { DELCOM_BASEURL } from "@/lib/config";
import { makeStore } from "@/test-utils";
import type { ApiResult, User } from "@/types";

/**
 * Pengujian seluruh async thunk dan action creator pada slice `users`.
 *
 * Setiap cabang thunk diuji: berhasil, ditolak karena status `fail`, dan
 * ditolak karena `data` tidak disertakan respons.
 *
 * Catatan: lapisan jaringan (`globalThis.fetch`) yang di-stub sehingga thunk
 * tetap diuji bersama `userApi` dan `apiFetch` yang sesungguhnya — termasuk
 * urutan pemanggilan `updateMyPhoto` lalu `getMyProfile` pada
 * `asyncChangeProfilePhoto`.
 */
const fetchMock = vi.fn();

/** Basis URL tanpa sufiks garis miring, sama seperti `buildUrl`. */
const BASE_URL = DELCOM_BASEURL.replace(/\/+$/, "");

/** Membuat respons `fetch` tiruan yang selalu mengembalikan `ApiResult` sama. */
function mockFetchResult<T>(result: ApiResult<T>): void {
  fetchMock.mockResolvedValue({ json: async () => result });
}

/** Membuat respons `fetch` tiruan sekali pakai (untuk urutan pemanggilan). */
function mockFetchResultOnce<T>(result: ApiResult<T>): void {
  fetchMock.mockResolvedValueOnce({ json: async () => result });
}

/** Mengambil URL dan opsi dari pemanggilan `fetch` ke-`index`. */
function fetchCall(index: number): [string, RequestInit] {
  return fetchMock.mock.calls[index] as [string, RequestInit];
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

const budi = makeUser();
const siti = makeUser({ id: 2, name: "Siti Aminah", email: "siti@example.com" });
const file = new File(["isi-foto"], "foto.png", { type: "image/png" });

const changeProfilePayload = {
  name: "Budi Baru",
  email: "budi.baru@example.com",
};
const changePasswordPayload = {
  password: "lama123",
  new_password: "baru123",
  new_password_confirmation: "baru123",
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("action creator penanda proses", () => {
  it("setIsProfile membuat aksi users/setIsProfile", () => {
    expect(setIsProfile(true)).toEqual({
      type: "users/setIsProfile",
      payload: true,
    });
    expect(setIsProfile(false)).toEqual({
      type: "users/setIsProfile",
      payload: false,
    });
  });

  it("setIsChangeProfile membuat aksi users/setIsChangeProfile", () => {
    expect(setIsChangeProfile(true)).toEqual({
      type: "users/setIsChangeProfile",
      payload: true,
    });
    expect(setIsChangeProfile(false)).toEqual({
      type: "users/setIsChangeProfile",
      payload: false,
    });
  });

  it("setIsChangeProfilePhoto membuat aksi users/setIsChangeProfilePhoto", () => {
    expect(setIsChangeProfilePhoto(true)).toEqual({
      type: "users/setIsChangeProfilePhoto",
      payload: true,
    });
    expect(setIsChangeProfilePhoto(false)).toEqual({
      type: "users/setIsChangeProfilePhoto",
      payload: false,
    });
  });

  it("setIsChangeProfilePassword membuat aksi users/setIsChangeProfilePassword", () => {
    expect(setIsChangeProfilePassword(true)).toEqual({
      type: "users/setIsChangeProfilePassword",
      payload: true,
    });
    expect(setIsChangeProfilePassword(false)).toEqual({
      type: "users/setIsChangeProfilePassword",
      payload: false,
    });
  });

  it("menyimpan penanda proses ke store", () => {
    const store = makeStore();

    store.dispatch(setIsProfile(true));
    store.dispatch(setIsChangeProfile(true));
    store.dispatch(setIsChangeProfilePhoto(true));
    store.dispatch(setIsChangeProfilePassword(true));

    expect(store.getState().users).toMatchObject({
      isProfile: true,
      isChangeProfile: true,
      isChangeProfilePhoto: true,
      isChangeProfilePassword: true,
    });
  });
});

describe("asyncGetAllUsers", () => {
  it("mengembalikan daftar pengguna dari GET /users", async () => {
    mockFetchResult({
      status: "success",
      message: "OK",
      data: { users: [budi, siti] },
    });
    const store = makeStore();

    await expect(store.dispatch(asyncGetAllUsers()).unwrap()).resolves.toEqual([
      budi,
      siti,
    ]);
    expect(fetchCall(0)[0]).toBe(`${BASE_URL}/users`);
    expect(store.getState().users.users).toEqual([budi, siti]);
  });

  it("ditolak dengan pesan saat status fail", async () => {
    mockFetchResult({
      status: "fail",
      message: "Gagal mengambil daftar pengguna",
    });
    const store = makeStore();

    await expect(store.dispatch(asyncGetAllUsers()).unwrap()).rejects.toBe(
      "Gagal mengambil daftar pengguna",
    );
    expect(store.getState().users.users).toEqual([]);
  });

  it("ditolak dengan pesan saat data tidak disertakan", async () => {
    mockFetchResult({
      status: "success",
      message: "Daftar pengguna kosong",
    });
    const store = makeStore();

    const action = await store.dispatch(asyncGetAllUsers());

    expect(asyncGetAllUsers.rejected.match(action)).toBe(true);
    expect(action.payload).toBe("Daftar pengguna kosong");
    expect(store.getState().users.users).toEqual([]);
  });
});

describe("asyncGetProfile", () => {
  it("mengembalikan profil dari GET /users/me", async () => {
    mockFetchResult({
      status: "success",
      message: "OK",
      data: { user: budi },
    });
    const store = makeStore();

    await expect(store.dispatch(asyncGetProfile()).unwrap()).resolves.toEqual(
      budi,
    );
    expect(fetchCall(0)[0]).toBe(`${BASE_URL}/users/me`);
    expect(store.getState().users.user).toEqual(budi);
    expect(store.getState().users.profile).toEqual(budi);
  });

  it("ditolak dengan pesan saat status fail", async () => {
    mockFetchResult({
      status: "fail",
      message: "Gagal memuat profil",
    });
    const store = makeStore();

    await expect(store.dispatch(asyncGetProfile()).unwrap()).rejects.toBe(
      "Gagal memuat profil",
    );
    expect(store.getState().users.user).toBeNull();
  });

  it("ditolak dengan pesan saat data tidak disertakan", async () => {
    mockFetchResult({
      status: "success",
      message: "Profil tidak ditemukan",
    });
    const store = makeStore();

    await expect(store.dispatch(asyncGetProfile()).unwrap()).rejects.toBe(
      "Profil tidak ditemukan",
    );
  });
});

describe("asyncChangeProfile", () => {
  it("mengirim payload ke PUT /users/me dan mengembalikan user terbaru", async () => {
    const updated = makeUser(changeProfilePayload);
    mockFetchResult({
      status: "success",
      message: "OK",
      data: { user: updated },
    });
    const store = makeStore();

    await expect(
      store.dispatch(asyncChangeProfile(changeProfilePayload)).unwrap(),
    ).resolves.toEqual(updated);

    const [url, init] = fetchCall(0);
    expect(url).toBe(`${BASE_URL}/users/me`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual(changeProfilePayload);
    expect(store.getState().users.user).toEqual(updated);
    expect(store.getState().users.profile).toEqual(updated);
  });

  it("ditolak dengan pesan saat status fail", async () => {
    mockFetchResult({
      status: "fail",
      message: "Email sudah dipakai",
    });
    const store = makeStore();

    await expect(
      store.dispatch(asyncChangeProfile(changeProfilePayload)).unwrap(),
    ).rejects.toBe("Email sudah dipakai");
  });

  it("ditolak dengan pesan saat data tidak disertakan", async () => {
    mockFetchResult({
      status: "success",
      message: "Perubahan tidak tersimpan",
    });
    const store = makeStore();

    await expect(
      store.dispatch(asyncChangeProfile(changeProfilePayload)).unwrap(),
    ).rejects.toBe("Perubahan tidak tersimpan");
  });
});

describe("asyncChangeProfilePhoto", () => {
  it("mengunggah foto lalu membaca ulang profil dari GET /users/me", async () => {
    const updated = makeUser({ photo: "img/profile/foto.png" });
    mockFetchResultOnce({
      status: "success",
      message: "Foto profil berhasil diperbarui.",
    });
    mockFetchResultOnce({
      status: "success",
      message: "OK",
      data: { user: updated },
    });
    const store = makeStore();

    await expect(
      store.dispatch(asyncChangeProfilePhoto(file)).unwrap(),
    ).resolves.toEqual(updated);

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [uploadUrl, uploadInit] = fetchCall(0);
    expect(uploadUrl).toBe(`${BASE_URL}/users/me/photo`);
    expect(uploadInit.method).toBe("POST");
    expect((uploadInit.body as FormData).get("photo")).toBe(file);

    const [profileUrl, profileInit] = fetchCall(1);
    expect(profileUrl).toBe(`${BASE_URL}/users/me`);
    expect(profileInit.method).toBe("GET");

    expect(store.getState().users.profile).toEqual(updated);
  });

  it("ditolak dengan pesan saat unggah gagal dan profil tidak dibaca ulang", async () => {
    mockFetchResult({
      status: "fail",
      message: "Berkas tidak didukung",
    });
    const store = makeStore();

    await expect(
      store.dispatch(asyncChangeProfilePhoto(file)).unwrap(),
    ).rejects.toBe("Berkas tidak didukung");
    // Hanya pemanggilan unggah; GET /users/me tidak dijalankan.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchCall(0)[0]).toBe(`${BASE_URL}/users/me/photo`);
  });

  it("ditolak dengan pesan saat pembacaan ulang profil gagal", async () => {
    mockFetchResultOnce({
      status: "success",
      message: "Foto profil berhasil diperbarui.",
    });
    mockFetchResultOnce({
      status: "fail",
      message: "Gagal memuat profil terbaru",
    });
    const store = makeStore();

    await expect(
      store.dispatch(asyncChangeProfilePhoto(file)).unwrap(),
    ).rejects.toBe("Gagal memuat profil terbaru");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ditolak dengan pesan saat pembacaan ulang profil tanpa data", async () => {
    mockFetchResultOnce({
      status: "success",
      message: "Foto profil berhasil diperbarui.",
    });
    mockFetchResultOnce({
      status: "success",
      message: "Profil tidak ditemukan",
    });
    const store = makeStore();

    await expect(
      store.dispatch(asyncChangeProfilePhoto(file)).unwrap(),
    ).rejects.toBe("Profil tidak ditemukan");
  });
});

describe("asyncChangeProfilePassword", () => {
  it("memanggil PUT /users/password dan mengembalikan pesan sukses", async () => {
    mockFetchResult({
      status: "success",
      message: "Kata sandi berhasil diubah.",
    });
    const store = makeStore();

    await expect(
      store
        .dispatch(asyncChangeProfilePassword(changePasswordPayload))
        .unwrap(),
    ).resolves.toBe("Kata sandi berhasil diubah.");

    const [url, init] = fetchCall(0);
    expect(url).toBe(`${BASE_URL}${CHANGE_PASSWORD_ENDPOINT}`);
    expect(url).toBe(`${BASE_URL}/users/password`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual(changePasswordPayload);
  });

  it("ditolak dengan pesan saat status fail", async () => {
    mockFetchResult({
      status: "fail",
      message: "Kata sandi lama salah",
    });
    const store = makeStore();

    await expect(
      store
        .dispatch(asyncChangeProfilePassword(changePasswordPayload))
        .unwrap(),
    ).rejects.toBe("Kata sandi lama salah");
  });
});
