import { Body, Controller, Get, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { NewTicketDto } from './ticket.dto';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async findAll() {
    return await this.ticketsService.findAll();
  }

  @Post()
  async create(@Body() newTicketDto: NewTicketDto) {
    const { type, companyId } = newTicketDto;
    return await this.ticketsService.create(type, companyId);
  }
}
