import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';

@Controller('api/bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  // Get user's bookmarks
  @Get('user/:userId')
  async getUserBookmarks(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.bookmarkService.getUserBookmarks(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0
    );
  }

  // Get bookmark IDs for quick lookup
  @Get('user/:userId/ids')
  async getUserBookmarkIds(@Param('userId') userId: string) {
    const ids = await this.bookmarkService.getUserBookmarkIds(userId);
    return { articleIds: ids };
  }

  // Check if article is bookmarked
  @Get('user/:userId/article/:articleId')
  async isBookmarked(
    @Param('userId') userId: string,
    @Param('articleId') articleId: string
  ) {
    const isBookmarked = await this.bookmarkService.isBookmarked(
      userId,
      articleId
    );
    return { isBookmarked };
  }

  // Add bookmark
  @Post('user/:userId/article/:articleId')
  @HttpCode(HttpStatus.CREATED)
  async addBookmark(
    @Param('userId') userId: string,
    @Param('articleId') articleId: string
  ) {
    return this.bookmarkService.addBookmark(userId, articleId);
  }

  // Remove bookmark
  @Delete('user/:userId/article/:articleId')
  @HttpCode(HttpStatus.OK)
  async removeBookmark(
    @Param('userId') userId: string,
    @Param('articleId') articleId: string
  ) {
    return this.bookmarkService.removeBookmark(userId, articleId);
  }
}
