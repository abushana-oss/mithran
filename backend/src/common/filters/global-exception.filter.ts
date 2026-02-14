import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    [key: string]: any;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const httpStatus = this.getHttpStatus(exception);
    const message = this.getErrorMessage(exception);
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const userAgent = request.get('User-Agent') || 'Unknown';
    const ip = request.ip || request.connection.remoteAddress || 'Unknown';

    // Structured error object
    const errorResponse = {
      statusCode: httpStatus,
      timestamp,
      path,
      method,
      message: this.sanitizeErrorMessage(message),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
        details: this.getErrorDetails(exception),
      }),
    };

    // Log error with context
    this.logError(exception, {
      httpStatus,
      path,
      method,
      userAgent,
      ip,
      userId: request.user?.id,
    });

    // Send response
    response.status(httpStatus).json(errorResponse);
  }

  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // Database-specific errors
    if (this.isDatabaseError(exception)) {
      return HttpStatus.BAD_REQUEST;
    }

    // Validation errors
    if (this.isValidationError(exception)) {
      return HttpStatus.BAD_REQUEST;
    }

    // Rate limiting errors
    if (this.isRateLimitError(exception)) {
      return HttpStatus.TOO_MANY_REQUESTS;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return typeof response === 'string' ? response : (response as any).message || 'Unknown error';
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'An unexpected error occurred';
  }

  private getErrorDetails(exception: unknown): any {
    if (exception instanceof HttpException) {
      return exception.getResponse();
    }

    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
      };
    }

    return { raw: exception };
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    return message
      .replace(/password/gi, '[REDACTED]')
      .replace(/token/gi, '[REDACTED]')
      .replace(/secret/gi, '[REDACTED]')
      .replace(/key/gi, '[REDACTED]')
      .replace(/api[_-]?key/gi, '[REDACTED]')
      .replace(/auth[_-]?token/gi, '[REDACTED]');
  }

  private logError(exception: unknown, context: any): void {
    const logLevel = context.httpStatus >= 500 ? 'error' : 'warn';
    const logMessage = `${context.method} ${context.path} - ${context.httpStatus}`;
    
    const logContext = {
      ...context,
      error: exception instanceof Error ? {
        name: exception.name,
        message: this.sanitizeErrorMessage(exception.message),
        stack: process.env.NODE_ENV === 'development' ? exception.stack : undefined,
      } : exception,
    };

    if (logLevel === 'error') {
      this.logger.error(logMessage, logContext);
    } else {
      this.logger.warn(logMessage, logContext);
    }
  }

  private isDatabaseError(exception: unknown): boolean {
    if (exception instanceof Error) {
      return (
        exception.message.includes('duplicate key') ||
        exception.message.includes('violates foreign key') ||
        exception.message.includes('violates check constraint') ||
        exception.message.includes('relation does not exist') ||
        exception.message.includes('column does not exist')
      );
    }
    return false;
  }

  private isValidationError(exception: unknown): boolean {
    if (exception instanceof Error) {
      return (
        exception.name === 'ValidationError' ||
        exception.message.includes('validation failed') ||
        exception.message.includes('invalid input')
      );
    }
    return false;
  }

  private isRateLimitError(exception: unknown): boolean {
    if (exception instanceof HttpException) {
      return exception.getStatus() === HttpStatus.TOO_MANY_REQUESTS;
    }
    return false;
  }
}