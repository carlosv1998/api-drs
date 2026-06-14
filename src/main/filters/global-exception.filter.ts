import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  statusCode: number;
  message: string;
  data: any;
  errorType?: string;
}

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'A record with that value already exists' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Record not found' },
  P2003: { status: HttpStatus.BAD_REQUEST, message: 'Related record not found' },
  P2014: { status: HttpStatus.BAD_REQUEST, message: 'Invalid relation data' },
  P2016: { status: HttpStatus.BAD_REQUEST, message: 'Query interpretation error' },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let data: any = null;
    let errorType: string | undefined = undefined;

    // HttpException (incluye UnauthorizedException, BadRequestException, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || resp.error || message;
        data = resp.data || null;
        errorType = resp.errorType;

        if (Array.isArray(resp.message)) {
          message = 'Validation failed';
          data = resp.message;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        status = mapped.status;
        message = mapped.message;
      } else {
        message = 'Database error';
        this.logger.error(
          `Unmapped Prisma error ${exception.code} on ${request.method} ${request.url}: `,
          exception.stack,
        );
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unknown error occurred', {
        exception,
        path: request.url,
      });
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      data,
      ...(errorType && { errorType }),
    };

    if (status >= 500) {
      this.logger.error(
        `Error ${status} on ${request.method} ${request.url}: ${message}`,
      );
    } else {
      this.logger.warn(
        `Error ${status} on ${request.method} ${request.url}: ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
