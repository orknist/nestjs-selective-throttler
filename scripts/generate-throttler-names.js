#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Build-time code generation script
 * Scans all TypeScript files for throttler decorators and generates throttler names + decorators
 */

function scanDirectory(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      scanDirectory(fullPath, files);
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractThrottlerNames(content) {
  const throttlerNames = new Set();

  // Pattern 1: @SingleThrottle('name') - Extract string literal
  const singleThrottlePattern = /@SingleThrottle\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = singleThrottlePattern.exec(content)) !== null) {
    throttlerNames.add(match[1]);
  }

  // Pattern 2: @SelectiveThrottle({ name1: {}, name2: {} }) - Extract object keys only
  const selectiveThrottlePattern = /@SelectiveThrottle\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  while ((match = selectiveThrottlePattern.exec(content)) !== null) {
    const objectContent = match[1];

    // Split by lines and look for top-level keys
    const lines = objectContent.split('\n');
    for (const line of lines) {
      // Look for top-level keys (at the beginning of line or after whitespace)
      const keyMatch = line.match(/^\s*(?:['"`]([^'"`\s]+)['"`]|([a-zA-Z_$][a-zA-Z0-9_$-]*))\s*:/);
      if (keyMatch) {
        const keyName = keyMatch[1] || keyMatch[2];
        // Filter out common config properties
        if (!['limit', 'ttl', 'blockDuration', 'getTracker', 'generateKey'].includes(keyName)) {
          throttlerNames.add(keyName);
        }
      }
    }
  }

  // Pattern 3: @Throttle({ name: { limit: 10, ttl: 60000 } }) - Official @nestjs/throttler
  const officialThrottlePattern = /@Throttle\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  while ((match = officialThrottlePattern.exec(content)) !== null) {
    const objectContent = match[1];

    // Split by lines and look for top-level keys
    const lines = objectContent.split('\n');
    for (const line of lines) {
      // Look for top-level keys (throttler names)
      const keyMatch = line.match(/^\s*(?:['"`]([^'"`\s]+)['"`]|([a-zA-Z_$][a-zA-Z0-9_$-]*))\s*:/);
      if (keyMatch) {
        const keyName = keyMatch[1] || keyMatch[2];
        // Filter out common config properties
        if (!['limit', 'ttl', 'blockDuration', 'getTracker', 'generateKey'].includes(keyName)) {
          throttlerNames.add(keyName);
        }
      }
    }
  }

  // Pattern 4: @Throttle([{ name: 'throttler-name', limit: 10, ttl: 60000 }]) - Array format
  const throttleArrayPattern = /@Throttle\s*\(\s*\[([\s\S]*?)\]\s*\)/g;
  while ((match = throttleArrayPattern.exec(content)) !== null) {
    const arrayContent = match[1];

    // Look for name properties in array objects
    const namePattern = /name\s*:\s*['"`]([^'"`]+)['"`]/g;
    let nameMatch;
    while ((nameMatch = namePattern.exec(arrayContent)) !== null) {
      throttlerNames.add(nameMatch[1]);
    }
  }

  return Array.from(throttlerNames);
}

function extractThrottlerModuleNames(content) {
  const throttlerNames = new Set();

  // Pattern 1: ThrottlerModule.forRoot([{ name: 'throttler-name', ... }])
  const forRootArrayPattern = /ThrottlerModule\.forRoot\s*\(\s*\[([\s\S]*?)\]\s*\)/g;
  let match;

  while ((match = forRootArrayPattern.exec(content)) !== null) {
    const arrayContent = match[1];
    extractNamesFromThrottlerArray(arrayContent, throttlerNames);
  }

  // Pattern 2: ThrottlerModule.forRoot({ throttlers: [{ name: 'throttler-name', ... }] })
  const forRootObjectPattern = /ThrottlerModule\.forRoot\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  while ((match = forRootObjectPattern.exec(content)) !== null) {
    const objectContent = match[1];

    // Look for throttlers property
    const throttlersPattern = /throttlers\s*:\s*\[([\s\S]*?)\]/g;
    let throttlersMatch;
    while ((throttlersMatch = throttlersPattern.exec(objectContent)) !== null) {
      const throttlersArray = throttlersMatch[1];
      extractNamesFromThrottlerArray(throttlersArray, throttlerNames);
    }

    // Also check for single throttler object format
    const singleNamePattern = /name\s*:\s*['"`]([^'"`]+)['"`]/g;
    let nameMatch;
    while ((nameMatch = singleNamePattern.exec(objectContent)) !== null) {
      // Make sure this is not inside a throttlers array (already handled above)
      if (!objectContent.includes('throttlers')) {
        throttlerNames.add(nameMatch[1]);
      }
    }
  }

  // Pattern 3: ThrottlerModule.forRootAsync({ useFactory: () => ({ throttlers: [...] }) })
  const forRootAsyncPattern = /ThrottlerModule\.forRootAsync\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  while ((match = forRootAsyncPattern.exec(content)) !== null) {
    const asyncContent = match[1];

    // Look for throttlers in useFactory, useClass, etc.
    const throttlersInAsyncPattern = /throttlers\s*:\s*\[([\s\S]*?)\]/g;
    let asyncThrottlersMatch;
    while ((asyncThrottlersMatch = throttlersInAsyncPattern.exec(asyncContent)) !== null) {
      const throttlersArray = asyncThrottlersMatch[1];
      extractNamesFromThrottlerArray(throttlersArray, throttlerNames);
    }

    // Also check for single throttler in async
    const asyncSingleNamePattern = /name\s*:\s*['"`]([^'"`]+)['"`]/g;
    let asyncNameMatch;
    while ((asyncNameMatch = asyncSingleNamePattern.exec(asyncContent)) !== null) {
      throttlerNames.add(asyncNameMatch[1]);
    }
  }

  return Array.from(throttlerNames);
}

function extractNamesFromThrottlerArray(arrayContent, throttlerNames) {
  // Look for name properties in throttler config objects
  const namePattern = /name\s*:\s*['"`]([^'"`]+)['"`]/g;
  let nameMatch;
  while ((nameMatch = namePattern.exec(arrayContent)) !== null) {
    throttlerNames.add(nameMatch[1]);
  }
}

function generateThrottlerNamesFile(throttlerNames) {
  return `// This file is auto-generated by scripts/generate-throttler-names.js
// Do not edit manually - it will be overwritten on build

/**
 * All throttler names discovered at build-time
 * Generated from @SingleThrottle and @SelectiveThrottle decorators
 */
const ALL_THROTTLER_NAMES = ${JSON.stringify(throttlerNames, null, 2)};

/**
 * Check if a throttler name is known
 */
function isKnownThrottler(name) {
  return ALL_THROTTLER_NAMES.includes(name);
}

/**
 * Get all throttler names except the specified one
 */
function getOtherThrottlers(excludeName) {
  return ALL_THROTTLER_NAMES.filter(name => name !== excludeName);
}

/**
 * Get all throttler names except the specified ones
 */
function getOtherThrottlersExcept(excludeNames) {
  return ALL_THROTTLER_NAMES.filter(name => !excludeNames.includes(name));
}

// CommonJS exports
module.exports = {
  ALL_THROTTLER_NAMES,
  isKnownThrottler,
  getOtherThrottlers,
  getOtherThrottlersExcept
};
`;
}

function generateDecoratorsDeclaration() {
  return `// This file is auto-generated by scripts/generate-throttler-names.js
// Do not edit manually - it will be overwritten on build

interface ThrottlerOptions {
  limit?: number | (() => number);
  ttl?: number | (() => number);
  blockDuration?: number | (() => number);
  getTracker?: Function;
  generateKey?: Function;
}

export declare const SingleThrottle: (
  throttlerName: string, 
  overrideConfig?: ThrottlerOptions
) => MethodDecorator & ClassDecorator;

export declare const SelectiveThrottle: (
  throttlerConfigs: Record<string, ThrottlerOptions>
) => MethodDecorator & ClassDecorator;

export declare const ALL_THROTTLER_NAMES: readonly string[];
`;
}

function generateThrottlerNamesDeclaration() {
  return `// This file is auto-generated by scripts/generate-throttler-names.js
// Do not edit manually - it will be overwritten on build

export declare const ALL_THROTTLER_NAMES: readonly string[];
export declare function isKnownThrottler(name: string): boolean;
export declare function getOtherThrottlers(excludeName: string): string[];
export declare function getOtherThrottlersExcept(excludeNames: string[]): string[];
`;
}

function generateDecoratorsFile(throttlerNames) {
  return `// This file is auto-generated by scripts/generate-throttler-names.js
// Do not edit manually - it will be overwritten on build

require('reflect-metadata');

// Throttler constants from @nestjs/throttler
const THROTTLER_TTL = 'THROTTLER:TTL';
const THROTTLER_LIMIT = 'THROTTLER:LIMIT';
const THROTTLER_SKIP = 'THROTTLER:SKIP';
const THROTTLER_BLOCK_DURATION = 'THROTTLER:BLOCK_DURATION';
const THROTTLER_TRACKER = 'THROTTLER:TRACKER';
const THROTTLER_KEY_GENERATOR = 'THROTTLER:KEY_GENERATOR';

// Build-time discovered throttler names (optimized static array)
const ALL_THROTTLER_NAMES = ${JSON.stringify(throttlerNames, null, 2)};

/**
 * Get all throttler names except the specified one (build-time optimized)
 */
function getOtherThrottlers(excludeName) {
  return ALL_THROTTLER_NAMES.filter(name => name !== excludeName);
}

/**
 * Get all throttler names except the specified ones (build-time optimized)
 */
function getOtherThrottlersExcept(excludeNames) {
  return ALL_THROTTLER_NAMES.filter(name => !excludeNames.includes(name));
}

/**
 * SingleThrottle decorator - Uses only one named throttler and skips all others.
 * Build-time optimized with static throttler name discovery.
 *
 * @param throttlerName - Name of the throttler to use
 * @param overrideConfig - Optional configuration to override global settings
 *
 * @example
 * // Use global 'sensitive' throttler configuration
 * @SingleThrottle('sensitive')
 *
 * @example
 * // Override 'sensitive' throttler with custom config
 * @SingleThrottle('sensitive', { limit: 3, ttl: 10000 })
 */
const SingleThrottle = (throttlerName, overrideConfig) => {
  return (target, propertyKey, descriptor) => {
    const reflectionTarget = descriptor?.value ?? target;

    // Set throttler metadata for the specified throttler
    if (overrideConfig) {
      // Use override configuration
      Reflect.defineMetadata(THROTTLER_TTL + throttlerName, overrideConfig.ttl, reflectionTarget);
      Reflect.defineMetadata(THROTTLER_LIMIT + throttlerName, overrideConfig.limit, reflectionTarget);
      Reflect.defineMetadata(THROTTLER_BLOCK_DURATION + throttlerName, overrideConfig.blockDuration, reflectionTarget);
      Reflect.defineMetadata(THROTTLER_TRACKER + throttlerName, overrideConfig.getTracker, reflectionTarget);
      Reflect.defineMetadata(THROTTLER_KEY_GENERATOR + throttlerName, overrideConfig.generateKey, reflectionTarget);
    } else {
      // Use global configuration - set undefined to use global values
      Reflect.defineMetadata(THROTTLER_TTL + throttlerName, undefined, reflectionTarget);
      Reflect.defineMetadata(THROTTLER_LIMIT + throttlerName, undefined, reflectionTarget);
    }

    // Skip all other throttlers (build-time optimized - no runtime discovery)
    const otherThrottlers = getOtherThrottlers(throttlerName);
    for (const name of otherThrottlers) {
      Reflect.defineMetadata(THROTTLER_SKIP + name, true, reflectionTarget);
    }

    if (descriptor) {
      return descriptor;
    }
    return target;
  };
};

/**
 * SelectiveThrottle decorator - Uses multiple named throttlers and skips all others.
 * Build-time optimized with static throttler name discovery.
 *
 * @param throttlerConfigs - Object with throttler names as keys and optional configs as values
 *
 * @example
 * // Use global configs for both throttlers
 * @SelectiveThrottle({ default: {}, sensitive: {} })
 *
 * @example
 * // Mix global and override configs
 * @SelectiveThrottle({
 *   default: {},
 *   sensitive: { limit: 1, ttl: 60000 }
 * })
 */
const SelectiveThrottle = (throttlerConfigs) => {
  const selectedThrottlers = Object.keys(throttlerConfigs);

  return (target, propertyKey, descriptor) => {
    const reflectionTarget = descriptor?.value ?? target;

    // Set throttler metadata for each selected throttler
    for (const [throttlerName, config] of Object.entries(throttlerConfigs)) {
      const hasConfig =
        config &&
        (config.limit !== undefined ||
          config.ttl !== undefined ||
          config.blockDuration !== undefined ||
          config.getTracker !== undefined ||
          config.generateKey !== undefined);

      if (hasConfig) {
        // Use provided configuration
        Reflect.defineMetadata(THROTTLER_TTL + throttlerName, config.ttl, reflectionTarget);
        Reflect.defineMetadata(THROTTLER_LIMIT + throttlerName, config.limit, reflectionTarget);
        Reflect.defineMetadata(THROTTLER_BLOCK_DURATION + throttlerName, config.blockDuration, reflectionTarget);
        Reflect.defineMetadata(THROTTLER_TRACKER + throttlerName, config.getTracker, reflectionTarget);
        Reflect.defineMetadata(THROTTLER_KEY_GENERATOR + throttlerName, config.generateKey, reflectionTarget);
      } else {
        // Use global configuration - set undefined to use global values
        Reflect.defineMetadata(THROTTLER_TTL + throttlerName, undefined, reflectionTarget);
        Reflect.defineMetadata(THROTTLER_LIMIT + throttlerName, undefined, reflectionTarget);
      }
    }

    // Skip all other throttlers (build-time optimized - no runtime discovery)
    const otherThrottlers = getOtherThrottlersExcept(selectedThrottlers);
    for (const throttlerName of otherThrottlers) {
      Reflect.defineMetadata(THROTTLER_SKIP + throttlerName, true, reflectionTarget);
    }

    if (descriptor) {
      return descriptor;
    }
    return target;
  };
};

// CommonJS exports
module.exports = {
  SingleThrottle,
  SelectiveThrottle,
  ALL_THROTTLER_NAMES
};
`;
}

function main() {
  // Check for --silent flag
  const isSilent = process.argv.includes('--silent');

  if (!isSilent) {
    console.log('🔍 Scanning for throttler decorators and module definitions...');
  }

  // Scan current working directory
  const files = scanDirectory(process.cwd());
  const allThrottlerNames = new Set();

  // Detailed analysis data
  const fileAnalysis = [];
  const allDecoratorNames = new Set();
  const allModuleNames = new Set();
  const moduleDefinitions = new Map(); // file -> throttler names

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);

      // Extract throttler names from decorators
      const decoratorNames = extractThrottlerNames(content);
      decoratorNames.forEach(name => {
        allThrottlerNames.add(name);
        allDecoratorNames.add(name);
      });

      // Extract throttler names from ThrottlerModule.forRoot() definitions
      const moduleNames = extractThrottlerModuleNames(content);
      moduleNames.forEach(name => {
        allThrottlerNames.add(name);
        allModuleNames.add(name);
      });

      // Store module definitions for cross-reference
      if (moduleNames.length > 0) {
        moduleDefinitions.set(relativePath, moduleNames);
      }

      if (decoratorNames.length > 0 || moduleNames.length > 0) {
        fileAnalysis.push({
          file: relativePath,
          decorators: decoratorNames,
          modules: moduleNames
        });
      }
    } catch (error) {
      if (!isSilent) {
        console.warn(`  ⚠️  Could not read ${file}: ${error.message}`);
      }
    }
  }

  // Display detailed file analysis
  if (!isSilent) {
    console.log();
    console.log('📋 DETAILED ANALYSIS BY FILE:');
    console.log('═'.repeat(80));

    fileAnalysis.forEach(analysis => {
      console.log(`📁 ${analysis.file}`);

      if (analysis.decorators.length > 0) {
        console.log(`   🎯 Decorators: ${analysis.decorators.sort().join(', ')}`);
      }

      if (analysis.modules.length > 0) {
        console.log(`   ⚙️  Modules:    ${analysis.modules.sort().join(', ')}`);
      }

      console.log();
    });
  }

  const throttlerNamesArray = Array.from(allThrottlerNames).sort();
  const decoratorOnlyNames = Array.from(allDecoratorNames).filter(name => !allModuleNames.has(name));
  const moduleOnlyNames = Array.from(allModuleNames).filter(name => !allDecoratorNames.has(name));
  const usedAndDefinedNames = Array.from(allDecoratorNames).filter(name => allModuleNames.has(name));

  // Summary report
  if (!isSilent) {
    console.log('📊 THROTTLER ANALYSIS SUMMARY:');
    console.log('═'.repeat(80));
    console.log(`✅ Total discovered throttlers: ${throttlerNamesArray.length}`);
    console.log(`🎯 Used in decorators: ${allDecoratorNames.size}`);
    console.log(`⚙️  Defined in modules: ${allModuleNames.size}`);
    console.log(`✅ Properly used & defined: ${usedAndDefinedNames.length}`);
    console.log();

    if (usedAndDefinedNames.length > 0) {
      console.log('✅ PROPERLY CONFIGURED THROTTLERS:');
      console.log(`   ${usedAndDefinedNames.sort().join(', ')}`);
      console.log('   These throttlers are correctly defined in modules and used in decorators.');
      console.log();
    }
  }

  // Always show warnings (even in silent mode) - these are important issues
  if (decoratorOnlyNames.length > 0) {
    console.log('⚠️  MISSING MODULE DEFINITIONS:');
    console.log(`   ${decoratorOnlyNames.sort().join(', ')}`);
    console.log('   These throttlers are used in decorators but not defined in any ThrottlerModule.forRoot().');
    console.log('   Add them to your module configuration or they may not work properly.');
    console.log();
  }

  if (moduleOnlyNames.length > 0) {
    console.log('💡 UNUSED MODULE DEFINITIONS:');
    console.log(`   ${moduleOnlyNames.sort().join(', ')}`);
    console.log('   These throttlers are defined in modules but never used in decorators.');
    console.log('   They will be automatically skipped by selective decorators (this is expected).');
    console.log();
  }

  // Advanced cross-module validation
  const crossModuleIssues = [];
  const moduleFiles = fileAnalysis.filter(f => f.modules.length > 0);

  // Create module mapping: determine which module each file belongs to
  const fileToModule = new Map();

  for (const analysis of fileAnalysis) {
    if (analysis.modules.length > 0) {
      // This file defines a module
      const moduleDir = path.dirname(analysis.file);
      fileToModule.set(analysis.file, {
        name: analysis.file,
        throttlers: analysis.modules,
        isModuleFile: true
      });

      // Also map other files in the same directory to this module
      for (const otherAnalysis of fileAnalysis) {
        const otherDir = path.dirname(otherAnalysis.file);
        if (otherDir === moduleDir && otherAnalysis.file !== analysis.file) {
          fileToModule.set(otherAnalysis.file, {
            name: analysis.file,
            throttlers: analysis.modules,
            isModuleFile: false
          });
        }
      }
    }
  }

  // Check for cross-module throttler usage
  for (const analysis of fileAnalysis) {
    if (analysis.decorators.length > 0) {
      const moduleInfo = fileToModule.get(analysis.file);

      if (moduleInfo) {
        // File belongs to a specific module, check if all decorators are available
        const unavailableThrottlers = analysis.decorators.filter(
          throttler => !moduleInfo.throttlers.includes(throttler)
        );

        if (unavailableThrottlers.length > 0) {
          crossModuleIssues.push({
            file: analysis.file,
            module: moduleInfo.name,
            availableThrottlers: moduleInfo.throttlers,
            usedThrottlers: analysis.decorators,
            unavailableThrottlers
          });
        }
      } else {
        // File doesn't belong to any specific module (like app.controller.ts)
        // Check if throttlers are available in any module
        const unavailableThrottlers = analysis.decorators.filter(
          throttler => !allModuleNames.has(throttler)
        );

        if (unavailableThrottlers.length > 0) {
          crossModuleIssues.push({
            file: analysis.file,
            module: 'No specific module (global)',
            availableThrottlers: [],
            usedThrottlers: analysis.decorators,
            unavailableThrottlers
          });
        }
      }
    }
  }

  // Multi-module analysis
  if (!isSilent && moduleFiles.length > 1) {
    console.log('🔄 MULTI-MODULE SETUP DETECTED:');
    console.log('   Multiple files define throttler modules. Ensure all required throttlers');
    console.log('   are available in the modules where they will be used.');
    console.log();

    moduleFiles.forEach(moduleFile => {
      console.log(`   📁 ${moduleFile.file}: [${moduleFile.modules.sort().join(', ')}]`);
    });
    console.log();
  }

  // Report cross-module issues (always show critical errors)
  if (crossModuleIssues.length > 0) {
    console.log('❌ CROSS-MODULE THROTTLER ISSUES DETECTED:');
    console.log('═'.repeat(80));

    crossModuleIssues.forEach(issue => {
      console.log(`📁 ${issue.file}`);
      console.log(`   Module: ${issue.module}`);
      console.log(`   Available throttlers: [${issue.availableThrottlers.sort().join(', ') || 'none'}]`);
      console.log(`   Used throttlers: [${issue.usedThrottlers.sort().join(', ')}]`);
      console.log(`   ❌ Unavailable: [${issue.unavailableThrottlers.sort().join(', ')}]`);
      console.log(`   💡 These throttlers will not work properly!`);
      console.log();
    });

    console.log('🔧 SOLUTIONS:');
    console.log('   1. Move all throttler definitions to AppModule (recommended)');
    console.log('   2. Add missing throttlers to the respective modules');
    console.log('   3. Use only throttlers available in each module');
    console.log();
  }

  // Generate files in the actual package directory (not symlink target)
  const packagePath = path.join(process.cwd(), 'node_modules', 'nestjs-selective-throttler');
  const outputDir = path.join(packagePath, '.generated');

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate throttler names file (as JavaScript for runtime compatibility)
  const throttlerNamesContent = generateThrottlerNamesFile(throttlerNamesArray);
  const throttlerNamesPath = path.join(outputDir, 'throttler-names.js');
  fs.writeFileSync(throttlerNamesPath, throttlerNamesContent);

  // Generate decorators file (as JavaScript for runtime compatibility)
  const decoratorsContent = generateDecoratorsFile(throttlerNamesArray);
  const decoratorsPath = path.join(outputDir, 'decorators.js');
  fs.writeFileSync(decoratorsPath, decoratorsContent);

  // Generate TypeScript declaration files
  const decoratorsDtsContent = generateDecoratorsDeclaration();
  const decoratorsDtsPath = path.join(outputDir, 'decorators.d.ts');
  fs.writeFileSync(decoratorsDtsPath, decoratorsDtsContent);

  const throttlerNamesDtsContent = generateThrottlerNamesDeclaration();
  const throttlerNamesDtsPath = path.join(outputDir, 'throttler-names.d.ts');
  fs.writeFileSync(throttlerNamesDtsPath, throttlerNamesDtsContent);

  if (!isSilent) {
    // Sort generated file paths for consistent output
    const generatedFiles = [
      path.relative(process.cwd(), decoratorsPath),
      path.relative(process.cwd(), decoratorsDtsPath),
      path.relative(process.cwd(), throttlerNamesPath),
      path.relative(process.cwd(), throttlerNamesDtsPath)
    ].sort();

    console.log('🎉 CODE GENERATION COMPLETED:');
    console.log('═'.repeat(80));
    generatedFiles.forEach(file => console.log(`📁 ${file}`));
    console.log();
    console.log(`🚀 Generated decorators with ${throttlerNamesArray.length} throttler names ready for use!`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };