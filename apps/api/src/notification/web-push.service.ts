import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  badge?: string;
  tag?: string;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);

  private readonly vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  private readonly vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  private readonly vapidEmail =
    process.env.VAPID_EMAIL || 'mailto:admin@trumpalert.app';

  onModuleInit() {
    if (this.vapidPublicKey && this.vapidPrivateKey) {
      webpush.setVapidDetails(
        this.vapidEmail,
        this.vapidPublicKey,
        this.vapidPrivateKey
      );
      this.logger.log('Web Push VAPID keys configured successfully');
    } else {
      this.logger.warn(
        'VAPID keys not configured - Web Push notifications disabled'
      );
    }
  }

  async send(subscription: unknown, payload: PushPayload): Promise<boolean> {
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured, skipping web push');
      return false;
    }

    if (!this.isValidSubscription(subscription)) {
      this.logger.warn('Invalid subscription object');
      return false;
    }

    try {
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/badge-72.png',
        url: payload.url || '/',
        tag: payload.tag || 'trump-alert',
        timestamp: Date.now(),
      });

      await webpush.sendNotification(
        subscription as PushSubscription,
        notificationPayload
      );

      this.logger.log(`Push notification sent to ${subscription.endpoint}`);
      return true;
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription has expired or is no longer valid
        this.logger.warn(
          `Subscription expired or invalid: ${subscription.endpoint}`
        );
        return false;
      }

      this.logger.error(`Failed to send push notification: ${err.message}`);
      throw error;
    }
  }

  private isValidSubscription(sub: unknown): sub is PushSubscription {
    if (!sub || typeof sub !== 'object') return false;
    const subscription = sub as Record<string, unknown>;
    return (
      typeof subscription.endpoint === 'string' &&
      subscription.endpoint.length > 0 &&
      typeof subscription.keys === 'object' &&
      subscription.keys !== null &&
      typeof (subscription.keys as Record<string, unknown>).p256dh ===
        'string' &&
      typeof (subscription.keys as Record<string, unknown>).auth === 'string'
    );
  }

  getVapidPublicKey(): string | undefined {
    return this.vapidPublicKey;
  }
}
