# Setup AI-DOCS Framework in New Project

**Version**: 2.0.0
**Setup Time**: 30 minutes
**Skill Level**: Basic command line + text editor

---

## 🎯 What You'll Accomplish

By the end of this guide, your project will have:
- Automated morning standup via `[StartDay]` command
- Automated task workflow via `[TaskStart]`, `[TaskReview]`, `[TaskQA]`, `[TaskStage]`, `[TaskComplete]` commands
- 7-column kanban workflow: Backlog → Ready → In Progress → Review → QA → Staging → Done
- Self-updating kanban board
- Zero manual tracking required

---

## 📋 Prerequisites

**Required:**
- Git repository initialized
- Node.js installed (for kanban-updater.js)
- Claude Code installed and configured
- Text editor (VS Code, Sublime, etc.)

**Optional:**
- Existing kanban board HTML file (or use template)
- Team roles defined
- Workflow states defined

---

## 🚀 Step 1: Copy Framework (5 minutes)

### Option A: From Existing Project
```bash
# If you have travissutphin.com or another project with framework
cp -r /path/to/existing-project/docs-framework ./docs-framework
```

### Option B: Clone Framework Repository
```bash
# Clone framework into your project
git clone [framework-repo-url] ./docs-framework
```

### Option C: Manual Copy
1. Create `docs-framework/` directory in your project root
2. Copy all framework files from reference project
3. Verify structure:
```
/docs-framework/
├── README.md
├── VERSION.md
├── /automation/
├── /slash-commands/
├── /templates/
├── /config/
└── /docs/
```

---

## ⚙️ Step 2: Configure Placeholders (10 minutes)

### Edit Configuration File
Open: `/docs-framework/config/placeholders.json`

### Replace [PLACEHOLDERS] with Your Project Values

**Project Info:**
```json
{
  "project": {
    "name": "My Awesome Project",
    "description": "Brief project description",
    "repository": "https://github.com/username/project",
    "production_url": "https://myproject.com",
    "local_url": "http://localhost:3000"
  }
}
```

**Tech Stack:**
```json
{
  "tech_stack": {
    "primary_language": "JavaScript",
    "css_framework": "Tailwind CSS",
    "server_type": "Node.js",
    "deployment_platform": "Vercel",
    "port": "3000"
  }
}
```

**Team Members:**
```json
{
  "team": {
    "product_owner": "Your Name",
    "tpm": "Codey",
    "principal_engineer": "Syntax",
    "designer": "Aesthetica",
    "devops": "Flow",
    "qa": "Verity",
    "security": "Sentinal",
    "marketing_seo": "Bran",
    "content_strategist": "Echo",
    "storybrand_expert": "Cipher"
  }
}
```

**File Paths:**
```json
{
  "paths": {
    "docs_root": "/docs",
    "kanban_dev": "/docs/kanban/kanban_dev.html",
    "content_blog": "/content/blog",
    "public_root": "/public",
    "automation": "/automation"
  }
}
```

### Save File

---

## 📋 Step 3: Set Up Kanban Board (5 minutes)

### Option A: Use Existing Kanban Board
**If you already have a kanban HTML file:**

1. Verify your kanban has HTML comment markers:
```html
<!-- KANBAN_IN_PROGRESS_START -->
  <!-- Your cards go here -->
<!-- KANBAN_IN_PROGRESS_END -->
```

2. If markers don't exist, add them to each column (7-column workflow):
```html
<!-- KANBAN_BACKLOG_START -->
<!-- KANBAN_BACKLOG_END -->

<!-- KANBAN_READY_START -->
<!-- KANBAN_READY_END -->

<!-- KANBAN_IN_PROGRESS_START -->
<!-- KANBAN_IN_PROGRESS_END -->

<!-- KANBAN_REVIEW_START -->
<!-- KANBAN_REVIEW_END -->

<!-- KANBAN_QA_START -->
<!-- KANBAN_QA_END -->

<!-- KANBAN_STAGING_START -->
<!-- KANBAN_STAGING_END -->

<!-- KANBAN_DONE_START -->
<!-- KANBAN_DONE_END -->
```

3. Update path in `placeholders.json`

### Option B: Use Framework Template
```bash
# Copy kanban template to your project
cp docs-framework/templates/kanban_dev.html.template ./docs/kanban/kanban_dev.html

# Edit the template and replace [PLACEHOLDERS]
```

### Verify Kanban Structure
Your kanban must have:
- `data-id="XXX"` attribute on each card
- HTML comment markers for each column
- Consistent HTML structure for cards

---

## ⚡ Step 4: Install Slash Commands (5 minutes)

### Create Claude Code Commands Directory
```bash
# Create .claude directory if it doesn't exist
mkdir -p .claude/commands
```

