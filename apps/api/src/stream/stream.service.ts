import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface StreamEvent {
  type: 'article' | 'alert' | 'stock' | 'heartbeat';
  data: unknown;
  timestamp: Date;
}

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private readonly eventSubject = new Subject<StreamEvent>();

  // クライアント接続数のトラッキング
  private clientCount = 0;

  getEventStream(): Observable<StreamEvent> {
    return this.eventSubject.asObservable();
  }

  // 新しい記事を配信
  publishArticle(article: {
    id: string;
    title: string;
    source: string;
    impactLevel: string;
    sentiment: number | null;
    summary: string[] | null;
    publishedAt: Date;
  }): void {
    this.logger.log(`Publishing new article: ${article.title}`);

    this.eventSubject.next({
      type: 'article',
      data: article,
      timestamp: new Date(),
    });
  }

  // アラートイベントを配信
  publishAlert(alert: {
    alertId: string;
    articleId: string;
    articleTitle: string;
    impactLevel: string;
  }): void {
    this.logger.log(`Publishing alert: ${alert.alertId}`);

    this.eventSubject.next({
      type: 'alert',
      data: alert,
      timestamp: new Date(),
    });
  }

  // 株価更新を配信
  publishStockUpdate(stock: {
    symbol: string;
    price: number;
    change: number;
    volume: number;
  }): void {
    this.eventSubject.next({
      type: 'stock',
      data: stock,
      timestamp: new Date(),
    });
  }

  // ハートビート（接続維持用）
  sendHeartbeat(): void {
    this.eventSubject.next({
      type: 'heartbeat',
      data: { clientCount: this.clientCount },
      timestamp: new Date(),
    });
  }

  // クライアント接続管理
  onClientConnect(): void {
    this.clientCount++;
    this.logger.log(`Client connected. Total: ${this.clientCount}`);
  }

  onClientDisconnect(): void {
    this.clientCount--;
    this.logger.log(`Client disconnected. Total: ${this.clientCount}`);
  }

  getClientCount(): number {
    return this.clientCount;
  }
}
