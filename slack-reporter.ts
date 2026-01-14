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
      console.warn("⚠️ SlackReporter: URL de webhook inválida.");
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
    const dateStr = now.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
    
    let reportUrl = "No disponible (Ejecución local)";
    let repoUrl = "";
    
    if (this.gitHubRepo) {
        const [owner, repo] = this.gitHubRepo.split('/');
        reportUrl = `https://${owner}.github.io/${repo}/`;
        repoUrl = `${this.gitHubServerUrl}/${this.gitHubRepo}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    }

    const payload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: failedCount > 0 ? "🚨 Pruebas Fallidas" : "🚀 Pruebas Exitosas",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Fecha:*\n${dateStr}` },
            { type: "mrkdwn", text: `*Total Tests:*\n${totalCount}` },
            { type: "mrkdwn", text: `*✅ Pasaron:*\n${passedCount}` },
            { type: "mrkdwn", text: `*❌ Fallaron:*\n${failedCount}` }
          ]
        }
      ]
    };

    if (this.gitHubRepo) {
        payload.blocks.push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: { type: "plain_text", text: "📊 Ver Reporte HTML", emoji: true },
                    style: failedCount > 0 ? "danger" : "primary",
                    url: reportUrl
                },
                {
                    type: "button",
                    text: { type: "plain_text", text: "🔍 Ver Logs en GitHub", emoji: true },
                    url: repoUrl
                }
            ]
        });
    }

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
