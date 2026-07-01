'use strict';
const bcrypt         = require('bcrypt');
const crypto         = require('crypto');
const userModel      = require('../models/userModel');
const cartModel      = require('../models/cartModel');
const generateSlug   = require('../utils/generateSlug');

const SALT_ROUNDS = 12;

const authService = {
    async register({ firstName, lastName, email, password }) {
        const existing = await userModel.findByEmail(email);
        if (existing) {
            const err = new Error('An account with this email already exists.');
            err.status = 409;
            throw err;
        }

        const passwordHash     = await bcrypt.hash(password, SALT_ROUNDS);
        const emailVerifyToken = crypto.randomBytes(32).toString('hex');
        const referralCode     = crypto.randomBytes(4).toString('hex').toUpperCase();

        const user = await userModel.create({
            firstName, lastName, email, passwordHash,
            emailVerifyToken, referralCode,
        });

        return { user, emailVerifyToken };
    },

    async login(email, password, ip) {
        const user = await userModel.findByEmail(email);
        if (!user) return { error: 'Invalid email or password.' };

        if (!user.is_active) return { error: 'This account has been suspended.' };

        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const mins = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
            return { error: `Account locked. Try again in ${mins} minute(s).` };
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            const attempts = await userModel.incrementFailedLogin(user.id);
            if (attempts >= 5) {
                await userModel.lockAccount(user.id, 30);
                return { error: 'Too many failed attempts. Account locked for 30 minutes.' };
            }
            return { error: 'Invalid email or password.' };
        }

        await userModel.updateLastLogin(user.id, ip);
        return { user };
    },

    async verifyEmail(token) {
        return userModel.verifyEmail(token);
    },

    async forgotPassword(email) {
        const user = await userModel.findByEmail(email);
        if (!user) return null; // Prevent enumeration — always succeed

        const rawToken  = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(rawToken, 10);

        const { pool } = require('../config/database');
        // Invalidate old tokens
        await pool.query('UPDATE password_reset_tokens SET used=TRUE WHERE user_id=$1', [user.id]);
        // Insert new
        await pool.query(
            `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
             VALUES ($1,$2, NOW() + INTERVAL '1 hour')`,
            [user.id, tokenHash]
        );

        return { user, rawToken };
    },

    async resetPassword(userId, rawToken, newPassword) {
        const { pool } = require('../config/database');
        const { rows } = await pool.query(
            `SELECT * FROM password_reset_tokens
             WHERE user_id=$1 AND used=FALSE AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        if (!rows[0]) return false;

        const valid = await bcrypt.compare(rawToken, rows[0].token_hash);
        if (!valid) return false;

        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await userModel.updatePassword(userId, passwordHash);
        await pool.query('UPDATE password_reset_tokens SET used=TRUE WHERE user_id=$1', [userId]);
        return true;
    },

    async changePassword(userId, currentPassword, newPassword) {
        const user = await userModel.findById(userId);
        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) return false;
        const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await userModel.updatePassword(userId, hash);
        return true;
    },

    buildSessionUser(user) {
        return {
            id:         user.id,
            uuid:       user.uuid,
            firstName:  user.first_name,
            lastName:   user.last_name,
            email:      user.email,
            role:       user.role,
            avatarUrl:  user.avatar_url,
            loyaltyTier: user.loyalty_tier,
        };
    },
};

module.exports = authService;
