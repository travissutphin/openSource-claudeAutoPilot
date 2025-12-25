# [DeployLive] - Production Deployment Automation

**Version**: 1.0.0
**Command**: `[DeployLive]` or `/deploylive`
**Type**: SITE-SPECIFIC (customize per project)
**Trigger**: Type when staging is verified and ready for production
**Purpose**: Automate production deployment with safety checks
**Executor**: [Flow] (DevOps Lead), [Sentinal] (Security), [Verity] (QA)

---

## APPROVAL REQUIRED

**This command requires [PRODUCT_OWNER] approval before production deployment.**

---

## AUTO-EXECUTION INSTRUCTIONS

**You are now executing the Production Deployment workflow. This deploys verified staging changes to production.**

---

## STEP 1: Pre-Deployment Verification
**Executor**: [Flow] (Lead), [Sentinal] (Support)

### Pre-Flight Checks:
```bash
echo "=== PRE-DEPLOYMENT VERIFICATION ==="

# 1. Verify on correct branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "[DEPLOY_BRANCH]" ]; then
    echo "ERROR: Not on deployment branch. Current: $BRANCH"
    exit 1
fi

# 2. Check for uncommitted changes
UNCOMMITTED=$(git status --porcelain | wc -l)
if [ $UNCOMMITTED -gt 0 ]; then
    echo "ERROR: Uncommitted changes found"
    git status --short
    exit 1
fi

# 3. Verify synced with remote
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "ERROR: Branch not synced with remote"
    exit 1
fi

# 4. Verify staging was tested
echo "Staging URL: [STAGING_URL]"
STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "[STAGING_URL]")
if [ "$STAGING_STATUS" != "200" ]; then
    echo "WARNING: Staging not responding (HTTP $STAGING_STATUS)"
fi

echo "Pre-flight checks PASSED"
```

---

## STEP 2: Security Scan
**Executor**: [Sentinal] (Lead)

### Security Checklist:
```bash
echo "=== SECURITY SCAN ==="

# 1. Scan for exposed secrets
echo "Scanning for exposed secrets..."
SECRETS_FOUND=$(grep -rn --include="*.php" --include="*.js" \
    -E "(api[_-]?key|secret|password|token)\s*=\s*['\"][^'\"]{8,}" . \
    --exclude-dir=node_modules --exclude-dir=vendor | wc -l)

if [ $SECRETS_FOUND -gt 0 ]; then
    echo "CRITICAL: Potential secrets exposed!"
    grep -rn --include="*.php" --include="*.js" \
        -E "(api[_-]?key|secret|password|token)\s*=\s*['\"]" . \
        --exclude-dir=node_modules --exclude-dir=vendor
    exit 1
fi

# 2. Check for debug code
DEBUG_FOUND=$(grep -rn --include="*.php" --include="*.js" \
    -E "(console\.log|var_dump|print_r|dd\(|debugger)" . \
    --exclude-dir=node_modules --exclude-dir=vendor | wc -l)

if [ $DEBUG_FOUND -gt 0 ]; then
    echo "WARNING: Debug code found ($DEBUG_FOUND instances)"
    echo "Review before deploying"
fi

# 3. Verify .env not in git
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "CRITICAL: .env file is tracked in git!"
    exit 1
fi

echo "Security scan PASSED"
```

### Security Report:
```
SECURITY PRE-DEPLOYMENT:
========================
[ ] No exposed API keys or secrets
[ ] No debug statements (or approved exceptions)
[ ] .env file not tracked
[ ] Dependencies updated and secure
[ ] HTTPS configured
[ ] Security headers present
```

---

## STEP 3: Create Deployment Backup
**Executor**: [Flow] (Lead)

