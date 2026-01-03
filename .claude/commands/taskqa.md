# [TaskQA] - Hand Off to QA

**Version**: 3.0.0
**Command**: `[TaskQA]` or `/taskqa`
**Trigger**: When code review is approved, ready for QA testing
**Purpose**: Security scan, move from Review to QA, hand off to testers
**Executor**: [Codey] (Lead), [Sentinal] (Security), [Verity] (QA)

---

## AUTO-EXECUTION INSTRUCTIONS

When user says "ready for QA" or "[TaskQA]", execute this workflow.

**Prerequisite**: Code review must be approved (task in Review column).

---

## STEP 1: Pre-QA Developer Checklist
**Executor**: [Syntax]

### Verify with Developer:
```
PRE-QA CHECKLIST
=================

Before handing off, confirm these items:

□ All acceptance criteria implemented
□ Code compiles/runs without errors
□ Tests written and passing
□ No console errors or warnings
□ Responsive design checked (mobile, tablet, desktop)
□ Edge cases handled (empty states, long text, etc.)
□ Error states have user-friendly messages
□ Loading states implemented

All items complete? (yes / tell me what's missing)
```

If items missing, pause and address before proceeding.

---

## STEP 2: Run Automated Checks
**Executor**: [Flow], [Syntax]

### Execute:
```bash
# 1. Check for uncommitted changes
git status

# 2. Run linter
npm run lint
# or: php -l *.php

# 3. Run tests
npm test

# 4. Run type check (if TypeScript)
npm run type-check

# 5. Verify build passes
npm run build
```

### Report:
```
AUTOMATED CHECKS
=================
[✅/❌] Lint: [result]
[✅/❌] Tests: [X/Y passing]
[✅/❌] Types: [result]
[✅/❌] Build: [result]
```

**If any fail**: Stop, fix issues, then re-run [TaskQA].

---

## STEP 3: Code Review
**Executor**: [Syntax]

### Review Against Best Practices:
```
CODE REVIEW CHECKLIST
======================

STRUCTURE & PATTERNS:
□ Follows existing project patterns
□ No unnecessary complexity
□ Single responsibility principle
□ Proper error handling
□ No duplicate code

QUALITY:
□ No hardcoded values (use config/constants)
□ No console.log/debug statements left in
□ No commented-out code blocks
□ Clear variable and function names
□ Functions are reasonably sized

PERFORMANCE:
□ No obvious N+1 queries or loops
□ Event listeners cleaned up (useEffect cleanup, etc.)
□ Images optimized
□ No unnecessary re-renders (React)
```

### Output:
```
CODE REVIEW: [APPROVED / CHANGES NEEDED]

[If changes needed, list specific items]
```

---

## STEP 4: Security Review
**Executor**: [Sentinal]

### OWASP Top 10 Check:
```
SECURITY REVIEW
================

INJECTION PREVENTION:
□ User inputs validated and sanitized
□ Parameterized queries (no string concat SQL)
□ Output properly encoded (XSS prevention)

AUTHENTICATION & SESSION:
□ Passwords hashed with strong algorithm
□ Sessions managed securely
□ No credentials in code or logs

AUTHORIZATION:
□ Access controls enforced on all routes
□ No privilege escalation paths
□ Server-side validation (don't trust client)

DATA PROTECTION:
□ Sensitive data encrypted in transit (HTTPS)
□ PII handled appropriately
□ API responses don't over-expose data

SECRETS SCAN:
□ No API keys in code
□ No database passwords in code
□ Environment variables used properly
```

### Run Security Commands:
```bash
# Scan for secrets
grep -rn "api_key\|secret\|password\|token" src/ --include="*.ts" --include="*.js"

# Check for vulnerable dependencies
npm audit

# Check security headers
curl -I http://localhost:3000 | grep -i "security\|x-frame\|content-security"
```

### Output:
```
SECURITY REVIEW: [PASSED / ISSUES FOUND]

npm audit: [0 vulnerabilities / X high, Y medium]
Secrets scan: [Clean / X potential exposures]

[If issues found, list with severity and fix instructions]
```

---

## STEP 5: Create Pull Request
**Executor**: [Flow]

