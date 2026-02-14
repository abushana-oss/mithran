import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private store: RateLimitStore = {};
  
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true; // No rate limit applied
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request);
    const now = Date.now();

    // Clean up expired entries
    this.cleanup();

    // Get or create rate limit entry
    let entry = this.store[key];
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + rateLimitOptions.windowMs!,
      };
      this.store[key] = entry;
    }

    // Check if limit exceeded
    if (entry.count >= rateLimitOptions.max!) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: rateLimitOptions.message || 'Too many requests',
          error: 'Too Many Requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;
    
    // Add rate limit headers to response
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', rateLimitOptions.max);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitOptions.max! - entry.count));
    response.setHeader('X-RateLimit-Reset', entry.resetTime);

    return true;
  }

  private generateKey(request: Request): string {
    // Use IP + User Agent + Route for more granular rate limiting
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const userAgent = request.get('User-Agent') || 'unknown';
    const route = `${request.method}:${request.route?.path || request.url}`;
    
    // Hash to create shorter key (in production, use a proper hashing library)
    return `${ip}:${userAgent.substring(0, 50)}:${route}`.replace(/[^a-zA-Z0-9:]/g, '_');
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }
}