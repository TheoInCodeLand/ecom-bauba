'use strict';
const { pool } = require('../config/database');

const userModel = {
    async findByEmail(email) {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1 LIMIT 1', [email]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE id = $1 LIMIT 1', [id]
        );
        return rows[0] || null;
    },

    async findByUuid(uuid) {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE uuid = $1 LIMIT 1', [uuid]
        );
        return rows[0] || null;
    },

    async create({ firstName, lastName, email, passwordHash, role = 'customer', emailVerifyToken, referralCode }) {
        const { rows } = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, role, email_verify_token, email_verify_token_exp, referral_code)
             VALUES ($1,$2,$3,$4,$5,$6, NOW() + INTERVAL '24 hours', $7)
             RETURNING *`,
            [firstName, lastName, email, passwordHash, role, emailVerifyToken, referralCode || null]
        );
        return rows[0];
    },

    async updateLastLogin(id, ip) {
        await pool.query(
            `UPDATE users SET last_login_at=NOW(), last_login_ip=$2, last_seen_at=NOW(),
             failed_login_attempts=0, locked_until=NULL, updated_at=NOW()
             WHERE id=$1`,
            [id, ip]
        );
    },

    async incrementFailedLogin(id) {
        const { rows } = await pool.query(
            `UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at=NOW()
             WHERE id=$1 RETURNING failed_login_attempts`,
            [id]
        );
        return rows[0]?.failed_login_attempts || 0;
    },

    async lockAccount(id, minutes = 30) {
        await pool.query(
            `UPDATE users SET locked_until = NOW() + ($2 || ' minutes')::INTERVAL, updated_at=NOW()
             WHERE id=$1`,
            [id, minutes]
        );
    },

    async verifyEmail(token) {
        const { rows } = await pool.query(
            `UPDATE users SET email_verified=TRUE, email_verify_token=NULL, email_verify_token_exp=NULL, updated_at=NOW()
             WHERE email_verify_token=$1 AND email_verify_token_exp > NOW()
             RETURNING *`,
            [token]
        );
        return rows[0] || null;
    },

    async updatePassword(id, passwordHash) {
        await pool.query(
            'UPDATE users SET password_hash=$2, updated_at=NOW() WHERE id=$1',
            [id, passwordHash]
        );
    },

    async updateProfile(id, data) {
        const { firstName, lastName, phone, dateOfBirth, gender, newsletterOptIn } = data;
        await pool.query(
            `UPDATE users SET first_name=$2, last_name=$3, phone=$4, date_of_birth=$5,
             gender=$6, newsletter_opt_in=$7, updated_at=NOW() WHERE id=$1`,
            [id, firstName, lastName, phone || null, dateOfBirth || null, gender || null, !!newsletterOptIn]
        );
    },

    async updateAvatar(id, avatarUrl) {
        await pool.query('UPDATE users SET avatar_url=$2, updated_at=NOW() WHERE id=$1', [id, avatarUrl]);
    },

    async awardPoints(userId, points, client = pool) {
        await client.query(
            'UPDATE users SET loyalty_points = loyalty_points + $2, updated_at=NOW() WHERE id=$1',
            [userId, points]
        );
    },

    async updateTotalSpent(userId, amount, client = pool) {
        await client.query(
            `UPDATE users SET total_orders = total_orders + 1, total_spent = total_spent + $2,
             updated_at=NOW() WHERE id=$1`,
            [userId, amount]
        );
    },

    async findAll({ limit = 20, offset = 0, search = '' }) {
        let query = `SELECT id, uuid, first_name, last_name, email, role, loyalty_tier,
                     total_orders, total_spent, is_active, created_at
                     FROM users WHERE role != 'owner'`;
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
        }
        query += ` ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
        params.push(limit, offset);
        const { rows } = await pool.query(query, params);
        return rows;
    },

    async count(search = '') {
        let query = "SELECT COUNT(*)::int AS cnt FROM users WHERE role != 'owner'";
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)`;
        }
        const { rows } = await pool.query(query, params);
        return rows[0]?.cnt || 0;
    },

    async toggleActive(id, isActive) {
        await pool.query('UPDATE users SET is_active=$2, updated_at=NOW() WHERE id=$1', [id, isActive]);
    },

    // Addresses
    async getAddresses(userId) {
        const { rows } = await pool.query(
            'SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        return rows;
    },

    async addAddress(userId, data) {
        const { label, firstName, lastName, company, addressLine1, addressLine2,
                city, province, postalCode, country, phone, deliveryNotes, isDefault } = data;
        if (isDefault) {
            await pool.query('UPDATE addresses SET is_default=FALSE WHERE user_id=$1', [userId]);
        }
        const { rows } = await pool.query(
            `INSERT INTO addresses (user_id,label,first_name,last_name,company,address_line_1,address_line_2,
             city,province,postal_code,country,phone,delivery_notes,is_default)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
            [userId, label||'Home', firstName, lastName, company||null, addressLine1,
             addressLine2||null, city, province||null, postalCode||null, country||'South Africa',
             phone||null, deliveryNotes||null, !!isDefault]
        );
        return rows[0];
    },

    async updateAddress(id, userId, data) {
        const { label, firstName, lastName, company, addressLine1, addressLine2,
                city, province, postalCode, country, phone, deliveryNotes, isDefault } = data;
        if (isDefault) {
            await pool.query('UPDATE addresses SET is_default=FALSE WHERE user_id=$1', [userId]);
        }
        const { rows } = await pool.query(
            `UPDATE addresses SET label=$3,first_name=$4,last_name=$5,company=$6,
             address_line_1=$7,address_line_2=$8,city=$9,province=$10,postal_code=$11,
             country=$12,phone=$13,delivery_notes=$14,is_default=$15,updated_at=NOW()
             WHERE id=$1 AND user_id=$2 RETURNING *`,
            [id, userId, label||'Home', firstName, lastName, company||null, addressLine1,
             addressLine2||null, city, province||null, postalCode||null, country||'South Africa',
             phone||null, deliveryNotes||null, !!isDefault]
        );
        return rows[0];
    },

    async deleteAddress(id, userId) {
        await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [id, userId]);
    },

    async getAddressById(id, userId) {
        const { rows } = await pool.query(
            'SELECT * FROM addresses WHERE id=$1 AND user_id=$2', [id, userId]
        );
        return rows[0] || null;
    },
};

module.exports = userModel;
