import { Injectable, Logger } from '@nestjs/common';
import { WebPushService } from './web-push.service';
import { EmailService } from './email.service';
import { DiscordService } from './discord.service';

export interface NotificationPayload {
  userId: string;
  articleId: string;
  articleTitle: string;
  articleSummary: string[] | null;
  articleSource: string;
  articleSentiment: number | null;
  impactLevel: string;
  notifyPush: boolean;
  notifyEmail: boolean;
  notifyDiscord: boolean;
  user: {
    id: string;
    email: string;
    pushSubscription: unknown;
    discordWebhook: string | null;
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private webPushService: WebPushService,
    private emailService: EmailService,
    private discordService: DiscordService
  ) {}

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (payload.notifyPush && payload.user.pushSubscription) {
      promises.push(
        this.webPushService.send(payload.user.pushSubscription, {
          title: `[${payload.impactLevel}] ${payload.articleTitle}`,
          body: payload.articleSummary?.[0] || 'New alert triggered',
          icon: '/icon-192.png',
          url: `/article/${payload.articleId}`,
        })
      );
    }

    if (payload.notifyEmail && payload.user.email) {
      promises.push(
        this.emailService.send({
          to: payload.user.email,
          subject: `[${payload.impactLevel}] ${payload.articleTitle}`,
          articleId: payload.articleId,
          articleTitle: payload.articleTitle,
          articleSource: payload.articleSource,
          articleSentiment: payload.articleSentiment,
          articleSummary: payload.articleSummary,
          impactLevel: payload.impactLevel,
        })
      );
    }

    if (payload.notifyDiscord && payload.user.discordWebhook) {
      promises.push(
        this.discordService.send(payload.user.discordWebhook, {
          articleId: payload.articleId,
          articleTitle: payload.articleTitle,
          articleSource: payload.articleSource,
          articleSentiment: payload.articleSentiment,
          articleSummary: payload.articleSummary,
          impactLevel: payload.impactLevel,
        })
      );
    }

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(`Notification ${index} failed:`, result.reason);
      }
    });
  }
}
