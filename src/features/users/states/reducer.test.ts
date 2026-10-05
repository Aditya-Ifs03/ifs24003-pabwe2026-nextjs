import { describe, expect, it } from "vitest";

import {
  asyncChangeProfile,
  asyncChangeProfilePassword,
  asyncChangeProfilePhoto,
  asyncGetAllUsers,
  asyncGetProfile,
  setIsChangeProfile,
  setIsChangeProfilePassword,
  setIsChangeProfilePhoto,
  setIsProfile,
} from "@/features/users/states/action";
import usersReducer, {
  initialState,
  type UsersState,
} from "@/features/users/states/reducer";
import { makeStore } from "@/test-utils";
import type { User } from "@/types";

/**
 * Pengujian reducer slice `users`.
 *
 * Setiap `extraReducers` (action `setIs*` serta `pending` / `fulfilled` /
 * `rejected` dari kelima thunk) diuji melalui store nyata agar perilakunya
 * sama seperti pada aplikasi.
 */
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
const siti = makeUser({ id: 2, name: "Siti Aminah", email: "siti@example.com" });
const file = new File(["isi-foto"], "foto.png", { type: "image/png" });
const changeProfilePayload = { name: "Budi Baru", email: "budi.baru@example.com" };
const changePasswordPayload = {
  password: "lama123",
  new_password: "baru123",
  new_password_confirmation: "baru123",
};

/** Mengambil state slice `users` dari store pengujian. */
function getUsersState(store: ReturnType<typeof makeStore>): UsersState {
  return store.getState().users;
}

