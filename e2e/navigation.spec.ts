import { test, expect } from "@playwright/test";

test.describe("Navigation & Layout", () => {
  test("home page loads with greeting", async ({ page }) => {
    await page.goto("/");
    // Greeting should be one of morning/afternoon/evening
    const greeting = page.locator("h1").first();
    await expect(greeting).toContainText(/Good (morning|afternoon|evening)/);
  });

  test("sidebar has navigation links", async ({ page }) => {
    await page.goto("/");
    // Desktop sidebar should exist
    await expect(page.getByRole("link", { name: /Home/i }).first()).toBeVisible();
  });

  test("navigates to Library page", async ({ page }) => {
    await page.goto("/library");
    await expect(
      page.getByRole("heading", { name: /Your Library|Playlists/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("navigates to History page", async ({ page }) => {
    await page.goto("/history");
    await expect(page).toHaveURL(/\/history/);
  });

  test("navigates to Downloads page", async ({ page }) => {
    await page.goto("/downloads");
    await expect(
      page.getByRole("heading", { name: /Offline Library|Downloads/i, level: 1 })
    ).toBeVisible({ timeout: 10000 });
  });

  test("navigates to Search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL(/\/search/);
  });
});
