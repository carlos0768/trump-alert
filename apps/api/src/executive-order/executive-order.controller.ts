import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ExecutiveOrderService } from './executive-order.service';

@Controller('api/executive-orders')
export class ExecutiveOrderController {
  constructor(private readonly executiveOrderService: ExecutiveOrderService) {}

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.executiveOrderService.findAll(
      type,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0
    );
  }

  @Get('recent')
  async getRecent(@Query('limit') limit?: string) {
    const orders = await this.executiveOrderService.getRecent(
      limit ? parseInt(limit, 10) : 5
    );
    return { orders };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const order = await this.executiveOrderService.findById(id);
    if (!order) {
      return { error: 'Executive order not found' };
    }
    return { order };
  }

  @Post('collect')
  async triggerCollection() {
    const result = await this.executiveOrderService.triggerCollection();
    return {
      message: 'Collection triggered',
      ...result,
    };
  }
}
