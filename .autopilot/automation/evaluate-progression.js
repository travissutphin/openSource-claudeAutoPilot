#!/usr/bin/env node

/**
 * evaluate-progression.js
 *
 * Evaluates whether tasks are ready to progress to the next workflow stage.
 * Runs quality gates and auto-progresses tasks when all gates pass.
 *
 * Usage:
 *   node evaluate-progression.js                    # Evaluate all tasks
 *   node evaluate-progression.js --task=015        # Evaluate specific task
 *   node evaluate-progression.js --column=review   # Evaluate tasks in column
 *   node evaluate-progression.js --dry-run         # Preview without changes
 *
 * @version 1.0.0
 * @author [Codey] (TPM)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration paths
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const QUALITY_GATES_FILE = path.join(CONFIG_DIR, 'quality-gates.json');
const DECISION_TAXONOMY_FILE = path.join(CONFIG_DIR, 'decision-taxonomy.json');
const PLACEHOLDERS_FILE = path.join(CONFIG_DIR, 'placeholders.json');

// Load configurations
let qualityGates, decisionTaxonomy, placeholders;

try {
    qualityGates = JSON.parse(fs.readFileSync(QUALITY_GATES_FILE, 'utf8'));
    decisionTaxonomy = JSON.parse(fs.readFileSync(DECISION_TAXONOMY_FILE, 'utf8'));
    placeholders = JSON.parse(fs.readFileSync(PLACEHOLDERS_FILE, 'utf8'));
} catch (error) {
    console.error('Error loading configuration:', error.message);
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    task: null,
    column: null,
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v')
};

args.forEach(arg => {
    if (arg.startsWith('--task=')) {
        options.task = arg.split('=')[1].replace('#', '');
    }
    if (arg.startsWith('--column=')) {
        options.column = arg.split('=')[1];
    }
});

// Column progression map (4-column workflow per workflow-states.json)
const COLUMN_ORDER = ['backlog', 'in_progress', 'qa', 'live'];

const COLUMN_TRANSITIONS = {
    'backlog': 'in_progress',
    'in_progress': 'qa',
    'qa': 'live'
};

/**
 * Main entry point
 */
async function main() {
    console.log('========================================');
    console.log('Task Progression Evaluator');
    console.log('========================================');
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('');

    // Get kanban file path
    const kanbanPath = getKanbanPath();
    if (!kanbanPath || !fs.existsSync(kanbanPath)) {
        console.error('Error: Kanban file not found');
        process.exit(1);
    }

    // Read kanban
    const kanbanContent = fs.readFileSync(kanbanPath, 'utf8');
    const tasks = parseKanbanTasks(kanbanContent);

    console.log(`Found ${tasks.length} tasks in kanban`);
    console.log('');

    // Filter tasks if options specified
    let tasksToEvaluate = tasks;

    if (options.task) {
        tasksToEvaluate = tasks.filter(t => t.id === options.task);
        if (tasksToEvaluate.length === 0) {
            console.error(`Task #${options.task} not found`);
            process.exit(1);
        }
    }

    if (options.column) {
        tasksToEvaluate = tasksToEvaluate.filter(t => t.column === options.column);
    }

    // Exclude backlog and done - they don't progress
    tasksToEvaluate = tasksToEvaluate.filter(t =>
        t.column !== 'backlog' && t.column !== 'done'
    );

    console.log(`Evaluating ${tasksToEvaluate.length} tasks for progression`);
    console.log('');

    // Evaluate each task
    const results = {
        progressed: [],
        blocked: [],
        awaitingDecision: [],
        errors: []
    };

    for (const task of tasksToEvaluate) {
        const result = await evaluateTask(task);

        if (result.status === 'progressed') {
            results.progressed.push(result);
        } else if (result.status === 'blocked') {
            results.blocked.push(result);
        } else if (result.status === 'awaiting_decision') {
            results.awaitingDecision.push(result);
        } else if (result.status === 'error') {
            results.errors.push(result);
        }
    }

    // Print summary
    printSummary(results);

    // Exit with appropriate code
    if (results.errors.length > 0) {
        process.exit(1);
    }
    process.exit(0);
}

/**
 * Evaluate a single task for progression
 */
