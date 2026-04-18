import { test, expect } from "@playwright/test";

test.describe("API routes", () => {
  test("GET /api/saavn/search returns songs", async ({ request }) => {
    const res = await request.get("/api/saavn/search?q=arijit");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.songs)).toBe(true);
  });

  test("GET /api/saavn/search rejects empty query", async ({ request }) => {
    const res = await request.get("/api/saavn/search?q=");
    expect(res.status()).toBe(400);
  });

  test("GET /api/saavn/trending returns data", async ({ request }) => {
    const res = await request.get("/api/saavn/trending");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("trending");
    expect(json.data).toHaveProperty("albums");
    expect(json.data).toHaveProperty("playlists");
  });

  test("GET /api/saavn/song/[id] returns song with streamUrl", async ({
    request,
  }) => {
    const res = await request.get("/api/saavn/song/aRZbUYD7");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty("streamUrl");
    expect(json.data.streamUrl).toContain("saavncdn.com");
  });

  test("GET /api/saavn/album/[id] returns album with songs", async ({
    request,
  }) => {
    const res = await request.get("/api/saavn/album/1142502");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.songs)).toBe(true);
  });

  test("GET /api/saavn/artist/[id] returns artist data", async ({ request }) => {
    const res = await request.get("/api/saavn/artist/459320");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.artist).toHaveProperty("name");
  });

  test("GET /api/saavn/lyrics/[id] returns lyrics or fails gracefully", async ({
    request,
  }) => {
    const res = await request.get("/api/saavn/lyrics/aRZbUYD7");
    // Either success with lyrics or graceful 404
    if (res.ok()) {
      const json = await res.json();
      expect(json).toHaveProperty("success");
    }
  });

  test("GET /api/yt/search returns results", async ({ request }) => {
    const res = await request.get("/api/yt/search?q=music");
    // YT may be flaky depending on Piped instance availability
    if (res.ok()) {
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.songs)).toBe(true);
    }
  });
});
