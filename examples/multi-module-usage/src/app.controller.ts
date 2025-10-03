import { Controller, Get } from '@nestjs/common';
import { SingleThrottle } from 'nestjs-selective-throttler/decorators';

@Controller()
export class AppController {
  constructor() { }

  // ❌ PROBLEM: This will demonstrate the multi-module issue
  // None of the throttlers from feature modules are available in AppModule
  @Get()
  @SingleThrottle('auth-login') // This throttler is defined in AuthModule, not available here!
  getRoot(): object {
    return {
      message: 'Multi-Module Throttler Demo',
      problem: 'auth-login throttler is not defined in AppModule - will not work!',
      solution: 'Check /auth, /api, and /payment endpoints for working examples',
      modules: {
        auth: '/auth (login, register, reset-password, profile, change-password)',
        api: '/api (public, premium, internal, users, mixed-data, safe-mixed)',
        payment: '/payment (process, verify, refund, webhook, status, complex-operation, safe-operation)'
      }
    };
  }

  @Get('status')
  getStatus(): object {
    return {
      status: 'Multi-Module Throttler Example is running',
      message: 'This example demonstrates cross-module throttler issues',
      modules: ['AuthModule', 'ApiModule', 'PaymentModule'],
      note: 'Each module defines its own throttlers - cross-module usage will fail'
    };
  }
}
