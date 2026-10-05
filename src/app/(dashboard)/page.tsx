import { Suspense } from "react";

import HomePage from "@/features/posts/pages/HomePage";

/**
 * Rute `/` — linimasa postingan.
 *
 * `HomePage` memakai `useSearchParams()` untuk membaca filter `is_me`, sehingga
 * wajib dibungkus `<Suspense>` agar proses `next build` berhasil.
 */
export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          aria-label="Memuat halaman"
          className="h-96 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/70"
        />
      }
    >
      <HomePage />
    </Suspense>
  );
}
