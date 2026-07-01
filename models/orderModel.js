'use strict';
const { pool } = require('../config/database');

const orderModel = {
    async generateOrderNumber() {
        const { rows } = await pool.query("SELECT LPAD((COUNT(*)+1)::text,6,'0') AS num FROM orders");
        return `ML-${new Date().getFullYear()}-${rows[0].num}`;
    },

    async create(data, client = pool) {
        const {
            userId, orderNumber, subtotal, shippingCost, discountAmount, vatAmount, totalAmount,
            discountCodeId, discountCode,
            shippingFirstName, shippingLastName, shippingCompany, shippingAddressLine1, shippingAddressLine2,
            shippingCity, shippingProvince, shippingPostalCode, shippingCountry, shippingPhone,
            customerNotes, idempotencyKey
        } = data;

        const { rows } = await client.query(
            `INSERT INTO orders (user_id,order_number,status,payment_status,
             subtotal,shipping_cost,discount_amount,vat_amount,total_amount,
             discount_code_id,discount_code,
             shipping_first_name,shipping_last_name,shipping_company,
             shipping_address_line_1,shipping_address_line_2,shipping_city,
             shipping_province,shipping_postal_code,shipping_country,shipping_phone,
             customer_notes,idempotency_key)
             VALUES ($1,$2,'payment_pending','unpaid',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
             RETURNING *`,
            [userId||null, orderNumber, subtotal, shippingCost||0, discountAmount||0, vatAmount||0, totalAmount,
             discountCodeId||null, discountCode||null,
             shippingFirstName, shippingLastName, shippingCompany||null,
             shippingAddressLine1, shippingAddressLine2||null, shippingCity,
             shippingProvince||null, shippingPostalCode||null, shippingCountry||'South Africa', shippingPhone||null,
             customerNotes||null, idempotencyKey]
        );
        return rows[0];
    },

    async createItems(orderId, items, client = pool) {
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id,product_id,variant_id,product_name,variant_description,sku,product_image_url,quantity,unit_price,total_price)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [orderId, item.product_id, item.variant_id, item.product_name,
                 item.variant_description||null, item.sku||null, item.product_image_url||null,
                 item.quantity, item.unit_price, item.unit_price * item.quantity]
            );
        }
    },

    async findByUuid(uuid) {
        const { rows } = await pool.query(
            `SELECT o.*, u.email AS user_email, u.first_name AS user_first_name
             FROM orders o LEFT JOIN users u ON u.id=o.user_id
             WHERE o.uuid=$1`,
            [uuid]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM orders WHERE id=$1', [id]);
        return rows[0] || null;
    },

    async getByPaymentRef(ref) {
        const { rows } = await pool.query(
            `SELECT o.*, u.email AS user_email FROM orders o
             LEFT JOIN users u ON u.id=o.user_id
             WHERE o.uuid=$1 OR o.payment_reference=$1`,
            [ref]
        );
        return rows[0] || null;
    },

    async getItems(orderId) {
        const { rows } = await pool.query(
            'SELECT * FROM order_items WHERE order_id=$1 ORDER BY id ASC',
            [orderId]
        );
        return rows;
    },

    async getStatusHistory(orderId) {
        const { rows } = await pool.query(
            `SELECT h.*, u.first_name FROM order_status_history h
             LEFT JOIN users u ON u.id=h.changed_by
             WHERE h.order_id=$1 ORDER BY h.created_at ASC`,
            [orderId]
        );
        return rows;
    },

    async addStatusHistory(orderId, status, note, changedBy = null, client = pool) {
        await client.query(
            'INSERT INTO order_status_history (order_id,status,note,changed_by) VALUES ($1,$2,$3,$4)',
            [orderId, status, note||null, changedBy||null]
        );
    },

    async updateStatus(id, status, extra = {}, client = pool) {
        const sets = ['status=$2', 'updated_at=NOW()'];
        const params = [id, status];
        if (extra.paidAt)       { params.push(extra.paidAt);      sets.push(`paid_at=$${params.length}`); }
        if (extra.pfPaymentId)  { params.push(extra.pfPaymentId); sets.push(`payfast_payment_id=$${params.length}`); }
        if (extra.paymentStatus){ params.push(extra.paymentStatus); sets.push(`payment_status=$${params.length}`); }
        if (extra.trackingNumber){ params.push(extra.trackingNumber); sets.push(`tracking_number=$${params.length}`); }
        if (extra.shippingCarrier){ params.push(extra.shippingCarrier); sets.push(`shipping_carrier=$${params.length}`); }
        if (extra.trackingUrl)  { params.push(extra.trackingUrl); sets.push(`tracking_url=$${params.length}`); }
        if (extra.shippedAt)    { params.push(extra.shippedAt);   sets.push(`shipped_at=$${params.length}`); }
        await client.query(`UPDATE orders SET ${sets.join(',')} WHERE id=$1`, params);
    },

    async getForUser(userId, { limit=10, offset=0 }) {
        const { rows } = await pool.query(
            `SELECT o.*, (SELECT COUNT(*)::int FROM order_items WHERE order_id=o.id) AS item_count
             FROM orders o WHERE o.user_id=$1
             ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return rows;
    },

    async countForUser(userId) {
        const { rows } = await pool.query(
            'SELECT COUNT(*)::int AS cnt FROM orders WHERE user_id=$1',
            [userId]
        );
        return rows[0]?.cnt || 0;
    },

    async adminList({ limit=20, offset=0, status=null, search='' }) {
        const params = [];
        let where = '1=1';
        if (status) { params.push(status); where += ` AND o.status=$${params.length}`; }
        if (search) { params.push(`%${search}%`); where += ` AND (o.order_number ILIKE $${params.length} OR u.email ILIKE $${params.length})`; }
        params.push(limit, offset);
        const { rows } = await pool.query(
            `SELECT o.*, u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name,
                    (SELECT COUNT(*)::int FROM order_items WHERE order_id=o.id) AS item_count
             FROM orders o LEFT JOIN users u ON u.id=o.user_id
             WHERE ${where}
             ORDER BY o.created_at DESC
             LIMIT $${params.length-1} OFFSET $${params.length}`,
            params
        );
        return rows;
    },

    async adminCount(status=null, search='') {
        const params = [];
        let where = '1=1';
        if (status) { params.push(status); where += ` AND o.status=$${params.length}`; }
        if (search) { params.push(`%${search}%`); where += ` AND (o.order_number ILIKE $${params.length})`; }
        const { rows } = await pool.query(
            `SELECT COUNT(*)::int AS cnt FROM orders o WHERE ${where}`, params
        );
        return rows[0]?.cnt || 0;
    },

    async getRecentStats() {
        const { rows } = await pool.query(`
            SELECT
                COUNT(*) AS total_orders,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today_count,
                COALESCE(SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE AND payment_status='paid'), 0) AS today_revenue,
                COUNT(*) FILTER (WHERE status IN ('pending','payment_pending')) AS pending_orders,
                COUNT(*) FILTER (WHERE status='processing') AS processing_count,
                COUNT(*) FILTER (WHERE status='shipped') AS shipped_count,
                COALESCE(SUM(total_amount) FILTER (WHERE payment_status='paid' AND created_at >= date_trunc('month', CURRENT_DATE)), 0) AS month_revenue
            FROM orders
        `);
        return rows[0];
    },
};

module.exports = orderModel;
