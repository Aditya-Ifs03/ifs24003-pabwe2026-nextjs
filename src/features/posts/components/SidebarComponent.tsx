"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FiSettings,
  FiUserCheck,
  FiUsers,
  FiX,
  FiImage,
} from "react-icons/fi";

/** Satu item navigasi pada sidebar. */
interface NavItem {
  href: string;
  label: string;
  icon: IconType;
}

/** Daftar rute utama aplikasi. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Semua Postingan", icon: FiImage },
  { href: "/?is_me=1", label: "Postingan Saya", icon: FiUserCheck },
  { href: "/users", label: "Daftar Pengguna", icon: FiUsers },
  { href: "/profile", label: "Profil Saya", icon: FiSettings },
];

/** Props {@link SidebarComponent}. */
export interface SidebarComponentProps {
  /** `true` bila drawer sidebar sedang terbuka (mobile). */
  open: boolean;
  /** Dipanggil untuk menutup drawer. */
  onClose: () => void;
}

/**
 * Bilah samping dashboard.
 *
 * Menampilkan navigasi rute utama dan berubah menjadi drawer pada perangkat
 * mobile.
 */
export default function SidebarComponent({
  open,
  onClose,
}: SidebarComponentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isFilteringMine = searchParams.get("is_me") === "1";

  /** Menentukan apakah sebuah item navigasi sedang aktif. */
  function isActive(href: string): boolean {
    if (href === "/?is_me=1") {
      return pathname === "/" && isFilteringMine;
    }

    if (href === "/") {
      return pathname === "/" && !isFilteringMine;
    }

    return pathname === href;
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 border-r border-slate-200 bg-white p-4 transition-transform duration-200 lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0 dark:border-slate-800 dark:bg-slate-950 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="absolute bottom-4 left-4 right-4 hidden text-xs leading-relaxed text-slate-400 lg:block">
          Delcom Postingan · Next.js 16 + Redux Toolkit
        </p>
      </aside>
    </>
  );
}
