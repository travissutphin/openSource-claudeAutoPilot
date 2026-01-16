# [SetupProject] - New Project Setup

**Version**: 3.1.0
**Command**: `[SetupProject]` or `/setupproject`
**Trigger**: Run when starting a new project or when [StartDay] detects unconfigured project
**Purpose**: Read PRD to extract project info, validate quality, confirm with user, generate config files safely
**Executor**: [Codey] (TPM) with [PRODUCT_OWNER]

---

## AUTO-EXECUTION INSTRUCTIONS

**This is a PRD-DRIVEN workflow with validation. Look for PRD first, validate quality, extract info, confirm in ONE interaction, preview changes, then generate files with backup.**

**Key Improvements in v3.1:**
1. **Single Smart Form** - All questions in one interaction (not 4+ rounds)
2. **PRD Validation** - Quality check before task extraction
3. **Safe File Generation** - Preview changes, automatic backups, preserves customizations

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
Use the PRD validator to analyze and extract data:
```bash
node .autopilot/automation/prd-validator.js "$PRD_FILE" --setup-data > /tmp/prd-data.json
node .autopilot/automation/prd-validator.js "$PRD_FILE" --score
```

Then proceed to **STEP 1B** (Smart Setup Form with PRD data pre-filled).

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

Wait for answers, then proceed to the **Smart Setup Form** (Step 1B) with manual answers pre-filled.

---

## STEP 1B: UNIFIED SETUP CONFIRMATION (Smart Form)
**Executor**: [Codey]

**Purpose**: Collect ALL setup information in ONE interaction instead of 4+ separate rounds.

### 1B.1 Build the Smart Form

Using PRD data (if available) and any manual answers, construct this form:

```
╔══════════════════════════════════════════════════════════════════╗
║                    SETUP CONFIRMATION                             ║
║         ✓ = Extracted from PRD  |  ○ = Needs your input          ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ PROJECT                                                           ║
║ ─────────────────────────────────────────────────────────────────║
║ [✓/○] Name: {prd.name || "_______________"}                      ║
║ [✓/○] Description: {prd.description || "_______________"}        ║
║   ○   Your name (Product Owner): _______________                 ║
║   ○   GitHub repo: _______________                               ║
║                                                                   ║
║ TECH STACK                                                        ║
║ ─────────────────────────────────────────────────────────────────║
║ [✓/○] Framework: {prd.tech.framework || "_______________"}       ║
║ [✓/○] CSS: {prd.tech.css || "Tailwind CSS"}                      ║
║ [✓/○] Database: {prd.tech.database || "_______________"}         ║
║   ○   Local port [3000]: ___                                     ║
║                                                                   ║
║ URLS                                                              ║
║ ─────────────────────────────────────────────────────────────────║
║   ○   Local URL [http://localhost:3000]: ___                     ║
║   ○   Production URL: _______________                            ║
║                                                                   ║
║ SERVICES (check what you'll use)                                  ║
║ ─────────────────────────────────────────────────────────────────║
║ [ ] Database connection (DATABASE_URL)                           ║
║ [ ] Authentication (NextAuth/Auth.js/Clerk)                      ║
║ [ ] Payments (Stripe)                                            ║
║ [ ] Email service (Resend/SendGrid/Postmark)                     ║
║ [ ] File storage (S3/Cloudinary/Uploadthing)                     ║
║ [ ] Other API keys: _______________                              ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝

Ready? (yes / adjust [field] / help)
```

### 1B.2 PRD Field Extraction Mapping

| Form Field | PRD Location to Check | Pattern |
|------------|----------------------|---------|
| Name | First H1, `## Project Name` | `^#\s+(.+)` |
| Description | `## Overview`, first paragraph | First 200 chars after title |
| Framework | `## Technical`, keywords | Next.js, React, Vue, etc. |
| CSS | Keywords in tech section | Tailwind, Bootstrap, etc. |
| Database | Keywords in tech section | PostgreSQL, MySQL, MongoDB, etc. |

### 1B.3 Response Handling

