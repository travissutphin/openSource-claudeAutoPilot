# [TaskStage] - Staging Deployment Automation

**Version**: 2.0.0
**Command**: `[TaskStage]` or `/taskstage`
**Trigger**: Type when QA is complete and ready for staging deployment
**Purpose**: Automate deployment to staging environment with verification
**Executor**: [Flow] (DevOps Lead), [Sentinal] (Security Support)

---

## AUTO-EXECUTION INSTRUCTIONS

**You are now executing the [ProcessTaskStage] workflow. This workflow moves task from QA to Staging and triggers staging deployment.**

---

## STEP 1: Identify Task and Validate QA Status
**Executor**: [Codey] (Lead)

### Actions to Execute:

```bash
# Get task ID
BRANCH=$(git branch --show-current)
TASK_ID=$(echo "$BRANCH" | grep -oP '#?\K\d+')

# Verify task is in QA column
KANBAN_FILE="[KANBAN_DEV_PATH]"
CURRENT_COLUMN=$(grep -B20 "data-id=\"$TASK_ID\"" "$KANBAN_FILE" | grep -oP "KANBAN_\K[A-Z]+(?=_START)")

if [ "$CURRENT_COLUMN" != "QA" ]; then
    echo "ERROR: Task #$TASK_ID is not in QA column (current: $CURRENT_COLUMN)"
    exit 1
fi
```

### Report Format:
```
TASK VERIFICATION:
- Task ID: #[ID]
- Title: [Task Title]
- QA Tester: [Verity]
- Current Status: QA (Passed)
- Moving to: Staging
```

---

## STEP 2: Pre-Deployment Security Check
**Executor**: [Sentinal] (Lead)

### Security Scan Actions:
```bash
# 1. Check for exposed secrets
echo "Scanning for exposed secrets..."
grep -rn --include="*.php" --include="*.js" --include="*.ts" \
  -E "(api[_-]?key|secret|password|token)\s*=\s*['\"][^'\"]{8,}" . \
  --exclude-dir=node_modules --exclude-dir=vendor

# 2. Check for debug code
echo "Checking for debug code..."
grep -rn --include="*.php" --include="*.js" \
  -E "(console\.log|var_dump|print_r|dd\()" . \
  --exclude-dir=node_modules --exclude-dir=vendor

# 3. Verify .env is not staged
git diff --cached --name-only | grep -E "\.env$|credentials|secrets"
```

### Security Report:
```
SECURITY PRE-CHECK:
[ ] No exposed API keys or secrets
[ ] No debug statements in production code
[ ] No sensitive files staged for commit
[ ] Dependencies security scan passed
```

---

## STEP 3: Update Kanban Board
**Executor**: [Codey] (Lead)

### Actions to Execute:
```bash
node /.autopilot/automation/kanban-updater.js \
  --task-id="$TASK_ID" \
  --from-column="qa" \
  --to-column="staging" \
  --status="staged" \
  --add-note="Deployed to staging: $(date +%Y-%m-%d) | QA: [Verity] | Deploy: [Flow]"

if [ $? -eq 0 ]; then
    echo "Kanban updated: Task #$TASK_ID moved to Staging"
fi
```

---

## STEP 4: Deploy to Staging
**Executor**: [Flow] (Lead)

### Deployment Actions:

**Option A: Git-based Staging (push to staging branch)**
```bash
# Ensure all changes committed
git status --porcelain

# Merge to staging branch
git checkout staging
git merge $BRANCH --no-edit
git push origin staging

# Return to feature branch
git checkout $BRANCH

echo "Deployed to staging branch"
```

**Option B: Manual Staging Deploy**
```bash
# If using deployment platform (Railway, Vercel, etc.)
echo "Manual deployment required"
echo "Action: Deploy current branch to staging environment"
echo "Platform: [DEPLOYMENT_PLATFORM]"
```

### Deployment Verification:
```bash
# Wait for deployment to complete
sleep 30

# Health check staging URL
STAGING_URL="[STAGING_URL]"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "Staging health check: PASSED (HTTP $HTTP_STATUS)"
else
    echo "WARNING: Staging health check returned HTTP $HTTP_STATUS"
fi
```

---

## STEP 5: Staging Verification Checklist
**Executor**: [Verity] (Lead), [Flow] (Support)

