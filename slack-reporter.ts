import { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

export default class SlackReporter implements Reporter {
  private webhookUrl: string;
  private finalResults: Map<string, { title: string; status: string; location: string }> = new Map();
  private gitHubRepo: string | undefined;
  private gitHubServerUrl: string | undefined;

  constructor(options: { webhookUrl: string }) {
    this.webhookUrl = options.webhookUrl;
    this.gitHubRepo = process.env.GITHUB_REPOSITORY;
    this.gitHubServerUrl = process.env.GITHUB_SERVER_URL;

    if (!this.webhookUrl || !/^https?:\/.*/.test(this.webhookUrl)) {
      console.warn("⚠️ SlackReporter: Invalid Webhook URL.");
      this.webhookUrl = "";
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const location = `${test.location.file}:${test.location.line}`;
    this.finalResults.set(test.id, {
      title: test.title,
      status: result.status === "passed" ? "✅ Passed" : "❌ Failed",
      location,
    });
  }

  async onEnd() {
    if (!this.webhookUrl) return;

    let passedCount = 0;
    let failedCount = 0;

    for (const r of this.finalResults.values()) {
      if (r.status === "✅ Passed") passedCount++;
      else failedCount++;
    }

    const totalCount = passedCount + failedCount;
    const now = new Date();
    const dateStr = now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" });
    
    const header = failedCount > 0 ? "🚨 Tests Failed" : "🚀 Tests Passed";
    const summary = `*Test Summary*\nDate: ${dateStr}\nTotal: ${totalCount}\n✅ Passed: ${passedCount}\n❌ Failed: ${failedCount}`;
    
    const payload = {
      text: `${header}\n${summary}`
    };

    await this.sendSlackMessage(payload);
  }

  private async sendSlackMessage(payload: any) {
    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        console.warn(`⚠️ SlackReporter Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ SlackReporter Error`, error);
    }
  }
}
