import { Controller, Get } from '@nestjs/common';

@Controller() // Root controller - no prefix
export class RootController {
  @Get()
  getRoot() {
    return {
      message: 'Mithran Manufacturing Platform API - Live',
      status: 'running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ping')
  ping() {
    return { pong: true };
  }
}