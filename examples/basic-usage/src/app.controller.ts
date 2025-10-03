import { Controller, Get } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { SingleThrottle, SelectiveThrottle } from 'nestjs-selective-throttler/decorators';

@Controller()
export class AppController {
  constructor() { }

  // 1️⃣ SingleThrottle - Global Config
  @Get('api/single-global')
  @SingleThrottle('public')
  getSingleGlobal(): object {
    return {
      type: 'SingleThrottle - Global Config',
      throttler: 'public (100 req/min)',
      message: 'Uses global public throttler configuration'
    };
  }

  // 2️⃣ SingleThrottle - Override Config
  @Get('api/single-override')
  @SingleThrottle('sensitive', { limit: 1, ttl: 10 * 1000 })
  getSingleOverride(): object {
    return {
      type: 'SingleThrottle - Override Config',
      throttler: 'sensitive (1 req/10sec - overridden)',
      message: 'Overrides sensitive throttler: 1 request per 10 seconds'
    };
  }

  // 3️⃣ SelectiveThrottle - Single Throttler (Global)
  @Get('api/selective-single-global')
  @SelectiveThrottle({ sustained: {} })
  getSelectiveSingleGlobal(): object {
    return {
      type: 'SelectiveThrottle - Single Global',
      throttler: 'sustained (10 req/min)',
      message: 'Uses only sustained throttler with global config'
    };
  }

  // 4️⃣ SelectiveThrottle - Single Throttler (Override)
  @Get('api/selective-single-override')
  @SelectiveThrottle({ burst: { limit: 2, ttl: 5 * 1000 } })
  getSelectiveSingleOverride(): object {
    return {
      type: 'SelectiveThrottle - Single Override',
      throttler: 'burst (2 req/5sec - overridden)',
      message: 'Uses only burst throttler with custom config: 2 requests per 5 seconds'
    };
  }

  // 5️⃣ SelectiveThrottle - Multiple Throttlers (Global)
  @Get('api/selective-multi-global')
  @SelectiveThrottle({ burst: {}, sustained: {} })
  getSelectiveMultiGlobal(): object {
    return {
      type: 'SelectiveThrottle - Multi Global',
      throttlers: 'burst (1 req/3sec) + sustained (10 req/min)',
      message: 'Protected by both burst and sustained throttlers with global configs'
    };
  }

  // 6️⃣ SelectiveThrottle - Multiple Throttlers (Mixed Override)
  @Get('api/selective-multi-override')
  @SelectiveThrottle({
    burst: {}, // Global config
    sensitive: { limit: 2, ttl: 30 * 1000 } // Override config
  })
  getSelectiveMultiOverride(): object {
    return {
      type: 'SelectiveThrottle - Multi Mixed',
      throttlers: 'burst (1 req/3sec - global) + sensitive (2 req/30sec - override)',
      message: 'Mixed: burst uses global config, sensitive uses custom override'
    };
  }

  // 7️⃣ Real-world: API Gateway Pattern
  @Get('gateway/public')
  @SingleThrottle('api-gateway')
  getGatewayPublic(): object {
    return {
      type: 'API Gateway - Public',
      throttler: 'api-gateway (50 req/min)',
      message: 'Public API gateway endpoint with moderate limits'
    };
  }

  // 8️⃣ Real-world: User Actions with Burst Protection
  @Get('user/profile')
  @SelectiveThrottle({
    'user-actions': {},
    'burst': { limit: 2, ttl: 5 * 1000 } // Override: 2 req/5sec
  })
  getUserProfile(): object {
    return {
      type: 'User Actions - Profile',
      throttlers: 'user-actions (5 req/10sec) + burst (2 req/5sec - override)',
      message: 'User profile with both sustained and burst protection'
    };
  }

  // 9️⃣ Real-world: Admin Panel Operations
  @Get('admin/dashboard')
  @SelectiveThrottle({
    'admin-panel': {},
    'sustained': { limit: 15, ttl: 60 * 1000 } // Override: 15 req/min
  })
  getAdminDashboard(): object {
    return {
      type: 'Admin Panel - Dashboard',
      throttlers: 'admin-panel (20 req/min) + sustained (15 req/min - override)',
      message: 'Admin dashboard with dual protection layers'
    };
  }

  // 🔟 Real-world: Payment Processing (Strict)
  @Get('payment/process')
  @SingleThrottle('payment-processing', { limit: 1, ttl: 30 * 1000 })
  processPayment(): object {
    return {
      type: 'Payment Processing',
      throttler: 'payment-processing (1 req/30sec - override)',
      message: 'Strict payment processing with custom override: 1 request per 30 seconds'
    };
  }

  // 1️⃣1️⃣ Problem: Official @Throttle (ALL throttlers apply)
  @Get('legacy/problem')
  @Throttle({
    'legacy-api': { limit: 5, ttl: 60 * 1000 },
    'rate-limiter': { limit: 10, ttl: 30 * 1000 }
  })
  legacyProblem(): object {
    return {
      type: '❌ Problem: @Throttle Decorator',
      throttlers: 'ALL 8 throttlers apply! (2 override + 6 global)',
      message: 'This endpoint gets throttled by ALL configured throttlers, not just the 2 specified'
    };
  }

  // 1️⃣2️⃣ Workaround: @Throttle + @SkipThrottle (verbose)
  @Get('legacy/workaround')
  @Throttle({
    'legacy-api': { limit: 5, ttl: 60 * 1000 },
    'rate-limiter': { limit: 10, ttl: 30 * 1000 }
  })
  @SkipThrottle({
    'burst': true,
    'sustained': true,
    'sensitive': true,
    'public': true,
    'api-gateway': true,
    'user-actions': true,
    'admin-panel': true,
    'payment-processing': true
  })
  legacyWorkaround(): object {
    return {
      type: '⚠️ Workaround: @Throttle + @SkipThrottle',
      throttlers: 'Only legacy-api + rate-limiter (verbose solution)',
      message: 'Works but requires manually skipping 6 other throttlers - not maintainable!'
    };
  }

  // 1️⃣3️⃣ Solution: SelectiveThrottle (clean)
  @Get('legacy/solution')
  @SelectiveThrottle({
    'legacy-api': { limit: 10, ttl: 60 * 1000 },
    'rate-limiter': { limit: 5, ttl: 30 * 1000 }
  })
  legacySolution(): object {
    return {
      type: '✅ Solution: SelectiveThrottle',
      throttlers: 'Only legacy-api + rate-limiter (clean solution)',
      message: 'Automatically skips other 6 throttlers - maintainable and clear!'
    };
  }
}