**If user says "yes"**:
- Store all collected data
- Proceed to Step 2 (PRD Health Check)

**If user says "adjust [field]"**:
- Accept correction for that specific field
- Re-display updated form
- Confirm again

**If user provides all values at once** (freeform):
- Parse freeform response matching to form fields
- Confirm the parsed values
- Proceed when confirmed

### 1B.4 Collected Data Structure

Store all answers in this structure for later use:

```json
{
  "collected": {
    "project": {
      "name": "TaskFlow Pro",
      "name_source": "prd",
      "description": "Project management SaaS",
      "description_source": "prd",
      "owner": "John Smith",
      "owner_source": "user",
      "repository": "https://github.com/user/taskflow",
      "repository_source": "user"
    },
    "tech_stack": {
      "framework": "Next.js 14",
      "framework_source": "prd",
      "css": "Tailwind CSS",
      "css_source": "default",
      "database": "PostgreSQL",
      "database_source": "prd",
      "port": 3000,
      "port_source": "default"
    },
    "urls": {
      "local": "http://localhost:3000",
      "local_source": "default",
      "production": "https://taskflow.app",
      "production_source": "user"
    },
    "services": {
      "database": true,
      "auth": true,
      "payments": true,
      "email": "resend",
      "storage": false,
      "other": []
    }
  }
}
```

---

## STEP 2: PRD HEALTH CHECK
**Executor**: [Codey]

**Purpose**: Validate PRD quality and catch issues BEFORE task extraction.

### 2.1 Run PRD Validator

```bash
node .autopilot/automation/prd-validator.js "$PRD_FILE" --report
```

### 2.2 Display Analysis Report

```
PRD ANALYSIS REPORT
═══════════════════════════════════════════════════════════

STRUCTURE SCAN:
✓ Project overview found (line 3)
✓ Technical requirements section (line 208)
✓ Features section with 7 features (line 71)
⚠ No explicit sprints/milestones (will auto-organize)
✗ Missing: Acceptance criteria for 3/7 features

TASK EXTRACTION PREVIEW:
Found 23 potential tasks:
  • 7 from ## Features section (lines 71-204)
  • 12 from user stories (lines 36-67)
  • 4 from ## Technical Requirements (lines 208-231)

QUALITY SCORE: 72/100
  - Structure: 18/25
  - Completeness: 15/25
  - Clarity: 22/25
  - Actionability: 17/25

═══════════════════════════════════════════════════════════
```

### 2.3 Show Suggestions (if issues found)

If quality score < 80 or critical issues exist:

```
SUGGESTIONS FOR IMPROVEMENT:

1. 🔴 ADD ACCEPTANCE CRITERIA (3 features missing)
   Features without criteria: User Profile, Settings, Notifications

   Example format:
   ### User Profile
   **Acceptance Criteria:**
   - [ ] User can view their profile
   - [ ] User can edit display name
   - [ ] User can upload avatar

2. 🟡 ORGANIZE INTO MILESTONES
   Your PRD has no sprint organization. Recommend adding:

   ## Milestone 1: MVP (Core Features)
   - User Authentication
   - Dashboard
   - Basic CRUD

   ## Milestone 2: Growth Features
   - Team Management
   - Integrations

3. 🟢 CLARIFY DEPENDENCIES
   Some features may depend on others. Consider noting:
   "Depends on: User Authentication"
```

### 2.4 User Options

```
OPTIONS:
─────────────────────────────────────────────────────────────
[proceed]  Continue with current PRD (23 tasks, auto-organized)
[enhance]  I'll add structure to your PRD (creates backup first)
[manual]   Update PRD manually, then re-run /setupproject
[details]  Show me exactly what will be extracted
─────────────────────────────────────────────────────────────
Choose:
```

### 2.5 Handle Options

**If "proceed"**: Continue to Step 3 (Sprint Extraction)

**If "enhance"**:
1. Backup original PRD: `cp docs/prd/PRD.md docs/prd/PRD.md.backup.[timestamp]`
2. Add missing acceptance criteria placeholders
3. Organize features into logical milestones
4. Show diff of changes
5. Confirm save, then continue to Step 3

