# [TaskStart] - Begin Work on Task

**Version**: 2.0.0
**Command**: `[TaskStart]` or `/taskstart`
**Trigger**: When starting work on a task from Ready column
**Purpose**: Move task to In Progress, create feature branch, set up for development
**Executor**: [Codey] (Lead), [Flow] (Support), [Syntax] (Support)

---

## AUTO-EXECUTION INSTRUCTIONS

When user says "start task #X" or "[TaskStart] #X", execute this workflow.

---

## STEP 1: Validate Task Selection
**Executor**: [Codey]

### Actions:
1. Read kanban board
2. Find task in Ready column
3. Verify no other tasks currently in In Progress (WIP limit)

### Check:
```
IF task not in Ready:
   → "Task #[ID] is not in Ready. It's currently in [column]."

IF another task already in In Progress:
   → "You already have #[ID] in progress.
      Complete that first, or move it back to Ready?"
```

### Output:
```
STARTING TASK
==============
#[ID] - [Title]
Priority: [priority]
Description: [description]

Proceed? (yes/no)
```

---

## STEP 2: Create Feature Branch
**Executor**: [Flow]

### DevOps Best Practice:
- Always work on a feature branch, never directly on main
- Branch naming convention: `feature/[task-id]-short-description`

### Actions:
```bash
# Ensure we're on main and up to date
git checkout main
git pull origin main

# Create feature branch
BRANCH_NAME="feature/[task-id]-[short-title-slug]"
git checkout -b $BRANCH_NAME

# Push branch to remote (establishes tracking)
git push -u origin $BRANCH_NAME
```

### Output:
```
BRANCH CREATED
===============
Branch: feature/[task-id]-[description]
Based on: main (latest)

Ready to develop!
```

---

## STEP 3: Update Kanban Board
**Executor**: [Codey]

### Actions:
1. Move task card from "Ready" to "In Progress"
2. Add start date to card
3. Assign to current developer

### Kanban Update:
```html
<!-- Move card to In Progress column -->
<!-- Update card metadata -->
<div class="card" data-task-id="[ID]" data-status="in-progress" data-started="[DATE]">
```

---

## STEP 4: Development Environment Check
**Executor**: [Flow]

### Verify:
```bash
# Dependencies installed?
[ -d "node_modules" ] || npm install

# Local server running?
# Dev database accessible?
# Environment variables set?
```

### Output:
```
ENVIRONMENT READY
==================
✅ Dependencies installed
✅ Local server: http://localhost:[port]
✅ Database connected
✅ Branch: feature/[task-id]-[description]

Begin development!
```

---

## STEP 5: Task Context Summary
**Executor**: [Codey]

### Provide to Developer:
```
TASK CONTEXT
=============
Task: #[ID] - [Title]
Branch: feature/[task-id]-[description]
Started: [timestamp]

ACCEPTANCE CRITERIA:
- [List from card description]

RELATED FILES:
- [Identify likely files to modify based on task]

NEXT STEPS:
1. Implement the feature/fix
2. Write/update tests
3. Self-review code
4. When ready, run [TaskReview] to submit for code review

Happy coding!
```

---

## DEVOPS BEST PRACTICES - DURING DEVELOPMENT

### Commit Frequently:
```bash
# Small, atomic commits with clear messages
git commit -m "feat(auth): add login form validation"
git commit -m "fix(api): handle null user response"
git commit -m "test(auth): add login flow tests"
```

### Commit Message Format:
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scope: component or area affected
Description: imperative mood, lowercase, no period
```

### Keep Branch Updated:
```bash
# Periodically sync with main to avoid conflicts
git fetch origin main
git rebase origin/main
```

### Before Moving to QA:
- [ ] All acceptance criteria met
- [ ] Code self-reviewed
- [ ] Tests written and passing
- [ ] No console errors or warnings
- [ ] Works on target browsers/devices

---

## VERSION HISTORY

- v2.0.0 (2025-12-22): Updated for 7-column workflow (Ready → In Progress)
- v1.0.0 (2025-12-22): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-22
**Maintainer**: [Codey] (TPM)
