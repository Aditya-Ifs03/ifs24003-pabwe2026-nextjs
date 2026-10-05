import { apiFetch } from "@/helpers/apiHelper";
import type { ApiResult, Post } from "@/types";
import type {
  PostAddCommentRequest,
  PostAddRequest,
  PostChangeCoverRequest,
  PostChangeRequest,
  PostLikeRequest,
} from "@/types/action";

/**
 * Mengambil daftar postingan.
 *
 * `GET /posts` — bila `isMe` bernilai `true`, query `is_me=1` ditambahkan
 * sehingga hanya postingan milik pengguna yang login yang dikembalikan.
 */
export async function getAllPosts(
  isMe = false,
): Promise<ApiResult<{ posts: Post[] }>> {
  return apiFetch<{ posts: Post[] }>("/posts", {
    params: isMe ? { is_me: 1 } : undefined,
  });
}

/**
 * Mengambil rincian satu postingan.
 *
 * `GET /posts/:id`
 */
export async function getPostById(
  postId: number,
): Promise<ApiResult<{ post: Post }>> {
  return apiFetch<{ post: Post }>(`/posts/${postId}`);
}

/**
 * Menambahkan postingan baru.
 *
 * `POST /posts` — mengembalikan `post_id` postingan yang baru dibuat.
 */
export async function addPost(
  payload: PostAddRequest,
): Promise<ApiResult<{ post_id: number }>> {
  return apiFetch<{ post_id: number }>("/posts", {
    method: "POST",
    body: payload,
  });
}

/**
 * Memperbarui deskripsi postingan.
 *
 * `PUT /posts/:id`
 */
export async function changePost({
  postId,
  description,
}: PostChangeRequest): Promise<ApiResult> {
  return apiFetch(`/posts/${postId}`, {
    method: "PUT",
    body: { description },
  });
}

/**
 * Mengunggah / mengganti cover postingan.
 *
 * `POST /posts/:id/cover` (multipart/form-data)
 */
export async function changePostCover({
  postId,
  cover,
}: PostChangeCoverRequest): Promise<ApiResult> {
  const formData = new FormData();
  formData.append("cover", cover);

  return apiFetch(`/posts/${postId}/cover`, { method: "POST", formData });
}

/**
 * Menghapus satu postingan.
 *
 * `DELETE /posts/:id`
 */
export async function deletePost(postId: number): Promise<ApiResult> {
  return apiFetch(`/posts/${postId}`, { method: "DELETE" });
}

/**
 * Memberi (`like: 1`) atau membatalkan (`like: 0`) suka pada postingan.
 *
 * `POST /posts/:id/likes`
 */
export async function likePost({
  postId,
  like,
}: PostLikeRequest): Promise<ApiResult> {
  return apiFetch(`/posts/${postId}/likes`, {
    method: "POST",
    body: { like },
  });
}

/**
 * Menambahkan komentar pada postingan.
 *
 * `POST /posts/:id/comments`
 */
export async function addComment({
  postId,
  comment,
}: PostAddCommentRequest): Promise<ApiResult> {
  return apiFetch(`/posts/${postId}/comments`, {
    method: "POST",
    body: { comment },
  });
}

/**
 * Menghapus komentar milik pengguna pada postingan.
 *
 * `DELETE /posts/:id/comments`
 */
export async function deleteComment(postId: number): Promise<ApiResult> {
  return apiFetch(`/posts/${postId}/comments`, { method: "DELETE" });
}

/**
 * Menghapus seluruh postingan milik pengguna.
 *
 * `DELETE /posts`
 */
export async function deleteAllPosts(): Promise<ApiResult> {
  return apiFetch("/posts", { method: "DELETE" });
}
