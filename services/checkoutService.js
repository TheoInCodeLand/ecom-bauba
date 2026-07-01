'use strict';
const { pool } = require('../config/database');
const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const stockService = require('./stockService');
const formatCurrency = require('../utils/formatCurrency');

const FREE_SHIPPING = parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 2500;
const BASE_SHIPPING = parseFloat(process.env.DEFAULT_SHIPPING_COST) || 150;
const VAT_RATE = 0.15;

const checkoutService = {
    /**
     * Calculate order totals.
     *
     * Prices are treated as VAT-inclusive (standard SA retail).
     * VAT is back-calculated from the taxable amount: vat = total * rate / (1 + rate).
     *
     * @param {Array}   items          - cart items with unit_price and quantity
     * @param {number}  discountAmount - rand value to deduct (0 for free_shipping type)
     * @param {boolean} freeShipping   - true when a free_shipping discount code is applied
     */
    calculateTotals(items, discountAmount = 0, freeShipping = false) {
        const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

        // Shipping is free above the threshold OR when a free_shipping code is applied.
        const shipping = (subtotal >= FREE_SHIPPING || freeShipping) ? 0 : BASE_SHIPPING;

        const discount = Math.min(discountAmount, subtotal);
        const taxable = subtotal - discount + shipping;
        const vat = parseFloat((taxable * VAT_RATE / (1 + VAT_RATE)).toFixed(2));
        const total = parseFloat((subtotal - discount + shipping).toFixed(2));

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            shippingCost: shipping,
            discountAmount: discount,
            vatAmount: vat,
            totalAmount: total,
        };
    },

    async createOrder({ userId, sessionId, cartItems, shippingAddress, discountCode, idempotencyKey }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // ── Idempotency check ─────────────────────────────────────────────────
            const { rows: existing } = await client.query(
                `SELECT * FROM idempotency_keys WHERE idempotency_key=$1 AND expires_at>NOW()`,
                [idempotencyKey]
            );
            if (existing[0]?.status === 'completed') {
                await client.query('ROLLBACK');
                return existing[0].response_body;
            }

            // Guard against concurrent requests on the same key: use INSERT and
            // check rowCount. If 0 rows were inserted, another request is already
            // processing this key — bail out rather than continuing in parallel.
            const { rowCount: inserted } = await client.query(
                `INSERT INTO idempotency_keys (idempotency_key, user_id, resource_type, status)
                 VALUES ($1,$2,'order','processing') ON CONFLICT (idempotency_key) DO NOTHING`,
                [idempotencyKey, userId || null]
            );
            if (inserted === 0) {
                // Another request is mid-flight with this key; treat as a duplicate.
                await client.query('ROLLBACK');
                throw Object.assign(new Error('Duplicate request — idempotency key is already processing.'), { code: 'IDEMPOTENCY_CONFLICT' });
            }

            // ── Reserve stock (throws StockError if unavailable) ──────────────────
            await stockService.reserve(cartItems, userId, sessionId, client);

            // ── Discount validation ───────────────────────────────────────────────
            let discountAmount = 0;
            let discountCodeId = null;
            let freeShipping = false;

            if (discountCode) {
                try {
                    const dc = await this.validateDiscount(discountCode, userId, cartItems);
                    discountAmount = dc.amount;
                    discountCodeId = dc.id;
                    freeShipping = dc.type === 'free_shipping';
                } catch (err) {
                    // The code may be invalid/expired; log it but don't hard-fail
                    // the order so the customer isn't blocked at checkout.
                    console.warn(`[checkoutService] Discount code "${discountCode}" failed at order creation:`, err.message);
                }
            }

            const totals = this.calculateTotals(cartItems, discountAmount, freeShipping);
            const orderNumber = await orderModel.generateOrderNumber();

            // ── Create order record ───────────────────────────────────────────────
            const order = await orderModel.create({
                userId, orderNumber, idempotencyKey,
                discountCodeId, discountCode: discountCode || null,
                ...totals, ...shippingAddress,
            }, client);

            await orderModel.createItems(order.id, cartItems, client);
            await stockService.linkToOrder(order.id, userId, sessionId, client);

            if (userId) await cartModel.clearByUser(userId, client);

            // ── Mark idempotency complete ─────────────────────────────────────────
            await client.query(
                `UPDATE idempotency_keys
                 SET status='completed', resource_id=$2, response_body=$3, updated_at=NOW()
                 WHERE idempotency_key=$1`,
                [idempotencyKey, order.id, JSON.stringify({ orderId: order.id, orderUuid: order.uuid })]
            );

            await client.query('COMMIT');
            return {
                orderId: order.id,
                orderUuid: order.uuid,
                orderNumber: order.order_number,
                ...totals,
            };

        } catch (err) {
            await client.query('ROLLBACK');
            // Don't clobber an IDEMPOTENCY_CONFLICT — that key was never set to
            // 'processing' by this request so we must not overwrite it.
            if (err.code !== 'IDEMPOTENCY_CONFLICT') {
                await pool.query(
                    `UPDATE idempotency_keys SET status='failed', updated_at=NOW() WHERE idempotency_key=$1`,
                    [idempotencyKey]
                ).catch(() => { });
            }
            throw err;
        } finally {
            client.release();
        }
    },

    async validateDiscount(code, userId, items) {
        const { rows } = await pool.query(
            `SELECT * FROM discount_codes WHERE code=UPPER($1) AND is_active=TRUE
             AND (starts_at IS NULL OR starts_at<=NOW())
             AND (expires_at IS NULL OR expires_at>NOW())
             AND (usage_limit IS NULL OR usage_count<usage_limit)`,
            [code]
        );
        if (!rows[0]) throw new Error('Invalid or expired discount code.');

        const dc = rows[0];
        const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

        if (dc.minimum_order_value && subtotal < dc.minimum_order_value) {
            throw new Error(`Minimum order value for this code is ${formatCurrency(dc.minimum_order_value)}`);
        }

        let amount = 0;
        if (dc.type === 'percentage') amount = subtotal * (dc.value / 100);
        else if (dc.type === 'fixed') amount = dc.value;
        // free_shipping: amount stays 0; the caller checks dc.type to zero out shipping

        if (dc.maximum_discount) amount = Math.min(amount, dc.maximum_discount);

        return {
            id: dc.id,
            code: dc.code,
            amount: parseFloat(amount.toFixed(2)),
            type: dc.type,
        };
    },
};

module.exports = checkoutService;
