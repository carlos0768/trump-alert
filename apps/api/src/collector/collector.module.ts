import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NewsCollectorService } from './news-collector.service';
import { TruthSocialScraperService } from './truth-social-scraper.service';
import { MarketDataService } from './market-data.service';
import { CollectorProcessor } from './collector.processor';
import { AnalyzerModule } from '../analyzer/analyzer.module';
import { StreamModule } from '../stream/stream.module';
import { AlertModule } from '../alert/alert.module';

@Module({
  imports: [
    forwardRef(() => AnalyzerModule),
    forwardRef(() => StreamModule),
    forwardRef(() => AlertModule),
    BullModule.registerQueue({ name: 'news-fetch' }),
    BullModule.registerQueue({ name: 'social-scrape' }),
    BullModule.registerQueue({ name: 'ai-analysis' }),
  ],
  providers: [
    NewsCollectorService,
    TruthSocialScraperService,
    MarketDataService,
    CollectorProcessor,
  ],
  exports: [NewsCollectorService, TruthSocialScraperService, MarketDataService],
})
export class CollectorModule {}
