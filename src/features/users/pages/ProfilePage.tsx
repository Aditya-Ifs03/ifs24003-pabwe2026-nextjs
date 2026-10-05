"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  FiCheck,
  FiKey,
  FiLock,
  FiMail,
  FiUpload,
  FiUser,
} from "react-icons/fi";

import { MIN_PASSWORD_LENGTH } from "@/features/auth/pages/RegisterPage";
import {
  asyncChangeProfile,
  asyncChangeProfilePassword,
  asyncChangeProfilePhoto,
  asyncGetProfile,
} from "@/features/users/states/action";
import {
  resolveImageUrl,
  showErrorDialog,
  showSuccessDialog,
} from "@/helpers/toolsHelper";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import useInput from "@/hooks/useInput";

/**
 * Halaman pengaturan akun dan profil pengguna.
 *
 * Menyediakan tiga formulir: pembaruan identitas (nama & email), unggah foto
 * profil, serta perubahan kata sandi.
 */
export default function ProfilePage() {
  const dispatch = useAppDispatch();

  const profile = useAppSelector((state) => state.users.profile);
  const isChangeProfile = useAppSelector(
    (state) => state.users.isChangeProfile,
  );
  const isChangeProfilePhoto = useAppSelector(
    (state) => state.users.isChangeProfilePhoto,
  );
  const isChangeProfilePassword = useAppSelector(
    (state) => state.users.isChangeProfilePassword,
  );

  const name = useInput("");
  const email = useInput("");
  const currentPassword = useInput("");
  const newPassword = useInput("");
  const confirmPassword = useInput("");

  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { setValue: setName } = name;
  const { setValue: setEmail } = email;

  useEffect(() => {
    void dispatch(asyncGetProfile());
  }, [dispatch]);

  // Isi formulir identitas dengan data profil terbaru.
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile, setName, setEmail]);

  if (!profile) {
    return (
      <div
        aria-busy="true"
        aria-label="Memuat profil"
        className="h-96 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/70"
      />
    );
  }

  const photoUrl = resolveImageUrl(profile.photo);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>): void {
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

    setPhoto(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleProfileSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const hasEmptyField = [name.value, email.value].some(
      (value) => value.trim().length === 0,
    );

    if (hasEmptyField) {
      await showErrorDialog(
        "Data belum lengkap",
        "Nama dan email wajib diisi.",
      );
      return;
    }

    try {
      await dispatch(
        asyncChangeProfile({ name: name.value, email: email.value }),
      ).unwrap();

      await showSuccessDialog("Berhasil", "Profil berhasil diperbarui.");
    } catch (error) {
      await showErrorDialog("Gagal memperbarui profil", String(error));
    }
  }

  async function handlePhotoSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!photo) {
      await showErrorDialog(
        "Belum ada berkas",
        "Pilih foto profil terlebih dahulu.",
      );
      return;
    }

    try {
      await dispatch(asyncChangeProfilePhoto(photo)).unwrap();

      await showSuccessDialog("Berhasil", "Foto profil berhasil diperbarui.");

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPhoto(null);
      setPreviewUrl(null);
    } catch (error) {
      await showErrorDialog("Gagal mengunggah foto", String(error));
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const hasEmptyField = [
      currentPassword.value,
      newPassword.value,
      confirmPassword.value,
    ].some((value) => value.trim().length === 0);

    if (hasEmptyField) {
      await showErrorDialog(
        "Data belum lengkap",
        "Semua kolom kata sandi wajib diisi.",
      );
      return;
    }

    if (newPassword.value !== confirmPassword.value) {
      await showErrorDialog(
        "Konfirmasi tidak cocok",
        "Konfirmasi kata sandi baru tidak sama.",
      );
      return;
    }

    if (newPassword.value.length < MIN_PASSWORD_LENGTH) {
      await showErrorDialog(
        "Kata sandi terlalu pendek",
        `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`,
      );
      return;
    }

    try {
      await dispatch(
        asyncChangeProfilePassword({
          password: currentPassword.value,
          new_password: newPassword.value,
          new_password_confirmation: confirmPassword.value,
        }),
      ).unwrap();

      await showSuccessDialog("Berhasil", "Kata sandi berhasil diubah.");

      currentPassword.reset();
      newPassword.reset();
      confirmPassword.reset();
    } catch (error) {
      await showErrorDialog("Gagal mengubah kata sandi", String(error));
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Profil Saya
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kelola identitas, foto, dan keamanan akun Anda.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <form
          onSubmit={handlePhotoSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Foto Profil
          </h2>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Pratinjau foto profil"
              className="mx-auto mt-4 h-28 w-28 rounded-full object-cover"
            />
          ) : photoUrl ? (
            <Image
              src={photoUrl}
              alt={profile.name}
              width={112}
              height={112}
              unoptimized
              className="mx-auto mt-4 h-28 w-28 rounded-full object-cover"
            />
          ) : (
            <span className="mx-auto mt-4 grid h-28 w-28 place-items-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              <FiUser aria-hidden="true" size={40} />
            </span>
          )}

          <input
            id="profile-photo"
            name="photo"
            type="file"
            accept="image/*"
            aria-label="Pilih foto profil"
            onChange={handlePhotoChange}
            className="mt-4 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-xs text-slate-600 file:mr-2 file:rounded-l-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
          />

          <button
            type="submit"
            disabled={isChangeProfilePhoto}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiUpload aria-hidden="true" />
            {isChangeProfilePhoto ? "Mengunggah..." : "Unggah Foto"}
          </button>
        </form>

        <div className="space-y-6">
          <form
            onSubmit={handleProfileSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Identitas
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-name"
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
                    id="profile-name"
                    name="name"
                    type="text"
                    value={name.value}
                    onChange={name.handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-email"
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
                    id="profile-email"
                    name="email"
                    type="email"
                    value={email.value}
                    onChange={email.handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangeProfile}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCheck aria-hidden="true" />
              {isChangeProfile ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </form>

          <form
            onSubmit={handlePasswordSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <FiKey aria-hidden="true" />
              Ubah Kata Sandi
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="profile-current-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <FiLock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="profile-current-password"
                    name="password"
                    type="password"
                    value={currentPassword.value}
                    onChange={currentPassword.handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-new-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <FiLock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="profile-new-password"
                    name="new_password"
                    type="password"
                    value={newPassword.value}
                    onChange={newPassword.handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-confirm-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Konfirmasi
                </label>
                <div className="relative">
                  <FiLock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="profile-confirm-password"
                    name="new_password_confirmation"
                    type="password"
                    value={confirmPassword.value}
                    onChange={confirmPassword.handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangeProfilePassword}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <FiKey aria-hidden="true" />
              {isChangeProfilePassword ? "Menyimpan..." : "Ubah Kata Sandi"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
