import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiResult, Post } from "@/types";
import { makeStore } from "@/test-utils";

/* -------------------------------------------------------------------------- */
/*                        Mock seluruh fungsi postApi                         */
/* -------------------------------------------------------------------------- */

/**
 * Catatan penting soal teknik mock.
 *
 * `@/features/posts/states/action` sudah ter-instansiasi lebih dahulu oleh
 * `src/setupTests.ts` (lewat `@/test-utils` → reducer), sehingga `vi.mock`
 * biasa tidak lagi berpengaruh pada modul tersebut. Registry modul direset,
 * `postApi` dimock memakai `vi.doMock`, lalu `action` diimpor ulang secara
 * dinamis supaya thunk benar-benar memakai `postApi` versi mock.
 *
 * Reducer pada `makeStore()` tetap berasal dari instansiasi awal. Hal itu tidak
 * menjadi masalah karena `createSlice` mencocokkan aksi berdasarkan tipe aksi.
 */
const apiMocks = {
  getAllPosts: vi.fn(),
  getPostById: vi.fn(),
  addPost: vi.fn(),
  changePost: vi.fn(),
  changePostCover: vi.fn(),
  deletePost: vi.fn(),
  likePost: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
  deleteAllPosts: vi.fn(),
};

vi.resetModules();
vi.doMock("@/features/posts/api/postApi", () => apiMocks);

const actions = await import("./action");
const { initialState: postsInitialState } = await import("./reducer");

beforeEach(() => {
  Object.values(apiMocks).forEach((mockFn) => {
    mockFn.mockReset();
  });
});

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

const cover = new File(["isi-berkas"], "cover.png", { type: "image/png" });

/** Respons sukses; `data` hanya disertakan bila diberikan. */
function responsSukses<T>(data?: T): ApiResult<T> {
  return data === undefined
    ? { status: "success", message: "OK" }
    : { status: "success", message: "OK", data };
}

/** Respons gagal dengan pesan yang dapat diperiksa. */
function responsGagal(message = "Terjadi kesalahan"): ApiResult<never> {
  return { status: "fail", message };
}

/* -------------------------------------------------------------------------- */
/*                        Action creator sinkron (16)                         */
/* -------------------------------------------------------------------------- */

const kreatorBoolean = [
  { nama: "setIsPostAdd", kreator: actions.setIsPostAdd, tipe: "posts/setIsPostAdd" },
  { nama: "setIsPostAdded", kreator: actions.setIsPostAdded, tipe: "posts/setIsPostAdded" },
  { nama: "setIsPostChange", kreator: actions.setIsPostChange, tipe: "posts/setIsPostChange" },
  { nama: "setIsPostChanged", kreator: actions.setIsPostChanged, tipe: "posts/setIsPostChanged" },
  {
    nama: "setIsPostChangeCover",
    kreator: actions.setIsPostChangeCover,
    tipe: "posts/setIsPostChangeCover",
  },
  {
    nama: "setIsPostChangedCover",
    kreator: actions.setIsPostChangedCover,
    tipe: "posts/setIsPostChangedCover",
  },
  { nama: "setIsPostDelete", kreator: actions.setIsPostDelete, tipe: "posts/setIsPostDelete" },
  { nama: "setIsPostDeleted", kreator: actions.setIsPostDeleted, tipe: "posts/setIsPostDeleted" },
  { nama: "setIsPostLike", kreator: actions.setIsPostLike, tipe: "posts/setIsPostLike" },
  { nama: "setIsPostLiked", kreator: actions.setIsPostLiked, tipe: "posts/setIsPostLiked" },
  {
    nama: "setIsPostAddComment",
    kreator: actions.setIsPostAddComment,
    tipe: "posts/setIsPostAddComment",
  },
  {
    nama: "setIsPostAddedComment",
    kreator: actions.setIsPostAddedComment,
    tipe: "posts/setIsPostAddedComment",
  },
  {
    nama: "setIsPostDeleteComment",
    kreator: actions.setIsPostDeleteComment,
    tipe: "posts/setIsPostDeleteComment",
  },
  {
    nama: "setIsPostDeletedComment",
    kreator: actions.setIsPostDeletedComment,
    tipe: "posts/setIsPostDeletedComment",
  },
  {
    nama: "setIsPostDeleteAll",
    kreator: actions.setIsPostDeleteAll,
    tipe: "posts/setIsPostDeleteAll",
  },
  {
    nama: "setIsPostDeletedAll",
    kreator: actions.setIsPostDeletedAll,
    tipe: "posts/setIsPostDeletedAll",
  },
];

