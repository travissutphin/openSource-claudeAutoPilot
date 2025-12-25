#!/usr/bin/env node

/**
 * populate-env.js
 *
 * Populates .env file with provided values.
 * Preserves existing values, adds new ones, updates specified ones.
 *
 * Usage:
 *   node populate-env.js --set DATABASE_URL="postgresql://..." --set JWT_SECRET="xxx"
 *   node populate-env.js --from-json='{"DATABASE_URL": "..."}'
 *   node populate-env.js --generate-secrets
 *   node populate-env.js --template=.env.example
 *
 * @version 1.0.0
 * @author [Flow] (DevOps)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse arguments
const args = process.argv.slice(2);
const options = {
    envFile: '.env',
    template: null,
    values: {},
    generateSecrets: false,
    backup: true,
    verbose: args.includes('--verbose')
};

args.forEach(arg => {
    if (arg.startsWith('--set=') || arg.startsWith('--set ')) {
        // Parse --set KEY=VALUE or --set KEY="VALUE"
        const setArg = arg.replace('--set=', '').replace('--set ', '');
        const eqIndex = setArg.indexOf('=');
        if (eqIndex > 0) {
            const key = setArg.slice(0, eqIndex);
            let value = setArg.slice(eqIndex + 1);
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            options.values[key] = value;
        }
    }
    if (arg.startsWith('--from-json=')) {
        const json = arg.replace('--from-json=', '');
        try {
            const parsed = JSON.parse(json);
            Object.assign(options.values, parsed);
        } catch (e) {
            console.error('Invalid JSON:', e.message);
        }
    }
    if (arg.startsWith('--file=')) {
        options.envFile = arg.split('=')[1];
    }
    if (arg.startsWith('--template=')) {
        options.template = arg.split('=')[1];
    }
    if (arg === '--generate-secrets') {
        options.generateSecrets = true;
    }
    if (arg === '--no-backup') {
        options.backup = false;
    }
});

/**
 * Parse an env file into key-value pairs
 */
function parseEnvFile(content) {
    const env = {};
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        // Parse KEY=VALUE
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
            const key = trimmed.slice(0, eqIndex);
            let value = trimmed.slice(eqIndex + 1);

            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            env[key] = value;
        }
    }

    return env;
}

/**
 * Generate a cryptographically secure secret
 */
function generateSecret(length = 32, encoding = 'base64') {
    return crypto.randomBytes(length).toString(encoding);
}

/**
 * Main function
 */
function main() {
    console.log('========================================');
    console.log('Environment File Populator');
    console.log('========================================');
    console.log(`Target: ${options.envFile}`);
    console.log('');

    // Start with template if specified
    let existingEnv = {};

    if (options.template && fs.existsSync(options.template)) {
        console.log(`Using template: ${options.template}`);
        const templateContent = fs.readFileSync(options.template, 'utf8');
        existingEnv = parseEnvFile(templateContent);
    }

    // Load existing .env if present
    if (fs.existsSync(options.envFile)) {
        console.log(`Loading existing: ${options.envFile}`);

        // Backup existing
        if (options.backup) {
            const backupPath = `${options.envFile}.backup.${Date.now()}`;
            fs.copyFileSync(options.envFile, backupPath);
            console.log(`Backup created: ${backupPath}`);
        }

        const existingContent = fs.readFileSync(options.envFile, 'utf8');
        const existing = parseEnvFile(existingContent);

        // Merge, keeping existing values
        existingEnv = { ...existingEnv, ...existing };
    }

    // Generate secrets if requested
    if (options.generateSecrets) {
        console.log('Generating secrets...');

        const secretKeys = {
            'JWT_SECRET': () => generateSecret(48, 'base64'),
            'SESSION_SECRET': () => generateSecret(32, 'base64'),
            'ENCRYPTION_KEY': () => generateSecret(32, 'hex'),
            'NEXTAUTH_SECRET': () => generateSecret(32, 'base64'),
            'CSRF_SECRET': () => generateSecret(24, 'base64')
        };

        for (const [key, generator] of Object.entries(secretKeys)) {
            // Only generate if not already set or is placeholder
            if (!existingEnv[key] ||
                existingEnv[key].startsWith('#') ||
                existingEnv[key].startsWith('[') ||
                existingEnv[key] === '') {
                options.values[key] = generator();
                console.log(`  Generated: ${key}`);
            } else {
                console.log(`  Keeping existing: ${key}`);
            }
        }
    }

    // Merge new values
    const finalEnv = { ...existingEnv, ...options.values };

    // Build output
    let output = '';
    output += '# Environment Configuration\n';
    output += `# Updated: ${new Date().toISOString()}\n`;
    output += '# DO NOT COMMIT THIS FILE TO VERSION CONTROL\n';
    output += '\n';

    // Group by category
    const categories = {
        'App': ['NODE_ENV', 'APP_URL', 'APP_NAME', 'PORT'],
        'Database': ['DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
        'Authentication': ['JWT_SECRET', 'SESSION_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
        'Security': ['ENCRYPTION_KEY', 'CSRF_SECRET', 'COOKIE_SECRET'],
        'Email': ['RESEND_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'],
        'Storage': ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'AWS_S3_BUCKET'],
        'External APIs': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'ANALYTICS_ID', 'SENTRY_DSN']
    };

    const usedKeys = new Set();

    for (const [category, keys] of Object.entries(categories)) {
        const categoryVars = keys.filter(k => finalEnv[k] !== undefined);

        if (categoryVars.length > 0) {
            output += `# ${category}\n`;

            for (const key of categoryVars) {
                const value = finalEnv[key];
                output += `${key}="${value}"\n`;
                usedKeys.add(key);
            }

            output += '\n';
        }
    }

    // Add any remaining keys not in categories
    const remainingKeys = Object.keys(finalEnv).filter(k => !usedKeys.has(k));
    if (remainingKeys.length > 0) {
        output += '# Other\n';
        for (const key of remainingKeys) {
            output += `${key}="${finalEnv[key]}"\n`;
        }
        output += '\n';
    }

    // Write file
    fs.writeFileSync(options.envFile, output);

    console.log('');
    console.log('========================================');
    console.log('.ENV FILE UPDATED');
    console.log('========================================');
    console.log('');

    // Summary
    const setCount = Object.keys(options.values).length;
    const totalCount = Object.keys(finalEnv).length;

    console.log(`Variables set: ${setCount}`);
    console.log(`Total variables: ${totalCount}`);
    console.log('');

    // Show what was set
    if (options.verbose && setCount > 0) {
        console.log('Values set:');
        for (const key of Object.keys(options.values)) {
            // Mask sensitive values
            const value = options.values[key];
            const masked = value.length > 8 ? value.slice(0, 4) + '...' + value.slice(-4) : '****';
            console.log(`  ${key}=${masked}`);
        }
        console.log('');
    }

    // Check for placeholders still needing values
    const placeholders = Object.entries(finalEnv)
        .filter(([k, v]) => v.startsWith('#') || v.startsWith('[') || v === '')
        .map(([k]) => k);

    if (placeholders.length > 0) {
        console.log('Still need values:');
        for (const key of placeholders) {
            console.log(`  - ${key}`);
        }
        console.log('');
    }

    console.log(`File written: ${options.envFile}`);
}

// Run
main();
