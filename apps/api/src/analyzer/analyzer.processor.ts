import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AIAnalyzerService } from './ai-analyzer.service';

@Processor('ai-analysis', {
  concurrency: 3, // Process up to 3 analyses in parallel
})
export class AnalyzerProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyzerProcessor.name);

  constructor(private readonly aiAnalyzer: AIAnalyzerService) {
    super();
  }

  async process(job: Job<{ articleId: string }>): Promise<void> {
    this.logger.log(
      `Processing AI analysis job ${job.id} for article ${job.data.articleId}`
    );

    try {
      await this.aiAnalyzer.analyzeArticle(job.data.articleId);
      this.logger.log(
        `Completed AI analysis for article ${job.data.articleId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed AI analysis for article ${job.data.articleId}: ${error}`
      );
      throw error; // Let BullMQ handle retry
    }
  }
}
