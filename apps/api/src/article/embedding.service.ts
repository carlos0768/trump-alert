import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

interface SimilarArticle {
  id: string;
  title: string;
  source: string;
  bias: string | null;
  sentiment: number | null;
  publishedAt: Date;
  similarity: number;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not configured - Embedding disabled');
    }
  }

  /**
   * テキストからEmbeddingを生成
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.openai) {
      return null;
    }

    try {
      // テキストを適切な長さに切り詰め（8191トークン制限）
      const truncatedText = text.slice(0, 8000);

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncatedText,
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error}`);
      return null;
    }
  }

  /**
   * 記事のEmbeddingを生成して保存
   */
  async generateAndSaveEmbedding(articleId: string): Promise<boolean> {
    try {
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { title: true, content: true },
      });

      if (!article) {
        this.logger.warn(`Article not found: ${articleId}`);
        return false;
      }

      // タイトル + コンテンツを結合してEmbedding生成
      const text = `${article.title}\n\n${article.content}`;
      const embedding = await this.generateEmbedding(text);

      if (!embedding) {
        return false;
      }

      // Embeddingを保存（生SQLを使用、pgvector形式）
      const embeddingStr = `[${embedding.join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `UPDATE "Article" SET embedding = $1::vector WHERE id = $2`,
        embeddingStr,
        articleId
      );

      this.logger.log(`Embedding saved for article: ${articleId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to save embedding for ${articleId}: ${error}`);
      return false;
    }
  }

  /**
   * 類似記事を検索（コサイン類似度）
   */
  async findSimilarArticles(
    articleId: string,
    limit = 10,
    minSimilarity = 0.8
  ): Promise<SimilarArticle[]> {
    try {
      // 対象記事のembeddingを取得
      const result = await this.prisma.$queryRawUnsafe<{ embedding: string }[]>(
        `SELECT embedding::text FROM "Article" WHERE id = $1`,
        articleId
      );

      if (!result[0]?.embedding) {
        this.logger.warn(`No embedding found for article: ${articleId}`);
        return [];
      }

      // 類似記事を検索（自身を除く）
      const similar = await this.prisma.$queryRawUnsafe<SimilarArticle[]>(
        `
        SELECT
          id,
          title,
          source,
          bias,
          sentiment,
          "publishedAt" as "publishedAt",
          1 - (embedding <=> $1::vector) as similarity
        FROM "Article"
        WHERE id != $2
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> $1::vector) >= $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4
        `,
        result[0].embedding,
        articleId,
        minSimilarity,
        limit
      );

      return similar;
    } catch (error) {
      this.logger.error(`Failed to find similar articles: ${error}`);
      return [];
    }
  }

  /**
   * 指定したバイアスの類似記事を検索
   */
  async findSimilarArticlesByBias(
    articleId: string,
    targetBias: 'Left' | 'Center' | 'Right',
    limit = 5,
    minSimilarity = 0.75
  ): Promise<SimilarArticle[]> {
    try {
      const result = await this.prisma.$queryRawUnsafe<{ embedding: string }[]>(
        `SELECT embedding::text FROM "Article" WHERE id = $1`,
        articleId
      );

      if (!result[0]?.embedding) {
        return [];
      }

      const similar = await this.prisma.$queryRawUnsafe<SimilarArticle[]>(
        `
        SELECT
          id,
          title,
          source,
          bias,
          sentiment,
          "publishedAt" as "publishedAt",
          1 - (embedding <=> $1::vector) as similarity
        FROM "Article"
        WHERE id != $2
          AND embedding IS NOT NULL
          AND bias = $3
          AND 1 - (embedding <=> $1::vector) >= $4
        ORDER BY embedding <=> $1::vector
        LIMIT $5
        `,
        result[0].embedding,
        articleId,
        targetBias,
        minSimilarity,
        limit
      );

      return similar;
    } catch (error) {
      this.logger.error(`Failed to find similar articles by bias: ${error}`);
      return [];
    }
  }

  /**
   * テキストから直接類似記事を検索
   */
  async findSimilarByText(
    text: string,
    options: {
      limit?: number;
      minSimilarity?: number;
      bias?: 'Left' | 'Center' | 'Right';
      excludeIds?: string[];
    } = {}
  ): Promise<SimilarArticle[]> {
    const { limit = 10, minSimilarity = 0.75, bias, excludeIds = [] } = options;

    const embedding = await this.generateEmbedding(text);
    if (!embedding) {
      return [];
    }

    const embeddingStr = `[${embedding.join(',')}]`;

    try {
      let query = `
        SELECT
          id,
          title,
          source,
          bias,
          sentiment,
          "publishedAt" as "publishedAt",
          1 - (embedding <=> $1::vector) as similarity
        FROM "Article"
        WHERE embedding IS NOT NULL
          AND 1 - (embedding <=> $1::vector) >= $2
      `;

      const params: (string | number)[] = [embeddingStr, minSimilarity];

      if (bias) {
        params.push(bias);
        query += ` AND bias = $${params.length}`;
      }

      if (excludeIds.length > 0) {
        params.push(excludeIds.join(','));
        query += ` AND id NOT IN (${excludeIds.map((_, i) => `$${params.length + i}`).join(',')})`;
        // 修正: excludeIdsを個別のパラメータとして追加
        params.pop();
        excludeIds.forEach((id) => params.push(id));
        query = query.replace(
          `AND id NOT IN (${excludeIds.map((_, i) => `$${params.length - excludeIds.length + i + 1}`).join(',')})`,
          `AND id NOT IN (${excludeIds.map((_, i) => `$${params.length - excludeIds.length + i + 1}`).join(',')})`
        );
      }

      query += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
      params.push(limit);

      const similar = await this.prisma.$queryRawUnsafe<SimilarArticle[]>(
        query,
        ...params
      );

      return similar;
    } catch (error) {
      this.logger.error(`Failed to find similar by text: ${error}`);
      return [];
    }
  }

  /**
   * Embeddingがない記事の数を取得
   */
  async getArticlesWithoutEmbedding(): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "Article" WHERE embedding IS NULL`
    );
    return Number(result[0]?.count ?? 0);
  }

  /**
   * 全記事のEmbeddingを一括生成（バックフィル用）
   */
  async backfillEmbeddings(
    batchSize = 10
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    // Embeddingがない記事を取得
    const articles = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "Article" WHERE embedding IS NULL ORDER BY "publishedAt" DESC`
    );

    this.logger.log(`Found ${articles.length} articles without embeddings`);

    // バッチ処理
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (article) => {
          const success = await this.generateAndSaveEmbedding(article.id);
          if (success) {
            processed++;
          } else {
            failed++;
          }
        })
      );

      this.logger.log(
        `Processed ${Math.min(i + batchSize, articles.length)}/${articles.length} articles`
      );

      // レート制限対策: バッチ間に少し待機
      if (i + batchSize < articles.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return { processed, failed };
  }
}
