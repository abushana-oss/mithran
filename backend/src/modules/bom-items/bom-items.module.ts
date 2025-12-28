import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BOMItemsController } from './bom-items.controller';
import { BOMItemsService } from './bom-items.service';
import { FileStorageService } from './services/file-storage.service';
import { StepConverterService } from './services/step-converter.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { LoggerModule } from '../../common/logger/logger.module';

@Module({
  imports: [SupabaseModule, LoggerModule, ConfigModule],
  controllers: [BOMItemsController],
  providers: [BOMItemsService, FileStorageService, StepConverterService],
  exports: [BOMItemsService],
})
export class BOMItemsModule {}
