# SetupProject v3.1 Integration Plan

**Version**: 3.1.0 Planning Document
**Date**: 2026-01-15
**Status**: Draft - Pending Approval

---

## Executive Summary

Three major improvements to SetupProject to reduce setup friction, catch PRD issues early, and make file generation safe for re-runs.

| Integration | Impact | Files Modified | Effort |
|-------------|--------|----------------|--------|
| 1. Consolidated Question Flow | 4+ rounds → 1 round | `setupproject.md` | Medium |
| 2. PRD Validation & Feedback | Catch issues early, improve task quality | `setupproject.md`, new `prd-validator.js` | Medium |
| 3. Idempotent File Generation | Safe re-runs, preserve customizations | `setupproject.md`, new `file-generator.js` | High |

---

## Integration 1: Consolidated Question Flow

### Current State (Steps 1B-4)

**File**: `.claude/commands/setupproject.md` (lines 147-242)

Current flow requires 4 separate interaction rounds:
- **Step 1B** (lines 150-171): Owner name, local URL, production URL, GitHub repo
- **Step 2** (lines 179-196): Framework, CSS, database, port
- **Step 3** (lines 208-217): URLs & repository (duplicated from 1B!)
- **Step 4** (lines 232-240): 6 yes/no questions about env vars (DB, auth, email, storage, payments, other)

**Problems Identified**:
1. Steps 1B and 3 have duplicate URL questions
2. Each step waits for user response before proceeding
3. PRD-extracted values not shown as pre-filled defaults
4. User can't see full scope before answering

### Proposed Solution

Replace Steps 1B through 4 with a single **Smart Setup Form** that:
- Pre-fills all PRD-extractable values with checkmarks
- Shows all questions at once with sensible defaults
- Uses visual markers (✓ for extracted, ○ for needed)
- Groups logically: Project → Tech → URLs → Services

### Implementation Details

#### A. New Step Structure

Replace lines 147-242 with consolidated **STEP 1B: UNIFIED SETUP CONFIRMATION**

```markdown
## STEP 1B: UNIFIED SETUP CONFIRMATION [Codey]

**Purpose**: Collect all setup information in ONE interaction

### 1B.1 Build the Smart Form

Using PRD data from Step 0, construct this form:

```
╔══════════════════════════════════════════════════════════════════╗
║                    SETUP CONFIRMATION                             ║
║         ✓ = Extracted from PRD  |  ○ = Needs your input          ║
╠══════════════════════════════════════════════════════════════════╣
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
║ [ ] Authentication (NextAuth/Auth.js)                            ║
║ [ ] Stripe payments                                              ║
║ [ ] Email service (Resend/SendGrid/Postmark)                     ║
║ [ ] File storage (S3/Cloudinary/Uploadthing)                     ║
║ [ ] Other API keys: _______________                              ║
╚══════════════════════════════════════════════════════════════════╝

Ready? (yes / adjust [field] / help)
```

### 1B.2 PRD Field Extraction Mapping

| Form Field | PRD Location to Check |
|------------|----------------------|
| Name | `# Title`, `## Project Name`, first H1 |
| Description | First paragraph after title, `## Overview` |
| Framework | `## Technical`, `## Tech Stack`, keywords (Next.js, React, etc.) |
| CSS | Keywords: Tailwind, Bootstrap, styled-components |
| Database | Keywords: PostgreSQL, MySQL, MongoDB, SQLite |

### 1B.3 Response Handling

**If user says "yes"**: Proceed to Step 5 (PRD parsing)

**If user says "adjust [field]"**:
- Re-display form with that field highlighted
- Accept new value
- Re-display updated form

