import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface StorylineWithArticles {
  id: string;
  title: string;
  titleJa: string | null;
  description: string;
  descriptionJa: string | null;
  status: string;
  category: string | null;
  summary: string | null;
  summaryJa: string | null;
  firstEventAt: Date;
  lastEventAt: Date;
  eventCount: number;
  createdAt: Date;
  updatedAt: Date;
  articles: Array<{
    articleId: string;
    addedAt: Date;
    isKeyEvent: boolean;
    article: {
      id: string;
      title: string;
      titleJa: string | null;
      source: string;
      publishedAt: Date;
      impactLevel: string;
      summary: string[];
    };
  }>;
}

@Injectable()
export class StorylineService {
  private readonly logger = new Logger(StorylineService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  // Run every hour to update storylines
  @Cron(CronExpression.EVERY_HOUR)
  async generateStorylines() {
    this.logger.log('Starting storyline generation...');
    await this.clusterAndCreateStorylines();
  }

  async findAll(status?: string) {
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const storylines = await this.prisma.storyline.findMany({
      where,
      orderBy: { lastEventAt: 'desc' },
      include: {
        articles: {
          orderBy: { addedAt: 'desc' },
          take: 5,
          include: {
            article: {
              select: {
                id: true,
                title: true,
                titleJa: true,
                source: true,
                publishedAt: true,
                impactLevel: true,
                summary: true,
              },
            },
          },
        },
      },
    });

    return storylines;
  }

  async findById(id: string): Promise<StorylineWithArticles | null> {
    const storyline = await this.prisma.storyline.findUnique({
      where: { id },
      include: {
        articles: {
          orderBy: { addedAt: 'desc' },
          include: {
            article: {
              select: {
                id: true,
                title: true,
                titleJa: true,
                source: true,
                publishedAt: true,
                impactLevel: true,
                summary: true,
              },
            },
          },
        },
      },
    });

    return storyline as StorylineWithArticles | null;
  }

  async getRecentUpdates(limit: number = 5) {
    // Get storylines that were recently updated
    const recentlyUpdated = await this.prisma.storyline.findMany({
      where: {
        status: 'ongoing',
        lastEventAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { lastEventAt: 'desc' },
      take: limit,
      include: {
        articles: {
          orderBy: { addedAt: 'desc' },
          take: 1,
          include: {
            article: {
              select: {
                id: true,
                title: true,
                titleJa: true,
                source: true,
                publishedAt: true,
              },
            },
          },
        },
      },
    });

    return recentlyUpdated;
  }

  async clusterAndCreateStorylines() {
    if (!this.openai) {
      this.logger.warn('OpenAI not configured, skipping storyline generation');
      return;
    }

    try {
      // Get recent articles (last 7 days) that aren't in any storyline
      const recentArticles = await this.prisma.article.findMany({
        where: {
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          storylines: { none: {} },
        },
        orderBy: { publishedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          content: true,
          publishedAt: true,
          source: true,
          impactLevel: true,
        },
      });

      if (recentArticles.length < 3) {
        this.logger.log('Not enough unlinked articles for clustering');
        return;
      }

      // Use AI to identify storylines
      const articleSummaries = recentArticles
        .map((a) => `[${a.id}] ${a.title}`)
        .join('\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a news analyst. Identify ongoing storylines/narratives from Trump-related news.
Group related articles together into storylines. Each storyline should have:
- title: Short English title (max 50 chars)
- titleJa: Japanese title
- description: Brief English description (1-2 sentences)
- descriptionJa: Japanese description
- category: One of: tariff, legal, election, foreign_policy, domestic_policy, personnel, media, other
- articleIds: Array of article IDs that belong to this storyline

Output JSON array of storylines. Only include storylines with 2+ articles.`,
          },
          {
            role: 'user',
            content: `Identify storylines from these articles:\n\n${articleSummaries}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return;

      const result = JSON.parse(content);
      const storylines = result.storylines || result;

      if (!Array.isArray(storylines)) {
        this.logger.warn('Invalid storyline response format');
        return;
      }

      // Create or update storylines
      for (const sl of storylines) {
        if (!sl.articleIds || sl.articleIds.length < 2) continue;

        // Check if similar storyline already exists
        const existing = await this.prisma.storyline.findFirst({
          where: {
            OR: [
              { title: { contains: sl.title.substring(0, 20) } },
              { category: sl.category, status: 'ongoing' },
            ],
          },
        });

        if (existing) {
          // Add new articles to existing storyline
          await this.addArticlesToStoryline(existing.id, sl.articleIds);
        } else {
          // Create new storyline
          await this.createStoryline(sl);
        }
      }

      this.logger.log(`Processed ${storylines.length} storylines`);
    } catch (error) {
      this.logger.error(`Storyline generation failed: ${error}`);
    }
  }

  private async createStoryline(data: {
    title: string;
    titleJa?: string;
    description: string;
    descriptionJa?: string;
    category?: string;
    articleIds: string[];
  }) {
    // Get article dates for timeline
    const articles = await this.prisma.article.findMany({
      where: { id: { in: data.articleIds } },
      select: { id: true, publishedAt: true },
      orderBy: { publishedAt: 'asc' },
    });

    if (articles.length === 0) return;

    const storyline = await this.prisma.storyline.create({
      data: {
        title: data.title,
        titleJa: data.titleJa,
        description: data.description,
        descriptionJa: data.descriptionJa,
        category: data.category,
        status: 'ongoing',
        firstEventAt: articles[0].publishedAt,
        lastEventAt: articles[articles.length - 1].publishedAt,
        eventCount: articles.length,
        articles: {
          create: articles.map((a, index) => ({
            articleId: a.id,
            isKeyEvent: index === 0 || index === articles.length - 1,
          })),
        },
      },
    });

    this.logger.log(`Created storyline: ${storyline.title}`);
    return storyline;
  }

  private async addArticlesToStoryline(
    storylineId: string,
    articleIds: string[]
  ) {
    const storyline = await this.prisma.storyline.findUnique({
      where: { id: storylineId },
      include: { articles: true },
    });

    if (!storyline) return;

    const existingIds = new Set(storyline.articles.map((a) => a.articleId));
    const newIds = articleIds.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) return;

    // Get new articles
    const newArticles = await this.prisma.article.findMany({
      where: { id: { in: newIds } },
      select: { id: true, publishedAt: true },
    });

    // Add new articles
    await this.prisma.storylineArticle.createMany({
      data: newArticles.map((a) => ({
        storylineId,
        articleId: a.id,
      })),
      skipDuplicates: true,
    });

    // Update storyline metadata
    const latestArticle = newArticles.reduce((latest, a) =>
      a.publishedAt > latest.publishedAt ? a : latest
    );

    await this.prisma.storyline.update({
      where: { id: storylineId },
      data: {
        lastEventAt: latestArticle.publishedAt,
        eventCount: { increment: newIds.length },
      },
    });

    this.logger.log(
      `Added ${newIds.length} articles to storyline: ${storyline.title}`
    );
  }

  async updateStorylineSummary(storylineId: string) {
    if (!this.openai) return;

    const storyline = await this.findById(storylineId);
    if (!storyline) return;

    const timeline = storyline.articles
      .sort(
        (a, b) =>
          new Date(a.article.publishedAt).getTime() -
          new Date(b.article.publishedAt).getTime()
      )
      .map((a) => `- ${a.article.publishedAt}: ${a.article.title}`)
      .join('\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Summarize the current state of this ongoing story.
Provide:
- summary: Current situation in English (2-3 sentences)
- summaryJa: Same in Japanese
Output as JSON.`,
        },
        {
          role: 'user',
          content: `Story: ${storyline.title}\n\nTimeline:\n${timeline}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return;

    const { summary, summaryJa } = JSON.parse(content);

    await this.prisma.storyline.update({
      where: { id: storylineId },
      data: { summary, summaryJa },
    });
  }

  // Manual trigger for testing
  async triggerGeneration() {
    await this.clusterAndCreateStorylines();
    return { message: 'Storyline generation triggered' };
  }
}
