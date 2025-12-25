# [Digest] - Daily Project Summary

**Version**: 1.0.0
**Command**: `[Digest]` or `/digest`
**Trigger**: Auto-runs daily at configured time, or on-demand
**Purpose**: Generate comprehensive daily summary of project status, decisions, and metrics
**Executor**: [Codey] (TPM)

---

## AUTO-EXECUTION INSTRUCTIONS

**This command generates a daily digest for [PRODUCT_OWNER].**

When auto-running: Generate and save to `docs/decisions/digests/YYYY-MM-DD.md`
When manual: Display in conversation

---

## STEP 1: Gather Project Status
**Executor**: [Codey]

### Data Collection:
```bash
# 1. Git activity
COMMITS_TODAY=$(git log --oneline --since="00:00" | wc -l)
COMMITS_BY_AUTHOR=$(git log --since="00:00" --format='%an' | sort | uniq -c)
BRANCHES_ACTIVE=$(git branch -r --list | wc -l)

# 2. Kanban status
BACKLOG=$(count_cards_in_column "backlog")
READY=$(count_cards_in_column "ready")
IN_PROGRESS=$(count_cards_in_column "in_progress")
REVIEW=$(count_cards_in_column "review")
QA=$(count_cards_in_column "qa")
STAGING=$(count_cards_in_column "staging")
DONE_TODAY=$(count_cards_completed_today)

# 3. Environment health
LOCAL_STATUS=$(check_health "local")
STAGING_STATUS=$(check_health "staging")
PRODUCTION_STATUS=$(check_health "production")

# 4. Pending decisions
DECISIONS_CRITICAL=$(count_decisions "critical")
DECISIONS_HIGH=$(count_decisions "high")
DECISIONS_MEDIUM=$(count_decisions "medium")
DECISIONS_LOW=$(count_decisions "low")
```

---

## STEP 2: Calculate Metrics
**Executor**: [Codey]

### Metrics to Calculate:
```
VELOCITY:
- Tasks completed today: [count]
- Tasks completed this week: [count]
- Average cycle time: [days]
- Trend vs last week: [+/-X%]

QUALITY:
- Tests passing: [X/Y]
- Code coverage: [X%]
- Security vulnerabilities: [count by severity]
- Performance vs baseline: [+/-X%]

FLOW:
- WIP limit compliance: [yes/no]
- Blocked tasks: [count]
- Avg time in review: [hours]
- Avg time in QA: [hours]
```

---

## STEP 3: Generate Digest
**Executor**: [Codey]

### Digest Template:
```
================================================================
DAILY PROJECT DIGEST
================================================================
Date: [YYYY-MM-DD]
Project: [PROJECT_NAME]
Generated: [TIMESTAMP]

----------------------------------------------------------------
EXECUTIVE SUMMARY
----------------------------------------------------------------

[One paragraph summary of day's progress, key accomplishments,
 and items requiring attention]

----------------------------------------------------------------
DECISIONS REQUIRING YOUR ATTENTION
----------------------------------------------------------------

CRITICAL: [count] | HIGH: [count] | MEDIUM: [count] | LOW: [count]

[If any critical or high]:
>> [count] decisions need your input
>> Review: docs/decisions/pending.md
>> Oldest pending: [X hours/days]

[If none pending]:
>> No decisions pending - AI handled all routine items

----------------------------------------------------------------
KANBAN STATUS
----------------------------------------------------------------

| Column      | Count | Change |
|-------------|-------|--------|
| Backlog     | [X]   | [+/-Y] |
| Ready       | [X]   | [+/-Y] |
| In Progress | [X]   | [+/-Y] |
| Review      | [X]   | [+/-Y] |
| QA          | [X]   | [+/-Y] |
| Staging     | [X]   | [+/-Y] |
| Done        | [X]   | [+/-Y] |

Tasks Completed Today: [count]
[List task IDs and titles]

Tasks Started Today: [count]
[List task IDs and titles]

Blocked: [count]
[List with blockers if any]

----------------------------------------------------------------
AUTO-ACTIONS TAKEN TODAY
----------------------------------------------------------------

[List actions AI took autonomously]

Examples:
- Moved #012 from In Progress to Review (all tests passed)
- Deployed #011 to staging (QA approved)
- Updated sitemap.xml (new blog post published)
- Ran security scan (0 vulnerabilities found)
- Created branch feature/015-user-settings

----------------------------------------------------------------
ENVIRONMENT STATUS
----------------------------------------------------------------

| Environment | Status | URL | Last Deploy |
|-------------|--------|-----|-------------|
| Local       | [OK/DOWN] | [URL] | N/A |
| Staging     | [OK/DOWN] | [URL] | [timestamp] |
| Production  | [OK/DOWN] | [URL] | [timestamp] |

[If any issues]:
>> WARNING: [environment] health check failing
>> Error: [error message]
>> Action: [recommended action]

----------------------------------------------------------------
QUALITY METRICS
----------------------------------------------------------------

Tests: [PASS/FAIL] ([X]/[Y] passing)
Coverage: [X%] ([+/-Y%] from last week)
Lint: [X] warnings, [Y] errors
Security: [X] critical, [Y] high, [Z] medium vulnerabilities
Performance: [X]ms avg response ([+/-Y%] from baseline)

[If any concerns]:
>> ATTENTION: [metric] below threshold
>> Current: [value] | Threshold: [threshold]
>> Recommendation: [action]

----------------------------------------------------------------
VELOCITY & TRENDS
----------------------------------------------------------------

This Week:
- Completed: [X] tasks
- In Progress: [Y] tasks
- Velocity: [Z] story points

Trends:
- vs Last Week: [+/-X%]
- vs Monthly Avg: [+/-X%]
- Projected Sprint Completion: [On Track/At Risk/Behind]

----------------------------------------------------------------
UPCOMING
----------------------------------------------------------------

Tomorrow's Priorities:
1. [Task #ID] - [Title] (in [column])
2. [Task #ID] - [Title] (in [column])
3. [Task #ID] - [Title] (in [column])

Scheduled:
- [Any scheduled deploys, meetings, deadlines]

Risk Items:
- [Any items at risk of missing deadlines]

----------------------------------------------------------------
AI RECOMMENDATIONS
----------------------------------------------------------------

[Based on analysis, suggest actions]:

1. [Recommendation with rationale]
2. [Recommendation with rationale]
3. [Recommendation with rationale]

----------------------------------------------------------------

Digest generated by [Codey] (TPM)
Full decision queue: docs/decisions/pending.md
Historical digests: docs/decisions/digests/

================================================================
```

---

## STEP 4: Save and Notify
**Executor**: [Codey]

### Actions:
```bash
# 1. Save digest to file
DIGEST_FILE="docs/decisions/digests/$(date +%Y-%m-%d).md"
save_digest_to_file "$DIGEST_FILE"

# 2. Check notification preferences
NOTIFICATION_CHANNEL=$(get_config "notifications.digest_channel")
DIGEST_TIME=$(get_config "notifications.digest_time")

# 3. If manual run, display in conversation
# 4. If scheduled run, send via configured channel
```

### Notification Channels:
- **email**: Send as formatted email
- **slack**: Post to configured channel
- **file_only**: Save to file, no notification
- **conversation**: Display in next Claude Code session

---

## CONFIGURATION

### In placeholders.json:
```json
{
  "notifications": {
    "digest_enabled": true,
    "digest_time": "09:00",
    "digest_channel": "email",
    "digest_recipients": ["[PRODUCT_OWNER_EMAIL]"],
    "include_recommendations": true,
    "include_metrics": true,
    "include_auto_actions": true
  }
}
```

### Customize Digest Sections:
```json
{
  "digest_sections": {
    "executive_summary": true,
    "decisions_pending": true,
    "kanban_status": true,
    "auto_actions": true,
    "environment_status": true,
    "quality_metrics": true,
    "velocity_trends": true,
    "upcoming": true,
    "recommendations": true
  }
}
```

---

## APPROVAL LEVEL

**Category**: `auto_execute_notify`
**No [PRODUCT_OWNER] approval required**

Digest generation is informational and does not modify project state.

---

## VERSION HISTORY

- v1.0.0 (2025-12-23): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-23
**Maintainer**: [Codey] (TPM)
