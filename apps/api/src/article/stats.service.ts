import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface OperationTotal {
  operation: string;
  _sum: {
    inputTokens: number | null;
    outputTokens: number | null;
    cost: number | null;
  };
  _count: number;
}

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

  constructor(private prisma: PrismaService) {}

  async getTrumpIndex(date?: string): Promise<HourlyData[]> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const articles = await this.prisma.article.findMany({
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
      this.prisma.article.count({
        where: { publishedAt: { gte: startOfDay } },
      }),
      this.prisma.article.aggregate({
        where: { publishedAt: { gte: startOfDay } },
        _avg: { sentiment: true },
      }),
      this.prisma.article.groupBy({
        by: ['impactLevel'],
        where: { publishedAt: { gte: startOfDay } },
        _count: true,
      }),
      this.prisma.article.groupBy({
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
    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

    // Get tag counts for the last 24 hours
    const recentTagCounts = await this.getTagCounts(oneDayAgo, new Date());

    // Get tag counts for 24-48 hours ago (for trend comparison)
    const previousTagCounts = await this.getTagCounts(twoDaysAgo, oneDayAgo);

    // Calculate trends and sort by count
    const topics = Array.from(recentTagCounts.entries())
      .map(([name, count]) => {
        const previousCount = previousTagCounts.get(name) || 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';

        // Calculate trend based on change percentage
        if (previousCount === 0 && count > 0) {
          trend = 'up'; // New topic
        } else if (previousCount > 0) {
          const changeRatio = count / previousCount;
          if (changeRatio > 1.2) {
            trend = 'up'; // More than 20% increase
          } else if (changeRatio < 0.8) {
            trend = 'down'; // More than 20% decrease
          }
        }

        return { name, count, trend };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return topics.map((topic, index) => ({
      rank: index + 1,
      name: topic.name,
      count: topic.count,
      trend: topic.trend,
    }));
  }

  /**
   * Get tag counts for a specific time period
   * Falls back to keyword extraction if no tags exist
   */
  private async getTagCounts(
    from: Date,
    to: Date
  ): Promise<Map<string, number>> {
    const articles = await this.prisma.article.findMany({
      where: {
        publishedAt: { gte: from, lte: to },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    const tagCounts = new Map<string, number>();

    // First, count tags from ArticleTag relations
    for (const article of articles) {
      for (const articleTag of article.tags) {
        const tagName = articleTag.tag.name;
        tagCounts.set(tagName, (tagCounts.get(tagName) || 0) + 1);
      }
    }

    // If no tags found via relations, extract keywords from article content
    if (tagCounts.size === 0 && articles.length > 0) {
      this.logger.log(
        `No tags found, extracting keywords from ${articles.length} articles`
      );
      for (const article of articles) {
        const keywords = this.extractKeywords(article.title, article.content);
        for (const keyword of keywords) {
          tagCounts.set(keyword, (tagCounts.get(keyword) || 0) + 1);
        }
      }
    }

    return tagCounts;
  }

  /**
   * Extract keywords from article title and content
   * Used as fallback when articles don't have tags
   */
  private extractKeywords(title: string, content?: string): string[] {
    const text = `${title} ${content || ''}`.toLowerCase();
    const keywords: string[] = [];

    const keywordMap: Record<string, string> = {
      tariff: 'Tariff',
      tariffs: 'Tariff',
      immigration: 'Immigration',
      immigrant: 'Immigration',
      border: 'Border',
      election: 'Election',
      '2024': 'Election2024',
      '2028': 'Election2028',
      trial: 'Trial',
      court: 'Trial',
      lawsuit: 'Trial',
      indictment: 'Indictment',
      indicted: 'Indictment',
      china: 'China',
      chinese: 'China',
      economy: 'Economy',
      economic: 'Economy',
      inflation: 'Economy',
      stock: 'DJTStock',
      djt: 'DJTStock',
      rally: 'Rally',
      vance: 'Vance',
      'truth social': 'TruthSocial',
      maga: 'MAGA',
      'jan 6': 'Jan6',
      'january 6': 'Jan6',
      classified: 'ClassifiedDocs',
      'executive order': 'ExecutiveOrder',
      'mar-a-lago': 'MarALago',
      russia: 'Russia',
      ukraine: 'Ukraine',
      nato: 'NATO',
      hush: 'HushMoney',
      manhattan: 'ManhattanTrial',
      georgia: 'GeorgiaTrial',
      deport: 'Deportation',
      deportation: 'Deportation',
      tax: 'Tax',
      taxes: 'Tax',
    };

    for (const [keyword, tag] of Object.entries(keywordMap)) {
      if (text.includes(keyword) && !keywords.includes(tag)) {
        keywords.push(tag);
      }
    }

    return keywords;
  }

  async getStockData() {
    const latestPrice = await this.prisma.stockPrice.findFirst({
      where: { symbol: 'DJT' },
      orderBy: { timestamp: 'desc' },
    });

    // Return null if no stock data exists in database
    if (!latestPrice) {
      this.logger.warn('No stock data found in database');
      return null;
    }

    const previousPrice = await this.prisma.stockPrice.findFirst({
      where: {
        symbol: 'DJT',
        timestamp: {
          lt: latestPrice.timestamp,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Calculate change from previous price
    const priceChange = previousPrice
      ? latestPrice.price - previousPrice.price
      : 0;
    const changePercent = previousPrice
      ? ((latestPrice.price - previousPrice.price) / previousPrice.price) * 100
      : latestPrice.change; // Use stored change if no previous price

    return {
      symbol: latestPrice.symbol,
      price: latestPrice.price,
      change: Math.round(priceChange * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Number(latestPrice.volume),
      timestamp: latestPrice.timestamp,
    };
  }

  async getWeeklyStats() {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const [articleCount, sentimentData] = await Promise.all([
        this.prisma.article.count({
          where: {
            publishedAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.article.aggregate({
          where: {
            publishedAt: { gte: startOfDay, lte: endOfDay },
            sentiment: { not: null },
          },
          _avg: { sentiment: true },
        }),
      ]);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.push({
        day: dayNames[new Date(startOfDay).getDay()],
        date: startOfDay.toISOString().split('T')[0],
        articles: articleCount,
        sentiment: sentimentData._avg.sentiment || 0,
      });
    }

    return days;
  }

  async getAnalyticsOverview() {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [
      totalArticles,
      weeklyArticles,
      avgSentiment,
      sourcesCount,
      sourceDistribution,
    ] = await Promise.all([
      // Total articles
      this.prisma.article.count(),
      // This week's articles
      this.prisma.article.count({
        where: { publishedAt: { gte: startOfWeek } },
      }),
      // Average sentiment
      this.prisma.article.aggregate({
        where: { sentiment: { not: null } },
        _avg: { sentiment: true },
      }),
      // Unique sources count
      this.prisma.article.groupBy({
        by: ['source'],
      }),
      // Source distribution
      this.prisma.article.groupBy({
        by: ['source'],
        _count: true,
        orderBy: { _count: { source: 'desc' } },
      }),
    ]);

    // Calculate percentages for source distribution
    const totalForDistribution = sourceDistribution.reduce(
      (acc, s) => acc + s._count,
      0
    );
    const colors: Record<string, string> = {
      'Fox News': '#dc2626',
      CNN: '#3b82f6',
      BBC: '#6b7280',
      NPR: '#22c55e',
      NYT: '#000000',
      'Truth Social': '#8b5cf6',
    };

    const distribution = sourceDistribution.map((s) => ({
      name: s.source,
      value: Math.round((s._count / totalForDistribution) * 100),
      count: s._count,
      color: colors[s.source] || '#9ca3af',
    }));

    return {
      totalArticles,
      weeklyArticles,
      avgSentiment: avgSentiment._avg.sentiment || 0,
      sourcesTracked: sourcesCount.length,
      sourceDistribution: distribution,
    };
  }

  async getUrgentStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [urgentCount, breakingCount, latestUrgent] = await Promise.all([
      // Total urgent (S/A) articles in last 24 hours
      this.prisma.article.count({
        where: {
          publishedAt: { gte: twentyFourHoursAgo },
          impactLevel: { in: ['S', 'A'] },
        },
      }),
      // Breaking: urgent articles in last 1 hour
      this.prisma.article.count({
        where: {
          publishedAt: { gte: oneHourAgo },
          impactLevel: { in: ['S', 'A'] },
        },
      }),
      // Latest urgent article for "breaking" indicator
      this.prisma.article.findFirst({
        where: {
          impactLevel: { in: ['S', 'A'] },
        },
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          titleJa: true,
          title: true,
          publishedAt: true,
          impactLevel: true,
        },
      }),
    ]);

    return {
      urgentCount,
      breakingCount,
      hasBreaking: breakingCount > 0,
      latestUrgent,
    };
  }

  async getApiUsageStats() {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayStats, monthStats, byOperation, recentUsage] =
      await Promise.all([
        // Today's totals
        this.prisma.apiUsage.aggregate({
          where: { createdAt: { gte: startOfToday } },
          _sum: {
            inputTokens: true,
            outputTokens: true,
            cost: true,
          },
          _count: true,
        }),
        // Month's totals
        this.prisma.apiUsage.aggregate({
          where: { createdAt: { gte: startOfMonth } },
          _sum: {
            inputTokens: true,
            outputTokens: true,
            cost: true,
          },
          _count: true,
        }),
        // Breakdown by operation
        this.prisma.apiUsage.groupBy({
          by: ['operation'],
          _sum: {
            inputTokens: true,
            outputTokens: true,
            cost: true,
          },
          _count: true,
          orderBy: { _sum: { cost: 'desc' } },
        }),
        // Recent usage entries
        this.prisma.apiUsage.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            provider: true,
            model: true,
            operation: true,
            inputTokens: true,
            outputTokens: true,
            cost: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      today: {
        calls: todayStats._count,
        inputTokens: todayStats._sum.inputTokens || 0,
        outputTokens: todayStats._sum.outputTokens || 0,
        cost: todayStats._sum.cost || 0,
      },
      month: {
        calls: monthStats._count,
        inputTokens: monthStats._sum.inputTokens || 0,
        outputTokens: monthStats._sum.outputTokens || 0,
        cost: monthStats._sum.cost || 0,
      },
      byOperation: (byOperation as OperationTotal[]).map((op) => ({
        operation: op.operation,
        calls: op._count,
        inputTokens: op._sum.inputTokens || 0,
        outputTokens: op._sum.outputTokens || 0,
        cost: op._sum.cost || 0,
      })),
      recentUsage,
    };
  }
}
