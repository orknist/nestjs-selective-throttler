# Multi-Module Throttler Usage Example

This example demonstrates the **cross-module throttler issues** that can occur when using `nestjs-selective-throttler` in a multi-module NestJS application.

## Project Structure

```
src/
├── app.module.ts          # Main module (imports feature modules)
├── app.controller.ts      # Root controller (demonstrates the problem)
├── auth/
│   ├── auth.module.ts     # Defines: auth-login, auth-register, auth-password-reset
│   ├── auth.controller.ts # Uses auth throttlers + tries to use api/payment throttlers
│   └── auth.service.ts
├── api/
│   ├── api.module.ts      # Defines: api-public, api-premium, api-internal, api-rate-limit
│   ├── api.controller.ts  # Uses api throttlers + tries to use auth/payment throttlers
│   └── api.service.ts
└── payment/
    ├── payment.module.ts     # Defines: payment-process, payment-verify, payment-refund, payment-webhook
    ├── payment.controller.ts # Uses payment throttlers + tries to use auth/api throttlers
    └── payment.service.ts
```

## The Problem

Each module defines its own throttlers using `ThrottlerModule.forRoot()`:

- **AuthModule**: Only defines `auth-*` throttlers
- **ApiModule**: Only defines `api-*` throttlers  
- **PaymentModule**: Only defines `payment-*` throttlers

However, controllers try to use throttlers from other modules:

```typescript
// ❌ PROBLEM: In AuthController
@SingleThrottle('api-public')  // api-public is NOT defined in AuthModule!
getProfile() { ... }

// ❌ PROBLEM: In ApiController  
@SingleThrottle('auth-login')  // auth-login is NOT defined in ApiModule!
getUsers() { ... }

// ❌ PROBLEM: In PaymentController
@SingleThrottle('api-internal') // api-internal is NOT defined in PaymentModule!
getPaymentStatus() { ... }
```

## Code Generation Analysis

Run the throttler analysis to see the issues:

```bash
npm run generate
```

**Expected Output:**
```
❌ CROSS-MODULE THROTTLER ISSUES DETECTED:
📁 src/api/api.controller.ts
   Module: src/api/api.module.ts
   Available throttlers: [api-public, api-premium, api-internal, api-rate-limit]
   Used throttlers: [api-public, api-premium, auth-login, payment-process]
   ❌ Unavailable: [auth-login, payment-process]
   💡 These throttlers will not work properly!
```

This shows:

- **11 throttlers discovered** across all modules
- **Cross-module usage detected** (throttlers used in wrong modules)
- **Multi-module setup warning** with detailed breakdown
- **Specific file-level issues** with solutions

## Testing the Issues

1. **Start the application:**
   ```bash
   npm run start:dev
   ```

2. **Test working endpoints** (throttlers defined in same module):
   ```bash
   # ✅ Works - auth-login is defined in AuthModule
   curl http://localhost:3000/auth/login
   
   # ✅ Works - api-public is defined in ApiModule
   curl http://localhost:3000/api/public
   
   # ✅ Works - payment-process is defined in PaymentModule
   curl http://localhost:3000/payment/process
   ```

3. **Test problematic endpoints** (cross-module throttler usage):
   ```bash
   # ❌ Problem - api-public not available in AuthModule
   curl http://localhost:3000/auth/profile
   
   # ❌ Problem - auth-login not available in ApiModule
   curl http://localhost:3000/api/users
   
   # ❌ Problem - api-internal not available in PaymentModule
   curl http://localhost:3000/payment/status
   ```

## Solutions

### Solution 1: Global Throttler Definition (Recommended)

Define all throttlers in the main `AppModule`:

```typescript
// app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot([
      // Auth throttlers
      { name: 'auth-login', limit: 5, ttl: 60000 },
      { name: 'auth-register', limit: 3, ttl: 60000 },
      
      // API throttlers
      { name: 'api-public', limit: 100, ttl: 60000 },
      { name: 'api-premium', limit: 500, ttl: 60000 },
      
      // Payment throttlers
      { name: 'payment-process', limit: 1, ttl: 60000 },
      { name: 'payment-verify', limit: 5, ttl: 60000 },
    ]),
    
    // Feature modules (without their own ThrottlerModule.forRoot)
    AuthModule,
    ApiModule, 
    PaymentModule,
  ],
  // ...
})
export class AppModule {}
```

### Solution 2: Duplicate Throttler Definitions

Define required throttlers in each module that needs them:

```typescript
// auth.module.ts
ThrottlerModule.forRoot([
  // Own throttlers
  { name: 'auth-login', limit: 5, ttl: 60000 },
  
  // Needed throttlers from other modules
  { name: 'api-public', limit: 100, ttl: 60000 },
  { name: 'payment-verify', limit: 5, ttl: 60000 },
])
```

### Solution 3: Module-Specific Usage

Use only throttlers available in each module:

```typescript
// auth.controller.ts - Only use AuthModule throttlers
@SingleThrottle('auth-login')     // ✅ Available
@SingleThrottle('auth-register')  // ✅ Available

// api.controller.ts - Only use ApiModule throttlers  
@SingleThrottle('api-public')     // ✅ Available
@SingleThrottle('api-premium')    // ✅ Available

// payment.controller.ts - Only use PaymentModule throttlers
@SingleThrottle('payment-process') // ✅ Available
@SingleThrottle('payment-verify')  // ✅ Available
```

## Key Takeaways

1. **Build-time generation** finds all throttler names but doesn't validate cross-module availability
2. **Multi-module setups** require careful throttler management
3. **Global throttler definition** is the most maintainable solution
4. **Cross-module usage** will fail silently - throttlers just won't work

## Analysis Output

The generation script provides detailed analysis:

- **File-by-file breakdown** of decorators and module definitions
- **Cross-module usage warnings** 
- **Multi-module setup detection**
- **Recommendations** for fixing issues

This helps identify and resolve throttler configuration problems before they cause runtime issues.