import { Injectable, Logger } from '@nestjs/common';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

interface PushSubscriptionLike {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
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

    if (!subscription || typeof subscription !== 'object') {
      this.logger.warn('Invalid subscription object');
      return;
    }

    const sub = subscription as PushSubscriptionLike;
    if (!sub.endpoint) {
      this.logger.warn('No endpoint in subscription');
      return;
    }

    // For now, log the push notification (web-push package needs to be installed)
    this.logger.log(
      `Would send push notification to ${sub.endpoint}: ${payload.title}`
    );

    // TODO: When web-push is installed, uncomment the following:
    // const webpush = require('web-push');
    // webpush.setVapidDetails(this.vapidEmail, this.vapidPublicKey, this.vapidPrivateKey);
    // await webpush.sendNotification(subscription, JSON.stringify(payload));
  }

  getVapidPublicKey(): string | undefined {
    return this.vapidPublicKey;
  }
}
