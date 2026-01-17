import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@Processor('notification-send')
export class AlertProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertProcessor.name);

  async process(job: Job) {
    this.logger.log(`Processing alert notification job: ${job.id}`);
    // 実際の通知はNotificationProcessorで処理
    return { processed: true };
  }
}
