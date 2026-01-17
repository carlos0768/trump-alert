import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AlertService, CreateAlertDto, UpdateAlertDto } from './alert.service';

@Controller('api/alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAlertDto) {
    return this.alertService.create(dto);
  }

  @Get()
  async findAll(@Query('userId') userId: string) {
    if (!userId) {
      return { error: 'userId is required' };
    }
    return this.alertService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alertService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAlertDto) {
    return this.alertService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.alertService.remove(id);
  }
}
