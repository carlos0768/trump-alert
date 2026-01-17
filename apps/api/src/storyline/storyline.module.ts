import { Module } from '@nestjs/common';
import { StorylineService } from './storyline.service';
import { StorylineController } from './storyline.controller';

@Module({
  controllers: [StorylineController],
  providers: [StorylineService],
  exports: [StorylineService],
})
export class StorylineModule {}
