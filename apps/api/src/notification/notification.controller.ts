import { Controller, Get } from '@nestjs/common';
import { WebPushService } from './web-push.service';

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly webPushService: WebPushService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    const publicKey = this.webPushService.getVapidPublicKey();
    if (!publicKey) {
      return { error: 'VAPID keys not configured' };
    }
    return { publicKey };
  }
}
