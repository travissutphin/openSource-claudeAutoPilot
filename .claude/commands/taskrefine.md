# [TaskRefine] - Iterative Quality Refinement

**Version**: 1.0.0
**Command**: `[TaskRefine]` or `/taskrefine`
**Trigger**: Manual or automatic before [TaskReview]
**Purpose**: Validate and refine code output against learned project patterns
**Executor**: [Verity] (QA Engineer) with [Syntax] (Developer) support

---

## OVERVIEW

The Iterative Quality Refinement (IQR) system ensures code quality by:

1. **Learning** patterns from the existing codebase (naming, structure, imports, etc.)
2. **Validating** new/modified code against these patterns
3. **Scoring** code across 4 dimensions (consistency, completeness, security, maintainability)
4. **Suggesting** specific, actionable improvements
5. **Iterating** until quality threshold is met (max 3 iterations)

---

## WHEN TO USE

| Scenario | Action |
|----------|--------|
| Before moving task to Review | Run `[TaskRefine]` |
| After significant code changes | Run `[TaskRefine]` |
| Failing quality gates | Automatic trigger |
| New developer onboarding | Learn project patterns |

---

## STEP 1: Initialize Refinement Session

**Executor**: [Verity]

### Actions:

1. Read current task from kanban board or git branch
2. Identify files modified in current task
3. Check if patterns cache exists and is fresh

```bash
# Get modified files
TASK_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null || git diff --name-only)

# Check patterns cache
if [ ! -f ".autopilot/cache/patterns.json" ] || [ $(find ".autopilot/cache/patterns.json" -mtime +1 2>/dev/null) ]; then
    echo "Patterns cache missing or stale - will analyze codebase"
    NEED_ANALYSIS=true
fi
```

### Output:

```
🔄 ITERATIVE QUALITY REFINEMENT
================================

Task: #[ID] - [Title]
Files to validate: [count]
Pattern cache: [Fresh/Stale/Missing]

Starting refinement process...
```

---

## STEP 2: Pattern Analysis (if needed)

**Executor**: [Verity]

### Trigger Conditions:
- First run on project
- Cache older than 24 hours
- Major codebase changes
- User requests refresh with `--refresh`

### Actions:

```bash
# Run pattern analyzer
node .autopilot/automation/pattern-analyzer.js \
  --project-root "$(pwd)" \
  --output ".autopilot/cache/patterns.json" \
  --verbose
```

### Output:

```
📊 PATTERN ANALYSIS
===================

Tech Stack: [language] + [framework]
Files Analyzed: [count]

Detected Patterns:
- File naming: [camelCase/PascalCase/snake_case] (95% confidence)
- Functions: [pattern] (87% confidence)
- Imports: [relative/alias/absolute] (82% confidence)
- Error handling: [try-catch/promise-catch] (78% confidence)
- Documentation: [JSDoc/docstrings/inline] (65% confidence)
- Test location: [__tests__/spec/tests] (90% confidence)

Analysis complete. Patterns cached.
```

---

## STEP 3: Run Quality Validation

**Executor**: [Verity]

### Actions:

```bash
# Run iterative refinement engine
node .autopilot/automation/iterative-refinement.js \
  --project-root "$(pwd)" \
  --patterns ".autopilot/cache/patterns.json" \
  --threshold 75 \
  --iteration 1 \
  --max-iterations 3 \
  --output summary \
  --auto-analyze \
  $TASK_FILES
```

### Quality Dimensions:

| Dimension | Weight | What It Checks |
|-----------|--------|----------------|
| Consistency | 35% | Naming conventions, import style, file structure |
| Completeness | 25% | Error handling, documentation, required elements |
| Security | 25% | No hardcoded secrets, XSS prevention, SQL injection |
| Maintainability | 15% | File length, nesting depth, line length |

### Scoring:

