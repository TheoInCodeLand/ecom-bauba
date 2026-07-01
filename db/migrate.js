'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`Running ${files.length} migration(s)...`);

    for (const file of files) {
        const filepath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filepath, 'utf8');
        try {
            await pool.query(sql);
            console.log(`  ✓ ${file}`);
        } catch (err) {
            console.error(`  ✗ ${file}: ${err.message}`);
            throw err;
        }
    }

    console.log('All migrations complete.');
    await pool.end();
}

runMigrations().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
