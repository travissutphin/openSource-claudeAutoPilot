# [SetupEnvironment] - Automated Environment Setup

**Version**: 1.0.0
**Command**: `[SetupEnvironment]` or `/setupenvironment`
**Trigger**: After [SetupProject] or when setting up development environment
**Purpose**: Auto-provision database, generate secrets, populate .env, run setup commands
**Executor**: [Flow] (DevOps), [Codey] (TPM)

---

## AUTO-EXECUTION INSTRUCTIONS

**This command automates the "remaining manual steps" after project setup.**

The AI will:
1. Detect required services from project files
2. Ask for provider preferences (database, etc.)
3. Provision services automatically
4. Generate all secrets
5. Populate .env file
6. Run install and migration commands
7. Verify everything works

---

## STEP 1: Detect Project Requirements
**Executor**: [Codey]

### Scan Project Files:
```bash
# Check package.json for database clients
grep -E "pg|mysql|sqlite|prisma|sequelize|typeorm|mongoose" package.json

# Check for Prisma schema
[ -f "prisma/schema.prisma" ] && echo "Prisma detected"

# Check for existing .env.example
[ -f ".env.example" ] && cat .env.example

# Check docker-compose for services
[ -f "docker-compose.yml" ] && grep -E "postgres|mysql|redis|mongo" docker-compose.yml
```

### Detection Report:
```
PROJECT REQUIREMENTS DETECTED:
==============================
Database: PostgreSQL (from prisma/schema.prisma)
ORM: Prisma
Cache: None detected
Email: Resend (from package.json)
Storage: Cloudinary (from package.json)

Required .env Variables:
- DATABASE_URL (required)
- JWT_SECRET (required)
- RESEND_API_KEY (optional - email features)
- CLOUDINARY_* (optional - image uploads)
```

---

## STEP 2: Database Provider Selection
**Executor**: [Codey] asks [PRODUCT_OWNER]

### Present Options:
```
DATABASE SETUP OPTIONS:
=======================

Which database provider would you like to use?

1. [RECOMMENDED] Supabase (Cloud PostgreSQL)
   - Free: 500MB, 2 projects
   - Setup: Automatic via CLI
   - Includes: Auth, Storage, Realtime
   - Best for: Production-ready from day 1

2. Neon (Serverless PostgreSQL)
   - Free: 512MB, branching
   - Setup: Automatic via CLI
   - Best for: Database branching per PR

3. Docker (Local PostgreSQL)
   - Free: Unlimited (local)
   - Setup: Requires Docker installed
   - Best for: Offline development

4. Local PostgreSQL
   - Free: Unlimited (local)
   - Setup: Requires PostgreSQL installed
   - Best for: Existing PostgreSQL setup

5. SQLite (File-based)
   - Free: Unlimited
   - Setup: None required
   - Best for: Simple projects, prototypes

Enter choice (1-5):
```

---

## STEP 3: Provision Database
**Executor**: [Flow]

### Option 1: Supabase (Automatic)
```bash
# Check if Supabase CLI installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Login (opens browser)
supabase login

# Create new project
PROJECT_NAME="[PROJECT_NAME]-dev"
supabase projects create "$PROJECT_NAME" --org-id [ORG_ID] --db-password $(openssl rand -base64 16) --region us-east-1

# Get connection string
CONNECTION_STRING=$(supabase db url --project-ref [PROJECT_REF])

echo "Database provisioned: $PROJECT_NAME"
echo "Connection: $CONNECTION_STRING"
```

### Option 2: Neon (Automatic)
```bash
# Check if Neon CLI installed
if ! command -v neonctl &> /dev/null; then
    echo "Installing Neon CLI..."
    npm install -g neonctl
fi

# Login
neonctl auth

# Create project
PROJECT_NAME="[PROJECT_NAME]-dev"
neonctl projects create --name "$PROJECT_NAME"

# Get connection string
CONNECTION_STRING=$(neonctl connection-string --project-id [PROJECT_ID])

echo "Database provisioned: $PROJECT_NAME"
echo "Connection: $CONNECTION_STRING"
```

### Option 3: Docker (Automatic)
```bash
# Check Docker running
if ! docker info &> /dev/null; then
    echo "ERROR: Docker not running. Please start Docker Desktop."
    exit 1
fi

# Create docker-compose.yml if not exists
if [ ! -f "docker-compose.yml" ]; then
    cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: [PROJECT_NAME]_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: [PROJECT_NAME]_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF
fi

# Start database
docker-compose up -d postgres

# Wait for database to be ready
echo "Waiting for PostgreSQL to start..."
sleep 5

# Test connection
docker exec [PROJECT_NAME]_db pg_isready -U postgres

CONNECTION_STRING="postgresql://postgres:postgres@localhost:5432/[PROJECT_NAME]_dev"
echo "Database running: $CONNECTION_STRING"
```

