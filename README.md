# ifs24003-pabwer2026-nextjs

Aplikasi linimasa postingan (studi kasus **2.2 Aplikasi Postingan**) yang dibangun
dengan **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Redux Toolkit**,
menggunakan **REST API Delcom Open API** sebagai sumber data, dan **Bun** sebagai
package manager sekaligus runtime server.

---

## 1. Prasyarat

| Kebutuhan | Versi minimum |
| --- | --- |
| Bun | 1.2+ (proyek ini diuji dengan 1.4.2) |
| Node.js | 20.9+ (dipakai oleh `next build` dan Vitest) |
| TypeScript | 5.1+ |

## 2. Menjalankan aplikasi

```bash
# 1. Pasang dependensi
bun install

# 2. Siapkan berkas lingkungan
cp .env.example .env

# 3. Jalankan server pengembangan (memakai src/server.ts)
bun run dev
```

Aplikasi berjalan pada `http://localhost:${APP_PORT}` (bawaan `3000`).

### Daftar perintah

| Perintah | Kegunaan |
| --- | --- |
| `bun run dev` | Menjalankan `src/server.ts` (server launcher TypeScript). |
| `bun run dev:next` | Menjalankan `next dev` langsung tanpa server launcher. |
| `bun run build` | Build produksi (`next build`, Turbopack). |
| `bun run start` | Menjalankan server launcher dalam mode produksi. |
| `bun run lint` | Menjalankan ESLint. |
| `bun run typecheck` | `next typegen` lalu `tsc --noEmit`. |
| `bun run test` | Menjalankan Vitest sekali jalan **beserta coverage** (threshold 100%). |
| `bun run test:watch` | Menjalankan Vitest dalam mode watch. |

## 3. Konfigurasi lingkungan

Berkas `.env` dan `.env.example` memuat:

```dotenv
NEXT_PUBLIC_DELCOM_BASEURL=https://open-api.delcom.org/api/v1
APP_PORT=3000
```

- `NEXT_PUBLIC_DELCOM_BASEURL` — base URL REST API Delcom. Dibaca terpusat di
  `src/lib/config.ts`. Awalan `NEXT_PUBLIC_` diperlukan agar nilainya tersedia di
  sisi browser (Client Component).
- `APP_PORT` — port server. Dibaca oleh `src/server.ts` melalui `loadEnvConfig`
  dari `@next/env`. Bila tidak ada di `.env`, nilainya dicari di `.env.example`,
  lalu jatuh ke `3000`.

> Berkas `.env*` **wajib** berada di root proyek (bukan di dalam `src/`), sesuai
> perilaku Next.js.

## 4. Struktur proyek

```
src/
├── app/                                  # Rute App Router (pembungkus tipis)
│   ├── layout.tsx                        # Root layout: Google Font + globals.css + Providers
│   ├── globals.css                       # Tailwind v4 + token desain (@theme)
│   ├── auth/
│   │   ├── layout.tsx                    # Membungkus AuthLayout
│   │   ├── login/page.tsx                # /auth/login
│   │   └── register/page.tsx             # /auth/register
│   └── (dashboard)/                      # Route group → tidak muncul di URL
│       ├── layout.tsx                    # Membungkus PostLayout (route guarding)
│       ├── page.tsx                      # /            (HomePage)
│       ├── posts/[postId]/page.tsx       # /posts/:id   (DetailPage)
│       ├── users/page.tsx                # /users       (UsersPage)
│       └── profile/page.tsx              # /profile     (ProfilePage)
├── components/Providers.tsx              # <Provider store={store}> (Client Component)
├── features/
│   ├── auth/
│   │   ├── api/authApi.ts
│   │   ├── states/{action,reducer}.ts
│   │   ├── layouts/AuthLayout.tsx
│   │   └── pages/{LoginPage,RegisterPage}.tsx
│   ├── users/
│   │   ├── api/userApi.ts
│   │   ├── states/{action,reducer}.ts
│   │   └── pages/{UsersPage,ProfilePage}.tsx
│   └── posts/
│       ├── api/postApi.ts
│       ├── states/{action,reducer}.ts
│       ├── layouts/PostLayout.tsx
│       ├── components/NavbarComponent.tsx
│       ├── components/SidebarComponent.tsx
│       ├── components/modals/{AddModal,ChangeModal,ChangeCoverModal}.tsx
│       └── pages/{HomePage,DetailPage}.tsx
├── helpers/
│   ├── apiHelper.ts                      # Wrapper fetch + bearer token + localStorage
│   └── toolsHelper.ts                    # Dialog SweetAlert2 + formatDate + resolveImageUrl
├── hooks/
│   ├── useInput.ts                       # Two-way data binding formulir
│   └── redux.ts                          # useAppDispatch / useAppSelector bertipe
├── lib/config.ts                         # DELCOM_BASEURL & APP_PORT
├── types/{index,action}.ts               # Interface model & tipe payload action
├── server.ts                             # Server launcher (APP_PORT dinamis)
├── setupTests.ts                         # Setup Vitest + jsdom
├── test-utils.tsx                        # renderWithProviders + mock navigasi Next.js
└── store.ts                              # configureStore terpusat
```

