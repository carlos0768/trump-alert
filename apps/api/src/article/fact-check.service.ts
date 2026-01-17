import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ComparisonArticle {
  id: string;
  source: string;
  title: string;
  titleJa?: string;
  summary: string;
  sentiment: number;
  url: string;
  publishedAt: Date;
}

export interface ComparisonPair {
  id: string;
  topic: string;
  topicJa?: string;
  left: ComparisonArticle | null;
  center: ComparisonArticle | null;
  right: ComparisonArticle | null;
  sentimentGap: number;
}

@Injectable()
export class FactCheckService {
  // 左派メディアリスト
  private leftSources = [
    'CNN',
    'MSNBC',
    'New York Times',
    'Washington Post',
    'The Guardian',
    'NPR',
    'ABC News',
    'CBS News',
    'NBC News',
  ];

  // 右派メディアリスト
  private rightSources = [
    'Fox News',
    'Newsmax',
    'The Daily Wire',
    'Breitbart',
    'New York Post',
    'Washington Examiner',
    'The Epoch Times',
    'One America News',
  ];

  // 中立メディアリスト
  private centerSources = [
    'Reuters',
    'AP News',
    'BBC',
    'Bloomberg',
    'The Wall Street Journal',
    'USA Today',
    'The Hill',
  ];

