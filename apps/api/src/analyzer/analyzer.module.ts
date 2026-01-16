import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AIAnalyzerService } from './ai-analyzer.service';
import { AnalyzerProcessor } from './analyzer.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-analysis',
    }),
  ],
  providers: [AIAnalyzerService, AnalyzerProcessor],
  exports: [AIAnalyzerService],
})
export class AnalyzerModule {}
