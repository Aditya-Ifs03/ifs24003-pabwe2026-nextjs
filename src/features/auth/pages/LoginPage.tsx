"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { FiLock, FiLogIn, FiMail } from "react-icons/fi";

import { asyncLogin } from "@/features/auth/states/action";
import { showErrorDialog, showSuccessDialog } from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import useInput from "@/hooks/useInput";

/**
 * Halaman login pengguna.
 *
 * Memvalidasi formulir, mengirim kredensial melalui thunk `asyncLogin`, lalu
 * menampilkan dialog umpan balik dan mengalihkan pengguna ke dashboard.
 */
export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthLogin = useAppSelector((state) => state.auth.isAuthLogin);

  const email = useInput("");
  const password = useInput("");

  const hasEmptyField = [email.value, password.value].some(
    (value) => value.trim().length === 0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (hasEmptyField) {
      await showErrorDialog(
        "Data belum lengkap",
        "Email dan kata sandi wajib diisi.",
      );
      return;
    }

    try {
      await dispatch(
        asyncLogin({ email: email.value, password: password.value }),
      ).unwrap();

      await showSuccessDialog(
        "Berhasil masuk",
        "Selamat datang kembali di Delcom Postingan!",
      );
      router.replace("/");
    } catch (error) {
      await showErrorDialog("Gagal masuk", String(error));
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Masuk ke akun Anda
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Gunakan email dan kata sandi akun Delcom Anda.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="login-email-input"
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
              id="login-email-input"
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
            htmlFor="login-password-input"
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
              id="login-password-input"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              value={password.value}
              onChange={password.handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <button
          id="login-submit-button"
          type="submit"
          disabled={isAuthLogin}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiLogIn aria-hidden="true" />
          {isAuthLogin ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Belum punya akun?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-brand-700 hover:underline dark:text-brand-400"
        >
          Daftar sekarang
        </Link>
      </p>
    </section>
  );
}