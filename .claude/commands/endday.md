# [EndDay] - End of Day Wrap-up Automation

**Version**: 2.0.0
**Command**: `[EndDay]` or `/endday`
**Trigger**: Type at end of work session
**Purpose**: Automate end-of-day status capture, commit any work-in-progress, and prepare for next session
**Executor**: [Codey] (TPM) coordinates [Team]

---

## AUTO-EXECUTION INSTRUCTIONS

**You are now executing the [ProcessEndDay] workflow. This workflow captures daily progress, ensures no work is lost, and sets up the next day.**

---

## STEP 1: Work-in-Progress Status
**Executor**: [Codey] (Lead)

### Actions to Execute:

```bash
# 1. Check for uncommitted changes
echo "=== Uncommitted Changes ==="
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ $UNCOMMITTED -gt 0 ]; then
    echo "Found $UNCOMMITTED uncommitted files:"
    git status --short
else
    echo "No uncommitted changes"
fi

# 2. Check current branch
BRANCH=$(git branch --show-current)
echo ""
echo "=== Current Branch ==="
echo "Working on: $BRANCH"

# 3. Show today's commits
echo ""
echo "=== Today's Commits ==="
git log --oneline --since="00:00" --author="$(git config user.email)" 2>/dev/null || echo "No commits today"
```

### Report Format:
```
WORK-IN-PROGRESS STATUS:
- Current Branch: [branch_name]
- Uncommitted Files: [count]
- Today's Commits: [count]
```

---

## STEP 2: Kanban Daily Summary
**Executor**: [Codey] (Lead)

### Actions to Execute:

Read kanban file and generate summary:
```
KANBAN_FILE="[KANBAN_DEV_PATH]"

# Count cards in each column
BACKLOG_COUNT=$(grep -c 'data-id="' <(sed -n '/KANBAN_BACKLOG_START/,/KANBAN_BACKLOG_END/p' "$KANBAN_FILE"))
READY_COUNT=$(grep -c 'data-id="' <(sed -n '/KANBAN_READY_START/,/KANBAN_READY_END/p' "$KANBAN_FILE"))
IN_PROGRESS_COUNT=$(grep -c 'data-id="' <(sed -n '/KANBAN_IN_PROGRESS_START/,/KANBAN_IN_PROGRESS_END/p' "$KANBAN_FILE"))
REVIEW_COUNT=$(grep -c 'data-id="' <(sed -n '/KANBAN_REVIEW_START/,/KANBAN_REVIEW_END/p' "$KANBAN_FILE"))
QA_COUNT=$(grep -c 'data-id="' <(sed -n '/KANBAN_QA_START/,/KANBAN_QA_END/p' "$KANBAN_FILE"))
STAGING_COUNT=$(grep -c 'data-id="' <(sed -n '/KANBAN_STAGING_START/,/KANBAN_STAGING_END/p' "$KANBAN_FILE"))
DONE_COUNT=$(grep -c 'data-id="' <(sed -n '/KANBAN_DONE_START/,/KANBAN_DONE_END/p' "$KANBAN_FILE"))
```

### Daily Summary:
```
KANBAN SUMMARY:
- Backlog: [count] tasks
- Ready: [count] tasks
- In Progress: [count] tasks
- Review: [count] tasks
- QA: [count] tasks
- Staging: [count] tasks
- Done: [count] tasks

Active Work Progress: [X]% ([done]/[total active tasks])
```

---

## STEP 3: Identify Blockers
**Executor**: [Codey] (Lead)

### Actions to Execute:

```bash
# Find blocked tasks in kanban
grep -B5 'status-blocked' "$KANBAN_FILE" | grep -oP 'data-id="\K\d+'
```

### Blocker Report:
```
BLOCKERS IDENTIFIED:
- #[ID] - [Task Title] - [Blocker reason]
- None (if no blockers)

ACTION REQUIRED:
- [List any blockers that need resolution before next day]
```

---

## STEP 4: WIP Commit (Optional)
**Executor**: [Syntax] (Lead)

### Decision Logic:
```bash
if [ $UNCOMMITTED -gt 0 ]; then
    echo ""
    echo "=== WIP Commit Decision ==="
    echo "You have uncommitted changes."
    echo ""
    echo "Options:"
    echo "1. Commit as WIP (work-in-progress)"
    echo "2. Stash for later"
    echo "3. Leave uncommitted"
fi
```