- **90-100**: Excellent - Ready for review
- **75-89**: Good - Minor improvements suggested
- **60-74**: Needs Work - Refinement required
- **Below 60**: Significant Issues - Major refinement needed

---

## STEP 4: Review Results

**Executor**: [Verity], [Syntax]

### IF ALL FILES PASS (score >= threshold):

```
✅ QUALITY REFINEMENT PASSED
============================

Iteration: 1/3
Average Score: 87/100
Threshold: 75

File Results:
✅ src/components/UserProfile.tsx (92/100)
✅ src/utils/validation.ts (85/100)
✅ src/api/users.ts (84/100)

All files meet quality standards.
Ready to proceed to [TaskReview].
```

**Action**: Proceed to [TaskReview]

---

### IF FILES FAIL (score < threshold):

```
🔧 REFINEMENT NEEDED
====================

Iteration: 1/3
Average Score: 68/100
Threshold: 75

Failed Files:
❌ src/components/UserProfile.tsx (62/100)
❌ src/api/users.ts (71/100)

Issues Found:

🔴 CRITICAL (must fix):
- src/api/users.ts:45 - Potential hardcoded secret detected
  → Move secrets to environment variables

🟠 HIGH (should fix):
- src/components/UserProfile.tsx:23 - Empty catch block swallows errors
  → Add error handling or logging
- src/api/users.ts:67 - Async function without error handling
  → Add try-catch or .catch()

🟡 MEDIUM (recommended):
- src/components/UserProfile.tsx - File uses camelCase but project uses PascalCase
  → Rename file from "userProfile.tsx" to "UserProfile.tsx"
- src/components/UserProfile.tsx:15 - Deep nesting (5 levels)
  → Refactor to reduce nesting

🔵 LOW (optional):
- src/utils/validation.ts - Imports not grouped
  → Add blank lines between import groups

Suggested Actions:
1. Fix the critical security issue in users.ts
2. Add error handling to empty catch blocks
3. Address async functions without error handling
4. Consider renaming files to match project conventions
```

**Action**: Address issues and proceed to STEP 5

---

## STEP 5: Refinement Loop

**Executor**: [Syntax] (fixes), [Verity] (re-validates)

### Iteration Process:

```
FOR each iteration (1 to max_iterations):
  1. [Syntax] reviews issues and suggestions
  2. [Syntax] makes code changes to address issues
  3. [Verity] re-runs validation
  4. IF score >= threshold: PASS → proceed to [TaskReview]
  5. ELSE IF iteration < max: continue loop
  6. ELSE: escalate to human review
```

### Re-run Validation:

```bash
# Run next iteration
node .autopilot/automation/iterative-refinement.js \
  --project-root "$(pwd)" \
  --iteration 2 \
  --max-iterations 3 \
  --threshold 75 \
  $TASK_FILES
```

### Iteration Output:

```
🔄 REFINEMENT ITERATION 2/3
============================

Changes Made:
✅ Fixed hardcoded secret in users.ts
✅ Added error handling to catch blocks
✅ Wrapped async functions in try-catch

Re-validation Results:
- src/components/UserProfile.tsx: 62 → 78 (+16)
- src/api/users.ts: 71 → 89 (+18)

Average Score: 68 → 83 (+15)

✅ All files now pass quality threshold!
```

---

## STEP 6: Final Report

**Executor**: [Verity]

### Generate Refinement Report:

```bash
# Generate detailed report
node .autopilot/automation/iterative-refinement.js \
  --output markdown \
  $TASK_FILES > ".autopilot/reports/refinement-task-[ID].md"
```

### Report Contents:

