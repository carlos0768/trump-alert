import { Injectable, Logger } from '@nestjs/common';

interface DiscordPayload {
  articleId: string;
  articleTitle: string;
  articleSource: string;
  articleSentiment: number | null;
  articleSummary: string[] | null;
  impactLevel: string;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  async send(webhookUrl: string, payload: DiscordPayload): Promise<void> {
    const impactColors: Record<string, number> = {
      S: 0xdc2626, // red
      A: 0xf97316, // orange
      B: 0xeab308, // yellow
      C: 0x6b7280, // gray
    };

    const sentimentEmoji =
      (payload.articleSentiment ?? 0) > 0.3
        ? '📈'
        : (payload.articleSentiment ?? 0) < -0.3
          ? '📉'
          : '➡️';

    const embed = {
      title: payload.articleTitle,
      url: `https://trumpalert.app/article/${payload.articleId}`,
      color: impactColors[payload.impactLevel] || 0x6b7280,
      fields: [
        {
          name: 'ソース',
          value: payload.articleSource,
          inline: true,
        },
        {
          name: '感情スコア',
          value: `${sentimentEmoji} ${payload.articleSentiment?.toFixed(2) ?? 'N/A'}`,
          inline: true,
        },
        {
          name: 'Impact Level',
          value: payload.impactLevel,
          inline: true,
        },
      ],
      description: payload.articleSummary?.join('\n') || 'No summary available',
      footer: {
        text: 'Trump Alert',
        icon_url: 'https://trumpalert.app/icon-192.png',
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Discord webhook error: ${error}`);
      }

      this.logger.log('Discord notification sent successfully');
    } catch (error) {
      this.logger.error('Failed to send Discord notification:', error);
      throw error;
    }
  }
}
