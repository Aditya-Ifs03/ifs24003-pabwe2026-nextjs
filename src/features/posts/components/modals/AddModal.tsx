"use client";

import type { FormEvent } from "react";
import { FiPlus, FiX } from "react-icons/fi";

import { asyncAddPost } from "@/features/posts/states/action";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import useInput from "@/hooks/useInput";

/** Props {@link AddModal}. */
export interface AddModalProps {
  /** `true` bila modal ditampilkan. */
  open: boolean;
  /** Dipanggil untuk menutup modal. */
  onClose: () => void;
  /** Dipanggil setelah postingan berhasil dibuat (untuk memuat ulang data). */
  onSuccess: () => void;
}

/**
 * Modal untuk mempublikasikan postingan baru.
 *
 * Cover diunggah terpisah melalui {@link ChangeCoverModal} setelah postingan
 * berhasil dibuat.
 */
export default function AddModal({
  open,
  onClose,
  onSuccess,
}: AddModalProps) {
  const dispatch = useAppDispatch();
  const isPostAdd = useAppSelector((state) => state.posts.isPostAdd);

  const description = useInput("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (description.value.trim().length === 0) {
      await showErrorDialog(
        "Deskripsi masih kosong",
        "Tuliskan sesuatu sebelum mempublikasikan postingan.",
      );
      return;
    }

    try {
      await dispatch(
        asyncAddPost({ description: description.value }),
      ).unwrap();

      description.reset();
      await showSuccessDialog("Berhasil", "Postingan berhasil dipublikasikan.");
      onSuccess();
      onClose();
    } catch (error) {
      await showErrorDialog("Gagal mempublikasikan", String(error));
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
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-post-title"
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="add-post-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Postingan Baru
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Bagikan apa yang sedang Anda pikirkan.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="add-post-description"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Deskripsi
            </label>
            <textarea
              id="add-post-description"
              name="description"
              rows={5}
              placeholder="Apa yang ingin Anda bagikan hari ini?"
              value={description.value}
              onChange={description.handleChange}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPostAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiPlus aria-hidden="true" />
              {isPostAdd ? "Menyimpan..." : "Publikasikan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
