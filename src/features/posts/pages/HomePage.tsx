"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  FiHeart,
  FiImage,
  FiMessageCircle,
  FiPlus,
  FiSearch,
  FiUser,
} from "react-icons/fi";

import { asyncGetAllPosts } from "@/features/posts/states/action";
import { formatDate, resolveImageUrl } from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";

import AddModal from "../components/modals/AddModal";

/**
 * Dashboard linimasa postingan.
 *
 * Menampilkan daftar postingan publik, tab filter "Postingan Saya" (`is_me`),
 * kolom pencarian langsung (live search), kartu interaksi postingan, serta aksi
 * pintas untuk menambah postingan baru.
 */
export default function HomePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const posts = useAppSelector((state) => state.posts.posts);
  const isPost = useAppSelector((state) => state.posts.isPost);

  const [isFilterMine, setFilterMine] = useState(
    searchParams.get("is_me") === "1",
  );
  const [keyword, setKeyword] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  const loadPosts = useCallback(() => {
    void dispatch(asyncGetAllPosts(isFilterMine));
  }, [dispatch, isFilterMine]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  /** Mengubah tab filter sekaligus menyinkronkan URL agar sidebar ikut aktif. */
  function handleFilterChange(mine: boolean): void {
    setFilterMine(mine);
    router.replace(mine ? "/?is_me=1" : "/");
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visiblePosts = posts.filter(
    (post) =>
      post.description.toLowerCase().includes(normalizedKeyword) ||
      post.author.name.toLowerCase().includes(normalizedKeyword),
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Linimasa Postingan
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isFilterMine
              ? "Menampilkan postingan milik Anda."
              : "Menampilkan seluruh postingan publik."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <FiPlus aria-hidden="true" />
          Postingan Baru
        </button>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <FiSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            name="search"
            aria-label="Cari postingan"
            placeholder="Cari deskripsi atau nama pembuat..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter postingan"
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isFilterMine}
            onClick={() => handleFilterChange(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isFilterMine
                ? "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                : "bg-brand-600 text-white"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isFilterMine}
            onClick={() => handleFilterChange(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isFilterMine
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            Postingan Saya
          </button>
        </div>
      </section>

      {isPost && (
        <div className="space-y-4" aria-busy="true" aria-label="Memuat postingan">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/70"
            />
          ))}
        </div>
      )}

      {!isPost && visiblePosts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <FiImage
            aria-hidden="true"
            className="mx-auto text-slate-300"
            size={36}
          />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            Tidak ada postingan yang ditampilkan.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Coba ubah kata kunci pencarian atau buat postingan baru.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {visiblePosts.map((post) => {
          const coverUrl = resolveImageUrl(post.cover);
          const authorPhotoUrl = resolveImageUrl(post.author.photo);

          return (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900"
            >
              {coverUrl && (
                <Image
                  src={coverUrl}
                  alt={`Cover postingan ${post.author.name}`}
                  width={960}
                  height={384}
                  unoptimized
                  className="h-48 w-full object-cover"
                />
              )}

              <div className="p-5">
                <div className="flex items-center gap-3">
                  {authorPhotoUrl ? (
                    <Image
                      src={authorPhotoUrl}
                      alt={post.author.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                      <FiUser aria-hidden="true" size={18} />
                    </span>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {post.author.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {post.description}
                </p>

                <div className="mt-4 flex items-center gap-5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <FiHeart aria-hidden="true" />
                    {post.likes.length} suka
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FiMessageCircle aria-hidden="true" />
                    {post.comments.length} komentar
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <AddModal
        open={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadPosts}
      />
    </div>
  );
}
