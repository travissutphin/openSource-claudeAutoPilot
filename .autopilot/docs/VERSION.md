# Claude AutoPilot

**Version**: 3.1.0
**Release Date**: 2026-01-15
**Framework Name**: Claude AutoPilot (Autonomous AI Development Framework)
**Repository**: https://github.com/travissutphin/openSource-claudeAutoPilot
**Author**: Travis Sutphin

---

## Version History

### v3.1.0 (2026-01-15) - SetupProject UX Overhaul

**Major Changes:**
- **Single Smart Form**: Consolidated 4 question rounds into 1 unified form
- **PRD Health Check**: Quality scoring, structure analysis, improvement suggestions
- **Safe File Generation**: Preview changes before writing, automatic backups, merge logic
- **Custom Markers**: Files with `# CUSTOM` markers preserved on re-runs

**New Automation Scripts:**
- `prd-validator.js` - PRD structure analysis, quality scoring, data extraction
- `file-generator.js` - Safe file generation with backup, preview, restore

**SetupProject Changes:**
- Step 1B now shows all questions in single form with PRD pre-fill
- Step 2 adds PRD Health Check before task extraction
- Step 4 adds File Generation Preview before writing
- Removed duplicate URL questions (was asked in both Step 1B and Step 3)
- Automatic timestamped backups in `.autopilot/backups/`

**Impact:**
- Setup time reduced from ~10 minutes to ~3 minutes
- PRD issues caught early (before kanban generation)
- Safe to re-run SetupProject without losing customizations

---

### v3.0.0 (2026-01-03) - Sprint Extraction from PRD

**Major Changes:**
- PRD-driven sprint/milestone extraction
- Generates kanban with sprint tabs and task cards
- Task numbering across sprints (001, 002, etc.)

---

### v2.0.0 (2025-12-25) - Open Source Release

**Major Changes:**
- Renamed to Claude AutoPilot for open source release
- Full autonomous DevOps workflow with 5 kanban stages
- Decision-only notification system (AI handles 90% automatically)
- Quality gates for automated stage transitions
- Environment management (Local/Staging/Production)
- Automated database provisioning and secrets generation
- PRD-driven task breakdown

**New Commands:**
- `[SetupProject]` - Interactive project configuration
- `[SetupEnvironment]` - Automated database and .env setup
- `[Monitor]` - Continuous autonomous oversight
- `[Digest]` - Daily project summary
- `[TaskStart]` - Begin work on a task
- `[TaskReview]` - Submit for code review
- `[TaskQA]` - Move to QA testing
- `[TaskStage]` - Deploy to staging
- `[TaskComplete]` - Deploy to production (with approval)

**New Automation Scripts:**
- `evaluate-progression.js` - Auto-progress tasks through workflow
- `ai-code-review.js` - Automated first-pass code review
- `setup-database.js` - Database provisioning (Supabase/Neon/Docker/Local/SQLite)
- `generate-secrets.js` - Cryptographic secret generation
- `populate-env.js` - Intelligent .env file population

**New Configuration:**
- `decision-taxonomy.json` - What AI handles vs requires human input
- `quality-gates.json` - Auto-pass/block criteria for stages
- `environments.json` - Environment definitions

---

### v1.1.0 (2025-12-23) - 5-Column DevOps Workflow

**Major Changes:**
- Updated to streamlined 5-column kanban workflow
- Workflow: `Backlog → Sprint → QA → Staged → Done`
- Added automated security scanning

**Breaking Changes:**
- New HTML markers required for kanban automation

---

### v1.0.0 (2025-10-12) - Initial Release

**Core Features:**
- Slash command system for AI agent workflows
- Automated kanban card movement
- Git hook integration for deployment triggers
- Template system with placeholder replacement
- Version control for framework evolution

---

## Changelog Summary

| Version | Date | Highlights |
|---------|------|------------|
| 3.1.0 | 2026-01-15 | SetupProject UX overhaul, smart form, PRD validation, safe file generation |
| 3.0.0 | 2026-01-03 | Sprint extraction from PRD, kanban with sprint tabs |
| 2.0.0 | 2025-12-25 | Open source release, autonomous operations |
| 1.1.0 | 2025-12-23 | 5-column workflow, streamlined stages |
| 1.0.0 | 2025-10-12 | Initial release |

---

## Upgrade Path

### From v1.x → v2.0.0
1. Update all slash command files from `docs-framework/slash-commands/`
2. Add new config files: `decision-taxonomy.json`, `quality-gates.json`, `environments.json`
3. Add new automation scripts from `docs-framework/automation/`
4. Update kanban HTML with new column markers
5. Run `[SetupProject]` to regenerate configuration

---

## Future Roadmap

### v2.1.0 (Planned)
- [ ] Email notifications for decisions
- [ ] Slack/Discord webhook integration
- [ ] Automated sprint metrics and velocity tracking
- [ ] Multi-project dashboard

### v2.2.0 (Planned)
- [ ] Visual kanban board (web UI)
- [ ] AI-powered work planning assistant
- [ ] Team collaboration features
- [ ] Custom quality gate plugins

### v3.0.0 (Future)
- [ ] GUI setup wizard
- [ ] Cloud-based project registry
- [ ] AI agent marketplace for custom workflows

---

## Version Numbering (SemVer)

**Format**: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x → 2.x.x): Breaking changes, major restructure
- **MINOR** (1.0.x → 1.1.x): New features, new commands
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, documentation updates

---

## Projects Using Claude AutoPilot

1. travissutphin.com (v1.0.0) - Reference implementation
2. *Your project here* - Fork and add!

---

## Support & Contributions

- **Repository**: https://github.com/travissutphin/openSource-claudeAutoPilot
- **Issues**: https://github.com/travissutphin/openSource-claudeAutoPilot/issues
- **Contributing**: See `CONTRIBUTING.md`
- **License**: MIT

---

**Last Updated**: 2026-01-15
