#!/usr/bin/env node
/**
 * PRD Validator and Enhancement Tool
 * ===================================
 * Analyzes PRD structure, extracts data, and suggests improvements
 *
 * Features:
 * - Structure analysis and quality scoring
 * - Field extraction for setup form pre-fill
 * - Task extraction preview
 * - Actionable improvement suggestions
 * - PRD enhancement capabilities
 *
 * @version 1.0.0
 * @author [Codey] - TPM
 */

const fs = require('fs');
const path = require('path');

// Patterns for detecting PRD structure elements
const STRUCTURE_PATTERNS = {
  // Project overview patterns
  projectName: [
    /^#\s+(.+?)(?:\s*[-–—]\s*.+)?$/m,                    // # Project Name or # Project Name - Description
    /^##\s+Project\s*(?:Name)?[:\s]+(.+)$/im,           // ## Project Name: X
    /^\*\*Project\*\*[:\s]+(.+)$/im,                    // **Project**: X
    /^Project[:\s]+(.+)$/im                             // Project: X
  ],

  description: [
    /^##\s+(?:Overview|Introduction|About|Summary)\s*\n+(.+?)(?=\n##|\n\n##|$)/ims,
    /^#\s+.+\n+(.+?)(?=\n##|\n\n##)/ms,                 // First paragraph after H1
    /^\*\*Description\*\*[:\s]+(.+)$/im
  ],

  // Section detection patterns
  overview: /^##?\s+(Overview|Introduction|About|Summary)/im,
  goals: /^##?\s+(Goals?|Objectives?|Mission)/im,
  userStories: /^##?\s+User\s*Stories?/im,
  features: /^##?\s+Features?/im,
  technical: /^##?\s+(Technical|Tech\s*Stack|Architecture|Requirements|Technology)/im,
  acceptance: /^##?\s+(Acceptance\s*Criteria|Requirements|Definition\s*of\s*Done)/im,
  sprints: /^##?\s+(Sprint|Milestone|Phase|MVP|v\d)/im,
  timeline: /^##?\s+(Timeline|Schedule|Roadmap|Deadlines?)/im,

  // Tech stack extraction patterns
  techStack: {
    framework: [
      /(?:Framework|Built\s+with|Using)[:\s]+([A-Za-z0-9.\s]+)/i,
      /\b(Next\.?js|React|Vue|Angular|Svelte|Nuxt|Remix|Astro|Express|Fastify|NestJS|Django|Flask|Rails|Laravel|Spring\s*Boot?)\b/i
    ],
    css: [
      /(?:CSS|Styling|Styles)[:\s]+([A-Za-z0-9.\s-]+)/i,
      /\b(Tailwind(?:\s*CSS)?|Bootstrap|styled-components|CSS\s*Modules|Sass|SCSS|Less|Chakra\s*UI|Material\s*UI|MUI|Ant\s*Design)\b/i
    ],
    database: [
      /(?:Database|DB|Data\s*Store)[:\s]+([A-Za-z0-9.\s]+)/i,
      /\b(PostgreSQL|Postgres|MySQL|MariaDB|MongoDB|SQLite|Redis|DynamoDB|Firestore|Supabase|PlanetScale|Neon|CockroachDB)\b/i
    ],
    orm: [
      /(?:ORM)[:\s]+([A-Za-z0-9.\s]+)/i,
      /\b(Prisma|Drizzle|TypeORM|Sequelize|Mongoose|Knex|SQLAlchemy|ActiveRecord)\b/i
    ],
    auth: [
      /(?:Auth(?:entication)?|Identity)[:\s]+([A-Za-z0-9.\s]+)/i,
      /\b(NextAuth|Auth\.?js|Clerk|Auth0|Firebase\s*Auth|Supabase\s*Auth|Passport|JWT)\b/i
    ],
    hosting: [
      /(?:Hosting|Deploy(?:ment)?|Platform)[:\s]+([A-Za-z0-9.\s]+)/i,
      /\b(Vercel|Netlify|AWS|Azure|GCP|Heroku|Railway|Render|Fly\.?io|DigitalOcean|Cloudflare)\b/i
    ]
  },

  // Task extraction patterns
  taskPatterns: {
    featureHeading: /^###\s+(?:Feature[:\s]*)?(.+)/gim,
    bulletFeature: /^[-*]\s+(?:\*\*)?(.+?)(?:\*\*)?(?:$|:)/gim,
    numberedItem: /^\d+\.\s+(.+)/gim,
    userStory: /As\s+a\s+(.+?),?\s+I\s+(?:want|need|can|should)\s+(?:to\s+)?(.+?)(?:\s+so\s+that\s+(.+))?$/gim,
    checkbox: /^[-*]\s+\[\s*[x ]?\s*\]\s+(.+)/gim
  },

  // Sprint/milestone patterns
  sprintPatterns: [
    /^##\s+(Sprint\s+\d+)[:\s-]*(.*)$/gim,
    /^##\s+(Milestone\s+\d+)[:\s-]*(.*)$/gim,
    /^##\s+(Phase\s+\d+)[:\s-]*(.*)$/gim,
    /^##\s+(MVP)[:\s-]*(.*)$/gim,
    /^##\s+(v\d+(?:\.\d+)?)[:\s-]*(.*)$/gim
  ]
};

