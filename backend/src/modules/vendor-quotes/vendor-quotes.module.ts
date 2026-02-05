import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KnexModule } from 'nestjs-knex';
import { VendorQuotesController } from './vendor-quotes.controller';
import { VendorQuotesService } from './vendor-quotes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    KnexModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          client: 'pg',
          connection: {
            host: configService.get('SUPABASE_DB_HOST'),
            port: configService.get('SUPABASE_DB_PORT') || 5432,
            user: configService.get('SUPABASE_DB_USER'),
            password: configService.get('SUPABASE_DB_PASSWORD'),
            database: configService.get('SUPABASE_DB_NAME'),
            ssl: { rejectUnauthorized: false },
          },
          pool: {
            min: 2,
            max: 10,
          },
        },
      }),
    }),
  ],
  controllers: [VendorQuotesController],
  providers: [VendorQuotesService],
  exports: [VendorQuotesService],
})
export class VendorQuotesModule { }