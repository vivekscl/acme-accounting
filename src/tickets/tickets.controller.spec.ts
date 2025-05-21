import { Test, TestingModule } from '@nestjs/testing';
import { Company } from '../../db/models/Company';
import {
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { Ticket } from '../../db/models/Ticket';
import { DbModule } from '../db.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketRepository } from './tickets.repository';
import {
  DuplicateTicketException,
  MultipleAssigneesException,
  MultipleDirectorsException,
  NoDirectorException,
  NoAssigneeException,
} from '../exceptions/ticket.exceptions';

describe('TicketsController', () => {
  let controller: TicketsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      imports: [DbModule],
      providers: [TicketsService, TicketRepository],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();

    const res = await controller.findAll();
    console.log(res);
  });

  describe('create', () => {
    describe('managementReport', () => {
      it('creates managementReport ticket', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(ticket.category).toBe(TicketCategory.accounting);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there are multiple accountants, assign the last one', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });
        const user2 = await User.create({
          name: 'Test User',
          role: UserRole.accountant,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(ticket.category).toBe(TicketCategory.accounting);
        expect(ticket.assigneeId).toBe(user2.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there is no accountant, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.managementReport,
          }),
        ).rejects.toEqual(
          new NoAssigneeException(UserRole.accountant),
        );
      });
      it('prefers newest accountant when multiple are present', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Older Accountant',
          role: UserRole.accountant,
          companyId: company.id,
          createdAt: new Date('2021-01-01'),
        });
        const newerAccountant = await User.create({
          name: 'Newer Accountant',
          role: UserRole.accountant,
          companyId: company.id,
          createdAt: new Date('2022-01-01'),
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        expect(ticket.category).toBe(TicketCategory.accounting);
        expect(ticket.assigneeId).toBe(newerAccountant.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });
    });

    describe('registrationAddressChange', () => {
      it('creates registrationAddressChange ticket', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('creates registrationAddressChange ticket for Director if no corporateSecretary', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.Director,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('creates registrationAddressChange ticket for corporateSecretary when Director is present', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });
        const user2 = await User.create({
          name: 'Test User',
          role: UserRole.Director,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if there are multiple secretaries, throw', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });
        await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new MultipleAssigneesException(UserRole.corporateSecretary),
        );
      });

      it('if there are multiple Directors, throw', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Test User',
          role: UserRole.Director,
          companyId: company.id,
        });
        await User.create({
          name: 'Test User',
          role: UserRole.Director,
          companyId: company.id,
        });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new MultipleAssigneesException(UserRole.Director),
        );
      });

      it('if there is no secretary, switch to Director and then if no Director, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new NoAssigneeException(UserRole.Director),
        );
      });

      it('if the company already has a ticket with registrationAddressChange type, throw', async () => {
        const company = await Company.create({ name: 'test' });
        const user = await User.create({
          name: 'Test User',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        expect(ticket.category).toBe(TicketCategory.corporate);
        expect(ticket.assigneeId).toBe(user.id);
        expect(ticket.status).toBe(TicketStatus.open);

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toEqual(
          new DuplicateTicketException(ticket.id),
        );
      });
      it('create ticket for non-existent company, throw', async () => {
        await expect(
          controller.create({
            companyId: 999999,
            type: TicketType.registrationAddressChange,
          }),
        ).rejects.toThrow();
      });
    });
    describe('strikeOff', () => {
      it('creates strikeOff ticket with Director as assignee', async () => {
        const company = await Company.create({ name: 'test' });
        const director = await User.create({
          name: 'Director User',
          role: UserRole.Director,
          companyId: company.id,
        });

        const ticket = await controller.create({
          companyId: company.id,
          type: TicketType.strikeOff,
        });

        expect(ticket.category).toBe(TicketCategory.management);
        expect(ticket.assigneeId).toBe(director.id);
        expect(ticket.status).toBe(TicketStatus.open);
      });

      it('if no Director found, throw', async () => {
        const company = await Company.create({ name: 'test' });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.strikeOff,
          }),
        ).rejects.toEqual(
          new NoDirectorException(),
        );
      });

      it('if multiple Directors found, throw', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Director 1',
          role: UserRole.Director,
          companyId: company.id,
        });
        await User.create({
          name: 'Director 2',
          role: UserRole.Director,
          companyId: company.id,
        });

        await expect(
          controller.create({
            companyId: company.id,
            type: TicketType.strikeOff,
          }),
        ).rejects.toEqual(
          new MultipleDirectorsException(),
        );
      });

      it('closes all other active tickets when creating strikeOff ticket', async () => {
        const company = await Company.create({ name: 'test' });
        await User.create({
          name: 'Secretary',
          role: UserRole.corporateSecretary,
          companyId: company.id,
        });
        await User.create({
          name: 'Accountant',
          role: UserRole.accountant,
          companyId: company.id,
        });
        const director = await User.create({
          name: 'Director',
          role: UserRole.Director,
          companyId: company.id,
        });

        const addressTicket = await controller.create({
          companyId: company.id,
          type: TicketType.registrationAddressChange,
        });

        const reportTicket = await controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        });

        const strikeOffTicket = await controller.create({
          companyId: company.id,
          type: TicketType.strikeOff,
        });

        expect(strikeOffTicket.category).toBe(TicketCategory.management);
        expect(strikeOffTicket.assigneeId).toBe(director.id);

        const updatedAddressTicket = await Ticket.findByPk(addressTicket.id);
        const updatedReportTicket = await Ticket.findByPk(reportTicket.id);

        expect(updatedAddressTicket).not.toBeNull();
        expect(updatedReportTicket).not.toBeNull();

        expect(updatedAddressTicket?.status).toBe(TicketStatus.resolved);
        expect(updatedReportTicket?.status).toBe(TicketStatus.resolved);
      });

      it('only closes tickets for the specific company', async () => {
        const company1 = await Company.create({ name: 'Company A' });
        const company2 = await Company.create({ name: 'Company B' });

        await User.create({
          name: 'Secretary',
          role: UserRole.corporateSecretary,
          companyId: company1.id,
        });
        await User.create({
          name: 'Director',
          role: UserRole.Director,
          companyId: company1.id,
        });

        await User.create({
          name: 'Secretary',
          role: UserRole.corporateSecretary,
          companyId: company2.id,
        });
        await User.create({
          name: 'Director',
          role: UserRole.Director,
          companyId: company2.id,
        });

        const ticket1 = await controller.create({
          companyId: company1.id,
          type: TicketType.registrationAddressChange,
        });

        const ticket2 = await controller.create({
          companyId: company2.id,
          type: TicketType.registrationAddressChange,
        });

        await controller.create({
          companyId: company1.id,
          type: TicketType.strikeOff,
        });

        const updatedTicket1 = await Ticket.findByPk(ticket1.id);
        expect(updatedTicket1).not.toBeNull();
        expect(updatedTicket1?.status).toBe(TicketStatus.resolved);

        const updatedTicket2 = await Ticket.findByPk(ticket2.id);
        expect(updatedTicket2).not.toBeNull();
        expect(updatedTicket2?.status).toBe(TicketStatus.open);
      });
    });
  });
});
