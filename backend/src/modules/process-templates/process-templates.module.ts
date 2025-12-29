import { Module } from '@nestjs/common';
import { ProcessTemplatesController } from './process-templates.controller';
import { ProcessTemplatesService } from './process-templates.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { LoggerModule } from '../../common/logger/logger.module';

@Module({
  imports: [SupabaseModule, LoggerModule],
  controllers: [ProcessTemplatesController],
  providers: [ProcessTemplatesService],
  exports: [ProcessTemplatesService],
})
export class ProcessTemplatesModule {}
