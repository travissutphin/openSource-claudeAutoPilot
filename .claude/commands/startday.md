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
1. Read `.autopilot/config/placeholders.json`
2. Get product_owner name, project name, tech stack
3. Greet user personally

### Output:
```
Good [morning/afternoon], [product_owner]!

Project: [project_name]
Tech: [primary_language] + [css_framework]
```

---

## STEP 2: Check Required Services
**Executor**: [Flow]

### Purpose:
Check if required local services are running. If not, ASK user to start them.

### 2.1 Check Database Services:
```bash
# PostgreSQL (default port 5432)
if netstat -ano | grep ":5432" > /dev/null 2>&1; then
    echo "PostgreSQL: Running ✅"
else
    # Check if Docker is being used for PostgreSQL
    if docker ps 2>/dev/null | grep -q postgres; then
        echo "PostgreSQL (Docker): Running ✅"
    else
        ASK: "PostgreSQL is not running. Please start it:
              - Docker: docker-compose up -d postgres
              - Local: Start PostgreSQL service
              - XAMPP: Start from XAMPP Control Panel

              Let me know when it's running (yes/skip)"
    fi
fi

# MySQL/MariaDB (default port 3306)
if netstat -ano | grep ":3306" > /dev/null 2>&1; then
    echo "MySQL/MariaDB: Running ✅"
else
    ASK: "MySQL/MariaDB is not running. Please start it:
          - XAMPP: Start MySQL from Control Panel
          - Docker: docker-compose up -d mysql
          - Local: Start MySQL service

          Let me know when it's running (yes/skip)"
fi

# MongoDB (default port 27017)
if netstat -ano | grep ":27017" > /dev/null 2>&1; then
    echo "MongoDB: Running ✅"
fi

# Redis (default port 6379)
if netstat -ano | grep ":6379" > /dev/null 2>&1; then
    echo "Redis: Running ✅"
fi
```

### 2.2 Check Docker (if docker-compose.yml exists):
```bash
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    # Check if Docker daemon is running
    if ! docker info > /dev/null 2>&1; then
        ASK: "Docker is required but not running. Please start Docker Desktop.
              Let me know when it's running (yes/skip)"
    else
        # Check if containers are up
        RUNNING=$(docker-compose ps --filter "status=running" -q 2>/dev/null | wc -l)
        TOTAL=$(docker-compose ps -q 2>/dev/null | wc -l)

        if [ "$RUNNING" -lt "$TOTAL" ]; then
            ASK: "Docker containers are not all running ($RUNNING/$TOTAL).
                  Should I run 'docker-compose up -d'? (yes/no)"
            IF yes: docker-compose up -d
        fi
    fi
fi
```

### 2.3 Check XAMPP/Apache (for PHP projects):
```bash
# Check if Apache is needed (PHP project)
if [ -f "composer.json" ] || [ -d "public" ] && ls public/*.php 1>/dev/null 2>&1; then
    if ! netstat -ano | grep ":80\|:443" > /dev/null 2>&1; then
        ASK: "Apache/web server is not running. Please:
              - XAMPP: Start Apache from Control Panel
              - Or I can use PHP built-in server: php -S localhost:8080 -t public

              Which option? (xampp/php/skip)"
        IF php: php -S localhost:8080 -t public &
    fi
fi
```

### Output:
```
SERVICES STATUS:
----------------
[✅/⚠️] Database: [status]
[✅/⚠️] Docker: [status if applicable]
[✅/⚠️] Web Server: [status]
```

---

## STEP 3: Check Active Tasks
**Executor**: [Codey]

### Actions:
1. Read kanban board file (from placeholders.json paths.kanban_dev)
2. Find tasks in "Backlog" column (queued to complete)
3. Find tasks in "In Progress" column (AI team actively working)
4. Find tasks in "QA" column (ready for QA)
5. Find tasks in "Live" column (pushed to production)

### Output:
```
CURRENT TASKS:
--------------
📋 Backlog: [count] tasks queued
🔨 In Progress: #[ID] - [Title]
🧪 QA: [list or "None"]
🚀 Live: [recent deployments]

[If no active tasks]: No tasks in progress. Ready to pull from Backlog?
```

---

## STEP 4: Setup Status Check & Interactive Questions
**Executor**: [Codey], [Flow]

### Purpose:
Check for incomplete setup items. For each missing item, ASK the user if they can provide the value NOW.

### 4.1 Check Project Basics:
```
Read placeholders.json and check:

IF project.name == "[PROJECT_NAME]" (still placeholder):
   → Project not configured. Ask:
   "This project hasn't been set up yet. What's the project name?"

IF project.repository is empty or placeholder:
   → Ask: "What's the GitHub repository URL for this project?"
```

### 4.2 Check Git Repository:
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

### 4.3 Check Environment Variables:
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

### 4.4 Check Dependencies:
```bash
IF package.json exists AND node_modules doesn't:
   ASK: "Dependencies aren't installed. Should I run 'npm install' now?"
   IF yes: npm install

IF composer.json exists AND vendor doesn't:
   ASK: "Composer dependencies aren't installed. Run 'composer install'?"
   IF yes: composer install
```

### 4.5 Check Database:
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

## STEP 5: Start Local Development Server
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

## STEP 6: Summary & Next Steps
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

This workflow reads from `.autopilot/config/placeholders.json`:

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
