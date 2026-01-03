# Task Lifecycle - DevOps Best Practices

**Version**: 2.0.0
**Purpose**: Standard 7-stage workflow every task follows from Backlog to Done
**Maintained by**: [Flow] (DevOps), [Codey] (TPM)

---

## Overview

Every task follows this lifecycle:

```
┌─────────┐   ┌───────┐   ┌─────────────┐   ┌────────┐   ┌─────┐   ┌─────────┐   ┌──────┐
│ BACKLOG │──►│ READY │──►│ IN PROGRESS │──►│ REVIEW │──►│ QA  │──►│ STAGING │──►│ DONE │
└─────────┘   └───────┘   └─────────────┘   └────────┘   └─────┘   └─────────┘   └──────┘
     │             │              │              │           │           │           │
  Prioritize  [TaskStart]    Development   [TaskReview]  [TaskQA]  [TaskStage] [TaskComplete]
```

---

## Stage 1: BACKLOG → READY

### Purpose
Move refined, prioritized tasks that are ready to be picked up.

### Entry Criteria
- Task has clear title and description
- Acceptance criteria defined
- Dependencies identified
- Estimated (story points or T-shirt size)

### Actions
1. Product Owner prioritizes task
2. Task is refined with enough detail to start
3. Move card to Ready column

### Definition of "Ready"
- Clear acceptance criteria
- No blocking dependencies
- Developer can start without questions

---

## Stage 2: READY → IN PROGRESS

### Trigger
User runs `[TaskStart]` or says "start task #X"

### What Happens
1. **Validate Selection**
   - Task exists in Ready column
   - No WIP limit exceeded

