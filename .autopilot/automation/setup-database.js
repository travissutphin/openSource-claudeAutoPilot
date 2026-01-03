#!/usr/bin/env node

/**
 * setup-database.js
 *
 * Provisions a database based on selected provider.
 * Returns connection string for .env file.
 *
 * Usage:
 *   node setup-database.js --provider=supabase --name=myproject
 *   node setup-database.js --provider=docker --name=myproject
 *   node setup-database.js --provider=local --name=myproject
 *   node setup-database.js --provider=sqlite --name=myproject
 *   node setup-database.js --provider=neon --name=myproject
 *
 * @version 1.0.0
 * @author [Flow] (DevOps)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse arguments
const args = process.argv.slice(2);
const options = {
    provider: 'docker',
    name: 'myproject',
    verbose: args.includes('--verbose')
};

args.forEach(arg => {
    if (arg.startsWith('--provider=')) {
        options.provider = arg.split('=')[1].toLowerCase();
    }
    if (arg.startsWith('--name=')) {
        options.name = arg.split('=')[1].toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
});

const PROVIDERS = {
    supabase: {
        name: 'Supabase',
        type: 'cloud',
        cli: 'supabase',
        installCmd: 'npm install -g supabase',
        description: 'Cloud PostgreSQL with extras (Auth, Storage, Realtime)'
    },
    neon: {
        name: 'Neon',
        type: 'cloud',
        cli: 'neonctl',
        installCmd: 'npm install -g neonctl',
        description: 'Serverless PostgreSQL with branching'
    },
    docker: {
        name: 'Docker PostgreSQL',
        type: 'local',
        cli: 'docker',
        installCmd: null,
        description: 'Containerized PostgreSQL (requires Docker)'
    },
    local: {
        name: 'Local PostgreSQL',
        type: 'local',
        cli: 'psql',
        installCmd: null,
        description: 'Native PostgreSQL installation'
    },
    sqlite: {
        name: 'SQLite',
        type: 'file',
        cli: null,
        installCmd: null,
        description: 'File-based database (simplest)'
    }
};

/**
 * Main entry point
 */
