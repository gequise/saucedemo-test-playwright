import { Locator, Page } from "@playwright/test";
import locators from "../locators/saucedemo.json";

export class HomePage {
  readonly page: Page;
  readonly userName: Locator;
  readonly userPassword: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userName = page.locator(locators.userNameInput);
    this.userPassword = page.locator(locators.userPasswordInput);
    this.loginButton = page.locator(locators.loginButton);
  }

  async urlHomePage() {
    await this.page.goto("/");
  }

  async login(username: string = "", password: string = "") {
    await this.userName.type(username);
    await this.userPassword.type(password);
    await this.loginButton.click();
  }
}
