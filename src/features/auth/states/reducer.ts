import { createSlice } from "@reduxjs/toolkit";

import {
  asyncLogin,
  asyncLogout,
  asyncRegister,
  setAuthLogin,
  setAuthLogout,
  setAuthRegister,
} from "./action";

/** State slice `auth`. */
export interface AuthState {
  /** `true` selama proses login berjalan. */
  isAuthLogin: boolean;
  /** `true` selama proses pendaftaran berjalan. */
  isAuthRegister: boolean;
  /** `true` selama proses logout berjalan. */
  isAuthLogout: boolean;
}

export const initialState: AuthState = {
  isAuthLogin: false,
  isAuthRegister: false,
  isAuthLogout: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(setAuthLogin, (state, action) => {
        state.isAuthLogin = action.payload;
      })
      .addCase(asyncLogin.pending, (state) => {
        state.isAuthLogin = true;
      })
      .addCase(asyncLogin.fulfilled, (state) => {
        state.isAuthLogin = false;
      })
      .addCase(asyncLogin.rejected, (state) => {
        state.isAuthLogin = false;
      })
      // Register
      .addCase(setAuthRegister, (state, action) => {
        state.isAuthRegister = action.payload;
      })
      .addCase(asyncRegister.pending, (state) => {
        state.isAuthRegister = true;
      })
      .addCase(asyncRegister.fulfilled, (state) => {
        state.isAuthRegister = false;
      })
      .addCase(asyncRegister.rejected, (state) => {
        state.isAuthRegister = false;
      })
      // Logout
      .addCase(setAuthLogout, (state, action) => {
        state.isAuthLogout = action.payload;
      })
      .addCase(asyncLogout.pending, (state) => {
        state.isAuthLogout = true;
      })
      .addCase(asyncLogout.fulfilled, (state) => {
        state.isAuthLogout = false;
      })
      .addCase(asyncLogout.rejected, (state) => {
        state.isAuthLogout = false;
      });
  },
});

export default authSlice.reducer;