// Quality scoring weights
const QUALITY_WEIGHTS = {
  structure: 25,      // Has proper sections
  completeness: 25,   // All key sections present
  clarity: 25,        // Clear descriptions, user stories
  actionability: 25   // Has acceptance criteria, task-ready items
};

class PRDValidator {
  constructor(prdPath) {
    this.prdPath = prdPath;
    this.content = '';
    this.lines = [];
    this.analysis = null;
  }

  /**
   * Load PRD content from file
   */
  load() {
    if (!fs.existsSync(this.prdPath)) {
      throw new Error(`PRD file not found: ${this.prdPath}`);
    }
    this.content = fs.readFileSync(this.prdPath, 'utf8');
    this.lines = this.content.split('\n');
    return this;
  }

  /**
   * Load PRD content from string
   */
  loadContent(content) {
    this.content = content;
    this.lines = content.split('\n');
    return this;
  }

  /**
   * Find line number where a pattern matches
   */
  findLineNumber(pattern) {
    for (let i = 0; i < this.lines.length; i++) {
      if (pattern.test(this.lines[i])) {
        return i + 1;
      }
    }
    return null;
  }

  /**
   * Extract first match from patterns array
   */
  extractFirst(patterns, content = this.content) {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Extract all matches from a pattern
   */
  extractAll(pattern, content = this.content) {
    const matches = [];
    let match;
    const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');

    while ((match = regex.exec(content)) !== null) {
      matches.push({
        full: match[0],
        groups: match.slice(1),
        index: match.index,
        line: this.content.substring(0, match.index).split('\n').length
      });
    }
    return matches;
  }

  /**
   * Analyze PRD structure
   */
  analyzeStructure() {
    const structure = {
      hasOverview: false,
      hasGoals: false,
      hasUserStories: false,
      hasFeatures: false,
      hasTechnical: false,
      hasAcceptance: false,
      hasSprints: false,
      hasTimeline: false,
      sections: []
    };

    // Check each section
    const checks = [
      { key: 'hasOverview', pattern: STRUCTURE_PATTERNS.overview, name: 'Project Overview' },
      { key: 'hasGoals', pattern: STRUCTURE_PATTERNS.goals, name: 'Goals/Objectives' },
      { key: 'hasUserStories', pattern: STRUCTURE_PATTERNS.userStories, name: 'User Stories' },
      { key: 'hasFeatures', pattern: STRUCTURE_PATTERNS.features, name: 'Features' },
      { key: 'hasTechnical', pattern: STRUCTURE_PATTERNS.technical, name: 'Technical Requirements' },
      { key: 'hasAcceptance', pattern: STRUCTURE_PATTERNS.acceptance, name: 'Acceptance Criteria' },
      { key: 'hasSprints', pattern: STRUCTURE_PATTERNS.sprints, name: 'Sprints/Milestones' },
      { key: 'hasTimeline', pattern: STRUCTURE_PATTERNS.timeline, name: 'Timeline' }
    ];

    for (const check of checks) {
      const lineNum = this.findLineNumber(check.pattern);
      if (lineNum) {
        structure[check.key] = true;
        structure.sections.push({
          name: check.name,
          line: lineNum,
          found: true
        });
      } else {
        structure.sections.push({
          name: check.name,
          found: false
        });
      }
    }

    return structure;
  }

  /**
   * Extract project information for setup form
   */
  extractProjectInfo() {
    const info = {
      name: null,
      nameSource: null,
      description: null,
      descriptionSource: null,
      techStack: {},
      extracted: []
    };

    // Extract project name
    info.name = this.extractFirst(STRUCTURE_PATTERNS.projectName);
    if (info.name) {
      info.nameSource = 'prd';
      info.extracted.push({ field: 'name', value: info.name, source: 'PRD title' });
    }

    // Extract description
    info.description = this.extractFirst(STRUCTURE_PATTERNS.description);
    if (info.description) {
      // Clean up and truncate
      info.description = info.description
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 200);
      info.descriptionSource = 'prd';
      info.extracted.push({ field: 'description', value: info.description, source: 'PRD overview' });
    }

    // Extract tech stack
    for (const [key, patterns] of Object.entries(STRUCTURE_PATTERNS.techStack)) {
      const value = this.extractFirst(patterns);
      if (value) {
        info.techStack[key] = value;
        info.extracted.push({ field: `tech.${key}`, value, source: 'PRD technical section' });
      }
    }

    return info;
  }

