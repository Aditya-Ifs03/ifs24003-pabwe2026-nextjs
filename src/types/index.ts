/**
 * Kumpulan tipe data (interface) model yang dipakai bersama oleh seluruh
 * fitur aplikasi.
 */

/** Bentuk umum respons REST API Delcom. */
export interface ApiResult<T = unknown> {
  status: "success" | "fail";
  message: string;
  data?: T;
}

/** Profil pengguna sistem. */
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string;
}

/** Ringkasan pembuat sebuah postingan (tertanam pada objek post). */
export interface PostAuthor {
  name: string;
  photo: string | null;
}

/** Komentar lengkap pada sebuah postingan. */
export interface PostComment {
  id: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

/** Sebuah postingan (linimasa). */
export interface Post {
  id: number;
  user_id: number;
  cover: string | null;
  description: string;
  created_at: string;
  updated_at: string;
  author: PostAuthor;
  /** Daftar id pengguna yang menyukai postingan. */
  likes: number[];
  /**
   * Pada endpoint daftar (`GET /posts`) berisi daftar **id** komentar,
   * sedangkan pada endpoint detail (`GET /posts/:id`) berisi objek komentar.
   */
  comments: Array<number | PostComment>;
  /** Komentar milik pengguna yang sedang login (hanya pada endpoint detail). */
  my_comment?: PostComment | null;
}
