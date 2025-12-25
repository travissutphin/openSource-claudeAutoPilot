#!/usr/bin/env node

/**
 * ai-code-review.js
 *
 * Automated code review using static analysis and pattern matching.
 * Acts as a first-pass reviewer before human review.
 *
 * Usage:
 *   node ai-code-review.js                  # Review current branch changes
 *   node ai-code-review.js --pr=123         # Review specific PR
 *   node ai-code-review.js --files=src/     # Review specific files
 *   node ai-code-review.js --strict         # Fail on warnings too
 *
 * Exit Codes:
 *   0 = Approved (no issues or warnings only)
 *   1 = Changes Requested (blocking issues found)
 *   2 = Error (could not complete review)
 *
 * @version 1.0.0
 * @author [Syntax] (Principal Engineer)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const options = {
    pr: null,
    files: null,
    strict: args.includes('--strict'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    json: args.includes('--json')
};

args.forEach(arg => {
    if (arg.startsWith('--pr=')) {
        options.pr = arg.split('=')[1];
    }
    if (arg.startsWith('--files=')) {
        options.files = arg.split('=')[1];
    }
});

// Review criteria configuration
const REVIEW_CRITERIA = {
    // Critical - will block progression
    critical: {
        secrets: {
            name: 'Exposed Secrets',
            patterns: [
                /api[_-]?key\s*[:=]\s*["'][^"']{20,}["']/gi,
                /secret[_-]?key\s*[:=]\s*["'][^"']{10,}["']/gi,
                /password\s*[:=]\s*["'][^"']+["']/gi,
                /private[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
                /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
                /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g
            ],
            excludeFiles: ['.env.example', '.env.template', 'README.md', '*.md'],
            message: 'Potential secret or credential exposed in code'
        },
        sqlInjection: {
            name: 'SQL Injection Risk',
            patterns: [
                /\$_(GET|POST|REQUEST)\s*\[\s*["'][^"']+["']\s*\].*?(SELECT|INSERT|UPDATE|DELETE|WHERE)/gi,
                /query\s*\(\s*["'`].*?\$\{.*?\}.*?["'`]\s*\)/g,
                /execute\s*\(\s*["'`].*?\+.*?["'`]\s*\)/g
            ],
            message: 'Potential SQL injection vulnerability - use parameterized queries'
        },
        xss: {
            name: 'XSS Vulnerability',
            patterns: [
                /innerHTML\s*=\s*[^;]+\$/g,
                /document\.write\s*\([^)]*\$/g,
                /eval\s*\(/g,
                /dangerouslySetInnerHTML/g
            ],
            message: 'Potential XSS vulnerability - sanitize user input'
        }
    },

    // High - should be fixed but won't auto-block
    high: {
        debugCode: {
            name: 'Debug Code',
            patterns: [
                /console\.log\s*\(/g,
                /console\.debug\s*\(/g,
                /debugger\s*;/g,
                /var_dump\s*\(/g,
                /print_r\s*\(/g,
                /dd\s*\(/g,
                /dump\s*\(/g
            ],
            excludeFiles: ['*.test.js', '*.spec.js', '*.test.ts', '*.spec.ts'],
            message: 'Debug statement left in code'
        },
        todoFixme: {
            name: 'TODO/FIXME Comments',
            patterns: [
                /\/\/\s*(TODO|FIXME|HACK|XXX):/gi,
                /#\s*(TODO|FIXME|HACK|XXX):/gi
            ],
            message: 'Unresolved TODO/FIXME comment'
        },
        hardcodedUrls: {
            name: 'Hardcoded URLs',
            patterns: [
                /["']https?:\/\/localhost[^"']*/g,
                /["']https?:\/\/127\.0\.0\.1[^"']*/g,
                /["']https?:\/\/192\.168\.[^"']*/g
            ],
            excludeFiles: ['*.test.js', '*.spec.js', 'config.*'],
            message: 'Hardcoded localhost/IP URL - use environment variables'
        }
    },

    // Medium - suggestions for improvement
    medium: {
        longFunctions: {
            name: 'Long Functions',
            check: 'functionLength',
            threshold: 50,
            message: 'Function exceeds 50 lines - consider breaking it up'
        },
        deepNesting: {
            name: 'Deep Nesting',
            check: 'nestingDepth',
            threshold: 4,
            message: 'Nesting depth exceeds 4 levels - consider refactoring'
        },
        commentedCode: {
            name: 'Commented Out Code',
            patterns: [
                /\/\/\s*(const|let|var|function|if|for|while|return)\s+/g,
                /\/\*[\s\S]*?(const|let|var|function|class)[\s\S]*?\*\//g
            ],
            message: 'Commented out code should be removed'
        }
    },

    // Low - style suggestions
    low: {
        magicNumbers: {
            name: 'Magic Numbers',
            patterns: [
                /[^0-9a-z_]([2-9]\d{2,}|[1-9]\d{3,})[^0-9a-z_]/g
            ],
            excludePatterns: [/setTimeout/, /setInterval/, /width/, /height/],
            message: 'Magic number - consider using a named constant'
        },
        inconsistentNaming: {
            name: 'Naming Conventions',
            check: 'namingConventions',
            message: 'Inconsistent naming convention detected'
        }
    }
};

