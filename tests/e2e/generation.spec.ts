import { test, expect } from "@playwright/test";

test("home page renders generation controls", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /generer la semaine/i }),
  ).toBeVisible();
  await expect(page.getByText(/modele ia local/i)).toBeVisible();
});
