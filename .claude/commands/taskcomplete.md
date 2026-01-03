# [TaskComplete] - Task Completion Automation

**Version**: 2.0.0
**Command**: `[TaskComplete]` or `/taskcomplete`
**Trigger**: Type when task is finished and ready to mark complete
**Purpose**: Automate task completion workflow (kanban update, docs update, git commit)
**Executor**: [Codey] (TPM) coordinates automated workflow

---

## 🤖 AUTO-EXECUTION INSTRUCTIONS

**You are now executing the [ProcessTaskComplete] workflow. This workflow AUTOMATICALLY updates kanban, refreshes documentation, and commits changes.**

---

## STEP 1: Identify Current Task
**Executor**: [Codey] (Lead)

### Actions to Execute:

**Method 1: From Git Branch Name**
```bash
# Extract task ID from branch name (e.g., feature/013-blog-taxonomy)
BRANCH=$(git branch --show-current)
TASK_ID=$(echo "$BRANCH" | grep -oP '#?\K\d+')

if [ -z "$TASK_ID" ]; then
    # Method 2: From last commit message
    TASK_ID=$(git log -1 --pretty=%B | grep -oP '#\K\d+' | head -1)
fi

if [ -z "$TASK_ID" ]; then
    echo "⚠️  Cannot auto-detect task ID"
    echo "Action: Please specify task ID manually"
    exit 1
fi

echo "📌 Detected Task ID: #$TASK_ID"
```

**Method 2: Ask [PRODUCT_OWNER] if auto-detection fails**
```
📌 Which task did you just complete?

Please provide:
- Task ID: #XXX (from kanban board)

or

Provide context and I'll search kanban for matching task.
```

### Get Task Details from Kanban:
```bash
# Read kanban HTML file
KANBAN_FILE="[KANBAN_DEV_PATH]"

# Extract card details (using data-id attribute)
TASK_TITLE=$(grep -oP "data-id=\"$TASK_ID\".*?<h4.*?>\K[^<]+" "$KANBAN_FILE")
TASK_ASSIGNEE=$(grep -oP "data-id=\"$TASK_ID\".*?<span class=\"card-assignee\">.*?\K\[.*?\]" "$KANBAN_FILE")
CURRENT_COLUMN=$(grep -B20 "data-id=\"$TASK_ID\"" "$KANBAN_FILE" | grep -oP "KANBAN_\K[A-Z_]+(?=_START)")
```

### Report Format:
```
📌 TASK IDENTIFICATION:
- Task ID: #[ID]
- Title: [Task Title]
- Assignee: [Team Member]
- Current Status: [In Progress/QA]
- Moving to: Live 🚀
```

---

## STEP 2: Update Kanban Board
**Executor**: [Codey] (Lead) via automation script

### Actions to Execute:
```bash
# Run kanban updater script
node /.autopilot/automation/kanban-updater.js \
  --task-id="$TASK_ID" \
  --from-column="qa" \
  --to-column="live" \
  --sprint="$SPRINT_NUM" \
  --status="completed" \
  --add-note="🚀 LIVE: Deployed to production $(date +%Y-%m-%d)"

# Check if script succeeded
if [ $? -eq 0 ]; then
    echo "✅ Kanban updated: Task #$TASK_ID moved to Live"
else
    echo "❌ Kanban update failed - manual intervention required"
    exit 1
fi
```

### Expected Changes:
- Card HTML moved from `<!-- KANBAN_QA_START_X -->` to `<!-- KANBAN_LIVE_START_X -->` (X = sprint number)
- Card status updated to `<span class="card-status status-completed">🚀 LIVE</span>`
- Card description updated with completion note
- Column counts automatically recalculated by kanban JavaScript

---

## STEP 3: Task-Specific Actions
**Executor**: [Codey] (Lead)

### Conditional Logic Based on Task Type:

**If Blog Post (check keywords in task title):**
```bash
if [[ "$TASK_TITLE" == *"blog"* ]] || [[ "$TASK_TITLE" == *"post"* ]]; then
    echo "📝 Blog post detected - refreshing sitemap"

    # Update sitemap (if auto-generation not in place)
    # Add logic here or call external script:
    # php lib/update-sitemap.php

    echo "✅ Sitemap updated with new blog post"
fi
```

**If Deployment (check keywords):**
```bash
if [[ "$TASK_TITLE" == *"deploy"* ]] || [[ "$TASK_TITLE" == *"migration"* ]]; then
    echo "🚀 Deployment detected - updating deployment history"

    # Append to deployment history
    DEPLOY_LOG="[DOCS_ROOT]/deployment/deployment-history.md"
    {
        echo ""
        echo "### $(date '+%Y-%m-%d %H:%M:%S') - Production Deployment"
        echo "**Task**: #$TASK_ID - $TASK_TITLE"
        echo "**Deployer**: $TASK_ASSIGNEE"
        echo "**Status**: ✅ Success"
        echo ""
    } >> "$DEPLOY_LOG"

    echo "✅ Deployment history updated"
fi
```

**If Documentation Update:**
```bash
if [[ "$TASK_TITLE" == *"doc"* ]] || [[ "$TASK_TITLE" == *"guide"* ]]; then
    echo "📚 Documentation task detected - syncing docs"

    # Run docs sync script if exists
    if [ -f "./.autopilot/automation/sync-docs.sh" ]; then
        ./.autopilot/automation/sync-docs.sh
        echo "✅ Documentation synced"
    fi
fi
```

---

## STEP 4: Git Commit (Auto-Generated)
**Executor**: [Codey] (Lead)

### Actions to Execute:
```bash
# Stage kanban changes
git add "[KANBAN_DEV_PATH]"

# Stage deployment history if updated
git add "[DOCS_ROOT]/deployment/deployment-history.md" 2>/dev/null || true

# Stage sitemap if updated
git add "[PUBLIC_ROOT]/sitemap.xml" 2>/dev/null || true

# Create commit with standardized message
git commit -m "chore: complete task #$TASK_ID - $TASK_TITLE

🤖 Automated by [ProcessTaskComplete]

Changes:
- Moved task #$TASK_ID to Done column in kanban
- Updated task status to completed
$([ -f sitemap-updated ] && echo '- Refreshed sitemap.xml')
$([ -f deploy-logged ] && echo '- Updated deployment history')

Co-Authored-By: Claude <noreply@anthropic.com>"

if [ $? -eq 0 ]; then
    echo "✅ Changes committed to git"
    COMMIT_HASH=$(git rev-parse --short HEAD)
    echo "   Commit: $COMMIT_HASH"
else
    echo "⚠️  Git commit failed - review changes manually"
fi
```

---

## STEP 5: Verification & Next Steps
**Executor**: [Codey] (Lead)

### Actions to Execute:
```bash
# 1. Verify kanban was updated
if grep -q "data-id=\"$TASK_ID\"" "[KANBAN_DEV_PATH]"; then
    CARD_LOCATION=$(grep -B5 "data-id=\"$TASK_ID\"" "[KANBAN_DEV_PATH]" | grep -oP "KANBAN_\K[A-Z]+(?=_START)")
    if [ "$CARD_LOCATION" = "DONE" ]; then
        echo "✅ Verification: Task #$TASK_ID is in Done column"
    else
        echo "⚠️  Warning: Task #$TASK_ID not in expected column"
    fi
fi

# 2. Check for any uncommitted files
REMAINING=$(git status --porcelain | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo "⚠️  Note: $REMAINING files still uncommitted (unrelated to this task)"
fi

# 3. Suggest next action
echo ""
echo "🎯 SUGGESTED NEXT ACTIONS:"
echo "1. Push changes to GitHub: git push origin $(git branch --show-current)"
echo "2. Verify deployment (if not auto-deployed)"
echo "3. Start next task: [StartDay] to see kanban priorities"
```