describe("usersReducer", () => {
  it("mengembalikan initialState saat state belum ada", () => {
    expect(usersReducer(undefined, { type: "unknown/action" })).toEqual(
      initialState,
    );
  });

  it("memiliki nilai initialState sesuai kontrak slice", () => {
    expect(initialState).toEqual({
      users: [],
      user: null,
      profile: null,
      isProfile: false,
      isChangeProfile: false,
      isChangeProfilePhoto: false,
      isChangeProfilePassword: false,
    });
  });

  describe("daftar pengguna", () => {
    it("asyncGetAllUsers pending tidak mengubah daftar pengguna", () => {
      const store = makeStore();

      store.dispatch(asyncGetAllUsers.pending("req-1", undefined));

      expect(getUsersState(store).users).toEqual([]);
    });

    it("asyncGetAllUsers fulfilled menyimpan daftar pengguna", () => {
      const store = makeStore();

      store.dispatch(asyncGetAllUsers.fulfilled([budi, siti], "req-1", undefined));

      expect(getUsersState(store).users).toEqual([budi, siti]);
    });

    it("asyncGetAllUsers rejected membiarkan daftar pengguna apa adanya", () => {
      const store = makeStore();

      store.dispatch(
        asyncGetAllUsers.rejected(new Error("gagal"), "req-1", undefined),
      );

      expect(getUsersState(store).users).toEqual([]);
    });
  });

  describe("profil", () => {
    it("setIsProfile mengubah penanda pemuatan profil", () => {
      const store = makeStore();

      store.dispatch(setIsProfile(true));
      expect(getUsersState(store).isProfile).toBe(true);

      store.dispatch(setIsProfile(false));
      expect(getUsersState(store).isProfile).toBe(false);
    });

    it("asyncGetProfile pending menandai profil sedang dimuat", () => {
      const store = makeStore();

      store.dispatch(asyncGetProfile.pending("req-1", undefined));

      expect(getUsersState(store).isProfile).toBe(true);
    });

    it("asyncGetProfile fulfilled mengisi user sekaligus profile", () => {
      const store = makeStore();
      store.dispatch(setIsProfile(true));

      store.dispatch(asyncGetProfile.fulfilled(budi, "req-1", undefined));

      expect(getUsersState(store).isProfile).toBe(false);
      expect(getUsersState(store).user).toEqual(budi);
      expect(getUsersState(store).profile).toEqual(budi);
    });

    it("asyncGetProfile rejected menghentikan penanda pemuatan", () => {
      const store = makeStore();
      store.dispatch(setIsProfile(true));

      store.dispatch(
        asyncGetProfile.rejected(new Error("gagal"), "req-1", undefined),
      );

      expect(getUsersState(store).isProfile).toBe(false);
      expect(getUsersState(store).profile).toBeNull();
    });
  });

  describe("ubah profil", () => {
    it("setIsChangeProfile mengubah penanda proses", () => {
      const store = makeStore();

      store.dispatch(setIsChangeProfile(true));
      expect(getUsersState(store).isChangeProfile).toBe(true);

      store.dispatch(setIsChangeProfile(false));
      expect(getUsersState(store).isChangeProfile).toBe(false);
    });

    it("asyncChangeProfile pending menandai proses berjalan", () => {
      const store = makeStore();

      store.dispatch(
        asyncChangeProfile.pending("req-1", changeProfilePayload),
      );

      expect(getUsersState(store).isChangeProfile).toBe(true);
    });

    it("asyncChangeProfile fulfilled mengisi user sekaligus profile", () => {
      const store = makeStore();
      store.dispatch(setIsChangeProfile(true));

      store.dispatch(
        asyncChangeProfile.fulfilled(budi, "req-1", changeProfilePayload),
      );

      expect(getUsersState(store).isChangeProfile).toBe(false);
      expect(getUsersState(store).user).toEqual(budi);
      expect(getUsersState(store).profile).toEqual(budi);
    });

    it("asyncChangeProfile rejected menghentikan penanda proses", () => {
      const store = makeStore();
      store.dispatch(setIsChangeProfile(true));

      store.dispatch(
        asyncChangeProfile.rejected(
          new Error("gagal"),
          "req-1",
          changeProfilePayload,
        ),
      );

      expect(getUsersState(store).isChangeProfile).toBe(false);
    });
  });

  describe("ubah foto profil", () => {
    it("setIsChangeProfilePhoto mengubah penanda proses", () => {
      const store = makeStore();

      store.dispatch(setIsChangeProfilePhoto(true));
      expect(getUsersState(store).isChangeProfilePhoto).toBe(true);

      store.dispatch(setIsChangeProfilePhoto(false));
      expect(getUsersState(store).isChangeProfilePhoto).toBe(false);
    });

    it("asyncChangeProfilePhoto pending menandai proses berjalan", () => {
      const store = makeStore();

      store.dispatch(asyncChangeProfilePhoto.pending("req-1", file));

      expect(getUsersState(store).isChangeProfilePhoto).toBe(true);
    });

    it("asyncChangeProfilePhoto fulfilled mengisi user sekaligus profile", () => {
      const store = makeStore();
      store.dispatch(setIsChangeProfilePhoto(true));

      store.dispatch(asyncChangeProfilePhoto.fulfilled(budi, "req-1", file));

      expect(getUsersState(store).isChangeProfilePhoto).toBe(false);
      expect(getUsersState(store).user).toEqual(budi);
      expect(getUsersState(store).profile).toEqual(budi);
    });

    it("asyncChangeProfilePhoto rejected menghentikan penanda proses", () => {
      const store = makeStore();
      store.dispatch(setIsChangeProfilePhoto(true));

      store.dispatch(
        asyncChangeProfilePhoto.rejected(new Error("gagal"), "req-1", file),
      );

      expect(getUsersState(store).isChangeProfilePhoto).toBe(false);
    });
  });

  describe("ubah kata sandi", () => {
    it("setIsChangeProfilePassword mengubah penanda proses", () => {
      const store = makeStore();

      store.dispatch(setIsChangeProfilePassword(true));
      expect(getUsersState(store).isChangeProfilePassword).toBe(true);

      store.dispatch(setIsChangeProfilePassword(false));
      expect(getUsersState(store).isChangeProfilePassword).toBe(false);
    });

    it("asyncChangeProfilePassword pending menandai proses berjalan", () => {
      const store = makeStore();

      store.dispatch(
        asyncChangeProfilePassword.pending("req-1", changePasswordPayload),
      );

      expect(getUsersState(store).isChangeProfilePassword).toBe(true);
    });

    it("asyncChangeProfilePassword fulfilled menghentikan penanda proses", () => {
      const store = makeStore();
      store.dispatch(setIsChangeProfilePassword(true));

      store.dispatch(
        asyncChangeProfilePassword.fulfilled(
          "Kata sandi berhasil diubah.",
          "req-1",
          changePasswordPayload,
        ),
      );

      expect(getUsersState(store).isChangeProfilePassword).toBe(false);
    });

    it("asyncChangeProfilePassword rejected menghentikan penanda proses", () => {
      const store = makeStore();
      store.dispatch(setIsChangeProfilePassword(true));

      store.dispatch(
        asyncChangeProfilePassword.rejected(
          new Error("gagal"),
          "req-1",
          changePasswordPayload,
        ),
      );

      expect(getUsersState(store).isChangeProfilePassword).toBe(false);
    });
  });
});
