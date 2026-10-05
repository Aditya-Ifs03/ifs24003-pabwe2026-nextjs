import { createSlice } from "@reduxjs/toolkit";

import type { User } from "@/types";

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
} from "./action";

/** State slice `users`. */
export interface UsersState {
  /** Daftar seluruh pengguna sistem. */
  users: User[];
  /** Data pengguna yang sedang login (dipakai Navbar). */
  user: User | null;
  /** Data profil yang ditampilkan / disunting pada halaman profil. */
  profile: User | null;
  /** `true` selama profil sedang dimuat. */
  isProfile: boolean;
  /** `true` selama proses perubahan profil berjalan. */
  isChangeProfile: boolean;
  /** `true` selama proses unggah foto profil berjalan. */
  isChangeProfilePhoto: boolean;
  /** `true` selama proses perubahan kata sandi berjalan. */
  isChangeProfilePassword: boolean;
}

export const initialState: UsersState = {
  users: [],
  user: null,
  profile: null,
  isProfile: false,
  isChangeProfile: false,
  isChangeProfilePhoto: false,
  isChangeProfilePassword: false,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ----------------------------- Daftar pengguna ----------------------------- */
      .addCase(asyncGetAllUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      /* --------------------------------- Profil --------------------------------- */
      .addCase(setIsProfile, (state, action) => {
        state.isProfile = action.payload;
      })
      .addCase(asyncGetProfile.pending, (state) => {
        state.isProfile = true;
      })
      .addCase(asyncGetProfile.fulfilled, (state, action) => {
        state.isProfile = false;
        state.user = action.payload;
        state.profile = action.payload;
      })
      .addCase(asyncGetProfile.rejected, (state) => {
        state.isProfile = false;
      })
      /* ---------------------------- Ubah profil (bio) ---------------------------- */
      .addCase(setIsChangeProfile, (state, action) => {
        state.isChangeProfile = action.payload;
      })
      .addCase(asyncChangeProfile.pending, (state) => {
        state.isChangeProfile = true;
      })
      .addCase(asyncChangeProfile.fulfilled, (state, action) => {
        state.isChangeProfile = false;
        state.user = action.payload;
        state.profile = action.payload;
      })
      .addCase(asyncChangeProfile.rejected, (state) => {
        state.isChangeProfile = false;
      })
      /* ------------------------------ Ubah foto profil ----------------------------- */
      .addCase(setIsChangeProfilePhoto, (state, action) => {
        state.isChangeProfilePhoto = action.payload;
      })
      .addCase(asyncChangeProfilePhoto.pending, (state) => {
        state.isChangeProfilePhoto = true;
      })
      .addCase(asyncChangeProfilePhoto.fulfilled, (state, action) => {
        state.isChangeProfilePhoto = false;
        state.user = action.payload;
        state.profile = action.payload;
      })
      .addCase(asyncChangeProfilePhoto.rejected, (state) => {
        state.isChangeProfilePhoto = false;
      })
      /* --------------------------- Ubah kata sandi --------------------------- */
      .addCase(setIsChangeProfilePassword, (state, action) => {
        state.isChangeProfilePassword = action.payload;
      })
      .addCase(asyncChangeProfilePassword.pending, (state) => {
        state.isChangeProfilePassword = true;
      })
      .addCase(asyncChangeProfilePassword.fulfilled, (state) => {
        state.isChangeProfilePassword = false;
      })
      .addCase(asyncChangeProfilePassword.rejected, (state) => {
        state.isChangeProfilePassword = false;
      });
  },
});

export default usersSlice.reducer;
