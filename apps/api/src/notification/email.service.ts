import { Injectable, Logger } from '@nestjs/common';

interface EmailPayload {
  to: string;
  subject: string;
  articleId: string;
  articleTitle: string;
  articleSource: string;
  articleSentiment: number | null;
  articleSummary: string[] | null;
  impactLevel: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendApiKey = process.env.RESEND_API_KEY;
  private readonly fromEmail =
    process.env.EMAIL_FROM || 'Trump Alert <noreply@trumpalert.app>';

  async send(payload: EmailPayload): Promise<void> {
    if (!this.resendApiKey) {
      this.logger.warn('RESEND_API_KEY not configured, skipping email');
      return;
    }

    const html = this.generateEmailHtml(payload);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: payload.to,
          subject: payload.subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      this.logger.log(`Email sent to ${payload.to}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }

  private generateEmailHtml(payload: EmailPayload): string {
    const summaryHtml = payload.articleSummary
      ? payload.articleSummary.map((s) => `<li>${s}</li>`).join('')
      : '<li>No summary available</li>';

    const sentimentColor =
      (payload.articleSentiment ?? 0) > 0
        ? '#22c55e'
        : (payload.articleSentiment ?? 0) < 0
          ? '#ef4444'
          : '#6b7280';

    const impactColors: Record<string, string> = {
      S: '#dc2626',
      A: '#f97316',
      B: '#eab308',
      C: '#6b7280',
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🚨 Trump Alert</h1>
  </div>

  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="display: inline-block; background: ${impactColors[payload.impactLevel] || '#6b7280'}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold; margin-bottom: 12px;">
      Impact: ${payload.impactLevel}
    </div>

    <h2 style="margin: 0 0 16px 0; font-size: 20px;">${payload.articleTitle}</h2>

    <p style="margin: 0 0 8px 0;">
      <strong>ソース:</strong> ${payload.articleSource}
    </p>

    <p style="margin: 0 0 16px 0;">
      <strong>感情スコア:</strong>
      <span style="color: ${sentimentColor}; font-weight: bold;">
        ${payload.articleSentiment?.toFixed(2) ?? 'N/A'}
      </span>
    </p>

    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px;">要約:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${summaryHtml}
      </ul>
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <a href="https://trumpalert.app/article/${payload.articleId}"
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        続きを読む
      </a>
    </div>
  </div>

  <div style="background: #f3f4f6; padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">
      このメールは Trump Alert からの自動通知です。<br>
      <a href="https://trumpalert.app/alerts" style="color: #2563eb;">通知設定を変更</a>
    </p>
  </div>
</body>
</html>
    `;
  }
}
