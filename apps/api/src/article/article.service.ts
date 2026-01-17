import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ArticleFilters {
  sources?: string[];
  impactLevels?: string[];
  biases?: string[];
  timeRange?: string;
  search?: string;
}

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);

  async findMany(
    limit: number = 50,
    offset: number = 0,
    filters?: ArticleFilters
  ) {
    const where: Record<string, unknown> = {};

    if (filters?.sources?.length) {
      where.source = { in: filters.sources };
    }

    if (filters?.impactLevels?.length) {
      where.impactLevel = { in: filters.impactLevels };
    }

    if (filters?.biases?.length) {
      where.bias = { in: filters.biases };
    }

    if (filters?.timeRange) {
      const now = new Date();
      let since: Date;

      switch (filters.timeRange) {
        case '1h':
          since = new Date(now.getTime() - 1 * 60 * 60 * 1000);
          break;
        case '6h':
          since = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      where.publishedAt = { gte: since };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    // Transform to flatten tags
    const transformedArticles = articles.map((article) => ({
      ...article,
      tags: article.tags.map((at) => at.tag),
    }));

    return {
      articles: transformedArticles,
      total,
      hasMore: offset + limit < total,
    };
  }

  async findById(id: string) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!article) return null;

    return {
      ...article,
      tags: article.tags.map((at) => at.tag),
    };
  }

  async getRelatedArticles(id: string, limit: number = 5) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!article) {
      return [];
    }

    const tagIds = article.tags.map((at) => at.tagId);

    // Find articles with similar tags or same bias
    return prisma.article.findMany({
      where: {
        id: { not: id },
        OR: [
          { bias: article.bias },
          {
            tags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async getSources() {
    const sources = await prisma.article.groupBy({
      by: ['source'],
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
    });

    return sources.map((s) => ({
      name: s.source,
      count: s._count.source,
    }));
  }

  async findUnanalyzed(limit: number = 10) {
    // Find articles that don't have Japanese translation yet
    return prisma.article.findMany({
      where: {
        OR: [{ titleJa: null }, { titleJa: '' }],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async findArticlesWithoutTags(limit: number = 20) {
    // Find articles that have no tags assigned yet
    return prisma.article.findMany({
      where: {
        tags: { none: {} },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }
}
