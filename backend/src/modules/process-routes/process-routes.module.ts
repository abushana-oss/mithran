import { Module } from '@nestjs/common';
import { ProcessRoutesController } from './process-routes.controller';
import { ProcessRoutesService } from './process-routes.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { LoggerModule } from '../../common/logger/logger.module';

@Module({
  imports: [SupabaseModule, LoggerModule],
  controllers: [ProcessRoutesController],
  providers: [ProcessRoutesService],
  exports: [ProcessRoutesService],
})
export class ProcessRoutesModule {}
