"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { FiLock, FiMail, FiUser, FiUserPlus } from "react-icons/fi";

import { asyncRegister } from "@/features/auth/states/action";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import useInput from "@/hooks/useInput";

/** Panjang minimum kata sandi yang diterima. */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Halaman pendaftaran akun baru.
 *
 * Memvalidasi formulir (kelengkapan data dan panjang kata sandi), mengirim data
 * melalui thunk `asyncRegister`, lalu mengarahkan pengguna ke halaman login.
 */
export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthRegister = useAppSelector((state) => state.auth.isAuthRegister);

  const name = useInput("");
  const email = useInput("");
  const password = useInput("");

  const hasEmptyField = [name.value, email.value, password.value].some(
    (value) => value.trim().length === 0,
  );
  const isPasswordTooShort = password.value.length < MIN_PASSWORD_LENGTH;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (hasEmptyField) {
      await showErrorDialog(
        "Data belum lengkap",
        "Nama, email, dan kata sandi wajib diisi.",
      );
      return;
    }

    if (isPasswordTooShort) {
      await showErrorDialog(
        "Kata sandi terlalu pendek",
        `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
      );
      return;
    }

    try {
      await dispatch(
        asyncRegister({
          name: name.value,
          email: email.value,
          password: password.value,
        }),
      ).unwrap();

      await showSuccessDialog(
        "Pendaftaran berhasil",
        "Akun Anda sudah dibuat. Silakan masuk.",
      );
      router.push("/auth/login");
    } catch (error) {
      await showErrorDialog("Pendaftaran gagal", String(error));
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Buat akun baru
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Gratis dan hanya butuh beberapa detik.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="register-name"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Nama Lengkap
          </label>
          <div className="relative">
            <FiUser
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Nama Anda"
              value={name.value}
              onChange={name.handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Email
          </label>
          <div className="relative">
            <FiMail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email.value}
              onChange={email.handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <FiLock
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
              value={password.value}
              onChange={password.handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Minimal {MIN_PASSWORD_LENGTH} karakter.
          </p>
        </div>

        <button
          type="submit"
          disabled={isAuthRegister}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiUserPlus aria-hidden="true" />
          {isAuthRegister ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Sudah punya akun?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-brand-700 hover:underline dark:text-brand-400"
        >
          Masuk di sini
        </Link>
      </p>
    </section>
  );
}
