import { createSlice } from "@reduxjs/toolkit";

import type { Post } from "@/types";

import {
  asyncAddComment,
  asyncAddPost,
  asyncChangePost,
  asyncChangePostCover,
  asyncDeleteAllPosts,
  asyncDeleteComment,
  asyncDeletePost,
  asyncGetAllPosts,
  asyncGetPostById,
  asyncLikePost,
  resetPosts,
  setIsPostAdd,
  setIsPostAddComment,
  setIsPostAdded,
  setIsPostAddedComment,
  setIsPostChange,
  setIsPostChangeCover,
  setIsPostChanged,
  setIsPostChangedCover,
  setIsPostDelete,
  setIsPostDeleteAll,
  setIsPostDeleteComment,
  setIsPostDeleted,
  setIsPostDeletedAll,
  setIsPostDeletedComment,
  setIsPostLike,
  setIsPostLiked,
} from "./action";

/** State slice `posts`. */
export interface PostsState {
  /** Koleksi postingan pada linimasa. */
  posts: Post[];
  /** Postingan yang sedang dibuka pada halaman detail. */
  post: Post | null;
  /** `true` selama koleksi/detail postingan sedang dimuat. */
  isPost: boolean;

  /** Sedang menambahkan postingan. */
  isPostAdd: boolean;
  /** Postingan berhasil ditambahkan. */
  isPostAdded: boolean;

  /** Sedang mengubah postingan. */
  isPostChange: boolean;
  /** Postingan berhasil diubah. */
  isPostChanged: boolean;

  /** Sedang mengganti cover postingan. */
  isPostChangeCover: boolean;
  /** Cover postingan berhasil diganti. */
  isPostChangedCover: boolean;

  /** Sedang menghapus postingan. */
  isPostDelete: boolean;
  /** Postingan berhasil dihapus. */
  isPostDeleted: boolean;

  /** Sedang memberi / membatalkan suka. */
  isPostLike: boolean;
  /** Suka berhasil diubah. */
  isPostLiked: boolean;

  /** Sedang menambahkan komentar. */
  isPostAddComment: boolean;
  /** Komentar berhasil ditambahkan. */
  isPostAddedComment: boolean;

  /** Sedang menghapus komentar. */
  isPostDeleteComment: boolean;
  /** Komentar berhasil dihapus. */
  isPostDeletedComment: boolean;

  /** Sedang menghapus seluruh postingan. */
  isPostDeleteAll: boolean;
  /** Seluruh postingan berhasil dihapus. */
  isPostDeletedAll: boolean;
}

