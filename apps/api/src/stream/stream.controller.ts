import { Controller, Sse, MessageEvent, Logger } from '@nestjs/common';
import { Observable, interval, map, merge, finalize } from 'rxjs';
import { StreamService } from './stream.service';

@Controller('api')
export class StreamController {
  private readonly logger = new Logger(StreamController.name);

  constructor(private readonly streamService: StreamService) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    this.streamService.onClientConnect();

    // メインのイベントストリーム
    const eventStream = this.streamService.getEventStream().pipe(
      map((event) => ({
        type: event.type,
        data: JSON.stringify({
          type: event.type,
          data: event.data,
          timestamp: event.timestamp.toISOString(),
        }),
      }))
    );

    // ハートビート（30秒ごと）
    const heartbeatStream = interval(30000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: JSON.stringify({
          type: 'heartbeat',
          data: { time: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        }),
      }))
    );

    // 初期接続メッセージ
    const initialMessage = new Observable<MessageEvent>((subscriber) => {
      subscriber.next({
        type: 'connected',
        data: JSON.stringify({
          type: 'connected',
          data: { message: 'SSE connection established' },
          timestamp: new Date().toISOString(),
        }),
      });
    });

    return merge(initialMessage, eventStream, heartbeatStream).pipe(
      finalize(() => {
        this.streamService.onClientDisconnect();
        this.logger.log('SSE connection closed');
      })
    );
  }
}
