import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function assertNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const severe = violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(severe).toEqual([]);
}

test.describe("marketing smoke", () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
    await assertNoSeriousViolations(page);
  });

  test("about", async ({ page }) => {
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: "About", level: 1 }),
    ).toBeVisible();
    await assertNoSeriousViolations(page);
  });
});
