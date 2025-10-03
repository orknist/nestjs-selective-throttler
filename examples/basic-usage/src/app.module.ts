import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      // Basic throttlers
      {
        name: 'burst',
        ttl: 3 * 1000, // 3 seconds
        limit: 1, // 1 request per 3 seconds (prevents rapid fire)
      },
      {
        name: 'sustained',
        ttl: 60 * 1000, // 1 minute
        limit: 10, // 10 requests per minute (sustained load protection)
      },
      {
        name: 'sensitive',
        ttl: 60 * 1000, // 1 minute
        limit: 3, // 3 requests per minute (sensitive operations)
      },
      {
        name: 'public',
        ttl: 60 * 1000, // 1 minute
        limit: 100, // 100 requests per minute (public API)
      },
      // Real-world named throttlers (hyphenated names)
      {
        name: 'api-gateway',
        ttl: 60 * 1000, // 1 minute
        limit: 50, // 50 requests per minute (API gateway)
      },
      {
        name: 'user-actions',
        ttl: 10 * 1000, // 10 seconds
        limit: 5, // 5 requests per 10 seconds (user interactions)
      },
      {
        name: 'admin-panel',
        ttl: 60 * 1000, // 1 minute
        limit: 20, // 20 requests per minute (admin operations)
      },
      {
        name: 'payment-processing',
        ttl: 60 * 1000, // 1 minute
        limit: 2, // 2 requests per minute (payment operations)
      },
      // Legacy throttlers (used in examples)
      {
        name: 'legacy-api',
        ttl: 60 * 1000, // 1 minute
        limit: 5, // 5 requests per minute (legacy API)
      },
      {
        name: 'rate-limiter',
        ttl: 30 * 1000, // 30 seconds
        limit: 10, // 10 requests per 30 seconds (rate limiter)
      }
    ]),
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