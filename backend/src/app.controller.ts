import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
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

  @Get('ping')
  ping() {
    return {
      success: true,
      data: {
        pong: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('test')
  test() {
    return { message: 'AppController is working!' };
  }
}