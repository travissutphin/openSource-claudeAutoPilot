# [SetupProject] - New Project Setup

**Version**: 2.2.0
**Command**: `[SetupProject]` or `/setupproject`
**Trigger**: Run when starting a new project or when [StartDay] detects unconfigured project
**Purpose**: Read PRD to extract project info, confirm with user, generate config files
**Executor**: [Codey] (TPM) with [PRODUCT_OWNER]

---

## AUTO-EXECUTION INSTRUCTIONS

**This is a PRD-DRIVEN workflow. Look for PRD first, extract info, confirm, then generate files.**

---

## STEP 0: Check for PRD
**Executor**: [Codey]

### Search for PRD:
```bash
# Look for PRD in common locations (in order of preference)
PRD_LOCATIONS=(
    "docs/prd/PRD.md"
    "docs/prd/*.md"
    "docs/PRD.md"
    "PRD.md"
    "*.prd.md"
)

# Check each location
for loc in "${PRD_LOCATIONS[@]}"; do
    if compgen -G "$loc" > /dev/null 2>&1; then
        PRD_FILE=$(ls $loc 2>/dev/null | head -1)
        break
    fi
done
```

### If PRD Found in Root - Move It:
```bash
# If PRD is in root, move it to proper location
if [ -f "PRD.md" ] || compgen -G "*.prd.md" > /dev/null 2>&1; then
    mkdir -p docs/prd

    if [ -f "PRD.md" ]; then
        mv PRD.md docs/prd/PRD.md
        echo "Moved PRD.md → docs/prd/PRD.md"
        PRD_FILE="docs/prd/PRD.md"
    fi

    # Move any *.prd.md files too
    for f in *.prd.md; do
        if [ -f "$f" ]; then
            mv "$f" "docs/prd/$f"
            echo "Moved $f → docs/prd/$f"
            PRD_FILE="docs/prd/$f"
        fi
    done
fi
```

### If PRD Found:
```
PROJECT SETUP
==============

I found your PRD: [PRD_FILE]

Let me extract project information...

EXTRACTED FROM PRD:
-------------------
- Project Name: [extracted from # heading or ## Overview]
- Description: [extracted from Overview section]
- Tech Stack: [extracted from ## Technical Requirements]
- Database: [extracted from tech requirements]

SPRINTS/MILESTONES IDENTIFIED:
------------------------------
[For each ## Milestone or ## Sprint or ## Phase section found:]
- Sprint 1: [Name] - [X] tasks
- Sprint 2: [Name] - [X] tasks
- Sprint 3: [Name] - [X] tasks

TOTAL: [X] tasks across [Y] sprints

Is this correct? (yes / no / let me clarify)
```

If user says YES → Skip to STEP 1B (just ask for missing info like URLs, owner name)
If user says NO → Proceed to STEP 1A (ask all questions manually)

### If No PRD Found:
```
PROJECT SETUP
==============

No PRD found. You can either:

1. Add your PRD to docs/prd/PRD.md and run [SetupProject] again
2. Continue without PRD (I'll ask questions manually)

Which would you prefer? (1 / 2)
```

If 1 → Wait for user to add PRD
If 2 → Proceed to STEP 1A

---

## STEP 1A: Manual Setup (No PRD)
**Executor**: [Codey]

### Check for Existing Setup:
```bash
if [ -f ".autopilot/config/placeholders.json" ]; then
    # Check if already configured
    if grep -q '"name": "\[PROJECT_NAME\]"' .autopilot/config/placeholders.json; then
        # Not configured yet, proceed
    else
        # Already configured
        ASK: "This project is already set up as [project_name].
              Do you want to reconfigure? (yes/no)"
    fi
fi
```

### Ask Basic Questions:
```
PROJECT SETUP (Manual Mode)
============================

Let's set up your project. I'll ask a few questions.

1. What's your name? (You'll be the Product Owner)

2. What's the project name?

3. Brief description of what you're building?
```

Wait for answers before proceeding to STEP 2.

---

## STEP 1B: PRD-Assisted Setup
**Executor**: [Codey]

### Ask Only Missing Info:
```
ADDITIONAL INFO NEEDED
=======================

I extracted most info from your PRD. Just need a few more details:

1. What's your name? (You'll be the Product Owner)

2. Local development URL?
   Example: http://localhost:3000

3. Production URL (if known)?
   Example: https://myproject.com
   (Type "unknown" if you don't have one yet)

4. GitHub repository URL?
   Example: https://github.com/username/project
   (Type "later" to skip for now)
```

Skip to STEP 4 (Environment Variables) after answers.

