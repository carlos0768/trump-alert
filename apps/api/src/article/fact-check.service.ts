import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

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
  confidence: 'high' | 'medium'; // 比較の信頼度
}

@Injectable()
export class FactCheckService {
  private readonly logger = new Logger(FactCheckService.name);

  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService
  ) {}

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
   * 同じ出来事についての記事を比較
   * 優先順位: 1. Embedding類似度 2. Storyline 3. タグ+タイトル類似
   */
  async getFactCheckComparisons(limit = 10): Promise<ComparisonPair[]> {
    const comparisons: ComparisonPair[] = [];
    const usedArticleIds = new Set<string>();

    // 1. Embeddingベースの比較（最も信頼性が高い - 意味的類似度）
    const embeddingComparisons = await this.getEmbeddingBasedComparisons(
      limit,
      usedArticleIds
    );
    comparisons.push(...embeddingComparisons);
    embeddingComparisons.forEach((c) => {
      if (c.left) usedArticleIds.add(c.left.id);
      if (c.right) usedArticleIds.add(c.right.id);
    });

    // 2. 足りない場合はStorylineベースで補完
    if (comparisons.length < limit) {
      const storylineComparisons =
        await this.getStorylineBasedComparisons(usedArticleIds);
      comparisons.push(
        ...storylineComparisons.slice(0, limit - comparisons.length)
      );
      storylineComparisons.forEach((c) => {
        if (c.left) usedArticleIds.add(c.left.id);
        if (c.right) usedArticleIds.add(c.right.id);
      });
    }

    // 3. まだ足りない場合はタグベースで補完
    if (comparisons.length < limit) {
      const tagComparisons = await this.getTagBasedComparisons(
        limit - comparisons.length,
        comparisons.map((c) => c.id)
      );
      comparisons.push(...tagComparisons);
    }

    // センチメントギャップが大きい順にソート
    comparisons.sort((a, b) => b.sentimentGap - a.sentimentGap);

    return comparisons.slice(0, limit);
  }

  /**
   * Embeddingベースで類似記事を見つけてペアを作成
   */
  private async getEmbeddingBasedComparisons(
    limit: number,
    usedArticleIds: Set<string>
  ): Promise<ComparisonPair[]> {
    const comparisons: ComparisonPair[] = [];

    // 過去48時間の左派記事を取得（Embeddingあり）
    const leftArticles = await this.prisma.$queryRawUnsafe<
      {
        id: string;
        title: string;
        titleJa: string | null;
        content: string;
        contentJa: string | null;
        source: string;
        bias: string | null;
        sentiment: number | null;
        summary: string[];
        url: string;
        publishedAt: Date;
      }[]
    >(
      `
      SELECT id, title, "titleJa", content, "contentJa", source, bias, sentiment, summary, url, "publishedAt"
      FROM "Article"
      WHERE embedding IS NOT NULL
        AND "publishedAt" >= NOW() - INTERVAL '48 hours'
        AND (bias = 'Left' OR source IN (${this.leftSources.map((s) => `'${s}'`).join(',')}))
      ORDER BY "publishedAt" DESC
      LIMIT 50
    `
    );

    for (const leftArticle of leftArticles) {
      if (usedArticleIds.has(leftArticle.id)) continue;
      if (comparisons.length >= limit) break;

      // 類似する右派記事を検索（Embedding類似度）
      const similarRightArticles = await this.prisma.$queryRawUnsafe<
        {
          id: string;
          title: string;
          titleJa: string | null;
          content: string;
          contentJa: string | null;
          source: string;
          bias: string | null;
          sentiment: number | null;
          summary: string[];
          url: string;
          publishedAt: Date;
          similarity: number;
        }[]
      >(
        `
        SELECT
          a.id, a.title, a."titleJa", a.content, a."contentJa",
          a.source, a.bias, a.sentiment, a.summary, a.url, a."publishedAt",
          1 - (a.embedding <=> b.embedding) as similarity
        FROM "Article" a, "Article" b
        WHERE b.id = $1
          AND a.id != b.id
          AND a.embedding IS NOT NULL
          AND (a.bias = 'Right' OR a.source IN (${this.rightSources.map((s) => `'${s}'`).join(',')}))
          AND 1 - (a.embedding <=> b.embedding) >= 0.80
        ORDER BY a.embedding <=> b.embedding
        LIMIT 1
      `,
        leftArticle.id
      );

      if (similarRightArticles.length > 0) {
        const rightArticle = similarRightArticles[0];

        if (usedArticleIds.has(rightArticle.id)) continue;

        usedArticleIds.add(leftArticle.id);
        usedArticleIds.add(rightArticle.id);

        // センター記事も探す
        const similarCenterArticles = await this.prisma.$queryRawUnsafe<
          {
            id: string;
            title: string;
            titleJa: string | null;
            content: string;
            contentJa: string | null;
            source: string;
            sentiment: number | null;
            summary: string[];
            url: string;
            publishedAt: Date;
          }[]
        >(
          `
          SELECT
            a.id, a.title, a."titleJa", a.content, a."contentJa", a.source, a.sentiment, a.summary, a.url, a."publishedAt"
          FROM "Article" a, "Article" b
          WHERE b.id = $1
            AND a.id != b.id
            AND a.embedding IS NOT NULL
            AND (a.bias = 'Center' OR a.source IN (${this.centerSources.map((s) => `'${s}'`).join(',')}))
            AND 1 - (a.embedding <=> b.embedding) >= 0.75
          ORDER BY a.embedding <=> b.embedding
          LIMIT 1
        `,
          leftArticle.id
        );

        const centerArticle =
          similarCenterArticles.length > 0 ? similarCenterArticles[0] : null;

        const leftSentiment = leftArticle.sentiment ?? 0;
        const rightSentiment = rightArticle.sentiment ?? 0;

        // トピック名を生成（共通キーワードから）
        const topic = this.generateTopicFromTitles(
          leftArticle.title,
          rightArticle.title
        );

        comparisons.push({
          id: `embedding-${leftArticle.id}-${rightArticle.id}`,
          topic,
          topicJa: this.translateTopicToJa(topic),
          confidence: 'high',
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

        this.logger.log(
          `Found embedding match: "${leftArticle.title.substring(0, 30)}..." <-> "${rightArticle.title.substring(0, 30)}..." (similarity: ${rightArticle.similarity.toFixed(3)})`
        );
      }
    }

    return comparisons;
  }

  /**
   * タイトルから共通トピックを生成
   */
  private generateTopicFromTitles(title1: string, title2: string): string {
    const keywords1 = this.extractKeywords(title1);
    const keywords2 = this.extractKeywords(title2);
    const commonKeywords = keywords1.filter((kw) => keywords2.includes(kw));

    if (commonKeywords.length > 0) {
      return commonKeywords.slice(0, 3).join(' ');
    }

    // 共通キーワードがなければ、最初の記事の主要キーワードを使う
    return keywords1.slice(0, 2).join(' ') || 'Trump News';
  }

  /**
   * Storyline（同じ出来事）に属する記事から左右比較を生成
   */
  private async getStorylineBasedComparisons(
    usedArticleIds: Set<string>
  ): Promise<ComparisonPair[]> {
    const comparisons: ComparisonPair[] = [];

    // 過去48時間に更新されたStorylineを取得
    const storylines = await this.prisma.storyline.findMany({
      where: {
        lastEventAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      },
      include: {
        articles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                titleJa: true,
                content: true,
                contentJa: true,
                source: true,
                bias: true,
                sentiment: true,
                summary: true,
                url: true,
                publishedAt: true,
              },
            },
          },
        },
      },
      orderBy: { lastEventAt: 'desc' },
      take: 20,
    });

    for (const storyline of storylines) {
      // 既に使用された記事を除外
      const articles = storyline.articles
        .map((sa) => sa.article)
        .filter((a) => !usedArticleIds.has(a.id));

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

      // 同じソースの記事同士は比較しない
      if (
        leftArticle &&
        rightArticle &&
        leftArticle.source !== rightArticle.source
      ) {
        // usedArticleIdsに追加して重複を防ぐ
        usedArticleIds.add(leftArticle.id);
        usedArticleIds.add(rightArticle.id);

        const leftSentiment = leftArticle.sentiment ?? 0;
        const rightSentiment = rightArticle.sentiment ?? 0;

        comparisons.push({
          id: `storyline-${storyline.id}`,
          topic: storyline.title,
          topicJa:
            storyline.titleJa || this.translateTopicToJa(storyline.title),
          confidence: 'high',
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

    return comparisons;
  }

  /**
   * タグ + タイトル類似度ベースで同じ出来事の記事を見つける
   */
  private async getTagBasedComparisons(
    limit: number,
    excludeIds: string[]
  ): Promise<ComparisonPair[]> {
    const comparisons: ComparisonPair[] = [];

    // 過去48時間の記事を取得（より狭い時間範囲で同じ出来事を捕捉）
    const recentArticles = await this.prisma.article.findMany({
      where: {
        publishedAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
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
      take: 200,
    });

    // 左派と右派の記事を分類
    const leftArticles = recentArticles.filter(
      (a) =>
        a.bias === 'Left' ||
        this.leftSources.some((s) =>
          a.source.toLowerCase().includes(s.toLowerCase())
        )
    );
    const rightArticles = recentArticles.filter(
      (a) =>
        a.bias === 'Right' ||
        this.rightSources.some((s) =>
          a.source.toLowerCase().includes(s.toLowerCase())
        )
    );
    const centerArticles = recentArticles.filter(
      (a) =>
        a.bias === 'Center' ||
        this.centerSources.some((s) =>
          a.source.toLowerCase().includes(s.toLowerCase())
        )
    );

    // 左派記事と右派記事のペアを見つける
    const usedArticleIds = new Set<string>();

    for (const leftArticle of leftArticles) {
      if (usedArticleIds.has(leftArticle.id)) continue;
      if (comparisons.length >= limit) break;

      const leftTagIds = new Set(leftArticle.tags.map((t) => t.tagId));
      const leftKeywords = this.extractKeywords(leftArticle.title);

      // 最も類似度の高い右派記事を見つける
      let bestMatch: {
        article: (typeof rightArticles)[0];
        score: number;
      } | null = null;

      for (const rightArticle of rightArticles) {
        if (usedArticleIds.has(rightArticle.id)) continue;

        const rightTagIds = new Set(rightArticle.tags.map((t) => t.tagId));
        const rightKeywords = this.extractKeywords(rightArticle.title);

        // 共通タグ数
        const commonTags = [...leftTagIds].filter((id) =>
          rightTagIds.has(id)
        ).length;

        // タイトルキーワード一致数
        const commonKeywords = leftKeywords.filter((kw) =>
          rightKeywords.includes(kw)
        ).length;

        // 時間差（24時間以内を優先）
        const timeDiff = Math.abs(
          leftArticle.publishedAt.getTime() - rightArticle.publishedAt.getTime()
        );
        const timeScore = timeDiff < 24 * 60 * 60 * 1000 ? 1 : 0;

        // スコア計算：タグ2つ以上 OR キーワード2つ以上が必須
        const score = commonTags * 2 + commonKeywords * 3 + timeScore;

        if (
          (commonTags >= 2 || commonKeywords >= 2) &&
          (!bestMatch || score > bestMatch.score)
        ) {
          bestMatch = { article: rightArticle, score };
        }
      }

      // 同じソースの記事同士は比較しない
      if (bestMatch && bestMatch.article.source !== leftArticle.source) {
        const rightArticle = bestMatch.article;
        usedArticleIds.add(leftArticle.id);
        usedArticleIds.add(rightArticle.id);

        // 共通タグを取得してトピック名にする
        const leftTagNames = leftArticle.tags.map(
          (t) => (t.tag as { name: string }).name
        );
        const rightTagNames = rightArticle.tags.map(
          (t) => (t.tag as { name: string }).name
        );
        const commonTagNames = leftTagNames.filter((n) =>
          rightTagNames.includes(n)
        );
        const topic =
          commonTagNames[0] ||
          this.extractKeywords(leftArticle.title).slice(0, 2).join(' ');

        // センター記事を探す
        const centerArticle = centerArticles.find(
          (c) =>
            !usedArticleIds.has(c.id) &&
            this.extractKeywords(c.title).some((kw) =>
              this.extractKeywords(leftArticle.title).includes(kw)
            )
        );

        const pairId = `tag-${leftArticle.id}-${rightArticle.id}`;
        if (excludeIds.includes(pairId)) continue;

        const leftSentiment = leftArticle.sentiment ?? 0;
        const rightSentiment = rightArticle.sentiment ?? 0;

        comparisons.push({
          id: pairId,
          topic,
          topicJa: this.translateTopicToJa(topic),
          confidence: 'medium',
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

    return comparisons;
  }

  /**
   * タイトルから重要なキーワードを抽出
   */
  private extractKeywords(title: string): string[] {
    // ストップワードを除外
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'shall',
      'can',
      'need',
      'dare',
      'ought',
      'used',
      'to',
      'of',
      'in',
      'for',
      'on',
      'with',
      'at',
      'by',
      'from',
      'as',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'under',
      'again',
      'further',
      'then',
      'once',
      'here',
      'there',
      'when',
      'where',
      'why',
      'how',
      'all',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'no',
      'nor',
      'not',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'just',
      'and',
      'but',
      'if',
      'or',
      'because',
      'until',
      'while',
      'about',
      'against',
      'trump',
      'donald',
      'says',
      'said',
      'new',
      'news',
    ]);

    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  /**
   * 特定のトピック（タグ名）で比較を取得
   */
  async getComparisonByTopic(topic: string): Promise<ComparisonPair | null> {
    const tag = await this.prisma.tag.findFirst({
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

    const articles = await this.prisma.article.findMany({
      where: {
        tags: {
          some: {
            tagId: tag.id,
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
      confidence: 'medium',
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
