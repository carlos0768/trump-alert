import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AIAnalyzerService } from '../analyzer/ai-analyzer.service';
import { StreamService } from '../stream/stream.service';
import { AlertService } from '../alert/alert.service';

const prisma = new PrismaClient();
const parser = new Parser();

interface RSSItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  isoDate?: string;
}

@Injectable()
export class NewsCollectorService {
  private readonly logger = new Logger(NewsCollectorService.name);

  constructor(
    @Inject(forwardRef(() => AIAnalyzerService))
    private readonly aiAnalyzer: AIAnalyzerService,
    @Inject(forwardRef(() => StreamService))
    private readonly streamService: StreamService,
    @Inject(forwardRef(() => AlertService))
    private readonly alertService: AlertService
  ) {}

  private readonly RSS_FEEDS = [
    {
      url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss',
      source: 'CNN',
      bias: 'Left' as const,
    },
    {
      url: 'https://moxie.foxnews.com/google-publisher/politics.xml',
      source: 'Fox News',
      bias: 'Right' as const,
    },
    {
      url: 'http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml',
      source: 'BBC',
      bias: 'Center' as const,
    },
    {
      url: 'https://feeds.npr.org/1001/rss.xml',
      source: 'NPR',
      bias: 'Left' as const,
    },
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
      source: 'NYT',
      bias: 'Left' as const,
    },
  ];

  // Run every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectNews() {
    this.logger.log('Starting scheduled news collection...');
    await this.fetchAllFeeds();
  }

  async fetchAllFeeds(): Promise<number> {
    let totalNewArticles = 0;

    for (const feed of this.RSS_FEEDS) {
      try {
        const newArticles = await this.fetchFeed(feed);
        totalNewArticles += newArticles;
        // Rate limiting: wait 2 seconds between feeds
        await this.sleep(2000);
      } catch (error) {
        this.logger.error(`Error fetching ${feed.source}: ${error}`);
      }
    }

    this.logger.log(`Collected ${totalNewArticles} new articles`);
    return totalNewArticles;
  }

  private async fetchFeed(feed: {
    url: string;
    source: string;
    bias: 'Left' | 'Center' | 'Right';
  }): Promise<number> {
    this.logger.log(`Fetching ${feed.source}...`);

    const result = await parser.parseURL(feed.url);
    let newCount = 0;

    for (const item of result.items) {
      // Filter for Trump-related content
      if (!this.isTrumpRelated(item)) {
        continue;
      }

      const urlHash = this.hashUrl(item.link || '');
      const exists = await this.articleExists(urlHash);

      if (!exists && item.link) {
        const article = await this.saveArticle(item, feed);
        if (article) {
          newCount++;

          // Publish to SSE stream for real-time updates
          this.streamService.publishArticle({
            id: article.id,
            title: article.title,
            source: article.source,
            impactLevel: article.impactLevel,
            sentiment: null,
            summary: null,
            publishedAt: article.publishedAt,
          });

          // Analyze the new article in the background
          this.aiAnalyzer
            .analyzeArticle(article.id)
            .then(async (analyzed) => {
              if (analyzed) {
                // Check alerts after analysis is complete
                await this.alertService.checkAndTriggerAlerts({
                  id: analyzed.id,
                  title: analyzed.title,
                  content: analyzed.content,
                  impactLevel: analyzed.impactLevel,
                  source: analyzed.source,
                  sentiment: analyzed.sentiment,
                  summary: analyzed.summary,
                });
              }
            })
            .catch((err) => {
              this.logger.error(
                `Failed to analyze article ${article.id}: ${err}`
              );
            });
        }
      }
    }

    this.logger.log(
      `Found ${newCount} new Trump-related articles from ${feed.source}`
    );
    return newCount;
  }

  private isTrumpRelated(item: RSSItem): boolean {
    const text =
      `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
    const keywords = [
      'trump',
      'donald trump',
      'djt',
      'truth social',
      'maga',
      'trump 2024',
      'trump 2028',
      'mar-a-lago',
      'melania',
    ];
    return keywords.some((kw) => text.includes(kw));
  }

  private hashUrl(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  private async articleExists(urlHash: string): Promise<boolean> {
    const existing = await prisma.article.findFirst({
      where: { url: { contains: urlHash.substring(0, 8) } },
    });
    return !!existing;
  }

  private async saveArticle(
    item: RSSItem,
    feed: { source: string; bias: 'Left' | 'Center' | 'Right' }
  ) {
    try {
      const article = await prisma.article.create({
        data: {
          title: item.title || 'Untitled',
          url: item.link || '',
          source: feed.source,
          content: item.content || item.contentSnippet || '',
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
          bias: feed.bias,
          impactLevel: 'C', // Default, will be updated by AI
          summary: [],
        },
      });
      return article;
    } catch (error) {
      this.logger.error(`Failed to save article: ${error}`);
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Manual trigger for testing
  async triggerCollection(): Promise<{ collected: number }> {
    const count = await this.fetchAllFeeds();
    return { collected: count };
  }
}
