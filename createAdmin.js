'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('./config/database');

async function createAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@yourstore.com';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 12);

    // Check if user exists
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length > 0) {
        // Update to owner and set password
        await pool.query('UPDATE users SET role = $1, password_hash = $2 WHERE email = $3', ['owner', passwordHash, email]);
        console.log(`Updated existing user ${email} to owner role with new password.`);
    } else {
        // Insert new user
        const emailVerifyToken = crypto.randomBytes(32).toString('hex');
        await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, role, email_verified, email_verify_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            ['Admin', 'User', email, passwordHash, 'owner', true, emailVerifyToken]
        );
        console.log(`Created new admin user ${email} with owner role.`);
    }

    await pool.end();
}

createAdmin().catch(console.error);