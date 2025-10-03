import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    // PaymentModule using object format with throttlers property
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'payment-process',
          ttl: 60 * 1000, // 1 minute
          limit: 1, // 1 payment operation per minute (very critical)
        },
        {
          name: 'payment-verify',
          ttl: 60 * 1000, // 1 minute
          limit: 5, // 5 verifications per minute
        },
        {
          name: 'payment-refund',
          ttl: 300 * 1000, // 5 minutes
          limit: 2, // 2 refund operations per 5 minutes
        },
        {
          name: 'payment-webhook',
          ttl: 10 * 1000, // 10 seconds
          limit: 50, // 50 webhooks per 10 seconds (external services)
        }
      ],
      // Additional options
      skipIf: () => false,
      ignoreUserAgents: [/bot/i]
    })
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService]
})
export class PaymentModule {}