**If user provides all values at once**:
- Parse freeform response
- Match to form fields
- Confirm extraction
```

#### B. Remove Redundant Steps

- **Delete Step 2** (lines 175-196) - merged into 1B
- **Delete Step 3** (lines 200-220) - merged into 1B
- **Delete Step 4** (lines 224-242) - merged into 1B
- **Renumber Steps 5-9** to Steps 2-6

#### C. Data Structure for Parsed Form

Store collected data in a structured format for Step 6:

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

## Integration 2: PRD Validation with Actionable Feedback

### Current State (Step 5)

**File**: `.claude/commands/setupproject.md` (lines 246-362)

Current approach:
- Pattern-based search for `## Sprint X`, `## Milestone X`, `## Phase X`
- If not found, asks user how to organize
- No validation of PRD quality or completeness
- Issues discovered only after kanban is generated

**Problems Identified**:
1. Silent failures when PRD structure is poor
2. No feedback on what was/wasn't extractable
3. No suggestions for improving PRD
4. User discovers problems too late

### Proposed Solution

Add **STEP 2: PRD HEALTH CHECK** before task extraction that:
- Scans PRD structure and completeness
- Reports what was found vs. what's missing
- Provides actionable suggestions
- Offers to enhance PRD automatically

### Implementation Details

#### A. New Step: PRD Health Check

Insert after consolidated setup (new Step 2):

```markdown
## STEP 2: PRD HEALTH CHECK [Codey]

**Purpose**: Validate PRD quality before task extraction

### 2.1 Structure Analysis

Scan PRD for these elements:

| Element | Pattern | Status |
|---------|---------|--------|
| Project Overview | `# Title`, `## Overview`, `## Introduction` | ✓/✗ |
| Goals/Objectives | `## Goals`, `## Objectives`, bullet list after overview | ✓/✗ |
| User Stories | `As a [role]`, `## User Stories` | ✓/✗ |
| Features | `## Features`, `### Feature:` | ✓/✗ |
| Technical Requirements | `## Technical`, `## Tech Stack`, `## Architecture` | ✓/✗ |
| Acceptance Criteria | `- [ ]` checkboxes, `### Acceptance`, `Criteria:` | ✓/⚠/✗ |
| Sprint/Milestone Organization | `## Sprint`, `## Milestone`, `## Phase`, `## MVP` | ✓/⚠/✗ |
| Timeline | `## Timeline`, `## Schedule`, dates | ✓/✗ |

### 2.2 Task Extraction Preview

Report what can be extracted:

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

### 2.3 Suggestions (if issues found)

```
SUGGESTIONS FOR BETTER TASK EXTRACTION:

1. ADD ACCEPTANCE CRITERIA (3 features missing)
   Features without criteria: User Profile, Settings, Notifications

   Example format:
   ### User Profile
   **Acceptance Criteria:**
   - [ ] User can view their profile
   - [ ] User can edit display name
   - [ ] User can upload avatar

2. ORGANIZE INTO MILESTONES
   Your PRD has no sprint organization. Recommend adding:

   ## Milestone 1: MVP (Core Features)
   - User Authentication
   - Dashboard
   - Basic CRUD

   ## Milestone 2: Growth Features
   - Team Management
   - Integrations
   - Analytics

3. CLARIFY DEPENDENCIES
   Some features may depend on others. Consider noting:
   "Depends on: User Authentication"
```

### 2.4 User Options

```
OPTIONS:
─────────────────────────────────────────────────────────────
[proceed]  Continue with current PRD (23 tasks, auto-organized)
[enhance]  I'll add structure to your PRD (recommended)
[manual]   Update PRD manually, then re-run /setupproject
[details]  Show me exactly what will be extracted
─────────────────────────────────────────────────────────────
Choose:
```

### 2.5 Enhancement Mode (if selected)

If user selects "enhance":

1. Add missing acceptance criteria placeholders
2. Organize features into logical milestones
3. Add dependency notes where obvious
4. Show diff of changes
5. Offer to save enhanced PRD

