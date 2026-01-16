import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CollectorModule } from './collector/collector.module';
import { ArticleModule } from './article/article.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    // BullMQ disabled - Redis credentials need to be fixed in Upstash console
    // BullModule.forRoot({
    //   connection: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379'),
    //     username: 'default',
    //     password: process.env.REDIS_PASSWORD,
    //     tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined,
    //     maxRetriesPerRequest: null,
    //   },
    // }),
    CollectorModule,
    // AnalyzerModule disabled until Redis is fixed
    ArticleModule,
  ],
})
export class AppModule {}
