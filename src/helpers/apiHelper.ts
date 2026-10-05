import { DELCOM_BASEURL } from "@/lib/config";
import type { ApiResult } from "@/types";

/** Kunci `localStorage` tempat access token disimpan. */
export const ACCESS_TOKEN_KEY = "delcom_access_token";

/**
 * Type guard yang memastikan sebuah respons berstatus `success` **dan**
 * membawa payload `data`.
 *
 * Dipakai oleh async thunk agar pengecekan berhasil/gagal hanya ditulis sekali.
 */
export function isSuccess<T>(
  result: ApiResult<T>,
): result is ApiResult<T> & { data: T } {
  return result.status === "success" && result.data !== undefined;
}

/** Metode HTTP yang didukung oleh REST API Delcom. */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/** Nilai query parameter yang diterima `apiFetch`. */
export type QueryValue = string | number | boolean | undefined | null;

/** Opsi tambahan untuk {@link apiFetch}. */
export interface ApiFetchOptions {
  /** Metode HTTP, default `GET`. */
  method?: HttpMethod;
  /** Body berformat JSON (diabaikan bila `formData` diisi). */
  body?: unknown;
  /** Query parameters yang akan di-encode ke URL. */
  params?: Record<string, QueryValue>;
  /** Body `multipart/form-data` (unggah berkas). */
  formData?: FormData;
  /** Bila `true`, bearer token tidak disisipkan (dipakai login/registrasi). */
  skipAuth?: boolean;
}

/**
 * Mengambil access token pengguna dari `localStorage`.
 *
 * @returns token, atau `null` bila belum ada / berjalan di sisi server.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Menyimpan access token pengguna ke `localStorage`.
 *
 * @param token token baru, atau `null` untuk menghapus token (logout).
 */
export function putAccessToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

/**
 * Menyusun URL lengkap beserta query parameters.
 *
 * Nilai `undefined`, `null`, dan string kosong akan dilewati.
 */
export function buildUrl(
  endpoint: string,
  params?: Record<string, QueryValue>,
): string {
  const base = DELCOM_BASEURL.replace(/\/+$/, "");
  const url = new URL(`${base}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Wrapper `fetch` untuk seluruh pemanggilan REST API Delcom.
 *
 * Menangani penyusunan URL + query parameters, penyisipan header
 * `Authorization: Bearer <token>` secara otomatis, pengiriman body JSON maupun
 * `multipart/form-data`, serta mengubah kegagalan jaringan menjadi
 * {@link ApiResult} dengan `status: "fail"` supaya pemanggil tidak perlu
 * membungkusnya dengan `try/catch`.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<ApiResult<T>> {
  const { method = "GET", body, params, formData, skipAuth = false } = options;

  const headers: Record<string, string> = { Accept: "application/json" };

  if (!skipAuth) {
    const token = getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let payload: BodyInit | undefined;

  if (formData) {
    // Content-Type sengaja tidak diset agar browser menuliskan boundary sendiri.
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  try {
    const response = await fetch(buildUrl(endpoint, params), {
      method,
      headers,
      body: payload,
    });

    return (await response.json()) as ApiResult<T>;
  } catch {
    return {
      status: "fail",
      message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
    };
  }
}