/**
 * Main entry point
 */
async function main() {
    console.log('========================================');
    console.log('AI Code Review');
    console.log('========================================');
    console.log('');

    // Get files to review
    const filesToReview = await getFilesToReview();

    if (filesToReview.length === 0) {
        console.log('No files to review');
        process.exit(0);
    }

    console.log(`Reviewing ${filesToReview.length} files...`);
    console.log('');

    // Run review
    const results = {
        critical: [],
        high: [],
        medium: [],
        low: [],
        filesReviewed: filesToReview.length,
        linesReviewed: 0
    };

    for (const file of filesToReview) {
        if (!fs.existsSync(file)) continue;

        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        results.linesReviewed += lines.length;

        // Run each category of checks
        for (const [severity, checks] of Object.entries(REVIEW_CRITERIA)) {
            for (const [checkId, check] of Object.entries(checks)) {
                const issues = runCheck(check, file, content, lines);
                issues.forEach(issue => {
                    results[severity].push({
                        file,
                        checkId,
                        ...issue
                    });
                });
            }
        }
    }

    // Generate report
    const report = generateReport(results);

    if (options.json) {
        console.log(JSON.stringify(results, null, 2));
    } else {
        console.log(report);
    }

    // Determine exit code
    if (results.critical.length > 0) {
        console.log('');
        console.log('RESULT: CHANGES REQUESTED (critical issues found)');
        process.exit(1);
    }

    if (options.strict && results.high.length > 0) {
        console.log('');
        console.log('RESULT: CHANGES REQUESTED (strict mode - high issues found)');
        process.exit(1);
    }

    console.log('');
    console.log('RESULT: APPROVED');
    process.exit(0);
}

/**
 * Get list of files to review
 */
async function getFilesToReview() {
    let files = [];

    if (options.files) {
        // Review specific files/directory
        const targetPath = options.files;
        if (fs.statSync(targetPath).isDirectory()) {
            files = getFilesRecursively(targetPath);
        } else {
            files = [targetPath];
        }
    } else if (options.pr) {
        // Get files from PR
        try {
            const output = execSync(`gh pr view ${options.pr} --json files -q '.files[].path'`, {
                encoding: 'utf8'
            });
            files = output.trim().split('\n').filter(Boolean);
        } catch {
            console.error('Error getting PR files');
            process.exit(2);
        }
    } else {
        // Get changed files from current branch vs main
        try {
            const output = execSync('git diff --name-only main...HEAD', {
                encoding: 'utf8'
            });
            files = output.trim().split('\n').filter(Boolean);
        } catch {
            // Fallback to staged files
            try {
                const output = execSync('git diff --cached --name-only', {
                    encoding: 'utf8'
                });
                files = output.trim().split('\n').filter(Boolean);
            } catch {
                console.error('Error getting changed files');
                process.exit(2);
            }
        }
    }

    // Filter to reviewable file types
    const reviewableExtensions = ['.js', '.ts', '.jsx', '.tsx', '.php', '.py', '.rb', '.go', '.java'];
    return files.filter(f => reviewableExtensions.some(ext => f.endsWith(ext)));
}

/**
 * Get files recursively from directory
 */
function getFilesRecursively(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Skip common non-source directories
        if (stat.isDirectory()) {
            if (!['node_modules', 'vendor', '.git', 'dist', 'build'].includes(file)) {
                getFilesRecursively(filePath, fileList);
            }
        } else {
            fileList.push(filePath);
        }
    }

    return fileList;
}

/**
 * Run a single check against file content
 */
