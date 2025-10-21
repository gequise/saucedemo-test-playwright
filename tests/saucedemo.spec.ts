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
    expect(pageTitle).toBe("Swag Labs");
  });

  test("login with locked_out_user", async ({ page }: { page: Page }) => {
    await homePage.login("locked_out_user", "secret_sauce");
    const errorMsg = await page.locator('[data-test="error"]').textContent();
    expect(errorMsg).toContain("Sorry, this user has been locked out.");
  });

  test("login with invalid username", async ({ page }: { page: Page }) => {
    await homePage.login("invalid_user", "secret_sauce");
    const errorMsg = await page.locator('[data-test="error"]').textContent();
    expect(errorMsg).toContain("Username and password do not match any user in this service");
  });

  test("login with invalid password", async ({ page }: { page: Page }) => {
    await homePage.login("standard_user", "wrong_password");
    const errorMsg = await page.locator('[data-test="error"]').textContent();
    expect(errorMsg).toContain("Username and password do not match any user in this service");
  });

  test("login with empty credentials", async ({ page }: { page: Page }) => {
    await homePage.login("", "");
    const errorMsg = await page.locator('[data-test="error"]').textContent();
    expect(errorMsg).toContain("Username is required");
  });
});
