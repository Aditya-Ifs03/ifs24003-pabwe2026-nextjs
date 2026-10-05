import { apiFetch } from "@/helpers/apiHelper";
import type { ApiResult, User } from "@/types";
import type { AuthLoginRequest, AuthRegisterRequest } from "@/types/action";

/** Payload `data` yang dikembalikan endpoint login. */
export interface AuthLoginData {
  user: User;
  token: string;
}

/**
 * Melakukan autentikasi pengguna.
 *
 * `POST /auth/login`
 */
export async function login(
  payload: AuthLoginRequest,
): Promise<ApiResult<AuthLoginData>> {
  return apiFetch<AuthLoginData>("/auth/login", {
    method: "POST",
    body: payload,
    // Token lama tidak perlu dikirim saat login.
    skipAuth: true,
  });
}

/**
 * Mendaftarkan akun pengguna baru.
 *
 * `POST /auth/register`
 */
export async function register(
  payload: AuthRegisterRequest,
): Promise<ApiResult> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
}

/**
 * Mencabut access token pengguna yang sedang aktif.
 *
 * `POST /auth/logout`
 */
export async function logout(): Promise<ApiResult> {
  return apiFetch("/auth/logout", { method: "POST" });
}