2. **Create Feature Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/[task-id]-[description]
   git push -u origin feature/[task-id]-[description]
   ```

3. **Update Kanban**
   - Move card: Ready → In Progress
   - Add start date
   - Assign developer

4. **Verify Environment**
   - Dependencies installed
   - Dev server running
   - Database connected

### DevOps Best Practices
| Practice | Why |
|----------|-----|
| Feature branches | Isolate work, easy rollback |
| Branch from main | Always start from stable code |
| Push immediately | Backup + visibility |
| WIP limit | Focus on completing before starting |

### Definition of "In Progress"
- Developer actively working
- Local environment functional
- Feature branch created

---

## Stage 3: IN PROGRESS → REVIEW

### Trigger
User runs `[TaskReview]` or says "ready for review"

### What Happens

1. **Pre-Review Checklist** (Developer)
   - [ ] All acceptance criteria met
   - [ ] Code compiles without errors
   - [ ] Self-review completed
   - [ ] No debug statements left

2. **Create Pull Request**
   ```bash
   git push origin feature/[task-id]-[description]
   gh pr create --title "#[ID] - [Title]"
   ```

3. **Update Kanban**
   - Move card: In Progress → Review
   - Attach PR link
   - Assign reviewer

### DevOps Best Practices
| Practice | Why |
|----------|-----|
| Small PRs | Easier to review, faster feedback |
| Self-review first | Catch obvious issues |
| Clear PR description | Context for reviewers |

### Definition of "In Review"
- PR created
- Assigned to reviewer
- Ready for code review

---

## Stage 4: REVIEW → QA

### Trigger
User runs `[TaskQA]` or code review is approved

### What Happens

1. **Code Review** ([Syntax])
   - Follows project patterns
   - No unnecessary complexity
   - Proper error handling
   - No hardcoded values

2. **Security Review** ([Sentinal])
   - Input validation (XSS, SQL injection)
   - No secrets in code
   - Proper authentication/authorization
   - npm audit clean

3. **Update Kanban**
   - Move card: Review → QA
   - Code review status: Approved
   - Assign to [Verity]

4. **Generate QA Test Brief**
   - What to test
   - How to access
   - Edge cases to verify

### DevOps Best Practices
| Practice | Why |
|----------|-----|
| Code review every PR | Knowledge sharing, quality |
| Security review | Shift-left security |
| Test brief | Consistent testing |

### Definition of "In QA"
- Code review approved
- Security review passed
- Ready for testing

---

## Stage 5: QA → STAGING

### Trigger
User runs `[TaskStage]` or QA says "testing complete"

### What Happens

1. **QA Verification** ([Verity])
   - [ ] All test cases pass
   - [ ] Edge cases verified
   - [ ] Cross-browser tested
   - [ ] Accessibility checked
   - [ ] No regressions found

2. **Merge to Main**
   ```bash
   gh pr merge [PR_NUMBER] --squash
   git checkout main
   git pull origin main
   ```

3. **Deploy to Staging**
   ```bash
   git push origin main:staging
   ```

4. **Staging Verification**
   - Health check passes
   - Feature works in staging environment

5. **Update Kanban**
   - Move card: QA → Staging
   - Add staging URL
   - Log deployment

### DevOps Best Practices
| Practice | Why |
|----------|-----|
| Squash merge | Clean history |
| Staging environment | Test in production-like environment |
| Health checks | Verify deployment succeeded |

### Definition of "Staging"
- QA testing passed
- Merged to main
- Deployed to staging
- Stakeholder preview available

---

## Stage 6: STAGING → DONE

### Trigger
User runs `[TaskComplete]` after stakeholder approval

### What Happens

1. **Stakeholder Approval** ([PRODUCT_OWNER])
   - Preview on staging
   - Confirm feature meets requirements
   - Approve for production

2. **Production Deployment** ([Flow])
   ```bash
   git push origin main:production
   ```

3. **Production Verification**
   - Health check passes
   - Feature works in production
   - Monitoring shows no errors

4. **Update Kanban**
   - Move card: Staging → Done
   - Add completion date
   - Mark as completed

5. **Cleanup**
   ```bash
   git branch -d feature/[task-id]-[description]
   git push origin --delete feature/[task-id]-[description]
   ```

6. **Log Deployment**
   - Update deployment-history.md
   - Record who deployed, when, what

### DevOps Best Practices
| Practice | Why |
|----------|-----|
| Stakeholder approval | Business validation |
| Production health checks | Catch issues immediately |
| Feature branch cleanup | Keep repo clean |
| Deployment logs | Audit and rollback reference |

### Definition of "Done"
- Production deployment successful
- No production errors
- Documentation updated (if needed)
- Feature branch deleted
- Deployment logged

---

## Summary: Commands & Responsibilities

| Stage | Command | Lead | Support |
|-------|---------|------|---------|
| Backlog → Ready | (manual prioritization) | [PRODUCT_OWNER] | [Codey] |
| Ready → In Progress | `[TaskStart]` | [Codey] | [Flow] |
| In Progress → Review | `[TaskReview]` | [Syntax] | Developer |
| Review → QA | `[TaskQA]` | [Codey] | [Syntax], [Sentinal] |
| QA → Staging | `[TaskStage]` | [Flow] | [Verity] |
| Staging → Done | `[TaskComplete]` | [Flow] | [Codey] |

---

## Quality Gates

Each stage has a "quality gate" - requirements that must be met before proceeding:

### Gate 1: Ready for Development
- [ ] Task has clear acceptance criteria
- [ ] Dependencies identified
- [ ] Design approved (if UI work)

### Gate 2: Ready for Review
- [ ] All acceptance criteria implemented
- [ ] Code compiles without errors
- [ ] Self-review completed

### Gate 3: Ready for QA
- [ ] Code review approved
- [ ] Security review approved
- [ ] PR created

### Gate 4: Ready for Staging
- [ ] QA testing complete
- [ ] No blocking bugs
- [ ] Cross-browser verified

### Gate 5: Ready for Production
- [ ] Staging verification complete
- [ ] Stakeholder approved
- [ ] Rollback plan documented

---

## Rollback Procedures

### From Staging
```bash
git revert [merge-commit-hash]
git push origin main
git push origin main:staging
```

### From Production
```bash
# Option 1: Revert commit
git revert [commit-hash]
git push origin main:production

# Option 2: Deploy previous version
git checkout [previous-tag]
./deploy-production.sh
```

### Rollback Triggers
- Production errors spike
- Critical bug discovered
- Feature breaks existing functionality
- Security vulnerability found

---

## Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| Cycle Time | < 5 days | How long from start to done |
| Lead Time | < 2 weeks | How long from backlog to done |
| Review Time | < 1 day | How long PRs wait for review |
| QA Pass Rate | > 90% | First-time quality |
| Deploy Frequency | Daily | Continuous delivery |
| Change Failure Rate | < 5% | Production stability |

---

## Version History

- v2.0.0 (2025-12-22): Updated to 7-column workflow (Backlog → Ready → In Progress → Review → QA → Staging → Done)
- v1.0.0 (2025-12-22): Initial release with 5-column workflow

---

**Document Status**: PRODUCTION READY
**Last Updated**: 2025-12-22
**Maintainer**: [Flow] (DevOps), [Codey] (TPM)
