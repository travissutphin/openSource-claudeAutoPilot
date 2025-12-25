# [StartDay] - Proactive Session Startup

**Version**: 2.0.0
**Command**: `[StartDay]` or `/startday`
**Trigger**: AUTO-RUNS on every conversation start
**Purpose**: Initialize session, check status, ask about missing setup, start server
**Executor**: [Codey] (TPM) as proactive assistant

---

## AUTO-EXECUTION INSTRUCTIONS

**This workflow runs AUTOMATICALLY when a conversation starts.**
Be proactive. Don't just report - ASK questions and TAKE actions.

---

## STEP 1: Greet User & Load Context
**Executor**: [Codey]

### Actions:
1. Read `docs-framework/config/placeholders.json`
2. Get product_owner name, project name, tech stack
3. Greet user personally

### Output:
```
Good [morning/afternoon], [product_owner]!

Project: [project_name]
Tech: [primary_language] + [css_framework]
```

---

## STEP 2: Check Active Tasks
**Executor**: [Codey]

### Actions:
1. Read kanban board file (from placeholders.json paths.kanban_dev)
2. Find tasks in "Ready" column (prioritized for work)
3. Find tasks in "In Progress" column (actively being worked on)
4. Find tasks in "Review" column (awaiting code review)
5. Find tasks in "QA" column (testing)
6. Find tasks in "Staging" column (ready for deploy)

### Output:
```
CURRENT TASKS:
--------------
🎯 Ready: [list or "None"]
🔨 In Progress: #[ID] - [Title]
👀 In Review: [list or "None"]
🧪 In QA: [list or "None"]
📦 Staging: [list or "None"]

[If no active tasks]: No tasks in progress. Ready to pull from Ready column?
```

---

## STEP 3: Setup Status Check & Interactive Questions
**Executor**: [Codey], [Flow]

### Purpose:
Check for incomplete setup items. For each missing item, ASK the user if they can provide the value NOW.

### 3.1 Check Project Basics:
```
Read placeholders.json and check:

IF project.name == "[PROJECT_NAME]" (still placeholder):
   → Project not configured. Ask:
   "This project hasn't been set up yet. What's the project name?"

IF project.repository is empty or placeholder:
   → Ask: "What's the GitHub repository URL for this project?"
```

### 3.2 Check Git Repository:
```bash
# Check git status
if [ ! -d ".git" ]; then
    ASK: "Git isn't initialized. Should I run 'git init' now? (yes/no)"
    IF yes: git init
fi

REMOTE=$(git remote -v 2>/dev/null)
if [ -z "$REMOTE" ]; then
    ASK: "No git remote configured. What's your repository URL?"
    IF user provides URL: git remote add origin [URL]
fi
```

### 3.3 Check Environment Variables:
```
IF .env.example exists but .env doesn't:
   → Run: cp .env.example .env
   → Tell user: "Created .env from .env.example"

IF .env exists:
   Read setup_tasks.env_file.variables from placeholders.json
   For each required variable:
      Check if value is empty or placeholder

      IF DATABASE_URL is empty:
         ASK: "DATABASE_URL is empty. Do you have your PostgreSQL connection string?
               Format: postgresql://user:password@localhost:5432/dbname"
         IF user provides: Update .env file

      IF NEXTAUTH_SECRET is empty:
         ASK: "NEXTAUTH_SECRET is empty. Want me to generate one for you?"
         IF yes: Run openssl rand -base64 32, update .env

      IF [API_KEY] variables are empty (RESEND_API_KEY, STRIPE_SECRET_KEY, etc.):
         ASK: "I see [SERVICE]_API_KEY is empty. Do you have your API key from [service]?"
         IF user provides: Update .env file
         IF user says "skip" or "later": Note it and move on
```

### 3.4 Check Dependencies:
```bash
IF package.json exists AND node_modules doesn't:
   ASK: "Dependencies aren't installed. Should I run 'npm install' now?"
   IF yes: npm install

IF composer.json exists AND vendor doesn't:
   ASK: "Composer dependencies aren't installed. Run 'composer install'?"
   IF yes: composer install
```

### 3.5 Check Database:
```bash
IF setup_tasks.database.required == true:
   IF prisma/migrations is empty or doesn't exist:
      IF DATABASE_URL is configured:
         ASK: "Database hasn't been migrated. Run migration now?"
         IF yes: npx prisma migrate dev --name init
      ELSE:
         REMIND: "Database migration pending - configure DATABASE_URL first"
```

### Output Format (for incomplete items):
```
SETUP REMINDERS:
----------------
⚠️ [Item] - [Status]
   → [Question or action needed]
```

---

## STEP 4: Start Local Development Server
**Executor**: [Flow]

### Actions:
1. Read dev server command from placeholders.json (setup_tasks.dev_server.command)
2. Check if server is already running on configured port
3. If not running, start it

### For Node.js projects:
```bash
# Check if already running
if ! netstat -ano | grep ":[PORT]" > /dev/null 2>&1; then
    echo "Starting dev server..."
    npm run dev &
    # or: node server.js &
fi
```

### For PHP/XAMPP projects:
```bash
# Check if Apache is running on port 80
if ! netstat -ano | grep ":80" > /dev/null 2>&1; then
    ASK: "Local server isn't running.
          Option 1: Start XAMPP Apache manually
          Option 2: I can run 'php -S localhost:8080 -t public'
          Which do you prefer?"
fi
```

### Output:
```
LOCAL SERVER:
-------------
✅ Running at [LOCAL_URL]
   Ready for testing!
```

---

## STEP 5: Summary & Next Steps
**Executor**: [Codey]

### Final Output:
```
=====================================
SESSION READY
=====================================

Project: [project_name]
Server: [LOCAL_URL] ✅

ACTIVE WORK:
- [Current task or "No active tasks"]

SETUP STATUS:
- [✅ All configured / ⚠️ X items need attention]

SUGGESTED NEXT ACTION:
→ [Based on context:
   - Continue work on #[ID]
   - Pull a task from backlog
   - Complete setup item X
   - etc.]

What would you like to work on?
=====================================
```

---

## INTERACTIVE QUESTION HANDLING

When asking setup questions, handle responses like:

**If user provides value:**
- Update the appropriate file (.env, placeholders.json, etc.)
- Confirm: "Updated [file]. Moving on..."

**If user says "skip" or "later":**
- Note it, move on
- Will ask again next session

**If user says "I don't have it":**
- Provide help: "You can get this from [where]"
- Move on, will remind next session

**If user asks "what is this?":**
- Explain what the value is for and where to find it

---

## CONFIGURATION

This workflow reads from `docs-framework/config/placeholders.json`:

```json
{
  "project": { "name": "...", "repository": "..." },
  "team": { "product_owner": "..." },
  "tech_stack": { "primary_language": "...", "port": "..." },
  "paths": { "kanban_dev": "..." },
  "setup_tasks": {
    "env_file": {
      "required": true,
      "variables": ["DATABASE_URL", "NEXTAUTH_SECRET", "..."]
    },
    "git_init": { "required": true, "remote_url": "" },
    "dependencies": { "required": true, "command": "npm install" },
    "database": { "required": true, "migration_command": "npx prisma migrate dev" },
    "dev_server": { "command": "npm run dev" }
  }
}
```

---

## VERSION HISTORY

- v2.0.0 (2025-12-22): Complete rewrite - proactive assistant, auto-start, interactive questions
- v1.2.0 (2025-12-22): Enhanced health check
- v1.1.0 (2025-12-22): Added Project Health Check
- v1.0.0 (2025-10-12): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-22
**Maintainer**: [Codey] (TPM)
