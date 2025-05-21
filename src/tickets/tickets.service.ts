import { Injectable } from '@nestjs/common';
import {
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { TicketRepository } from './tickets.repository';
import {
  DuplicateTicketException,
  MultipleAssigneesException,
  MultipleDirectorsException,
  NoDirectorException,
  NoAssigneeException,
} from '../exceptions/ticket.exceptions';

interface TicketDto {
  id: number;
  type: TicketType;
  companyId: number;
  assigneeId: number;
  status: TicketStatus;
  category: TicketCategory;
}

@Injectable()
export class TicketsService {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async findAll() {
    return await this.ticketRepository.findAll();
  }

  async create(type: TicketType, companyId: number): Promise<TicketDto> {
    if (type === TicketType.strikeOff) {
      return await this.createStrikeOffTicket(companyId);
    }

    if (type === TicketType.registrationAddressChange) {
      await this.checkForExistingAddressChangeTicket(companyId);
    }

    const category = this.getTicketCategory(type);
    const assignee = await this.findAssignee(type, companyId);
    return await this.createAndFormatTicket(
      companyId,
      assignee.id,
      category,
      type,
    );
  }

  private async createStrikeOffTicket(companyId: number): Promise<TicketDto> {
    const directors = await this.findUsersByRole(companyId, UserRole.Director);

    if (!directors.length) {
      throw new NoDirectorException();
    }

    if (directors.length > 1) {
      throw new MultipleDirectorsException();
    }

    await this.ticketRepository.updateStatus(
      companyId,
      TicketStatus.resolved,
      TicketStatus.resolved,
    );

    return this.createAndFormatTicket(
      companyId,
      directors[0].id,
      TicketCategory.management,
      TicketType.strikeOff,
    );
  }

  private async checkForExistingAddressChangeTicket(
    companyId: number,
  ): Promise<void> {
    const existingTicket = await this.ticketRepository.findOne({
      companyId,
      type: TicketType.registrationAddressChange,
    });

    if (existingTicket) {
      throw new DuplicateTicketException(existingTicket.id);
    }
  }

  private getTicketCategory(type: TicketType): TicketCategory {
    return type === TicketType.managementReport
      ? TicketCategory.accounting
      : TicketCategory.corporate;
  }

  private async findAssignee(
    type: TicketType,
    companyId: number,
  ): Promise<User> {
    let userRole = this.getPrimaryUserRole(type);
    let assignees = await this.findUsersByRole(companyId, userRole);

    if (type === TicketType.registrationAddressChange && !assignees.length) {
      userRole = UserRole.Director;
      assignees = await this.findUsersByRole(companyId, userRole);
    }

    if (!assignees.length) {
      throw new NoAssigneeException(userRole);
    }

    if (this.isSingleAssigneeRole(userRole) && assignees.length > 1) {
      throw new MultipleAssigneesException(userRole);
    }

    return assignees[0];
  }

  private getPrimaryUserRole(type: TicketType): UserRole {
    return type === TicketType.managementReport
      ? UserRole.accountant
      : UserRole.corporateSecretary;
  }

  private isSingleAssigneeRole(role: UserRole): boolean {
    return role === UserRole.corporateSecretary || role === UserRole.Director;
  }

  private async findUsersByRole(
    companyId: number,
    role: UserRole,
  ): Promise<User[]> {
    // Should have a UserRepository but for simplicity, using the User model directly
    return await User.findAll({
      where: { companyId, role },
      order: [['createdAt', 'DESC']],
    });
  }

  private async createAndFormatTicket(
    companyId: number,
    assigneeId: number,
    category: TicketCategory,
    type: TicketType,
  ): Promise<TicketDto> {
    const ticket = await this.ticketRepository.create({
      companyId,
      assigneeId,
      category,
      type,
      status: TicketStatus.open,
    });

    return {
      id: ticket.id,
      type: ticket.type,
      assigneeId: ticket.assigneeId,
      status: ticket.status,
      category: ticket.category,
      companyId: ticket.companyId,
    };
  }
}
