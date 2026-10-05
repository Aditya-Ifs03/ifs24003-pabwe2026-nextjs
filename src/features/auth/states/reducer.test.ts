import { describe, expect, it } from "vitest";

import type { AuthLoginRequest, AuthRegisterRequest } from "@/types/action";

import type { AuthLoginData } from "../api/authApi";
import {
  asyncLogin,
  asyncLogout,
  asyncRegister,
  setAuthLogin,
  setAuthLogout,
  setAuthRegister,
} from "./action";
import authReducer, { initialState, type AuthState } from "./reducer";

/** Pengujian seluruh cabang reducer slice `auth`. */

const loginRequest: AuthLoginRequest = {
  email: "siti@example.com",
  password: "rahasia123",
};

const registerRequest: AuthRegisterRequest = {
  name: "Siti Aminah",
  email: "siti@example.com",
  password: "rahasia123",
};

const loginData: AuthLoginData = {
  user: {
    id: 1,
    name: "Siti Aminah",
    email: "siti@example.com",
    email_verified_at: null,
    photo: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  token: "token-abc",
};

/** State aktif dipakai untuk memastikan nilai benar-benar berubah. */
const activeState: AuthState = {
  isAuthLogin: true,
  isAuthRegister: true,
  isAuthLogout: true,
};

describe("authReducer", () => {
  it("mengembalikan initialState untuk action yang tidak dikenal", () => {
    expect(authReducer(undefined, { type: "@@INIT" })).toEqual({
      isAuthLogin: false,
      isAuthRegister: false,
      isAuthLogout: false,
    });
    expect(initialState).toEqual({
      isAuthLogin: false,
      isAuthRegister: false,
      isAuthLogout: false,
    });
  });

  describe("setAuthLogin", () => {
    it("menyalakan isAuthLogin tanpa mengubah state awal", () => {
      const state = authReducer(initialState, setAuthLogin(true));

      expect(state.isAuthLogin).toBe(true);
      expect(state).not.toBe(initialState);
      expect(initialState.isAuthLogin).toBe(false);
    });

    it("mematikan isAuthLogin", () => {
      expect(authReducer({ ...initialState, isAuthLogin: true }, setAuthLogin(false)).isAuthLogin).toBe(false);
    });
  });

  describe("setAuthRegister", () => {
    it("menyalakan isAuthRegister tanpa mengubah state awal", () => {
      const state = authReducer(initialState, setAuthRegister(true));

      expect(state.isAuthRegister).toBe(true);
      expect(state).not.toBe(initialState);
      expect(initialState.isAuthRegister).toBe(false);
    });

    it("mematikan isAuthRegister", () => {
      expect(authReducer({ ...initialState, isAuthRegister: true }, setAuthRegister(false)).isAuthRegister).toBe(false);
    });
  });

  describe("setAuthLogout", () => {
    it("menyalakan isAuthLogout tanpa mengubah state awal", () => {
      const state = authReducer(initialState, setAuthLogout(true));

      expect(state.isAuthLogout).toBe(true);
      expect(state).not.toBe(initialState);
      expect(initialState.isAuthLogout).toBe(false);
    });

    it("mematikan isAuthLogout", () => {
      expect(authReducer({ ...initialState, isAuthLogout: true }, setAuthLogout(false)).isAuthLogout).toBe(false);
    });
  });

  describe("asyncLogin", () => {
    it("pending menyalakan isAuthLogin", () => {
      const state = authReducer(initialState, asyncLogin.pending("req-1", loginRequest));

      expect(state.isAuthLogin).toBe(true);
    });

    it("fulfilled mematikan isAuthLogin", () => {
      const state = authReducer(activeState, asyncLogin.fulfilled(loginData, "req-1", loginRequest));

      expect(state.isAuthLogin).toBe(false);
    });

    it("rejected mematikan isAuthLogin", () => {
      const state = authReducer(
        activeState,
        asyncLogin.rejected(null, "req-1", loginRequest, "Email atau kata sandi salah"),
      );

      expect(state.isAuthLogin).toBe(false);
    });
  });

  describe("asyncRegister", () => {
    it("pending menyalakan isAuthRegister", () => {
      const state = authReducer(initialState, asyncRegister.pending("req-1", registerRequest));

      expect(state.isAuthRegister).toBe(true);
    });

    it("fulfilled mematikan isAuthRegister", () => {
      const state = authReducer(
        activeState,
        asyncRegister.fulfilled("Pendaftaran berhasil", "req-1", registerRequest),
      );

      expect(state.isAuthRegister).toBe(false);
    });

    it("rejected mematikan isAuthRegister", () => {
      const state = authReducer(
        activeState,
        asyncRegister.rejected(null, "req-1", registerRequest, "Email sudah terdaftar"),
      );

      expect(state.isAuthRegister).toBe(false);
    });
  });

  describe("asyncLogout", () => {
    it("pending menyalakan isAuthLogout", () => {
      const state = authReducer(initialState, asyncLogout.pending("req-1"));

      expect(state.isAuthLogout).toBe(true);
    });

    it("fulfilled mematikan isAuthLogout", () => {
      const state = authReducer(activeState, asyncLogout.fulfilled("Berhasil keluar", "req-1"));

      expect(state.isAuthLogout).toBe(false);
    });

    it("rejected mematikan isAuthLogout", () => {
      const state = authReducer(activeState, asyncLogout.rejected(null, "req-1", undefined, "Gagal keluar"));

      expect(state.isAuthLogout).toBe(false);
    });
  });
});
