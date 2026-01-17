import { Module, forwardRef } from '@nestjs/common';
import { NewsCollectorService } from './news-collector.service';
import { TruthSocialScraperService } from './truth-social-scraper.service';
import { MarketDataService } from './market-data.service';
import { AnalyzerModule } from '../analyzer/analyzer.module';

@Module({
  imports: [
    forwardRef(() => AnalyzerModule),
    // BullMQ disabled until Redis credentials are fixed
    // BullModule.registerQueue({ name: 'news-fetch' }),
    // BullModule.registerQueue({ name: 'social-scrape' }),
    // BullModule.registerQueue({ name: 'ai-analysis' }),
  ],
  providers: [
    NewsCollectorService,
    TruthSocialScraperService,
    MarketDataService,
    // CollectorProcessor disabled - requires BullMQ
  ],
  exports: [NewsCollectorService, TruthSocialScraperService, MarketDataService],
})
export class CollectorModule {}
