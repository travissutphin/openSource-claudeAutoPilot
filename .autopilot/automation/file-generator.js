#!/usr/bin/env node
/**
 * Safe File Generator with Preview and Backup
 * ============================================
 * Handles idempotent file generation for SetupProject
 *
 * Features:
 * - Hash-based change detection
 * - Timestamped automatic backups
 * - Diff preview before writing
 * - Merge logic for config files
 * - Custom marker detection (skip files user has customized)
 *
 * @version 1.0.0
 * @author [Codey] - TPM
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Markers that indicate a file has been customized and should not be overwritten
const CUSTOM_MARKERS = [
  '# CUSTOM',
  '<!-- CUSTOM',
  '"_custom": true',
  '// CUSTOM',
  '/* CUSTOM'
];

// Fields in placeholders.json that should be preserved if customized
const PRESERVE_KEYS = [
  'team',
  'autonomous_operations',
  'quality_thresholds',
  'environments'
];

// Fields in placeholders.json that should always be updated from setup
const UPDATE_KEYS = [
  'project',
  'tech_stack',
  'urls',
  'paths',
  'git'
];

class FileGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.backupDir = null;
    this.changes = [];
    this.verbose = false;
  }

  /**
   * Enable verbose logging
   */
  setVerbose(verbose) {
    this.verbose = verbose;
    return this;
  }

  /**
   * Log message if verbose mode is enabled
   */
  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  /**
   * Calculate MD5 hash of file content for change detection
   * @param {string} filePath - Path to file
   * @returns {string|null} - MD5 hash or null if file doesn't exist
   */
  hashFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Calculate MD5 hash of content string
   * @param {string} content - Content to hash
   * @returns {string} - MD5 hash
   */
  hashContent(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Check if file has a custom marker indicating it shouldn't be overwritten
   * @param {string} filePath - Path to file
   * @returns {boolean} - True if file has custom marker
   */
  hasCustomMarker(filePath) {
    if (!fs.existsSync(filePath)) return false;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const firstLines = content.split('\n').slice(0, 5).join('\n');
      return CUSTOM_MARKERS.some(marker =>
        firstLines.toUpperCase().includes(marker.toUpperCase())
      );
    } catch (err) {
      this.log(`Error reading file ${filePath}: ${err.message}`);
      return false;
    }
  }

  /**
   * Create timestamped backup directory
   * @returns {string} - Path to backup directory
   */
  createBackupDir() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);

    this.backupDir = path.join(
      this.projectRoot,
      '.autopilot',
      'backups',
      timestamp
    );

    fs.mkdirSync(this.backupDir, { recursive: true });
    this.log(`Created backup directory: ${this.backupDir}`);

    return this.backupDir;
  }

  /**
   * Backup a single file before modification
   * @param {string} filePath - Path to file to backup
   * @returns {string|null} - Path to backup file or null if source doesn't exist
   */
  backupFile(filePath) {
    if (!this.backupDir) this.createBackupDir();
    if (!fs.existsSync(filePath)) return null;

    const relativePath = path.relative(this.projectRoot, filePath);
    const backupPath = path.join(this.backupDir, relativePath);

    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(filePath, backupPath);

    this.log(`Backed up: ${relativePath}`);
    return backupPath;
  }

  /**
   * Generate a simple line-by-line diff between old and new content
   * @param {string} oldContent - Original content
   * @param {string} newContent - New content
   * @param {number} maxLines - Maximum number of diff lines to return
   * @returns {Array} - Array of diff objects {type: 'add'|'remove'|'context', line: string}
   */
  generateDiff(oldContent, newContent, maxLines = 20) {
    const oldLines = (oldContent || '').split('\n');
    const newLines = newContent.split('\n');
    const diff = [];

    let oldIdx = 0;
    let newIdx = 0;
    let diffCount = 0;

    while ((oldIdx < oldLines.length || newIdx < newLines.length) && diffCount < maxLines) {
      const oldLine = oldLines[oldIdx];
      const newLine = newLines[newIdx];

      if (oldLine === newLine) {
        // Lines match - skip context unless it's near a change
        oldIdx++;
        newIdx++;
      } else if (oldLine !== undefined && !newLines.includes(oldLine)) {
        // Line was removed
        diff.push({ type: 'remove', line: oldLine, lineNum: oldIdx + 1 });
        diffCount++;
        oldIdx++;
      } else if (newLine !== undefined && !oldLines.includes(newLine)) {
        // Line was added
        diff.push({ type: 'add', line: newLine, lineNum: newIdx + 1 });
        diffCount++;
        newIdx++;
      } else {
        oldIdx++;
        newIdx++;
      }
    }

    if (oldIdx < oldLines.length || newIdx < newLines.length) {
      diff.push({ type: 'truncated', remaining: Math.max(oldLines.length - oldIdx, newLines.length - newIdx) });
    }

    return diff;
  }

  /**
   * Format diff for display
   * @param {Array} diff - Diff array from generateDiff
   * @returns {string} - Formatted diff string
   */
  formatDiff(diff) {
    return diff.map(d => {
      if (d.type === 'add') return `  + ${d.line}`;
      if (d.type === 'remove') return `  - ${d.line}`;
      if (d.type === 'truncated') return `  [+${d.remaining} more changes]`;
      return `    ${d.line}`;
    }).join('\n');
  }

  /**
   * Check if a value is a placeholder (contains brackets)
   * @param {any} value - Value to check
   * @returns {boolean} - True if value is a placeholder
   */
  isPlaceholder(value) {
    if (typeof value === 'string') {
      return /\[.*\]/.test(value);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => this.isPlaceholder(v));
    }
    return false;
  }

  /**
   * Deep merge two objects, preserving customized fields
   * @param {object} existing - Existing object
   * @param {object} updates - Updates to apply
   * @param {Array} preserveKeys - Keys to preserve if customized
   * @returns {object} - Merged object
   */
  deepMerge(existing, updates, preserveKeys = []) {
    const result = { ...existing };

    for (const key of Object.keys(updates)) {
      if (preserveKeys.includes(key)) {
        // Preserve this key if it exists and is not a placeholder
        if (existing[key] && !this.isPlaceholder(existing[key])) {
          result[key] = existing[key];
          continue;
        }
      }

      if (
        typeof updates[key] === 'object' &&
        updates[key] !== null &&
        !Array.isArray(updates[key]) &&
        typeof existing[key] === 'object' &&
        existing[key] !== null
      ) {
        // Recursively merge objects
        result[key] = this.deepMerge(existing[key], updates[key], []);
      } else {
        // Overwrite with new value
        result[key] = updates[key];
      }
    }

    return result;
  }

  /**
   * Merge placeholders.json preserving custom fields
   * @param {string} existingPath - Path to existing placeholders.json
   * @param {object} newData - New data to merge
   * @returns {object} - Merged placeholders object
   */
  mergePlaceholders(existingPath, newData) {
    let existing = {};

    if (fs.existsSync(existingPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
      } catch (err) {
        this.log(`Error parsing existing placeholders: ${err.message}`);
      }
    }

    const merged = { ...existing };

    // Update metadata
    merged._comment = newData._comment || existing._comment;
    merged._version = newData._version || existing._version;
    merged._generated = new Date().toISOString().split('T')[0];

    // Update specified keys (always overwrite with new values)
    for (const key of UPDATE_KEYS) {
      if (newData[key]) {
        if (existing[key] && typeof existing[key] === 'object') {
          // Merge objects, but prefer new values
          merged[key] = { ...existing[key], ...newData[key] };
        } else {
          merged[key] = newData[key];
        }
      }
    }

    // Preserve custom keys (don't overwrite if customized)
    for (const key of PRESERVE_KEYS) {
      if (existing[key] && !this.isPlaceholder(existing[key])) {
        merged[key] = existing[key];
      } else if (newData[key]) {
        merged[key] = newData[key];
      }
    }

    return merged;
  }

  /**
   * Plan all file operations without executing them
   * @param {Array} files - Array of {path, content, type} objects
   * @returns {object} - Plan with create, update, skip, backup arrays
   */
  planOperations(files) {
    const plan = {
      create: [],
      update: [],
      skip: [],
      backup: [],
      summary: {
        totalFiles: files.length,
        toCreate: 0,
        toUpdate: 0,
        toSkip: 0
      }
    };

    for (const file of files) {
      const filePath = path.isAbsolute(file.path)
        ? file.path
        : path.join(this.projectRoot, file.path);

      const fileInfo = {
        ...file,
        path: filePath,
        relativePath: path.relative(this.projectRoot, filePath)
      };

      if (!fs.existsSync(filePath)) {
        // File doesn't exist - will create
        plan.create.push(fileInfo);
        plan.summary.toCreate++;
      } else if (this.hasCustomMarker(filePath)) {
        // File has custom marker - skip
        plan.skip.push({
          ...fileInfo,
          reason: 'custom marker',
          message: 'Has # CUSTOM marker - preserving your changes'
        });
        plan.summary.toSkip++;
      } else {
        // File exists - check for changes
        const existingContent = fs.readFileSync(filePath, 'utf8');
        const oldHash = this.hashContent(existingContent);
        const newHash = this.hashContent(file.content);

        if (oldHash !== newHash) {
          // Content differs - will update
          const diff = this.generateDiff(existingContent, file.content);
          plan.update.push({
            ...fileInfo,
            oldHash,
            newHash,
            diff,
            diffPreview: this.formatDiff(diff)
          });
          plan.backup.push(filePath);
          plan.summary.toUpdate++;
        } else {
          // No changes needed
          plan.skip.push({
            ...fileInfo,
            reason: 'no changes',
            message: 'Content unchanged'
          });
          plan.summary.toSkip++;
        }
      }
    }

    return plan;
  }

  /**
   * Generate preview output for display
   * @param {object} plan - Plan from planOperations
   * @returns {string} - Formatted preview string
   */
  generatePreview(plan) {
    const lines = [];

    lines.push('╔══════════════════════════════════════════════════════════════════╗');
    lines.push('║                    FILE GENERATION PREVIEW                        ║');
    lines.push('╠══════════════════════════════════════════════════════════════════╣');

    // Files to create
    if (plan.create.length > 0) {
      lines.push('║                                                                   ║');
      lines.push('║ WILL CREATE (new files):                                         ║');
      lines.push('║ ─────────────────────────────────────────────────────────────────║');
      for (const file of plan.create) {
        const desc = file.description || '';
        lines.push(`║ + ${file.relativePath} ${desc}`.padEnd(68) + '║');
      }
    }

    // Files to update
    if (plan.update.length > 0) {
      lines.push('║                                                                   ║');
      lines.push('║ WILL UPDATE (changes detected):                                   ║');
      lines.push('║ ─────────────────────────────────────────────────────────────────║');
      for (const file of plan.update) {
        lines.push(`║ ~ ${file.relativePath}`.padEnd(68) + '║');
        // Show first few diff lines
        const diffLines = file.diffPreview.split('\n').slice(0, 4);
        for (const dl of diffLines) {
          lines.push(`║   ${dl}`.padEnd(68) + '║');
        }
        if (file.diff.length > 4) {
          lines.push(`║   [+${file.diff.length - 4} more changes]`.padEnd(68) + '║');
        }
      }
    }

    // Files to skip
    if (plan.skip.length > 0) {
      lines.push('║                                                                   ║');
      lines.push('║ WILL SKIP (preserving):                                           ║');
      lines.push('║ ─────────────────────────────────────────────────────────────────║');
      for (const file of plan.skip) {
        lines.push(`║ = ${file.relativePath} (${file.reason})`.padEnd(68) + '║');
      }
    }

    // Backup location
    if (plan.backup.length > 0) {
      const backupDir = this.backupDir || this.getNextBackupDir();
      lines.push('║                                                                   ║');
      lines.push('║ BACKUP LOCATION:                                                  ║');
      lines.push('║ ─────────────────────────────────────────────────────────────────║');
      lines.push(`║ ${path.relative(this.projectRoot, backupDir)}/`.padEnd(68) + '║');
    }

    lines.push('║                                                                   ║');
    lines.push('╚══════════════════════════════════════════════════════════════════╝');

    return lines.join('\n');
  }

  /**
   * Get the path for the next backup directory (without creating it)
   * @returns {string} - Path to backup directory
   */
  getNextBackupDir() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);

    return path.join(this.projectRoot, '.autopilot', 'backups', timestamp);
  }

  /**
   * Write backup manifest file
   * @param {object} plan - Execution plan
   */
  writeManifest(plan) {
    const manifest = {
      created: new Date().toISOString(),
      reason: 'SetupProject file generation',
      version: '1.0.0',
      files: plan.backup.map(filePath => ({
        path: path.relative(this.projectRoot, filePath),
        hash: this.hashFile(filePath)
      })),
      operations: {
        created: plan.create.map(f => f.relativePath),
        updated: plan.update.map(f => f.relativePath),
        skipped: plan.skip.map(f => f.relativePath)
      }
    };

    const manifestPath = path.join(this.backupDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    this.log(`Wrote manifest: ${manifestPath}`);
  }

  /**
   * Execute planned operations with backup
   * @param {object} plan - Plan from planOperations
   * @param {object} options - Execution options {skip: [], force: [], dryRun: boolean}
   * @returns {object} - Execution results
   */
  execute(plan, options = {}) {
    const results = {
      created: [],
      updated: [],
      skipped: [],
      forced: [],
      backupDir: null,
      errors: []
    };

    // Handle dry run
    if (options.dryRun) {
      return {
        ...results,
        dryRun: true,
        wouldCreate: plan.create.map(f => f.relativePath),
        wouldUpdate: plan.update.map(f => f.relativePath),
        wouldSkip: plan.skip.map(f => f.relativePath)
      };
    }

    // Create backups first
    if (plan.backup.length > 0) {
      this.createBackupDir();
      results.backupDir = this.backupDir;

      for (const filePath of plan.backup) {
        try {
          this.backupFile(filePath);
        } catch (err) {
          results.errors.push({ file: filePath, error: err.message, phase: 'backup' });
        }
      }

      this.writeManifest(plan);
    }

    // Create new files
    for (const file of plan.create) {
      if (options.skip?.includes(file.relativePath)) {
        results.skipped.push(file.relativePath);
        continue;
      }

      try {
        fs.mkdirSync(path.dirname(file.path), { recursive: true });
        fs.writeFileSync(file.path, file.content, 'utf8');
        results.created.push(file.relativePath);
        this.log(`Created: ${file.relativePath}`);
      } catch (err) {
        results.errors.push({ file: file.relativePath, error: err.message, phase: 'create' });
      }
    }

    // Update existing files
    for (const file of plan.update) {
      if (options.skip?.includes(file.relativePath)) {
        results.skipped.push(file.relativePath);
        continue;
      }

      try {
        fs.writeFileSync(file.path, file.content, 'utf8');
        results.updated.push(file.relativePath);
        this.log(`Updated: ${file.relativePath}`);
      } catch (err) {
        results.errors.push({ file: file.relativePath, error: err.message, phase: 'update' });
      }
    }

    // Handle forced files (override custom marker)
    for (const file of plan.skip) {
      if (options.force?.includes(file.relativePath)) {
        try {
          // Backup first
          this.backupFile(file.path);
          fs.writeFileSync(file.path, file.content, 'utf8');
          results.forced.push(file.relativePath);
          this.log(`Forced: ${file.relativePath}`);
        } catch (err) {
          results.errors.push({ file: file.relativePath, error: err.message, phase: 'force' });
        }
      } else {
        results.skipped.push(file.relativePath);
      }
    }

    return results;
  }

  /**
   * Restore files from a backup
   * @param {string} backupTimestamp - Backup directory name (timestamp)
   * @returns {object} - Restore results
   */
  restoreFromBackup(backupTimestamp) {
    const backupDir = path.join(this.projectRoot, '.autopilot', 'backups', backupTimestamp);

    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup not found: ${backupTimestamp}`);
    }

    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Backup manifest not found: ${manifestPath}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const results = { restored: [], errors: [] };

    for (const fileInfo of manifest.files) {
      const backupPath = path.join(backupDir, fileInfo.path);
      const targetPath = path.join(this.projectRoot, fileInfo.path);

      try {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.copyFileSync(backupPath, targetPath);
        results.restored.push(fileInfo.path);
        this.log(`Restored: ${fileInfo.path}`);
      } catch (err) {
        results.errors.push({ file: fileInfo.path, error: err.message });
      }
    }

    return results;
  }

  /**
   * List available backups
   * @returns {Array} - Array of backup info objects
   */
  listBackups() {
    const backupsDir = path.join(this.projectRoot, '.autopilot', 'backups');

    if (!fs.existsSync(backupsDir)) {
      return [];
    }

    const backups = [];
    const entries = fs.readdirSync(backupsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = path.join(backupsDir, entry.name, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            backups.push({
              name: entry.name,
              created: manifest.created,
              reason: manifest.reason,
              fileCount: manifest.files.length
            });
          } catch (err) {
            backups.push({
              name: entry.name,
              error: 'Could not read manifest'
            });
          }
        }
      }
    }

    return backups.sort((a, b) => b.name.localeCompare(a.name));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const generator = new FileGenerator(process.cwd());
  generator.setVerbose(args.includes('--verbose') || args.includes('-v'));

  switch (command) {
    case 'list-backups':
      const backups = generator.listBackups();
      if (backups.length === 0) {
        console.log('No backups found.');
      } else {
        console.log('Available backups:');
        for (const backup of backups) {
          console.log(`  ${backup.name} - ${backup.fileCount} files (${backup.created})`);
        }
      }
      break;

    case 'restore':
      const timestamp = args[1];
      if (!timestamp) {
        console.error('Usage: file-generator.js restore <timestamp>');
        process.exit(1);
      }
      try {
        const results = generator.restoreFromBackup(timestamp);
        console.log(`Restored ${results.restored.length} files from ${timestamp}`);
        if (results.errors.length > 0) {
          console.error(`Errors: ${results.errors.length}`);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
      break;

    case 'help':
    default:
      console.log(`
File Generator - Safe file generation with backup

Commands:
  list-backups          List available backups
  restore <timestamp>   Restore files from a backup

Options:
  --verbose, -v         Enable verbose output

This module is primarily used programmatically by SetupProject.
      `);
  }
}

module.exports = { FileGenerator, CUSTOM_MARKERS, PRESERVE_KEYS, UPDATE_KEYS };