**If "manual"**: Exit with instructions to re-run after manual PRD edits

**If "details"**: Show full task extraction preview, then return to options

### 2.6 Skip for Manual Setup

If no PRD (Step 1A path), skip Step 2 entirely and proceed to Step 3.

---

## STEP 3: Extract Sprints & Tasks from PRD
**Executor**: [Codey]

### 3.1 Parse PRD for Sprints/Milestones:

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

### 3.2 Build Sprint Data Structure:

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

### 3.3 Confirm Sprints with User:

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

### 3.4 Handle No Clear Sprints:

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

## STEP 4: FILE GENERATION PREVIEW
**Executor**: [Codey]

**Purpose**: Show what will change BEFORE modifying files. Create backups. Allow user to skip specific files.

### 4.1 Scan Existing Files

Check each target file's current state:

| File | Check |
|------|-------|
| `.autopilot/config/placeholders.json` | Exists? Modified from template? |
| `.env.example` | Exists? Has custom variables? |
| `CLAUDE.md` | Exists? Has `# CUSTOM` marker? |
| `docs/kanban/kanban_dev.html` | Exists? Has tasks? |

### 4.2 Use File Generator to Plan

```javascript
const { FileGenerator } = require('.autopilot/automation/file-generator.js');
const generator = new FileGenerator(projectRoot);

// Prepare file content
const files = [
  { path: '.autopilot/config/placeholders.json', content: placeholdersContent },
  { path: '.env.example', content: envExampleContent },
  { path: 'CLAUDE.md', content: claudeContent },
  { path: 'docs/kanban/kanban_dev.html', content: kanbanContent, description: `(${taskCount} tasks)` }
];

// Plan operations
const plan = generator.planOperations(files);

// Show preview
console.log(generator.generatePreview(plan));
```

### 4.3 Display Preview

```
╔══════════════════════════════════════════════════════════════════╗
║                    FILE GENERATION PREVIEW                        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ WILL CREATE (new files):                                         ║
║ ─────────────────────────────────────────────────────────────────║
║ + docs/kanban/kanban_dev.html (23 tasks across 3 sprints)        ║
║ + .env.example (12 variables)                                    ║
║                                                                   ║
║ WILL UPDATE (changes detected):                                   ║
║ ─────────────────────────────────────────────────────────────────║
║ ~ .autopilot/config/placeholders.json                            ║
║   - "name": "[PROJECT_NAME]"                                     ║
║   + "name": "TaskFlow Pro"                                       ║
║   - "repository": "[GITHUB_REPO_URL]"                            ║
║   + "repository": "https://github.com/user/taskflow"             ║
║   [+14 more field changes]                                       ║
║                                                                   ║
║ WILL SKIP (preserving your changes):                              ║
║ ─────────────────────────────────────────────────────────────────║
║ = CLAUDE.md (has # CUSTOM marker on line 1)                      ║
║                                                                   ║
║ BACKUP LOCATION:                                                  ║
║ ─────────────────────────────────────────────────────────────────║
║ .autopilot/backups/20260115_143022/                              ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝

OPTIONS:
─────────────────────────────────────────────────────────────
[yes]           Proceed with all changes (backup created first)
[preview FILE]  Show full diff for a specific file
[skip FILE]     Don't modify that file
[force FILE]    Overwrite even if custom marker present
[cancel]        Abort file generation
─────────────────────────────────────────────────────────────
Choose:
```

### 4.4 Handle Options

**If "yes"**: Proceed to Step 5 (Execute File Generation)

**If "preview [file]"**: Show full diff for that file, return to options

**If "skip [file]"**: Add file to skip list, update preview, return to options

**If "force [file]"**: Add file to force list (overwrite despite marker), return to options

**If "cancel"**: Exit setup without generating files

### 4.5 Custom File Markers

Files with these markers in the first 5 lines are automatically skipped:

```markdown
# CUSTOM - Do not overwrite
```