## 5. Arsitektur state (Redux Toolkit)

`src/store.ts` menggabungkan tiga slice:

| Slice | State |
| --- | --- |
| `auth` | `isAuthLogin`, `isAuthRegister`, `isAuthLogout` |
| `users` | `users`, `user`, `profile`, `isProfile`, `isChangeProfile`, `isChangeProfilePhoto`, `isChangeProfilePassword` |
| `posts` | `posts`, `post`, `isPost`, serta 8 pasang flag mutasi (`isPostAdd`/`isPostAdded`, `isPostChange`/`isPostChanged`, `isPostChangeCover`/`isPostChangedCover`, `isPostDelete`/`isPostDeleted`, `isPostLike`/`isPostLiked`, `isPostAddComment`/`isPostAddedComment`, `isPostDeleteComment`/`isPostDeletedComment`, `isPostDeleteAll`/`isPostDeletedAll`) |

Setiap thunk asinkron menangani tiga fase (`pending` → `fulfilled` / `rejected`)
sehingga indikator muat dan status keberhasilan dapat dibedakan di UI.

## 6. Endpoint REST API yang dipakai

Base URL: `https://open-api.delcom.org/api/v1`

**Auth** (`src/features/auth/api/authApi.ts`)

| Fungsi | Endpoint |
| --- | --- |
| `login` | `POST /auth/login` |
| `register` | `POST /auth/register` |
| `logout` | `POST /auth/logout` |

**Users** (`src/features/users/api/userApi.ts`)

| Fungsi | Endpoint |
| --- | --- |
| `getAllUsers` | `GET /users` |
| `getMyProfile` | `GET /users/me` |
| `updateMyProfile` | `PUT /users/me` |
| `updateMyPhoto` | `POST /users/me/photo` (multipart) |
| `changeMyPassword` | `PUT /users/password` |

**Posts** (`src/features/posts/api/postApi.ts`)

| Fungsi | Endpoint |
| --- | --- |
| `getAllPosts(isMe)` | `GET /posts` (opsional `?is_me=1`) |
| `getPostById` | `GET /posts/:id` |
| `addPost` | `POST /posts` |
| `changePost` | `PUT /posts/:id` |
| `changePostCover` | `POST /posts/:id/cover` (multipart) |
| `deletePost` | `DELETE /posts/:id` |
| `likePost` | `POST /posts/:id/likes` |
| `addComment` | `POST /posts/:id/comments` |
| `deleteComment` | `DELETE /posts/:id/comments` |
| `deleteAllPosts` | `DELETE /posts` |

### Catatan penyimpangan dari naskah studi kasus

Naskah menuliskan ubah kata sandi pada `PUT /users/me/password`, sedangkan
dokumentasi resmi Delcom Open API — dan hasil verifikasi langsung ke server —
menyediakan **`PUT /users/password`** (`/users/me/password` menjawab HTTP 404).
Implementasi memakai jalur yang benar-benar tersedia, dan hal ini didokumentasikan
pada komentar `CHANGE_PASSWORD_ENDPOINT` di `src/features/users/api/userApi.ts`.

## 7. Pengujian otomatis

```bash
bun run test          # sekali jalan + coverage (threshold 100%)
bun run test:watch    # mode watch
```

- Konfigurasi: `vitest.config.mts` (environment `jsdom`, `pool: "threads"`,
  plugin React, coverage provider **v8** dengan threshold **100%** untuk
  `lines`, `functions`, `branches`, dan `statements`).
- Setup: `src/setupTests.ts` (ekstensi `@testing-library/jest-dom`, mock global
  `next/navigation`, stub API jsdom yang belum tersedia).
- Helper: `src/test-utils.tsx` (`renderWithProviders`, `makeStore`,
  `setRouteParams`, `setSearchParams`, `setPathname`).

