import { Module } from '@nestjs/common';
import { AIAnalyzerService } from './ai-analyzer.service';

@Module({
  providers: [AIAnalyzerService],
  exports: [AIAnalyzerService],
})
export class AnalyzerModule {}