  /**
   * Extract potential tasks from PRD
   */
  extractTasks() {
    const tasks = {
      fromFeatures: [],
      fromUserStories: [],
      fromBullets: [],
      fromNumbered: [],
      fromCheckboxes: [],
      total: 0,
      bySection: {}
    };

    // Extract from feature headings
    const featureMatches = this.extractAll(STRUCTURE_PATTERNS.taskPatterns.featureHeading);
    for (const match of featureMatches) {
      if (match.groups[0] && !match.groups[0].toLowerCase().includes('feature')) {
        tasks.fromFeatures.push({
          title: match.groups[0].trim(),
          line: match.line,
          type: 'feature'
        });
      }
    }

    // Extract user stories
    const storyMatches = this.extractAll(STRUCTURE_PATTERNS.taskPatterns.userStory);
    for (const match of storyMatches) {
      tasks.fromUserStories.push({
        role: match.groups[0],
        action: match.groups[1],
        benefit: match.groups[2] || null,
        line: match.line,
        type: 'user_story'
      });
    }

    // Extract checkbox items (acceptance criteria)
    const checkboxMatches = this.extractAll(STRUCTURE_PATTERNS.taskPatterns.checkbox);
    for (const match of checkboxMatches) {
      tasks.fromCheckboxes.push({
        title: match.groups[0].trim(),
        line: match.line,
        type: 'acceptance_criteria'
      });
    }

    // Calculate total
    tasks.total = tasks.fromFeatures.length +
                  tasks.fromUserStories.length;

    // Group by section
    const sections = this.content.split(/^##\s+/m);
    for (let i = 1; i < sections.length; i++) {
      const sectionTitle = sections[i].split('\n')[0].trim();
      const sectionContent = sections[i];

      // Count tasks in this section
      const featureCount = (sectionContent.match(/^###\s+/gm) || []).length;
      const bulletCount = (sectionContent.match(/^[-*]\s+(?!\[)/gm) || []).length;
      const storyCount = (sectionContent.match(/As\s+a\s+/gi) || []).length;

      if (featureCount + bulletCount + storyCount > 0) {
        tasks.bySection[sectionTitle] = {
          features: featureCount,
          bullets: bulletCount,
          stories: storyCount,
          total: featureCount + storyCount
        };
      }
    }

    return tasks;
  }

  /**
   * Extract sprint/milestone organization
   */
  extractSprints() {
    const sprints = [];

    for (const pattern of STRUCTURE_PATTERNS.sprintPatterns) {
      const matches = this.extractAll(pattern);
      for (const match of matches) {
        sprints.push({
          name: match.groups[0],
          description: match.groups[1] || '',
          line: match.line
        });
      }
    }

    return sprints;
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(structure, tasks, sprints) {
    const scores = {
      structure: 0,
      completeness: 0,
      clarity: 0,
      actionability: 0,
      total: 0,
      details: []
    };

    // Structure score (25 points)
    const structureChecks = [
      structure.hasOverview,
      structure.hasGoals,
      structure.hasFeatures,
      structure.hasTechnical
    ];
    scores.structure = Math.round((structureChecks.filter(Boolean).length / structureChecks.length) * QUALITY_WEIGHTS.structure);
    scores.details.push({
      category: 'Structure',
      score: scores.structure,
      max: QUALITY_WEIGHTS.structure,
      notes: `${structureChecks.filter(Boolean).length}/4 key sections found`
    });

    // Completeness score (25 points)
    const completenessChecks = [
      structure.hasOverview,
      structure.hasFeatures,
      structure.hasTechnical,
      tasks.total >= 3,
      structure.hasUserStories || tasks.fromUserStories.length > 0
    ];
    scores.completeness = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * QUALITY_WEIGHTS.completeness);
    scores.details.push({
      category: 'Completeness',
      score: scores.completeness,
      max: QUALITY_WEIGHTS.completeness,
      notes: `${completenessChecks.filter(Boolean).length}/5 completeness checks passed`
    });

    // Clarity score (25 points)
    const hasUserStories = tasks.fromUserStories.length >= 2;
    const hasDescriptions = tasks.fromFeatures.length >= 2;
    const hasClearSections = structure.sections.filter(s => s.found).length >= 3;
    const clarityChecks = [hasUserStories, hasDescriptions, hasClearSections];
    scores.clarity = Math.round((clarityChecks.filter(Boolean).length / clarityChecks.length) * QUALITY_WEIGHTS.clarity);
    scores.details.push({
      category: 'Clarity',
      score: scores.clarity,
      max: QUALITY_WEIGHTS.clarity,
      notes: `${tasks.fromUserStories.length} user stories, ${tasks.fromFeatures.length} feature descriptions`
    });

    // Actionability score (25 points)
    const hasAcceptanceCriteria = tasks.fromCheckboxes.length >= 3 || structure.hasAcceptance;
    const hasMilestones = sprints.length > 0 || structure.hasSprints;
    const hasEnoughTasks = tasks.total >= 5;
    const actionabilityChecks = [hasAcceptanceCriteria, hasMilestones, hasEnoughTasks];
    scores.actionability = Math.round((actionabilityChecks.filter(Boolean).length / actionabilityChecks.length) * QUALITY_WEIGHTS.actionability);
    scores.details.push({
      category: 'Actionability',
      score: scores.actionability,
      max: QUALITY_WEIGHTS.actionability,
      notes: `${tasks.fromCheckboxes.length} acceptance criteria, ${sprints.length} milestones`
    });

    // Total
    scores.total = scores.structure + scores.completeness + scores.clarity + scores.actionability;

    return scores;
  }

  /**
   * Generate improvement suggestions
   */
  generateSuggestions(structure, tasks, sprints, projectInfo) {
    const suggestions = [];

    // Missing acceptance criteria
    if (tasks.fromCheckboxes.length < 3 && !structure.hasAcceptance) {
      suggestions.push({
        priority: 'high',
        category: 'Acceptance Criteria',
        issue: 'Missing or insufficient acceptance criteria',
        suggestion: 'Add checkboxes to define when features are complete',
        example: `### User Profile
**Acceptance Criteria:**
- [ ] User can view their profile
- [ ] User can edit display name
- [ ] User can upload avatar (max 5MB)`
      });
    }

    // Missing sprint organization
    if (sprints.length === 0 && !structure.hasSprints && tasks.total > 5) {
      suggestions.push({
        priority: 'medium',
        category: 'Organization',
        issue: 'No sprint/milestone organization',
        suggestion: 'Group features into milestones for better planning',
        example: `## Milestone 1: MVP (Core Features)
- User Authentication
- Dashboard
- Basic CRUD

## Milestone 2: Growth Features
- Team Management
- Integrations`
      });
    }

    // Missing user stories
    if (tasks.fromUserStories.length < 2 && !structure.hasUserStories) {
      suggestions.push({
        priority: 'medium',
        category: 'User Stories',
        issue: 'Few or no user stories found',
        suggestion: 'Add user stories to clarify who benefits and why',
        example: `## User Stories

**As a** new user,
**I want to** create an account with email
**so that** I can access the platform.

**As a** team admin,
**I want to** invite team members
**so that** we can collaborate on projects.`
      });
    }

    // Missing technical requirements
    if (!structure.hasTechnical) {
      suggestions.push({
        priority: 'low',
        category: 'Technical',
        issue: 'No technical requirements section',
        suggestion: 'Add a technical section for the development team',
        example: `## Technical Requirements

**Stack:**
- Framework: Next.js 14
- Database: PostgreSQL
- Auth: NextAuth.js

**Performance:**
- Page load < 3s
- API response < 500ms`
      });
    }

    // Missing tech stack details
    const missingTech = [];
    if (!projectInfo.techStack.framework) missingTech.push('framework');
    if (!projectInfo.techStack.database) missingTech.push('database');
    if (missingTech.length > 0) {
      suggestions.push({
        priority: 'medium',
        category: 'Tech Stack',
        issue: `Missing tech details: ${missingTech.join(', ')}`,
        suggestion: 'Specify the tech stack explicitly for setup automation',
        example: `## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma
- **CSS:** Tailwind CSS
- **Auth:** NextAuth.js`
      });
    }

    return suggestions;
  }

  /**
   * Run full validation and analysis
   */
  validate() {
    if (!this.content) {
      throw new Error('PRD content not loaded. Call load() or loadContent() first.');
    }

    const structure = this.analyzeStructure();
    const projectInfo = this.extractProjectInfo();
    const tasks = this.extractTasks();
    const sprints = this.extractSprints();
    const qualityScore = this.calculateQualityScore(structure, tasks, sprints);
    const suggestions = this.generateSuggestions(structure, tasks, sprints, projectInfo);

    this.analysis = {
      structure,
      projectInfo,
      tasks,
      sprints,
      qualityScore,
      suggestions,
      summary: {
        totalTasks: tasks.total,
        totalSprints: sprints.length,
        qualityScore: qualityScore.total,
        criticalIssues: suggestions.filter(s => s.priority === 'high').length,
        sectionsFound: structure.sections.filter(s => s.found).length,
        sectionsMissing: structure.sections.filter(s => !s.found).length
      }
    };

    return this.analysis;
  }

  /**
   * Generate formatted report
   */
  generateReport() {
    if (!this.analysis) {
      this.validate();
    }

    const { structure, tasks, sprints, qualityScore, suggestions, summary } = this.analysis;

    const lines = [];

    lines.push('PRD ANALYSIS REPORT');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    // Structure scan
    lines.push('STRUCTURE SCAN:');
    for (const section of structure.sections) {
      const status = section.found ? '✓' : '✗';
      const line = section.line ? ` (line ${section.line})` : '';
      lines.push(`${status} ${section.name}${line}`);
    }
    lines.push('');

    // Task extraction preview
    lines.push('TASK EXTRACTION PREVIEW:');
    lines.push(`Found ${summary.totalTasks} potential tasks:`);
    for (const [sectionName, counts] of Object.entries(tasks.bySection)) {
      lines.push(`  • ${counts.total} from ## ${sectionName}`);
    }
    if (tasks.fromUserStories.length > 0) {
      lines.push(`  • ${tasks.fromUserStories.length} from user stories`);
    }
    lines.push('');

    // Sprint organization
    if (sprints.length > 0) {
      lines.push('SPRINT ORGANIZATION:');
      for (const sprint of sprints) {
        lines.push(`  • ${sprint.name}: ${sprint.description}`);
      }
    } else {
      lines.push('SPRINT ORGANIZATION:');
      lines.push('  ⚠ No explicit sprints/milestones found (will auto-organize)');
    }
    lines.push('');

    // Quality score
    lines.push(`QUALITY SCORE: ${qualityScore.total}/100`);
    for (const detail of qualityScore.details) {
      lines.push(`  - ${detail.category}: ${detail.score}/${detail.max}`);
    }
    lines.push('');

    // Suggestions
    if (suggestions.length > 0) {
      lines.push('═══════════════════════════════════════════════════════════');
      lines.push('SUGGESTIONS FOR IMPROVEMENT:');
      lines.push('');

      let suggestionNum = 1;
      for (const suggestion of suggestions) {
        const priority = suggestion.priority === 'high' ? '🔴' :
                        suggestion.priority === 'medium' ? '🟡' : '🟢';
        lines.push(`${suggestionNum}. ${priority} ${suggestion.category.toUpperCase()}`);
        lines.push(`   Issue: ${suggestion.issue}`);
        lines.push(`   Fix: ${suggestion.suggestion}`);
        lines.push('');
        lines.push(`   Example:`);
        for (const exLine of suggestion.example.split('\n')) {
          lines.push(`   ${exLine}`);
        }
        lines.push('');
        suggestionNum++;
      }
    }

    lines.push('═══════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Get extracted data for setup form pre-fill
   */
  getSetupFormData() {
    if (!this.analysis) {
      this.validate();
    }

    const { projectInfo, tasks, sprints } = this.analysis;

    return {
      project: {
        name: projectInfo.name,
        name_source: projectInfo.nameSource,
        description: projectInfo.description,
        description_source: projectInfo.descriptionSource
      },
      tech_stack: {
        framework: projectInfo.techStack.framework || null,
        framework_source: projectInfo.techStack.framework ? 'prd' : null,
        css: projectInfo.techStack.css || null,
        css_source: projectInfo.techStack.css ? 'prd' : null,
        database: projectInfo.techStack.database || null,
        database_source: projectInfo.techStack.database ? 'prd' : null,
        orm: projectInfo.techStack.orm || null,
        auth: projectInfo.techStack.auth || null,
        hosting: projectInfo.techStack.hosting || null
      },
      extraction_stats: {
        total_tasks: tasks.total,
        total_sprints: sprints.length,
        user_stories: tasks.fromUserStories.length,
        features: tasks.fromFeatures.length,
        acceptance_criteria: tasks.fromCheckboxes.length
      },
      sprints: sprints.map(s => ({
        name: s.name,
        description: s.description
      }))
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
PRD Validator - Analyze and validate PRD documents

Usage:
  prd-validator.js <prd-file> [options]

Options:
  --report          Generate full analysis report (default)
  --json            Output analysis as JSON
  --setup-data      Output setup form pre-fill data as JSON
  --suggestions     Show only improvement suggestions
  --score           Show only quality score
  --help, -h        Show this help

Examples:
  prd-validator.js docs/prd/PRD.md --report
  prd-validator.js PRD.md --json > analysis.json
  prd-validator.js PRD.md --setup-data
    `);
    process.exit(0);
  }

  const prdPath = args[0];
  const validator = new PRDValidator(prdPath);

  try {
    validator.load();
    const analysis = validator.validate();

    if (args.includes('--json')) {
      console.log(JSON.stringify(analysis, null, 2));
    } else if (args.includes('--setup-data')) {
      console.log(JSON.stringify(validator.getSetupFormData(), null, 2));
    } else if (args.includes('--suggestions')) {
      for (const suggestion of analysis.suggestions) {
        console.log(`[${suggestion.priority.toUpperCase()}] ${suggestion.category}: ${suggestion.issue}`);
        console.log(`  → ${suggestion.suggestion}\n`);
      }
    } else if (args.includes('--score')) {
      console.log(`Quality Score: ${analysis.qualityScore.total}/100`);
      for (const detail of analysis.qualityScore.details) {
        console.log(`  ${detail.category}: ${detail.score}/${detail.max}`);
      }
    } else {
      console.log(validator.generateReport());
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { PRDValidator, STRUCTURE_PATTERNS, QUALITY_WEIGHTS };
