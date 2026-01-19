#!/usr/bin/env node

/**
 * Pattern Analyzer for Iterative Quality Refinement (IQR) System
 *
 * Analyzes an existing codebase to extract patterns for:
 * - Naming conventions (files, functions, variables, classes)
 * - File/directory structure
 * - Import styles
 * - Error handling patterns
 * - Comment/documentation styles
 * - Testing conventions
 *
 * Usage:
 *   node pattern-analyzer.js [options]
 *
 * Options:
 *   --project-root <path>   Project root directory (default: current directory)
 *   --output <path>         Output file for patterns (default: .autopilot/cache/patterns.json)
 *   --refresh               Force refresh of cached patterns
 *   --verbose               Show detailed analysis progress
 *   --category <name>       Analyze only specific category (naming, structure, imports, etc.)
 *
 * @version 1.0.0
 * @author Claude AutoPilot
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG_PATH = path.join(__dirname, '..', 'config', 'refinement-rules.json');
const DEFAULT_CACHE_PATH = path.join(__dirname, '..', 'cache', 'patterns.json');

let config = {};
let verbose = false;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📊',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || 'ℹ️';

  if (level === 'debug' && !verbose) return;
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function loadConfig() {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
      config = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf8'));
      log('Loaded refinement rules configuration', 'debug');
    } else {
      log('No config found, using defaults', 'warning');
      config = getDefaultConfig();
    }
  } catch (error) {
    log(`Error loading config: ${error.message}`, 'error');
    config = getDefaultConfig();
  }
  return config;
}

function getDefaultConfig() {
  return {
    pattern_detection: {
      confidence_threshold: 0.7,
      min_files_for_pattern: 3,
      max_files_to_scan: 500,
      skip_directories: ['node_modules', 'vendor', 'dist', 'build', '.git'],
      skip_files: ['*.min.js', '*.min.css', '*.map', '*.lock']
    }
  };
}

// ============================================================================
// TECH STACK DETECTION
// ============================================================================

function detectTechStack(projectRoot) {
  const techStack = {
    languages: [],
    frameworks: [],
    testing: [],
    database: [],
    detected_at: new Date().toISOString()
  };

  const indicators = {
    // JavaScript/TypeScript
    'package.json': () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['typescript'] || fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
        techStack.languages.push('typescript');
      } else {
        techStack.languages.push('javascript');
      }

      // Frameworks
      if (deps['next']) techStack.frameworks.push('nextjs');
      if (deps['react']) techStack.frameworks.push('react');
      if (deps['vue']) techStack.frameworks.push('vue');
      if (deps['@angular/core']) techStack.frameworks.push('angular');
      if (deps['express']) techStack.frameworks.push('express');
      if (deps['fastify']) techStack.frameworks.push('fastify');
      if (deps['svelte']) techStack.frameworks.push('svelte');
      if (deps['nuxt']) techStack.frameworks.push('nuxt');

      // Testing
      if (deps['jest']) techStack.testing.push('jest');
      if (deps['vitest']) techStack.testing.push('vitest');
      if (deps['mocha']) techStack.testing.push('mocha');
      if (deps['cypress']) techStack.testing.push('cypress');
      if (deps['playwright']) techStack.testing.push('playwright');

      // Database/ORM
      if (deps['prisma'] || deps['@prisma/client']) techStack.database.push('prisma');
      if (deps['mongoose']) techStack.database.push('mongodb');
      if (deps['pg']) techStack.database.push('postgresql');
      if (deps['mysql2']) techStack.database.push('mysql');
      if (deps['drizzle-orm']) techStack.database.push('drizzle');
      if (deps['typeorm']) techStack.database.push('typeorm');
    },

    // Python
    'requirements.txt': () => {
      techStack.languages.push('python');
      const content = fs.readFileSync(path.join(projectRoot, 'requirements.txt'), 'utf8');
      if (content.includes('django')) techStack.frameworks.push('django');
      if (content.includes('flask')) techStack.frameworks.push('flask');
      if (content.includes('fastapi')) techStack.frameworks.push('fastapi');
      if (content.includes('pytest')) techStack.testing.push('pytest');
      if (content.includes('sqlalchemy')) techStack.database.push('sqlalchemy');
    },
    'pyproject.toml': () => {
      techStack.languages.push('python');
    },

    // PHP
    'composer.json': () => {
      techStack.languages.push('php');
      const composer = JSON.parse(fs.readFileSync(path.join(projectRoot, 'composer.json'), 'utf8'));
      const deps = { ...composer.require, ...composer['require-dev'] };
      if (deps['laravel/framework']) techStack.frameworks.push('laravel');
      if (deps['symfony/symfony']) techStack.frameworks.push('symfony');
      if (deps['phpunit/phpunit']) techStack.testing.push('phpunit');
    },

    // Ruby
    'Gemfile': () => {
      techStack.languages.push('ruby');
      const content = fs.readFileSync(path.join(projectRoot, 'Gemfile'), 'utf8');
      if (content.includes('rails')) techStack.frameworks.push('rails');
      if (content.includes('rspec')) techStack.testing.push('rspec');
    },

    // Go
    'go.mod': () => {
      techStack.languages.push('go');
      const content = fs.readFileSync(path.join(projectRoot, 'go.mod'), 'utf8');
      if (content.includes('gin-gonic')) techStack.frameworks.push('gin');
      if (content.includes('echo')) techStack.frameworks.push('echo');
    },

    // Rust
    'Cargo.toml': () => {
      techStack.languages.push('rust');
      const content = fs.readFileSync(path.join(projectRoot, 'Cargo.toml'), 'utf8');
      if (content.includes('actix')) techStack.frameworks.push('actix');
      if (content.includes('rocket')) techStack.frameworks.push('rocket');
    }
  };

  // Check each indicator file
  for (const [file, detector] of Object.entries(indicators)) {
    if (fs.existsSync(path.join(projectRoot, file))) {
      try {
        detector();
      } catch (e) {
        log(`Error detecting from ${file}: ${e.message}`, 'debug');
      }
    }
  }

  // Deduplicate
  techStack.languages = [...new Set(techStack.languages)];
  techStack.frameworks = [...new Set(techStack.frameworks)];
  techStack.testing = [...new Set(techStack.testing)];
  techStack.database = [...new Set(techStack.database)];

  return techStack;
}

// ============================================================================
// FILE COLLECTION
// ============================================================================

function collectFiles(projectRoot, extensions = null) {
  const files = [];
  const skipDirs = config.pattern_detection?.skip_directories || [];
  const skipFiles = config.pattern_detection?.skip_files || [];
  const maxFiles = config.pattern_detection?.max_files_to_scan || 500;

  function shouldSkipDir(dirName) {
    return skipDirs.some(skip => dirName === skip || dirName.startsWith('.'));
  }

  function shouldSkipFile(fileName) {
    return skipFiles.some(pattern => {
      if (pattern.startsWith('*')) {
        return fileName.endsWith(pattern.slice(1));
      }
      return fileName === pattern;
    });
  }

  function walk(dir, depth = 0) {
    if (files.length >= maxFiles) return;
    if (depth > 10) return; // Prevent infinite recursion

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (files.length >= maxFiles) break;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!shouldSkipDir(entry.name)) {
            walk(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          if (!shouldSkipFile(entry.name)) {
            const ext = path.extname(entry.name);
            if (!extensions || extensions.includes(ext)) {
              files.push({
                path: fullPath,
                relativePath: path.relative(projectRoot, fullPath),
                name: entry.name,
                extension: ext,
                directory: path.relative(projectRoot, dir)
              });
            }
          }
        }
      }
    } catch (e) {
      log(`Error reading directory ${dir}: ${e.message}`, 'debug');
    }
  }

  walk(projectRoot);
  log(`Collected ${files.length} files for analysis`, 'debug');
  return files;
}

// ============================================================================
// NAMING PATTERN ANALYSIS
// ============================================================================

function analyzeNamingPatterns(files, projectRoot) {
  const patterns = {
    files: { camelCase: 0, PascalCase: 0, snake_case: 0, 'kebab-case': 0, other: 0 },
    functions: { camelCase: 0, PascalCase: 0, snake_case: 0, other: 0 },
    variables: { camelCase: 0, PascalCase: 0, snake_case: 0, UPPER_CASE: 0, other: 0 },
    classes: { PascalCase: 0, other: 0 },
    constants: { UPPER_CASE: 0, other: 0 },
    examples: {
      files: [],
      functions: [],
      variables: [],
      classes: [],
      constants: []
    }
  };

  const caseDetectors = {
    camelCase: /^[a-z][a-zA-Z0-9]*$/,
    PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
    snake_case: /^[a-z][a-z0-9_]*$/,
    'kebab-case': /^[a-z][a-z0-9-]*$/,
    UPPER_CASE: /^[A-Z][A-Z0-9_]*$/
  };

  function detectCase(name) {
    for (const [caseName, regex] of Object.entries(caseDetectors)) {
      if (regex.test(name)) return caseName;
    }
    return 'other';
  }

  // Analyze file names
  for (const file of files) {
    const baseName = path.basename(file.name, file.extension);
    const caseType = detectCase(baseName);
    patterns.files[caseType] = (patterns.files[caseType] || 0) + 1;
    if (patterns.examples.files.length < 5) {
      patterns.examples.files.push({ name: file.name, case: caseType });
    }
  }

  // Analyze code content
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.php', '.rb', '.go', '.rs'];
  const codeFiles = files.filter(f => codeExtensions.includes(f.extension));

  for (const file of codeFiles.slice(0, 100)) { // Limit for performance
    try {
      const content = fs.readFileSync(file.path, 'utf8');

      // Extract function names
      const functionPatterns = [
        /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,           // function name()
        /(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\(/g, // const name = () or const name = async (
        /(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?function/g, // const name = function
        /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,               // Python def name()
        /func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,              // Go func name()
        /fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,                // Rust fn name()
      ];

      for (const pattern of functionPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const name = match[1];
          if (name.length > 1 && !name.startsWith('_')) {
            const caseType = detectCase(name);
            patterns.functions[caseType] = (patterns.functions[caseType] || 0) + 1;
            if (patterns.examples.functions.length < 10) {
              patterns.examples.functions.push({ name, case: caseType, file: file.relativePath });
            }
          }
        }
      }

      // Extract class names
      const classPatterns = [
        /class\s+([A-Za-z_][A-Za-z0-9_]*)/g,
        /interface\s+([A-Za-z_][A-Za-z0-9_]*)/g,
        /type\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/g,
      ];

      for (const pattern of classPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const name = match[1];
          const caseType = detectCase(name);
          patterns.classes[caseType === 'PascalCase' ? 'PascalCase' : 'other']++;
          if (patterns.examples.classes.length < 10) {
            patterns.examples.classes.push({ name, case: caseType, file: file.relativePath });
          }
        }
      }

      // Extract constants (UPPER_CASE)
      const constantPatterns = [
        /(?:const|final|static)\s+([A-Z][A-Z0-9_]*)\s*=/g,
        /([A-Z][A-Z0-9_]{2,})\s*=/g,
      ];

      for (const pattern of constantPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const name = match[1];
          if (name.length > 2) {
            const caseType = detectCase(name);
            patterns.constants[caseType === 'UPPER_CASE' ? 'UPPER_CASE' : 'other']++;
            if (patterns.examples.constants.length < 10) {
              patterns.examples.constants.push({ name, file: file.relativePath });
            }
          }
        }
      }

    } catch (e) {
      log(`Error analyzing ${file.relativePath}: ${e.message}`, 'debug');
    }
  }

  // Calculate dominant patterns
  const dominant = {};
  for (const category of ['files', 'functions', 'variables', 'classes', 'constants']) {
    const counts = patterns[category];
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      dominant[category] = {
        pattern: sorted[0][0],
        confidence: sorted[0][1] / total,
        total_samples: total
      };
    }
  }

  return { counts: patterns, dominant, examples: patterns.examples };
}

// ============================================================================
// STRUCTURE PATTERN ANALYSIS
// ============================================================================

function analyzeStructurePatterns(files, projectRoot) {
  const patterns = {
    directories: {},
    file_locations: {},
    common_structures: []
  };

  // Analyze directory structure
  const dirCounts = {};
  for (const file of files) {
    const dir = file.directory || '.';
    dirCounts[dir] = (dirCounts[dir] || 0) + 1;
  }

  // Find common directory patterns
  const dirPatterns = {
    'src/components': 0,
    'src/pages': 0,
    'src/lib': 0,
    'src/utils': 0,
    'src/hooks': 0,
    'src/services': 0,
    'src/api': 0,
    'app': 0,
    'pages': 0,
    'components': 0,
    'lib': 0,
    'utils': 0,
    'controllers': 0,
    'models': 0,
    'views': 0,
    'routes': 0,
    'middleware': 0,
    'tests': 0,
    '__tests__': 0,
    'spec': 0
  };

  for (const dir of Object.keys(dirCounts)) {
    for (const pattern of Object.keys(dirPatterns)) {
      if (dir === pattern || dir.startsWith(pattern + '/') || dir.startsWith(pattern + path.sep)) {
        dirPatterns[pattern] += dirCounts[dir];
      }
    }
  }

  // Filter to only patterns that exist
  patterns.directories = Object.fromEntries(
    Object.entries(dirPatterns).filter(([_, count]) => count > 0)
  );

  // Analyze where specific file types go
  const fileTypeLocations = {};
  for (const file of files) {
    const ext = file.extension;
    if (!fileTypeLocations[ext]) {
      fileTypeLocations[ext] = {};
    }
    const dir = file.directory || '.';
    fileTypeLocations[ext][dir] = (fileTypeLocations[ext][dir] || 0) + 1;
  }

  // Find dominant location for each file type
  for (const [ext, locations] of Object.entries(fileTypeLocations)) {
    const sorted = Object.entries(locations).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      patterns.file_locations[ext] = {
        primary: sorted[0][0],
        count: sorted[0][1],
        alternatives: sorted.slice(1, 4).map(([dir, count]) => ({ dir, count }))
      };
    }
  }

  // Detect common project structures
  const structureIndicators = {
    'nextjs-app-router': ['app/page', 'app/layout'],
    'nextjs-pages-router': ['pages/_app', 'pages/index'],
    'react-standard': ['src/App', 'src/index'],
    'vue-standard': ['src/App.vue', 'src/main'],
    'laravel': ['app/Http/Controllers', 'resources/views'],
    'django': ['manage.py', 'settings.py'],
    'express': ['routes/', 'controllers/'],
    'rails': ['app/controllers', 'app/models']
  };

  for (const [structure, indicators] of Object.entries(structureIndicators)) {
    const matches = indicators.filter(indicator => {
      return files.some(f =>
        f.relativePath.includes(indicator) ||
        f.directory.includes(indicator)
      );
    });
    if (matches.length === indicators.length) {
      patterns.common_structures.push(structure);
    }
  }

  return patterns;
}

// ============================================================================
// IMPORT PATTERN ANALYSIS
// ============================================================================

function analyzeImportPatterns(files, projectRoot) {
  const patterns = {
    style: { absolute: 0, relative: 0, alias: 0 },
    order: [],
    grouping: { detected: false, groups: [] },
    examples: []
  };

  const jsFiles = files.filter(f => ['.js', '.jsx', '.ts', '.tsx'].includes(f.extension));

  for (const file of jsFiles.slice(0, 50)) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      const lines = content.split('\n');

      const imports = [];
      for (const line of lines) {
        // Match various import styles
        const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
        const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);

        const importPath = importMatch?.[1] || requireMatch?.[1];
        if (importPath) {
          imports.push({
            path: importPath,
            line: line.trim()
          });

          // Categorize import style
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            patterns.style.relative++;
          } else if (importPath.startsWith('@/') || importPath.startsWith('~/') || importPath.startsWith('@')) {
            patterns.style.alias++;
          } else {
            patterns.style.absolute++;
          }
        }
      }

      if (imports.length > 0 && patterns.examples.length < 5) {
        patterns.examples.push({
          file: file.relativePath,
          imports: imports.slice(0, 5)
        });
      }

      // Detect import grouping
      if (imports.length > 3) {
        let hasBlankLineSeparation = false;
        let prevLineWasImport = false;
        for (const line of lines) {
          const isImport = line.match(/^import\s+/) || line.match(/^const.*require/);
          if (prevLineWasImport && !isImport && line.trim() === '') {
            // Check if next non-blank line is also an import
            const nextLineIndex = lines.indexOf(line) + 1;
            if (nextLineIndex < lines.length) {
              const nextLine = lines[nextLineIndex];
              if (nextLine.match(/^import\s+/) || nextLine.match(/^const.*require/)) {
                hasBlankLineSeparation = true;
                break;
              }
            }
          }
          prevLineWasImport = !!isImport;
        }
        if (hasBlankLineSeparation) {
          patterns.grouping.detected = true;
        }
      }

    } catch (e) {
      log(`Error analyzing imports in ${file.relativePath}: ${e.message}`, 'debug');
    }
  }

  // Calculate dominant style
  const total = patterns.style.absolute + patterns.style.relative + patterns.style.alias;
  if (total > 0) {
    patterns.dominant_style = {
      style: Object.entries(patterns.style).sort((a, b) => b[1] - a[1])[0][0],
      confidence: Math.max(...Object.values(patterns.style)) / total
    };
  }

  return patterns;
}

// ============================================================================
// ERROR HANDLING PATTERN ANALYSIS
// ============================================================================

function analyzeErrorPatterns(files, projectRoot) {
  const patterns = {
    try_catch: { count: 0, examples: [] },
    promise_catch: { count: 0, examples: [] },
    error_types: {},
    logging: { console: 0, logger: 0, custom: 0 },
    error_responses: { examples: [] }
  };

  const codeFiles = files.filter(f =>
    ['.js', '.jsx', '.ts', '.tsx', '.py', '.php', '.rb', '.go'].includes(f.extension)
  );

  for (const file of codeFiles.slice(0, 75)) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');

      // Count try-catch blocks
      const tryCatchMatches = content.match(/try\s*\{/g);
      if (tryCatchMatches) {
        patterns.try_catch.count += tryCatchMatches.length;
      }

      // Count .catch() usage
      const promiseCatchMatches = content.match(/\.catch\s*\(/g);
      if (promiseCatchMatches) {
        patterns.promise_catch.count += promiseCatchMatches.length;
      }

      // Detect error types used
      const errorTypeMatches = content.matchAll(/(?:throw\s+new|catch\s*\(\s*)(\w*Error)/g);
      for (const match of errorTypeMatches) {
        const errorType = match[1];
        patterns.error_types[errorType] = (patterns.error_types[errorType] || 0) + 1;
      }

      // Detect logging patterns
      if (content.includes('console.error') || content.includes('console.log')) {
        patterns.logging.console++;
      }
      if (content.includes('logger.') || content.includes('log.')) {
        patterns.logging.logger++;
      }

      // Extract error handling examples
      const catchBlockMatch = content.match(/catch\s*\([^)]*\)\s*\{[^}]{10,200}/);
      if (catchBlockMatch && patterns.try_catch.examples.length < 5) {
        patterns.try_catch.examples.push({
          file: file.relativePath,
          snippet: catchBlockMatch[0].substring(0, 150) + '...'
        });
      }

    } catch (e) {
      log(`Error analyzing error patterns in ${file.relativePath}: ${e.message}`, 'debug');
    }
  }

  // Calculate dominant error handling style
  const totalErrorHandling = patterns.try_catch.count + patterns.promise_catch.count;
  if (totalErrorHandling > 0) {
    patterns.dominant_style = patterns.try_catch.count > patterns.promise_catch.count
      ? 'try-catch'
      : 'promise-catch';
    patterns.dominant_confidence = Math.max(patterns.try_catch.count, patterns.promise_catch.count) / totalErrorHandling;
  }

  return patterns;
}

// ============================================================================
// COMMENT/DOCUMENTATION PATTERN ANALYSIS
// ============================================================================

function analyzeCommentPatterns(files, projectRoot) {
  const patterns = {
    styles: {
      jsdoc: 0,
      docstring: 0,
      inline: 0,
      block: 0,
      none: 0
    },
    function_docs: { documented: 0, undocumented: 0 },
    examples: []
  };

  const codeFiles = files.filter(f =>
    ['.js', '.jsx', '.ts', '.tsx', '.py', '.php'].includes(f.extension)
  );

  for (const file of codeFiles.slice(0, 50)) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');

      // Detect JSDoc style
      const jsdocMatches = content.match(/\/\*\*[\s\S]*?\*\//g);
      if (jsdocMatches) {
        patterns.styles.jsdoc += jsdocMatches.length;
        if (patterns.examples.length < 3) {
          patterns.examples.push({
            style: 'jsdoc',
            file: file.relativePath,
            example: jsdocMatches[0].substring(0, 200)
          });
        }
      }

      // Detect Python docstrings
      const docstringMatches = content.match(/"""[\s\S]*?"""/g);
      if (docstringMatches) {
        patterns.styles.docstring += docstringMatches.length;
      }

      // Detect inline comments
      const inlineMatches = content.match(/\/\/[^\n]+/g);
      if (inlineMatches) {
        patterns.styles.inline += inlineMatches.length;
      }

      // Count documented vs undocumented functions
      const functionMatches = content.match(/(?:function|const|def|func)\s+\w+/g);
      if (functionMatches) {
        for (const func of functionMatches) {
          // Check if there's a comment before it
          const funcIndex = content.indexOf(func);
          const beforeFunc = content.substring(Math.max(0, funcIndex - 200), funcIndex);
          if (beforeFunc.match(/\/\*\*|"""|#\s*\w+:|\/\/\s*\w+/)) {
            patterns.function_docs.documented++;
          } else {
            patterns.function_docs.undocumented++;
          }
        }
      }

    } catch (e) {
      log(`Error analyzing comments in ${file.relativePath}: ${e.message}`, 'debug');
    }
  }

  // Calculate dominant style
  const total = Object.values(patterns.styles).reduce((a, b) => a + b, 0);
  if (total > 0) {
    const sorted = Object.entries(patterns.styles).sort((a, b) => b[1] - a[1]);
    patterns.dominant_style = {
      style: sorted[0][0],
      confidence: sorted[0][1] / total
    };
  }

  // Calculate documentation rate
  const totalFunctions = patterns.function_docs.documented + patterns.function_docs.undocumented;
  if (totalFunctions > 0) {
    patterns.documentation_rate = patterns.function_docs.documented / totalFunctions;
  }

  return patterns;
}

// ============================================================================
// TESTING PATTERN ANALYSIS
// ============================================================================

function analyzeTestingPatterns(files, projectRoot) {
  const patterns = {
    location: {},
    naming: { suffix_test: 0, suffix_spec: 0, prefix_test: 0, other: 0 },
    framework_indicators: {},
    structure: { examples: [] }
  };

  // Find test files
  const testFiles = files.filter(f => {
    const name = f.name.toLowerCase();
    return name.includes('test') ||
           name.includes('spec') ||
           f.directory.includes('test') ||
           f.directory.includes('__tests__') ||
           f.directory.includes('spec');
  });

  // Analyze test file locations
  for (const file of testFiles) {
    const dir = file.directory || '.';
    patterns.location[dir] = (patterns.location[dir] || 0) + 1;
  }

  // Analyze naming conventions
  for (const file of testFiles) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.test.js') || name.endsWith('.test.ts') || name.endsWith('.test.tsx') || name.endsWith('.test.jsx')) {
      patterns.naming.suffix_test++;
    } else if (name.endsWith('.spec.js') || name.endsWith('.spec.ts') || name.endsWith('_spec.rb')) {
      patterns.naming.suffix_spec++;
    } else if (name.startsWith('test_') || name.startsWith('test.')) {
      patterns.naming.prefix_test++;
    } else {
      patterns.naming.other++;
    }
  }

  // Analyze test file structure
  for (const file of testFiles.slice(0, 10)) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');

      // Detect test framework
      if (content.includes('describe(') && content.includes('it(')) {
        patterns.framework_indicators.jest_or_mocha = (patterns.framework_indicators.jest_or_mocha || 0) + 1;
      }
      if (content.includes('test(') && content.includes('expect(')) {
        patterns.framework_indicators.jest = (patterns.framework_indicators.jest || 0) + 1;
      }
      if (content.includes('def test_') || content.includes('pytest')) {
        patterns.framework_indicators.pytest = (patterns.framework_indicators.pytest || 0) + 1;
      }
      if (content.includes('PHPUnit') || content.includes('function test')) {
        patterns.framework_indicators.phpunit = (patterns.framework_indicators.phpunit || 0) + 1;
      }

      // Extract structure example
      if (patterns.structure.examples.length < 3) {
        const describeMatch = content.match(/describe\s*\([^)]+\)/);
        const testMatch = content.match(/(?:it|test)\s*\([^)]+\)/);
        if (describeMatch || testMatch) {
          patterns.structure.examples.push({
            file: file.relativePath,
            describe: describeMatch?.[0],
            test: testMatch?.[0]
          });
        }
      }

    } catch (e) {
      log(`Error analyzing test file ${file.relativePath}: ${e.message}`, 'debug');
    }
  }

  // Determine dominant patterns
  const totalNaming = Object.values(patterns.naming).reduce((a, b) => a + b, 0);
  if (totalNaming > 0) {
    const sorted = Object.entries(patterns.naming).sort((a, b) => b[1] - a[1]);
    patterns.dominant_naming = {
      pattern: sorted[0][0],
      confidence: sorted[0][1] / totalNaming
    };
  }

  // Find primary test location
  if (Object.keys(patterns.location).length > 0) {
    const sorted = Object.entries(patterns.location).sort((a, b) => b[1] - a[1]);
    patterns.primary_location = sorted[0][0];
  }

  patterns.total_test_files = testFiles.length;

  return patterns;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

async function analyzeCodebase(projectRoot, options = {}) {
  log(`Starting codebase analysis for: ${projectRoot}`, 'info');

  const startTime = Date.now();

  // Load configuration
  loadConfig();
  verbose = options.verbose || false;

  // Check for cached patterns
  const cachePath = options.output || DEFAULT_CACHE_PATH;
  if (!options.refresh && fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      const cacheAge = Date.now() - new Date(cached.analyzed_at).getTime();
      const cacheTTL = (config.output?.pattern_cache_ttl_hours || 24) * 60 * 60 * 1000;

      if (cacheAge < cacheTTL) {
        log('Using cached patterns (use --refresh to force update)', 'info');
        return cached;
      }
    } catch (e) {
      log('Cache invalid, performing fresh analysis', 'debug');
    }
  }

  // Detect tech stack
  log('Detecting tech stack...', 'info');
  const techStack = detectTechStack(projectRoot);
  log(`Detected: ${techStack.languages.join(', ')} with ${techStack.frameworks.join(', ') || 'no framework'}`, 'success');

  // Collect files
  log('Collecting files...', 'info');
  const files = collectFiles(projectRoot);
  log(`Found ${files.length} files to analyze`, 'success');

  // Run pattern analysis
  const categories = options.category ? [options.category] :
    ['naming', 'structure', 'imports', 'error_handling', 'comments', 'testing'];

  const results = {
    project_root: projectRoot,
    analyzed_at: new Date().toISOString(),
    tech_stack: techStack,
    file_count: files.length,
    patterns: {}
  };

  for (const category of categories) {
    log(`Analyzing ${category} patterns...`, 'info');

    switch (category) {
      case 'naming':
        results.patterns.naming = analyzeNamingPatterns(files, projectRoot);
        break;
      case 'structure':
        results.patterns.structure = analyzeStructurePatterns(files, projectRoot);
        break;
      case 'imports':
        results.patterns.imports = analyzeImportPatterns(files, projectRoot);
        break;
      case 'error_handling':
        results.patterns.error_handling = analyzeErrorPatterns(files, projectRoot);
        break;
      case 'comments':
        results.patterns.comments = analyzeCommentPatterns(files, projectRoot);
        break;
      case 'testing':
        results.patterns.testing = analyzeTestingPatterns(files, projectRoot);
        break;
    }
  }

  // Calculate analysis time
  results.analysis_time_ms = Date.now() - startTime;
  log(`Analysis completed in ${results.analysis_time_ms}ms`, 'success');

  // Save to cache
  if (config.output?.save_pattern_cache !== false) {
    try {
      const cacheDir = path.dirname(cachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cachePath, JSON.stringify(results, null, 2));
      log(`Patterns cached to ${cachePath}`, 'debug');
    } catch (e) {
      log(`Failed to cache patterns: ${e.message}`, 'warning');
    }
  }

  return results;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function parseArgs(args) {
  const options = {
    projectRoot: process.cwd(),
    output: DEFAULT_CACHE_PATH,
    refresh: false,
    verbose: false,
    category: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project-root':
        options.projectRoot = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--refresh':
        options.refresh = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--category':
        options.category = args[++i];
        break;
      case '--help':
        console.log(`
Pattern Analyzer for Iterative Quality Refinement (IQR) System

Usage:
  node pattern-analyzer.js [options]

Options:
  --project-root <path>   Project root directory (default: current directory)
  --output <path>         Output file for patterns (default: .autopilot/cache/patterns.json)
  --refresh               Force refresh of cached patterns
  --verbose               Show detailed analysis progress
  --category <name>       Analyze only specific category (naming, structure, imports,
                          error_handling, comments, testing)
  --help                  Show this help message
        `);
        process.exit(0);
    }
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs(process.argv.slice(2));

  analyzeCodebase(options.projectRoot, options)
    .then(results => {
      console.log('\n' + '='.repeat(60));
      console.log('PATTERN ANALYSIS SUMMARY');
      console.log('='.repeat(60));
      console.log(`\nTech Stack: ${results.tech_stack.languages.join(', ')}`);
      console.log(`Frameworks: ${results.tech_stack.frameworks.join(', ') || 'None detected'}`);
      console.log(`Files Analyzed: ${results.file_count}`);
      console.log(`Analysis Time: ${results.analysis_time_ms}ms`);

      if (results.patterns.naming?.dominant) {
        console.log('\nNaming Conventions:');
        for (const [category, data] of Object.entries(results.patterns.naming.dominant)) {
          console.log(`  ${category}: ${data.pattern} (${(data.confidence * 100).toFixed(0)}% confidence)`);
        }
      }

      if (results.patterns.testing) {
        console.log(`\nTest Files: ${results.patterns.testing.total_test_files}`);
        if (results.patterns.testing.primary_location) {
          console.log(`  Location: ${results.patterns.testing.primary_location}`);
        }
      }

      console.log(`\nFull results saved to: ${options.output}`);
    })
    .catch(error => {
      console.error('Analysis failed:', error.message);
      process.exit(1);
    });
}

// Export for use as module
module.exports = {
  analyzeCodebase,
  detectTechStack,
  collectFiles,
  analyzeNamingPatterns,
  analyzeStructurePatterns,
  analyzeImportPatterns,
  analyzeErrorPatterns,
  analyzeCommentPatterns,
  analyzeTestingPatterns
};
