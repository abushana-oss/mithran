import { Module } from '@nestjs/common';
import { SupabaseModule } from '@/common/supabase/supabase.module';
import { ProductionPlanningController } from './production-planning.controller';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionMaterialTrackingService } from './services/production-material-tracking.service';
import { ProductionProcessController } from './controllers/production-process.controller';
import { ProductionProcessService } from './services/production-process.service';

@Module({
  imports: [
    SupabaseModule,
  ],
  controllers: [
    ProductionPlanningController,
    ProductionProcessController,
  ],
  providers: [
    ProductionPlanningService,
    ProductionMaterialTrackingService,
    ProductionProcessService,
  ],
  exports: [
    ProductionPlanningService,
    ProductionMaterialTrackingService,
    ProductionProcessService,
  ],
})
export class ProductionPlanningModule { }