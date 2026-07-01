'use strict';
const { pool } = require('../config/database');

const wishlistModel = {
    async toggle(userId, productId) {
        const { rows } = await pool.query(
            'SELECT id FROM wishlists WHERE user_id=$1 AND product_id=$2', [userId, productId]
        );
        if (rows[0]) {
            await pool.query('DELETE FROM wishlists WHERE user_id=$1 AND product_id=$2', [userId, productId]);
            await pool.query('UPDATE products SET wishlist_count=GREATEST(0,wishlist_count-1) WHERE id=$1', [productId]);
            return false;
        } else {
            await pool.query('INSERT INTO wishlists (user_id,product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, productId]);
            await pool.query('UPDATE products SET wishlist_count=wishlist_count+1 WHERE id=$1', [productId]);
            return true;
        }
    },

    async isWishlisted(userId, productId) {
        if (!userId) return false;
        const { rows } = await pool.query(
            'SELECT 1 FROM wishlists WHERE user_id=$1 AND product_id=$2', [userId, productId]
        );
        return !!rows[0];
    },

    async getWishlistIds(userId) {
        if (!userId) return [];
        const { rows } = await pool.query('SELECT product_id FROM wishlists WHERE user_id=$1', [userId]);
        return rows.map(r => r.product_id);
    },

    async getForUser(userId) {
        const { rows } = await pool.query(
            `SELECT w.added_at, p.id, p.name, p.slug, p.base_price, p.compare_at_price,
                    pi.url AS primary_image,
                    (SELECT pv.stock_quantity > 0 FROM product_variants pv WHERE pv.product_id=p.id AND pv.is_active=TRUE LIMIT 1) AS in_stock
             FROM wishlists w
             JOIN products p ON p.id=w.product_id
             LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
             WHERE w.user_id=$1 AND p.is_active=TRUE
             ORDER BY w.added_at DESC`,
            [userId]
        );
        return rows;
    },

    async count(userId) {
        const { rows } = await pool.query(
            'SELECT COUNT(*)::int AS cnt FROM wishlists WHERE user_id=$1', [userId]
        );
        return rows[0]?.cnt || 0;
    },
};

module.exports = wishlistModel;
