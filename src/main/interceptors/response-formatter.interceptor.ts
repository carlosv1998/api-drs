import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface FormattedResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseFormatterInterceptor<T> implements NestInterceptor<
  T,
  FormattedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<FormattedResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || HttpStatus.OK;
        const message = this.getDefaultMessage(request.method, statusCode);

        return {
          statusCode,
          message,
          data,
        };
      }),
    );
  }

  private getDefaultMessage(method: string, statusCode: number): string {
    // Mensajes personalizados según el método HTTP
    if (statusCode >= 200 && statusCode < 300) {
      switch (method) {
        case 'GET':
          return 'Resource retrieved successfully';
        case 'POST':
          return 'Resource created successfully';
        case 'PUT':
        case 'PATCH':
          return 'Resource updated successfully';
        case 'DELETE':
          return 'Resource deleted successfully';
        default:
          return 'Operation completed successfully';
      }
    }

    // Mensajes para códigos de error
    if (statusCode >= 400 && statusCode < 500) {
      return 'Client error occurred';
    }

    if (statusCode >= 500) {
      return 'Server error occurred';
    }

    return 'Operation completed';
  }
}
