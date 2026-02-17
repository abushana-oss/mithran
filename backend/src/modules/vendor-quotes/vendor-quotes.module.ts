import { Module } from '@nestjs/common';
import { SupabaseModule } from '@/common/supabase/supabase.module';
import { VendorQuotesController } from './vendor-quotes.controller';
import { VendorQuotesService } from './vendor-quotes.service';

@Module({
  imports: [
    SupabaseModule,
  ],
  controllers: [VendorQuotesController],
  providers: [VendorQuotesService],
  exports: [VendorQuotesService],
})
export class VendorQuotesModule { }