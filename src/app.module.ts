import { Module } from '@nestjs/common';
import { DbModule } from './db.module';
import { TicketsController } from './tickets/tickets.controller';
import { ReportsController } from './reports/reports.controller';
import { HealthcheckController } from './healthcheck/healthcheck.controller';
import { ReportsService } from './reports/reports.service';
import { TicketsService } from './tickets/tickets.service';
import { TicketRepository } from './tickets/tickets.repository';

@Module({
  imports: [DbModule],
  controllers: [TicketsController, ReportsController, HealthcheckController],
  providers: [ReportsService, TicketsService, TicketRepository],
})
export class AppModule {}