### Backup Actions:
```bash
echo "=== CREATING BACKUP ==="

BACKUP_DIR="[BACKUP_PATH]/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Record current state
git rev-parse HEAD > "$BACKUP_DIR/git_hash.txt"
git log -1 > "$BACKUP_DIR/git_log.txt"

# Create deployment manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "branch": "$BRANCH",
    "commit": "$(git rev-parse HEAD)",
    "deployer": "[DEPLOYER_NAME]",
    "type": "production"
}
EOF

echo "Backup created at: $BACKUP_DIR"
```

---

## STEP 4: Deploy to Production
**Executor**: [Flow] (Lead)

### Deployment Options:

**Option A: Git-based Deploy (push to main)**
```bash
echo "=== DEPLOYING TO PRODUCTION ==="

# Merge to main
git checkout main
git merge $BRANCH --no-edit
git push origin main

# Tag the release
VERSION="v$(date +%Y.%m.%d)"
git tag -a "$VERSION" -m "Production release $VERSION"
git push origin "$VERSION"

# Return to working branch
git checkout $BRANCH

echo "Deployed to main branch and tagged as $VERSION"
```

**Option B: Platform Deploy (Railway, Vercel, etc.)**
```bash
# Platform-specific deployment
# Railway example:
railway up --environment production

# Vercel example:
vercel --prod

# Netlify example:
netlify deploy --prod
```

**Option C: FTP/SFTP Deploy**
```bash
# SFTP sync (example)
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.env' \
    ./public/ user@server:/var/www/html/
```

---

## STEP 5: Post-Deployment Verification
**Executor**: [Verity] (Lead), [Flow] (Support)

### Health Checks:
```bash
echo "=== POST-DEPLOYMENT VERIFICATION ==="

# Wait for deployment to propagate
echo "Waiting 30 seconds for deployment..."
sleep 30

# 1. Homepage check
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "[PRODUCTION_URL]")
echo "Homepage: HTTP $PROD_STATUS"

# 2. Key pages check
PAGES=("/" "/about" "/services" "/contact" "/blog")
for PAGE in "${PAGES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "[PRODUCTION_URL]$PAGE")
    echo "  $PAGE: HTTP $STATUS"
done

# 3. SSL check
SSL_EXPIRY=$(echo | openssl s_client -connect [DOMAIN]:443 2>/dev/null | openssl x509 -noout -enddate)
echo "SSL Certificate: $SSL_EXPIRY"

# 4. Response time
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "[PRODUCTION_URL]")
echo "Response time: ${RESPONSE_TIME}s"
```

### Verification Checklist:
```
POST-DEPLOYMENT CHECKS:
=======================
[ ] Homepage loads (HTTP 200)
[ ] All key pages accessible
[ ] SSL certificate valid
[ ] Response time acceptable (<3s)
[ ] No console errors
[ ] Forms functional
[ ] Images loading
[ ] Analytics tracking
```

---

## STEP 6: Update Kanban & Logs
**Executor**: [Codey] (Lead)

### Move Tasks to Done:
```bash
# Get all tasks in Staged column
STAGED_TASKS=$(grep -oP 'data-id="\K\d+' <(sed -n '/KANBAN_STAGED_START/,/KANBAN_STAGED_END/p' "$KANBAN_FILE"))

# Move each to Done
for TASK_ID in $STAGED_TASKS; do
    node /docs-framework/automation/kanban-updater.js \
      --task-id="$TASK_ID" \
      --from-column="staged" \
      --to-column="done" \
      --status="completed" \
      --add-note="DEPLOYED: $(date +%Y-%m-%d) | Version: $VERSION"
done
```

### Update Deployment History:
```bash
DEPLOY_LOG="[DOCS_ROOT]/deployment/deployment-history.md"

{
    echo ""
    echo "## $(date '+%Y-%m-%d %H:%M:%S') - Production Deployment"
    echo ""
    echo "**Version**: $VERSION"
    echo "**Branch**: $BRANCH"
    echo "**Commit**: $(git rev-parse HEAD)"
    echo "**Deployer**: [Flow]"
    echo ""
    echo "**Tasks Deployed**:"
    for TASK_ID in $STAGED_TASKS; do
        echo "- #$TASK_ID"
    done
    echo ""
    echo "**Status**: SUCCESS"
    echo ""
    echo "---"
} >> "$DEPLOY_LOG"
```

