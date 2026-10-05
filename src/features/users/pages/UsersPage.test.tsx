import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import UsersPage from "@/features/users/pages/UsersPage";
import { renderWithProviders } from "@/test-utils";
import type { User } from "@/types";

/**
 * Pengujian halaman direktori pengguna.
 *
 * Thunk `asyncGetAllUsers` digantikan mock supaya isi daftar pengguna
 * sepenuhnya ditentukan melalui `preloadedState`.
 */
const actionMocks = vi.hoisted(() => ({
  asyncGetAllUsers: vi.fn(),
}));

vi.mock("@/features/users/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/users/states/action")>();

  /**
   * Menyalin action creator `pending` / `fulfilled` / `rejected` milik thunk
   * asli, karena `extraReducers` pada `reducer.ts` mendaftarkan ketiganya
   * melalui `builder.addCase`.
   */
  const keepThunkMeta = (
    real: { pending: unknown; fulfilled: unknown; rejected: unknown },
    mock: unknown,
  ) =>
    Object.assign(mock as object, {
      pending: real.pending,
      fulfilled: real.fulfilled,
      rejected: real.rejected,
    });

  return {
    ...actual,
    asyncGetAllUsers: keepThunkMeta(
      actual.asyncGetAllUsers,
      actionMocks.asyncGetAllUsers,
    ),
  };
});

/** Membuat objek pengguna lengkap untuk kebutuhan pengujian. */
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "Budi Santoso",
    email: "budi@example.com",
    email_verified_at: null,
    photo: null,
    created_at: "2024-10-05T03:07:00.000Z",
    updated_at: "2024-10-05T03:07:00.000Z",
    ...overrides,
  };
}

const budi = makeUser();
const siti = makeUser({
  id: 2,
  name: "Siti Aminah",
  email: "siti@example.com",
});

/** State awal slice `users` yang dipakai seluruh skenario. */
function makePreloadedState(users: User[]) {
  return {
    users: {
      users,
      user: null,
      profile: null,
      isProfile: false,
      isChangeProfile: false,
      isChangeProfilePhoto: false,
      isChangeProfilePassword: false,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  actionMocks.asyncGetAllUsers.mockReturnValue({
    type: "users/asyncGetAllUsers/mock",
  });
});

describe("UsersPage", () => {
  it("memuat daftar pengguna saat halaman pertama dibuka", () => {
    renderWithProviders(<UsersPage />, {
      preloadedState: makePreloadedState([]),
    });

    expect(actionMocks.asyncGetAllUsers).toHaveBeenCalledTimes(1);
  });

  it("menampilkan empty state saat daftar pengguna kosong", () => {
    renderWithProviders(<UsersPage />, {
      preloadedState: makePreloadedState([]),
    });

    expect(
      screen.getByText("0 pengguna terdaftar di sistem."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tidak ada pengguna yang cocok."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("menampilkan kartu pengguna beserta nama dan email", () => {
    renderWithProviders(<UsersPage />, {
      preloadedState: makePreloadedState([budi, siti]),
    });

    expect(
      screen.getByText("2 pengguna terdaftar di sistem."),
    ).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("budi@example.com")).toBeInTheDocument();
    expect(screen.getByText("Siti Aminah")).toBeInTheDocument();
    expect(screen.getByText("siti@example.com")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("memfilter daftar pengguna berdasarkan nama", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, {
      preloadedState: makePreloadedState([budi, siti]),
    });

    await user.type(screen.getByLabelText("Cari pengguna"), "siti");

    expect(screen.getByText("Siti Aminah")).toBeInTheDocument();
    expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument();
    expect(
      screen.getByText("2 pengguna terdaftar di sistem."),
    ).toBeInTheDocument();
  });

  it("memfilter daftar pengguna berdasarkan email", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, {
      preloadedState: makePreloadedState([budi, siti]),
    });

    await user.type(screen.getByLabelText("Cari pengguna"), "siti@");

    expect(screen.getByText("Siti Aminah")).toBeInTheDocument();
    expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument();
  });

  it("menampilkan empty state saat pencarian tidak menemukan hasil", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, {
      preloadedState: makePreloadedState([budi, siti]),
    });

    await user.type(screen.getByLabelText("Cari pengguna"), "zzz");

    expect(
      screen.getByText("Tidak ada pengguna yang cocok."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("menampilkan ikon fallback untuk pengguna tanpa foto", () => {
    renderWithProviders(<UsersPage />, {
      preloadedState: makePreloadedState([makeUser({ photo: null })]),
    });

    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("menampilkan foto pengguna saat tersedia", () => {
    renderWithProviders(<UsersPage />, {
      preloadedState: makePreloadedState([
        makeUser({ photo: "img/profile/budi.png" }),
      ]),
    });

    expect(
      screen.getByRole("img", { name: "Budi Santoso" }),
    ).toBeInTheDocument();
  });
});