  /**
   * タグベースで同一トピックの記事をグループ化し、左右比較を生成
   */
  async getFactCheckComparisons(limit = 10): Promise<ComparisonPair[]> {
    // 最近の記事からタグを取得
    const recentArticlesWithTags = await prisma.article.findMany({
      where: {
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 過去7日間
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 500,
    });

    // タグごとに記事をグループ化
    const tagGroups = new Map<
      string,
      {
        tagName: string;
        articles: typeof recentArticlesWithTags;
      }
    >();

    for (const article of recentArticlesWithTags) {
      for (const articleTag of article.tags) {
        const tag = articleTag.tag;
        if (!tagGroups.has(tag.id)) {
          tagGroups.set(tag.id, {
            tagName: tag.name,
            articles: [],
          });
        }
        tagGroups.get(tag.id)!.articles.push(article);
      }
    }

    // 左右両方の記事があるタグを抽出
    const comparisons: ComparisonPair[] = [];

    for (const [tagId, group] of tagGroups) {
      const leftArticles = group.articles.filter(
        (a) =>
          a.bias === 'Left' ||
          this.leftSources.some((s) =>
            a.source.toLowerCase().includes(s.toLowerCase())
          )
      );
      const rightArticles = group.articles.filter(
        (a) =>
          a.bias === 'Right' ||
          this.rightSources.some((s) =>
            a.source.toLowerCase().includes(s.toLowerCase())
          )
      );
      const centerArticles = group.articles.filter(
        (a) =>
          a.bias === 'Center' ||
          this.centerSources.some((s) =>
            a.source.toLowerCase().includes(s.toLowerCase())
          )
      );

      // 左右両方に記事がある場合のみ比較を作成
      if (leftArticles.length > 0 && rightArticles.length > 0) {
        const leftArticle = leftArticles[0];
        const rightArticle = rightArticles[0];
        const centerArticle =
          centerArticles.length > 0 ? centerArticles[0] : null;

        const leftSentiment = leftArticle.sentiment ?? 0;
        const rightSentiment = rightArticle.sentiment ?? 0;

        comparisons.push({
          id: tagId,
          topic: group.tagName,
          topicJa: this.translateTopicToJa(group.tagName),
          left: {
            id: leftArticle.id,
            source: leftArticle.source,
            title: leftArticle.title,
            titleJa: leftArticle.titleJa ?? undefined,
            summary: this.extractSummary(leftArticle),
            sentiment: leftSentiment,
            url: leftArticle.url,
            publishedAt: leftArticle.publishedAt,
          },
          center: centerArticle
            ? {
                id: centerArticle.id,
                source: centerArticle.source,
                title: centerArticle.title,
                titleJa: centerArticle.titleJa ?? undefined,
                summary: this.extractSummary(centerArticle),
                sentiment: centerArticle.sentiment ?? 0,
                url: centerArticle.url,
                publishedAt: centerArticle.publishedAt,
              }
            : null,
          right: {
            id: rightArticle.id,
            source: rightArticle.source,
            title: rightArticle.title,
            titleJa: rightArticle.titleJa ?? undefined,
            summary: this.extractSummary(rightArticle),
            sentiment: rightSentiment,
            url: rightArticle.url,
            publishedAt: rightArticle.publishedAt,
          },
          sentimentGap: Math.abs(leftSentiment - rightSentiment),
        });
      }
    }

    // センチメントギャップが大きい順にソート
    comparisons.sort((a, b) => b.sentimentGap - a.sentimentGap);

    return comparisons.slice(0, limit);
  }

  /**
   * 特定のトピック（タグ名）で比較を取得
   */
  async getComparisonByTopic(topic: string): Promise<ComparisonPair | null> {
    const tag = await prisma.tag.findFirst({
      where: {
        name: {
          contains: topic,
          mode: 'insensitive',
        },
      },
    });

    if (!tag) {
      return null;
    }

    const articles = await prisma.article.findMany({
      where: {
        tags: {
          some: {
            id: tag.id,
          },
        },
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50,
    });

    const leftArticle = articles.find(
      (a) =>
        a.bias === 'Left' ||
        this.leftSources.some((s) =>
          a.source.toLowerCase().includes(s.toLowerCase())
        )
    );
    const rightArticle = articles.find(
      (a) =>
        a.bias === 'Right' ||
        this.rightSources.some((s) =>
          a.source.toLowerCase().includes(s.toLowerCase())
        )
    );
    const centerArticle = articles.find(
      (a) =>
        a.bias === 'Center' ||
        this.centerSources.some((s) =>
          a.source.toLowerCase().includes(s.toLowerCase())
        )
    );

    if (!leftArticle || !rightArticle) {
      return null;
    }

    const leftSentiment = leftArticle.sentiment ?? 0;
    const rightSentiment = rightArticle.sentiment ?? 0;

    return {
      id: tag.id,
      topic: tag.name,
      topicJa: this.translateTopicToJa(tag.name),
      left: {
        id: leftArticle.id,
        source: leftArticle.source,
        title: leftArticle.title,
        titleJa: leftArticle.titleJa ?? undefined,
        summary: this.extractSummary(leftArticle),
        sentiment: leftSentiment,
        url: leftArticle.url,
        publishedAt: leftArticle.publishedAt,
      },
      center: centerArticle
        ? {
            id: centerArticle.id,
            source: centerArticle.source,
            title: centerArticle.title,
            titleJa: centerArticle.titleJa ?? undefined,
            summary: this.extractSummary(centerArticle),
            sentiment: centerArticle.sentiment ?? 0,
            url: centerArticle.url,
            publishedAt: centerArticle.publishedAt,
          }
        : null,
      right: {
        id: rightArticle.id,
        source: rightArticle.source,
        title: rightArticle.title,
        titleJa: rightArticle.titleJa ?? undefined,
        summary: this.extractSummary(rightArticle),
        sentiment: rightSentiment,
        url: rightArticle.url,
        publishedAt: rightArticle.publishedAt,
      },
      sentimentGap: Math.abs(leftSentiment - rightSentiment),
    };
  }

  /**
   * 記事からサマリーを抽出
   */
  private extractSummary(article: {
    summary?: unknown;
    content: string;
    contentJa?: string | null;
  }): string {
    if (article.summary) {
      if (Array.isArray(article.summary)) {
        return article.summary.join(' ');
      }
      if (typeof article.summary === 'string') {
        return article.summary;
      }
    }
    // コンテンツの最初の200文字を使用
    const content = article.contentJa || article.content;
    return content.length > 200 ? content.slice(0, 200) + '...' : content;
  }

  /**
   * トピック名を日本語に変換（簡易的なマッピング）
   */
  private translateTopicToJa(topic: string): string {
    const translations: Record<string, string> = {
      Tariff: '関税',
      Immigration: '移民政策',
      Election: '選挙',
      Economy: '経済',
      'Legal Proceedings': '法的手続き',
      Rally: '集会',
      'Foreign Policy': '外交政策',
      'Trade War': '貿易戦争',
      China: '中国',
      Border: '国境',
    };

    for (const [en, ja] of Object.entries(translations)) {
      if (topic.toLowerCase().includes(en.toLowerCase())) {
        return ja;
      }
    }

    return topic;
  }
}
