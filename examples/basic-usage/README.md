# NestJS Selective Throttler - Basic Usage Example

This example demonstrates how to use `nestjs-selective-throttler` with various real-world scenarios.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the application
npm run start

# Or start in development mode
npm run start:dev
```

The application will start on `http://localhost:3000`.

## 🎯 Test Endpoints

### Basic Examples

#### 1. SingleThrottle - Global Config
```bash
curl http://localhost:3000/api/single-global
```
- **Throttler**: `public` (100 req/min)
- **Behavior**: Uses global configuration from ThrottlerModule

#### 2. SingleThrottle - Override Config
```bash
curl http://localhost:3000/api/single-override
```
- **Throttler**: `sensitive` (1 req/10sec - overridden)
- **Behavior**: Overrides global sensitive throttler config

#### 3. SelectiveThrottle - Single Global
```bash
curl http://localhost:3000/api/selective-single-global
```
- **Throttler**: `sustained` (10 req/min)
- **Behavior**: Uses only sustained throttler with global config

#### 4. SelectiveThrottle - Single Override
```bash
curl http://localhost:3000/api/selective-single-override
```
- **Throttler**: `burst` (2 req/5sec - overridden)
- **Behavior**: Uses only burst throttler with custom config

#### 5. SelectiveThrottle - Multiple Global
```bash
curl http://localhost:3000/api/selective-multi-global
```
- **Throttlers**: `burst` (1 req/3sec) + `sustained` (10 req/min)
- **Behavior**: Protected by both throttlers with global configs

#### 6. SelectiveThrottle - Multiple Mixed
```bash
curl http://localhost:3000/api/selective-multi-override
```
- **Throttlers**: `burst` (global) + `sensitive` (2 req/30sec - override)
- **Behavior**: Mixed configuration approach

### Real-world Examples

#### 7. API Gateway Pattern
```bash
curl http://localhost:3000/gateway/public
```
- **Throttler**: `api-gateway` (50 req/min)
- **Use Case**: Public API gateway endpoint with moderate limits

#### 8. User Actions with Burst Protection
```bash
curl http://localhost:3000/user/profile
```
- **Throttlers**: `user-actions` (5 req/10sec) + `burst` (2 req/5sec - override)
- **Use Case**: User profile with both sustained and burst protection

#### 9. Admin Panel Operations
```bash
curl http://localhost:3000/admin/dashboard
```
- **Throttlers**: `admin-panel` (20 req/min) + `sustained` (15 req/min - override)
- **Use Case**: Admin dashboard with dual protection layers

#### 10. Payment Processing (Strict)
```bash
curl http://localhost:3000/payment/process
```
- **Throttler**: `payment-processing` (1 req/30sec - override)
- **Use Case**: Strict payment processing with custom override

### Problem vs Solution Comparison

#### 11. ❌ Problem: @Throttle (ALL throttlers apply)
```bash
curl http://localhost:3000/legacy/problem
```
- **Throttlers**: ALL 8 throttlers apply! (2 override + 6 global)
- **Issue**: Gets throttled by ALL configured throttlers, not just the 2 specified

#### 12. ⚠️ Workaround: @Throttle + @SkipThrottle (verbose)
```bash
curl http://localhost:3000/legacy/workaround
```
- **Throttlers**: Only `legacy-api` + `rate-limiter` (verbose solution)
- **Issue**: Requires manually skipping 6 other throttlers - not maintainable!

#### 13. ✅ Solution: SelectiveThrottle (clean)
```bash
curl http://localhost:3000/legacy/solution
```
- **Throttlers**: Only `legacy-api` + `rate-limiter` (clean solution)
- **Benefit**: Automatically skips other 6 throttlers - maintainable and clear!

## 🔧 Throttler Configuration

The application is configured with the following throttlers in `src/app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  // Basic throttlers
  { name: 'burst', ttl: 3000, limit: 1 },           // 1 req/3sec
  { name: 'sustained', ttl: 60000, limit: 10 },     // 10 req/min
  { name: 'sensitive', ttl: 60000, limit: 3 },      // 3 req/min
  { name: 'public', ttl: 60000, limit: 100 },       // 100 req/min
  
  // Real-world named throttlers
  { name: 'api-gateway', ttl: 60000, limit: 50 },        // 50 req/min
  { name: 'user-actions', ttl: 10000, limit: 5 },        // 5 req/10sec
  { name: 'admin-panel', ttl: 60000, limit: 20 },        // 20 req/min
  { name: 'payment-processing', ttl: 60000, limit: 2 },  // 2 req/min
  
  // Legacy throttlers (for comparison examples)
  { name: 'legacy-api', ttl: 60000, limit: 5 },         // 5 req/min
  { name: 'rate-limiter', ttl: 30000, limit: 10 },      // 10 req/30sec
])
```

## 🎯 Build-time Discovery

The application automatically discovers all throttler names at build time:

```
Build-time discovered throttler names: [
  'admin-panel',
  'api-gateway', 
  'burst',
  'default',
  'payment-processing',
  'public',
  'sensitive',
  'sustained',
  'user-actions'
]
```

## 🧪 Testing Throttling

### Test Rate Limiting

```bash
# Test burst protection (1 req/3sec)
for i in {1..3}; do curl http://localhost:3000/api/single-global; echo; done

# Test sustained protection (10 req/min)
for i in {1..12}; do curl http://localhost:3000/api/selective-single-global; echo; sleep 1; done

# Test payment processing (strict - 1 req/30sec)
curl http://localhost:3000/payment/process
curl http://localhost:3000/payment/process  # Should be throttled
```

### Expected Throttling Response

When throttled, you'll receive a `429 Too Many Requests` response:

```json
{
  \"statusCode\": 429,
  \"message\": \"ThrottlerException: Too Many Requests\"
}
```

## 🎨 Key Features Demonstrated

### ✅ Selective Throttling
- **SingleThrottle**: Apply only one specific throttler
- **SelectiveThrottle**: Apply multiple specific throttlers
- **Skip Logic**: Other throttlers are automatically skipped
- **@Throttle Compatibility**: Works alongside official `@Throttle` decorator

### ✅ Configuration Flexibility
- **Global Config**: Use ThrottlerModule configuration
- **Override Config**: Custom limits per endpoint
- **Mixed Approach**: Combine global and override configs

### ✅ Real-world Patterns
- **API Gateway**: Moderate limits for public APIs
- **User Actions**: Burst + sustained protection
- **Admin Operations**: Dual layer protection
- **Payment Processing**: Strict security limits

### ✅ Build-time Discovery
- **Zero Runtime Overhead**: All processing at build time
- **Type Safety**: Generated readonly arrays
- **Automatic Detection**: Scans decorators for throttler names

## 📊 Performance Benefits

- **No setTimeout**: Synchronous operation
- **No Reflection**: Static generated file
- **No DI Issues**: Build-time resolution
- **Type Safe**: Full TypeScript support

## 🔍 Debugging

To see which throttlers are discovered at build time, check the console output when the application starts:

```
Build-time discovered throttler names: [...]
```

This confirms that the build-time code generation is working correctly.
"