import { Controller, Get, Query } from '@nestjs/common';
import { SingleThrottle, SelectiveThrottle } from 'nestjs-selective-throttler/decorators';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  // ✅ This works - api-public is defined in ApiModule
  @Get('public')
  @SingleThrottle('api-public')
  getPublicData() {
    return {
      ...this.apiService.getPublicData(),
      throttler: 'api-public (100 req/min)',
      module: 'ApiModule'
    };
  }

  // ✅ This works - api-premium is defined in ApiModule
  @Get('premium')
  @SingleThrottle('api-premium')
  getPremiumData() {
    return {
      ...this.apiService.getPremiumData(),
      throttler: 'api-premium (500 req/min)',
      module: 'ApiModule'
    };
  }

  // ✅ This works - api-internal is defined in ApiModule
  @Get('internal')
  @SingleThrottle('api-internal')
  getInternalData() {
    return {
      ...this.apiService.getInternalData(),
      throttler: 'api-internal (1000 req/min)',
      module: 'ApiModule'
    };
  }

  // ❌ PROBLEM: auth-login is defined in AuthModule, NOT in ApiModule!
  @Get('users')
  @SingleThrottle('auth-login')
  getUsers() {
    return {
      ...this.apiService.getUsers(),
      throttler: 'auth-login (UNDEFINED in ApiModule!)',
      module: 'ApiModule',
      problem: 'This throttler is not defined in ApiModule - will not work properly!'
    };
  }

  // ❌ PROBLEM: Mixed throttlers - some are not in ApiModule
  @Get('mixed-data')
  @SelectiveThrottle({
    'api-public': {},          // ✅ Available in ApiModule
    'api-rate-limit': {},      // ✅ Available in ApiModule
    'auth-register': {},       // ❌ Defined in AuthModule, NOT in ApiModule!
    'payment-process': {}      // ❌ Defined in PaymentModule, NOT in ApiModule!
  })
  getMixedData(@Query('type') type: string) {
    return {
      data: `Mixed data of type: ${type}`,
      throttlers: 'api-public (✅) + api-rate-limit (✅) + auth-register (❌) + payment-process (❌)',
      module: 'ApiModule',
      problem: 'Only api-public and api-rate-limit will work, others are undefined!'
    };
  }

  // ✅ This works - all throttlers are defined in ApiModule
  @Get('safe-mixed')
  @SelectiveThrottle({
    'api-public': {},
    'api-premium': { limit: 200, ttl: 60000 }, // Override
    'api-rate-limit': {}
  })
  getSafeMixedData() {
    return {
      data: 'Safe mixed data with only ApiModule throttlers',
      throttlers: 'api-public (✅) + api-premium (✅ override) + api-rate-limit (✅)',
      module: 'ApiModule',
      status: 'All throttlers are properly defined!'
    };
  }
}