describe("action creator sinkron", () => {
  it("terdapat 16 action creator boolean", () => {
    expect(kreatorBoolean).toHaveLength(16);
  });

  it.each(kreatorBoolean)(
    "$nama membuat action $tipe dengan payload sesuai argumen",
    ({ kreator, tipe }) => {
      expect(kreator(true)).toEqual({ type: tipe, payload: true });
      expect(kreator(false)).toEqual({ type: tipe, payload: false });
    },
  );

  it("resetPosts membuat action tanpa payload", () => {
    expect(actions.resetPosts()).toEqual({ type: "posts/resetPosts" });
  });
});

/* -------------------------------------------------------------------------- */
/*                             Thunk: ambil data                              */
/* -------------------------------------------------------------------------- */

describe("asyncGetAllPosts", () => {
  const daftar = [postSatu, postDua];

  it("fulfilled mengembalikan daftar posts dan mengisi state", async () => {
    apiMocks.getAllPosts.mockResolvedValue(responsSukses({ posts: daftar }));
    const store = makeStore();

    const action = await store.dispatch(actions.asyncGetAllPosts(true));

    expect(apiMocks.getAllPosts).toHaveBeenCalledWith(true);
    expect(action.type).toBe("posts/asyncGetAllPosts/fulfilled");
    expect(action.payload).toEqual(daftar);
    expect(store.getState().posts.posts).toEqual(daftar);
    expect(store.getState().posts.isPost).toBe(false);
  });

  it("dipanggil tanpa argumen meneruskan isMe undefined", async () => {
    apiMocks.getAllPosts.mockResolvedValue(responsSukses({ posts: daftar }));
    const store = makeStore();

    await store.dispatch(actions.asyncGetAllPosts());

    expect(apiMocks.getAllPosts).toHaveBeenCalledWith(undefined);
  });

  it("rejected membawa pesan kegagalan", async () => {
    apiMocks.getAllPosts.mockResolvedValue(responsGagal("Gagal memuat postingan"));
    const store = makeStore();

    const action = await store.dispatch(actions.asyncGetAllPosts());

    expect(action.type).toBe("posts/asyncGetAllPosts/rejected");
    expect(action.payload).toBe("Gagal memuat postingan");
    expect(store.getState().posts.isPost).toBe(false);
  });

  it("status success tanpa data diperlakukan sebagai rejected", async () => {
    apiMocks.getAllPosts.mockResolvedValue({
      status: "success",
      message: "Data kosong",
    });
    const store = makeStore();

    const action = await store.dispatch(actions.asyncGetAllPosts());

    expect(action.type).toBe("posts/asyncGetAllPosts/rejected");
    expect(action.payload).toBe("Data kosong");
  });
});

describe("asyncGetPostById", () => {
  it("fulfilled mengembalikan satu post dan mengisi state.post", async () => {
    apiMocks.getPostById.mockResolvedValue(responsSukses({ post: postSatu }));
    const store = makeStore();

    const action = await store.dispatch(actions.asyncGetPostById(1));

    expect(apiMocks.getPostById).toHaveBeenCalledWith(1);
    expect(action.type).toBe("posts/asyncGetPostById/fulfilled");
    expect(action.payload).toEqual(postSatu);
    expect(store.getState().posts.post).toEqual(postSatu);
    expect(store.getState().posts.isPost).toBe(false);
  });

  it("rejected membawa pesan kegagalan", async () => {
    apiMocks.getPostById.mockResolvedValue(responsGagal("Postingan tidak ditemukan"));
    const store = makeStore();

    const action = await store.dispatch(actions.asyncGetPostById(99));

    expect(action.type).toBe("posts/asyncGetPostById/rejected");
    expect(action.payload).toBe("Postingan tidak ditemukan");
    expect(store.getState().posts.isPost).toBe(false);
  });

  it("status success tanpa data diperlakukan sebagai rejected", async () => {
    apiMocks.getPostById.mockResolvedValue({
      status: "success",
      message: "Data kosong",
    });
    const store = makeStore();

    const action = await store.dispatch(actions.asyncGetPostById(1));

    expect(action.type).toBe("posts/asyncGetPostById/rejected");
    expect(action.payload).toBe("Data kosong");
  });
});