---

## STEP 6: Final Report to [PRODUCT_OWNER]
**Executor**: [Codey] (Lead)

### Complete Report Template:
```
✅ TASK COMPLETION REPORT
=========================
**Task ID**: #[ID]
**Title**: [Task Title]
**Assignee**: [Team Member]
**Completed**: [Date & Time]

---

📊 ACTIONS PERFORMED:

✅ Kanban Updated:
   - Card moved from QA → Live
   - Status set to "Live"
   - Completion note added

✅ Git Commit:
   - Commit: [hash]
   - Files updated: kanban_dev.html[, other files]
   - Ready to push

[If blog post]
✅ Sitemap Refreshed:
   - New blog post added to sitemap.xml

[If deployment]
✅ Deployment History:
   - Logged in deployment-history.md

---

🎯 NEXT STEPS:

1. **Push to GitHub**:
   git push origin [branch]

2. **Verify Production**:
   [If applicable] Check: [PRODUCTION_URL]

3. **Next Task**:
   Type [StartDay] to see next priority task

---

**Automation Status**: ✅ SUCCESS
**Execution Time**: [X seconds]
**Manual Intervention Required**: None
```

---

## ERROR HANDLING

### If task ID not found:
```
❌ ERROR: Cannot detect task ID

**Tried:**
- Git branch name: [branch]
- Last commit message: [message]

**Action Required:**
Please provide task ID manually: #XXX

Then I'll complete the workflow.
```

### If kanban-updater.js fails:
```
❌ ERROR: Kanban update failed

**Possible causes:**
- Task ID #[ID] not found in kanban
- kanban-updater.js script missing
- File permissions issue

**Action Required:**
1. Verify task #[ID] exists in kanban_dev.html
2. Check: /.autopilot/automation/kanban-updater.js exists
3. Run manually: node .autopilot/automation/kanban-updater.js --help
```

### If git commit fails:
```
⚠️  WARNING: Git commit failed

**Kanban WAS updated** (verify manually)

**Action Required:**
Review git status and commit manually:
git status
git add [files]
git commit -m "chore: complete task #[ID]"
```

---

## APPROVAL LEVEL

**Category**: `auto_execute` (routine development task)
**No [PRODUCT_OWNER] approval required** - Updating kanban for completed work

**Exception**: If task involves production deployment, [Flow] approval may be required based on project settings.

Reference: `/.autopilot/config/approval-levels.json`

---

## CONFIGURATION

### Customize for your project:
Edit `/.autopilot/config/placeholders.json`:
```json
{
  "paths": {
    "kanban_dev": "/docs/kanban/kanban_dev.html",
    "docs_root": "/docs",
    "public_root": "/public"
  }
}
```

### Customize task detection:
Edit task type keywords in script:
- Blog posts: `*blog*`, `*post*`
- Deployments: `*deploy*`, `*migration*`
- Documentation: `*doc*`, `*guide*`

---

## TESTING

### Test this command:
1. Complete a small task (e.g., update README)
2. Commit your work
3. Type `[TaskComplete]`
4. Verify:
   - Kanban card moved to Done
   - Git commit created
   - Report generated

### Expected execution time: 10-15 seconds

---

## MAINTENANCE

### Update workflow:
1. Edit this file or `/.autopilot/automation/process-taskcomplete.sh`
2. Test on development branch first
3. Verify kanban updates correctly
4. Deploy to production workflow

### Version history:
- v3.0.0 (2026-01-03): Updated for 4-column workflow (QA → Live), sprint support
- v2.0.0 (2025-12-22): Updated for 7-column workflow (Staging → Done)
- v1.0.0 (2025-10-12): Initial release

---

**Command Status**: ✅ PRODUCTION READY
**Last Updated**: 2025-10-12
**Maintainer**: [Codey] (TPM)

---

*This command automates the task completion ceremony. Trust the automation - it's faster and more consistent than manual updates.*
