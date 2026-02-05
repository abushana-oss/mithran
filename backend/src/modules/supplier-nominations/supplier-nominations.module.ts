import { Module } from '@nestjs/common';
import { SupplierNominationsController } from './supplier-nominations.controller';
import { SupplierNominationsService } from './supplier-nominations.service';
import { FieldMappingService } from './services/field-mapping.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { LoggerModule } from '../../common/logger/logger.module';

@Module({
  imports: [SupabaseModule, LoggerModule],
  controllers: [SupplierNominationsController],
  providers: [SupplierNominationsService, FieldMappingService],
  exports: [SupplierNominationsService, FieldMappingService]
})
export class SupplierNominationsModule {}