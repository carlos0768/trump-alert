import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';

@Module({
  imports: [BullModule.registerQueue({ name: 'notification-send' })],
  controllers: [AlertController],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
