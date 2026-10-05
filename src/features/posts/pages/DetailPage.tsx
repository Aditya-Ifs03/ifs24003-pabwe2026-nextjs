"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  FiArrowLeft,
  FiCamera,
  FiEdit2,
  FiHeart,
  FiImage,
  FiMessageCircle,
  FiSend,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

import {
  asyncAddComment,
  asyncDeleteComment,
  asyncDeletePost,
  asyncGetPostById,
  asyncLikePost,
} from "@/features/posts/states/action";
import {
  formatDate,
  resolveImageUrl,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import useInput from "@/hooks/useInput";
import type { Post, PostComment } from "@/types";

import ChangeCoverModal from "../components/modals/ChangeCoverModal";
import ChangeModal from "../components/modals/ChangeModal";

/**
 * Halaman rincian sebuah postingan.
 *
 * Menampilkan cover, profil pembuat, deskripsi lengkap, tanggal publikasi,
 * tombol suka, daftar komentar, formulir kirim komentar, aksi hapus komentar,
 * serta tombol ubah cover / ubah postingan / hapus postingan bila postingan
 * tersebut milik pengguna yang sedang login.
 */
export default function DetailPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams<{ postId: string }>();

  const post = useAppSelector((state) => state.posts.post);
  const profile = useAppSelector((state) => state.users.profile);
  const isPost = useAppSelector((state) => state.posts.isPost);
  const isPostLike = useAppSelector((state) => state.posts.isPostLike);
  const isPostDelete = useAppSelector((state) => state.posts.isPostDelete);

  const comment = useInput("");
  const [isChangeModalOpen, setChangeModalOpen] = useState(false);
  const [isCoverModalOpen, setCoverModalOpen] = useState(false);

  const postId = Number(params.postId);

  const loadPost = useCallback(() => {
    void dispatch(asyncGetPostById(postId));
  }, [dispatch, postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  if (isPost && !post) {
    return (
      <div
        aria-busy="true"
        aria-label="Memuat postingan"
        className="h-96 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/70"
      />
    );
  }

  if (!post) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <FiImage aria-hidden="true" className="mx-auto text-slate-300" size={36} />
        <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          Postingan tidak ditemukan.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <FiArrowLeft aria-hidden="true" />
          Kembali ke linimasa
        </button>
      </div>
    );
  }

  const postData: Post = post;
  const isOwner = postData.user_id === profile?.id;
  const isLiked = postData.likes.includes(profile?.id ?? -1);
  const comments = postData.comments.filter(
    (item): item is PostComment => typeof item === "object",
  );
  const coverUrl = resolveImageUrl(postData.cover);
  const authorPhotoUrl = resolveImageUrl(postData.author.photo);

  async function handleLike(): Promise<void> {
    try {
      await dispatch(
        asyncLikePost({ postId: postData.id, like: isLiked ? 0 : 1 }),
      ).unwrap();
      loadPost();
    } catch (error) {
      await showErrorDialog("Gagal mengubah suka", String(error));
    }
  }

  async function handleAddComment(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (comment.value.trim().length === 0) {
      await showErrorDialog(
        "Komentar masih kosong",
        "Tuliskan komentar terlebih dahulu.",
      );
      return;
    }

    try {
      await dispatch(
        asyncAddComment({ postId: postData.id, comment: comment.value }),
      ).unwrap();

      comment.reset();
      await showSuccessDialog("Berhasil", "Komentar berhasil dikirim.");
      loadPost();
    } catch (error) {
      await showErrorDialog("Gagal mengirim komentar", String(error));
    }
  }

  async function handleDeleteComment(): Promise<void> {
    const confirmed = await showConfirmDialog(
      "Hapus komentar?",
      "Komentar Anda akan dihapus permanen.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await dispatch(asyncDeleteComment(postData.id)).unwrap();
      await showSuccessDialog("Berhasil", "Komentar berhasil dihapus.");
      loadPost();
    } catch (error) {
      await showErrorDialog("Gagal menghapus komentar", String(error));
    }
  }

  async function handleDeletePost(): Promise<void> {
    const confirmed = await showConfirmDialog(
      "Hapus postingan?",
      "Postingan ini beserta komentarnya akan dihapus permanen.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await dispatch(asyncDeletePost(postData.id)).unwrap();
      await showSuccessDialog("Berhasil", "Postingan berhasil dihapus.");
      router.push("/");
    } catch (error) {
      await showErrorDialog("Gagal menghapus postingan", String(error));
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-brand-700 dark:text-slate-400"
      >
        <FiArrowLeft aria-hidden="true" />
        Kembali ke linimasa
      </button>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Cover postingan ${postData.author.name}`}
            width={1200}
            height={480}
            unoptimized
            className="h-64 w-full object-cover sm:h-80"
          />
        ) : (
          <div className="grid h-40 w-full place-items-center bg-slate-100 text-slate-400 dark:bg-slate-800">
            <FiImage aria-hidden="true" size={32} />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center gap-3">
            {authorPhotoUrl ? (
              <Image
                src={authorPhotoUrl}
                alt={postData.author.name}
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <FiUser aria-hidden="true" size={20} />
              </span>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {postData.author.name}
              </p>
              <p className="text-xs text-slate-400">
                Dipublikasikan {formatDate(postData.created_at)}
              </p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {postData.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={isPostLike}
              aria-pressed={isLiked}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                isLiked
                  ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <FiHeart aria-hidden="true" />
              {postData.likes.length} suka
            </button>

            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <FiMessageCircle aria-hidden="true" />
              {comments.length} komentar
            </span>

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setCoverModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiCamera aria-hidden="true" />
                  Ubah Cover
                </button>

                <button
                  type="button"
                  onClick={() => setChangeModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FiEdit2 aria-hidden="true" />
                  Ubah Postingan
                </button>

                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={isPostDelete}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40"
                >
                  <FiTrash2 aria-hidden="true" />
                  {isPostDelete ? "Menghapus..." : "Hapus Postingan"}
                </button>
              </>
            )}
          </div>
        </div>
      </article>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Komentar
        </h2>

        {comments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Belum ada komentar. Jadilah yang pertama!
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {comments.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950"
              >
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {item.comment}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(item.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {postData.my_comment && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-900 dark:bg-brand-900/30">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                Komentar Anda
              </p>
              <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                {postData.my_comment.comment}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteComment}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
            >
              <FiTrash2 aria-hidden="true" />
              Hapus
            </button>
          </div>
        )}

        <form onSubmit={handleAddComment} className="mt-5 flex gap-2">
          <input
            type="text"
            name="comment"
            aria-label="Tulis komentar"
            placeholder="Tulis komentar..."
            value={comment.value}
            onChange={comment.handleChange}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <FiSend aria-hidden="true" />
            Kirim
          </button>
        </form>
      </section>

      <ChangeModal
        open={isChangeModalOpen}
        onClose={() => setChangeModalOpen(false)}
        onSuccess={loadPost}
        post={postData}
      />

      <ChangeCoverModal
        open={isCoverModalOpen}
        onClose={() => setCoverModalOpen(false)}
        onSuccess={loadPost}
        post={postData}
      />
    </div>
  );
}