export const initialState: PostsState = {
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
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ------------------------ Ambil koleksi / detail ------------------------ */
      .addCase(asyncGetAllPosts.pending, (state) => {
        state.isPost = true;
      })
      .addCase(asyncGetAllPosts.fulfilled, (state, action) => {
        state.isPost = false;
        state.posts = action.payload;
      })
      .addCase(asyncGetAllPosts.rejected, (state) => {
        state.isPost = false;
      })
      .addCase(asyncGetPostById.pending, (state) => {
        state.isPost = true;
      })
      .addCase(asyncGetPostById.fulfilled, (state, action) => {
        state.isPost = false;
        state.post = action.payload;
      })
      .addCase(asyncGetPostById.rejected, (state) => {
        state.isPost = false;
      })

      /* --------------------------- Tambah postingan --------------------------- */
      .addCase(setIsPostAdd, (state, action) => {
        state.isPostAdd = action.payload;
      })
      .addCase(setIsPostAdded, (state, action) => {
        state.isPostAdded = action.payload;
      })
      .addCase(asyncAddPost.pending, (state) => {
        state.isPostAdd = true;
        state.isPostAdded = false;
      })
      .addCase(asyncAddPost.fulfilled, (state) => {
        state.isPostAdd = false;
        state.isPostAdded = true;
      })
      .addCase(asyncAddPost.rejected, (state) => {
        state.isPostAdd = false;
        state.isPostAdded = false;
      })

      /* ---------------------------- Ubah postingan ---------------------------- */
      .addCase(setIsPostChange, (state, action) => {
        state.isPostChange = action.payload;
      })
      .addCase(setIsPostChanged, (state, action) => {
        state.isPostChanged = action.payload;
      })
      .addCase(asyncChangePost.pending, (state) => {
        state.isPostChange = true;
        state.isPostChanged = false;
      })
      .addCase(asyncChangePost.fulfilled, (state) => {
        state.isPostChange = false;
        state.isPostChanged = true;
      })
      .addCase(asyncChangePost.rejected, (state) => {
        state.isPostChange = false;
        state.isPostChanged = false;
      })

      /* ----------------------------- Ganti cover ----------------------------- */
      .addCase(setIsPostChangeCover, (state, action) => {
        state.isPostChangeCover = action.payload;
      })
      .addCase(setIsPostChangedCover, (state, action) => {
        state.isPostChangedCover = action.payload;
      })
      .addCase(asyncChangePostCover.pending, (state) => {
        state.isPostChangeCover = true;
        state.isPostChangedCover = false;
      })
      .addCase(asyncChangePostCover.fulfilled, (state) => {
        state.isPostChangeCover = false;
        state.isPostChangedCover = true;
      })
      .addCase(asyncChangePostCover.rejected, (state) => {
        state.isPostChangeCover = false;
        state.isPostChangedCover = false;
      })

      /* --------------------------- Hapus postingan --------------------------- */
      .addCase(setIsPostDelete, (state, action) => {
        state.isPostDelete = action.payload;
      })
      .addCase(setIsPostDeleted, (state, action) => {
        state.isPostDeleted = action.payload;
      })
      .addCase(asyncDeletePost.pending, (state) => {
        state.isPostDelete = true;
        state.isPostDeleted = false;
      })
      .addCase(asyncDeletePost.fulfilled, (state, action) => {
        state.isPostDelete = false;
        state.isPostDeleted = true;
        state.posts = state.posts.filter((item) => item.id !== action.payload);
      })
      .addCase(asyncDeletePost.rejected, (state) => {
        state.isPostDelete = false;
        state.isPostDeleted = false;
      })

      /* -------------------------------- Suka -------------------------------- */
      .addCase(setIsPostLike, (state, action) => {
        state.isPostLike = action.payload;
      })
      .addCase(setIsPostLiked, (state, action) => {
        state.isPostLiked = action.payload;
      })
      .addCase(asyncLikePost.pending, (state) => {
        state.isPostLike = true;
        state.isPostLiked = false;
      })
      .addCase(asyncLikePost.fulfilled, (state) => {
        state.isPostLike = false;
        state.isPostLiked = true;
      })
      .addCase(asyncLikePost.rejected, (state) => {
        state.isPostLike = false;
        state.isPostLiked = false;
      })

      /* --------------------------- Tambah komentar --------------------------- */
      .addCase(setIsPostAddComment, (state, action) => {
        state.isPostAddComment = action.payload;
      })
      .addCase(setIsPostAddedComment, (state, action) => {
        state.isPostAddedComment = action.payload;
      })
      .addCase(asyncAddComment.pending, (state) => {
        state.isPostAddComment = true;
        state.isPostAddedComment = false;
      })
      .addCase(asyncAddComment.fulfilled, (state) => {
        state.isPostAddComment = false;
        state.isPostAddedComment = true;
      })
      .addCase(asyncAddComment.rejected, (state) => {
        state.isPostAddComment = false;
        state.isPostAddedComment = false;
      })

      /* --------------------------- Hapus komentar --------------------------- */
      .addCase(setIsPostDeleteComment, (state, action) => {
        state.isPostDeleteComment = action.payload;
      })
      .addCase(setIsPostDeletedComment, (state, action) => {
        state.isPostDeletedComment = action.payload;
      })
      .addCase(asyncDeleteComment.pending, (state) => {
        state.isPostDeleteComment = true;
        state.isPostDeletedComment = false;
      })
      .addCase(asyncDeleteComment.fulfilled, (state) => {
        state.isPostDeleteComment = false;
        state.isPostDeletedComment = true;
      })
      .addCase(asyncDeleteComment.rejected, (state) => {
        state.isPostDeleteComment = false;
        state.isPostDeletedComment = false;
      })

      /* ------------------------- Hapus semua postingan ------------------------- */
      .addCase(setIsPostDeleteAll, (state, action) => {
        state.isPostDeleteAll = action.payload;
      })
      .addCase(setIsPostDeletedAll, (state, action) => {
        state.isPostDeletedAll = action.payload;
      })
      .addCase(asyncDeleteAllPosts.pending, (state) => {
        state.isPostDeleteAll = true;
        state.isPostDeletedAll = false;
      })
      .addCase(asyncDeleteAllPosts.fulfilled, (state) => {
        state.isPostDeleteAll = false;
        state.isPostDeletedAll = true;
        state.posts = [];
        state.post = null;
      })
      .addCase(asyncDeleteAllPosts.rejected, (state) => {
        state.isPostDeleteAll = false;
        state.isPostDeletedAll = false;
      })

      /* -------------------------------- Reset -------------------------------- */
      .addCase(resetPosts, () => initialState);
  },
});

export default postsSlice.reducer;
