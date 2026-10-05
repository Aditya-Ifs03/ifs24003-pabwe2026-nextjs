import { createAction, createAsyncThunk } from "@reduxjs/toolkit";

import { isSuccess } from "@/helpers/apiHelper";
import type { Post } from "@/types";
import type {
  PostAddCommentRequest,
  PostAddRequest,
  PostChangeCoverRequest,
  PostChangeRequest,
  PostLikeRequest,
} from "@/types/action";

import * as postApi from "../api/postApi";

/* -------------------------------------------------------------------------- */
/*                             Action creators                                */
/* -------------------------------------------------------------------------- */

/** Menandai proses penambahan postingan. */
export const setIsPostAdd = createAction<boolean>("posts/setIsPostAdd");
/** Menandai postingan berhasil ditambahkan. */
export const setIsPostAdded = createAction<boolean>("posts/setIsPostAdded");

/** Menandai proses perubahan postingan. */
export const setIsPostChange = createAction<boolean>("posts/setIsPostChange");
/** Menandai postingan berhasil diubah. */
export const setIsPostChanged = createAction<boolean>("posts/setIsPostChanged");

/** Menandai proses penggantian cover. */
export const setIsPostChangeCover = createAction<boolean>(
  "posts/setIsPostChangeCover",
);
/** Menandai cover berhasil diganti. */
export const setIsPostChangedCover = createAction<boolean>(
  "posts/setIsPostChangedCover",
);

/** Menandai proses penghapusan postingan. */
export const setIsPostDelete = createAction<boolean>("posts/setIsPostDelete");
/** Menandai postingan berhasil dihapus. */
export const setIsPostDeleted = createAction<boolean>("posts/setIsPostDeleted");

/** Menandai proses like/unlike. */
export const setIsPostLike = createAction<boolean>("posts/setIsPostLike");
/** Menandai like/unlike berhasil. */
export const setIsPostLiked = createAction<boolean>("posts/setIsPostLiked");

/** Menandai proses penambahan komentar. */
export const setIsPostAddComment = createAction<boolean>(
  "posts/setIsPostAddComment",
);
/** Menandai komentar berhasil ditambahkan. */
export const setIsPostAddedComment = createAction<boolean>(
  "posts/setIsPostAddedComment",
);

/** Menandai proses penghapusan komentar. */
export const setIsPostDeleteComment = createAction<boolean>(
  "posts/setIsPostDeleteComment",
);
/** Menandai komentar berhasil dihapus. */
export const setIsPostDeletedComment = createAction<boolean>(
  "posts/setIsPostDeletedComment",
);

/** Menandai proses penghapusan seluruh postingan. */
export const setIsPostDeleteAll = createAction<boolean>(
  "posts/setIsPostDeleteAll",
);
/** Menandai seluruh postingan berhasil dihapus. */
export const setIsPostDeletedAll = createAction<boolean>(
  "posts/setIsPostDeletedAll",
);

/* -------------------------------------------------------------------------- */
/*                                Async thunks                                */
/* -------------------------------------------------------------------------- */

/** Mengambil daftar postingan (seluruh publik atau milik sendiri). */
export const asyncGetAllPosts = createAsyncThunk<
  Post[],
  boolean | undefined,
  { rejectValue: string }
>("posts/asyncGetAllPosts", async (isMe, { rejectWithValue }) => {
  const result = await postApi.getAllPosts(isMe);

  if (!isSuccess(result)) {
    return rejectWithValue(result.message);
  }

  return result.data.posts;
});

/** Mengambil rincian satu postingan. */
export const asyncGetPostById = createAsyncThunk<
  Post,
  number,
  { rejectValue: string }
>("posts/asyncGetPostById", async (postId, { rejectWithValue }) => {
  const result = await postApi.getPostById(postId);

  if (!isSuccess(result)) {
    return rejectWithValue(result.message);
  }

  return result.data.post;
});

/** Menambahkan postingan baru dan mengembalikan id-nya. */
export const asyncAddPost = createAsyncThunk<
  number,
  PostAddRequest,
  { rejectValue: string }
>("posts/asyncAddPost", async (payload, { rejectWithValue }) => {
  const result = await postApi.addPost(payload);

  if (!isSuccess(result)) {
    return rejectWithValue(result.message);
  }

  return result.data.post_id;
});

/** Memperbarui deskripsi postingan. */
export const asyncChangePost = createAsyncThunk<
  number,
  PostChangeRequest,
  { rejectValue: string }
>("posts/asyncChangePost", async (payload, { rejectWithValue }) => {
  const result = await postApi.changePost(payload);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return payload.postId;
});

/** Mengganti cover postingan. */
export const asyncChangePostCover = createAsyncThunk<
  number,
  PostChangeCoverRequest,
  { rejectValue: string }
>("posts/asyncChangePostCover", async (payload, { rejectWithValue }) => {
  const result = await postApi.changePostCover(payload);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return payload.postId;
});

/** Menghapus satu postingan. */
export const asyncDeletePost = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("posts/asyncDeletePost", async (postId, { rejectWithValue }) => {
  const result = await postApi.deletePost(postId);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return postId;
});

/** Memberi / membatalkan suka pada postingan. */
export const asyncLikePost = createAsyncThunk<
  PostLikeRequest,
  PostLikeRequest,
  { rejectValue: string }
>("posts/asyncLikePost", async (payload, { rejectWithValue }) => {
  const result = await postApi.likePost(payload);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return payload;
});

/** Menambahkan komentar pada postingan. */
export const asyncAddComment = createAsyncThunk<
  PostAddCommentRequest,
  PostAddCommentRequest,
  { rejectValue: string }
>("posts/asyncAddComment", async (payload, { rejectWithValue }) => {
  const result = await postApi.addComment(payload);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return payload;
});

/** Menghapus komentar milik pengguna pada postingan. */
export const asyncDeleteComment = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("posts/asyncDeleteComment", async (postId, { rejectWithValue }) => {
  const result = await postApi.deleteComment(postId);

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return postId;
});

/** Menghapus seluruh postingan milik pengguna. */
export const asyncDeleteAllPosts = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>("posts/asyncDeleteAllPosts", async (_, { rejectWithValue }) => {
  const result = await postApi.deleteAllPosts();

  if (result.status !== "success") {
    return rejectWithValue(result.message);
  }

  return result.message;
});

/** Mengosongkan state postingan (dipakai saat logout). */
export const resetPosts = createAction("posts/resetPosts");
