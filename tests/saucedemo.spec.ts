import { test, expect, Page } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

test.describe("Login Success", () => {
  let homePage: HomePage;
  test.beforeEach(async ({ page }: { page: Page }) => {
    await test.step(`I can enter the login Page`, async () => {
      homePage = new HomePage(page);
      await homePage.urlHomePage();
    });
  });

  test("login with standard_user", async ({ page }: { page: Page }) => {
    await homePage.login("standard_user", "secret_sauce");
    const currentUrl = page.url();
    expect(currentUrl).toBe("https://www.saucedemo.com/inventory.html");
    const pageTitle = await page.title();
    expect(pageTitle).toBe("Swag jabs");
  });
});
