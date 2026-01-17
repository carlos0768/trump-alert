import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StorylineService } from './storyline.service';

@Controller('api/storylines')
export class StorylineController {
  constructor(private readonly storylineService: StorylineService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    const storylines = await this.storylineService.findAll(status);
    return { storylines };
  }

  @Get('recent-updates')
  async getRecentUpdates(@Query('limit') limit?: string) {
    const updates = await this.storylineService.getRecentUpdates(
      limit ? parseInt(limit, 10) : 5
    );
    return { updates };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const storyline = await this.storylineService.findById(id);
    if (!storyline) {
      return { error: 'Storyline not found' };
    }
    return { storyline };
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string) {
    const storyline = await this.storylineService.findById(id);
    if (!storyline) {
      return { error: 'Storyline not found' };
    }

    // Sort articles by date for timeline view
    const timeline = storyline.articles
      .sort(
        (a, b) =>
          new Date(a.article.publishedAt).getTime() -
          new Date(b.article.publishedAt).getTime()
      )
      .map((sa) => ({
        date: sa.article.publishedAt,
        isKeyEvent: sa.isKeyEvent,
        article: sa.article,
      }));

    return {
      storyline: {
        id: storyline.id,
        title: storyline.title,
        titleJa: storyline.titleJa,
        description: storyline.description,
        descriptionJa: storyline.descriptionJa,
        summary: storyline.summary,
        summaryJa: storyline.summaryJa,
        status: storyline.status,
        category: storyline.category,
      },
      timeline,
    };
  }

  @Post('generate')
  async triggerGeneration() {
    return this.storylineService.triggerGeneration();
  }

  @Post(':id/update-summary')
  async updateSummary(@Param('id') id: string) {
    await this.storylineService.updateStorylineSummary(id);
    return { message: 'Summary updated' };
  }
}
