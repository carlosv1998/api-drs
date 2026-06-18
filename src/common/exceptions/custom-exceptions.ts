import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export class CustomNotFoundException extends NotFoundException {
  constructor(message: string, errorType?: string, data?: unknown) {
    super({ message, error: 'Not Found', errorType, data });
  }
}

export class CustomBadRequestException extends BadRequestException {
  constructor(message: string, errorType?: string, data?: unknown) {
    super({ message, error: 'Bad Request', errorType, data });
  }
}

export class CustomUnauthorizedException extends UnauthorizedException {
  constructor(message: string, errorType?: string, data?: unknown) {
    super({ message, error: 'Unauthorized', errorType, data });
  }
}

export class CustomForbiddenException extends ForbiddenException {
  constructor(message: string, errorType?: string, data?: unknown) {
    super({ message, error: 'Forbidden', errorType, data });
  }
}

export class CustomConflictException extends ConflictException {
  constructor(message: string, errorType?: string, data?: unknown) {
    super({ message, error: 'Conflict', errorType, data });
  }
}

export class CustomInternalServerErrorException extends InternalServerErrorException {
  constructor(message: string, errorType?: string, data?: unknown) {
    super({ message, error: 'Internal Server Error', errorType, data });
  }
}