/* -------------------------------------------------------------------------- */
/*                            Thunk: tambah postingan                         */
/* -------------------------------------------------------------------------- */

describe("asyncAddPost", () => {
  it("fulfilled mengembalikan post_id dan menandai isPostAdded", async () => {
    apiMocks.addPost.mockResolvedValue(responsSukses({ post_id: 5 }));
    const store = makeStore();

    const action = await store.dispatch(
      actions.asyncAddPost({ description: "Postingan baru" }),
    );

    expect(apiMocks.addPost).toHaveBeenCalledWith({
      description: "Postingan baru",
    });
    expect(action.type).toBe("posts/asyncAddPost/fulfilled");
    expect(action.payload).toBe(5);
    expect(store.getState().posts.isPostAdded).toBe(true);
    expect(store.getState().posts.isPostAdd).toBe(false);
  });

  it("rejected membawa pesan kegagalan", async () => {
    apiMocks.addPost.mockResolvedValue(responsGagal("Gagal menambah postingan"));
    const store = makeStore();

    const action = await store.dispatch(
      actions.asyncAddPost({ description: "Postingan baru" }),
    );

    expect(action.type).toBe("posts/asyncAddPost/rejected");
    expect(action.payload).toBe("Gagal menambah postingan");
    expect(store.getState().posts.isPostAdded).toBe(false);
  });

  it("status success tanpa data diperlakukan sebagai rejected", async () => {
    apiMocks.addPost.mockResolvedValue({
      status: "success",
      message: "Data kosong",
    });
    const store = makeStore();

    const action = await store.dispatch(
      actions.asyncAddPost({ description: "Postingan baru" }),
    );

    expect(action.type).toBe("posts/asyncAddPost/rejected");
    expect(action.payload).toBe("Data kosong");
  });
});

/* -------------------------------------------------------------------------- */
/*                      Thunk yang hanya memeriksa status                     */
/* -------------------------------------------------------------------------- */

/** Kasus uji thunk yang mengembalikan nilai turunan dari argumen. */
const thunkBerbasisStatus = [
  {
    nama: "asyncChangePost",
    jalankan: (store: ReturnType<typeof makeStore>) =>
      store.dispatch(
        actions.asyncChangePost({ postId: 3, description: "Deskripsi baru" }),
      ),
    mock: apiMocks.changePost,
    argumen: [{ postId: 3, description: "Deskripsi baru" }],
    tipe: "posts/asyncChangePost",
    payload: 3,
    flagProses: "isPostChange",
    flagSukses: "isPostChanged",
  },
  {
    nama: "asyncChangePostCover",
    jalankan: (store: ReturnType<typeof makeStore>) =>
      store.dispatch(actions.asyncChangePostCover({ postId: 4, cover })),
    mock: apiMocks.changePostCover,
    argumen: [{ postId: 4, cover }],
    tipe: "posts/asyncChangePostCover",
    payload: 4,
    flagProses: "isPostChangeCover",
    flagSukses: "isPostChangedCover",
  },
  {
    nama: "asyncDeletePost",
    jalankan: (store: ReturnType<typeof makeStore>) =>
      store.dispatch(actions.asyncDeletePost(6)),
    mock: apiMocks.deletePost,
    argumen: [6],
    tipe: "posts/asyncDeletePost",
    payload: 6,
    flagProses: "isPostDelete",
    flagSukses: "isPostDeleted",
  },
  {
    nama: "asyncLikePost",
    jalankan: (store: ReturnType<typeof makeStore>) =>
      store.dispatch(actions.asyncLikePost({ postId: 7, like: 1 })),
    mock: apiMocks.likePost,
    argumen: [{ postId: 7, like: 1 }],
    tipe: "posts/asyncLikePost",
    payload: { postId: 7, like: 1 },
    flagProses: "isPostLike",
    flagSukses: "isPostLiked",
  },
  {
    nama: "asyncAddComment",
    jalankan: (store: ReturnType<typeof makeStore>) =>
      store.dispatch(actions.asyncAddComment({ postId: 8, comment: "Halo" })),
    mock: apiMocks.addComment,
    argumen: [{ postId: 8, comment: "Halo" }],
    tipe: "posts/asyncAddComment",
    payload: { postId: 8, comment: "Halo" },
    flagProses: "isPostAddComment",
    flagSukses: "isPostAddedComment",
  },
  {
    nama: "asyncDeleteComment",
    jalankan: (store: ReturnType<typeof makeStore>) =>
      store.dispatch(actions.asyncDeleteComment(9)),
    mock: apiMocks.deleteComment,
    argumen: [9],
    tipe: "posts/asyncDeleteComment",
    payload: 9,
    flagProses: "isPostDeleteComment",
    flagSukses: "isPostDeletedComment",
  },
] as const;

