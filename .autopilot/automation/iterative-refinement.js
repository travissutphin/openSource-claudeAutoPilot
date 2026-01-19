#!/usr/bin/env node

/**
 * Iterative Quality Refinement (IQR) Engine
 *
 * Validates new/modified code against learned project patterns and provides
 * actionable feedback for improvement. Supports iterative refinement loops
 * until quality thresholds are met.
 *
 * Usage:
 *   node iterative-refinement.js [options] <files...>
 *
 * Options:
 *   --project-root <path>   Project root directory (default: current directory)
 *   --patterns <path>       Path to patterns.json (default: .autopilot/cache/patterns.json)
 *   --threshold <number>    Minimum quality score to pass (default: 75)
 *   --iteration <number>    Current iteration number (default: 1)
 *   --max-iterations <n>    Maximum iterations allowed (default: 3)
 *   --output <format>       Output format: json, markdown, summary (default: markdown)
 *   --auto-analyze          Run pattern analyzer if patterns not found
 *   --check-only            Only check, don't suggest fixes
 *   --verbose               Show detailed analysis
 *
 * Exit codes:
 *   0 - All files pass quality threshold
 *   1 - One or more files below threshold (refinement needed)
 *   2 - Error during analysis
 *
 * @version 1.0.0
 * @author Claude AutoPilot
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG_PATH = path.join(__dirname, '..', 'config', 'refinement-rules.json');
const DEFAULT_PATTERNS_PATH = path.join(__dirname, '..', 'cache', 'patterns.json');

let config = {};
let patterns = {};
let verbose = false;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '🔄',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍',
    refine: '🔧'
  }[level] || 'ℹ️';

  if (level === 'debug' && !verbose) return;
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function loadConfig() {
  try {
    if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
      config = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf8'));
    } else {
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
    quality_thresholds: {
      minimum_score: 75,
      dimensions: {
        consistency: { weight: 0.35 },
        completeness: { weight: 0.25 },
        security: { weight: 0.25 },
        maintainability: { weight: 0.15 }
      }
    },
    refinement_loop: {
      max_iterations: 3,
      auto_fix_threshold: 0.9
    }
  };
}

function loadPatterns(patternsPath) {
  try {
    if (fs.existsSync(patternsPath)) {
      patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
      log(`Loaded patterns from ${patternsPath}`, 'debug');
      return true;
    }
  } catch (error) {
    log(`Error loading patterns: ${error.message}`, 'error');
  }
  return false;
}

// ============================================================================
// CASE DETECTION UTILITIES
// ============================================================================

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

function convertCase(name, targetCase) {
  // First, split the name into words
  let words = [];

  if (name.includes('_')) {
    words = name.toLowerCase().split('_');
  } else if (name.includes('-')) {
    words = name.toLowerCase().split('-');
  } else {
    // camelCase or PascalCase
    words = name.split(/(?=[A-Z])/).map(w => w.toLowerCase());
  }

  words = words.filter(w => w.length > 0);

  switch (targetCase) {
    case 'camelCase':
      return words[0] + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1)).join('');
    case 'PascalCase':
      return words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
    case 'snake_case':
      return words.join('_');
    case 'kebab-case':
      return words.join('-');
    case 'UPPER_CASE':
      return words.join('_').toUpperCase();
    default:
      return name;
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateNaming(fileContent, filePath, filePatterns) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  const dominant = filePatterns.naming?.dominant || {};
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);

  // Check file naming
  if (dominant.files?.pattern && dominant.files.confidence >= 0.7) {
    const expectedCase = dominant.files.pattern;
    const actualCase = detectCase(baseName);

    if (actualCase !== expectedCase && actualCase !== 'other') {
      score -= 15;
      const suggested = convertCase(baseName, expectedCase);
      issues.push({
        type: 'naming',
        severity: 'medium',
        message: `File name uses ${actualCase} but project uses ${expectedCase}`,
        current: baseName,
        suggested: suggested + ext,
        line: null
      });
      suggestions.push(`Rename file from "${baseName}${ext}" to "${suggested}${ext}"`);
    }
  }

  // Check function naming in code
  if (dominant.functions?.pattern && dominant.functions.confidence >= 0.7) {
    const expectedCase = dominant.functions.pattern;
    const functionPatterns = [
      /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
      /(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\(/g,
      /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
      /func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    ];

    const lines = fileContent.split('\n');
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      for (const pattern of functionPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const funcName = match[1];
          // Skip common exceptions
          if (funcName.startsWith('_') || funcName.length <= 2) continue;

          const actualCase = detectCase(funcName);
          if (actualCase !== expectedCase && actualCase !== 'other') {
            score -= 5;
            const suggested = convertCase(funcName, expectedCase);
            issues.push({
              type: 'naming',
              severity: 'low',
              message: `Function "${funcName}" uses ${actualCase} but project uses ${expectedCase}`,
              current: funcName,
              suggested: suggested,
              line: lineNum + 1
            });
            suggestions.push(`Line ${lineNum + 1}: Rename function "${funcName}" to "${suggested}"`);
          }
        }
      }
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function validateStructure(filePath, projectRoot, filePatterns) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  const relativePath = path.relative(projectRoot, filePath);
  const fileDir = path.dirname(relativePath);
  const ext = path.extname(filePath);

  // Check if file is in expected location for its type
  const fileLocations = filePatterns.structure?.file_locations || {};
  const expectedLocation = fileLocations[ext];

  if (expectedLocation && expectedLocation.primary) {
    const isInExpectedLocation = fileDir === expectedLocation.primary ||
                                  fileDir.startsWith(expectedLocation.primary + path.sep);

    if (!isInExpectedLocation && expectedLocation.count >= 3) {
      // Check if it's in an alternative location
      const isInAlternative = expectedLocation.alternatives?.some(alt =>
        fileDir === alt.dir || fileDir.startsWith(alt.dir + path.sep)
      );

      if (!isInAlternative) {
        score -= 20;
        issues.push({
          type: 'structure',
          severity: 'medium',
          message: `File location "${fileDir}" differs from typical location for ${ext} files`,
          current: fileDir,
          suggested: expectedLocation.primary,
          line: null
        });
        suggestions.push(`Consider moving to "${expectedLocation.primary}/" where other ${ext} files are located`);
      }
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function validateImports(fileContent, filePath, filePatterns) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  const ext = path.extname(filePath);
  if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    return { score, issues, suggestions };
  }

  const importPatterns = filePatterns.imports || {};
  const dominantStyle = importPatterns.dominant_style;

  if (!dominantStyle || dominantStyle.confidence < 0.6) {
    return { score, issues, suggestions };
  }

  const lines = fileContent.split('\n');
  let currentFileStyle = { absolute: 0, relative: 0, alias: 0 };

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
    const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);

    const importPath = importMatch?.[1] || requireMatch?.[1];
    if (importPath) {
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        currentFileStyle.relative++;
      } else if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
        currentFileStyle.alias++;
      } else if (!importPath.startsWith('.')) {
        currentFileStyle.absolute++;
      }
    }
  }

  // Determine this file's dominant style
  const total = currentFileStyle.absolute + currentFileStyle.relative + currentFileStyle.alias;
  if (total > 2) {
    const fileStyle = Object.entries(currentFileStyle).sort((a, b) => b[1] - a[1])[0][0];

    // Compare relative vs alias usage with project pattern
    if (dominantStyle.style === 'alias' && currentFileStyle.relative > currentFileStyle.alias) {
      score -= 10;
      issues.push({
        type: 'imports',
        severity: 'low',
        message: `File uses relative imports but project prefers alias imports (@/)`,
        current: 'relative',
        suggested: 'alias',
        line: null
      });
      suggestions.push(`Consider using alias imports (@/...) instead of relative imports (../..)`);
    }
  }

  // Check for import grouping if project uses it
  if (importPatterns.grouping?.detected) {
    // Find all import lines
    const importLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^import\s+/) || lines[i].match(/^const.*require/)) {
        importLines.push(i);
      }
    }

    // Check if imports are grouped (have blank line separations)
    if (importLines.length > 3) {
      let hasGrouping = false;
      for (let i = 1; i < importLines.length; i++) {
        if (importLines[i] - importLines[i - 1] > 1) {
          hasGrouping = true;
          break;
        }
      }

      if (!hasGrouping) {
        score -= 5;
        issues.push({
          type: 'imports',
          severity: 'low',
          message: 'Imports are not grouped (project uses blank line separation between import groups)',
          current: 'ungrouped',
          suggested: 'grouped',
          line: importLines[0] + 1
        });
        suggestions.push('Group imports with blank lines between external/internal/relative imports');
      }
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function validateErrorHandling(fileContent, filePath, filePatterns) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  const ext = path.extname(filePath);
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.php', '.go', '.rs'];
  if (!codeExtensions.includes(ext)) {
    return { score, issues, suggestions };
  }

  const errorPatterns = filePatterns.error_handling || {};

  // Check for empty catch blocks
  const emptyCatchMatches = fileContent.matchAll(/catch\s*\([^)]*\)\s*\{\s*\}/g);
  for (const match of emptyCatchMatches) {
    score -= 15;
    const lineNum = fileContent.substring(0, match.index).split('\n').length;
    issues.push({
      type: 'error_handling',
      severity: 'high',
      message: 'Empty catch block swallows errors silently',
      current: match[0],
      suggested: 'Add error handling or logging',
      line: lineNum
    });
    suggestions.push(`Line ${lineNum}: Add error handling logic to empty catch block`);
  }

  // Check for console.error vs logger (if project uses logger)
  if (errorPatterns.logging?.logger > errorPatterns.logging?.console) {
    const consoleErrorMatches = fileContent.matchAll(/console\.(error|log)\s*\(/g);
    for (const match of consoleErrorMatches) {
      score -= 5;
      const lineNum = fileContent.substring(0, match.index).split('\n').length;
      issues.push({
        type: 'error_handling',
        severity: 'low',
        message: 'Using console.* instead of project logger',
        current: match[0],
        suggested: 'Use project logger',
        line: lineNum
      });
      suggestions.push(`Line ${lineNum}: Consider using project logger instead of ${match[1]}`);
    }
  }

  // Check async functions have error handling
  const asyncFunctions = fileContent.matchAll(/async\s+(?:function\s+)?(\w+)?\s*\([^)]*\)\s*\{/g);
  for (const match of asyncFunctions) {
    const funcStart = match.index;
    // Find the function body (simplistic approach)
    let braceCount = 0;
    let funcEnd = funcStart;
    let inFunc = false;

    for (let i = funcStart; i < fileContent.length && i < funcStart + 2000; i++) {
      if (fileContent[i] === '{') {
        braceCount++;
        inFunc = true;
      } else if (fileContent[i] === '}') {
        braceCount--;
        if (inFunc && braceCount === 0) {
          funcEnd = i;
          break;
        }
      }
    }

    const funcBody = fileContent.substring(funcStart, funcEnd);
    const hasTryCatch = funcBody.includes('try') && funcBody.includes('catch');
    const hasCatch = funcBody.includes('.catch(');
    const hasAwait = funcBody.includes('await');

    if (hasAwait && !hasTryCatch && !hasCatch) {
      score -= 10;
      const lineNum = fileContent.substring(0, funcStart).split('\n').length;
      issues.push({
        type: 'error_handling',
        severity: 'medium',
        message: 'Async function with await but no error handling',
        current: match[0],
        suggested: 'Add try-catch or .catch()',
        line: lineNum
      });
      suggestions.push(`Line ${lineNum}: Add error handling to async function`);
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function validateSecurity(fileContent, filePath) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  const securityPatterns = [
    {
      pattern: /eval\s*\(/g,
      severity: 'critical',
      message: 'Use of eval() is a security risk',
      suggestion: 'Replace eval() with safer alternatives'
    },
    {
      pattern: /innerHTML\s*=\s*[^'"]/g,
      severity: 'high',
      message: 'Direct innerHTML assignment may lead to XSS',
      suggestion: 'Use textContent or sanitize input before innerHTML'
    },
    {
      pattern: /dangerouslySetInnerHTML/g,
      severity: 'medium',
      message: 'dangerouslySetInnerHTML requires careful sanitization',
      suggestion: 'Ensure content is properly sanitized'
    },
    {
      pattern: /(?:password|secret|api_key|apikey|token)\s*=\s*['"][^'"]+['"]/gi,
      severity: 'critical',
      message: 'Potential hardcoded secret detected',
      suggestion: 'Move secrets to environment variables'
    },
    {
      pattern: /\$\{.*\}\s*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/gi,
      severity: 'high',
      message: 'Potential SQL injection via string interpolation',
      suggestion: 'Use parameterized queries'
    },
    {
      pattern: /document\.write\s*\(/g,
      severity: 'medium',
      message: 'document.write can cause security issues',
      suggestion: 'Use DOM manipulation methods instead'
    },
    {
      pattern: /new\s+Function\s*\(/g,
      severity: 'high',
      message: 'new Function() is similar to eval() - security risk',
      suggestion: 'Avoid dynamic code execution'
    }
  ];

  const severityScores = { critical: 25, high: 15, medium: 10, low: 5 };

  for (const check of securityPatterns) {
    const matches = fileContent.matchAll(check.pattern);
    for (const match of matches) {
      score -= severityScores[check.severity];
      const lineNum = fileContent.substring(0, match.index).split('\n').length;
      issues.push({
        type: 'security',
        severity: check.severity,
        message: check.message,
        current: match[0].substring(0, 50),
        suggested: check.suggestion,
        line: lineNum
      });
      suggestions.push(`Line ${lineNum}: ${check.suggestion}`);
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function validateComments(fileContent, filePath, filePatterns) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  const ext = path.extname(filePath);
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.php'];
  if (!codeExtensions.includes(ext)) {
    return { score, issues, suggestions };
  }

  const commentPatterns = filePatterns.comments || {};
  const docRate = commentPatterns.documentation_rate || 0;

  // If project has high documentation rate, check this file
  if (docRate > 0.5) {
    // Count functions and documented functions
    const functionMatches = fileContent.matchAll(/(?:function|const|def|func)\s+(\w+)/g);
    let totalFunctions = 0;
    let documentedFunctions = 0;

    for (const match of functionMatches) {
      totalFunctions++;
      const funcIndex = match.index;
      const beforeFunc = fileContent.substring(Math.max(0, funcIndex - 200), funcIndex);
      if (beforeFunc.match(/\/\*\*|"""|#\s*\w+:|\/\/\s*\w+/)) {
        documentedFunctions++;
      }
    }

    if (totalFunctions > 2) {
      const fileDocRate = documentedFunctions / totalFunctions;
      if (fileDocRate < docRate - 0.3) {
        score -= 15;
        issues.push({
          type: 'comments',
          severity: 'medium',
          message: `File documentation rate (${(fileDocRate * 100).toFixed(0)}%) below project average (${(docRate * 100).toFixed(0)}%)`,
          current: `${documentedFunctions}/${totalFunctions} functions documented`,
          suggested: 'Add documentation to functions',
          line: null
        });
        suggestions.push(`Add documentation to undocumented functions (${totalFunctions - documentedFunctions} missing)`);
      }
    }
  }

  // Check for TODO/FIXME comments that should be tracked
  const todoMatches = fileContent.matchAll(/(?:\/\/|#|\/\*)\s*(TODO|FIXME|HACK|XXX):\s*(.{10,60})/gi);
  for (const match of todoMatches) {
    const lineNum = fileContent.substring(0, match.index).split('\n').length;
    issues.push({
      type: 'comments',
      severity: 'info',
      message: `${match[1].toUpperCase()} comment found`,
      current: match[2].substring(0, 50),
      suggested: 'Consider creating a task for this',
      line: lineNum
    });
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function validateMaintainability(fileContent, filePath) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  const lines = fileContent.split('\n');

  // Check file length
  if (lines.length > 500) {
    score -= 15;
    issues.push({
      type: 'maintainability',
      severity: 'medium',
      message: `File is very long (${lines.length} lines)`,
      current: `${lines.length} lines`,
      suggested: 'Consider splitting into smaller modules',
      line: null
    });
    suggestions.push(`Consider splitting this ${lines.length}-line file into smaller modules`);
  } else if (lines.length > 300) {
    score -= 5;
    issues.push({
      type: 'maintainability',
      severity: 'low',
      message: `File is getting long (${lines.length} lines)`,
      current: `${lines.length} lines`,
      suggested: 'Monitor file size',
      line: null
    });
  }

  // Check function complexity (simple heuristic: nesting depth)
  let maxNesting = 0;
  let currentNesting = 0;
  let maxNestingLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    currentNesting += opens - closes;

    if (currentNesting > maxNesting) {
      maxNesting = currentNesting;
      maxNestingLine = i + 1;
    }
  }

  if (maxNesting > 5) {
    score -= 15;
    issues.push({
      type: 'maintainability',
      severity: 'high',
      message: `Deep nesting detected (${maxNesting} levels)`,
      current: `${maxNesting} levels deep`,
      suggested: 'Refactor to reduce nesting (extract functions, early returns)',
      line: maxNestingLine
    });
    suggestions.push(`Line ${maxNestingLine}: Reduce nesting depth from ${maxNesting} levels`);
  } else if (maxNesting > 4) {
    score -= 5;
    issues.push({
      type: 'maintainability',
      severity: 'medium',
      message: `Moderate nesting depth (${maxNesting} levels)`,
      current: `${maxNesting} levels`,
      suggested: 'Consider reducing nesting',
      line: maxNestingLine
    });
  }

  // Check for very long lines
  let longLineCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 120) {
      longLineCount++;
      if (longLineCount <= 3) {
        issues.push({
          type: 'maintainability',
          severity: 'low',
          message: `Line exceeds 120 characters (${lines[i].length})`,
          current: lines[i].substring(0, 50) + '...',
          suggested: 'Break into multiple lines',
          line: i + 1
        });
      }
    }
  }

  if (longLineCount > 0) {
    score -= Math.min(10, longLineCount * 2);
    if (longLineCount > 3) {
      suggestions.push(`${longLineCount} lines exceed 120 characters - consider line wrapping`);
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

// ============================================================================
// MAIN VALIDATION ORCHESTRATOR
// ============================================================================

function validateFile(filePath, projectRoot, options = {}) {
  const result = {
    file: path.relative(projectRoot, filePath),
    scores: {},
    overall_score: 0,
    issues: [],
    suggestions: [],
    passed: false
  };

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const dimensions = config.quality_thresholds?.dimensions || {};

    // Run all validators
    const validations = {
      consistency: [
        validateNaming(fileContent, filePath, patterns.patterns || {}),
        validateImports(fileContent, filePath, patterns.patterns || {}),
        validateStructure(filePath, projectRoot, patterns.patterns || {})
      ],
      completeness: [
        validateComments(fileContent, filePath, patterns.patterns || {}),
        validateErrorHandling(fileContent, filePath, patterns.patterns || {})
      ],
      security: [
        validateSecurity(fileContent, filePath)
      ],
      maintainability: [
        validateMaintainability(fileContent, filePath)
      ]
    };

    // Aggregate scores per dimension
    for (const [dimension, validators] of Object.entries(validations)) {
      const scores = validators.map(v => v.score);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      result.scores[dimension] = Math.round(avgScore);

      // Collect issues and suggestions
      for (const v of validators) {
        result.issues.push(...v.issues);
        result.suggestions.push(...v.suggestions);
      }
    }

    // Calculate weighted overall score
    let weightedSum = 0;
    let totalWeight = 0;
    for (const [dimension, data] of Object.entries(dimensions)) {
      if (result.scores[dimension] !== undefined) {
        weightedSum += result.scores[dimension] * data.weight;
        totalWeight += data.weight;
      }
    }

    result.overall_score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    result.passed = result.overall_score >= (options.threshold || 75);

    // Sort issues by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    result.issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Deduplicate suggestions
    result.suggestions = [...new Set(result.suggestions)];

  } catch (error) {
    result.error = error.message;
    result.overall_score = 0;
    result.passed = false;
  }

  return result;
}

function validateFiles(files, projectRoot, options = {}) {
  const results = {
    summary: {
      total_files: files.length,
      passed: 0,
      failed: 0,
      average_score: 0,
      iteration: options.iteration || 1,
      max_iterations: options.maxIterations || 3,
      threshold: options.threshold || 75
    },
    files: [],
    all_issues: [],
    all_suggestions: []
  };

  let totalScore = 0;

  for (const file of files) {
    log(`Validating: ${path.relative(projectRoot, file)}`, 'debug');
    const fileResult = validateFile(file, projectRoot, options);
    results.files.push(fileResult);

    totalScore += fileResult.overall_score;
    if (fileResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }

    results.all_issues.push(...fileResult.issues.map(i => ({
      ...i,
      file: fileResult.file
    })));
    results.all_suggestions.push(...fileResult.suggestions.map(s => ({
      suggestion: s,
      file: fileResult.file
    })));
  }

  results.summary.average_score = files.length > 0 ?
    Math.round(totalScore / files.length) : 0;

  results.summary.all_passed = results.summary.failed === 0;
  results.summary.needs_refinement = !results.summary.all_passed &&
    results.summary.iteration < results.summary.max_iterations;

  return results;
}

// ============================================================================
// OUTPUT FORMATTERS
// ============================================================================

function formatMarkdown(results) {
  let output = '';

  output += `# Quality Refinement Report\n\n`;
  output += `**Iteration**: ${results.summary.iteration}/${results.summary.max_iterations}\n`;
  output += `**Threshold**: ${results.summary.threshold}\n`;
  output += `**Average Score**: ${results.summary.average_score}\n\n`;

  // Summary
  output += `## Summary\n\n`;
  output += `| Metric | Value |\n`;
  output += `|--------|-------|\n`;
  output += `| Files Analyzed | ${results.summary.total_files} |\n`;
  output += `| Passed | ${results.summary.passed} |\n`;
  output += `| Failed | ${results.summary.failed} |\n`;
  output += `| Status | ${results.summary.all_passed ? '✅ PASSED' : '🔧 NEEDS REFINEMENT'} |\n\n`;

  // Per-file results
  output += `## File Results\n\n`;
  for (const file of results.files) {
    const status = file.passed ? '✅' : '❌';
    output += `### ${status} ${file.file}\n\n`;
    output += `**Overall Score**: ${file.overall_score}/100\n\n`;

    output += `| Dimension | Score |\n`;
    output += `|-----------|-------|\n`;
    for (const [dim, score] of Object.entries(file.scores)) {
      output += `| ${dim} | ${score} |\n`;
    }
    output += `\n`;

    if (file.issues.length > 0) {
      output += `**Issues**:\n`;
      for (const issue of file.issues.slice(0, 10)) {
        const icon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', info: 'ℹ️' }[issue.severity];
        output += `- ${icon} ${issue.message}`;
        if (issue.line) output += ` (line ${issue.line})`;
        output += `\n`;
      }
      if (file.issues.length > 10) {
        output += `- ... and ${file.issues.length - 10} more issues\n`;
      }
      output += `\n`;
    }

    if (file.suggestions.length > 0 && !file.passed) {
      output += `**Suggestions**:\n`;
      for (const suggestion of file.suggestions.slice(0, 5)) {
        output += `1. ${suggestion}\n`;
      }
      output += `\n`;
    }
  }

  // Next steps
  if (results.summary.needs_refinement) {
    output += `## Next Steps\n\n`;
    output += `Iteration ${results.summary.iteration} did not pass all quality checks.\n`;
    output += `Please address the issues above and run refinement again.\n`;
    output += `Remaining iterations: ${results.summary.max_iterations - results.summary.iteration}\n`;
  }

  return output;
}

function formatSummary(results) {
  let output = '';

  output += `\n${'='.repeat(60)}\n`;
  output += `QUALITY REFINEMENT RESULTS - Iteration ${results.summary.iteration}/${results.summary.max_iterations}\n`;
  output += `${'='.repeat(60)}\n\n`;

  output += `Average Score: ${results.summary.average_score}/100 (threshold: ${results.summary.threshold})\n`;
  output += `Files: ${results.summary.passed} passed, ${results.summary.failed} failed\n\n`;

  if (results.summary.all_passed) {
    output += `✅ ALL FILES PASSED QUALITY CHECKS\n`;
  } else {
    output += `❌ ${results.summary.failed} FILE(S) NEED REFINEMENT\n\n`;

    // Show failed files
    output += `Failed Files:\n`;
    for (const file of results.files.filter(f => !f.passed)) {
      output += `  - ${file.file} (score: ${file.overall_score})\n`;
    }
    output += `\n`;

    // Show top suggestions
    const topSuggestions = results.all_suggestions.slice(0, 5);
    if (topSuggestions.length > 0) {
      output += `Top Suggestions:\n`;
      for (const s of topSuggestions) {
        output += `  • ${s.suggestion}\n`;
      }
    }
  }

  output += `\n${'='.repeat(60)}\n`;

  return output;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function parseArgs(args) {
  const options = {
    projectRoot: process.cwd(),
    patternsPath: DEFAULT_PATTERNS_PATH,
    threshold: 75,
    iteration: 1,
    maxIterations: 3,
    output: 'summary',
    autoAnalyze: false,
    checkOnly: false,
    verbose: false,
    files: []
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project-root':
        options.projectRoot = args[++i];
        break;
      case '--patterns':
        options.patternsPath = args[++i];
        break;
      case '--threshold':
        options.threshold = parseInt(args[++i], 10);
        break;
      case '--iteration':
        options.iteration = parseInt(args[++i], 10);
        break;
      case '--max-iterations':
        options.maxIterations = parseInt(args[++i], 10);
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--auto-analyze':
        options.autoAnalyze = true;
        break;
      case '--check-only':
        options.checkOnly = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
Iterative Quality Refinement (IQR) Engine

Usage:
  node iterative-refinement.js [options] <files...>

Options:
  --project-root <path>   Project root directory (default: current directory)
  --patterns <path>       Path to patterns.json (default: .autopilot/cache/patterns.json)
  --threshold <number>    Minimum quality score to pass (default: 75)
  --iteration <number>    Current iteration number (default: 1)
  --max-iterations <n>    Maximum iterations allowed (default: 3)
  --output <format>       Output format: json, markdown, summary (default: summary)
  --auto-analyze          Run pattern analyzer if patterns not found
  --check-only            Only check, don't suggest fixes
  --verbose               Show detailed analysis
  --help                  Show this help message

Exit codes:
  0 - All files pass quality threshold
  1 - One or more files below threshold
  2 - Error during analysis
        `);
        process.exit(0);
      default:
        if (!args[i].startsWith('-')) {
          options.files.push(args[i]);
        }
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs(process.argv.slice(2));
  verbose = options.verbose;

  // Load config
  loadConfig();

  // Load or create patterns
  if (!loadPatterns(options.patternsPath)) {
    if (options.autoAnalyze) {
      log('Patterns not found, running pattern analyzer...', 'info');
      try {
        const { analyzeCodebase } = require('./pattern-analyzer.js');
        patterns = await analyzeCodebase(options.projectRoot, {
          output: options.patternsPath,
          verbose: options.verbose
        });
      } catch (e) {
        log(`Failed to analyze patterns: ${e.message}`, 'error');
        process.exit(2);
      }
    } else {
      log('No patterns found. Run pattern-analyzer.js first or use --auto-analyze', 'warning');
      patterns = { patterns: {} };
    }
  }

  // Get files to validate
  let files = options.files;
  if (files.length === 0) {
    // Default: get changed files from git
    try {
      const { execSync } = require('child_process');
      const gitFiles = execSync('git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null || git diff --name-only 2>/dev/null', {
        cwd: options.projectRoot,
        encoding: 'utf8'
      }).trim().split('\n').filter(f => f);

      files = gitFiles.map(f => path.join(options.projectRoot, f)).filter(f => fs.existsSync(f));
    } catch (e) {
      log('No files specified and could not get git changes', 'error');
      process.exit(2);
    }
  }

  // Resolve file paths
  files = files.map(f => path.isAbsolute(f) ? f : path.join(options.projectRoot, f));
  files = files.filter(f => fs.existsSync(f) && fs.statSync(f).isFile());

  if (files.length === 0) {
    log('No files to validate', 'warning');
    console.log('Pass file paths as arguments or ensure git has changes');
    process.exit(0);
  }

  log(`Validating ${files.length} file(s)...`, 'info');

  // Run validation
  const results = validateFiles(files, options.projectRoot, options);

  // Output results
  switch (options.output) {
    case 'json':
      console.log(JSON.stringify(results, null, 2));
      break;
    case 'markdown':
      console.log(formatMarkdown(results));
      break;
    case 'summary':
    default:
      console.log(formatSummary(results));
  }

  // Exit code
  if (results.summary.all_passed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error('Error:', e.message);
    process.exit(2);
  });
}

// Export for use as module
module.exports = {
  validateFile,
  validateFiles,
  validateNaming,
  validateStructure,
  validateImports,
  validateErrorHandling,
  validateSecurity,
  validateComments,
  validateMaintainability,
  formatMarkdown,
  formatSummary
};
