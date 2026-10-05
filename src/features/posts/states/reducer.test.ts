import { describe, expect, it } from "vitest";

import type { Post } from "@/types";

import * as actions from "./action";
import postsReducer, { initialState } from "./reducer";
import type { PostsState } from "./reducer";

/* -------------------------------------------------------------------------- */
/*                              Helper pengujian                              */
/* -------------------------------------------------------------------------- */

/**
 * Bentuk aksi buatan yang cukup untuk menjalankan `extraReducers`.
 *
 * Ditulis sebagai type alias (bukan `interface`) supaya memiliki implicit index
 * signature dan dapat dipakai langsung sebagai `UnknownAction` Redux.
 */
type AksiUji = {
  type: string;
  payload?: unknown;
};

/** Menjalankan reducer dengan aksi pending/fulfilled/rejected buatan. */
function terapkan(state: PostsState, aksi: AksiUji): PostsState {
  return postsReducer(state, aksi);
}

/** State awal dengan beberapa field ditimpa. */
function stateDengan(timpa: Partial<PostsState>): PostsState {
  return { ...initialState, ...timpa };
}

/* -------------------------------------------------------------------------- */
/*                                  Data uji                                  */
/* -------------------------------------------------------------------------- */

const postSatu: Post = {
  id: 1,
  user_id: 2,
  cover: null,
  description: "Postingan pertama",
  created_at: "2026-01-01T08:00:00.000Z",
  updated_at: "2026-01-01T08:00:00.000Z",
  author: { name: "Adit", photo: null },
  likes: [],
  comments: [],
};

const postDua: Post = {
  ...postSatu,
  id: 2,
  description: "Postingan kedua",
};

/* -------------------------------------------------------------------------- */
/*                                initialState                                */
/* -------------------------------------------------------------------------- */

describe("initialState", () => {
  it("berisi nilai awal untuk seluruh field state", () => {
    expect(initialState).toEqual({
      posts: [],
      post: null,
      isPost: false,

      isPostAdd: false,
      isPostAdded: false,

      isPostChange: false,
      isPostChanged: false,

      isPostChangeCover: false,
      isPostChangedCover: false,

      isPostDelete: false,
      isPostDeleted: false,

      isPostLike: false,
      isPostLiked: false,

      isPostAddComment: false,
      isPostAddedComment: false,

      isPostDeleteComment: false,
      isPostDeletedComment: false,

      isPostDeleteAll: false,
      isPostDeletedAll: false,
    });

    expect(Object.keys(initialState)).toHaveLength(19);
  });

  it("menjadi state awal saat reducer dipanggil tanpa state", () => {
    expect(postsReducer(undefined, { type: "posts/tidakDikenal" })).toEqual(
      initialState,
    );
  });

  it("mengabaikan aksi yang tidak dikenal", () => {
    expect(terapkan(initialState, { type: "posts/tidakDikenal" })).toEqual(
      initialState,
    );
  });
});

/* -------------------------------------------------------------------------- */
/*                          Ambil koleksi / detail                            */
/* -------------------------------------------------------------------------- */

describe("asyncGetAllPosts", () => {
  it("pending mengeset isPost true", () => {
    const hasil = terapkan(initialState, {
      type: actions.asyncGetAllPosts.pending.type,
    });

    expect(hasil.isPost).toBe(true);
  });

  it("fulfilled mengisi posts dan mengeset isPost false", () => {
    const daftar = [postSatu, postDua];
    const hasil = terapkan(stateDengan({ isPost: true }), {
      type: actions.asyncGetAllPosts.fulfilled.type,
      payload: daftar,
    });

    expect(hasil.posts).toEqual(daftar);
    expect(hasil.isPost).toBe(false);
  });

  it("rejected mengeset isPost false", () => {
    const hasil = terapkan(stateDengan({ isPost: true }), {
      type: actions.asyncGetAllPosts.rejected.type,
    });

    expect(hasil.isPost).toBe(false);
  });
});

