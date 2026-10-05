import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("login page renders brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("CoopLaunch Malta")).toBeVisible();
  });

  test("health endpoint", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  test("coordinator can sign in and see dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("nesli@cooplaunch.mt");
    await page.getByLabel("Password").fill("ChangeMeNow!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Coordinator dashboard")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("founder dashboard path", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("founder@cooplaunch.mt");
    await page.getByLabel("Password").fill("ChangeMeNow!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Needs from you")).toBeVisible({
      timeout: 15_000,
    });
  });
});
