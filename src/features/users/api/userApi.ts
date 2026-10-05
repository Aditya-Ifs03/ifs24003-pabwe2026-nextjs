import { apiFetch } from "@/helpers/apiHelper";
import type { ApiResult, User } from "@/types";
import type {
  UserChangePasswordRequest,
  UserChangeProfileRequest,
} from "@/types/action";

/**
 * Endpoint ubah kata sandi.
 *
 * Catatan: naskah studi kasus menuliskan `PUT /users/me/password`, sedangkan
 * dokumentasi resmi Delcom Open API — dan hasil verifikasi langsung ke server
 * produksi — menyediakan `PUT /users/password` (`/users/me/password` menjawab
 * HTTP 404). Konstanta ini memakai jalur yang benar-benar tersedia.
 */
export const CHANGE_PASSWORD_ENDPOINT = "/users/password";

/**
 * Mengambil daftar seluruh pengguna terdaftar.
 *
 * `GET /users`
 */
export async function getAllUsers(): Promise<ApiResult<{ users: User[] }>> {
  return apiFetch<{ users: User[] }>("/users");
}

/**
 * Mengambil profil pengguna yang sedang login.
 *
 * `GET /users/me`
 */
export async function getMyProfile(): Promise<ApiResult<{ user: User }>> {
  return apiFetch<{ user: User }>("/users/me");
}

/**
 * Memperbarui profil pengguna yang sedang login.
 *
 * `PUT /users/me`
 */
export async function updateMyProfile(
  payload: UserChangeProfileRequest,
): Promise<ApiResult<{ user: User }>> {
  return apiFetch<{ user: User }>("/users/me", {
    method: "PUT",
    body: payload,
  });
}

/**
 * Mengunggah / mengganti foto profil pengguna.
 *
 * `POST /users/me/photo` (multipart/form-data)
 */
export async function updateMyPhoto(
  photo: File,
): Promise<ApiResult<{ user: User }>> {
  const formData = new FormData();
  formData.append("photo", photo);

  return apiFetch<{ user: User }>("/users/me/photo", {
    method: "POST",
    formData,
  });
}

/**
 * Mengubah kata sandi pengguna yang sedang login.
 *
 * `PUT /users/password`
 */
export async function changeMyPassword(
  payload: UserChangePasswordRequest,
): Promise<ApiResult> {
  return apiFetch(CHANGE_PASSWORD_ENDPOINT, {
    method: "PUT",
    body: payload,
  });
}