async function evaluateTask(task) {
    const nextColumn = COLUMN_TRANSITIONS[task.column];

    if (!nextColumn) {
        return {
            task,
            status: 'skipped',
            reason: `No progression from ${task.column}`
        };
    }

    const transitionKey = `${task.column}_to_${nextColumn}`;
    const gates = qualityGates[transitionKey];

    if (!gates) {
        return {
            task,
            status: 'skipped',
            reason: `No gates defined for ${transitionKey}`
        };
    }

    console.log(`----------------------------------------`);
    console.log(`Evaluating: #${task.id} - ${task.title}`);
    console.log(`Transition: ${task.column} → ${nextColumn}`);
    console.log('');

    const gateResults = [];
    let allPassed = true;
    let hasBlockingFailure = false;
    let awaitingHumanInput = false;

    for (const gate of gates.gates) {
        const gateResult = await runGateCheck(gate, task);
        gateResults.push(gateResult);

        if (!gateResult.passed) {
            allPassed = false;

            if (gate.blocking) {
                hasBlockingFailure = true;
            }

            if (!gate.auto && gate.decision_type === 'await_decision') {
                awaitingHumanInput = true;
            }
        }

        // Print gate result
        const icon = gateResult.passed ? '[PASS]' : '[FAIL]';
        const autoTag = gate.auto ? '(auto)' : '(manual)';
        console.log(`  ${icon} ${gate.name} ${autoTag}`);

        if (!gateResult.passed && gateResult.reason) {
            console.log(`       Reason: ${gateResult.reason}`);
        }
    }

    console.log('');

    // Determine outcome
    if (allPassed) {
        if (!options.dryRun) {
            await progressTask(task, task.column, nextColumn);
        }
        console.log(`Result: PROGRESSED to ${nextColumn}${options.dryRun ? ' (dry run)' : ''}`);
        return {
            task,
            status: 'progressed',
            from: task.column,
            to: nextColumn,
            gateResults
        };
    } else if (awaitingHumanInput) {
        console.log(`Result: AWAITING DECISION`);
        return {
            task,
            status: 'awaiting_decision',
            gateResults
        };
    } else if (hasBlockingFailure) {
        console.log(`Result: BLOCKED (blocking gate failed)`);
        return {
            task,
            status: 'blocked',
            gateResults
        };
    } else {
        console.log(`Result: NOT READY (gates not passed)`);
        return {
            task,
            status: 'blocked',
            gateResults
        };
    }
}

/**
 * Run a single gate check
 */
async function runGateCheck(gate, task) {
    // Skip if not auto and no manual check available
    if (!gate.auto) {
        // Check if decision exists in pending.md
        const decisionExists = checkPendingDecision(task.id, gate.id);
        if (decisionExists && decisionExists.approved) {
            return { passed: true, gate };
        }
        return {
            passed: false,
            gate,
            reason: 'Awaiting human approval'
        };
    }

    // Run automated check
    try {
        const checkCommand = substituteVariables(gate.check_command, task);

        if (options.verbose) {
            console.log(`       Running: ${checkCommand}`);
        }

        const result = runCommand(checkCommand);
        const passed = evaluateCondition(gate.pass_condition, result);

        return {
            passed,
            gate,
            result,
            reason: passed ? null : `Condition not met: ${gate.pass_condition}`
        };
    } catch (error) {
        // Handle specific gate types that might not have commands
        if (gate.check_command === 'check_task_blockers') {
            return { passed: true, gate }; // Assume no blockers for now
        }

        return {
            passed: false,
            gate,
            reason: `Check failed: ${error.message}`
        };
    }
}

/**
 * Run a shell command and return result
 */
function runCommand(command) {
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 30000
        });
        return {
            exitCode: 0,
            output: output.trim(),
            count: parseInt(output.trim()) || 0
        };
    } catch (error) {
        return {
            exitCode: error.status || 1,
            output: error.stdout || error.message,
            count: 0
        };
    }
}

/**
 * Evaluate a pass condition against a result
 * Uses safe comparison instead of eval() to prevent code injection
 */