```
ENHANCED PRD PREVIEW:
─────────────────────────────────────────────────────────────
+ ## Milestone 1: Foundation (Sprint 1-2)
+ ### User Authentication ✓ (existing)
+ ### User Profile
+ **Acceptance Criteria:**
+ - [ ] User can view their profile
+ - [ ] User can edit display name
+ - [ ] User can upload avatar (max 5MB)
+
+ ## Milestone 2: Core Features (Sprint 3-4)
...

Save enhanced PRD? (yes / show full / cancel)
```
```

#### B. New Automation Script: prd-validator.js

Create `.autopilot/automation/prd-validator.js`:

```javascript
#!/usr/bin/env node
/**
 * PRD Validator and Enhancement Tool
 * Analyzes PRD structure and suggests improvements
 */

const STRUCTURE_PATTERNS = {
  overview: /^#\s+.+|^##\s+(Overview|Introduction|About)/im,
  goals: /^##\s+(Goals?|Objectives?)/im,
  userStories: /As a\s+\[?\w+\]?,?\s+I\s+(want|need|can)/gi,
  features: /^##\s+Features?|^###\s+Feature:?\s+/im,
  technical: /^##\s+(Technical|Tech\s*Stack|Architecture|Requirements)/im,
  acceptance: /^[-*]\s+\[\s*[x ]?\s*\]/gim,
  sprints: /^##\s+(Sprint|Milestone|Phase|MVP|v\d)/im,
  timeline: /^##\s+(Timeline|Schedule|Roadmap)/im
};

const QUALITY_WEIGHTS = {
  structure: 25,
  completeness: 25,
  clarity: 25,
  actionability: 25
};

// ... implementation details
```

---

## Integration 3: Idempotent File Generation with Preview/Backup

### Current State (Step 6)

**File**: `.claude/commands/setupproject.md` (lines 366-560)

Current behavior:
- Overwrites files without warning
- No change detection
- No backup mechanism for placeholders.json, CLAUDE.md, kanban
- Only check is if project name equals placeholder (line 117-126)
- populate-env.js has backup but other files don't

**Problems Identified**:
1. Re-running SetupProject destroys customizations
2. No way to preview what will change
3. No recovery if something goes wrong
4. Can't do incremental setup updates

### Proposed Solution

Add **STEP 5: FILE GENERATION PREVIEW** with:
- Hash-based change detection
- Diff preview before writing
- Automatic timestamped backups
- Merge logic for config files
- Skip files with custom markers

### Implementation Details

#### A. New Step: File Generation Preview

Replace current Step 6 with preview-first approach:

```markdown
## STEP 5: FILE GENERATION PREVIEW [Codey]

**Purpose**: Show what will change before modifying files

### 5.1 Scan Existing Files

Check each target file's current state:

| File | Check |
|------|-------|
| `.autopilot/config/placeholders.json` | Exists? Modified from template? |
| `.env.example` | Exists? Has custom variables? |
| `CLAUDE.md` | Exists? Has `# CUSTOM` marker? |
| `docs/kanban/kanban_dev.html` | Exists? Has tasks? |

### 5.2 Calculate Changes

For each file, determine:
- **CREATE**: File doesn't exist
- **UPDATE**: File exists, will be modified
- **SKIP**: File has `# CUSTOM` header or no changes needed
- **MERGE**: Config file with preservable custom fields

### 5.3 Display Preview

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
║ .autopilot/backups/2026-01-15_143022/                            ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝

