import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const prisma = new PrismaClient();

export interface CreateAlertDto {
  userId: string;
  keyword: string;
  minImpact: 'S' | 'A' | 'B' | 'C';
  notifyPush?: boolean;
  notifyEmail?: boolean;
  notifyDiscord?: boolean;
}

export interface UpdateAlertDto {
  keyword?: string;
  minImpact?: 'S' | 'A' | 'B' | 'C';
  notifyPush?: boolean;
  notifyEmail?: boolean;
  notifyDiscord?: boolean;
  isActive?: boolean;
}

@Injectable()
export class AlertService {
  constructor(
    @InjectQueue('notification-send') private notificationQueue: Queue
  ) {}

  async create(dto: CreateAlertDto) {
    return prisma.alert.create({
      data: {
        userId: dto.userId,
        keyword: dto.keyword,
        minImpact: dto.minImpact,
        notifyPush: dto.notifyPush ?? false,
        notifyEmail: dto.notifyEmail ?? false,
        notifyDiscord: dto.notifyDiscord ?? false,
      },
    });
  }

  async findAllByUser(userId: string) {
    return prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      throw new NotFoundException(`Alert with id ${id} not found`);
    }
    return alert;
  }

  async update(id: string, dto: UpdateAlertDto) {
    await this.findOne(id);
    return prisma.alert.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.alert.delete({ where: { id } });
  }

  async getActiveAlerts() {
    return prisma.alert.findMany({
      where: { isActive: true },
      include: { user: true },
    });
  }

  // Impact Levelの優先度マップ
  private impactPriority: Record<string, number> = {
    S: 4,
    A: 3,
    B: 2,
    C: 1,
  };

  // 新しい記事がアラート条件に合致するかチェックして通知をキューに追加
  async checkAndTriggerAlerts(article: {
    id: string;
    title: string;
    content: string;
    impactLevel: string;
    source: string;
    sentiment: number | null;
    summary: string[] | null;
  }) {
    const activeAlerts = await this.getActiveAlerts();

    for (const alert of activeAlerts) {
      // Impact Levelチェック
      const articlePriority = this.impactPriority[article.impactLevel] || 1;
      const minPriority = this.impactPriority[alert.minImpact] || 1;

      if (articlePriority < minPriority) {
        continue;
      }

      // キーワードマッチング（タイトルとコンテンツで部分一致）
      const keyword = alert.keyword.toLowerCase();
      const titleMatch = article.title.toLowerCase().includes(keyword);
      const contentMatch = article.content.toLowerCase().includes(keyword);

      if (!titleMatch && !contentMatch) {
        continue;
      }

      // 通知ジョブをキューに追加
      await this.notificationQueue.add(
        'send-notification',
        {
          alertId: alert.id,
          userId: alert.userId,
          articleId: article.id,
          articleTitle: article.title,
          articleSummary: article.summary,
          articleSource: article.source,
          articleSentiment: article.sentiment,
          impactLevel: article.impactLevel,
          notifyPush: alert.notifyPush,
          notifyEmail: alert.notifyEmail,
          notifyDiscord: alert.notifyDiscord,
          user: alert.user,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1分、2分、4分
          },
        }
      );
    }
  }
}
