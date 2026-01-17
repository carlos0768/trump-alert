import { Module } from '@nestjs/common';
import { ExecutiveOrderService } from './executive-order.service';
import { ExecutiveOrderController } from './executive-order.controller';

@Module({
  controllers: [ExecutiveOrderController],
  providers: [ExecutiveOrderService],
  exports: [ExecutiveOrderService],
})
export class ExecutiveOrderModule {}
