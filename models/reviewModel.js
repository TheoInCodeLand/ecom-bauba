'use strict';
const { pool } = require('../config/database');

const reviewModel = {
    async getForProduct(productId, { limit=10, offset=0 } = {}) {
        const { rows } = await pool.query(
            `SELECT r.*, u.first_name, u.last_name, u.avatar_url
             FROM reviews r JOIN users u ON u.id=r.user_id
             WHERE r.product_id=$1 AND r.status='approved'
             ORDER BY r.is_verified_purchase DESC, r.helpful_yes DESC, r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [productId, limit, offset]
        );
        return rows;
    },

    async create(data) {
        const { productId, userId, orderId, rating, title, body, isVerifiedPurchase } = data;
        const { rows } = await pool.query(
            `INSERT INTO reviews (product_id,user_id,order_id,rating,title,body,is_verified_purchase)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (product_id, user_id) DO UPDATE SET rating=$4,title=$5,body=$6,updated_at=NOW()
             RETURNING *`,
            [productId, userId, orderId||null, rating, title||null, body||null, !!isVerifiedPurchase]
        );
        return rows[0];
    },

    async updateProductRating(productId) {
        await pool.query(
            `UPDATE products SET
             average_rating = (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE product_id=$1 AND status='approved'),
             review_count   = (SELECT COUNT(*)::int FROM reviews WHERE product_id=$1 AND status='approved')
             WHERE id=$1`,
            [productId]
        );
    },

    async getHighlights(limit = 6) {
        const { rows } = await pool.query(
            `SELECT r.rating, r.title, r.body, u.first_name, p.name AS product_name, p.slug AS product_slug
             FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id
             WHERE r.status='approved' AND r.rating=5 AND r.body IS NOT NULL
             ORDER BY r.helpful_yes DESC, r.created_at DESC
             LIMIT $1`,
            [limit]
        );
        return rows;
    },

    async getRatingDistribution(productId) {
        const { rows } = await pool.query(
            `SELECT rating, COUNT(*)::int AS count FROM reviews
             WHERE product_id=$1 AND status='approved'
             GROUP BY rating ORDER BY rating DESC`,
            [productId]
        );
        return rows;
    },

    async adminList({ status='pending', limit=20, offset=0 }) {
        const { rows } = await pool.query(
            `SELECT r.*, u.first_name, u.last_name, u.email, p.name AS product_name
             FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id
             WHERE r.status=$1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
            [status, limit, offset]
        );
        return rows;
    },

    async updateStatus(id, status) {
        const { rows } = await pool.query(
            `UPDATE reviews SET status=$2, moderated_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING product_id`,
            [id, status]
        );
        if (rows[0]) await this.updateProductRating(rows[0].product_id);
    },
};

module.exports = reviewModel;
