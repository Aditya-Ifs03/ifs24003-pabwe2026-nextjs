"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { FiFeather } from "react-icons/fi";

import { getAccessToken } from "@/helpers/apiHelper";

/** Fitur unggulan yang ditampilkan pada banner. */
const HIGHLIGHTS = [
  "Publikasikan momen dan gagasanmu dalam hitungan detik.",
  "Sukai dan komentari postingan pengguna lain.",
  "Kelola profil, foto, dan kata sandi dengan aman.",
];

/**
 * Shell layout halaman autentikasi.
 *
 * Menampilkan banner responsif di sisi kiri dan formulir di sisi kanan, serta
 * mengalihkan pengguna ke dashboard apabila sesi login sudah aktif.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Proteksi: pengguna yang sudah punya token tidak perlu melihat halaman auth.
    if (getAccessToken()) {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <FiFeather aria-hidden="true" />
            Delcom Postingan
          </span>

          <h1 className="mt-8 text-4xl font-bold leading-tight">
            Bagikan cerita, <br />
            bangun diskusi.
          </h1>
          <p className="mt-4 max-w-md text-base text-white/80">
            Aplikasi linimasa postingan berbasis Next.js dan REST API Delcom Open
            API.
          </p>
        </div>

        <ul className="relative mt-12 space-y-4">
          {HIGHLIGHTS.map((highlight) => (
            <li key={highlight} className="flex items-start gap-3 text-white/90">
              <span
                aria-hidden="true"
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white"
              />
              <span className="text-sm leading-relaxed">{highlight}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
