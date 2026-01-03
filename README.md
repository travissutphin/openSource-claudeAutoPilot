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

## Quick Start

### 1. Fork or Clone

```bash
git clone https://github.com/travissutphin/openSource-claudeAutoPilot.git my-project
cd my-project
```

### 2. Add Your PRD

Place your PRD in the project:

```
docs/prd/PRD.md
```

Or just drop `PRD.md` in the root - it will be moved automatically.

See `.autopilot/examples/sample-prd-saas.md` for the expected format.
Need help? Visit [rapidPRD.app](https://rapidprd.app) for AI-assisted PRD creation.

### 3. Open Claude Code

```bash
claude
```

### 4. Run Setup

```
[SetupProject]
```

Claude reads your PRD and configures your project. It will confirm or ask clarifying questions.

### 5. Start Building

```
[StartDay]
```

Claude breaks your PRD into tasks on the kanban board and guides you through implementation.

---

## Project Structure

```
my-project/
├── .autopilot/              # Framework files (hidden, out of the way)
│   ├── automation/          # Scripts for autonomous operation
│   ├── config/              # Configuration files
│   ├── docs/                # Framework documentation
│   ├── examples/            # Sample PRDs and configs
│   └── templates/           # Templates for generated files
├── .claude/
│   └── commands/            # Slash commands for Claude Code
├── docs/
│   └── prd/
│       └── PRD.md           # YOUR PRD GOES HERE
├── .gitignore
├── LICENSE
├── README.md
└── CONTRIBUTING.md

# After [SetupProject], your project files appear here:
├── CLAUDE.md                # Generated AI instructions
├── docs/
│   └── kanban/
│       └── kanban_dev.html  # Your project kanban board
├── .env.example             # Environment template
└── [your project files]
```

---

## Core Commands

| Command | When to Use | What Happens |
|---------|-------------|--------------|
| `[SetupProject]` | New project | Configure project from PRD |
| `[SetupEnvironment]` | After setup | Provision database, generate secrets |
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
   │        │          │            │        │       │        │
   │        │          │            │        │       │        └── Production
   │        │          │            │        │       └── 24hr soak test
   │        │          │            │        └── Automated testing
   │        │          │            └── AI + human code review
   │        │          └── You're coding
   │        └── Prioritized for work
   └── All tasks from PRD
```

---

## What You Need

- [Claude Code](https://claude.ai/code) installed
- Node.js 18+ (for automation scripts)
- Git
- A PRD ([rapidPRD.app](https://rapidprd.app) can help)

---

## Decision-Only Notifications

Claude handles 90% of workflow automatically. You're only asked when:

| Decision Type | Example |
|---------------|---------|
| Production deploy | "Task #15 ready for production. Approve?" |
| Architecture change | "Should we use Redis or in-memory caching?" |
| Scope change | "This feature needs 2 more tasks. Proceed?" |
| Security issue | "Medium vulnerability found. Fix now or defer?" |

Decisions appear in `.autopilot/docs/decisions/pending.md` or your daily digest.

---

## Documentation

- **Setup Guide**: `.autopilot/docs/SETUP-NEW-PROJECT.md`
- **Task Lifecycle**: `.autopilot/docs/TASK-LIFECYCLE.md`
- **Example PRD**: `.autopilot/examples/sample-prd-saas.md`
- **Configuration**: `.autopilot/config/`

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

**Happy Building!**
