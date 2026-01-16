import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { ArticleService, ArticleFilters } from './article.service';
import { StatsService } from './stats.service';

@Controller('api')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly statsService: StatsService
  ) {}

  @Get('articles')
  async getArticles(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sources') sources?: string,
    @Query('impactLevels') impactLevels?: string,
    @Query('biases') biases?: string,
    @Query('timeRange') timeRange?: string,
    @Query('search') search?: string
  ) {
    const filters: ArticleFilters = {};

    if (sources) filters.sources = sources.split(',');
    if (impactLevels) filters.impactLevels = impactLevels.split(',');
    if (biases) filters.biases = biases.split(',');
    if (timeRange) filters.timeRange = timeRange;
    if (search) filters.search = search;

    return this.articleService.findMany(
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
      filters
    );
  }

  @Get('articles/:id')
  async getArticle(@Param('id') id: string) {
    const article = await this.articleService.findById(id);
    if (!article) {
      return { error: 'Article not found' };
    }
    return article;
  }

  @Get('articles/:id/related')
  async getRelatedArticles(
    @Param('id') id: string,
    @Query('limit') limit?: string
  ) {
    return this.articleService.getRelatedArticles(
      id,
      limit ? parseInt(limit) : 5
    );
  }

  @Get('sources')
  async getSources() {
    return this.articleService.getSources();
  }

  @Get('stats/trump-index')
  async getTrumpIndex(@Query('date') date?: string) {
    return this.statsService.getTrumpIndex(date);
  }

  @Get('stats/daily')
  async getDailyStats() {
    return this.statsService.getDailyStats();
  }

  @Get('stats/trending')
  async getTrendingTopics(@Query('limit') limit?: string) {
    return this.statsService.getTrendingTopics(limit ? parseInt(limit) : 10);
  }

  @Get('stats/stock')
  async getStockData() {
    return this.statsService.getStockData();
  }
}
