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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined,
        maxRetriesPerRequest: null,
      },
    }),
    CollectorModule,
    AnalyzerModule,
    ArticleModule,
    AlertModule,
    NotificationModule,
    AuthModule,
    StreamModule,
  ],
})
export class AppModule {}
