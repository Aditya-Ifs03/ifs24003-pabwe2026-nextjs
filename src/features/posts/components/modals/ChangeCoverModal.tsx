"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { FiImage, FiUpload, FiX } from "react-icons/fi";

import { asyncChangePostCover } from "@/features/posts/states/action";
import {
  resolveImageUrl,
  showErrorDialog,
  showSuccessDialog,
} from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import type { Post } from "@/types";

/** Props {@link ChangeCoverModal}. */
export interface ChangeCoverModalProps {
  /** `true` bila modal ditampilkan. */
  open: boolean;
  /** Dipanggil untuk menutup modal. */
  onClose: () => void;
  /** Dipanggil setelah cover berhasil diunggah. */
  onSuccess: () => void;
  /** Postingan yang covernya akan diganti. */
  post: Post;
}

/**
 * Modal interaktif untuk memilih, meninjau (preview), dan mengunggah berkas
 * cover baru pada sebuah postingan.
 */
export default function ChangeCoverModal({
  open,
  onClose,
  onSuccess,
  post,
}: ChangeCoverModalProps) {
  const dispatch = useAppDispatch();
  const isPostChangeCover = useAppSelector(
    (state) => state.posts.isPostChangeCover,
  );

  const [cover, setCover] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const existingCoverUrl = resolveImageUrl(post.cover);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const selected = event.target.files?.[0];

    if (!selected) {
      return;
    }

    if (!selected.type.startsWith("image/")) {
      void showErrorDialog(
        "Berkas tidak didukung",
        "Pilih berkas gambar (JPG, PNG, atau WEBP).",
      );
      return;
    }

    setCover(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function handleClose(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setCover(null);
    setPreviewUrl(null);
    onClose();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!cover) {
      await showErrorDialog(
        "Belum ada berkas",
        "Pilih gambar cover terlebih dahulu.",
      );
      return;
    }

    try {
      await dispatch(
        asyncChangePostCover({ postId: post.id, cover }),
      ).unwrap();

      await showSuccessDialog("Berhasil", "Cover postingan berhasil diperbarui.");
      onSuccess();
      handleClose();
    } catch (error) {
      await showErrorDialog("Gagal mengunggah cover", String(error));
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-cover-title"
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="change-cover-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Ganti Cover
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Unggah gambar sampul baru untuk postingan ini.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Pratinjau cover baru"
                className="h-48 w-full object-cover"
              />
            ) : existingCoverUrl ? (
              <Image
                src={existingCoverUrl}
                alt="Cover saat ini"
                width={640}
                height={192}
                unoptimized
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="grid h-48 w-full place-items-center text-slate-400">
                <div className="text-center">
                  <FiImage aria-hidden="true" className="mx-auto" size={32} />
                  <p className="mt-2 text-xs">Belum ada cover</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="change-cover-file"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Berkas Cover
            </label>
            <input
              id="change-cover-file"
              name="cover"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-3 file:rounded-l-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
            />
            {cover && (
              <p className="mt-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                Berkas dipilih: {cover.name}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPostChangeCover}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiUpload aria-hidden="true" />
              {isPostChangeCover ? "Mengunggah..." : "Unggah Cover"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
