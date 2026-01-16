import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@trump-alert/database';

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
          tags: true,
        },
      }),
      prisma.article.count({ where }),
    ]);

    return {
      articles,
      total,
      hasMore: offset + limit < total,
    };
  }

  async findById(id: string) {
    return prisma.article.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });
  }

  async getRelatedArticles(id: string, limit: number = 5) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!article) {
      return [];
    }

    // Find articles with similar tags or same bias
    return prisma.article.findMany({
      where: {
        id: { not: id },
        OR: [
          { bias: article.bias },
          {
            tags: {
              some: {
                id: { in: article.tags.map((t) => t.id) },
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
}
