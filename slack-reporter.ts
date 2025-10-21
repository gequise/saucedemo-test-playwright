
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
      let detailsArr: string[] = [];
      for (const r of this.finalResults.values()) {
        if (r.status === "✅ Passed") passedCount++;
        else if (r.status === "❌ Failed") failedCount++;
        detailsArr.push(`${r.status}: *${r.title}* (${r.location})`);
      }
      const totalCount = passedCount + failedCount;
      const summary = `*Test Summary*\nTotal: ${totalCount}\n✅ Passed: ${passedCount}\n❌ Failed: ${failedCount}`;
      const details = detailsArr.join("\n");
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