### Option 4: Local PostgreSQL (Automatic)
```bash
# Check PostgreSQL running
if ! pg_isready &> /dev/null; then
    echo "ERROR: PostgreSQL not running. Please start PostgreSQL service."
    exit 1
fi

# Create database
DB_NAME="[PROJECT_NAME]_dev"
createdb "$DB_NAME" 2>/dev/null || echo "Database may already exist"

# Test connection
psql -d "$DB_NAME" -c "SELECT 1" &> /dev/null

CONNECTION_STRING="postgresql://localhost:5432/$DB_NAME"
echo "Database ready: $CONNECTION_STRING"
```

### Option 5: SQLite (Automatic)
```bash
# No setup needed - Prisma will create the file
CONNECTION_STRING="file:./dev.db"
echo "SQLite configured: $CONNECTION_STRING"

# Update Prisma schema if needed
if [ -f "prisma/schema.prisma" ]; then
    sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
fi
```

---

## STEP 4: Generate Secrets
**Executor**: [Flow], [Sentinal]

### Auto-Generate All Secrets:
```bash
# JWT Secret (64 characters)
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')

# Session Secret (32 characters)
SESSION_SECRET=$(openssl rand -base64 24 | tr -d '\n')

# Encryption Key (32 bytes for AES-256)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# NextAuth Secret (if Next.js)
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')

# CSRF Token Salt
CSRF_SECRET=$(openssl rand -base64 16 | tr -d '\n')

echo "All secrets generated securely"
```

### Secrets Report:
```
SECRETS GENERATED:
==================
✓ JWT_SECRET (64 chars)
✓ SESSION_SECRET (32 chars)
✓ ENCRYPTION_KEY (64 hex chars)
✓ NEXTAUTH_SECRET (44 chars)

These are cryptographically secure random values.
They have been added to your .env file.
DO NOT commit .env to git.
```

---

## STEP 5: Populate .env File
**Executor**: [Codey]

### Create/Update .env:
```bash
ENV_FILE=".env"

# Backup existing .env if present
[ -f "$ENV_FILE" ] && cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d%H%M%S)"

# Start with .env.example as base
[ -f ".env.example" ] && cp ".env.example" "$ENV_FILE"

# Function to set env var
set_env() {
    KEY=$1
    VALUE=$2
    if grep -q "^$KEY=" "$ENV_FILE" 2>/dev/null; then
        # Update existing
        sed -i "s|^$KEY=.*|$KEY=$VALUE|" "$ENV_FILE"
    else
        # Add new
        echo "$KEY=$VALUE" >> "$ENV_FILE"
    fi
}

# Set all values
set_env "DATABASE_URL" "$CONNECTION_STRING"
set_env "JWT_SECRET" "$JWT_SECRET"
set_env "SESSION_SECRET" "$SESSION_SECRET"
set_env "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
set_env "NODE_ENV" "development"
set_env "APP_URL" "http://localhost:3000"

# Set placeholder reminders for external services
set_env "RESEND_API_KEY" "# Get from https://resend.com/api-keys"
set_env "CLOUDINARY_CLOUD_NAME" "# Get from https://cloudinary.com/console"
set_env "CLOUDINARY_API_KEY" "# Get from https://cloudinary.com/console"
set_env "CLOUDINARY_API_SECRET" "# Get from https://cloudinary.com/console"

echo ".env file populated"
```

### .env Status Report:
```
.ENV FILE STATUS:
=================
✓ DATABASE_URL - Set (Supabase)
✓ JWT_SECRET - Generated
✓ SESSION_SECRET - Generated
✓ ENCRYPTION_KEY - Generated
✓ NODE_ENV - Set to "development"
✓ APP_URL - Set to "http://localhost:3000"

⚠ EXTERNAL SERVICES (Optional):
  RESEND_API_KEY - Need API key from resend.com
  CLOUDINARY_* - Need credentials from cloudinary.com

These external services are optional for local development.
Features requiring them will be disabled until configured.
```

---

## STEP 6: Run Setup Commands
**Executor**: [Flow]

### Execute in Order:
```bash
echo "Running setup commands..."

# 1. Install dependencies
echo "Installing dependencies..."
npm install
# or: npm run install:all (if monorepo)

# 2. Generate Prisma client (if Prisma)
if [ -f "prisma/schema.prisma" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# 3. Run database migrations
echo "Running database migrations..."
npx prisma migrate dev --name init
# or: npm run db:migrate

# 4. Seed database (if seed script exists)
if grep -q '"seed"' package.json; then
    echo "Seeding database..."
    npm run seed
    # or: npx prisma db seed
fi

# 5. Build check
echo "Verifying build..."
npm run build --if-present

echo "Setup complete!"
```