### Prepare and Push:
```bash
# Ensure all changes are committed
git add .
git commit -m "feat([scope]): [description]

- [list of changes]

Task: #[ID]"

# Push branch
git push origin [branch-name]
```

### Create PR:
```bash
gh pr create \
  --title "#[ID] - [Task Title]" \
  --body "## Summary
[Brief description]

## Changes
- [Change 1]
- [Change 2]

## Testing Instructions
1. [Step 1]
2. [Step 2]
3. Expected: [result]

## Checklist
- [x] Automated tests passing
- [x] Code reviewed
- [x] Security reviewed
- [x] Responsive design verified

Closes #[ID]"
```

### Output:
```
PULL REQUEST CREATED
=====================
PR #[NUMBER]: [Title]
URL: [PR_URL]
Branch: [branch] → main
```

---

## STEP 6: Update Kanban Board
**Executor**: [Codey]

### Move Task:
```
KANBAN UPDATE
==============
Task: #[ID] - [Title]
From: Review → To: QA

Added:
- PR link: #[PR_NUMBER]
- Code Review: ✓ Passed
- Security Review: ✓ Passed
- Assignee: [Verity]
```

---

## STEP 7: Generate QA Test Brief
**Executor**: [Codey] → [Verity]

### Create Testing Document:
```
========================================
QA TEST BRIEF - Task #[ID]
========================================

TASK: [Title]
DEVELOPER: [who built it]
DATE: [today]
PR: #[PR_NUMBER]

----------------------------------------
WHAT TO TEST:
----------------------------------------
[Extract from acceptance criteria]

Test Case 1: [Scenario]
  Steps:
    1. Navigate to [page]
    2. [Action]
    3. [Action]
  Expected: [Result]

Test Case 2: [Scenario]
  Steps: ...
  Expected: ...

----------------------------------------
EDGE CASES TO VERIFY:
----------------------------------------
□ Empty state (no data)
□ Single item
□ Many items (50+)
□ Very long text content
□ Special characters: <>&"'
□ Slow network (throttle in DevTools)
□ Offline behavior

----------------------------------------
BROWSER/DEVICE MATRIX:
----------------------------------------
□ Chrome (desktop)
□ Firefox (desktop)
□ Safari (desktop)
□ Chrome (mobile)
□ Safari (iOS)

----------------------------------------
ACCESSIBILITY:
----------------------------------------
□ Keyboard navigation works
□ Screen reader announces correctly
□ Focus states visible
□ Color contrast sufficient

----------------------------------------
HOW TO ACCESS:
----------------------------------------
Local: git checkout [branch] && npm run dev
URL: http://localhost:[port]/[path]

----------------------------------------
WHEN TESTING COMPLETE:
----------------------------------------
□ All tests pass → Run [TaskStage]
□ Issues found → Add notes to card, notify developer
```

---

## STEP 8: Final Handoff Report
**Executor**: [Codey]

### Output:
```
========================================
QA HANDOFF COMPLETE
========================================

Task: #[ID] - [Title]
Status: Ready for QA Testing
Assigned: [Verity]

COMPLETED:
✅ Pre-QA checklist verified
✅ Automated checks passed
✅ Code review passed
✅ Security review passed
✅ PR created: #[NUMBER]
✅ Kanban updated
✅ Test brief generated

NEXT:
→ [Verity] begins testing
→ Developer available for questions
→ When QA passes: [TaskStage]

========================================
```

---

## DEVOPS BEST PRACTICES SUMMARY

### Before QA:
1. **Self-review** - Developer reviews own code first
2. **Automated tests** - All tests must pass
3. **Security scan** - Check for common vulnerabilities
4. **PR with context** - Explain what changed and how to test

### During QA:
1. **Test brief** - QA knows exactly what to test
2. **Environment parity** - Test in realistic conditions
3. **Document findings** - Log all issues clearly
4. **Communication** - Quick feedback loop with developer

---

## VERSION HISTORY

- v3.0.0 (2025-12-22): Updated for 7-column workflow (Review → QA)
- v2.0.0 (2025-12-22): Added security review, enhanced code review, DevOps best practices
- v1.0.0 (2025-10-12): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-22
**Maintainer**: [Codey] (TPM)
