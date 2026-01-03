#!/usr/bin/env node

/**
 * generate-secrets.js
 *
 * Generates cryptographically secure secrets for environment variables.
 * Outputs in format ready for .env file.
 *
 * Usage:
 *   node generate-secrets.js                    # Generate all common secrets
 *   node generate-secrets.js --type=jwt         # Generate specific secret
 *   node generate-secrets.js --env              # Output as .env format
 *   node generate-secrets.js --json             # Output as JSON
 *
 * @version 1.0.0
 * @author [Sentinal] (Security)
 */

const crypto = require('crypto');

// Parse arguments
const args = process.argv.slice(2);
const options = {
    type: null,
    format: 'env', // env, json, or raw
    all: true
};

args.forEach(arg => {
    if (arg.startsWith('--type=')) {
        options.type = arg.split('=')[1].toLowerCase();
        options.all = false;
    }
    if (arg === '--json') {
        options.format = 'json';
    }
    if (arg === '--env') {
        options.format = 'env';
    }
    if (arg === '--raw') {
        options.format = 'raw';
    }
});

// Secret specifications
const SECRET_SPECS = {
    jwt_secret: {
        name: 'JWT_SECRET',
        description: 'Secret for signing JWT tokens',
        length: 64,
        encoding: 'base64'
    },
    session_secret: {
        name: 'SESSION_SECRET',
        description: 'Secret for session encryption',
        length: 32,
        encoding: 'base64'
    },
    encryption_key: {
        name: 'ENCRYPTION_KEY',
        description: 'AES-256 encryption key',
        length: 32,
        encoding: 'hex'
    },
    nextauth_secret: {
        name: 'NEXTAUTH_SECRET',
        description: 'NextAuth.js secret',
        length: 32,
        encoding: 'base64'
    },
    csrf_secret: {
        name: 'CSRF_SECRET',
        description: 'CSRF token secret',
        length: 32,
        encoding: 'base64'
    },
    api_key: {
        name: 'API_KEY',
        description: 'Internal API key',
        length: 32,
        encoding: 'hex'
    },
    webhook_secret: {
        name: 'WEBHOOK_SECRET',
        description: 'Webhook signature secret',
        length: 32,
        encoding: 'hex'
    },
    cookie_secret: {
        name: 'COOKIE_SECRET',
        description: 'Cookie encryption secret',
        length: 32,
        encoding: 'base64'
    }
};

/**
 * Generate a cryptographically secure secret
 */
function generateSecret(spec) {
    const bytes = crypto.randomBytes(spec.length);

    switch (spec.encoding) {
        case 'base64':
            return bytes.toString('base64');
        case 'hex':
            return bytes.toString('hex');
        case 'base64url':
            return bytes.toString('base64url');
        default:
            return bytes.toString('base64');
    }
}

/**
 * Main function
 */
function main() {
    const secrets = {};

    if (options.type) {
        // Generate specific secret
        const spec = SECRET_SPECS[options.type];
        if (!spec) {
            console.error(`Unknown secret type: ${options.type}`);
            console.error(`Available types: ${Object.keys(SECRET_SPECS).join(', ')}`);
            process.exit(1);
        }

        const value = generateSecret(spec);
        secrets[spec.name] = value;
    } else {
        // Generate all common secrets
        const commonSecrets = ['jwt_secret', 'session_secret', 'encryption_key', 'nextauth_secret'];

        for (const type of commonSecrets) {
            const spec = SECRET_SPECS[type];
            secrets[spec.name] = generateSecret(spec);
        }
    }

    // Output based on format
    switch (options.format) {
        case 'json':
            console.log(JSON.stringify(secrets, null, 2));
            break;

        case 'raw':
            Object.values(secrets).forEach(v => console.log(v));
            break;

        case 'env':
        default:
            console.log('# Generated Secrets');
            console.log('# Generated at:', new Date().toISOString());
            console.log('# DO NOT COMMIT TO VERSION CONTROL');
            console.log('');

            for (const [name, value] of Object.entries(secrets)) {
                const spec = Object.values(SECRET_SPECS).find(s => s.name === name);
                if (spec) {
                    console.log(`# ${spec.description}`);
                }
                console.log(`${name}="${value}"`);
                console.log('');
            }
            break;
    }
}

// Run
main();
