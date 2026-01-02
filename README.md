# Claude AutoPilot

**Autonomous AI Development Framework for Claude Code**

Turn a PRD into a production app with AI handling the process. You make decisions. AI does everything else.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Built%20for-Claude%20Code-blueviolet)](https://claude.ai/code)

---

## What Is This?

Claude AutoPilot is a framework that transforms Claude Code from an assistant into an autonomous development partner. Give it a PRD (Product Requirements Document), and it will:

- Break down the PRD into tasks
- Create and manage a kanban board
- Move tasks through a 7-stage DevOps workflow
- Run tests, security scans, and code reviews automatically
- Deploy to staging, verify, and request production approval
- Only notify you when decisions are needed

**You focus on building. AI handles process.**

---

## The Workflow

```
+-------------+     +-------------+     +-------------+
|   You       |     |   Claude    |     |  Production |
|   Write     |---->|   Handles   |---->|   App       |
|   PRD       |     |   The Rest  |     |   Deployed  |
+-------------+     +-------------+     +-------------+

Your input:              AI does:                You see:
- PRD document           - Task breakdown        - Daily digest
- Decisions when asked   - Kanban management     - Decision requests
- Code (the fun part)    - Code review           - "Approved for prod?"
                         - Testing
                         - Deployments
                         - Documentation
```

---

## Quick Start

### 1. Fork or Clone

```bash
# Option A: Fork on GitHub (recommended for your own projects)
# Click "Fork" button above

# Option B: Clone directly
git clone https://github.com/travissutphin/openSource-claudeAutoPilot.git my-new-project
cd my-new-project
```

### 2. Add Your PRD

Place your PRD in the project first - it contains your project requirements:
```
docs/prd/PRD.md
```

See `examples/sample-prd-saas.md` for the expected format.

### 3. Open Claude Code

```bash
claude
```

### 4. Run Setup

```
[SetupProject]
```

Claude reads your PRD and uses it to configure your project (name, tech stack, features). It will confirm or ask clarifying questions.

### 5. Start Building

```
[StartDay]
```

Claude breaks your PRD into tasks on the kanban board and guides you through implementation.

---

## What You Need

- [Claude Code](https://claude.ai/code) installed
- Node.js 18+ (for automation scripts)
- Git
- A well-formatted PRD - Learn how to create an AI Dev ready PRD or have AI build it for you here - +[rapidPRD.app](https://rapidprd.app)

---

## How It Works (30-Second Version)

1. **You write a PRD** - Claude breaks it into tasks on a kanban board
2. **You start coding** - Claude runs tests, reviews code, manages workflow
3. **Code passes checks** - Claude auto-deploys to staging
4. **Staging verified** - Claude asks "Deploy to production?"
5. **You approve** - Claude deploys and moves task to Done

**That's it.** No manual kanban updates. No remembering to run tests. No deployment checklists.

---

## Project Structure

```
claude-autopilot/
├── CLAUDE.md                    # AI instructions (auto-generated)
├── docs-framework/
│   ├── slash-commands/          # Claude Code commands
│   │   ├── setupproject.md      # [SetupProject]
│   │   ├── startday.md          # [StartDay]
│   │   ├── setupenvironment.md  # [SetupEnvironment]
│   │   ├── taskstart.md         # [TaskStart]
│   │   ├── taskreview.md        # [TaskReview]
│   │   ├── taskqa.md            # [TaskQA]
│   │   ├── taskstage.md         # [TaskStage]
│   │   ├── taskcomplete.md      # [TaskComplete]
│   │   ├── monitor.md           # [Monitor] - autonomous oversight
│   │   ├── digest.md            # [Digest] - daily summary
│   │   └── endday.md            # [EndDay]
│   ├── automation/              # Scripts for autonomous operation
│   │   ├── kanban-updater.js
│   │   ├── evaluate-progression.js
│   │   ├── ai-code-review.js
│   │   ├── setup-database.js
│   │   ├── generate-secrets.js
│   │   └── populate-env.js
│   ├── config/                  # Configuration
│   │   ├── placeholders.json
│   │   ├── workflow-states.json
│   │   ├── quality-gates.json
│   │   ├── decision-taxonomy.json
│   │   └── environments.json
│   ├── templates/               # Project templates
│   │   ├── kanban_dev.html.template
│   │   └── CLAUDE.md.template
│   └── docs/                    # Documentation
│       ├── TASK-LIFECYCLE.md
│       ├── SETUP-NEW-PROJECT.md
│       └── decisions/
│           └── pending.md       # Decision queue
├── examples/
│   └── sample-prd-saas.md       # SaaS app PRD example
└── docs/
    └── kanban/
        └── kanban_dev.html      # Your project kanban (generated)
```

---

## Core Commands

| Command | When to Use | What Happens |
|---------|-------------|--------------|
| `[SetupProject]` | New project | Configure project, generate files |
| `[SetupEnvironment]` | After setup | Provision database, generate secrets, populate .env |
| `[StartDay]` | Start of session | Status report, suggest next task |
| `[TaskStart]` | Begin a task | Create branch, move to In Progress |
| `[TaskReview]` | Code complete | Create PR, move to Review |
| `[TaskQA]` | Review approved | Security scan, move to QA |
| `[TaskStage]` | QA passed | Deploy to staging |
| `[TaskComplete]` | Ready for prod | Deploy to production (asks approval) |
| `[Monitor]` | Runs automatically | Check environments, auto-progress tasks |
| `[Digest]` | Daily (or manual) | Generate daily summary |
| `[EndDay]` | End of session | Wrap up, tomorrow's priorities |

---

## The 7-Stage Workflow

```
Backlog -> Ready -> In Progress -> Review -> QA -> Staging -> Done
   |        |          |            |        |       |        |
   |        |          |            |        |       |        +-- Production
   |        |          |            |        |       +-- 24hr soak test
   |        |          |            |        +-- Automated testing
   |        |          |            +-- AI + human code review
   |        |          +-- You're coding
   |        +-- Prioritized for work
   +-- All tasks from PRD
```

---

## Decision-Only Notifications

Claude handles 90% of workflow automatically. You're only asked when:

| Decision Type | Example |
|---------------|---------|
| Production deploy | "Task #15 ready for production. Approve?" |
| Architecture change | "Should we use Redis or in-memory caching?" |
| Scope change | "This feature needs 2 more tasks. Proceed?" |
| Security issue | "Medium vulnerability found. Fix now or defer?" |

Decisions appear in `docs/decisions/pending.md` or your daily digest.

---

## PRD Requirements

For best results, your PRD should include:

```markdown
# Product Requirements Document

## Overview
What you're building and why.

## Goals
- Goal 1
- Goal 2

## User Stories
- As a [user], I want [feature] so that [benefit]

## Features
### Feature 1
Description, acceptance criteria

### Feature 2
Description, acceptance criteria

## Technical Requirements
- Tech stack preferences
- Integrations needed
- Performance requirements

## Out of Scope
What you're NOT building (important for AI to understand boundaries)
```

See `examples/` for complete PRD templates.

---

## License

MIT License - Use freely, attribution appreciated.

---

## Contributing

PRs welcome! Please read `CONTRIBUTING.md` first.

---

## Credits

Built for use with [Claude Code](https://claude.ai/code) by Anthropic.

Created by [Travis Sutphin](https://github.com/travissutphin)

---

# Detailed Workflow Guide

*The section below provides in-depth documentation for each stage of the framework.*

---

## Part 2: Detailed Workflow

### Phase 1: Project Initialization

#### Step 1: Fork/Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/openSource-claudeAutoPilot.git my-project
cd my-project
```

#### Step 2: Add Your PRD

Create your PRD before running setup - it drives everything:
```
docs/prd/PRD.md
```

Your PRD should include: project name, description, tech stack, features with acceptance criteria, and out-of-scope items. See `examples/sample-prd-saas.md`.

#### Step 3: Run Project Setup

Open Claude Code and type:
```
[SetupProject]
```

Claude reads your PRD and confirms:
```
PROJECT SETUP
==============

I found your PRD: docs/prd/PRD.md

Extracted from PRD:
- Project: TaskFlow
- Description: Task management SaaS for small teams
- Tech Stack: Next.js 14, Tailwind CSS, PostgreSQL
- Features: 7 identified

Is this correct? (yes / no / let me clarify)
```

After confirmation, Claude generates:
- `CLAUDE.md` - AI instructions
- `placeholders.json` - Project configuration
- `kanban_dev.html` - Your kanban board with tasks from PRD
- `.env.example` - Environment template

#### Step 4: Environment Setup (Optional but Recommended)

When asked "Run [SetupEnvironment]?", say yes:

```
ENVIRONMENT SETUP
==================

Would you like me to set up your development environment now?

This will:
- Create/provision your database (you choose: Supabase, Docker, Local, etc.)
- Generate secure secrets (JWT, session keys, etc.)
- Populate your .env file automatically
- Run install and migration commands

Run [SetupEnvironment]? (yes / no)
```

If yes, Claude:
1. Asks which database provider (Supabase, Docker, Local PostgreSQL, SQLite)
2. Provisions the database automatically
3. Generates cryptographically secure secrets
4. Populates your `.env` file
5. Runs `npm install` and migrations

**Result: Zero manual environment setup.**

---

### Phase 2: PRD Task Breakdown

#### How Claude Processes Your PRD

When you run `[StartDay]` for the first time (or when PRD changes), Claude analyzes your PRD and creates tasks:

```
PRD ANALYSIS COMPLETE
======================

I've identified 12 features from your PRD.

EPIC BREAKDOWN:
1. Authentication (3 tasks)
   - #001: User registration
   - #002: Login/logout
   - #003: Password reset

2. Team Management (4 tasks)
   - #004: Create team
   - #005: Invite members
   - #006: Role permissions
   - #007: Team settings

3. Task Boards (5 tasks)
   - #008: Create board
   - #009: Add/edit tasks
   - #010: Drag-drop columns
   - #011: Task assignments
   - #012: Due dates

All 12 tasks added to kanban backlog.
Priority order based on dependencies.

Start with #001 (User registration)? (yes / no)
```

---

### Phase 3: Development Cycle

#### Step 6: Start Each Day

```
[StartDay]
```

Claude responds:
```
Good morning, Travis!

Project: TaskFlow
Tech: Next.js + Tailwind CSS

OVERNIGHT ACTIVITY:
- Ran security scan: 0 vulnerabilities
- Staging health check: OK
- No errors in logs

CURRENT TASKS:
--------------
In Progress: #003 - Password reset
In Review: None
In QA: #002 - Login/logout
Staging: #001 - User registration

DECISIONS PENDING:
- #001 ready for production (see docs/decisions/pending.md)

TODAY'S PRIORITY:
Continue #003 - Password reset

What would you like to work on?
```

#### Step 7: Work on a Task

```
[TaskStart] #004
```

Claude:
```
STARTING TASK #004
===================
Title: Create team
Branch: feature/004-create-team

Actions:
- Created branch from main
- Moved card to In Progress
- Updated kanban

ACCEPTANCE CRITERIA (from PRD):
- User can create a new team
- Team has name and description
- Creator becomes team admin
- Team gets unique invite code

SUGGESTED FILES:
- src/app/api/teams/route.ts
- src/components/CreateTeamForm.tsx
- prisma/schema.prisma (add Team model)

Ready to code!
```

#### Step 8: Complete Your Code

When you're done coding:
```
[TaskReview]
```

Claude:
```
SUBMITTING FOR REVIEW
======================

Pre-flight checks:
- All changes committed
- Branch pushed to origin
- Tests passing (14/14)
- No lint errors
- No exposed secrets

Creating PR...
- PR #23 created: "feat: Create team functionality"

Running AI code review...
- No critical issues
- No security vulnerabilities
- Suggestion: Add input validation for team name length

RESULT: APPROVED FOR QA

Card moved: In Progress -> Review -> QA
Assigned to: [Verity] (QA)

QA test brief generated.
```

---

### Phase 4: Automated Progression

#### What Happens Automatically

Once code is in Review, the [Monitor] command (runs every 30 minutes) handles:

**Review -> QA:**
- AI code review passes? -> Auto-move to QA
- Security scan clean? -> Continue
- Issues found? -> Return to In Progress, notify you

**QA -> Staging:**
- All test cases pass? -> Auto-deploy to staging
- No critical bugs? -> Continue
- Issues found? -> Return to In Progress, notify you

**Staging -> Done:**
- Health check passes? -> Continue
- 24-hour soak test clean? -> Queue decision
- **Asks you:** "Deploy to production?"

#### The Decision Queue

When AI needs your input, it adds to `docs/decisions/pending.md`:

```markdown
## HIGH PRIORITY (Blocking Work)

### #1 - Production Deploy: Task #001

**Task**: #001 - User registration
**Requested**: 2025-12-23 14:30
**Context**: Feature complete, 24hr staging soak passed, no errors

**AI Analysis**:
All quality gates passed. No issues detected in staging.
Performance metrics within baseline. Ready for production.

**AI Recommendation**: APPROVE
**Confidence**: HIGH

**Options**:
- [x] Approve - deploy to production    <- Check this and save
- [ ] Defer until [date]
- [ ] Reject - [specify reason]

**Your Notes**:
[Write here if needed]
```

Check an option, save the file. Next [Monitor] run executes your decision.

---

### Phase 5: Daily Operations

#### Morning: Daily Digest

At 9:00 AM (configurable), you receive:

```
================================================================
DAILY PROJECT DIGEST - 2025-12-23
================================================================

EXECUTIVE SUMMARY:
Yesterday: 2 tasks completed, 1 deployed to production.
Today: 3 tasks in progress, no blockers.

DECISIONS PENDING: 1
-> #004 ready for production approval

AUTO-ACTIONS TAKEN:
- Moved #003 to QA (tests passed)
- Deployed #002 to staging
- Security scan: 0 vulnerabilities
- Updated sitemap.xml

KANBAN STATUS:
| Column      | Count |
|-------------|-------|
| Backlog     | 7     |
| Ready       | 2     |
| In Progress | 1     |
| Review      | 0     |
| QA          | 1     |
| Staging     | 1     |
| Done        | 3     |

VELOCITY: 2.5 tasks/day (+15% vs last week)

ENVIRONMENT STATUS:
- Local: OK
- Staging: OK
- Production: OK
================================================================
```

#### Evening: End of Day

```
[EndDay]
```

Claude:
```
END OF DAY SUMMARY
===================

TODAY'S COMMITS: 8
TASKS COMPLETED: 1 (#003 moved to QA)
TASKS STARTED: 1 (#004)

UNCOMMITTED CHANGES: 2 files
Options:
1. Commit as WIP
2. Stash for tomorrow
3. Leave as-is

TOMORROW'S PRIORITIES:
1. #004 - Create team (in progress)
2. #005 - Invite members (ready)
3. Review #003 QA results

Have a great evening!
```

---

### Phase 6: Environments

#### Three Consistent Environments

```
LOCAL (Development)
├── URL: http://localhost:3000
├── Database: Docker PostgreSQL or SQLite
├── Auto-deploy: No (you run npm run dev)
└── Debug: Enabled

STAGING (Preview/QA)
├── URL: https://staging.yourapp.com
├── Database: Cloud PostgreSQL (Supabase/Neon)
├── Auto-deploy: Yes (on merge to staging branch)
└── 24-hour soak test before production

PRODUCTION (Live)
├── URL: https://yourapp.com
├── Database: Cloud PostgreSQL (production instance)
├── Auto-deploy: No (requires your approval)
└── Monitoring: Health checks every 30 seconds
```

#### Environment Promotion

```
feature/004 --merge--> staging branch --auto-deploy--> Staging
                                                          |
                                              24hr soak test
                                                          |
                                              [You approve]
                                                          |
                              main branch <--merge--------+
                                   |
                              auto-deploy
                                   |
                                   v
                              Production
```

---

### Configuration Reference

#### placeholders.json

```json
{
  "project": {
    "name": "My Project",
    "production_url": "https://myproject.com",
    "staging_url": "https://staging.myproject.com",
    "local_url": "http://localhost:3000"
  },
  "autonomous_operations": {
    "enabled": true,
    "monitor": {
      "interval_minutes": 30
    },
    "auto_progression": {
      "enabled": true,
      "staging_soak_hours": 24
    },
    "notifications": {
      "digest_enabled": true,
      "digest_time": "09:00"
    }
  }
}
```

#### decision-taxonomy.json

```json
{
  "auto_execute": [
    "kanban_card_movement",
    "test_execution",
    "staging_deployment"
  ],
  "await_decision": [
    "production_deployment",
    "architectural_decision",
    "scope_change"
  ],
  "escalate_immediately": [
    "security_breach",
    "production_down"
  ]
}
```

#### quality-gates.json

```json
{
  "in_progress_to_review": {
    "gates": [
      {"name": "Tests pass", "auto": true, "required": true},
      {"name": "No secrets exposed", "auto": true, "blocking": true},
      {"name": "Lint clean", "auto": true, "required": true}
    ]
  },
  "staging_to_done": {
    "gates": [
      {"name": "24hr soak", "auto": true, "required": true},
      {"name": "Product owner approval", "auto": false, "required": true}
    ]
  }
}
```

---

### Troubleshooting

#### "Command not recognized"
Ensure slash commands are in `.claude/commands/` or Claude can read `docs-framework/slash-commands/`.

#### "Database connection failed"
Run `[SetupEnvironment]` to provision database automatically.

#### "Task won't progress"
Check which quality gate is failing:
```
[Monitor] --task=#015 --verbose
```

#### "Decision not being picked up"
Ensure you checked an option with `[x]` and saved the file.

---

### Best Practices

1. **Write detailed PRDs** - More detail = better task breakdown
2. **Let AI handle process** - Don't manually update kanban
3. **Check decisions daily** - Review `pending.md` or daily digest
4. **Trust the gates** - If something fails, there's a reason
5. **Use staging** - 24-hour soak catches issues before production

---

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/travissutphin/openSource-claudeAutoPilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/travissutphin/openSource-claudeAutoPilot/discussions)
- **Claude Code**: [Official Docs](https://claude.ai/code)

---

**Happy Building!**