---

## STEP 2: Tech Stack
**Executor**: [Codey], [Syntax]

### Ask Tech Questions:
```
TECH STACK
===========

4. What's your primary language/framework?
   Examples: Next.js, PHP, Node.js + Express, React, etc.

5. CSS framework?
   Examples: Tailwind CSS, Bootstrap, plain CSS

6. Database (if any)?
   Examples: PostgreSQL, MySQL, MongoDB, none

7. What port for local development?
   Examples: 3000, 8080, 80
```

Wait for answers before proceeding.

---

## STEP 3: URLs & Repository
**Executor**: [Codey]

### Ask URL Questions:
```
URLS & REPOSITORY
==================

8. Local development URL?
   Example: http://localhost:3000

9. Production URL (if known)?
   Example: https://myproject.com
   (Type "unknown" if you don't have one yet)

10. GitHub repository URL?
    Example: https://github.com/username/project
    (Type "later" to skip for now)
```

Wait for answers before proceeding.

---

## STEP 4: Environment Variables
**Executor**: [Codey], [Flow]

### Ask About Required Services:
```
ENVIRONMENT VARIABLES
======================

Which services will your project use? (Answer yes/no for each)

11. Database connection? (DATABASE_URL)
12. Authentication secrets? (NEXTAUTH_SECRET, etc.)
13. Email service? (Which one: Resend, SendGrid, etc.)
14. File storage? (Which one: Cloudinary, AWS S3, etc.)
15. Payments? (Stripe, etc.)
16. Any other API keys?
```

Based on answers, build the list of required env variables.

---

## STEP 5: Extract Sprints & Tasks from PRD
**Executor**: [Codey]

### 5.1 Parse PRD for Sprints/Milestones:

Look for these patterns in the PRD to identify sprints:
- `## Sprint X:` or `## Sprint X -`
- `## Milestone X:` or `## Milestone X -`
- `## Phase X:` or `## Phase X -`
- `## MVP` (treat as Sprint 1)
- `## v1.0`, `## v2.0` (version-based milestones)

```
PRD PARSING RULES:
------------------

1. SPRINT DETECTION:
   - Each ## Milestone/Sprint/Phase heading = 1 Sprint
   - If no explicit sprints, create "Sprint 1: MVP" with all features

2. TASK EXTRACTION (within each sprint):
   - Each ### Feature or ### heading = 1 Task
   - Each bullet point under "Features:" = 1 Task
   - Each numbered item in a list = 1 Task
   - User stories ("As a...") = 1 Task each

3. TASK PROPERTIES:
   - Title: The feature/item name
   - Description: Any sub-bullets or description text
   - Type: "feature" (default), "bug", "chore" based on keywords
   - Priority: "high" for MVP/critical, "medium" default, "low" for nice-to-have
   - Acceptance Criteria: Sub-bullets or checkbox items
```

### 5.2 Build Sprint Data Structure:

```json
{
  "sprints": [
    {
      "number": 1,
      "name": "Foundation & Auth",
      "goal": "Users can register and log in",
      "status": "active",
      "tasks": [
        {
          "id": "001",
          "title": "User Registration",
          "description": "Allow users to create accounts",
          "type": "feature",
          "priority": "high",
          "acceptance_criteria": [
            "Email/password registration form",
            "Email validation",
            "Password strength requirements"
          ]
        }
      ]
    },
    {
      "number": 2,
      "name": "Core Features",
      "goal": "Main functionality working",
      "status": "pending",
      "tasks": [...]
    }
  ]
}
```

### 5.3 Confirm Sprints with User:

```
SPRINT BREAKDOWN
=================

I've organized your PRD into the following sprints:

SPRINT 1: [Name]
Goal: [Extracted or inferred goal]
Tasks: [X] items
- #001 [Task Title] (high)
- #002 [Task Title] (medium)
- ...

SPRINT 2: [Name]
Goal: [Extracted or inferred goal]
Tasks: [X] items
- #00X [Task Title] (high)
- ...

[Continue for all sprints]

---
Total: [X] tasks across [Y] sprints

Does this breakdown look right?
- yes: Proceed with this structure
- adjust: Let me know what to change
- single: Put everything in one sprint
```

### 5.4 Handle No Clear Sprints:

If PRD has no clear milestone structure:
```
SPRINT ORGANIZATION
====================

Your PRD doesn't have explicit milestones. I can organize tasks as:

1. Single Sprint - All [X] tasks in Sprint 1
2. Auto-Split - Divide into ~10 tasks per sprint
3. Manual - You tell me how to group them

Which approach? (1 / 2 / 3)
```