describe.each(thunkBerbasisStatus)("$nama", (kasus) => {
  it("fulfilled mengembalikan nilai dari argumen tanpa memerlukan data", async () => {
    kasus.mock.mockResolvedValue(responsSukses());
    const store = makeStore();

    const action = await kasus.jalankan(store);

    expect(kasus.mock).toHaveBeenCalledWith(...kasus.argumen);
    expect(action.type).toBe(`${kasus.tipe}/fulfilled`);
    expect(action.payload).toEqual(kasus.payload);
    expect(store.getState().posts[kasus.flagProses]).toBe(false);
    expect(store.getState().posts[kasus.flagSukses]).toBe(true);
  });

  it("rejected membawa pesan kegagalan", async () => {
    kasus.mock.mockResolvedValue(responsGagal("Operasi gagal"));
    const store = makeStore();

    const action = await kasus.jalankan(store);

    expect(action.type).toBe(`${kasus.tipe}/rejected`);
    expect(action.payload).toBe("Operasi gagal");
    expect(store.getState().posts[kasus.flagProses]).toBe(false);
    expect(store.getState().posts[kasus.flagSukses]).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/*                        Thunk: hapus seluruh postingan                      */
/* -------------------------------------------------------------------------- */

describe("asyncDeleteAllPosts", () => {
  it("fulfilled mengembalikan pesan dan mengosongkan state", async () => {
    apiMocks.deleteAllPosts.mockResolvedValue({
      status: "success",
      message: "Semua postingan berhasil dihapus",
    });
    const store = makeStore({
      posts: {
        ...postsInitialState,
        posts: [postSatu, postDua],
        post: postSatu,
      },
    });

    const action = await store.dispatch(actions.asyncDeleteAllPosts());

    expect(apiMocks.deleteAllPosts).toHaveBeenCalledWith();
    expect(action.type).toBe("posts/asyncDeleteAllPosts/fulfilled");
    expect(action.payload).toBe("Semua postingan berhasil dihapus");
    expect(store.getState().posts.posts).toEqual([]);
    expect(store.getState().posts.post).toBeNull();
    expect(store.getState().posts.isPostDeletedAll).toBe(true);
  });

  it("rejected membawa pesan kegagalan", async () => {
    apiMocks.deleteAllPosts.mockResolvedValue(responsGagal("Gagal menghapus"));
    const store = makeStore();

    const action = await store.dispatch(actions.asyncDeleteAllPosts());

    expect(action.type).toBe("posts/asyncDeleteAllPosts/rejected");
    expect(action.payload).toBe("Gagal menghapus");
    expect(store.getState().posts.isPostDeletedAll).toBe(false);
  });
});
