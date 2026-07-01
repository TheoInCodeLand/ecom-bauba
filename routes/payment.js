'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const { itnLimiter } = require('../config/rateLimit');
const paymentService  = require('../services/paymentService');
const orderModel      = require('../models/orderModel');
const stockService    = require('../services/stockService');
const emailService    = require('../services/emailService');
const userModel       = require('../models/userModel');
const logger          = require('../config/logger');

// ─── Payment Success (return_url) ─────────────────────────────────────────
router.get('/success', catchAsync(async (req, res) => {
    const orderUuid = req.query.order;
    const order     = orderUuid ? await orderModel.findByUuid(orderUuid) : null;
    res.render('payment/success', {
        title:  'Payment Successful | Maison Luxe',
        order,
    });
}));

// ─── Payment Cancel ───────────────────────────────────────────────────────
router.get('/cancel', catchAsync(async (req, res) => {
    const orderUuid = req.query.order;
    if (orderUuid) {
        const order = await orderModel.findByUuid(orderUuid);
        if (order) {
            await orderModel.updateStatus(order.id, 'cancelled', { paymentStatus: 'failed' });
            await orderModel.addStatusHistory(order.id, 'cancelled', 'Payment cancelled by customer');
            await stockService.releaseForOrder(order.id);
        }
    }
    req.flash('warning', 'Your payment was cancelled. Your cart has not been charged.');
    res.render('payment/cancel', { title: 'Payment Cancelled | Maison Luxe' });
}));

// ─── PayFast ITN Webhook (notify_url) ────────────────────────────────────
router.post('/notify', itnLimiter, catchAsync(async (req, res) => {
    const body = req.body;
    const ip   = req.ip;

    logger.info('══ PayFast ITN received ══', {
        ip,
        payment_status: body.payment_status,
        m_payment_id:   body.m_payment_id,
        pf_payment_id:  body.pf_payment_id,
        amount_gross:   body.amount_gross,
    });

    // ── Check 1: Source IP ────────────────────────────────────────────────────
    const ipValid = await paymentService.validateSourceIP(ip);
    if (!ipValid) {
        logger.warn('ITN REJECTED — invalid source IP', { ip });
        return res.status(403).send('Invalid source');
    }
    logger.info('ITN ✓ source IP valid', { ip });

    // ── Check 2: Signature ────────────────────────────────────────────────────
    if (!paymentService.validateITN(body)) {
        logger.warn('ITN REJECTED — signature mismatch or status not COMPLETE', {
            payment_status: body.payment_status,
        });
        return res.status(400).send('Invalid signature');
    }
    logger.info('ITN ✓ signature valid, payment_status=COMPLETE');

    // ── Load order ────────────────────────────────────────────────────────────
    const orderUuid = body.m_payment_id;
    const pfPayId   = body.pf_payment_id;
    const pfStatus  = body.payment_status;
    const pfAmount  = parseFloat(body.amount_gross);

    const order = await orderModel.findByUuid(orderUuid);
    if (!order) {
        logger.warn('ITN — order not found', { orderUuid });
        return res.status(200).send('OK');
    }
    logger.info('ITN ✓ order found', { orderId: order.id, orderNumber: order.order_number });

    // ── Check 3: Amount match ─────────────────────────────────────────────────
    const expectedAmount = parseFloat(order.total_amount);
    if (Math.abs(pfAmount - expectedAmount) > 0.01) {
        logger.error('ITN REJECTED — amount mismatch', {
            expected: expectedAmount,
            received: pfAmount,
            orderId:  order.id,
        });
        return res.status(200).send('OK');
    }
    logger.info('ITN ✓ amount matches', { expected: expectedAmount, received: pfAmount });

    // ── Process payment result ────────────────────────────────────────────────
    if (pfStatus === 'COMPLETE') {
        const client = await require('../config/database').pool.connect();
        try {
            await client.query('BEGIN');

            await orderModel.updateStatus(order.id, 'processing', {
                paymentStatus: 'paid', paidAt: new Date(), pfPaymentId: pfPayId,
            }, client);
            logger.info('ITN — order status → processing, payment_status → paid', { orderId: order.id });

            await orderModel.addStatusHistory(order.id, 'processing', 'Payment confirmed via PayFast ITN', null, client);

            await stockService.confirmReservations(order.id, client);
            logger.info('ITN — stock reservations confirmed', { orderId: order.id });

            // Update user stats
            if (order.user_id) {
                await userModel.updateTotalSpent(order.user_id, parseFloat(order.total_amount), client);
                const pts = Math.floor(parseFloat(order.total_amount) * (parseInt(process.env.LOYALTY_POINTS_PER_RAND) || 1));
                await userModel.awardPoints(order.user_id, pts, client);
                logger.info('ITN — loyalty points awarded', { userId: order.user_id, points: pts });
            }

            await client.query('COMMIT');
            logger.info('══ ITN COMPLETE — order paid and confirmed ══', {
                orderId:     order.id,
                orderNumber: order.order_number,
                amount:      pfAmount,
                pfPaymentId: pfPayId,
            });

            // Send confirmation email (async, non-blocking)
            try {
                const items = await orderModel.getItems(order.id);
                emailService.sendOrderConfirmation(order, items)
                    .then(() => logger.info('ITN — confirmation email sent', { orderId: order.id }))
                    .catch(e => logger.warn('ITN — confirmation email failed (non-critical)', { err: e.message }));
            } catch { /* non-critical */ }

        } catch (err) {
            await client.query('ROLLBACK');
            logger.error('ITN — processing error (rolled back)', { err: err.message, orderId: order.id });
        } finally {
            client.release();
        }

    } else if (pfStatus === 'FAILED') {
        await orderModel.updateStatus(order.id, 'failed', { paymentStatus: 'failed' });
        await orderModel.addStatusHistory(order.id, 'failed', 'Payment failed via PayFast');
        await stockService.releaseForOrder(order.id);
        logger.warn('ITN — payment FAILED, stock released', { orderId: order.id, orderNumber: order.order_number });

    } else {
        logger.info('ITN — unhandled payment_status, no action taken', { pfStatus, orderId: order.id });
    }

    res.status(200).send('OK');
}));

module.exports = router;
