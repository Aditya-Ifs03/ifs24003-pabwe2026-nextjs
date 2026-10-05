import { configureStore } from "@reduxjs/toolkit";

import authReducer from "@/features/auth/states/reducer";
import postsReducer from "@/features/posts/states/reducer";
import usersReducer from "@/features/users/states/reducer";

/**
 * Store Redux terpusat.
 *
 * Menggabungkan seluruh slice reducer dari fitur `auth`, `users`, dan `posts`.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    posts: postsReducer,
  },
});

/** Tipe seluruh state aplikasi. */
export type RootState = ReturnType<typeof store.getState>;

/** Tipe `dispatch` milik store (sudah mendukung thunk). */
export type AppDispatch = typeof store.dispatch;
