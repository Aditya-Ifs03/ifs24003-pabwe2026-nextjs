"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiChevronDown, FiLogOut, FiMenu, FiUser } from "react-icons/fi";

import { asyncLogout } from "@/features/auth/states/action";
import { putAccessToken } from "@/helpers/apiHelper";
import { resolveImageUrl, showSuccessDialog } from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";

/** Props {@link NavbarComponent}. */
export interface NavbarComponentProps {
  /** Dipanggil saat tombol menu mobile ditekan. */
  onOpenSidebar: () => void;
}

/**
 * Bilah navigasi atas dashboard.
 *
 * Menampilkan identitas profil yang sedang aktif, avatar pengguna, dropdown
 * navigasi, dan tombol logout.
 */
export default function NavbarComponent({
  onOpenSidebar,
}: NavbarComponentProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const user = useAppSelector((state) => state.users.user);
  const isAuthLogout = useAppSelector((state) => state.auth.isAuthLogout);

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const photoUrl = resolveImageUrl(user?.photo);

  async function handleLogout(): Promise<void> {
    setDropdownOpen(false);

    await dispatch(asyncLogout());
    // Pastikan token lokal selalu dibersihkan, walau permintaan ke server gagal.
    putAccessToken(null);

    await showSuccessDialog("Berhasil keluar", "Sampai jumpa kembali!");
    router.replace("/auth/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Buka menu navigasi"
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FiMenu aria-hidden="true" size={20} />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              DP
            </span>
            <span className="hidden text-base font-bold text-slate-900 sm:inline dark:text-white">
              Delcom Postingan
            </span>
          </Link>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((previous) => !previous)}
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
            aria-label="Menu profil"
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={user?.name ?? "Foto profil"}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <FiUser aria-hidden="true" size={18} />
              </span>
            )}

            <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:inline dark:text-slate-200">
              {user?.name ?? "Pengguna"}
            </span>

            <FiChevronDown aria-hidden="true" className="text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.name ?? "Pengguna"}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email ?? "Belum ada email"}
                </p>
              </div>

              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FiUser aria-hidden="true" />
                Profil Saya
              </Link>

              <button
                type="button"
                role="menuitem"
                disabled={isAuthLogout}
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/40"
              >
                <FiLogOut aria-hidden="true" />
                {isAuthLogout ? "Keluar..." : "Keluar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