function runCheck(check, file, content, lines) {
    const issues = [];

    // Check if file should be excluded
    if (check.excludeFiles) {
        for (const exclude of check.excludeFiles) {
            if (exclude.startsWith('*')) {
                if (file.endsWith(exclude.slice(1))) return issues;
            } else if (file.includes(exclude)) {
                return issues;
            }
        }
    }

    // Pattern-based check
    if (check.patterns) {
        for (const pattern of check.patterns) {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;

            while ((match = regex.exec(content)) !== null) {
                // Skip if matches exclude pattern
                if (check.excludePatterns) {
                    const skipMatch = check.excludePatterns.some(ep =>
                        ep.test(content.slice(Math.max(0, match.index - 50), match.index + 50))
                    );
                    if (skipMatch) continue;
                }

                // Find line number
                const lineNumber = content.slice(0, match.index).split('\n').length;

                issues.push({
                    name: check.name,
                    message: check.message,
                    line: lineNumber,
                    match: match[0].slice(0, 50) + (match[0].length > 50 ? '...' : '')
                });
            }
        }
    }

    // Function length check
    if (check.check === 'functionLength') {
        const functionRegex = /function\s+\w+\s*\([^)]*\)\s*\{|(\w+)\s*[=:]\s*(async\s+)?(\([^)]*\)|[a-z_]\w*)\s*=>\s*\{|(\w+)\s*\([^)]*\)\s*\{/g;
        let match;
        let lastFunctionStart = -1;
        let lastFunctionName = '';

        while ((match = functionRegex.exec(content)) !== null) {
            if (lastFunctionStart >= 0) {
                const funcContent = content.slice(lastFunctionStart, match.index);
                const funcLines = funcContent.split('\n').length;

                if (funcLines > check.threshold) {
                    const lineNumber = content.slice(0, lastFunctionStart).split('\n').length;
                    issues.push({
                        name: check.name,
                        message: `${check.message} (${funcLines} lines)`,
                        line: lineNumber,
                        match: lastFunctionName
                    });
                }
            }

            lastFunctionStart = match.index;
            lastFunctionName = match[1] || match[4] || 'anonymous';
        }
    }

    // Nesting depth check
    if (check.check === 'nestingDepth') {
        let maxDepth = 0;
        let currentDepth = 0;
        let maxDepthLine = 0;

        lines.forEach((line, index) => {
            const opens = (line.match(/\{/g) || []).length;
            const closes = (line.match(/\}/g) || []).length;

            currentDepth += opens - closes;

            if (currentDepth > maxDepth) {
                maxDepth = currentDepth;
                maxDepthLine = index + 1;
            }
        });

        if (maxDepth > check.threshold) {
            issues.push({
                name: check.name,
                message: `${check.message} (depth: ${maxDepth})`,
                line: maxDepthLine,
                match: `Maximum nesting depth: ${maxDepth}`
            });
        }
    }

    return issues;
}

/**
 * Generate human-readable report
 */
function generateReport(results) {
    let report = '';

    report += '----------------------------------------\n';
    report += 'REVIEW SUMMARY\n';
    report += '----------------------------------------\n';
    report += `Files Reviewed: ${results.filesReviewed}\n`;
    report += `Lines Reviewed: ${results.linesReviewed}\n`;
    report += '\n';

    const severityCounts = {
        critical: results.critical.length,
        high: results.high.length,
        medium: results.medium.length,
        low: results.low.length
    };

    report += 'Issues Found:\n';
    report += `  CRITICAL: ${severityCounts.critical}\n`;
    report += `  HIGH:     ${severityCounts.high}\n`;
    report += `  MEDIUM:   ${severityCounts.medium}\n`;
    report += `  LOW:      ${severityCounts.low}\n`;
    report += '\n';

    // Detail each severity level
    for (const [severity, issues] of Object.entries({
        critical: results.critical,
        high: results.high,
        medium: results.medium,
        low: results.low
    })) {
        if (issues.length === 0) continue;

        report += '----------------------------------------\n';
        report += `${severity.toUpperCase()} ISSUES\n`;
        report += '----------------------------------------\n';

        for (const issue of issues) {
            report += `\n[${issue.name}] ${issue.file}:${issue.line}\n`;
            report += `  ${issue.message}\n`;
            if (issue.match && options.verbose) {
                report += `  Found: ${issue.match}\n`;
            }
        }

        report += '\n';
    }

    return report;
}

// Run main
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(2);
});
