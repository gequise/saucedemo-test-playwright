
import { Reporter, TestCase, TestResult, Suite } from "@playwright/test/reporter";
import fetch from "node-fetch";


export default class SlackReporter implements Reporter {
  private webhookUrl: string;
  private passedCount: number = 0;
  private failedCount: number = 0;
  private totalCount: number = 0;
  private testResults: { title: string; status: string; location: string }[] = [];

  constructor(options: { webhookUrl: string }) {
    this.webhookUrl = options.webhookUrl;
    if (!this.webhookUrl || !/^https?:\/.*/.test(this.webhookUrl)) {
      console.warn(
        "⚠️ SlackReporter: Invalid or missing Slack webhook URL. Slack messages will not be sent."
      );
      this.webhookUrl = "";
    }
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    this.totalCount++;
    const location = `${test.location.file}:${test.location.line}`;
    if (result.status === "passed") {
      this.passedCount++;
      this.testResults.push({ title: test.title, status: "✅ Passed", location });
      if (this.webhookUrl) {
        await this.sendSlackMessage({
          text: `✅ Test passed: *${test.title}*\n📍 Location: ${location}`,
        });
      }
    } else if (result.status === "failed") {
      this.failedCount++;
      this.testResults.push({ title: test.title, status: "❌ Failed", location });
      if (this.webhookUrl) {
        await this.sendSlackMessage({
          text: `❌ Test failed: *${test.title}*\n📍 Location: ${location}`,
        });
      }
    }
  }

  async onEnd() {
    if (this.webhookUrl) {
      const summary = `*Test Summary*\nTotal: ${this.totalCount}\n✅ Passed: ${this.passedCount}\n❌ Failed: ${this.failedCount}`;
      let details = this.testResults.map(r => `${r.status}: *${r.title}* (${r.location})`).join("\n");
      const message = {
        text: `${summary}\n\n${details}`,
      };
      await this.sendSlackMessage(message);
    }
  }

  private async sendSlackMessage(message: { text: string }) {
    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        body: JSON.stringify(message),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        console.warn(
          `⚠️ SlackReporter: Slack notification failed with status ${response.status}`
        );
      }
    } catch (error) {
      console.error(`❌ SlackReporter: Failed to send Slack message`, error);
    }
  }
}
