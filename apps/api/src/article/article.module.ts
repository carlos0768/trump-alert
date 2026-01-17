import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { StatsService } from './stats.service';
import { FactCheckService } from './fact-check.service';
import { CollectorModule } from '../collector/collector.module';
import { AnalyzerModule } from '../analyzer/analyzer.module';

@Module({
  imports: [CollectorModule, AnalyzerModule],
  controllers: [ArticleController],
  providers: [ArticleService, StatsService, FactCheckService],
  exports: [ArticleService, StatsService, FactCheckService],
})
export class ArticleModule {}
