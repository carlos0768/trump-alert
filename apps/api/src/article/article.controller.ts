import { Controller, Get, Query, Param, Post } from '@nestjs/common';
import { ArticleService, ArticleFilters } from './article.service';
import { StatsService } from './stats.service';
import { FactCheckService } from './fact-check.service';
import { EmbeddingService } from './embedding.service';
import { NewsCollectorService } from '../collector/news-collector.service';
import { StockCollectorService } from '../collector/stock-collector.service';
import { TruthSocialScraperService } from '../collector/truth-social-scraper.service';
import { AIAnalyzerService } from '../analyzer/ai-analyzer.service';

@Controller('api')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly statsService: StatsService,
    private readonly factCheckService: FactCheckService,
    private readonly embeddingService: EmbeddingService,
    private readonly newsCollector: NewsCollectorService,
    private readonly stockCollector: StockCollectorService,
    private readonly truthSocialScraper: TruthSocialScraperService,
    private readonly aiAnalyzer: AIAnalyzerService
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

  @Get('stats/api-usage')
  async getApiUsageStats() {
    return this.statsService.getApiUsageStats();
  }

  @Get('stats/weekly')
  async getWeeklyStats() {
    return this.statsService.getWeeklyStats();
  }

  @Get('stats/analytics-overview')
  async getAnalyticsOverview() {
    return this.statsService.getAnalyticsOverview();
  }

  @Get('stats/urgent')
  async getUrgentStats() {
    return this.statsService.getUrgentStats();
  }

  @Post('collect')
  async triggerCollection() {
    return this.newsCollector.triggerCollection();
  }

  @Post('collect-stock')
  async triggerStockCollection() {
    return this.stockCollector.triggerCollection();
  }

  @Post('scrape-truth')
  async triggerTruthSocialScrape() {
    const count = await this.truthSocialScraper.scrape();
    return {
      success: true,
      message: `Scraped ${count} posts from Truth Social`,
      count,
    };
  }

  @Post('analyze/:id')
  async analyzeArticle(@Param('id') id: string) {
    const result = await this.aiAnalyzer.analyzeArticle(id);
    if (!result) {
      return { error: 'Analysis failed or article not found' };
    }
    return { success: true, result };
  }

  @Post('analyze-all')
  async analyzeUnanalyzedArticles(@Query('limit') limit?: string) {
    const articles = await this.articleService.findUnanalyzed(
      limit ? parseInt(limit) : 10
    );

    const results = [];
    for (const article of articles) {
      const result = await this.aiAnalyzer.analyzeArticle(article.id);
      results.push({
        id: article.id,
        title: article.title,
        success: !!result,
      });
    }

    return {
      analyzed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // ファクトチェック関連のエンドポイント
  @Get('fact-check')
  async getFactCheckComparisons(@Query('limit') limit?: string) {
    return this.factCheckService.getFactCheckComparisons(
      limit ? parseInt(limit) : 10
    );
  }

  @Get('fact-check/:topic')
  async getComparisonByTopic(@Param('topic') topic: string) {
    const comparison = await this.factCheckService.getComparisonByTopic(topic);
    if (!comparison) {
      return { error: 'No comparison found for this topic' };
    }
    return comparison;
  }

  // Backfill tags for existing articles
  @Post('backfill-tags')
  async backfillTags(@Query('limit') limit?: string) {
    const articles = await this.articleService.findArticlesWithoutTags(
      limit ? parseInt(limit) : 20
    );

    const results = [];
    for (const article of articles) {
      const result = await this.aiAnalyzer.analyzeArticle(article.id);
      results.push({
        id: article.id,
        title: article.title,
        success: !!result,
      });
    }

    return {
      processed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // Backfill embeddings for existing articles
  @Post('backfill-embeddings')
  async backfillEmbeddings(@Query('batchSize') batchSize?: string) {
    const articlesWithoutEmbedding =
      await this.embeddingService.getArticlesWithoutEmbedding();

    if (articlesWithoutEmbedding === 0) {
      return {
        message: 'All articles already have embeddings',
        processed: 0,
        failed: 0,
      };
    }

    const result = await this.embeddingService.backfillEmbeddings(
      batchSize ? parseInt(batchSize) : 10
    );

    return {
      message: `Backfill completed`,
      totalWithoutEmbedding: articlesWithoutEmbedding,
      ...result,
    };
  }

  // Get embedding statistics
  @Get('stats/embeddings')
  async getEmbeddingStats() {
    const withoutEmbedding =
      await this.embeddingService.getArticlesWithoutEmbedding();

    return {
      articlesWithoutEmbedding: withoutEmbedding,
    };
  }
}
