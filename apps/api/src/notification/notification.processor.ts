import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationService,
  NotificationPayload,
} from './notification.service';

@Injectable()
@Processor('notification-send')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private notificationService: NotificationService) {
    super();
  }

  async process(job: Job<NotificationPayload>) {
    this.logger.log(`Processing notification job: ${job.id}`);

    try {
      await this.notificationService.sendNotification(job.data);
      this.logger.log(`Notification job ${job.id} completed successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Notification job ${job.id} failed:`, error);
      throw error;
    }
  }
}
