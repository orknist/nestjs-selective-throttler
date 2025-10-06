# NestJS Selective Throttler

🎯 **Build-time selective throttling for NestJS applications** - Apply specific throttlers to specific endpoints with zero runtime overhead.

[![npm version](https://badge.fury.io/js/nestjs-selective-throttler.svg)](https://badge.fury.io/js/nestjs-selective-throttler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **🎯 Selective Throttling**: Apply only specific throttlers to endpoints
- **🔧 Build-time Discovery**: Automatic throttler name detection at build time
- **⚡ Zero Runtime Overhead**: All processing done at build time
- **🛡️ Type Safe**: Full TypeScript support with generated declarations
- **🔌 Drop-in Replacement**: Works with existing `@nestjs/throttler` setup
- **📦 Minimal Dependencies**: Only peer dependency on `@nestjs/throttler`

## 📦 Installation

```bash
npm install nestjs-selective-throttler @nestjs/throttler
```

## 🎯 Problem Solved

With standard `@nestjs/throttler`, when you have multiple throttlers, **ALL of them apply to every endpoint**:

```typescript
// ❌ Problem: ALL throttlers apply to this endpoint
@Throttle({ sensitive: { limit: 1, ttl: 60000 } })
@Get('payment')
processPayment() {
  // This endpoint gets ALL 8 configured throttlers:
  // 'burst', 'sustained', 'sensitive', 'public', 'api-gateway', etc.
  // Even though you only specified 'sensitive'
}
```

**Workaround with @SkipThrottle** (verbose and unmaintainable):

```typescript
// ⚠️ Workaround: Manually skip unwanted throttlers
@Throttle({ sensitive: { limit: 1, ttl: 60000 } })
@SkipThrottle({ burst: true, sustained: true, sensitive: true /* ...5 more */ })
@Get('payment')
processPayment() {
  // Works but requires manually listing 6 other throttlers
  // Breaks when new throttlers are added to the module
}
```

**nestjs-selective-throttler** solves this cleanly:

```typescript
// ✅ Solution: Only specified throttlers apply
@SingleThrottle('sensitive', { limit: 1, ttl: 60000 })
@Get('payment')
processPayment() {
  // This endpoint gets ONLY 'sensitive' throttling
  // All other 7 throttlers are automatically skipped
}
```

## 🏗️ Setup

### 1. Configure ThrottlerModule (as usual)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60 * 1000, // 1 minute
        limit: 10, // 10 requests per minute
      },
      {
        name: 'sensitive',
        ttl: 60 * 1000, // 1 minute
        limit: 3, // 3 requests per minute
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 2. Add build scripts to package.json

```json
{
  "scripts": {
    "prebuild": "npm run generate",
    "generate": "node node_modules/nestjs-selective-throttler/scripts/generate-throttler-names.js",
    "generate:silent": "node node_modules/nestjs-selective-throttler/scripts/generate-throttler-names.js --silent",
    "build": "nest build"
  }
}
```

**Silent Mode**: Use `npm run generate:silent` to suppress informational output during builds. Important warnings (missing definitions, cross-module issues) are always shown, even in silent mode. This is useful for CI/CD pipelines where you want to see only critical issues.

### 3. Use Selective Throttling in Controllers

```typescript
// user.controller.ts
import { Controller, Get, Post } from '@nestjs/common';
import { SingleThrottle, SelectiveThrottle } from 'nestjs-selective-throttler/decorators';

@Controller('users')
export class UserController {
  
  // 🌐 Public endpoint - high rate limit
  @Get('public')
  @SingleThrottle('default') // Only 'default' throttler (10 req/min)
  getPublicUsers() {
    return { users: ['user1', 'user2'] };
  }

  // 🔒 Protected endpoint - multiple throttlers
  @Get('protected')
  @SelectiveThrottle({ 
    default: {}, // Use global config
    sensitive: {} // Use global config
  })
  getProtectedUsers() {
    return { users: ['admin1', 'admin2'] };
  }

  // 💰 Sensitive operation - custom override
  @Post('payment')
  @SingleThrottle('sensitive', { limit: 1, ttl: 30000 }) // Override: 1 req/30sec
  processPayment() {
    return { success: true };
  }
}
```

## 🎯 API Reference

### `@SingleThrottle(throttlerName, overrideConfig?)`

Applies **only one specific throttler** to an endpoint.

```typescript
// Use global configuration
@SingleThrottle('sensitive')

// Override global configuration
@SingleThrottle('sensitive', { limit: 1, ttl: 10000 })
```

### `@SelectiveThrottle(throttlerConfigs)`

Applies **multiple specific throttlers** to an endpoint.

```typescript
// Use global configurations
@SelectiveThrottle({ default: {}, sensitive: {} })

// Mix global and override configurations
@SelectiveThrottle({
  default: {}, // Use global config
  sensitive: { limit: 2, ttl: 30000 } // Override config
})
```

## 🔧 How It Works

### Build-time Discovery

1. **Build Script**: Scans all `.ts` files for `@SingleThrottle`, `@SelectiveThrottle`, and `@Throttle` decorators
2. **Code Generation**: Creates optimized decorators in `node_modules/nestjs-selective-throttler/.generated/`
3. **Selective Skip**: Generated decorators use build-time discovered names to skip unwanted throttlers

### Compatibility with @Throttle

You can continue using the official `@Throttle` decorator alongside selective throttlers:

```typescript
import { Throttle } from '@nestjs/throttler';
import { SingleThrottle } from 'nestjs-selective-throttler/decorators';

@Controller('api')
export class MixedController {
  
  // Official @Throttle - all throttlers apply
  @Get('legacy')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  legacyEndpoint() {}
  
  // Selective throttling - only specified throttlers apply
  @Get('selective')
  @SingleThrottle('default', { limit: 10, ttl: 60000 })
  selectiveEndpoint() {}
}
```

The build script automatically detects throttler names from both decorator types.

### Generated Files

```
node_modules/nestjs-selective-throttler/
└── .generated/
    ├── decorators.js        # Runtime decorators
    ├── decorators.d.ts      # TypeScript declarations
    ├── throttler-names.js   # Discovered names
    └── throttler-names.d.ts # TypeScript declarations
```

## 🎨 Real-world Example

```typescript
@Controller('api')
export class EcommerceController {
  
  // Product catalog - high volume
  @Get('products')
  @SingleThrottle('default') // 10 req/min
  getProducts() {}

  // User actions - burst protection
  @Post('cart/add')
  @SelectiveThrottle({ 
    'burst-protection': {},
    'default': {} 
  })
  addToCart() {}

  // Payment processing - strict limits
  @Post('payment')
  @SingleThrottle('sensitive', { limit: 1, ttl: 30000 }) // 1 req/30sec
  processPayment() {}
}
```

## 🧪 Examples

- **[Basic Usage](examples/basic-usage/)** - Complete single-module implementation with test endpoints
- **[Multi-Module Usage](examples/multi-module-usage/)** - Cross-module throttler issues and solutions

## 🔍 Debugging

To see which throttlers are discovered at build time:

```typescript
import { ALL_THROTTLER_NAMES } from 'nestjs-selective-throttler/throttler-names';

console.log('Discovered throttlers:', ALL_THROTTLER_NAMES);
// Output: ['default', 'sensitive', 'burst-protection', ...]
```

## 🔧 Advanced Features

### Multi-Module Support

The package automatically detects throttlers across multiple modules and validates cross-module usage:

```bash
npm run generate
```

**Output:**
```
❌ CROSS-MODULE THROTTLER ISSUES DETECTED:
📁 src/api/api.controller.ts
   Module: src/api/api.module.ts
   Available throttlers: [api-public, api-premium]
   Used throttlers: [api-public, auth-login]
   ❌ Unavailable: [auth-login]
```

### Supported ThrottlerModule Formats

- `ThrottlerModule.forRoot([...])` - Array format
- `ThrottlerModule.forRoot({ throttlers: [...] })` - Object format
- `ThrottlerModule.forRootAsync({ useFactory: ... })` - Async configuration
- Mixed configurations with additional options

## 🤝 Compatibility

- **NestJS**: ^10.0.0 || ^11.0.0
- **@nestjs/throttler**: ^6.0.0
- **TypeScript**: ^5.0.0
- **Node.js**: ^18.0.0

## 📄 License

MIT © [Orkun](https://github.com/orknist)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 🐛 Issues

Found a bug? Please [open an issue](https://github.com/orknist/nestjs-selective-throttler/issues).

---

**Made with ❤️ for the NestJS community**