```markdown
# Quality Refinement Report - Task #[ID]

## Summary
- **Task**: [Title]
- **Files**: [count]
- **Iterations**: [count]
- **Final Score**: [score]/100
- **Status**: PASSED

## Improvements Made
1. Security: Moved hardcoded secrets to .env
2. Error Handling: Added try-catch to 3 functions
3. Maintainability: Reduced nesting in UserProfile

## Patterns Learned
This task reinforced the following project patterns:
- PascalCase for component files
- try-catch for async error handling
- Grouped imports with blank lines

## Metrics
| Dimension | Before | After | Change |
|-----------|--------|-------|--------|
| Consistency | 65 | 85 | +20 |
| Completeness | 60 | 82 | +22 |
| Security | 45 | 95 | +50 |
| Maintainability | 75 | 80 | +5 |
```

---

## INTEGRATION WITH WORKFLOW

### Automatic Triggers:

```
[TaskStart] → Development → [TaskRefine] → [TaskReview] → [TaskQA]
                               ↑    ↓
                               └────┘ (iterate if needed)
```

### Quality Gate Integration:

The IQR system is integrated into the `in_progress → review` quality gate:

```json
{
  "transition": "in_progress_to_review",
  "gates": [
    {
      "name": "quality_refinement",
      "check_command": "node .autopilot/automation/iterative-refinement.js --auto-analyze",
      "pass_condition": "exit_code === 0",
      "on_fail": "block_with_suggestions",
      "auto_fix": true
    }
  ]
}
```

---

## CONFIGURATION

### Refinement Rules (`.autopilot/config/refinement-rules.json`):

```json
{
  "quality_thresholds": {
    "minimum_score": 75,
    "dimensions": {
      "consistency": { "weight": 0.35 },
      "completeness": { "weight": 0.25 },
      "security": { "weight": 0.25 },
      "maintainability": { "weight": 0.15 }
    }
  },
  "refinement_loop": {
    "max_iterations": 3,
    "auto_fix_threshold": 0.9
  },
  "pattern_categories": {
    "naming": { "enabled": true },
    "structure": { "enabled": true },
    "imports": { "enabled": true },
    "error_handling": { "enabled": true },
    "comments": { "enabled": true },
    "testing": { "enabled": true }
  }
}
```

### Adjust Thresholds Per Project:

- **Strict** (mature codebase): `minimum_score: 85`
- **Standard** (most projects): `minimum_score: 75`
- **Lenient** (prototypes): `minimum_score: 60`

---

## COMMAND OPTIONS

| Option | Description | Example |
|--------|-------------|---------|
| `--refresh` | Force pattern re-analysis | `[TaskRefine --refresh]` |
| `--threshold N` | Override minimum score | `[TaskRefine --threshold 80]` |
| `--files <list>` | Specific files to check | `[TaskRefine --files src/api/*.ts]` |
| `--report` | Generate detailed report | `[TaskRefine --report]` |
| `--check-only` | Validate without suggestions | `[TaskRefine --check-only]` |

---

## TROUBLESHOOTING

### "No patterns found"

```bash
# Run pattern analysis first
node .autopilot/automation/pattern-analyzer.js --refresh
```

### "Score not improving"

1. Check if suggestions are being addressed
2. Review severity levels - fix CRITICAL first
3. Some issues may require architectural changes

### "False positives"

Adjust pattern confidence threshold in config:

```json
{
  "pattern_detection": {
    "confidence_threshold": 0.8  // Increase from 0.7
  }
}
```

### "Takes too long"

Reduce files scanned:

```json
{
  "pattern_detection": {
    "max_files_to_scan": 200  // Reduce from 500
  }
}
```

---

## BENEFITS

| Benefit | Impact |
|---------|--------|
| Catches issues before review | 30-50% faster review cycles |
| Enforces consistency | Better maintainability |
| Security scanning | Catches vulnerabilities early |
| Self-documenting | Patterns visible to team |
| Learns from codebase | Adapts to any tech stack |

---

## VERSION HISTORY

- v1.0.0 (2025-12-XX): Initial release - adaptive pattern learning, 4-dimension scoring, iterative refinement

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-XX
**Maintainer**: [Verity] (QA Engineer)
