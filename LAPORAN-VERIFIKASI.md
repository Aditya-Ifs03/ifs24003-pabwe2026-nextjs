# Laporan Verifikasi

Ringkasan bukti bahwa proyek `ifs24003-pabwer2026-nextjs` memenuhi seluruh
kriteria studi kasus 2.2.

## 1. Perintah dan hasilnya

| Perintah | Hasil |
| --- | --- |
| `bun run lint` | **Exit 0** — tidak ada error maupun warning. |
| `bun run typecheck` (`next typegen && tsc --noEmit`) | **Exit 0** — tidak ada galat tipe di seluruh proyek. |
| `bun run test` (`vitest run --coverage`) | **Exit 0** — 29 berkas test, 356 test lulus, coverage 100%. |
| `bun run build` (`next build`, Turbopack) | **Exit 0** — 7 rute berhasil dibangun. |

## 2. Coverage (Vitest + provider v8, threshold 100%)

```
Statements   : 100% ( 696/696 )
Branches     : 100% ( 247/247 )
Functions    : 100% ( 222/222 )
Lines        : 100% ( 679/679 )
```

Seluruh berkas sumber yang diukur berada pada 100% untuk keempat metrik:
`store.ts`, `components/Providers.tsx`, seluruh `features/auth/**`,
`features/users/**`, `features/posts/**`, `helpers/apiHelper.ts`,
`helpers/toolsHelper.ts`, `hooks/redux.ts`, `hooks/useInput.ts`, dan
`lib/config.ts`.

Berkas yang dikecualikan dari pengukuran beserta alasannya didokumentasikan pada
`vitest.config.mts` (rute `src/app/**` yang hanya berupa pembungkus tipis,
`src/server.ts` sebagai bootstrap server, `src/types/**` yang hanya berisi tipe,
serta infrastruktur pengujian `setupTests.ts`, `test-utils.tsx`, dan
`navigation-mock.ts`).

## 3. Berkas pengujian (29 berkas, sesuai naskah 2.2.8)

**Helper & Hooks** — `apiHelper.test.ts`, `toolsHelper.test.ts`,
`useInput.test.ts`, `redux.test.ts`, serta `config.test.ts` (tambahan, untuk
mencapai coverage 100% pada `lib/config.ts`).

**Modul Auth** — `authApi.test.ts`, `action.test.ts`, `reducer.test.ts`,
`AuthLayout.test.tsx`, `LoginPage.test.tsx`, `RegisterPage.test.tsx`.

**Modul Posts** — `postApi.test.ts`, `action.test.ts`, `reducer.test.ts`,
`NavbarComponent.test.tsx`, `SidebarComponent.test.tsx`, `AddModal.test.tsx`,
`ChangeModal.test.tsx`, `ChangeCoverModal.test.tsx`, `PostLayout.test.tsx`,
`HomePage.test.tsx`, `DetailPage.test.tsx`.

**Modul Users** — `userApi.test.ts`, `action.test.ts`, `reducer.test.ts`,
`UsersPage.test.tsx`, `ProfilePage.test.tsx`.

**Store & Providers** — `store.test.ts`, `Providers.test.tsx`.

## 4. Rute yang berhasil dibangun

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /auth/login
├ ○ /auth/register
├ ƒ /posts/[postId]
├ ○ /profile
└ ○ /users
```

Seluruh rute juga diuji langsung melalui server launcher (`bun run dev` dengan
`APP_PORT=3210`) dan mengembalikan HTTP 200 beserta konten yang diharapkan.

## 5. Verifikasi integrasi terhadap REST API Delcom

`apiFetch` diuji langsung terhadap server produksi
(`https://open-api.delcom.org/api/v1`):

| Pemanggilan | Hasil |
| --- | --- |
| `buildUrl("/posts")` | `https://open-api.delcom.org/api/v1/posts` |
| `buildUrl("/posts", { is_me: 1 })` | `https://open-api.delcom.org/api/v1/posts?is_me=1` |
| `buildUrl` dengan `undefined`/`null`/`""` | Nilai kosong dilewati dengan benar |
| `getAccessToken()` tanpa `window` | `null` (aman untuk SSR) |
| `GET /users/me` tanpa token | `{"status":"fail","message":"Belum melakukan autentikasi"}` |
| `POST /auth/login` dengan kredensial salah | `{"status":"fail","message":"Kredensial akun tidak ditemukan"}` |
| `PUT /users/me/password` | `{"status":"fail","message":"Sumber ini tidak tersedia"}` (HTTP 404) |

Baris terakhir memverifikasi alasan pemakaian `PUT /users/password`: jalur
`/users/me/password` yang tertulis pada naskah memang tidak tersedia di server,
sehingga implementasi memakai jalur yang benar-benar ada (lihat
`CHANGE_PASSWORD_ENDPOINT` pada `src/features/users/api/userApi.ts`).

> Catatan: pendaftaran akun baru dibatasi 3 kali per hari per alamat IP oleh
> server, sehingga pengujian alur login end-to-end perlu memakai akun yang sudah
> terdaftar.
