
import { Reporter, TestCase, TestResult, Suite } from "@playwright/test/reporter";
import fetch from "node-fetch";


export default class SlackReporter implements Reporter {
  private webhookUrl: string;
  private finalResults: Map<string, { title: string; status: string; location: string } > = new Map();

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
    // Solo guardamos el resultado final por test.id
    const location = `${test.location.file}:${test.location.line}`;
    this.finalResults.set(test.id, {
      title: test.title,
      status: result.status === "passed" ? "✅ Passed" : "❌ Failed",
      location,
    });
  }

  async onEnd() {
    if (this.webhookUrl) {
      let passedCount = 0;
      let failedCount = 0;
      for (const r of this.finalResults.values()) {
        if (r.status === "✅ Passed") passedCount++;
        else if (r.status === "❌ Failed") failedCount++;
      }
      const totalCount = passedCount + failedCount;
      const now = new Date();
      const dateStr = now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
      const summary = `*Test Summary*\nDate: ${dateStr}\nTotal: ${totalCount}\n✅ Passed: ${passedCount}\n❌ Failed: ${failedCount}`;
      const message = {
        text: summary,
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
