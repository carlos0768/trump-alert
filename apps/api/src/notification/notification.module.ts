import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { WebPushService } from './web-push.service';
import { EmailService } from './email.service';
import { DiscordService } from './discord.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'notification-send' })],
  providers: [
    NotificationService,
    NotificationProcessor,
    WebPushService,
    EmailService,
    DiscordService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
