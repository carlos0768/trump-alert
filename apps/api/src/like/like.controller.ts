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
import { LikeService } from './like.service';

@Controller('api/likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  // Get liked article IDs for a user
  @Get('user/:userId/ids')
  async getUserLikedIds(@Param('userId') userId: string) {
    const ids = await this.likeService.getUserLikedIds(userId);
    return { articleIds: ids };
  }

  // Check if article is liked
  @Get('user/:userId/article/:articleId')
  async isLiked(
    @Param('userId') userId: string,
    @Param('articleId') articleId: string
  ) {
    const isLiked = await this.likeService.isLiked(userId, articleId);
    const likeCount = await this.likeService.getLikeCount(articleId);
    return { isLiked, likeCount };
  }

  // Add like (1トランプ)
  @Post('user/:userId/article/:articleId')
  @HttpCode(HttpStatus.CREATED)
  async addLike(
    @Param('userId') userId: string,
    @Param('articleId') articleId: string
  ) {
    return this.likeService.addLike(userId, articleId);
  }

  // Remove like
  @Delete('user/:userId/article/:articleId')
  @HttpCode(HttpStatus.OK)
  async removeLike(
    @Param('userId') userId: string,
    @Param('articleId') articleId: string
  ) {
    return this.likeService.removeLike(userId, articleId);
  }

  // Get like count for an article
  @Get('article/:articleId/count')
  async getLikeCount(@Param('articleId') articleId: string) {
    const count = await this.likeService.getLikeCount(articleId);
    return { likeCount: count };
  }

  // Get like counts for multiple articles
  @Get('counts')
  async getLikeCounts(@Query('ids') ids: string) {
    const articleIds = ids.split(',').filter(Boolean);
    const counts = await this.likeService.getLikeCounts(articleIds);
    return { counts };
  }
}