---

## STEP 6: Generate Configuration Files
**Executor**: [Codey]

### 6.1 Generate placeholders.json:
```bash
cat > .autopilot/config/placeholders.json << 'EOF'
{
  "_comment": "Project configuration - Generated by [SetupProject]",
  "_version": "2.0.0",
  "_generated": "[CURRENT_DATE]",

  "project": {
    "name": "[collected_name]",
    "description": "[collected_description]",
    "repository": "[collected_repo]",
    "production_url": "[collected_prod_url]",
    "local_url": "[collected_local_url]"
  },

  "tech_stack": {
    "primary_language": "[collected_language]",
    "css_framework": "[collected_css]",
    "database": "[collected_database]",
    "port": "[collected_port]"
  },

  "team": {
    "product_owner": "[collected_owner]",
    "tpm": "Codey",
    "principal_engineer": "Syntax",
    "designer": "Aesthetica",
    "devops": "Flow",
    "qa": "Verity",
    "security": "Sentinal",
    "marketing_seo": "Bran",
    "content_strategist": "Echo",
    "storybrand_expert": "Cipher"
  },

  "paths": {
    "docs_root": "/docs",
    "kanban_dev": "/docs/kanban/kanban_dev.html",
    "public_root": "/public"
  },

  "git": {
    "main_branch": "main",
    "feature_prefix": "feature/"
  },

  "setup_tasks": {
    "env_file": {
      "required": [true if any env vars needed],
      "variables": [list of required variables]
    },
    "git_init": {
      "required": true,
      "remote_url": "[collected_repo]"
    },
    "dependencies": {
      "required": true,
      "command": "[npm install or composer install]"
    },
    "database": {
      "required": [true if database selected],
      "migration_command": "[appropriate migration command]"
    },
    "dev_server": {
      "command": "[appropriate dev command]"
    }
  }
}
EOF
```

### 6.2 Generate .env.example (if env vars required):
```bash
cat > .env.example << 'EOF'
# [PROJECT_NAME] Environment Variables
# Copy to .env and fill in your values
# Generated by [SetupProject]

[For each collected env variable, add with placeholder:]

# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# AUTHENTICATION
NEXTAUTH_SECRET=""
NEXTAUTH_URL="[collected_local_url]"

# [SERVICE] (based on answers)
[SERVICE]_API_KEY=""

EOF
```

### 6.3 Generate CLAUDE.md:
Copy from `.autopilot/templates/CLAUDE.md.template` and replace placeholders.

### 6.4 Create Directory Structure:
```bash
mkdir -p docs/kanban
mkdir -p docs/deployment
```

### 6.5 Generate Kanban Board with Sprints:

Generate the kanban board from template, creating a tab and board for each sprint:

```
KANBAN GENERATION PROCESS:
---------------------------

1. COPY TEMPLATE:
   cp .autopilot/templates/kanban_dev.html.template docs/kanban/kanban_dev.html

2. REPLACE PROJECT PLACEHOLDERS:
   - [PROJECT_NAME] → Actual project name

3. GENERATE SPRINT TABS (between SPRINT_TABS_START and SPRINT_TABS_END):
   For each sprint in sprints array:

   <button onclick="showSprint([N])" class="sprint-tab [sprint-tab-active if N=1]
       flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" data-sprint="[N]">
       <i data-lucide="layers" class="w-4 h-4"></i>
       Sprint [N]
       <span class="text-xs opacity-75">([status])</span>
   </button>

4. GENERATE SPRINT BOARDS (between SPRINT_BOARDS_START and SPRINT_BOARDS_END):
   For each sprint, create a complete board section:

   <div id="sprint-[N]" class="sprint-board [sprint-hidden if N>1]">
       <!-- Sprint Header -->
       <div class="bg-white border border-gray-200 rounded-xl p-5 mb-6">
           <div class="flex items-start justify-between">
               <div>
                   <div class="flex items-center gap-2 mb-1">
                       <i data-lucide="target" class="w-5 h-5 text-gray-400"></i>
                       <h2 class="font-semibold text-gray-900">Sprint [N]: [sprint.name]</h2>
                   </div>
                   <p class="text-gray-600 text-sm ml-7">[sprint.goal]</p>
               </div>
               <span class="badge bg-[status-color]-100 text-[status-color]-700">
                   [status badge]
               </span>
           </div>
       </div>

       <!-- Column Filter Tabs (copy from template, update IDs with sprint number) -->

       <!-- Kanban Board Grid -->
       <div class="grid grid-cols-4 gap-4" id="kanban-board-[N]">
           <!-- 4 columns: backlog, in_progress, qa, live -->
           <!-- Update all IDs to include sprint number: col-backlog-[N], etc. -->
       </div>
   </div>

5. GENERATE TASK CARDS (in Backlog column of each sprint):
   For each task in sprint.tasks:

   <div class="kanban-card bg-white rounded-lg p-4 shadow-sm border border-gray-100 priority-[task.priority]"
        data-id="[task.id]"
        data-type="[task.type]"
        data-priority="[task.priority]"
        data-sprint="[N]"
        data-created="[today's date]"
        onclick="toggleCard(this)">
       <div class="flex items-start justify-between mb-2">
           <span class="text-xs text-gray-400">#[task.id]</span>
           <span class="badge bg-blue-100 text-blue-700">[task.type]</span>
       </div>
       <h4 class="font-medium text-gray-900 text-sm mb-2">[task.title]</h4>
       <p class="text-xs text-gray-500 mb-3">[task.description]</p>
       <div class="flex items-center justify-between text-xs">
           <span class="text-gray-500">Unassigned</span>
           <span class="text-gray-400">Just added</span>
       </div>
       <div class="card-details mt-4 pt-4 border-t border-gray-100">
           <h5 class="text-xs font-semibold text-gray-700 mb-2">Acceptance Criteria</h5>
           <ul class="text-xs text-gray-600 space-y-2">
               [For each criterion in task.acceptance_criteria:]
               <li class="acceptance-item">[criterion]</li>
           </ul>
       </div>
   </div>
```

