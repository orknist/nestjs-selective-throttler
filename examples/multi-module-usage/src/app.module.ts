import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard } from '@nestjs/throttler';

// Import feature modules
import { AuthModule } from './auth/auth.module';
import { ApiModule } from './api/api.module';
import { PaymentModule } from './payment/payment.module';

// Build-time generated throttler names
import { ALL_THROTTLER_NAMES } from 'nestjs-selective-throttler/throttler-names';
console.log('Build-time discovered throttler names:', ALL_THROTTLER_NAMES);

@Module({
  imports: [
    // Feature modules - each defines its own throttlers
    AuthModule,
    ApiModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }