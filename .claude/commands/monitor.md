# [Monitor] - Autonomous Project Oversight

**Version**: 1.0.0
**Command**: `[Monitor]` or `/monitor`
**Trigger**: Runs automatically every 30 minutes, or on-demand
**Purpose**: Continuously monitor project, auto-progress tasks, queue decisions, escalate issues
**Executor**: [Codey] (TPM) coordinates all agents

---

## AUTO-EXECUTION INSTRUCTIONS

**This is the core autonomous operations command.**

The AI operates independently, taking action on routine tasks and only involving [PRODUCT_OWNER] when decisions are required per `decision-taxonomy.json`.

---

## MONITORING CYCLE

```
Every 30 minutes (or on trigger):

1. CHECK ENVIRONMENTS
   └─ Health check all environments
   └─ Escalate if any down

2. CHECK TASK PROGRESSION
   └─ For each task in workflow columns
   └─ Run quality gates
   └─ Auto-progress if all gates pass
   └─ Queue decision if human input needed
   └─ Return to previous column if gates fail

3. CHECK PENDING DECISIONS
   └─ Look for [PRODUCT_OWNER] responses
   └─ Execute approved decisions
   └─ Send reminders for stale decisions

4. RUN SCHEDULED TASKS
   └─ Security scans
   └─ Backup verification
   └─ Performance benchmarks

5. UPDATE METRICS
   └─ Calculate velocity
   └─ Update cycle time
   └─ Detect anomalies

6. LOG & REPORT
   └─ Log all actions taken
   └─ Update pending.md if decisions queued
   └─ Escalate if critical issues found
```

---

## STEP 1: Environment Health Check
**Executor**: [Flow], [Sentinal]

### Actions:
```bash
# Check each environment
ENVIRONMENTS=("local" "staging" "production")

for ENV in "${ENVIRONMENTS[@]}"; do
    URL=$(get_env_url "$ENV")
    HEALTH_ENDPOINT="$URL/health"

    # HTTP health check
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" --max-time 10)

    if [ "$HTTP_STATUS" != "200" ]; then
        if [ "$ENV" == "production" ]; then
            escalate_immediately "Production health check failed: HTTP $HTTP_STATUS"
        else
            log_warning "$ENV health check failed: HTTP $HTTP_STATUS"
        fi
    fi

    # SSL certificate check (production only)
    if [ "$ENV" == "production" ]; then
        SSL_EXPIRY=$(check_ssl_expiry "$URL")
        if [ "$SSL_EXPIRY" -lt 7 ]; then
            escalate_immediately "SSL certificate expires in $SSL_EXPIRY days"
        elif [ "$SSL_EXPIRY" -lt 30 ]; then
            queue_decision "medium" "SSL certificate expires in $SSL_EXPIRY days"
        fi
    fi
done
```

### Output:
```
ENVIRONMENT HEALTH CHECK:
-------------------------
[OK] Local: http://localhost:8080 (200 OK)
[OK] Staging: https://staging.example.com (200 OK, SSL: 89 days)
[OK] Production: https://example.com (200 OK, SSL: 89 days)
```

---

## STEP 2: Task Progression Evaluation
**Executor**: [Codey]

### For Each Task in Workflow:

```
READ kanban board
FOR EACH task NOT in "backlog" or "done":

    current_column = get_task_column(task)
    next_column = get_next_column(current_column)
    gates = get_quality_gates(current_column + "_to_" + next_column)

    all_gates_pass = TRUE
    blocking_gate_failed = FALSE

    FOR EACH gate in gates:
        IF gate.auto == TRUE:
            result = run_gate_check(gate)

            IF result == FAIL:
                all_gates_pass = FALSE
                log_gate_failure(task, gate)

                IF gate.blocking == TRUE:
                    blocking_gate_failed = TRUE

        ELSE: # gate requires human input
            IF gate has response in pending.md:
                process_response(gate)
            ELSE:
                all_gates_pass = FALSE
                ensure_decision_queued(task, gate)

    IF all_gates_pass:
        auto_progress_task(task, current_column, next_column)
        log_auto_action("Moved #" + task.id + " to " + next_column)

    ELIF blocking_gate_failed:
        IF current_column != "in_progress":
            return_task_to_previous_column(task)
            notify_assignee(task, "Gate failed: " + gate.name)
```

### Quality Gate Checks:
```bash
# Example gate checks

check_tests_pass() {
    npm test --silent 2>&1
    return $?
}

check_no_secrets() {
    SECRETS=$(grep -rn 'api_key\|secret\|password\|token' src/ \
        --include='*.ts' --include='*.js' --include='*.php' \
        | grep -v '.env' | grep -v 'node_modules' | wc -l)
    [ "$SECRETS" -eq 0 ]
}

check_lint_pass() {
    npm run lint --silent 2>&1
    return $?
}

check_branch_pushed() {
    UNPUSHED=$(git rev-list @{u}..HEAD 2>/dev/null | wc -l)
    [ "$UNPUSHED" -eq 0 ]
}

check_pr_approved() {
    APPROVALS=$(gh pr view --json reviews -q '[.reviews[] | select(.state=="APPROVED")] | length')
    [ "$APPROVALS" -ge 1 ]
}
```

### Auto-Progress Actions:
```bash
auto_progress_task() {
    TASK_ID=$1
    FROM_COLUMN=$2
    TO_COLUMN=$3

    # Update kanban
    node .autopilot/automation/kanban-updater.js \
        --task-id="$TASK_ID" \
        --from-column="$FROM_COLUMN" \
        --to-column="$TO_COLUMN" \
        --add-note="Auto-progressed by [Monitor] - all gates passed"

    # Git commit
    git add -A
    git commit -m "chore: auto-progress #$TASK_ID ($FROM_COLUMN → $TO_COLUMN)

Automated by [Monitor]
Quality gates passed:
$(list_passed_gates)

Co-Authored-By: Claude <noreply@anthropic.com>"

    # Log action
    log_auto_action "Moved #$TASK_ID from $FROM_COLUMN to $TO_COLUMN"
}
```

---

## STEP 3: Decision Queue Management
**Executor**: [Codey]

### Check for Responses:
```bash
# Parse pending.md for checked responses
PENDING_FILE=".autopilot/docs/decisions/pending.md"

# Find decisions with checked options
RESPONDED=$(grep -B10 '\[x\]' "$PENDING_FILE" | grep '### #')

for DECISION in $RESPONDED; do
    DECISION_ID=$(extract_decision_id "$DECISION")
    RESPONSE=$(extract_checked_option "$DECISION_ID")

    case $RESPONSE in
        "Approve")
            execute_approved_decision "$DECISION_ID"
            archive_decision "$DECISION_ID" "approved"
            ;;
        "Approve with conditions")
            NOTES=$(extract_notes "$DECISION_ID")
            execute_approved_decision "$DECISION_ID" "$NOTES"
            archive_decision "$DECISION_ID" "approved_conditional"
            ;;
        "Defer")
            DEFER_DATE=$(extract_defer_date "$DECISION_ID")
            reschedule_decision "$DECISION_ID" "$DEFER_DATE"
            ;;
        "Reject")
            REASON=$(extract_notes "$DECISION_ID")
            reject_decision "$DECISION_ID" "$REASON"
            archive_decision "$DECISION_ID" "rejected"
            ;;
        "Need more information")
            INFO_NEEDED=$(extract_notes "$DECISION_ID")
            gather_more_info "$DECISION_ID" "$INFO_NEEDED"
            ;;
    esac
done
```

### Send Reminders:
```bash
# Check for stale decisions
for DECISION in $(get_pending_decisions); do
    AGE_HOURS=$(get_decision_age_hours "$DECISION")
    PRIORITY=$(get_decision_priority "$DECISION")

    case $PRIORITY in
        "critical")
            if [ "$AGE_HOURS" -gt 1 ]; then
                send_reminder "$DECISION" "CRITICAL - requires immediate attention"
            fi
            ;;
        "high")
            if [ "$AGE_HOURS" -gt 4 ]; then
                send_reminder "$DECISION" "HIGH - blocking work"
            fi
            ;;
        "medium")
            if [ "$AGE_HOURS" -gt 12 ]; then
                send_reminder "$DECISION" "Reminder: decision pending 12+ hours"
            fi
            ;;
    esac
done
```

---

## STEP 4: Scheduled Tasks
**Executor**: [Sentinal], [Flow]

### Security Scan (Daily):
```bash
if is_scheduled("security_scan"); then
    # Run npm audit
    AUDIT_RESULT=$(npm audit --json)
    CRITICAL=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.critical')
    HIGH=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.high')

    if [ "$CRITICAL" -gt 0 ]; then
        escalate_immediately "Critical security vulnerability found"
    elif [ "$HIGH" -gt 0 ]; then
        queue_decision "high" "Security: $HIGH high-severity vulnerabilities"
    else
        log_auto_action "Security scan passed: 0 critical, 0 high vulnerabilities"
    fi
fi
```

### Backup Verification (Daily):
```bash
if is_scheduled("backup_verification"); then
    LAST_BACKUP=$(get_last_backup_time)
    HOURS_SINCE=$(hours_since "$LAST_BACKUP")

    if [ "$HOURS_SINCE" -gt 24 ]; then
        queue_decision "high" "Backup overdue: last backup $HOURS_SINCE hours ago"
    else
        log_auto_action "Backup verified: last backup $HOURS_SINCE hours ago"
    fi
fi
```

### Performance Benchmark (Weekly):
```bash
if is_scheduled("performance_benchmark"); then
    CURRENT_PERF=$(run_performance_test)
    BASELINE_PERF=$(get_performance_baseline)
    DEGRADATION=$(calculate_degradation "$CURRENT_PERF" "$BASELINE_PERF")

    if [ "$DEGRADATION" -gt 20 ]; then
        queue_decision "medium" "Performance degraded ${DEGRADATION}% from baseline"
    else
        log_auto_action "Performance within baseline: ${DEGRADATION}% variance"
    fi
fi
```

---

## STEP 5: Update Metrics
**Executor**: [Codey]

### Calculate and Store:
```bash
# Velocity
COMPLETED_THIS_WEEK=$(count_completed_this_week)
STORY_POINTS=$(sum_story_points_completed_this_week)

# Cycle time
AVG_CYCLE_TIME=$(calculate_avg_cycle_time)

# Flow metrics
AVG_TIME_IN_REVIEW=$(calculate_avg_time_in_column "review")
AVG_TIME_IN_QA=$(calculate_avg_time_in_column "qa")
WIP_COUNT=$(count_tasks_in_progress)

# Store in metrics file
update_metrics_file "$COMPLETED_THIS_WEEK" "$STORY_POINTS" "$AVG_CYCLE_TIME"

# Detect anomalies
if [ "$AVG_CYCLE_TIME" -gt "$BASELINE_CYCLE_TIME * 1.5" ]; then
    log_warning "Cycle time anomaly: ${AVG_CYCLE_TIME} days (baseline: ${BASELINE_CYCLE_TIME})"
fi
```

---

## STEP 6: Log and Report
**Executor**: [Codey]

### Monitor Log Entry:
```bash
LOG_FILE="docs/logs/monitor-$(date +%Y-%m-%d).log"

log_monitor_run() {
    echo "========================================" >> "$LOG_FILE"
    echo "Monitor Run: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "Environment Status:" >> "$LOG_FILE"
    echo "$ENV_STATUS" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "Auto-Actions Taken:" >> "$LOG_FILE"
    echo "$AUTO_ACTIONS" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "Decisions Queued:" >> "$LOG_FILE"
    echo "$DECISIONS_QUEUED" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "Escalations:" >> "$LOG_FILE"
    echo "$ESCALATIONS" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}
```

### Console Output:
```
================================================================
[MONITOR] Run Complete - [TIMESTAMP]
================================================================

ENVIRONMENTS:
  [OK] Local     | [OK] Staging     | [OK] Production

AUTO-ACTIONS (3):
  - Moved #012 In Progress → Review (tests passed)
  - Moved #011 QA → Staging (all QA tests passed)
  - Security scan completed (0 vulnerabilities)

DECISIONS QUEUED (1):
  - #015 Production deploy awaiting approval

ESCALATIONS (0):
  - None

NEXT RUN: [timestamp + 30 minutes]
================================================================
```

---

## CONFIGURATION

### In placeholders.json:
```json
{
  "monitor": {
    "enabled": true,
    "interval_minutes": 30,
    "run_on_startup": true,
    "environments_to_check": ["local", "staging", "production"],
    "auto_progress_enabled": true,
    "scheduled_tasks": {
      "security_scan": "daily:03:00",
      "backup_verification": "daily:04:00",
      "performance_benchmark": "weekly:sunday:02:00"
    }
  }
}
```

---

## MANUAL TRIGGERS

### Run Full Monitor Cycle:
```
[Monitor]
```

### Run Specific Checks:
```
[Monitor] --only=environments
[Monitor] --only=tasks
[Monitor] --only=decisions
[Monitor] --only=security
```

### Force Task Evaluation:
```
[Monitor] --task=#015
```

---

## APPROVAL LEVEL

**Category**: `auto_execute`
**No [PRODUCT_OWNER] approval required for monitoring**

Individual actions follow decision-taxonomy.json rules.

---

## ERROR HANDLING

### If Environment Down:
```
IF production down:
    escalate_immediately()
    attempt_health_check_retry(3)

IF staging down:
    log_warning()
    skip_staging_deployments()

IF local down:
    log_info("Local environment not running")
```

### If Gate Check Fails:
```
IF gate is blocking:
    do_not_progress()
    notify_assignee()

IF gate is warning:
    log_warning()
    allow_progress_with_note()
```

### If Decision Response Invalid:
```
log_error("Invalid response format")
keep_decision_pending()
add_clarification_request()
```

---

## VERSION HISTORY

- v1.0.0 (2025-12-23): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-23
**Maintainer**: [Codey] (TPM)

---

*This command is the heart of autonomous AI DevOps. It watches, acts, and only involves humans when necessary.*