### If WIP Commit Chosen:
```bash
# Stage all changes
git add .

# Create WIP commit
git commit -m "WIP: End of day save - $(date +%Y-%m-%d)

Work in progress on branch: $BRANCH

Changes include:
$(git diff --cached --stat | tail -5)

Resume with: git reset HEAD~1 (to uncommit and continue)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "WIP commit created. Tomorrow, run: git reset HEAD~1 to continue"
```

### If Stash Chosen:
```bash
git stash push -m "EOD stash $(date +%Y-%m-%d): $BRANCH"
echo "Changes stashed. Tomorrow, run: git stash pop"
```

---

## STEP 5: Tomorrow's Priorities
**Executor**: [Codey] (Lead)

### Analyze and Recommend:
```
TOMORROW'S PRIORITIES:
Based on current kanban state:

1. [Priority 1]: #[ID] - [Task Title]
   Reason: [Currently in Sprint / Blocking other work / High priority]

2. [Priority 2]: #[ID] - [Task Title]
   Reason: [Next logical task / Dependencies resolved]

3. [Priority 3]: #[ID] - [Task Title]
   Reason: [Quick win / Low effort high value]

PENDING ACTIONS:
- [Any tasks waiting on external input]
- [Any scheduled meetings or reviews]
```

---

## STEP 6: Push to Remote (Optional)
**Executor**: [Flow] (Lead)

### Decision Logic:
```bash
# Check if ahead of remote
AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")

if [ "$AHEAD" -gt 0 ]; then
    echo "You have $AHEAD unpushed commits."
    echo ""
    echo "Recommendation: Push to remote before ending day"
    echo "Command: git push origin $BRANCH"
fi
```

### If Push Chosen:
```bash
git push origin $BRANCH
echo "Changes pushed to remote. Safe for the day!"
```

---

## STEP 7: Final End-of-Day Report
**Executor**: [Codey] (Lead)

### Complete Report Template:
```
END OF DAY REPORT
==================
**Date**: [Current Date]
**Time**: [Current Time]
**Session Duration**: [If trackable]

---

TODAY'S ACCOMPLISHMENTS:

Commits Made: [count]
[List of commit messages from today]

Tasks Completed:
- #[ID] - [Task Title] (if any moved to Done today)

Tasks Progressed:
- #[ID] - [Task Title] - [Current status]

---

WORK-IN-PROGRESS:

Current Branch: [branch_name]
Status: [WIP committed / Stashed / Uncommitted changes]

Uncommitted Files: [count]
[If any, list them]

Resume Tomorrow:
- [Command to resume: git reset HEAD~1 / git stash pop / continue as-is]

---

KANBAN STATUS:

| Column      | Count |
|-------------|-------|
| Backlog     | [X]   |
| Ready       | [X]   |
| In Progress | [X]   |
| Review      | [X]   |
| QA          | [X]   |
| Staging     | [X]   |
| Done        | [X]   |

Active Work Progress: [X]%

---

BLOCKERS:

[List any blockers, or "None"]

---

TOMORROW'S PLAN:

Priority 1: #[ID] - [Task Title]
Priority 2: #[ID] - [Task Title]
Priority 3: #[ID] - [Task Title]

---

REMINDERS:

- [ ] Push any local commits
- [ ] Update kanban if manual updates needed
- [ ] Check for pending code reviews
- [ ] Respond to any blocked teammates

---

**Session Status**: WRAPPED UP
**Next Action**: Run [StartDay] tomorrow morning

Have a great evening!
```

---

## ERROR HANDLING

### If git repository not found:
```
WARNING: Not in a git repository

Actions performed:
- Kanban summary generated
- No git status available

Recommendation: Navigate to project root before running [EndDay]
```

### If kanban file not found:
```
WARNING: Kanban board not found at [KANBAN_DEV_PATH]

Actions performed:
- Git status captured
- No kanban summary available

Check: Verify path in placeholders.json
```

---

## APPROVAL LEVEL

**Category**: `auto_execute` (routine operational task)
**No [PRODUCT_OWNER] approval required**

Reference: `/.autopilot/config/approval-levels.json`

---

## CONFIGURATION

### Customize for your project:
```json
{
  "end_day": {
    "auto_wip_commit": false,
    "auto_push": false,
    "stash_preference": "prompt"
  }
}
```

---

## TESTING

### Test this command:
1. Make some uncommitted changes
2. Type `[EndDay]`
3. Verify:
   - WIP status captured
   - Kanban summary generated
   - Tomorrow's priorities listed
   - Options for WIP handling presented

### Expected execution time: 10-15 seconds

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-01-01
**Maintainer**: [Codey] (TPM)

---

*This command ensures no work is lost and sets you up for a productive tomorrow. Trust the process!*
