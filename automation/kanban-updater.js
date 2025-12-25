#!/usr/bin/env node
/**
 * Kanban Board Automation Script
 * Version: 1.0.0
 * Purpose: Programmatically update kanban HTML file (move cards, update status)
 *
 * Usage:
 *   node kanban-updater.js --task-id="013" --from-column="in_progress" --to-column="review" --status="completed"
 *
 * Options:
 *   --task-id       Task ID (e.g., "013")
 *   --from-column   Source column (backlog/ready/in_progress/review/qa/staging/done)
 *   --to-column     Destination column
 *   --status        Card status (completed/blocked/review) [optional]
 *   --add-note      Add note to card description [optional]
 *   --kanban-file   Path to kanban HTML file [optional, uses config default]
 *   --dry-run       Show what would change without modifying file [optional]
 *
 * Examples:
 *   # Move task from Ready to In Progress
 *   node kanban-updater.js --task-id="010" --from-column="ready" --to-column="in_progress"
 *
 *   # Complete task and move to Done
 *   node kanban-updater.js --task-id="013" --from-column="staging" --to-column="done" \
 *     --status="completed" --add-note="Deployed successfully"
 *
 * Framework: AI-DOCS v1.0.0
 * Maintainer: [Codey] (TPM)
 */

const fs = require('fs');
const path = require('path');

// ====================
// CONFIGURATION
// ====================

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace(/^--/, '')] = value?.replace(/^["']|["']$/g, '') || true;
  return acc;
}, {});

// Required arguments
const TASK_ID = args['task-id'];
const FROM_COLUMN = args['from-column'];
const TO_COLUMN = args['to-column'];

// Optional arguments
const STATUS = args['status'];
const ADD_NOTE = args['add-note'];
const DRY_RUN = args['dry-run'] === true;

// Default kanban file path (can be overridden)
const DEFAULT_KANBAN_PATH = path.join(process.cwd(), 'docs', 'kanban', 'kanban_dev.html');
const KANBAN_FILE = args['kanban-file'] || DEFAULT_KANBAN_PATH;

// ====================
// VALIDATION
// ====================

function validateArgs() {
  const errors = [];

  if (!TASK_ID) {
    errors.push('--task-id is required (e.g., --task-id="013")');
  }

  if (!FROM_COLUMN) {
    errors.push('--from-column is required (backlog/ready/in_progress/review/qa/staging/done)');
  }

  if (!TO_COLUMN) {
    errors.push('--to-column is required (backlog/ready/in_progress/review/qa/staging/done)');
  }

  const validColumns = ['backlog', 'ready', 'in_progress', 'review', 'qa', 'staging', 'done'];
  if (FROM_COLUMN && !validColumns.includes(FROM_COLUMN)) {
    errors.push(`Invalid --from-column: "${FROM_COLUMN}". Must be one of: ${validColumns.join(', ')}`);
  }

  if (TO_COLUMN && !validColumns.includes(TO_COLUMN)) {
    errors.push(`Invalid --to-column: "${TO_COLUMN}". Must be one of: ${validColumns.join(', ')}`);
  }

  if (STATUS && !['completed', 'blocked', 'review'].includes(STATUS)) {
    errors.push(`Invalid --status: "${STATUS}". Must be: completed, blocked, or review`);
  }

  if (!fs.existsSync(KANBAN_FILE)) {
    errors.push(`Kanban file not found: ${KANBAN_FILE}`);
  }

  if (errors.length > 0) {
    console.error('❌ Validation Errors:\n');
    errors.forEach(err => console.error(`   - ${err}`));
    console.error('\n📖 Usage: node kanban-updater.js --task-id="XXX" --from-column="ready" --to-column="in_progress"\n');
    process.exit(1);
  }
}

// ====================
// MAIN LOGIC
// ====================

