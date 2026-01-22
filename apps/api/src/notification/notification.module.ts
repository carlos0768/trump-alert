import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { NotificationController } from './notification.controller';
import { WebPushService } from './web-push.service';
import { EmailService } from './email.service';
import { DiscordService } from './discord.service';
import { AlertModule } from '../alert/alert.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notification-send',
      defaultJobOptions: {
        // 完了済みジョブを24時間保持して重複防止
        removeOnComplete: {
          age: 60 * 60 * 24, // 24時間（秒単位）
          count: 10000, // 最大10000件保持
        },
        removeOnFail: {
          age: 60 * 60 * 24 * 7, // 失敗は7日間保持
        },
      },
    }),
    forwardRef(() => AlertModule),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationProcessor,
    WebPushService,
    EmailService,
    DiscordService,
  ],
  exports: [NotificationService, WebPushService, EmailService],
})
export class NotificationModule {}
