import { ConflictException } from '@nestjs/common';

export class DuplicateTicketException extends ConflictException {
  constructor(ticketId: number) {
    super(
      `Company already has an open registration address change ticket (ID: ${ticketId})`,
    );
  }
}

export class NoAssigneeException extends ConflictException {
  constructor(role: string) {
    super(`Cannot find user with role ${role} to create a ticket`);
  }
}

export class MultipleAssigneesException extends ConflictException {
  constructor(role: string) {
    super(`Multiple users with role ${role}. Cannot create a ticket`);
  }
}

export class NoDirectorException extends ConflictException {
  constructor() {
    super('Cannot find user with role Director to create a strike off ticket');
  }
}

export class MultipleDirectorsException extends ConflictException {
  constructor() {
    super(
      'Multiple users with role Director. Cannot create a strike off ticket',
    );
  }
}
