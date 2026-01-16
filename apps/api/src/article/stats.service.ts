import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HourlyData {
  hour: string;
  avgSentiment: number;
  articleCount: number;
}

interface ImpactItem {
  impactLevel: string | null;
  _count: number;
}

interface BiasItem {
  bias: string | null;
  _count: number;
}

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  async getTrumpIndex(date?: string): Promise<HourlyData[]> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const articles = await prisma.article.findMany({
      where: {
        publishedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        sentiment: { not: null },
      },
      select: {
        sentiment: true,
        publishedAt: true,
      },
    });

    // Group by hour
    const hourlyMap = new Map<number, { total: number; count: number }>();

    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { total: 0, count: 0 });
    }

    for (const article of articles) {
      const hour = new Date(article.publishedAt).getHours();
      const current = hourlyMap.get(hour)!;
      current.total += article.sentiment || 0;
      current.count += 1;
    }

    const result: HourlyData[] = [];
    for (let i = 0; i < 24; i += 2) {
      const hourData = hourlyMap.get(i)!;
      const nextHourData = hourlyMap.get(i + 1) || { total: 0, count: 0 };

      const combinedTotal = hourData.total + nextHourData.total;
      const combinedCount = hourData.count + nextHourData.count;

      result.push({
        hour: `${i.toString().padStart(2, '0')}:00`,
        avgSentiment: combinedCount > 0 ? combinedTotal / combinedCount : 0,
        articleCount: combinedCount,
      });
    }

    return result;
  }

  async getDailyStats() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const [totalArticles, bySentiment, byImpact, byBias] = await Promise.all([
      prisma.article.count({
        where: { publishedAt: { gte: startOfDay } },
      }),
      prisma.article.aggregate({
        where: { publishedAt: { gte: startOfDay } },
        _avg: { sentiment: true },
      }),
      prisma.article.groupBy({
        by: ['impactLevel'],
        where: { publishedAt: { gte: startOfDay } },
        _count: true,
      }),
      prisma.article.groupBy({
        by: ['bias'],
        where: { publishedAt: { gte: startOfDay } },
        _count: true,
      }),
    ]);

    return {
      totalArticles,
      avgSentiment: bySentiment._avg.sentiment || 0,
      byImpact: (byImpact as ImpactItem[]).reduce(
        (acc: Record<string, number>, item: ImpactItem) => {
          if (item.impactLevel) acc[item.impactLevel] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      byBias: (byBias as BiasItem[]).reduce(
        (acc: Record<string, number>, item: BiasItem) => {
          if (item.bias) acc[item.bias] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  async getTrendingTopics(limit: number = 10) {
    // Get most frequently occurring tags in recent articles
    const recentArticles = await prisma.article.findMany({
      where: {
        publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    const tagCounts = new Map<string, number>();
    for (const article of recentArticles) {
      for (const articleTag of article.tags) {
        const tagName = articleTag.tag.name;
        tagCounts.set(tagName, (tagCounts.get(tagName) || 0) + 1);
      }
    }

    // Sort by count and return top N
    const sorted = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([name, count], index) => ({
      rank: index + 1,
      name,
      count,
    }));
  }

  async getStockData() {
    const latestPrice = await prisma.stockPrice.findFirst({
      where: { symbol: 'DJT' },
      orderBy: { timestamp: 'desc' },
    });

    const previousPrice = await prisma.stockPrice.findFirst({
      where: {
        symbol: 'DJT',
        timestamp: {
          lt: latestPrice?.timestamp || new Date(),
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestPrice) {
      return {
        symbol: 'DJT',
        price: 34.56,
        change: 2.34,
        changePercent: 7.26,
        volume: 12500000,
      };
    }

    return {
      symbol: latestPrice.symbol,
      price: latestPrice.price,
      change: previousPrice ? latestPrice.price - previousPrice.price : 0,
      changePercent: latestPrice.change,
      volume: Number(latestPrice.volume),
    };
  }
}