### Copy Slash Commands
```bash
# Copy all slash command files
cp docs-framework/slash-commands/*.md .claude/commands/
```

### Verify Installation
Check that these files exist:
```
.claude/
└── commands/
    ├── startday.md
    ├── taskstart.md
    ├── taskreview.md
    ├── taskqa.md
    ├── taskstage.md
    ├── taskcomplete.md
    ├── endday.md
    └── outlineblog.md  # If using blog features
```

### Test Commands
Open Claude Code in your project:
```
[StartDay]
```

You should see the automated standup report.

---

## 🔧 Step 5: Update CLAUDE.md (5 minutes)

### If You Have Existing CLAUDE.md
Add process workflows section:

```markdown
## Process Workflows (AI-Executable)

### [ProcessStartDay]
**Trigger**: [StartDay] command
**Actions**: Git status, kanban review, task recommendations
**Executor**: [Codey]

### [ProcessTaskComplete]
**Trigger**: [TaskComplete] command
**Actions**: Kanban update, documentation sync, git commit
**Executor**: [Codey] via automation

(See /docs-framework/slash-commands/ for full workflow definitions)
```

### If No CLAUDE.md Exists
```bash
# Copy template
cp docs-framework/templates/CLAUDE.md.template ./CLAUDE.md

# Edit and replace all [PLACEHOLDERS]
```

---

## ✅ Step 6: Test Automation (5 minutes)

### Test 1: Start Day Command
```
[StartDay]
```

**Expected Output:**
- Git status report
- Local server status
- Kanban board analysis
- Recommended next action

### Test 2: Kanban Updater Script
```bash
# Test moving a task (dry run)
node docs-framework/automation/kanban-updater.js \
  --task-id="001" \
  --from-column="in_progress" \
  --to-column="review" \
  --dry-run
```

**Expected Output:**
```
Found card #001
Removed card from "in_progress" column
Added card to "review" column
DRY RUN: Changes would be applied (file not modified)
```

### Test 3: Task Complete Command
1. Complete a small task in your project
2. Commit your changes
3. Type: `[TaskComplete]`
4. Verify kanban was updated

---

## 🎯 Optional Enhancements

### Enable Git Hooks (Advanced)
```bash
# Create post-commit hook
cp docs-framework/templates/post-commit .git/hooks/
chmod +x .git/hooks/post-commit
```

### Customize Workflow States
Edit: `/docs-framework/config/workflow-states.json`

Change column names, icons, and automation triggers.

### Add More Slash Commands
Create new files in `.claude/commands/`:
```markdown
# .claude/commands/mycommand.md
You are executing [MyCommand] workflow.

## Actions:
1. Step one
2. Step two
```

---

## 🐛 Troubleshooting

### "Kanban file not found"
**Solution**: Verify path in `placeholders.json` matches actual file location

### "Task ID not found"
**Solution**: Check that your kanban cards have `data-id="XXX"` attributes

### "Command not recognized"
**Solution**: Verify slash command files are in `.claude/commands/` directory

### "Node.js not found"
**Solution**: Install Node.js from nodejs.org

### "Git commands fail"
**Solution**: Ensure you're in a git repository (`git status` works)

---

## 📊 Verify Setup Complete

**Checklist:**
- [ ] Framework copied to `/docs-framework/`
- [ ] `placeholders.json` configured with your project values
- [ ] Kanban board has HTML comment markers
- [ ] Slash commands installed in `.claude/commands/`
- [ ] `[StartDay]` command works
- [ ] `kanban-updater.js` script works (tested with --dry-run)
- [ ] CLAUDE.md references framework workflows

**If all checked → ✅ Setup Complete!**

---

## 🎓 Next Steps

### Learn the Workflows
- Read: `/docs-framework/slash-commands/startday.md`
- Read: `/docs-framework/slash-commands/taskcomplete.md`

### Customize for Your Team
- Edit workflow states in `config/workflow-states.json`
- Adjust approval levels in `config/approval-levels.json`
- Add custom slash commands as needed

### Train Your Team
Share this guide with team members so they can:
1. Type `[StartDay]` each morning
2. Type `[TaskComplete]` when finishing tasks
3. Trust the automation

---

## 📞 Support

**Issues?**
- Check troubleshooting section above
- Review `/docs-framework/docs/AUTOMATION-GUIDE.md`
- Open issue in framework repository

**Questions?**
- Framework maintainer: [Codey]
- Reference implementation: travissutphin.com

---

## 📄 Framework Version

**Installed Version**: Check `/docs-framework/VERSION.md`
**Latest Version**: [Link to framework repo]
**Upgrade Guide**: [Coming in future version]

---

**Setup Complete! 🎉**

You now have an AI-powered documentation system that executes workflows automatically. No more manual kanban updates, no more forgotten processes.

**Start using it:** Type `[StartDay]` right now!
