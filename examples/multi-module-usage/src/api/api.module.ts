import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

@Module({
  imports: [
    // ApiModule using forRootAsync with useFactory
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            name: 'api-public',
            ttl: 60 * 1000, // 1 minute
            limit: 100, // 100 requests per minute (public API)
          },
          {
            name: 'api-premium',
            ttl: 60 * 1000, // 1 minute
            limit: 500, // 500 requests per minute (premium users)
          },
          {
            name: 'api-internal',
            ttl: 60 * 1000, // 1 minute
            limit: 1000, // 1000 requests per minute (internal services)
          },
          {
            name: 'api-rate-limit',
            ttl: 10 * 1000, // 10 seconds
            limit: 20, // 20 requests per 10 seconds (burst protection)
          }
        ]
      })
    })
  ],
  controllers: [ApiController],
  providers: [ApiService],
  exports: [ApiService]
})
export class ApiModule {}