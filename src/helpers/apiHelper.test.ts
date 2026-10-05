import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACCESS_TOKEN_KEY,
  apiFetch,
  buildUrl,
  getAccessToken,
  isSuccess,
  putAccessToken,
} from "@/helpers/apiHelper";
import { DELCOM_BASEURL } from "@/lib/config";

/**
 * Pengujian `src/helpers/apiHelper.ts`.
 *
 * `fetch` global diganti mock pada setiap skenario supaya tidak ada permintaan
 * jaringan sungguhan yang dijalankan.
 */

/** Base URL tanpa trailing slash, sama seperti perhitungan di `buildUrl`. */
const BASE = DELCOM_BASEURL.replace(/\/+$/, "");

/** Pesan kegagalan yang dikembalikan `apiFetch` saat terjadi galat. */
const PESAN_GAGAL = "Tidak dapat terhubung ke server. Periksa koneksi Anda.";

/** Mock `fetch` global yang dipakai seluruh skenario. */
const fetchMock = vi.fn();

/** Memasang ulang mock `fetch` (dipanggil sebelum setiap skenario). */
function pasangFetchMock(): void {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
}

beforeEach(() => {
  pasangFetchMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("isSuccess", () => {
  it("mengembalikan true saat status success dan data tersedia", () => {
    expect(
      isSuccess({ status: "success", message: "ok", data: { id: 1 } }),
    ).toBe(true);
  });

  it("mengembalikan false saat status success tetapi data tidak ada", () => {
    expect(isSuccess({ status: "success", message: "ok" })).toBe(false);
  });

  it("mengembalikan false saat status fail", () => {
    expect(
      isSuccess({ status: "fail", message: "gagal", data: { id: 1 } }),
    ).toBe(false);
  });
});

describe("getAccessToken dan putAccessToken", () => {
  it("mengembalikan null saat token belum pernah disimpan", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("menyimpan token ke localStorage", () => {
    putAccessToken("token-rahasia");

    expect(getAccessToken()).toBe("token-rahasia");
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("token-rahasia");
  });

  it("menghapus token saat diberi nilai null", () => {
    putAccessToken("token-rahasia");
    expect(getAccessToken()).toBe("token-rahasia");

    putAccessToken(null);

    expect(getAccessToken()).toBeNull();
    expect(window.localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("mengembalikan null saat berjalan di sisi server", () => {
    putAccessToken("token-rahasia");
    vi.stubGlobal("window", undefined);

    try {
      expect(getAccessToken()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
      pasangFetchMock();
    }
  });

  it("tidak melakukan apa pun saat berjalan di sisi server", () => {
    vi.stubGlobal("window", undefined);

    try {
      expect(() => putAccessToken("token-rahasia")).not.toThrow();
      expect(() => putAccessToken(null)).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
      pasangFetchMock();
    }
  });
});

describe("buildUrl", () => {
  it("menggabungkan base URL dan endpoint tanpa trailing slash ganda", () => {
    expect(buildUrl("/posts")).toBe(`${BASE}/posts`);
  });

  it("menyusun query parameter dan meng-encode nilainya", () => {
    const url = new URL(
      buildUrl("/users", { search: "budi santoso", page: 2, aktif: true }),
    );

    expect(url.pathname).toBe("/api/v1/users");
    expect(url.searchParams.get("search")).toBe("budi santoso");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("aktif")).toBe("true");
    expect(buildUrl("/users", { search: "budi santoso" })).toContain(
      "search=budi+santoso",
    );
  });

  it("melewati parameter undefined, null, dan string kosong", () => {
    const url = new URL(
      buildUrl("/posts", {
        kosong: undefined,
        nol: null,
        teksKosong: "",
        halaman: 5,
      }),
    );

    expect(url.searchParams.has("kosong")).toBe(false);
    expect(url.searchParams.has("nol")).toBe(false);
    expect(url.searchParams.has("teksKosong")).toBe(false);
    expect(url.searchParams.get("halaman")).toBe("5");
  });

  it("tetap melewati parameter bila seluruh nilainya kosong", () => {
    expect(buildUrl("/posts", { a: undefined })).toBe(`${BASE}/posts`);
  });

  it("menghapus trailing slash pada base URL yang berasal dari env", async () => {
    vi.resetModules();
    vi.stubEnv(
      "NEXT_PUBLIC_DELCOM_BASEURL",
      "https://contoh.test/api/v1///",
    );

    const modul = await import("@/helpers/apiHelper");

    expect(modul.buildUrl("/posts")).toBe("https://contoh.test/api/v1/posts");
  });
});

describe("apiFetch", () => {
  it("melakukan permintaan GET tanpa body lalu mengembalikan hasil JSON", async () => {
    const hasil = { status: "success", message: "ok", data: [1, 2] };
    fetchMock.mockResolvedValue({ json: async () => hasil });

    await expect(apiFetch("/posts")).resolves.toEqual(hasil);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/posts`);
    expect(init).toEqual({
      method: "GET",
      headers: { Accept: "application/json" },
      body: undefined,
    });
  });

  it("menyisipkan bearer token bila token tersedia", async () => {
    putAccessToken("token-rahasia");
    fetchMock.mockResolvedValue({ json: async () => ({ status: "success" }) });

    await apiFetch("/profile");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({
      Accept: "application/json",
      Authorization: "Bearer token-rahasia",
    });
  });

  it("tidak menyisipkan token saat skipAuth true", async () => {
    putAccessToken("token-rahasia");
    fetchMock.mockResolvedValue({ json: async () => ({ status: "success" }) });

    await apiFetch("/login", { method: "POST", skipAuth: true });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ Accept: "application/json" });
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("mengirim body JSON beserta header Content-Type", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ status: "success" }) });
    const body = { email: "budi@contoh.test", password: "rahasia" };

    await apiFetch("/login", { method: "POST", body, skipAuth: true });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify(body));
  });

  it("mengirim FormData tanpa header Content-Type", async () => {
    const formData = new FormData();
    formData.append("photo", "berkas");
    fetchMock.mockResolvedValue({ json: async () => ({ status: "success" }) });

    await apiFetch("/profile/photo", { method: "PUT", formData });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(formData);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("meneruskan query parameter ke URL permintaan", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ status: "success" }) });

    await apiFetch("/users", { params: { page: 1, kataKunci: "" } });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/users?page=1");
    expect(url).not.toContain("kataKunci");
  });

  it("mengembalikan status fail saat permintaan jaringan gagal", async () => {
    fetchMock.mockRejectedValue(new Error("jaringan putus"));

    await expect(apiFetch("/posts")).resolves.toEqual({
      status: "fail",
      message: PESAN_GAGAL,
    });
  });

  it("mengembalikan status fail saat body respons bukan JSON", async () => {
    fetchMock.mockResolvedValue({
      json: async () => {
        throw new Error("bukan JSON");
      },
    });

    await expect(apiFetch("/posts")).resolves.toEqual({
      status: "fail",
      message: PESAN_GAGAL,
    });
  });
});