```html
<!-- CUSTOM - Do not overwrite -->
```

```json
{ "_custom": true, ...}
```

```javascript
// CUSTOM - Do not overwrite
```

---

## STEP 5: Execute File Generation
**Executor**: [Codey]

### 5.1 Create Backup First

```javascript
const results = generator.execute(plan, {
  skip: userSkipList,
  force: userForceList
});
// Backup created automatically at: results.backupDir
```

### 5.2 Generate placeholders.json

Use merge logic to preserve custom fields:

```javascript
const merged = generator.mergePlaceholders(
  '.autopilot/config/placeholders.json',
  collectedData
);
```

**Always Update** (from setup form):
- `project.*` (name, description, repository, urls)
- `tech_stack.*`
- `team.product_owner`

**Preserve If Customized**:
- `team.*` (except product_owner)
- `autonomous_operations.*`
- `quality_thresholds.*`
- `environments.*`

### 5.3 Generate .env.example (if env vars required):
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

### 5.4 Generate CLAUDE.md:
Copy from `.autopilot/templates/CLAUDE.md.template` and replace placeholders.
**Skip if file has CUSTOM marker.**

### 5.5 Create Directory Structure:
```bash
mkdir -p docs/kanban
mkdir -p docs/deployment
```

### 5.6 Generate Kanban Board with Sprints:

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

### 5.7 Report Results

```
FILE GENERATION COMPLETE
=========================

Created: [X] files
Updated: [Y] files
Skipped: [Z] files (preserved)

Backup saved to: .autopilot/backups/20260115_143022/
```

---

## STEP 6: Offer Automated Setup
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

## STEP 7: Summary
**Executor**: [Codey]

### Display:
```
PROJECT SETUP COMPLETE!
========================

Project: [collected_name]
Owner: [collected_owner]
Tech: [collected_language] + [collected_css]
Local URL: [collected_local_url]

FILES CREATED/UPDATED:
✓ placeholders.json
✓ CLAUDE.md
✓ .env.example
✓ kanban_dev.html (with [X] sprints, [Y] tasks in backlog)

BACKUP LOCATION:
.autopilot/backups/[timestamp]/

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

## STEP 8: Offer Environment Setup
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

## AUTOMATION SCRIPTS

### File Generator
**Path**: `.autopilot/automation/file-generator.js`
**Purpose**: Safe file generation with backup, preview, and merge logic

```bash
# List available backups
node .autopilot/automation/file-generator.js list-backups

# Restore from a backup
node .autopilot/automation/file-generator.js restore 20260115_143022
```

### PRD Validator
**Path**: `.autopilot/automation/prd-validator.js`
**Purpose**: Analyze PRD structure, extract data, generate improvement suggestions

```bash
# Full report
node .autopilot/automation/prd-validator.js docs/prd/PRD.md --report

# Just quality score
node .autopilot/automation/prd-validator.js docs/prd/PRD.md --score

# Setup form data (JSON)
node .autopilot/automation/prd-validator.js docs/prd/PRD.md --setup-data

# Suggestions only
node .autopilot/automation/prd-validator.js docs/prd/PRD.md --suggestions
```

---

## VERSION HISTORY

- v3.1.0 (2026-01-15): **Major UX improvements**
  - Single Smart Form (consolidated 4 question rounds into 1)
  - PRD Health Check with quality scoring and suggestions
  - Safe file generation with preview, backup, and merge logic
  - Added file-generator.js and prd-validator.js automation scripts
- v3.0.0 (2026-01-03): Sprint/milestone extraction from PRD, generates kanban with sprint tabs and task cards
- v2.2.0 (2025-12-25): PRD-driven setup - reads PRD first, extracts project info, confirms with user
- v2.1.0 (2025-12-23): Added Step 8 - offers [SetupEnvironment] at end (user decides)
- v2.0.0 (2025-12-22): Simplified universal setup - question-driven, no PRD parsing
- v1.0.0 (2025-10-12): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2026-01-15
**Maintainer**: [Codey] (TPM)
