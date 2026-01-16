import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { StatsService } from './stats.service';
import { CollectorModule } from '../collector/collector.module';

@Module({
  imports: [CollectorModule],
  controllers: [ArticleController],
  providers: [ArticleService, StatsService],
  exports: [ArticleService, StatsService],
})
export class ArticleModule {}
