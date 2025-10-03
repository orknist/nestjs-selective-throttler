import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SingleThrottle, SelectiveThrottle } from 'nestjs-selective-throttler/decorators';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ✅ This works - payment-process is defined in PaymentModule
  @Post('process')
  @SingleThrottle('payment-process')
  processPayment(@Body() paymentDto: { amount: number; currency: string }) {
    return {
      ...this.paymentService.processPayment(paymentDto.amount, paymentDto.currency),
      throttler: 'payment-process (1 req/min)',
      module: 'PaymentModule'
    };
  }

  // ✅ This works - payment-verify is defined in PaymentModule
  @Post('verify/:transactionId')
  @SingleThrottle('payment-verify')
  verifyPayment(@Param('transactionId') transactionId: string) {
    return {
      ...this.paymentService.verifyPayment(transactionId),
      throttler: 'payment-verify (5 req/min)',
      module: 'PaymentModule'
    };
  }

  // ✅ This works - payment-refund is defined in PaymentModule
  @Post('refund')
  @SingleThrottle('payment-refund')
  refundPayment(@Body() refundDto: { transactionId: string; amount: number }) {
    return {
      ...this.paymentService.refundPayment(refundDto.transactionId, refundDto.amount),
      throttler: 'payment-refund (2 req/5min)',
      module: 'PaymentModule'
    };
  }

  // ✅ This works - payment-webhook is defined in PaymentModule
  @Post('webhook')
  @SingleThrottle('payment-webhook')
  handleWebhook(@Body() payload: any) {
    return {
      ...this.paymentService.handleWebhook(payload),
      throttler: 'payment-webhook (50 req/10sec)',
      module: 'PaymentModule'
    };
  }

  // ❌ PROBLEM: api-internal is defined in ApiModule, NOT in PaymentModule!
  @Get('status')
  @SingleThrottle('api-internal')
  getPaymentStatus() {
    return {
      status: 'Payment service is running',
      throttler: 'api-internal (UNDEFINED in PaymentModule!)',
      module: 'PaymentModule',
      problem: 'This throttler is not defined in PaymentModule - will not work properly!'
    };
  }

  // ❌ PROBLEM: Mixed throttlers - some are not in PaymentModule
  @Post('complex-operation')
  @SelectiveThrottle({
    'payment-verify': {},      // ✅ Available in PaymentModule
    'payment-process': {},     // ✅ Available in PaymentModule
    'auth-login': {},          // ❌ Defined in AuthModule, NOT in PaymentModule!
    'api-premium': {}          // ❌ Defined in ApiModule, NOT in PaymentModule!
  })
  complexOperation(@Body() operationDto: any) {
    return {
      result: 'Complex payment operation completed',
      throttlers: 'payment-verify (✅) + payment-process (✅) + auth-login (❌) + api-premium (❌)',
      module: 'PaymentModule',
      problem: 'Only payment throttlers will work, others are undefined!'
    };
  }

  // ✅ This works - all throttlers are defined in PaymentModule
  @Post('safe-operation')
  @SelectiveThrottle({
    'payment-verify': {},
    'payment-webhook': { limit: 10, ttl: 30000 }, // Override
    'payment-refund': {}
  })
  safeOperation(@Body() operationDto: any) {
    return {
      result: 'Safe payment operation with only PaymentModule throttlers',
      throttlers: 'payment-verify (✅) + payment-webhook (✅ override) + payment-refund (✅)',
      module: 'PaymentModule',
      status: 'All throttlers are properly defined!'
    };
  }
}