---

## STEP 7: Notifications
**Executor**: [Codey] (Lead)

### Notify Team:
```
PRODUCTION DEPLOYMENT NOTIFICATION
===================================

[Team], production deployment completed successfully.

**Version**: [VERSION]
**URL**: [PRODUCTION_URL]
**Deployed**: [Date & Time]
**Deployer**: [Flow]

**Changes Deployed**:
- #[TASK_ID] - [Task Title]
- #[TASK_ID] - [Task Title]

**Verification**:
- Homepage: [OK]
- Key Pages: [OK]
- SSL: [Valid]
- Performance: [X.Xs response]

Please report any issues immediately to [Flow] or [Sentinal].
```

---

## STEP 8: Final Report
**Executor**: [Codey] (Lead)

### Deployment Report:
```
PRODUCTION DEPLOYMENT COMPLETE
===============================

Deployment Details:
- Version: [VERSION]
- Commit: [COMMIT_HASH]
- Branch: [BRANCH]
- Deployer: [Flow]
- Timestamp: [Date & Time]

Pre-Deployment:
[X] Branch synced
[X] No uncommitted changes
[X] Security scan passed
[X] Staging verified

Deployment:
[X] Code pushed to production
[X] Release tagged: [VERSION]
[X] Backup created

Post-Deployment:
[X] Health checks passed
[X] All pages accessible
[X] SSL valid
[X] Performance acceptable

Kanban:
[X] [COUNT] tasks moved to Done
[X] Deployment history updated

---

Production URL: [PRODUCTION_URL]
Rollback Command: git revert [COMMIT_HASH]
Backup Location: [BACKUP_PATH]

---

**Deployment Status**: SUCCESS
**Next Action**: Monitor for 24 hours
```

---

## ROLLBACK PROCEDURE

### If Issues Found:
```bash
# Option 1: Revert last commit
git revert HEAD --no-edit
git push origin main

# Option 2: Reset to previous tag
git checkout main
git reset --hard [PREVIOUS_TAG]
git push origin main --force

# Option 3: Restore from backup
# (Platform-specific restore procedure)
```

### Rollback Checklist:
```
ROLLBACK EXECUTED:
==================
[ ] Issue identified and documented
[ ] Rollback deployed
[ ] Production verified working
[ ] Team notified
[ ] Post-mortem scheduled
```

---

## ERROR HANDLING

### If deployment fails:
```
DEPLOYMENT FAILED
=================

Error: [Error message]

Immediate Actions:
1. Do NOT retry without understanding cause
2. Check deployment logs
3. Verify configuration
4. Contact [Flow] for DevOps support

Staging remains valid - no production impact.
```

### If post-deployment checks fail:
```
POST-DEPLOYMENT FAILURE
=======================

Failed Checks:
- [List failed checks]

Recommended Action:
1. Initiate rollback: [rollback command]
2. Investigate root cause
3. Fix and re-deploy through staging

Contact [Flow] immediately.
```

---

## CONFIGURATION

```json
{
  "deployment": {
    "production_url": "[PRODUCTION_URL]",
    "staging_url": "[STAGING_URL]",
    "deploy_branch": "main",
    "platform": "Railway|Vercel|Manual",
    "backup_path": "/backups",
    "health_check_pages": ["/", "/about", "/services"],
    "notify_on_deploy": true,
    "require_approval": true
  }
}
```

---

**Command Status**: SITE-SPECIFIC TEMPLATE
**Requires Approval**: Yes - [PRODUCT_OWNER]
**Last Updated**: 2025-01-01
**Maintainer**: [Flow] (DevOps)