---

## STEP 7: Verification
**Executor**: [Verity]

### Run Health Checks:
```bash
echo "Verifying setup..."

# 1. Database connection
echo "Testing database connection..."
npx prisma db pull --force 2>/dev/null && echo "✓ Database connected" || echo "✗ Database connection failed"

# 2. Dependencies installed
echo "Checking dependencies..."
[ -d "node_modules" ] && echo "✓ Dependencies installed" || echo "✗ Dependencies missing"

# 3. Environment variables
echo "Checking environment..."
[ -f ".env" ] && echo "✓ .env file exists" || echo "✗ .env file missing"

# 4. Try starting dev server briefly
echo "Testing dev server..."
timeout 10 npm run dev &> /dev/null &
DEV_PID=$!
sleep 5
if kill -0 $DEV_PID 2>/dev/null; then
    echo "✓ Dev server starts successfully"
    kill $DEV_PID 2>/dev/null
else
    echo "⚠ Dev server may have issues"
fi
```

---

## STEP 8: Final Report
**Executor**: [Codey]

### Success Report:
```
================================================================
ENVIRONMENT SETUP COMPLETE
================================================================

DATABASE:
  Provider: Supabase (PostgreSQL)
  Connection: postgresql://[user]:[pass]@[host]:5432/[db]
  Status: ✓ Connected and migrated

SECRETS:
  ✓ JWT_SECRET - Generated (64 chars)
  ✓ SESSION_SECRET - Generated (32 chars)
  ✓ ENCRYPTION_KEY - Generated (64 hex)

DEPENDENCIES:
  ✓ npm packages installed
  ✓ Prisma client generated

DATABASE:
  ✓ Migrations applied
  ✓ Database seeded (if applicable)

.ENV FILE:
  ✓ All required variables set
  ⚠ External services need manual API keys:
    - RESEND_API_KEY (for email)
    - CLOUDINARY_* (for images)

================================================================
READY TO DEVELOP!
================================================================

Start development server:
  npm run dev

Your app will be available at:
  http://localhost:3000

External services (email, images) will work once you add API keys.
For now, those features are disabled but won't break the app.

================================================================
```

---

## EXTERNAL SERVICE SETUP (Optional)

### When User Wants to Set Up External Services:

```
[SetupEnvironment] --service=resend

Opening Resend dashboard...
1. Sign up at https://resend.com
2. Go to API Keys
3. Create new API key
4. Paste here: [user pastes key]

✓ RESEND_API_KEY added to .env
✓ Email features now enabled
```

```
[SetupEnvironment] --service=cloudinary

Opening Cloudinary dashboard...
1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy Cloud Name, API Key, API Secret
4. Paste each value when prompted...

✓ CLOUDINARY_CLOUD_NAME added to .env
✓ CLOUDINARY_API_KEY added to .env
✓ CLOUDINARY_API_SECRET added to .env
✓ Image upload features now enabled
```

---

## ERROR HANDLING

### If Database Provision Fails:
```
DATABASE SETUP FAILED
=====================
Error: Could not connect to Supabase

Possible causes:
1. Not logged in to Supabase CLI
2. Network connection issue
3. Supabase service outage

Options:
1. Retry with Supabase
2. Try different provider (Neon, Docker, Local)
3. Set DATABASE_URL manually

Enter choice:
```

### If Migrations Fail:
```
MIGRATION FAILED
================
Error: [migration error details]

This usually means:
1. Database schema conflict
2. Missing required field
3. Connection issue

Actions:
1. Reviewing migration files...
2. Checking database state...
3. [Suggested fix based on error]

Retry migration? (yes/no)
```

---

## CONFIGURATION

### In placeholders.json:
```json
{
  "environment_setup": {
    "preferred_database": "supabase",
    "auto_generate_secrets": true,
    "auto_run_migrations": true,
    "external_services": {
      "email": "resend",
      "storage": "cloudinary",
      "analytics": "none"
    }
  }
}
```

---

## QUICK COMMANDS

```bash
# Full automatic setup (uses defaults)
[SetupEnvironment] --auto

# Setup with specific database
[SetupEnvironment] --database=docker

# Just generate secrets
[SetupEnvironment] --secrets-only

# Just populate .env
[SetupEnvironment] --env-only

# Add external service
[SetupEnvironment] --service=resend
```

---

## VERSION HISTORY

- v1.0.0 (2025-12-23): Initial release

---

**Command Status**: PRODUCTION READY
**Last Updated**: 2025-12-23
**Maintainer**: [Flow] (DevOps)

---

*This command eliminates the "remaining manual steps" problem. AI provisions everything, you just approve.*
