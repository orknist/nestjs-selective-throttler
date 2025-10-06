# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-06

### Added
- Silent mode support for code generation script (`--silent` flag)
- `generate:silent` npm script for CI/CD pipelines

### Changed
- Code generation script now shows warnings (missing definitions, cross-module issues) even in silent mode
- Generated file list in completion message is now sorted alphabetically
- Reduced console output verbosity - informational messages hidden in silent mode

### Improved
- Better CI/CD integration with silent mode that only shows critical issues
- More consistent output formatting in code generation completion message

## [1.0.0] - 2025-10-03

### Added
- Initial release of `nestjs-selective-throttler`
- `SelectiveThrottlerGuard` - Main guard implementation for selective throttling
- `SelectiveThrottlerException` - Custom exception for rate limit violations
- `ConfigResolverUtil` - Utility for resolving throttler configurations
- `KeyGeneratorUtil` - Utility for generating storage keys and extracting identifiers
- Support for selective throttler application (only applies named throttlers from route decorators)
- Support for configuration overrides at route level
- Support for boolean `true` values to use global configuration
- Support for partial configuration overrides (limit only, ttl only)
- Comprehensive TypeScript support with full type definitions
- Support for both CommonJS and ESM builds
- Integration with existing `@nestjs/throttler` storage backends (memory, Redis)
- Detailed documentation and examples
- Migration guide from official `@nestjs/throttler`

### Features
- **True Selective Throttling**: Only applies throttlers explicitly declared in `@Throttle` decorator
- **Configuration Flexibility**: Supports global config, route overrides, and partial overrides
- **Storage Compatibility**: Works with existing ThrottlerStorage implementations
- **Error Handling**: Graceful error handling with detailed logging
- **Performance Optimized**: Minimal overhead for routes without throttling
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Backward Compatible**: Drop-in replacement for official ThrottlerGuard

### Documentation
- Comprehensive README with problem explanation and usage examples
- API documentation with TypeScript definitions
- Migration guide from `@nestjs/throttler`
- Performance considerations and best practices
- Troubleshooting guide with common issues
- Example NestJS application demonstrating usage patterns

### Technical Details
- Supports NestJS 11.x and @nestjs/throttler 6.x
- Node.js 18+ required
- Dual package (CommonJS + ESM) for maximum compatibility
- Zero additional dependencies beyond peer dependencies
- Comprehensive test suite with unit, integration, and E2E tests
- Performance benchmarks included

### Breaking Changes
None - this is the initial release.

### Migration from @nestjs/throttler
To migrate from the official `@nestjs/throttler`:

1. Install `nestjs-selective-throttler`
2. Replace `ThrottlerGuard` with `SelectiveThrottlerGuard` in your `APP_GUARD` provider
3. Existing `@Throttle` decorators will work with selective behavior
4. No changes needed to `ThrottlerModule.forRoot()` configuration

See the [Migration Guide](docs/migration-guide.md) for detailed instructions.