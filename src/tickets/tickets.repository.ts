import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Ticket, TicketStatus } from '../../db/models/Ticket';
import { Company } from '../../db/models/Company';
import { User } from '../../db/models/User';

@Injectable()
export class TicketRepository {
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  async findOne(where: any) {
    return await Ticket.findOne({ where });
  }

  async create(ticketData: any) {
    return await Ticket.create(ticketData);
  }

  async updateStatus(
    companyId: number,
    status: TicketStatus,
    notStatus: TicketStatus,
  ) {
    return await Ticket.update(
      { status },
      { where: { companyId, status: { [Op.ne]: notStatus } } },
    );
  }
}
