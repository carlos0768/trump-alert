import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikeService {
  private readonly logger = new Logger(LikeService.name);

  constructor(private prisma: PrismaService) {}

  // Add like (1トランプ)
  async addLike(userId: string, articleId: string) {
    try {
      // Use transaction to ensure consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the like
        const like = await tx.like.create({
          data: {
            userId,
            articleId,
          },
        });

        // Increment the article's like count
        const article = await tx.article.update({
          where: { id: articleId },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        });

        return { like, likeCount: article.likeCount };
      });

      this.logger.log(
        `User ${userId} liked article ${articleId} (now ${result.likeCount} トランプ)`
      );
      return result;
    } catch (error: unknown) {
      // Handle duplicate like (already exists)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        this.logger.debug(
          `Like already exists for user ${userId}, article ${articleId}`
        );
        const article = await this.prisma.article.findUnique({
          where: { id: articleId },
          select: { likeCount: true },
        });
        return { alreadyLiked: true, likeCount: article?.likeCount ?? 0 };
      }
      throw error;
    }
  }

  // Remove like
  async removeLike(userId: string, articleId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Delete the like
      const deleted = await tx.like.deleteMany({
        where: {
          userId,
          articleId,
        },
      });

      if (deleted.count > 0) {
        // Decrement the article's like count
        const article = await tx.article.update({
          where: { id: articleId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });
        return { removed: true, likeCount: article.likeCount };
      }

      const article = await tx.article.findUnique({
        where: { id: articleId },
        select: { likeCount: true },
      });
      return { removed: false, likeCount: article?.likeCount ?? 0 };
    });

    if (result.removed) {
      this.logger.log(
        `User ${userId} unliked article ${articleId} (now ${result.likeCount} トランプ)`
      );
    }
    return result;
  }

  // Check if article is liked by user
  async isLiked(userId: string, articleId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });
    return !!like;
  }

  // Get like count for an article
  async getLikeCount(articleId: string): Promise<number> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { likeCount: true },
    });
    return article?.likeCount ?? 0;
  }

  // Get liked article IDs for a user (for checking multiple articles at once)
  async getUserLikedIds(userId: string): Promise<string[]> {
    const likes = await this.prisma.like.findMany({
      where: { userId },
      select: { articleId: true },
    });
    return likes.map((l) => l.articleId);
  }

  // Get like counts for multiple articles at once
  async getLikeCounts(articleIds: string[]): Promise<Record<string, number>> {
    const articles = await this.prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, likeCount: true },
    });
    return articles.reduce(
      (acc, article) => {
        acc[article.id] = article.likeCount;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}