### Auto-Generated Verification:
```markdown
## STAGING VERIFICATION - Task #[ID]

**Staging URL**: [STAGING_URL]
**Deployed**: [Date & Time]
**Deployer**: [Flow]

### Quick Verification
- [ ] Page loads without errors
- [ ] Feature functions as expected
- [ ] No console errors
- [ ] No visual regressions

### Performance Check
- [ ] Page load time acceptable
- [ ] No blocking resources
- [ ] Images optimized

### Environment Verification
- [ ] Correct environment variables loaded
- [ ] Database connections working
- [ ] External APIs responding

### Ready for Production?
- [ ] All checks passed
- [ ] Stakeholder preview completed (if needed)
- [ ] Rollback plan documented
```

---

## STEP 6: Log Deployment
**Executor**: [Flow] (Lead)

### Update Deployment History:
```bash
DEPLOY_LOG="[DOCS_ROOT]/deployment/deployment-history.md"

{
    echo ""
    echo "### $(date '+%Y-%m-%d %H:%M:%S') - Staging Deployment"
    echo "**Task**: #$TASK_ID - $TASK_TITLE"
    echo "**Branch**: $BRANCH"
    echo "**QA By**: [Verity]"
    echo "**Deployed By**: [Flow]"
    echo "**Staging URL**: [STAGING_URL]"
    echo "**Status**: Deployed"
    echo ""
} >> "$DEPLOY_LOG"
```

---

## STEP 7: Git Commit
**Executor**: [Codey] (Lead)

### Actions to Execute:
```bash
git add "[KANBAN_DEV_PATH]"
git add "[DOCS_ROOT]/deployment/deployment-history.md" 2>/dev/null || true

git commit -m "chore: deploy task #$TASK_ID to staging

Automated by [ProcessTaskStage]

Changes:
- Moved task #$TASK_ID from QA to Staging
- Deployed to staging environment
- Updated deployment history

QA approved by: [Verity]
Deployed by: [Flow]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## STEP 8: Final Report
**Executor**: [Codey] (Lead)

### Complete Report Template:
```
STAGING DEPLOYMENT COMPLETE
============================
**Task ID**: #[ID]
**Title**: [Task Title]
**Staging URL**: [STAGING_URL]
**Deployed**: [Date & Time]

---

DEPLOYMENT SUMMARY:

Pre-Deployment:
   - [X] QA verification passed
   - [X] Security scan completed
   - [X] No exposed secrets

Deployment:
   - [X] Kanban moved to Staging
   - [X] Code deployed to staging
   - [X] Health check passed (HTTP 200)
   - [X] Deployment logged

---

STAGING VERIFICATION:

URL: [STAGING_URL]
Status: LIVE on staging

Quick Test:
1. Visit [STAGING_URL]/[path]
2. Verify [primary feature]
3. Check browser console for errors

---

NEXT STEPS:

For [PRODUCT_OWNER]:
1. Preview changes at staging URL
2. Approve for production when ready

For [Flow]:
1. Monitor staging for issues
2. When approved, run [TaskComplete] for production deploy

For [Verity]:
1. Final verification on staging
2. Report any environment-specific issues

---

**Automation Status**: SUCCESS
**Rollback Command**: git revert [commit-hash]
```

---

## ERROR HANDLING

### If task not in QA:
```
ERROR: Task #[ID] must complete QA before staging

Current status: [Column Name]

Action Required:
- Complete QA testing first
- Use [TaskQA] to move to QA column
- Have [Verity] approve before staging
```

### If security scan fails:
```
SECURITY BLOCK: Deployment halted

Issues Found:
[List of security issues]

Action Required:
1. Fix security issues
2. Commit changes
3. Re-run QA if significant changes
4. Re-attempt [TaskStage]

Contact [Sentinal] for security review if needed.
```

### If staging deployment fails:
```
DEPLOYMENT FAILED

Error: [Error message]

Possible causes:
- Build failure
- Environment configuration issue
- Network/platform issue

Action Required:
1. Check deployment logs
2. Verify environment variables
3. Contact [Flow] for DevOps support
```

---

## APPROVAL LEVEL

**Category**: `auto_execute` (routine deployment with security checks)
**No [PRODUCT_OWNER] approval required for staging**
**Production deployment requires separate approval**

Reference: `/.autopilot/config/approval-levels.json`

---

## CONFIGURATION

### Customize for your project:
```json
{
  "environments": {
    "staging_url": "https://staging.yoursite.com",
    "staging_branch": "staging"
  },
  "deployment": {
    "platform": "Railway|Vercel|Heroku|Manual",
    "health_check_path": "/"
  }
}
```

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-22
**Maintainer**: [Flow] (DevOps)