OPTIONS:
─────────────────────────────────────────────────────────────
[yes]           Proceed with all changes (backup created)
[preview FILE]  Show full diff for a specific file
[skip FILE]     Don't modify that file
[force FILE]    Overwrite even if custom marker present
[cancel]        Abort file generation
─────────────────────────────────────────────────────────────
Choose:
```

### 5.4 Backup Before Write

Before any file modification:

1. Create timestamped backup directory:
   `.autopilot/backups/YYYY-MM-DD_HHMMSS/`

2. Copy all files that will be modified:
   ```
   .autopilot/backups/2026-01-15_143022/
   ├── placeholders.json
   ├── CLAUDE.md
   └── kanban_dev.html
   ```

3. Create manifest file:
   ```json
   {
     "created": "2026-01-15T14:30:22Z",
     "reason": "SetupProject v3.1 run",
     "files": [
       {"path": "placeholders.json", "hash": "abc123"},
       {"path": "CLAUDE.md", "hash": "def456"}
     ]
   }
   ```

### 5.5 Merge Logic for placeholders.json

Instead of full overwrite, merge intelligently:

**Always Update** (from setup form):
- `project.name`, `project.description`, `project.repository`
- `tech_stack.*`
- `team.product_owner`
- `urls.*`

**Preserve If Customized**:
- `team.*` (except product_owner)
- `autonomous_operations.*`
- `quality_thresholds.*`
- Any field not in default template

**Merge Arrays**:
- `setup_tasks` - mark completed, add new

### 5.6 Custom File Markers

Files with these markers at line 1 are skipped:

```markdown
# CUSTOM - Do not overwrite
```

```html
<!-- CUSTOM - Do not overwrite -->
```

```json
{ "_custom": true, ...}
```

User can force overwrite with `[force FILE]` option.
```

#### B. New Automation Script: file-generator.js

Create `.autopilot/automation/file-generator.js`:

```javascript
#!/usr/bin/env node
/**
 * Safe File Generator with Preview and Backup
 * Handles idempotent file generation for SetupProject
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CUSTOM_MARKERS = [
  '# CUSTOM',
  '<!-- CUSTOM',
  '"_custom": true'
];

class FileGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.backupDir = null;
    this.changes = [];
  }

  /**
   * Calculate file hash for change detection
   */
  hashFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Check if file has custom marker
   */
  hasCustomMarker(filePath) {
    if (!fs.existsSync(filePath)) return false;
    const firstLine = fs.readFileSync(filePath, 'utf8').split('\n')[0];
    return CUSTOM_MARKERS.some(marker => firstLine.includes(marker));
  }

  /**
   * Create timestamped backup directory
   */
  createBackupDir() {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '')
      .replace('T', '_')
      .slice(0, 15);
    this.backupDir = path.join(
      this.projectRoot,
      '.autopilot/backups',
      timestamp
    );
    fs.mkdirSync(this.backupDir, { recursive: true });
    return this.backupDir;
  }

  /**
   * Backup a file before modification
   */
  backupFile(filePath) {
    if (!this.backupDir) this.createBackupDir();
    if (!fs.existsSync(filePath)) return;

    const relativePath = path.relative(this.projectRoot, filePath);
    const backupPath = path.join(this.backupDir, relativePath);

    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(filePath, backupPath);

    return backupPath;
  }

  /**
   * Generate diff preview between old and new content
   */
  generateDiff(oldContent, newContent, maxLines = 10) {
    // Simple line-by-line diff
    const oldLines = (oldContent || '').split('\n');
    const newLines = newContent.split('\n');
    const diff = [];

    // ... diff implementation

    return diff;
  }

  /**
   * Merge placeholders.json preserving custom fields
   */
  mergePlaceholders(existingPath, newData) {
    const PRESERVE_KEYS = [
      'team', 'autonomous_operations', 'quality_thresholds'
    ];
    const UPDATE_KEYS = [
      'project', 'tech_stack', 'urls', 'paths', 'git'
    ];

    let existing = {};
    if (fs.existsSync(existingPath)) {
      existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    }

    const merged = { ...existing };

    // Update specified keys
    for (const key of UPDATE_KEYS) {
      if (newData[key]) {
        merged[key] = { ...existing[key], ...newData[key] };
      }
    }

    // Preserve custom keys
    for (const key of PRESERVE_KEYS) {
      if (existing[key] && !isPlaceholder(existing[key])) {
        merged[key] = existing[key];
      }
    }

    return merged;
  }

  /**
   * Plan all file operations
   */
  planOperations(files) {
    const plan = {
      create: [],
      update: [],
      skip: [],
      backup: []
    };

    for (const file of files) {
      if (!fs.existsSync(file.path)) {
        plan.create.push(file);
      } else if (this.hasCustomMarker(file.path)) {
        plan.skip.push({ ...file, reason: 'custom marker' });
      } else {
        const oldHash = this.hashFile(file.path);
        const newHash = crypto.createHash('md5')
          .update(file.content)
          .digest('hex');

        if (oldHash !== newHash) {
          plan.update.push(file);
          plan.backup.push(file.path);
        } else {
          plan.skip.push({ ...file, reason: 'no changes' });
        }
      }
    }

    return plan;
  }

  /**
   * Execute planned operations with backup
   */
  execute(plan, options = {}) {
    // Create backups first
    if (plan.backup.length > 0) {
      this.createBackupDir();
      for (const filePath of plan.backup) {
        this.backupFile(filePath);
      }
      this.writeManifest(plan);
    }

    // Create new files
    for (const file of plan.create) {
      fs.mkdirSync(path.dirname(file.path), { recursive: true });
      fs.writeFileSync(file.path, file.content, 'utf8');
    }

    // Update existing files
    for (const file of plan.update) {
      if (options.skip?.includes(file.path)) continue;
      fs.writeFileSync(file.path, file.content, 'utf8');
    }

    return {
      created: plan.create.length,
      updated: plan.update.length,
      skipped: plan.skip.length,
      backupDir: this.backupDir
    };
  }

  /**
   * Write backup manifest
   */
  writeManifest(plan) {
    const manifest = {
      created: new Date().toISOString(),
      reason: 'SetupProject file generation',
      files: plan.backup.map(filePath => ({
        path: path.relative(this.projectRoot, filePath),
        hash: this.hashFile(filePath)
      }))
    };

    fs.writeFileSync(
      path.join(this.backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }
}

module.exports = { FileGenerator };
```

