import { Module } from '@nestjs/common';
import { SupabaseModule } from '@/common/supabase/supabase.module';
import { ProductionPlanningController } from './production-planning.controller';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionMaterialTrackingService } from './services/production-material-tracking.service';

@Module({
  imports: [SupabaseModule],
  controllers: [ProductionPlanningController],
  providers: [
    ProductionPlanningService,
    ProductionMaterialTrackingService,
  ],
  exports: [
    ProductionPlanningService,
    ProductionMaterialTrackingService,
  ],
})
export class ProductionPlanningModule {}