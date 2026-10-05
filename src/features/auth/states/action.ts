import { createAction, createAsyncThunk } from "@reduxjs/toolkit";

import { isSuccess, putAccessToken } from "@/helpers/apiHelper";
import type { AuthLoginRequest, AuthRegisterRequest } from "@/types/action";

import * as authApi from "../api/authApi";
import type { AuthLoginData } from "../api/authApi";

/* -------------------------------------------------------------------------- */
/*                             Action creators                                */
/* -------------------------------------------------------------------------- */

/** Menandai proses login sedang berjalan. */
export const setAuthLogin = createAction<boolean>("auth/setAuthLogin");

/** Menandai proses pendaftaran sedang berjalan. */
export const setAuthRegister = createAction<boolean>("auth/setAuthRegister");

/** Menandai proses logout sedang berjalan. */
export const setAuthLogout = createAction<boolean>("auth/setAuthLogout");

/* -------------------------------------------------------------------------- */
/*                                Async thunks                                */
/* -------------------------------------------------------------------------- */

/**
 * Thunk login.
 *
 * Bila berhasil, access token otomatis disimpan ke `localStorage` melalui
 * `putAccessToken` sehingga seluruh permintaan berikutnya terautentikasi.
 */
export const asyncLogin = createAsyncThunk<
  AuthLoginData,
  AuthLoginRequest,
  { rejectValue: string }
>("auth/asyncLogin", async (payload, { rejectWithValue }) => {
  const result = await authApi.login(payload);

  if (!isSuccess(result)) {
    return rejectWithValue(result.message);
  }

  putAccessToken(result.data.token);
  return result.data;
});

/** Thunk pendaftaran akun baru. */
export const asyncRegister = createAsyncThunk<
  string,
  AuthRegisterRequest,
  { rejectValue: string }
>("auth/asyncRegister", async (payload, { rejectWithValue }) => {
  const result = await authApi.register(payload);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return result.message;
});

/** Thunk logout: mencabut token di server lalu menghapusnya dari `localStorage`. */
export const asyncLogout = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>("auth/asyncLogout", async (_, { rejectWithValue }) => {
  const result = await authApi.logout();

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  putAccessToken(null);
  return result.message;
});
