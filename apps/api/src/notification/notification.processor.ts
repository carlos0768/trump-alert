import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import {
  NotificationService,
  NotificationPayload,
} from './notification.service';
import { AlertService } from '../alert/alert.service';

interface NotificationJobData extends NotificationPayload {
  alertId: string;
}

@Injectable()
@Processor('notification-send')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private notificationService: NotificationService,
    @Inject(forwardRef(() => AlertService))
    private alertService: AlertService
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>) {
    this.logger.log(`Processing notification job: ${job.id}`);

    try {
      await this.notificationService.sendNotification(job.data);

      // Log that this notification was sent to prevent duplicates
      await this.alertService.logNotificationSent(
        job.data.alertId,
        job.data.articleId,
        {
          push: job.data.notifyPush,
          email: job.data.notifyEmail,
          discord: job.data.notifyDiscord,
        }
      );

      this.logger.log(`Notification job ${job.id} completed successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Notification job ${job.id} failed:`, error);
      throw error;
    }
  }
}
