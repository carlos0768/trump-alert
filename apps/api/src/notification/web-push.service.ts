import { Injectable, Logger } from '@nestjs/common';

// Note: In production, install web-push package:
// pnpm add web-push
// For now, we implement a stub that can be replaced

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);

  // VAPID keys should be set in environment variables
  private readonly vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  private readonly vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  private readonly vapidEmail =
    process.env.VAPID_EMAIL || 'mailto:admin@trumpalert.app';

  async send(subscription: unknown, payload: PushPayload): Promise<void> {
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured, skipping web push');
      return;
    }

    try {
      // Dynamic import to avoid errors if web-push is not installed
      const webpush = await import('web-push').catch(() => null);

      if (!webpush) {
        this.logger.warn(
          'web-push package not installed, skipping push notification'
        );
        return;
      }

      webpush.setVapidDetails(
        this.vapidEmail,
        this.vapidPublicKey,
        this.vapidPrivateKey
      );

      await webpush.sendNotification(
        subscription as webpush.PushSubscription,
        JSON.stringify(payload)
      );

      this.logger.log(`Push notification sent successfully`);
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      throw error;
    }
  }

  getVapidPublicKey(): string | undefined {
    return this.vapidPublicKey;
  }
}
