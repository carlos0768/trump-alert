import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { StatsService } from './stats.service';

@Module({
  controllers: [ArticleController],
  providers: [ArticleService, StatsService],
  exports: [ArticleService, StatsService],
})
export class ArticleModule {}