function main() {
  console.log('🤖 Kanban Updater v1.0.0\n');
  console.log(`📌 Task ID: #${TASK_ID}`);
  console.log(`📦 Moving: ${FROM_COLUMN} → ${TO_COLUMN}`);
  if (STATUS) console.log(`📊 Status: ${STATUS}`);
  if (ADD_NOTE) console.log(`📝 Note: ${ADD_NOTE}`);
  if (DRY_RUN) console.log(`🔍 Mode: DRY RUN (no changes will be saved)`);
  console.log('');

  // Validate arguments
  validateArgs();

  // Read kanban HTML file
  let kanbanHTML = fs.readFileSync(KANBAN_FILE, 'utf8');
  const originalHTML = kanbanHTML;

  // Find the card HTML by task ID
  const cardRegex = new RegExp(
    `(<div class="card"[^>]*data-id="${TASK_ID}"[^>]*>[\\s\\S]*?<\\/div>\\s*<\\/div>)`,
    'i'
  );

  const cardMatch = kanbanHTML.match(cardRegex);

  if (!cardMatch) {
    console.error(`❌ Card not found: Task #${TASK_ID} does not exist in kanban`);
    console.error(`   File: ${KANBAN_FILE}`);
    process.exit(1);
  }

  let cardHTML = cardMatch[0];
  console.log(`✅ Found card #${TASK_ID}`);

  // Update card status if provided
  if (STATUS) {
    const statusEmoji = {
      completed: '✅ COMPLETED',
      blocked: '🚫 BLOCKED',
      review: '👀 REVIEW'
    }[STATUS];

    // Check if card already has a status badge
    if (cardHTML.includes('<span class="card-status')) {
      // Replace existing status
      cardHTML = cardHTML.replace(
        /<span class="card-status[^"]*">[^<]*<\/span>/,
        `<span class="card-status status-${STATUS}">${statusEmoji}</span>`
      );
      console.log(`✅ Updated status: ${STATUS}`);
    } else {
      // Add status badge after title
      cardHTML = cardHTML.replace(
        /(<h4 class="card-title">.*?<\/h4>)/,
        `$1\n            <span class="card-status status-${STATUS}">${statusEmoji}</span>`
      );
      console.log(`✅ Added status: ${STATUS}`);
    }
  }

  // Add note to description if provided
  if (ADD_NOTE) {
    cardHTML = cardHTML.replace(
      /(<p class="card-description">)(.*?)(<\/p>)/,
      `$1${STATUS === 'completed' ? '✅ COMPLETED: ' : ''}${ADD_NOTE}$3`
    );
    console.log(`✅ Added note to description`);
  }

  // Remove card from source column
  const fromMarkerStart = `<!-- KANBAN_${FROM_COLUMN.toUpperCase()}_START -->`;
  const fromMarkerEnd = `<!-- KANBAN_${FROM_COLUMN.toUpperCase()}_END -->`;

  const fromSectionRegex = new RegExp(
    `${escapeRegex(fromMarkerStart)}([\\s\\S]*?)${escapeRegex(fromMarkerEnd)}`,
    'g'
  );

  let cardRemoved = false;
  kanbanHTML = kanbanHTML.replace(fromSectionRegex, (match, content) => {
    if (content.includes(`data-id="${TASK_ID}"`)) {
      const updatedContent = content.replace(cardRegex, ''); // Remove card
      cardRemoved = true;
      return `${fromMarkerStart}${updatedContent}${fromMarkerEnd}`;
    }
    return match;
  });

  if (!cardRemoved) {
    console.error(`❌ Card #${TASK_ID} not found in "${FROM_COLUMN}" column`);
    console.error(`   Tip: Verify the card is currently in the "${FROM_COLUMN}" column in the kanban`);
    process.exit(1);
  }

  console.log(`✅ Removed card from "${FROM_COLUMN}" column`);

  // Add card to destination column
  const toMarkerStart = `<!-- KANBAN_${TO_COLUMN.toUpperCase()}_START -->`;
  const toMarkerEnd = `<!-- KANBAN_${TO_COLUMN.toUpperCase()}_END -->`;

  const toSectionRegex = new RegExp(
    `${escapeRegex(toMarkerStart)}([\\s\\S]*?)${escapeRegex(toMarkerEnd)}`,
    'g'
  );

  kanbanHTML = kanbanHTML.replace(toSectionRegex, (match, content) => {
    // Add card at the beginning of the column (prepend)
    return `${toMarkerStart}\n          ${cardHTML}\n${content}${toMarkerEnd}`;
  });

  console.log(`✅ Added card to "${TO_COLUMN}" column`);

  // Check if anything actually changed
  if (kanbanHTML === originalHTML) {
    console.warn('⚠️  Warning: No changes were made to the kanban file');
    console.warn('   This might indicate an issue with the update logic');
  }

  // Write updated HTML (or show dry run)
  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN: Changes would be applied (file not modified)');
    console.log('\n📄 Updated Card HTML:\n');
    console.log(cardHTML);
  } else {
    fs.writeFileSync(KANBAN_FILE, kanbanHTML, 'utf8');
    console.log(`\n✅ Kanban file updated: ${KANBAN_FILE}`);
    console.log(`\n🎯 Summary: Task #${TASK_ID} moved from "${FROM_COLUMN}" → "${TO_COLUMN}"`);
  }

  console.log('\n✅ Operation complete!');
}

// ====================
// HELPER FUNCTIONS
// ====================

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ====================
// HELP TEXT
// ====================

if (args['help'] || args['h']) {
  console.log(`
🤖 Kanban Updater - AI-DOCS Framework v1.0.0

USAGE:
  node kanban-updater.js --task-id="XXX" --from-column="ready" --to-column="in_progress"

REQUIRED OPTIONS:
  --task-id       Task ID (e.g., "013", no # symbol)
  --from-column   Source column: backlog, ready, in_progress, review, qa, staging, done
  --to-column     Destination column: backlog, ready, in_progress, review, qa, staging, done

OPTIONAL:
  --status        Update card status: completed, blocked, review
  --add-note      Add note to card description (text)
  --kanban-file   Custom path to kanban HTML file
  --dry-run       Preview changes without modifying file
  --help, -h      Show this help message

EXAMPLES:
  # Move task from Ready to In Progress
  node kanban-updater.js --task-id="010" --from-column="ready" --to-column="in_progress"

  # Complete task and move to Done
  node kanban-updater.js --task-id="013" --from-column="staging" --to-column="done" \\
    --status="completed" --add-note="Deployed successfully"

  # Dry run to preview changes
  node kanban-updater.js --task-id="013" --from-column="in_progress" --to-column="review" --dry-run

CONFIGURATION:
  Default kanban path: docs/kanban/kanban_dev.html
  Override with: --kanban-file="/path/to/kanban.html"

For more information: /docs-framework/docs/AUTOMATION-GUIDE.md
  `);
  process.exit(0);
}

// ====================
// EXECUTE
// ====================

try {
  main();
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
