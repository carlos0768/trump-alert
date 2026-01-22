import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { CollectorModule } from './collector/collector.module';
import { ArticleModule } from './article/article.module';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { AlertModule } from './alert/alert.module';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';
import { StreamModule } from './stream/stream.module';
import { StorylineModule } from './storyline/storyline.module';
import { ExecutiveOrderModule } from './executive-order/executive-order.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { LikeModule } from './like/like.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? undefined : '../../.env',
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined,
          maxRetriesPerRequest: null,
        },
      }),
    }),
    CollectorModule,
    AnalyzerModule,
    ArticleModule,
    AlertModule,
    NotificationModule,
    AuthModule,
    StreamModule,
    StorylineModule,
    ExecutiveOrderModule,
    BookmarkModule,
    LikeModule,
  ],
})
export class AppModule {}
