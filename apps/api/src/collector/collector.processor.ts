import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NewsCollectorService } from './news-collector.service';

@Processor('news-fetch')
export class CollectorProcessor extends WorkerHost {
  private readonly logger = new Logger(CollectorProcessor.name);

  constructor(private readonly newsCollector: NewsCollectorService) {
    super();
  }

  async process(job: Job): Promise<number> {
    this.logger.log(`Processing job ${job.id}: ${job.name}`);

    switch (job.name) {
      case 'fetch-all':
        return await this.newsCollector.fetchAllFeeds();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return 0;
    }
  }
}
