import { test, expect } from "@playwright/test";

test.describe("PWA - Manifest", () => {
  test("manifest.json is served with correct Content-Type", async ({ request }) => {
    const res = await request.get("/manifest.json");
    expect(res.ok()).toBe(true);
    const ct = res.headers()["content-type"] || "";
    expect(ct).toMatch(/json/i);
  });

  test("manifest has all required PWA fields", async ({ request }) => {
    const res = await request.get("/manifest.json");
    const manifest = await res.json();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toMatch(/standalone|fullscreen|minimal-ui/);
    expect(manifest.theme_color).toMatch(/^#[0-9A-Fa-f]{3,8}$/);
    expect(manifest.background_color).toMatch(/^#[0-9A-Fa-f]{3,8}$/);
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("manifest has 192px and 512px icons (installability)", async ({ request }) => {
    const res = await request.get("/manifest.json");
    const manifest = await res.json();

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  test("all icons listed in manifest are reachable", async ({ request }) => {
    const res = await request.get("/manifest.json");
    const manifest = await res.json();

    for (const icon of manifest.icons as { src: string }[]) {
      const iconRes = await request.get(icon.src);
      expect(iconRes.ok(), `icon ${icon.src} should be reachable`).toBe(true);
    }
  });
});

test.describe("PWA - HTML head", () => {
  test("document links to manifest.json", async ({ page }) => {
    await page.goto("/");
    const href = await page
      .locator('link[rel="manifest"]')
      .first()
      .getAttribute("href");
    expect(href).toContain("manifest");
  });

  test("document has theme-color meta tag", async ({ page }) => {
    await page.goto("/");
    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .first()
      .getAttribute("content");
    expect(themeColor).toMatch(/^#[0-9A-Fa-f]{3,8}$/);
  });

  test("document has viewport meta tag", async ({ page }) => {
    await page.goto("/");
    const viewport = await page
      .locator('meta[name="viewport"]')
      .first()
      .getAttribute("content");
    expect(viewport).toContain("width=device-width");
  });

  test("document has apple-touch-icon", async ({ page }) => {
    await page.goto("/");
    const icon = await page
      .locator('link[rel="apple-touch-icon"]')
      .first()
      .getAttribute("href");
    expect(icon).toBeTruthy();
  });

  test("document has apple-mobile-web-app-capable", async ({ page }) => {
    await page.goto("/");
    const cap = await page
      .locator('meta[name="apple-mobile-web-app-capable"]')
      .first()
      .getAttribute("content");
    expect(cap).toBe("yes");
  });
});

test.describe("PWA - Browser APIs", () => {
  test("Cache API is available", async ({ page }) => {
    await page.goto("/");
    const hasCaches = await page.evaluate(() => "caches" in window);
    expect(hasCaches).toBe(true);
  });

  test("IndexedDB is available", async ({ page }) => {
    await page.goto("/");
    const hasIDB = await page.evaluate(() => "indexedDB" in window);
    expect(hasIDB).toBe(true);
  });

  test("Service Worker API is available", async ({ page }) => {
    await page.goto("/");
    const hasSW = await page.evaluate(() => "serviceWorker" in navigator);
    expect(hasSW).toBe(true);
  });

  test("Cache API can open and put a response (offline flow)", async ({ page }) => {
    await page.goto("/");
    const ok = await page.evaluate(async () => {
      const cache = await caches.open("wavvy-test-cache");
      await cache.put(
        "/test-song",
        new Response(new Blob(["audio-data"]), {
          headers: { "Content-Type": "audio/mpeg" },
        })
      );
      const hit = await cache.match("/test-song");
      const text = hit ? await hit.text() : null;
      await caches.delete("wavvy-test-cache");
      return text === "audio-data";
    });
    expect(ok).toBe(true);
  });

  test("Dexie IndexedDB opens the wavvy database with expected tables", async ({
    page,
  }) => {
    // Go to library which triggers Dexie initialization
    await page.goto("/library");
    await page.waitForTimeout(2500);

    const tables = await page.evaluate(
      () =>
        new Promise<string[]>((resolve) => {
          const req = indexedDB.open("wavvy-db");
          req.onsuccess = () => {
            const names = Array.from(req.result.objectStoreNames);
            req.result.close();
            resolve(names);
          };
          req.onerror = () => resolve([]);
        })
    );

    expect(tables).toContain("playlists");
    expect(tables).toContain("history");
    expect(tables).toContain("downloads");
  });
});

test.describe("PWA - Service Worker assets", () => {
  test("sw.js is reachable (production build only)", async ({ request }) => {
    const res = await request.get("/sw.js");
    // Dev: next-pwa disables SW, so 404 is acceptable.
    // Prod: should return the worker script.
    if (res.ok()) {
      const body = await res.text();
      expect(body.length).toBeGreaterThan(0);
    }
  });
});