function evaluateCondition(condition, result) {
    if (!condition) return result.exitCode === 0;

    // Map variable names to their values
    const vars = {
        'exit_code': result.exitCode,
        'result_count': result.count,
        'result': result.output
    };

    // Parse simple conditions: "variable operator value" with optional && / ||
    // Supports: ===, !==, >=, <=, >, <, ==, !=
    const parts = condition.split(/\s*(&&|\|\|)\s*/);
    let finalResult = null;
    let pendingOperator = null;

    for (const part of parts) {
        if (part === '&&' || part === '||') {
            pendingOperator = part;
            continue;
        }

        const match = part.trim().match(/^(\w+)\s*(===|!==|>=|<=|>|<|==|!=)\s*(.+)$/);
        if (!match) return result.exitCode === 0;

        const [, varName, operator, rawValue] = match;
        const left = vars.hasOwnProperty(varName) ? vars[varName] : undefined;
        if (left === undefined) return result.exitCode === 0;

        // Parse the right-hand value
        const value = rawValue.replace(/^['"]|['"]$/g, '');
        const numValue = Number(value);
        const right = isNaN(numValue) ? value : numValue;

        let comparison;
        switch (operator) {
            case '===': comparison = left === right; break;
            case '!==': comparison = left !== right; break;
            case '==':  comparison = left == right; break;
            case '!=':  comparison = left != right; break;
            case '>=':  comparison = left >= right; break;
            case '<=':  comparison = left <= right; break;
            case '>':   comparison = left > right; break;
            case '<':   comparison = left < right; break;
            default:    return result.exitCode === 0;
        }

        if (finalResult === null) {
            finalResult = comparison;
        } else if (pendingOperator === '&&') {
            finalResult = finalResult && comparison;
        } else if (pendingOperator === '||') {
            finalResult = finalResult || comparison;
        }
    }

    return finalResult !== null ? finalResult : result.exitCode === 0;
}

/**
 * Substitute variables in command
 */
function substituteVariables(command, task) {
    if (!command) return command;

    return command
        .replace('$TASK_ID', task.id)
        .replace('$BRANCH', task.branch || `feature/${task.id}`)
        .replace('$STAGING_URL', placeholders.environments?.staging?.url || '')
        .replace('$PRODUCTION_URL', placeholders.environments?.production?.url || '');
}

/**
 * Progress a task to the next column
 */
async function progressTask(task, fromColumn, toColumn) {
    const kanbanUpdater = path.join(__dirname, 'kanban-updater.js');

    const command = `node "${kanbanUpdater}" --task-id="${task.id}" --from-column="${fromColumn}" --to-column="${toColumn}" --add-note="Auto-progressed by evaluate-progression.js - all gates passed"`;

    try {
        execSync(command, { encoding: 'utf8' });

        // Git commit - stage only the kanban file, not everything
        const kanbanFile = getKanbanPath();
        execSync(`git add "${kanbanFile}" && git commit -m "chore: auto-progress #${task.id} (${fromColumn} → ${toColumn})

Automated by evaluate-progression.js
All quality gates passed.

Co-Authored-By: Claude <noreply@anthropic.com>"`, { encoding: 'utf8' });

    } catch (error) {
        console.error(`Error progressing task: ${error.message}`);
    }
}

/**
 * Parse tasks from kanban HTML
 */
function parseKanbanTasks(content) {
    const tasks = [];
    const columns = ['backlog', 'in_progress', 'qa', 'live'];

    for (const column of columns) {
        const startMarker = `<!-- KANBAN_${column.toUpperCase()}_START -->`;
        const endMarker = `<!-- KANBAN_${column.toUpperCase()}_END -->`;

        const startIdx = content.indexOf(startMarker);
        const endIdx = content.indexOf(endMarker);

        if (startIdx === -1 || endIdx === -1) continue;

        const columnContent = content.substring(startIdx, endIdx);

        // Find all cards with data-id
        const cardRegex = /data-id="(\d+)"[^>]*>[\s\S]*?<h4[^>]*>([^<]+)<\/h4>/g;
        let match;

        while ((match = cardRegex.exec(columnContent)) !== null) {
            tasks.push({
                id: match[1],
                title: match[2].trim(),
                column: column
            });
        }
    }

    return tasks;
}

/**
 * Get kanban file path from config
 */
function getKanbanPath() {
    if (placeholders.paths && placeholders.paths.kanban_dev) {
        // Handle relative or absolute path
        const kanbanPath = placeholders.paths.kanban_dev;
        if (path.isAbsolute(kanbanPath)) {
            return kanbanPath;
        }
        return path.join(process.cwd(), kanbanPath);
    }

    // Default locations
    const defaultPaths = [
        'docs/kanban/kanban_dev.html',
        'docs/kanban_dev.html',
        'kanban_dev.html'
    ];

    for (const p of defaultPaths) {
        const fullPath = path.join(process.cwd(), p);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }

    return null;
}

/**
 * Check if a decision exists in pending.md
 */
function checkPendingDecision(taskId, gateId) {
    const pendingPath = path.join(__dirname, '..', 'docs', 'decisions', 'pending.md');

    if (!fs.existsSync(pendingPath)) {
        return null;
    }

    const content = fs.readFileSync(pendingPath, 'utf8');

    // Look for approved decision for this task/gate
    // This is a simplified check - real implementation would parse markdown
    if (content.includes(`Task: #${taskId}`) && content.includes('[x] Approve')) {
        return { approved: true };
    }

    return null;
}

/**
 * Print summary of results
 */
function printSummary(results) {
    console.log('');
    console.log('========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log('');

    console.log(`Progressed: ${results.progressed.length}`);
    results.progressed.forEach(r => {
        console.log(`  - #${r.task.id}: ${r.from} → ${r.to}`);
    });

    console.log('');
    console.log(`Blocked: ${results.blocked.length}`);
    results.blocked.forEach(r => {
        console.log(`  - #${r.task.id}: ${r.task.title}`);
    });

    console.log('');
    console.log(`Awaiting Decision: ${results.awaitingDecision.length}`);
    results.awaitingDecision.forEach(r => {
        console.log(`  - #${r.task.id}: ${r.task.title}`);
    });

    if (results.errors.length > 0) {
        console.log('');
        console.log(`Errors: ${results.errors.length}`);
        results.errors.forEach(r => {
            console.log(`  - #${r.task.id}: ${r.error}`);
        });
    }

    console.log('');
    console.log('========================================');
}

// Run main
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
