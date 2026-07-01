'use strict';
const { pool } = require('../config/database');

const cartModel = {
    async getItems(userId, sessionId) {
        const { rows } = await pool.query(
            `SELECT ci.id, ci.quantity, ci.variant_id,
                    pv.sku, COALESCE(pv.price_override, p.base_price) AS unit_price,
                    pv.stock_quantity, pv.image_url AS variant_image,
                    p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
                    pi.url AS primary_image,
                    json_agg(json_build_object('type',va.attribute_type,'value',va.attribute_value) ORDER BY va.position) AS attributes
             FROM cart_items ci
             JOIN product_variants pv ON pv.id=ci.variant_id
             JOIN products p ON p.id=pv.product_id
             LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
             LEFT JOIN variant_attributes va ON va.variant_id=pv.id
             WHERE ${userId ? 'ci.user_id=$1' : 'ci.session_id=$1'}
               AND p.is_active=TRUE AND pv.is_active=TRUE
             GROUP BY ci.id, pv.id, p.id, pi.url
             ORDER BY ci.added_at ASC`,
            [userId || sessionId]
        );
        return rows;
    },

    async getCount(userId, sessionId) {
        if (!userId && !sessionId) return 0;
        const field = userId ? 'user_id' : 'session_id';
        const { rows } = await pool.query(
            `SELECT COALESCE(SUM(quantity),0)::int AS cnt FROM cart_items WHERE ${field}=$1`,
            [userId || sessionId]
        );
        return rows[0]?.cnt || 0;
    },

    async upsert(userId, sessionId, variantId, quantity) {
        if (userId) {
            await pool.query(
                `INSERT INTO cart_items (user_id, variant_id, quantity)
                 VALUES ($1,$2,$3)
                 ON CONFLICT (user_id, variant_id) WHERE user_id IS NOT NULL
                 DO UPDATE SET quantity=cart_items.quantity+$3, updated_at=NOW()`,
                [userId, variantId, quantity]
            );
        } else {
            await pool.query(
                `INSERT INTO cart_items (session_id, variant_id, quantity)
                 VALUES ($1,$2,$3)
                 ON CONFLICT (session_id, variant_id) WHERE session_id IS NOT NULL
                 DO UPDATE SET quantity=cart_items.quantity+$3, updated_at=NOW()`,
                [sessionId, variantId, quantity]
            );
        }
    },

    async updateQuantity(userId, sessionId, variantId, quantity) {
        const field = userId ? 'user_id' : 'session_id';
        if (quantity <= 0) {
            await pool.query(
                `DELETE FROM cart_items WHERE ${field}=$1 AND variant_id=$2`,
                [userId || sessionId, variantId]
            );
        } else {
            await pool.query(
                `UPDATE cart_items SET quantity=$3, updated_at=NOW() WHERE ${field}=$1 AND variant_id=$2`,
                [userId || sessionId, variantId, quantity]
            );
        }
    },

    async removeItem(userId, sessionId, variantId) {
        const field = userId ? 'user_id' : 'session_id';
        await pool.query(
            `DELETE FROM cart_items WHERE ${field}=$1 AND variant_id=$2`,
            [userId || sessionId, variantId]
        );
    },

    async clearByUser(userId, client = pool) {
        await client.query('DELETE FROM cart_items WHERE user_id=$1', [userId]);
    },

    async clearBySession(sessionId) {
        await pool.query('DELETE FROM cart_items WHERE session_id=$1', [sessionId]);
    },

    async mergeGuestCart(userId, sessionId) {
        if (!sessionId) return;
        // Get guest items
        const { rows: guestItems } = await pool.query(
            'SELECT variant_id, quantity FROM cart_items WHERE session_id=$1', [sessionId]
        );
        for (const item of guestItems) {
            await pool.query(
                `INSERT INTO cart_items (user_id, variant_id, quantity)
                 VALUES ($1,$2,$3)
                 ON CONFLICT (user_id, variant_id) DO UPDATE SET quantity = LEAST(cart_items.quantity+$3, 99), updated_at=NOW()`,
                [userId, item.variant_id, item.quantity]
            );
        }
        await this.clearBySession(sessionId);
    },
};

module.exports = cartModel;
