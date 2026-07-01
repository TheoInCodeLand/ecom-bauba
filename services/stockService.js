'use strict';
const { pool }   = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const stockService = {
    /**
     * Get available stock = physical stock - active holds (excluding current user's holds)
     */
    async getAvailable(variantId, excludeUserId = null, excludeSessionId = null) {
        const { rows } = await pool.query(
            `SELECT pv.stock_quantity -
                COALESCE((
                    SELECT SUM(sr.quantity) FROM stock_reservations sr
                    WHERE sr.variant_id = $1 AND sr.status='held' AND sr.expires_at > NOW()
                    AND ($2::int IS NULL OR sr.user_id != $2)
                    AND ($3::text IS NULL OR sr.session_id != $3)
                ),0) AS available_quantity,
                pv.stock_quantity, pv.allow_backorder, pv.low_stock_threshold
             FROM product_variants pv WHERE pv.id=$1`,
            [variantId, excludeUserId||null, excludeSessionId||null]
        );
        return rows[0];
    },

    /**
     * Reserve stock for all cart items during checkout
     */
    async reserve(items, userId, sessionId, client = pool) {
        const results = [];
        for (const item of items) {
            const token  = uuidv4();
            const expiry = new Date(Date.now() + (parseInt(process.env.STOCK_RESERVATION_MINUTES)||15) * 60000);

            // Check availability with a lock
            const { rows: checkRows } = await client.query(
                `SELECT pv.stock_quantity -
                    COALESCE((SELECT SUM(sr.quantity) FROM stock_reservations sr
                              WHERE sr.variant_id=$1 AND sr.status='held' AND sr.expires_at>NOW()
                              AND ($2::int IS NULL OR sr.user_id!=$2)), 0) AS avail,
                    pv.allow_backorder
                 FROM product_variants pv WHERE pv.id=$1 FOR UPDATE`,
                [item.variant_id, userId||null]
            );

            const avail = parseInt(checkRows[0]?.avail || 0);
            if (!checkRows[0]?.allow_backorder && avail < item.quantity) {
                const err = new Error(`Insufficient stock for item: ${item.product_name}. Only ${avail} left.`);
                err.type = 'StockError';
                throw err;
            }

            await client.query(
                `INSERT INTO stock_reservations (variant_id,user_id,session_id,quantity,reservation_token,expires_at)
                 VALUES ($1,$2,$3,$4,$5,$6)`,
                [item.variant_id, userId||null, sessionId||null, item.quantity, token, expiry]
            );
            results.push({ variantId: item.variant_id, token, quantity: item.quantity });
        }
        return results;
    },

    async linkToOrder(orderId, userId, sessionId, client = pool) {
        await client.query(
            `UPDATE stock_reservations SET order_id=$1
             WHERE order_id IS NULL AND status='held'
             AND (user_id=$2 OR session_id=$3)`,
            [orderId, userId||null, sessionId||null]
        );
    },

    async confirmReservations(orderId, client = pool) {
        const { rows } = await client.query(
            `UPDATE stock_reservations SET status='confirmed', updated_at=NOW()
             WHERE order_id=$1 AND status='held'
             RETURNING variant_id, quantity`,
            [orderId]
        );
        // Decrement stock
        for (const r of rows) {
            await client.query(
                'UPDATE product_variants SET stock_quantity=GREATEST(0,stock_quantity-$2),updated_at=NOW() WHERE id=$1',
                [r.variant_id, r.quantity]
            );
        }
    },

    async releaseForOrder(orderId) {
        await pool.query(
            `UPDATE stock_reservations SET status='released', updated_at=NOW()
             WHERE order_id=$1 AND status='held'`,
            [orderId]
        );
    },

    async expireStale() {
        const { rows } = await pool.query(
            `UPDATE stock_reservations SET status='expired', updated_at=NOW()
             WHERE status='held' AND expires_at < NOW()
             RETURNING id`
        );
        return rows.length;
    },
};

module.exports = stockService;
