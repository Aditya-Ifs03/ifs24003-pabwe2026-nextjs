import { createAction, createAsyncThunk } from "@reduxjs/toolkit";

import { isSuccess } from "@/helpers/apiHelper";
import type { User } from "@/types";
import type {
  UserChangePasswordRequest,
  UserChangeProfileRequest,
} from "@/types/action";

import * as userApi from "../api/userApi";

/* -------------------------------------------------------------------------- */
/*                             Action creators                                */
/* -------------------------------------------------------------------------- */

/** Menandai proses pemuatan profil. */
export const setIsProfile = createAction<boolean>("users/setIsProfile");

/** Menandai proses perubahan profil. */
export const setIsChangeProfile = createAction<boolean>(
  "users/setIsChangeProfile",
);

/** Menandai proses perubahan foto profil. */
export const setIsChangeProfilePhoto = createAction<boolean>(
  "users/setIsChangeProfilePhoto",
);

/** Menandai proses perubahan kata sandi. */
export const setIsChangeProfilePassword = createAction<boolean>(
  "users/setIsChangeProfilePassword",
);

/* -------------------------------------------------------------------------- */
/*                                Async thunks                                */
/* -------------------------------------------------------------------------- */

/** Mengambil daftar seluruh pengguna. */
export const asyncGetAllUsers = createAsyncThunk<
  User[],
  void,
  { rejectValue: string }
>("users/asyncGetAllUsers", async (_, { rejectWithValue }) => {
  const result = await userApi.getAllUsers();

  if (!isSuccess(result)) {
    return rejectWithValue(result.message);
  }

  return result.data.users;
});

/** Mengambil profil pengguna yang sedang login. */
export const asyncGetProfile = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("users/asyncGetProfile", async (_, { rejectWithValue }) => {
  const result = await userApi.getMyProfile();

  if (!isSuccess(result)) {
    return rejectWithValue(result.message);
  }

  return result.data.user;
});

/** Memperbarui nama & email profil pengguna. */
export const asyncChangeProfile = createAsyncThunk<
  User,
  UserChangeProfileRequest,
  { rejectValue: string }
>("users/asyncChangeProfile", async (payload, { rejectWithValue }) => {
  const result = await userApi.updateMyProfile(payload);

  if (!isSuccess(result)) {
    return rejectWithValue(result.message);
  }

  return result.data.user;
});

/** Mengunggah foto profil baru. */
export const asyncChangeProfilePhoto = createAsyncThunk<
  User,
  File,
  { rejectValue: string }
>("users/asyncChangeProfilePhoto", async (photo, { rejectWithValue }) => {
  const result = await userApi.updateMyPhoto(photo);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  // Respons unggah foto tidak dijamin menyertakan objek pengguna (dokumentasi
  // API tidak mencantumkan bentuk `data`-nya), sehingga profil selalu dibaca
  // ulang agar state `user`/`profile` pasti sinkron dengan server.
  const refreshed = await userApi.getMyProfile();

  if (!isSuccess(refreshed)) {
    return rejectWithValue(refreshed.message);
  }

  return refreshed.data.user;
});

/** Mengubah kata sandi pengguna. */
export const asyncChangeProfilePassword = createAsyncThunk<
  string,
  UserChangePasswordRequest,
  { rejectValue: string }
>("users/asyncChangeProfilePassword", async (payload, { rejectWithValue }) => {
  const result = await userApi.changeMyPassword(payload);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return result.message;
});
