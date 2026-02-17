import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ 
    summary: 'Root health check', 
    description: 'Returns API status and health information for the root endpoint' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API is healthy and running',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            service: { type: 'string', example: 'mithran-api-gateway' },
            status: { type: 'string', example: 'healthy' },
            version: { type: 'string', example: '1.0.0' },
            environment: { type: 'string', example: 'production' },
            timestamp: { type: 'string', example: '2026-02-17T15:33:40.384Z' },
            uptime: { type: 'number', example: 3661.234 }
          }
        }
      }
    }
  })
  healthCheck(): {
    success: boolean;
    data: {
      service: string;
      status: string;
      version: string;
      environment: string;
      timestamp: string;
      uptime: number;
    };
  } {
    return {
      success: true,
      data: {
        service: 'mithran-api-gateway',
        status: 'healthy',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  }

  @Public()
  @Get('ping')
  @ApiOperation({ 
    summary: 'Ping endpoint', 
    description: 'Simple ping endpoint for basic connectivity testing' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successful ping response',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            pong: { type: 'boolean', example: true },
            timestamp: { type: 'string', example: '2026-02-17T15:33:40.384Z' }
          }
        }
      }
    }
  })
  ping(): {
    success: boolean;
    data: {
      pong: boolean;
      timestamp: string;
    };
  } {
    return {
      success: true,
      data: {
        pong: true,
        timestamp: new Date().toISOString(),
      },
    };
  }
}