import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello(): { message: string; status: string; timestamp: string } {
    return {
      message: 'Mithran Manufacturing Platform API',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ping')
  ping(): { pong: boolean } {
    return { pong: true };
  }
}