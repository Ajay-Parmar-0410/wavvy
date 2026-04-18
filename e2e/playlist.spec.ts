import { test, expect } from "@playwright/test";

test.describe("Playlist flow", () => {
  test("library page shows heading", async ({ page }) => {
    await page.goto("/library");
    await expect(
      page.getByRole("heading", { name: /Your Library/i, level: 1 })
    ).toBeVisible({ timeout: 10000 });
  });

  test("library page shows Liked Songs or empty state", async ({ page }) => {
    await page.goto("/library");
    // Wait for Dexie to initialize
    await page.waitForTimeout(3000);

    const likedSongs = page.getByText("Liked Songs").first();
    const emptyState = page.getByText(/Your playlists will appear here/i);

    // Either Liked Songs exists or empty state is shown
    const hasLiked = await likedSongs.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasLiked || isEmpty).toBe(true);
  });

  test("can open create playlist modal", async ({ page }) => {
    await page.goto("/library");
    await page.waitForTimeout(2000);

    // "New Playlist" button or "Create your first playlist"
    const newPlaylistBtn = page.getByRole("button", { name: "New Playlist" });
    const firstPlaylistBtn = page.getByRole("button", {
      name: "Create your first playlist",
    });

    if (await newPlaylistBtn.isVisible().catch(() => false)) {
      await newPlaylistBtn.click();
    } else if (await firstPlaylistBtn.isVisible().catch(() => false)) {
      await firstPlaylistBtn.click();
    }

    // Modal input should appear
    const nameInput = page.getByPlaceholder(/name|playlist/i).first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test("can create a new playlist", async ({ page }) => {
    await page.goto("/library");
    await page.waitForTimeout(2000);

    const newPlaylistBtn = page.getByRole("button", { name: "New Playlist" });
    const firstPlaylistBtn = page.getByRole("button", {
      name: "Create your first playlist",
    });

    if (await newPlaylistBtn.isVisible().catch(() => false)) {
      await newPlaylistBtn.click();
    } else if (await firstPlaylistBtn.isVisible().catch(() => false)) {
      await firstPlaylistBtn.click();
    }

    const nameInput = page.getByPlaceholder(/name|playlist/i).first();
    await nameInput.waitFor({ timeout: 5000 });
    const uniqueName = `Test Playlist ${Date.now()}`;
    await nameInput.fill(uniqueName);

    // Submit button is the modal's "Create" button (type=submit)
    const submitBtn = page.locator('button[type="submit"]', { hasText: /^Create$/ });
    await submitBtn.click();

    // Playlist should appear
    await expect(page.getByText(uniqueName).first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Album and Artist pages", () => {
  test("album page loads with known album ID", async ({ page }) => {
    await page.goto("/album/1142502");
    await page.waitForTimeout(6000);
    // Should have an h1 with a title or a loading state
    const headings = await page.locator("h1").count();
    expect(headings).toBeGreaterThanOrEqual(1);
  });

  test("artist page loads with known artist ID", async ({ page }) => {
    await page.goto("/artist/459320");
    await page.waitForTimeout(6000);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
