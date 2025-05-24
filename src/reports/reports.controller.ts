import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('api/v1/reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get()
  report() {
    return {
      'accounts.csv': this.reportsService.state('accounts'),
      'yearly.csv': this.reportsService.state('yearly'),
      'fs.csv': this.reportsService.state('fs'),
    };
  }

  @Post()
  @HttpCode(202)
  generate() {
    setImmediate(() => this.eventEmitter.emit('reports.generate'));
    return { message: 'Report generation started' };
  }
}