### Task ID Numbering:
- Use 3-digit IDs: 001, 002, 003...
- Number sequentially across all sprints
- Sprint 1 tasks: 001-0XX
- Sprint 2 tasks: continue from last Sprint 1 ID

---

## STEP 7: Offer Automated Setup
**Executor**: [Flow]

### Ask User:
```
AUTOMATED SETUP
================

I can run these commands now:

1. git init
2. git remote add origin [repo_url]
3. Create .env from .env.example
4. Install dependencies ([npm install / composer install])

Run all of these? (yes / no / pick numbers)
```

Execute selected commands.

---

## STEP 8: Summary
**Executor**: [Codey]

### Display:
```
PROJECT SETUP COMPLETE!
========================

Project: [collected_name]
Owner: [collected_owner]
Tech: [collected_language] + [collected_css]
Local URL: [collected_local_url]

FILES CREATED:
✓ placeholders.json
✓ CLAUDE.md
✓ .env.example
✓ kanban_dev.html (with [X] sprints, [Y] tasks in backlog)

SETUP STATUS:
[List what was done and what still needs manual action]

REMAINING STEPS:
[List any incomplete items like:]
- Set up database and generate secrets
- Fill in external service API keys
- Run database migration
- etc.
```

---

## STEP 9: Offer Environment Setup
**Executor**: [Codey]

### Ask User (Do Not Auto-Execute):
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

### If User Says Yes:
Execute `[SetupEnvironment]` workflow.

### If User Says No:
```
No problem! When you're ready, just type:

  [SetupEnvironment]

This will walk you through database setup and .env configuration.

---

Type [StartDay] to begin your first session!
Next time you start Claude, I'll automatically check in.
```

---

## TECH STACK DEFAULTS

Based on the primary language, set appropriate defaults:

### Next.js / Node.js:
```json
{
  "dependencies": { "command": "npm install" },
  "database": { "migration_command": "npx prisma migrate dev" },
  "dev_server": { "command": "npm run dev" }
}
```

### PHP:
```json
{
  "dependencies": { "command": "composer install", "required": false },
  "database": { "migration_command": "", "required": false },
  "dev_server": { "command": "php -S localhost:[port] -t public" }
}
```

### Python / Django:
```json
{
  "dependencies": { "command": "pip install -r requirements.txt" },
  "database": { "migration_command": "python manage.py migrate" },
  "dev_server": { "command": "python manage.py runserver" }
}
```

---

## VERSION HISTORY

- v3.0.0 (2026-01-03): Sprint/milestone extraction from PRD, generates kanban with sprint tabs and task cards
- v2.2.0 (2025-12-25): PRD-driven setup - reads PRD first, extracts project info, confirms with user
- v2.1.0 (2025-12-23): Added Step 8 - offers [SetupEnvironment] at end (user decides)
- v2.0.0 (2025-12-22): Simplified universal setup - question-driven, no PRD parsing
- v1.0.0 (2025-10-12): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2026-01-03
**Maintainer**: [Codey] (TPM)
