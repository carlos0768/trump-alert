import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  private readonly logger = new Logger(BookmarkService.name);

  constructor(private prisma: PrismaService) {}

  // Add bookmark
  async addBookmark(userId: string, articleId: string) {
    try {
      const bookmark = await this.prisma.bookmark.create({
        data: {
          userId,
          articleId,
        },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              titleJa: true,
              source: true,
              impactLevel: true,
              publishedAt: true,
            },
          },
        },
      });
      this.logger.log(`User ${userId} bookmarked article ${articleId}`);
      return bookmark;
    } catch (error: unknown) {
      // Handle duplicate bookmark (already exists)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        this.logger.debug(
          `Bookmark already exists for user ${userId}, article ${articleId}`
        );
        return this.getBookmark(userId, articleId);
      }
      throw error;
    }
  }

  // Remove bookmark
  async removeBookmark(userId: string, articleId: string) {
    const result = await this.prisma.bookmark.deleteMany({
      where: {
        userId,
        articleId,
      },
    });
    this.logger.log(`User ${userId} removed bookmark for article ${articleId}`);
    return { removed: result.count > 0 };
  }

  // Get single bookmark
  async getBookmark(userId: string, articleId: string) {
    return this.prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            titleJa: true,
            source: true,
            impactLevel: true,
            publishedAt: true,
          },
        },
      },
    });
  }

  // Check if article is bookmarked
  async isBookmarked(userId: string, articleId: string): Promise<boolean> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });
    return !!bookmark;
  }

  // Get all bookmarks for a user
  async getUserBookmarks(userId: string, limit = 50, offset = 0) {
    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              titleJa: true,
              url: true,
              source: true,
              content: true,
              contentJa: true,
              summary: true,
              sentiment: true,
              bias: true,
              impactLevel: true,
              publishedAt: true,
              imageUrl: true,
            },
          },
        },
      }),
      this.prisma.bookmark.count({ where: { userId } }),
    ]);

    return {
      bookmarks,
      total,
      hasMore: offset + bookmarks.length < total,
    };
  }

  // Get bookmark IDs for a user (for checking multiple articles at once)
  async getUserBookmarkIds(userId: string): Promise<string[]> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      select: { articleId: true },
    });
    return bookmarks.map((b) => b.articleId);
  }
}
