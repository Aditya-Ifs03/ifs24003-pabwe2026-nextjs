import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiResult } from "@/types";

/* -------------------------------------------------------------------------- */
/*                     Mock helper pemanggilan REST API                       */
/* -------------------------------------------------------------------------- */

/**
 * Catatan penting soal teknik mock.
 *
 * `@/helpers/apiHelper` sudah ter-instansiasi lebih dahulu oleh
 * `src/setupTests.ts` (lewat `@/test-utils` → reducer → action → API), sehingga
 * `vi.mock` biasa tidak lagi berpengaruh pada modul yang sudah dimuat tersebut.
 * Karena itu registry modul direset (`vi.resetModules`), `apiFetch` dimock
 * memakai `vi.doMock`, lalu `postApi` diimpor ulang secara dinamis sehingga
 * benar-benar memakai `apiFetch` versi mock.
 */
const apiFetchMock = vi.fn();

vi.resetModules();
vi.doMock("@/helpers/apiHelper", () => ({ apiFetch: apiFetchMock }));

const postApi = await import("./postApi");

/** Respons sukses contoh yang dikembalikan seluruh pemanggilan API. */
const hasilSukses: ApiResult = { status: "success", message: "OK" };

beforeEach(() => {
  apiFetchMock.mockReset();
  apiFetchMock.mockResolvedValue(hasilSukses);
});

/** Mengambil argumen pertama & kedua dari pemanggilan `apiFetch` terakhir. */
function pemanggilanTerakhir(): [string, Record<string, unknown> | undefined] {
  const [endpoint, options] = apiFetchMock.mock.calls.at(-1) ?? [];

  return [endpoint as string, options as Record<string, unknown> | undefined];
}

/* -------------------------------------------------------------------------- */
/*                                  getAllPosts                               */
/* -------------------------------------------------------------------------- */

describe("getAllPosts", () => {
  it("dipanggil tanpa argumen → GET /posts dengan params undefined", async () => {
    await expect(postApi.getAllPosts()).resolves.toBe(hasilSukses);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/posts", { params: undefined });
  });

  it("dipanggil dengan isMe true → params { is_me: 1 }", async () => {
    await expect(postApi.getAllPosts(true)).resolves.toBe(hasilSukses);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/posts", {
      params: { is_me: 1 },
    });
  });

  it("dipanggil dengan isMe false secara eksplisit → params undefined", async () => {
    await postApi.getAllPosts(false);

    expect(apiFetchMock).toHaveBeenCalledWith("/posts", { params: undefined });
  });
});

/* -------------------------------------------------------------------------- */
/*                                 getPostById                                */
/* -------------------------------------------------------------------------- */

describe("getPostById", () => {
  it("memanggil GET /posts/:id", async () => {
    await expect(postApi.getPostById(12)).resolves.toBe(hasilSukses);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/posts/12");
  });
});

/* -------------------------------------------------------------------------- */
/*                                  addPost                                   */
/* -------------------------------------------------------------------------- */

describe("addPost", () => {
  it("memanggil POST /posts dengan body { description }", async () => {
    await postApi.addPost({ description: "Postingan baru" });

    const [endpoint, options] = pemanggilanTerakhir();

    expect(endpoint).toBe("/posts");
    expect(options?.method).toBe("POST");
    expect(options?.body).toEqual({ description: "Postingan baru" });
  });
});

/* -------------------------------------------------------------------------- */
/*                                 changePost                                 */
/* -------------------------------------------------------------------------- */

describe("changePost", () => {
  it("memanggil PUT /posts/:postId dengan body { description }", async () => {
    await postApi.changePost({ postId: 3, description: "Deskripsi baru" });

    const [endpoint, options] = pemanggilanTerakhir();

    expect(endpoint).toBe("/posts/3");
    expect(options?.method).toBe("PUT");
    expect(options?.body).toEqual({ description: "Deskripsi baru" });
  });
});

/* -------------------------------------------------------------------------- */
/*                              changePostCover                               */
/* -------------------------------------------------------------------------- */

describe("changePostCover", () => {
  it("memanggil POST /posts/:postId/cover dengan FormData field cover", async () => {
    const cover = new File(["isi-berkas"], "cover.png", {
      type: "image/png",
    });

    await postApi.changePostCover({ postId: 7, cover });

    const [endpoint, options] = pemanggilanTerakhir();

    expect(endpoint).toBe("/posts/7/cover");
    expect(options?.method).toBe("POST");

    const formData = options?.formData;

    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("cover")).toBe(cover);
  });
});

/* -------------------------------------------------------------------------- */
/*                                 deletePost                                 */
/* -------------------------------------------------------------------------- */

describe("deletePost", () => {
  it("memanggil DELETE /posts/:id", async () => {
    await postApi.deletePost(4);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/posts/4", { method: "DELETE" });
  });
});

/* -------------------------------------------------------------------------- */
/*                                  likePost                                  */
/* -------------------------------------------------------------------------- */

describe("likePost", () => {
  it("memanggil POST /posts/:postId/likes dengan body { like: 1 }", async () => {
    await postApi.likePost({ postId: 5, like: 1 });

    const [endpoint, options] = pemanggilanTerakhir();

    expect(endpoint).toBe("/posts/5/likes");
    expect(options?.method).toBe("POST");
    expect(options?.body).toEqual({ like: 1 });
  });

  it("mengirim like: 0 saat membatalkan suka", async () => {
    await postApi.likePost({ postId: 6, like: 0 });

    const [endpoint, options] = pemanggilanTerakhir();

    expect(endpoint).toBe("/posts/6/likes");
    expect(options?.body).toEqual({ like: 0 });
  });
});

/* -------------------------------------------------------------------------- */
/*                                 addComment                                 */
/* -------------------------------------------------------------------------- */

describe("addComment", () => {
  it("memanggil POST /posts/:postId/comments dengan body { comment }", async () => {
    await postApi.addComment({ postId: 9, comment: "Komentar saya" });

    const [endpoint, options] = pemanggilanTerakhir();

    expect(endpoint).toBe("/posts/9/comments");
    expect(options?.method).toBe("POST");
    expect(options?.body).toEqual({ comment: "Komentar saya" });
  });
});

/* -------------------------------------------------------------------------- */
/*                               deleteComment                                */
/* -------------------------------------------------------------------------- */

describe("deleteComment", () => {
  it("memanggil DELETE /posts/:postId/comments", async () => {
    await postApi.deleteComment(10);

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/posts/10/comments", {
      method: "DELETE",
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                               deleteAllPosts                               */
/* -------------------------------------------------------------------------- */

describe("deleteAllPosts", () => {
  it("memanggil DELETE /posts tanpa body", async () => {
    await postApi.deleteAllPosts();

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/posts", { method: "DELETE" });
  });
});
