import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReportsService } from './reports.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReportsListener {
  constructor(
    private reportsService: ReportsService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('reports.generate')
  async handleReportGeneration() {
    // Run reports in parallel
    Promise.all([
      this.reportsService.accounts(),
      this.reportsService.yearly(),
      this.reportsService.fs(),
    ]);
  }

  @OnEvent('reports.accounts.update')
  handleAccountsCompleted(status: string) {
    this.reportsService.updateState('accounts', status);
  }

  @OnEvent('reports.yearly.update')
  handleYearlyCompleted(status: string) {
    this.reportsService.updateState('yearly', status);
  }

  @OnEvent('reports.fs.update')
  handleFsCompleted(status: string) {
    this.reportsService.updateState('fs', status);
  }
}