describe("asyncGetPostById", () => {
  it("pending mengeset isPost true", () => {
    const hasil = terapkan(initialState, {
      type: actions.asyncGetPostById.pending.type,
    });

    expect(hasil.isPost).toBe(true);
  });

  it("fulfilled mengisi post dan mengeset isPost false", () => {
    const hasil = terapkan(stateDengan({ isPost: true }), {
      type: actions.asyncGetPostById.fulfilled.type,
      payload: postSatu,
    });

    expect(hasil.post).toEqual(postSatu);
    expect(hasil.isPost).toBe(false);
  });

  it("rejected mengeset isPost false", () => {
    const hasil = terapkan(stateDengan({ isPost: true }), {
      type: actions.asyncGetPostById.rejected.type,
    });

    expect(hasil.isPost).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*                       Pasangan flag proses & sukses                        */
/* -------------------------------------------------------------------------- */

/** Satu pasangan flag: thunk beserta flag proses & suksesnya. */
interface KasusFlag {
  nama: string;
  thunk: {
    pending: { type: string };
    fulfilled: { type: string };
    rejected: { type: string };
  };
  setProses: (payload: boolean) => AksiUji;
  setSukses: (payload: boolean) => AksiUji;
  flagProses: keyof PostsState;
  flagSukses: keyof PostsState;
  payload: unknown;
}

/**
 * Delapan pasangan flag: setiap thunk memiliki flag "sedang diproses"
 * (`isPostX`) dan flag "berhasil" (`isPostXed`).
 */
const pasanganFlag: KasusFlag[] = [
  {
    nama: "asyncAddPost",
    thunk: actions.asyncAddPost,
    setProses: actions.setIsPostAdd,
    setSukses: actions.setIsPostAdded,
    flagProses: "isPostAdd",
    flagSukses: "isPostAdded",
    payload: 5,
  },
  {
    nama: "asyncChangePost",
    thunk: actions.asyncChangePost,
    setProses: actions.setIsPostChange,
    setSukses: actions.setIsPostChanged,
    flagProses: "isPostChange",
    flagSukses: "isPostChanged",
    payload: 5,
  },
  {
    nama: "asyncChangePostCover",
    thunk: actions.asyncChangePostCover,
    setProses: actions.setIsPostChangeCover,
    setSukses: actions.setIsPostChangedCover,
    flagProses: "isPostChangeCover",
    flagSukses: "isPostChangedCover",
    payload: 5,
  },
  {
    nama: "asyncDeletePost",
    thunk: actions.asyncDeletePost,
    setProses: actions.setIsPostDelete,
    setSukses: actions.setIsPostDeleted,
    flagProses: "isPostDelete",
    flagSukses: "isPostDeleted",
    payload: 5,
  },
  {
    nama: "asyncLikePost",
    thunk: actions.asyncLikePost,
    setProses: actions.setIsPostLike,
    setSukses: actions.setIsPostLiked,
    flagProses: "isPostLike",
    flagSukses: "isPostLiked",
    payload: { postId: 1, like: 1 },
  },
  {
    nama: "asyncAddComment",
    thunk: actions.asyncAddComment,
    setProses: actions.setIsPostAddComment,
    setSukses: actions.setIsPostAddedComment,
    flagProses: "isPostAddComment",
    flagSukses: "isPostAddedComment",
    payload: { postId: 1, comment: "Halo" },
  },
  {
    nama: "asyncDeleteComment",
    thunk: actions.asyncDeleteComment,
    setProses: actions.setIsPostDeleteComment,
    setSukses: actions.setIsPostDeletedComment,
    flagProses: "isPostDeleteComment",
    flagSukses: "isPostDeletedComment",
    payload: 5,
  },
  {
    nama: "asyncDeleteAllPosts",
    thunk: actions.asyncDeleteAllPosts,
    setProses: actions.setIsPostDeleteAll,
    setSukses: actions.setIsPostDeletedAll,
    flagProses: "isPostDeleteAll",
    flagSukses: "isPostDeletedAll",
    payload: "Semua postingan berhasil dihapus",
  },
];

describe("pasangan flag proses & sukses", () => {
  it("menguji delapan pasangan flag", () => {
    expect(pasanganFlag).toHaveLength(8);
  });
});

describe.each(pasanganFlag)("$nama", (kasus) => {
  it("action creator sinkron menyetel flag sesuai payload", () => {
    expect(terapkan(initialState, kasus.setProses(true))[kasus.flagProses]).toBe(
      true,
    );
    expect(
      terapkan(initialState, kasus.setProses(false))[kasus.flagProses],
    ).toBe(false);
    expect(terapkan(initialState, kasus.setSukses(true))[kasus.flagSukses]).toBe(
      true,
    );
    expect(
      terapkan(initialState, kasus.setSukses(false))[kasus.flagSukses],
    ).toBe(false);
  });

  it("pending menyalakan flag proses dan mematikan flag sukses", () => {
    const hasil = terapkan(
      stateDengan({
        [kasus.flagProses]: false,
        [kasus.flagSukses]: true,
      } as Partial<PostsState>),
      { type: kasus.thunk.pending.type },
    );

    expect(hasil[kasus.flagProses]).toBe(true);
    expect(hasil[kasus.flagSukses]).toBe(false);
  });

  it("fulfilled mematikan flag proses dan menyalakan flag sukses", () => {
    const hasil = terapkan(
      stateDengan({
        [kasus.flagProses]: true,
        [kasus.flagSukses]: false,
      } as Partial<PostsState>),
      { type: kasus.thunk.fulfilled.type, payload: kasus.payload },
    );

    expect(hasil[kasus.flagProses]).toBe(false);
    expect(hasil[kasus.flagSukses]).toBe(true);
  });

  it("rejected mematikan kedua flag", () => {
    const hasil = terapkan(
      stateDengan({
        [kasus.flagProses]: true,
        [kasus.flagSukses]: true,
      } as Partial<PostsState>),
      { type: kasus.thunk.rejected.type },
    );

    expect(hasil[kasus.flagProses]).toBe(false);
    expect(hasil[kasus.flagSukses]).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*                            Perilaku khusus                                 */
/* -------------------------------------------------------------------------- */

describe("perilaku khusus reducer", () => {
  it("asyncDeletePost.fulfilled menghapus postingan dengan id tersebut", () => {
    const hasil = terapkan(
      stateDengan({ posts: [postSatu, postDua] }),
      { type: actions.asyncDeletePost.fulfilled.type, payload: 1 },
    );

    expect(hasil.posts).toEqual([postDua]);
    expect(hasil.isPostDeleted).toBe(true);
    expect(hasil.isPostDelete).toBe(false);
  });

  it("asyncDeletePost.fulfilled tidak mengubah posts bila id tidak ada", () => {
    const hasil = terapkan(
      stateDengan({ posts: [postSatu, postDua] }),
      { type: actions.asyncDeletePost.fulfilled.type, payload: 99 },
    );

    expect(hasil.posts).toEqual([postSatu, postDua]);
  });

  it("asyncDeleteAllPosts.fulfilled mengosongkan posts dan post", () => {
    const hasil = terapkan(
      stateDengan({ posts: [postSatu, postDua], post: postSatu }),
      { type: actions.asyncDeleteAllPosts.fulfilled.type, payload: "OK" },
    );

    expect(hasil.posts).toEqual([]);
    expect(hasil.post).toBeNull();
    expect(hasil.isPostDeletedAll).toBe(true);
    expect(hasil.isPostDeleteAll).toBe(false);
  });

  it("resetPosts mengembalikan state ke initialState", () => {
    const stateBerisi = stateDengan({
      posts: [postSatu, postDua],
      post: postSatu,
      isPost: true,
      isPostAdded: true,
      isPostChange: true,
      isPostChangedCover: true,
      isPostDeleted: true,
      isPostLiked: true,
      isPostAddedComment: true,
      isPostDeletedComment: true,
      isPostDeletedAll: true,
    });

    expect(terapkan(stateBerisi, actions.resetPosts())).toEqual(initialState);
  });
});
