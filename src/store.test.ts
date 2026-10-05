import { describe, expect, it } from "vitest";

import { store } from "@/store";

describe("store", () => {
  it("menggabungkan seluruh slice reducer fitur", () => {
    expect(Object.keys(store.getState()).sort()).toEqual([
      "auth",
      "posts",
      "users",
    ]);
  });

  it("memiliki state awal slice auth", () => {
    expect(store.getState().auth).toEqual({
      isAuthLogin: false,
      isAuthRegister: false,
      isAuthLogout: false,
    });
  });

  it("memiliki state awal slice users", () => {
    expect(store.getState().users).toEqual({
      users: [],
      user: null,
      profile: null,
      isProfile: false,
      isChangeProfile: false,
      isChangeProfilePhoto: false,
      isChangeProfilePassword: false,
    });
  });

  it("memiliki state awal slice posts", () => {
    const { posts } = store.getState();

    expect(posts.posts).toEqual([]);
    expect(posts.post).toBeNull();
    expect(posts.isPost).toBe(false);
  });

  it("dapat menerima action melalui dispatch", () => {
    store.dispatch({ type: "auth/setAuthLogin", payload: true });
    expect(store.getState().auth.isAuthLogin).toBe(true);

    store.dispatch({ type: "auth/setAuthLogin", payload: false });
    expect(store.getState().auth.isAuthLogin).toBe(false);
  });
});
