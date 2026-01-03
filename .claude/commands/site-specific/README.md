# Site-Specific Slash Commands

These are **template commands** that require customization for each project. Unlike global commands (StartDay, TaskComplete, etc.), these handle project-specific workflows.

## Available Site-Specific Commands

| Command | Purpose | Primary Lead |
|---------|---------|--------------|
| [CreateBlogPost] | Create new blog post with SEO setup | [Echo] |
| [CreateCaseStudy] | Create client case study | [Echo], [Cipher] |
| [CreateServicePage] | Create service offering page | [Cipher], [Aesthetica] |
| [RunSEOAudit] | Comprehensive SEO health check | [Bran] |
| [GenerateSitemap] | Regenerate XML sitemap | [Bran], [Syntax] |
| [DeployLive] | Production deployment (requires approval) | [Flow] |

## How to Use These Templates

### 1. Copy to Your Project
```bash
cp .claude/commands/site-specific/*.md .claude/commands/
```

### 2. Customize Placeholders
Each template contains `[PLACEHOLDER]` values. Replace with your project-specific values:

- `[PRODUCTION_URL]` → Your live site URL
- `[CONTENT_BLOG_PATH]` → Path to blog content
- `[ASSETS_IMAGES]` → Path to image assets
- etc.

### 3. Adjust Workflows
Modify steps to match your:
- Tech stack (PHP, Node, etc.)
- Deployment platform (Railway, Vercel, SFTP)
- Team structure
- Approval requirements

## Command Categories

### Content Creation
- **CreateBlogPost** - Full blog creation workflow with StoryBrand structure
- **CreateCaseStudy** - Results-focused case study with client approval workflow

### Page Creation
- **CreateServicePage** - Conversion-optimized service page using StoryBrand

### SEO & Technical
- **RunSEOAudit** - Automated SEO health check with actionable report
- **GenerateSitemap** - XML sitemap generation and search engine ping

### Deployment
- **DeployLive** - Production deployment with security checks and rollback plan

## Suggested Additional Commands

Consider creating these based on your needs:

| Suggested Command | Purpose |
|------------------|---------|
| [CreateLandingPage] | Campaign/marketing landing page |
| [CreateFAQPage] | FAQ section with Schema.org |
| [CreateTeamMember] | Add team member to About page |
| [RunAccessibilityAudit] | WCAG compliance check |
| [CreateNewsletter] | Email newsletter content |
| [UpdatePricing] | Modify pricing page safely |
| [CreatePortfolioItem] | Add work to portfolio |
| [RunPerformanceAudit] | Core Web Vitals check |

## Creating New Site-Specific Commands

Use this structure:

```markdown
# [CommandName] - Short Description

**Version**: 1.0.0
**Command**: `[CommandName]` or `/commandname`
**Type**: SITE-SPECIFIC
**Trigger**: When to use this command
**Purpose**: What it accomplishes
**Executor**: [TeamMember] (Role)

---

## AUTO-EXECUTION INSTRUCTIONS
[Instructions for AI to follow]

---

## STEP 1: [Step Name]
**Executor**: [TeamMember] (Lead)

### Actions to Execute:
[Specific actions with code blocks]

### Report Format:
[Expected output format]

---

[Additional steps...]

---

## FINAL REPORT
[Summary template]

---

## CONFIGURATION
[JSON config for customization]

---

**Command Status**: SITE-SPECIFIC TEMPLATE
**Customization Required**: Yes
**Last Updated**: [Date]
**Maintainer**: [TeamMember]
```

## Integration with Global Commands

Site-specific commands integrate with the global workflow:

```
[StartDay] → Review tasks
     ↓
[CreateBlogPost] → Create content (site-specific)
     ↓
[TaskQA] → Hand off for review
     ↓
[TaskStage] → Deploy to staging
     ↓
[DeployLive] → Production (site-specific, requires approval)
     ↓
[TaskComplete] → Mark complete
     ↓
[EndDay] → Wrap up session
```

## Maintenance

- Review templates quarterly
- Update when tech stack changes
- Version control all modifications
- Test after updates
