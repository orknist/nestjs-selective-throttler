/**
 * NestJS Selective Throttler
 *
 * This package provides build-time code generation for selective throttling.
 * The actual decorators are generated in consumer projects at:
 * node_modules/.nestjs-selective-throttler/decorators.js
 *
 * Usage:
 * 1. Install: npm install nestjs-selective-throttler
 * 2. Add to package.json: "prebuild": "npm run generate"
 * 3. Add to package.json: "generate": "node node_modules/nestjs-selective-throttler/scripts/generate-throttler-names.js"
 * 4. Import: const { SingleThrottle } = require('.nestjs-selective-throttler/decorators');
 */

// This package exports no runtime code - everything is generated at build time
export const PACKAGE_INFO = {
  name: 'nestjs-selective-throttler',
  version: '1.0.0',
  description: 'Build-time selective throttling for NestJS',
};