---

## Implementation Sequence

### Phase 1: Foundation (Do First)
1. Create `file-generator.js` with backup logic
2. Create `prd-validator.js` with structure analysis
3. Add backup directory structure

### Phase 2: Integration 3 (Safest First)
1. Add file preview to Step 6
2. Implement backup before write
3. Add merge logic for placeholders.json
4. Add custom marker detection

### Phase 3: Integration 2 (PRD Validation)
1. Add PRD health check step
2. Implement quality scoring
3. Add enhancement suggestions
4. Add enhancement mode

### Phase 4: Integration 1 (Question Consolidation)
1. Design smart form format
2. Implement PRD field extraction
3. Consolidate Steps 1B-4
4. Update response handling
5. Renumber remaining steps

### Phase 5: Testing & Polish
1. Test with sample PRDs
2. Test re-run scenarios
3. Test backup/restore
4. Update documentation

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `.autopilot/automation/prd-validator.js` | PRD structure analysis and enhancement |
| `.autopilot/automation/file-generator.js` | Safe file generation with backup |

### Modified Files
| File | Changes |
|------|---------|
| `.claude/commands/setupproject.md` | Major restructure: consolidate steps, add preview |
| `.autopilot/config/workflow-states.json` | Add backup markers |

### New Directories
| Directory | Purpose |
|-----------|---------|
| `.autopilot/backups/` | Timestamped backup storage |

---

## Rollback Plan

If issues arise:
1. Backups in `.autopilot/backups/[timestamp]/` contain original files
2. Git history preserves original setupproject.md
3. Each automation script is standalone and can be disabled

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Setup interaction rounds | 4-5 | 1-2 |
| PRD issues caught before kanban | 0% | 80%+ |
| Safe re-runs possible | No | Yes |
| Time to complete setup | ~10 min | ~3 min |

---

## Next Steps

1. **Review this plan** - Get approval before implementation
2. **Create branch** - `feature/setupproject-v3.1`
3. **Implement Phase 1** - Foundation scripts
4. **Iterate** - Each phase with testing

---

*Document generated: 2026-01-15*
*Awaiting approval to proceed with implementation*