async function main() {
    console.log('========================================');
    console.log('Database Setup');
    console.log('========================================');
    console.log(`Provider: ${PROVIDERS[options.provider]?.name || options.provider}`);
    console.log(`Project: ${options.name}`);
    console.log('');

    const provider = PROVIDERS[options.provider];
    if (!provider) {
        console.error(`Unknown provider: ${options.provider}`);
        console.error(`Available: ${Object.keys(PROVIDERS).join(', ')}`);
        process.exit(1);
    }

    let connectionString;

    try {
        switch (options.provider) {
            case 'supabase':
                connectionString = await setupSupabase();
                break;
            case 'neon':
                connectionString = await setupNeon();
                break;
            case 'docker':
                connectionString = await setupDocker();
                break;
            case 'local':
                connectionString = await setupLocal();
                break;
            case 'sqlite':
                connectionString = await setupSQLite();
                break;
        }

        console.log('');
        console.log('========================================');
        console.log('DATABASE READY');
        console.log('========================================');
        console.log('');
        console.log('Connection String:');
        console.log(connectionString);
        console.log('');
        console.log('Add to .env:');
        console.log(`DATABASE_URL="${connectionString}"`);
        console.log('');

        // Output just the connection string for piping
        if (!options.verbose) {
            process.stdout.write(`\nCONNECTION_STRING=${connectionString}\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('DATABASE SETUP FAILED');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

/**
 * Setup Supabase cloud database
 */
async function setupSupabase() {
    console.log('Setting up Supabase...');

    // Check CLI
    if (!commandExists('supabase')) {
        console.log('Installing Supabase CLI...');
        execSync('npm install -g supabase', { stdio: 'inherit' });
    }

    // Check if logged in
    try {
        execSync('supabase projects list', { stdio: 'pipe' });
    } catch {
        console.log('');
        console.log('Please log in to Supabase:');
        execSync('supabase login', { stdio: 'inherit' });
    }

    // Generate database password
    const dbPassword = generatePassword(16);

    // Create project
    console.log(`Creating Supabase project: ${options.name}...`);

    try {
        const output = execSync(
            `supabase projects create ${options.name} --db-password ${dbPassword} --region us-east-1`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );

        // Extract project ref from output
        const refMatch = output.match(/Project ref: (\w+)/);
        if (refMatch) {
            const projectRef = refMatch[1];

            // Get connection string
            const connString = execSync(
                `supabase db url --project-ref ${projectRef}`,
                { encoding: 'utf8' }
            ).trim();

            return connString;
        }
    } catch (error) {
        // If project exists, try to get existing connection
        console.log('Project may already exist, fetching connection...');

        const projects = execSync('supabase projects list --output json', { encoding: 'utf8' });
        const projectList = JSON.parse(projects);
        const project = projectList.find(p => p.name === options.name);

        if (project) {
            const connString = execSync(
                `supabase db url --project-ref ${project.id}`,
                { encoding: 'utf8' }
            ).trim();
            return connString;
        }

        throw error;
    }

    throw new Error('Could not get Supabase connection string');
}

/**
 * Setup Neon serverless database
 */
async function setupNeon() {
    console.log('Setting up Neon...');

    // Check CLI
    if (!commandExists('neonctl')) {
        console.log('Installing Neon CLI...');
        execSync('npm install -g neonctl', { stdio: 'inherit' });
    }

    // Check if logged in
    try {
        execSync('neonctl projects list', { stdio: 'pipe' });
    } catch {
        console.log('');
        console.log('Please log in to Neon:');
        execSync('neonctl auth', { stdio: 'inherit' });
    }

    // Create project
    console.log(`Creating Neon project: ${options.name}...`);

    try {
        const output = execSync(
            `neonctl projects create --name ${options.name} --output json`,
            { encoding: 'utf8' }
        );

        const project = JSON.parse(output);

        // Get connection string
        const connOutput = execSync(
            `neonctl connection-string --project-id ${project.id}`,
            { encoding: 'utf8' }
        ).trim();

        return connOutput;
    } catch (error) {
        // If project exists, try to get existing connection
        console.log('Project may already exist, fetching connection...');

        const projects = execSync('neonctl projects list --output json', { encoding: 'utf8' });
        const projectList = JSON.parse(projects);
        const project = projectList.find(p => p.name === options.name);

        if (project) {
            const connString = execSync(
                `neonctl connection-string --project-id ${project.id}`,
                { encoding: 'utf8' }
            ).trim();
            return connString;
        }

        throw error;
    }
}

/**
 * Setup Docker PostgreSQL
 */
async function setupDocker() {
    console.log('Setting up Docker PostgreSQL...');

    // Check Docker
    if (!commandExists('docker')) {
        throw new Error('Docker not installed. Please install Docker Desktop.');
    }

    // Check Docker running
    try {
        execSync('docker info', { stdio: 'pipe' });
    } catch {
        throw new Error('Docker not running. Please start Docker Desktop.');
    }

    const containerName = `${options.name}_postgres`;
    const dbName = `${options.name}_dev`;
    const password = 'postgres'; // Simple password for local dev

    // Check if container already exists
    try {
        const existing = execSync(`docker ps -a --filter name=${containerName} --format "{{.Names}}"`, { encoding: 'utf8' });

        if (existing.trim() === containerName) {
            console.log('Container already exists, starting...');
            execSync(`docker start ${containerName}`, { stdio: 'pipe' });
        } else {
            throw new Error('Create new');
        }
    } catch {
        // Create new container
        console.log('Creating PostgreSQL container...');

        execSync(`docker run -d \
            --name ${containerName} \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=${password} \
            -e POSTGRES_DB=${dbName} \
            -p 5432:5432 \
            postgres:15-alpine`, { stdio: 'inherit' });
    }

    // Wait for PostgreSQL to be ready
    console.log('Waiting for PostgreSQL to start...');
    let attempts = 0;
    while (attempts < 30) {
        try {
            execSync(`docker exec ${containerName} pg_isready -U postgres`, { stdio: 'pipe' });
            break;
        } catch {
            attempts++;
            await sleep(1000);
        }
    }

    if (attempts >= 30) {
        throw new Error('PostgreSQL failed to start');
    }

    console.log('PostgreSQL is ready!');

    return `postgresql://postgres:${password}@localhost:5432/${dbName}`;
}

/**
 * Setup Local PostgreSQL
 */
async function setupLocal() {
    console.log('Setting up Local PostgreSQL...');

    // Check PostgreSQL
    if (!commandExists('psql')) {
        throw new Error('PostgreSQL not installed. Please install PostgreSQL or use Docker option.');
    }

    // Check PostgreSQL running
    try {
        execSync('pg_isready', { stdio: 'pipe' });
    } catch {
        throw new Error('PostgreSQL not running. Please start PostgreSQL service.');
    }

    const dbName = `${options.name}_dev`;

    // Create database
    console.log(`Creating database: ${dbName}...`);

    try {
        execSync(`createdb ${dbName}`, { stdio: 'pipe' });
        console.log('Database created!');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('Database already exists');
        } else {
            throw error;
        }
    }

    // Test connection
    execSync(`psql -d ${dbName} -c "SELECT 1"`, { stdio: 'pipe' });

    return `postgresql://localhost:5432/${dbName}`;
}

/**
 * Setup SQLite
 */
async function setupSQLite() {
    console.log('Setting up SQLite...');

    // SQLite requires no setup - just return the connection string
    // Prisma will create the file automatically

    const dbPath = './prisma/dev.db';

    // Ensure prisma directory exists
    const prismaDir = path.dirname(dbPath);
    if (!fs.existsSync(prismaDir)) {
        fs.mkdirSync(prismaDir, { recursive: true });
    }

    console.log('SQLite configured!');
    console.log('Note: Database file will be created when you run migrations.');

    return `file:${dbPath}`;
}

/**
 * Check if a command exists
 */
function commandExists(cmd) {
    try {
        execSync(`${cmd} --version`, { stdio: 'pipe' });
        return true;
    } catch {
        try {
            execSync(`where ${cmd}`, { stdio: 'pipe' }); // Windows
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Generate a random password
 */
function generatePassword(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run main
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
