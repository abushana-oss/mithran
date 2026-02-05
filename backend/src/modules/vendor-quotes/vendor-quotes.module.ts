import { Module } from '@nestjs/common';
import { VendorQuotesController } from './vendor-quotes.controller';
import { VendorQuotesService } from './vendor-quotes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VendorQuotesController],
  providers: [VendorQuotesService],
  exports: [VendorQuotesService],
})
export class VendorQuotesModule {}