Berkas yang dikecualikan dari pengukuran coverage beserta alasannya tercantum
langsung pada `vitest.config.mts`:

| Kecuali | Alasan |
| --- | --- |
| `src/app/**` | Hanya pembungkus tipis (<2 baris) yang merender komponen dari `features/`, dan tidak termasuk daftar pengujian pada naskah 2.2.8. |
| `src/server.ts` | Bootstrap server: menjalankan `app.prepare()` dan `listen()`, dijalankan di luar proses pengujian. |
| `src/types/**` | Berisi deklarasi tipe saja (tanpa kode runtime). |
| `src/setupTests.ts`, `src/test-utils.tsx` | Infrastruktur pengujian, bukan kode aplikasi. |
| `src/**/*.{test,spec}.{ts,tsx}` | Berkas pengujian itu sendiri. |

## 8. Catatan konfigurasi Next.js 16

Next.js 16 membawa beberapa perubahan besar. Yang relevan untuk proyek ini:

1. **`params` dan `searchParams` adalah `Promise`** — akses sinkron sudah
   dihapus. Lihat `src/app/(dashboard)/posts/[postId]/page.tsx` yang melakukan
   `const { postId } = await params`.
2. **Turbopack aktif secara bawaan** untuk `next dev` dan `next build`, sehingga
   flag `--turbopack` tidak lagi diperlukan. Konfigurasi Turbopack kini berada di
   opsi tingkat atas `turbopack` (bukan `experimental.turbopack`).
3. **`useSearchParams()` pada Client Component wajib dibungkus `<Suspense>`**
   agar `next build` berhasil. `HomePage` memakai hook tersebut, sehingga
   `src/app/(dashboard)/page.tsx` membungkusnya dengan `<Suspense>`.
4. **`next build` tidak lagi menjalankan lint**, dan kunci `eslint` pada
   `next.config.ts` sudah dihapus.
5. **Optimasi gambar lokal diblokir secara bawaan** (`images.dangerouslyAllowLocalIP`).
   Karena cover/foto dapat berasal dari `http://127.0.0.1:8000`, proyek ini
   memakai `images.unoptimized: true` — berkas disajikan apa adanya sehingga
   pemeriksaan host/`remotePatterns` dan pembatasan IP lokal tidak relevan.

Dua opsi eksperimental berikut dipakai secara sadar pada `next.config.ts`:

- `experimental.useTypeScriptCli: false` — menjalankan pemeriksaan tipe melalui
  TypeScript JavaScript compiler API (in-process) alih-alih memanggil proses
  `tsc` terpisah. Pemeriksaan tipe tetap dijalankan dan tetap menggagalkan build
  bila ada galat. Ini juga merupakan satu-satunya jalur yang bekerja pada
  lingkungan yang melarang pembuatan child process.
- `experimental.workerThreads: true` — menjalankan worker Next.js (pemeriksaan
  tipe & static generation) sebagai *thread* alih-alih proses terpisah: lebih
  hemat memori dan tetap bekerja pada lingkungan yang membatasi child process.

## 9. Tipografi

Google Font diintegrasikan melalui `next/font/google` pada `src/app/layout.tsx`:

- **Plus Jakarta Sans** → variabel CSS `--font-plus-jakarta-sans`, dipetakan ke
  utility `font-sans`.
- **JetBrains Mono** → variabel CSS `--font-jetbrains-mono`, dipetakan ke
  utility `font-mono`.

Pemetaan dilakukan pada blok `@theme inline` di `src/app/globals.css`
(Tailwind CSS v4).

## 10. Alur pemakaian aplikasi

1. Buka `/auth/register` untuk membuat akun, lalu masuk melalui `/auth/login`.
2. Setelah login, access token disimpan di `localStorage` dan seluruh permintaan
   berikutnya otomatis menyertakan header `Authorization: Bearer <token>`.
3. `/` menampilkan linimasa postingan dengan pencarian langsung dan tab filter
   **Semua** / **Postingan Saya** (`?is_me=1`).
4. `/posts/:id` menampilkan rincian postingan, tombol suka, daftar komentar,
   formulir komentar, serta aksi ubah cover / ubah postingan / hapus postingan
   bila postingan tersebut milik pengguna yang sedang login.
5. `/users` menampilkan direktori pengguna dengan pencarian; `/profile`
   menyediakan pembaruan identitas, unggah foto profil, dan ubah kata sandi.
