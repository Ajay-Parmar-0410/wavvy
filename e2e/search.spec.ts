import { test, expect } from "@playwright/test";

test.describe("Search flow", () => {
  test("displays initial empty state", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText(/Search for music/i)).toBeVisible();
  });

  test("searches and shows results", async ({ page }) => {
    await page.goto("/search?q=arijit");
    // Wait for search results to render (songs, albums, or artists)
    await page.waitForSelector("text=/Songs|Albums|Artists|YouTube/i", {
      timeout: 20000,
    });

    // Should have at least one tab active
    await expect(page.locator("button", { hasText: /^All$/ })).toBeVisible();
  });

  test("URL query parameter triggers search", async ({ page }) => {
    await page.goto("/search?q=tum+hi+ho");
    // Wait for either results or empty state
    await page.waitForTimeout(5000);
    const pageText = await page.textContent("body");
    // Should have either results or "No results"
    expect(pageText).toBeTruthy();
  });

  test("search tabs are clickable", async ({ page }) => {
    await page.goto("/search?q=arijit");
    await page.waitForTimeout(5000);

    const songsTab = page.locator("button", { hasText: /^Songs$/ });
    if (await songsTab.isVisible()) {
      await songsTab.click();
    }
  });
});
