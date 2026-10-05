/**
 * Definisi tipe payload untuk seluruh action Redux.
 *
 * Dipisahkan dari `index.ts` agar reducer/action creator dapat mengimpor tipe
 * payload tanpa ikut menarik tipe model yang lebih besar.
 */

import type { Post, PostComment, User } from ".";

/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */

/** Payload hasil login yang berhasil (user + access token). */
export interface AuthLoginPayload {
  user: User;
  token: string;
}

/** Payload kredensial untuk proses login. */
export interface AuthLoginRequest {
  email: string;
  password: string;
}

/** Payload pendaftaran akun baru. */
export interface AuthRegisterRequest {
  name: string;
  email: string;
  password: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Users                                    */
/* -------------------------------------------------------------------------- */

/** Payload berisi daftar seluruh pengguna. */
export interface UsersPayload {
  users: User[];
}

/** Payload berisi satu objek pengguna. */
export interface UserPayload {
  user: User;
}

/** Payload perubahan profil pengguna. */
export interface UserChangeProfileRequest {
  name: string;
  email: string;
}

/** Payload perubahan kata sandi pengguna. */
export interface UserChangePasswordRequest {
  password: string;
  new_password: string;
  new_password_confirmation: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Posts                                    */
/* -------------------------------------------------------------------------- */

/** Payload berisi daftar postingan. */
export interface PostsPayload {
  posts: Post[];
}

/** Payload berisi satu objek postingan. */
export interface PostPayload {
  post: Post;
}

/** Payload berisi id sebuah postingan. */
export interface PostIdPayload {
  postId: number;
}

/** Payload untuk menambah postingan baru. */
export interface PostAddRequest {
  description: string;
}

/** Payload untuk mengubah deskripsi postingan. */
export interface PostChangeRequest {
  postId: number;
  description: string;
}

/** Payload untuk mengganti cover postingan. */
export interface PostChangeCoverRequest {
  postId: number;
  cover: File;
}

/** Payload untuk memberi / membatalkan suka pada postingan. */
export interface PostLikeRequest {
  postId: number;
  /** `1` untuk menyukai, `0` untuk membatalkan suka. */
  like: 1 | 0;
}

/** Payload untuk menambahkan komentar. */
export interface PostAddCommentRequest {
  postId: number;
  comment: string;
}

/** Payload untuk menghapus komentar milik pengguna. */
export interface PostDeleteCommentRequest {
  postId: number;
  comment: PostComment;
}

/** Payload filter daftar postingan. */
export interface PostListRequest {
  /** Bila `1`, hanya mengambil postingan milik pengguna yang login. */
  is_me?: 1;
}
