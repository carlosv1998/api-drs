import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export class CustomNotFoundException extends NotFoundException {
  constructor(message: string, errorType?: string) {
    super({ message, error: 'Not Found', errorType });
  }
}

export class CustomBadRequestException extends BadRequestException {
  constructor(message: string, errorType?: string) {
    super({ message, error: 'Bad Request', errorType });
  }
}

export class CustomUnauthorizedException extends UnauthorizedException {
  constructor(message: string, errorType?: string) {
    super({ message, error: 'Unauthorized', errorType });
  }
}

export class CustomForbiddenException extends ForbiddenException {
  constructor(message: string, errorType?: string) {
    super({ message, error: 'Forbidden', errorType });
  }
}

export class CustomConflictException extends ConflictException {
  constructor(message: string, errorType?: string) {
    super({ message, error: 'Conflict', errorType });
  }
}

export class CustomInternalServerErrorException extends InternalServerErrorException {
  constructor(message: string, errorType?: string) {
    super({ message, error: 'Internal Server Error', errorType });
  }
}
