# [TaskReview] - Submit for Code Review

**Version**: 1.0.0
**Command**: `[TaskReview]` or `/taskreview`
**Trigger**: When development is complete, ready for code review
**Purpose**: Create PR, move to Review column, assign reviewer
**Executor**: [Syntax] (Lead), [Codey] (Support)

---

## AUTO-EXECUTION INSTRUCTIONS

When user says "ready for review" or "[TaskReview]", execute this workflow.

---

## STEP 1: Pre-Review Developer Checklist
**Executor**: [Syntax]

### Verify with Developer:
```
PRE-REVIEW CHECKLIST
====================

Before submitting for review, confirm these items:

□ All acceptance criteria implemented
□ Code compiles/runs without errors
□ Self-review completed (read your own code)
□ No console.log/debug statements left
□ No commented-out code blocks
□ Variable and function names are clear
□ Edge cases handled

All items complete? (yes / tell me what's missing)
```

If items missing, pause and address before proceeding.

---

## STEP 2: Commit and Push Changes
**Executor**: [Flow]

### Actions:
```bash
# Ensure all changes are committed
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat([scope]): [description]

- [list of changes]

Task: #[ID]"

# Push to remote
git push origin [branch-name]
```

---

## STEP 3: Create Pull Request
**Executor**: [Flow]

### Create PR:
```bash
gh pr create \
  --title "#[ID] - [Task Title]" \
  --body "## Summary
[Brief description of what this PR does]

## Changes
- [Change 1]
- [Change 2]
- [Change 3]

## How to Test
1. Checkout this branch
2. [Step to test]
3. Expected: [result]

## Screenshots (if UI changes)
[Add screenshots if applicable]

## Checklist
- [ ] Code compiles without errors
- [ ] Self-review completed
- [ ] Ready for code review

Closes #[ID]"
```

### Output:
```
PULL REQUEST CREATED
====================
PR #[NUMBER]: [Title]
URL: [PR_URL]
Branch: [branch] → main
```

---

## STEP 4: Update Kanban Board
**Executor**: [Codey]

### Move Task:
```
KANBAN UPDATE
==============
Task: #[ID] - [Title]
From: In Progress → To: Review

Added:
- PR link: #[PR_NUMBER]
- Reviewer assigned: [Syntax]
- Status: Awaiting Review
```

---

## STEP 5: Assign Reviewer
**Executor**: [Codey]

### Notify Reviewer:
```
CODE REVIEW REQUEST
===================

Task: #[ID] - [Title]
PR: #[PR_NUMBER]
Developer: [who built it]
Branch: [branch-name]

REVIEW FOCUS:
- Code quality and patterns
- Error handling
- Performance considerations
- Security implications

Please review and provide feedback.
When approved, developer should run [TaskQA].
```

---

## STEP 6: Final Report
**Executor**: [Codey]

### Output:
```
REVIEW HANDOFF COMPLETE
=======================

Task: #[ID] - [Title]
Status: Ready for Code Review
Assigned: [Syntax]

COMPLETED:
✅ Pre-review checklist verified
✅ Changes committed and pushed
✅ PR created: #[NUMBER]
✅ Kanban updated (In Progress → Review)
✅ Reviewer assigned

NEXT:
→ [Syntax] reviews code
→ Address feedback if needed
→ When approved: [TaskQA]

PR URL: [PR_URL]
```

---

## DEVOPS BEST PRACTICES

### Before Review:
1. **Self-review** - Read your own code first
2. **Small PRs** - Keep changes focused and reviewable
3. **Clear description** - Explain what and why
4. **Test locally** - Ensure it works before review

### During Review:
1. **Respond promptly** - Address feedback quickly
2. **Discuss, don't defend** - Be open to suggestions
3. **Learn from feedback** - Apply lessons to future code

---

## VERSION HISTORY

- v1.0.0 (2025-12-22): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-22
**Maintainer**: [Codey] (TPM)
