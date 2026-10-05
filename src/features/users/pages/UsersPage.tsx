"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FiMail, FiSearch, FiUser, FiUsers } from "react-icons/fi";

import { asyncGetAllUsers } from "@/features/users/states/action";
import { resolveImageUrl } from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";

/**
 * Halaman direktori pengguna.
 *
 * Menampilkan seluruh pengguna terdaftar beserta fitur pencarian berdasarkan
 * nama atau email.
 */
export default function UsersPage() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users.users);

  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    void dispatch(asyncGetAllUsers());
  }, [dispatch]);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(normalizedKeyword) ||
      user.email.toLowerCase().includes(normalizedKeyword),
  );

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Daftar Pengguna
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {users.length} pengguna terdaftar di sistem.
        </p>
      </section>

      <div className="relative">
        <FiSearch
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          name="search-user"
          aria-label="Cari pengguna"
          placeholder="Cari nama atau email pengguna..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </div>

      {visibleUsers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <FiUsers
            aria-hidden="true"
            className="mx-auto text-slate-300"
            size={36}
          />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            Tidak ada pengguna yang cocok.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleUsers.map((user) => {
            const photoUrl = resolveImageUrl(user.photo);

            return (
              <li
                key={user.id}
                className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900"
              >
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={user.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <FiUser aria-hidden="true" size={20} />
                  </span>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    <FiMail aria-hidden="true" />
                    {user.email}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
