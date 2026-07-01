'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isAuthenticated } = require('../middleware/auth');
const { checkoutLimiter } = require('../config/rateLimit');
const cartModel       = require('../models/cartModel');
const userModel       = require('../models/userModel');
const checkoutService = require('../services/checkoutService');
const paymentService  = require('../services/paymentService');
const generateIdempotencyKey = require('../utils/generateIdempotencyKey');
const formatCurrency  = require('../utils/formatCurrency');

// ─── Step 1: Address ───────────────────────────────────────────────────────
router.get('/address', isAuthenticated, catchAsync(async (req, res) => {
    const userId  = req.session.user.id;
    const items   = await cartModel.getItems(userId, null);
    if (!items.length) { req.flash('error','Your cart is empty.'); return res.redirect('/cart'); }
    const addresses = await userModel.getAddresses(userId);
    res.render('checkout/address', {
        title: 'Checkout — Shipping | Maison Luxe',
        items, addresses, formatCurrency,
    });
}));

// ─── Step 2: Review & Payment ──────────────────────────────────────────────
router.post('/review', isAuthenticated, checkoutLimiter, catchAsync(async (req, res) => {
    const userId    = req.session.user.id;
    const sessionId = req.sessionID;
    const items     = await cartModel.getItems(userId, sessionId);
    if (!items.length) { req.flash('error','Your cart is empty.'); return res.redirect('/cart'); }

    const { addressId, firstName, lastName, company, addressLine1, addressLine2,
            city, province, postalCode, country, phone, discountCode, customerNotes } = req.body;

    let shippingAddress;
    if (addressId) {
        const addr = await userModel.getAddressById(addressId, userId);
        if (!addr) { req.flash('error','Invalid address.'); return res.redirect('/checkout/address'); }
        shippingAddress = {
            shippingFirstName: addr.first_name, shippingLastName: addr.last_name,
            shippingCompany: addr.company, shippingAddressLine1: addr.address_line_1,
            shippingAddressLine2: addr.address_line_2, shippingCity: addr.city,
            shippingProvince: addr.province, shippingPostalCode: addr.postal_code,
            shippingCountry: addr.country, shippingPhone: addr.phone,
        };
    } else {
        shippingAddress = {
            shippingFirstName: firstName, shippingLastName: lastName,
            shippingCompany: company, shippingAddressLine1: addressLine1,
            shippingAddressLine2: addressLine2, shippingCity: city,
            shippingProvince: province, shippingPostalCode: postalCode,
            shippingCountry: country || 'South Africa', shippingPhone: phone,
        };
    }

    // Validate discount
    let discountInfo = null;
    if (discountCode) {
        try { discountInfo = await checkoutService.validateDiscount(discountCode, userId, items); }
        catch (e) { req.flash('warning', e.message); }
    }

    const totals = checkoutService.calculateTotals(items, discountInfo?.amount || 0);

    // Store in session for payment step
    req.session.checkoutData = { shippingAddress, discountCode: discountCode||null, customerNotes: customerNotes||null };

    res.render('checkout/review', {
        title: 'Checkout — Review | Maison Luxe',
        items, ...totals,
        shipping: totals.shippingCost,
        total: totals.totalAmount,
        shippingAddress, discountInfo, customerNotes,
        formatCurrency, freeShipThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD)||2500,
    });
}));

// ─── Step 3: Place Order & Redirect to PayFast ─────────────────────────────
router.post('/place-order', isAuthenticated, checkoutLimiter, catchAsync(async (req, res) => {
    const userId    = req.session.user.id;
    const sessionId = req.sessionID;
    const userData  = req.session.user;
    const checkout  = req.session.checkoutData;

    if (!checkout) { req.flash('error','Session expired. Please start checkout again.'); return res.redirect('/cart'); }

    const items = await cartModel.getItems(userId, sessionId);
    if (!items.length) { req.flash('error','Your cart is empty.'); return res.redirect('/cart'); }

    const idempotencyKey = generateIdempotencyKey('order', `${userId}-${Date.now()}`);

    const result = await checkoutService.createOrder({
        userId, sessionId,
        cartItems: items.map(i => ({
            variant_id:          i.variant_id,
            product_id:          i.product_id,
            product_name:        i.product_name,
            variant_description: (i.attributes||[]).filter(Boolean).map(a=>a?.value).join(', '),
            sku:                 i.sku,
            product_image_url:   i.primary_image || i.variant_image,
            quantity:            i.quantity,
            unit_price:          parseFloat(i.unit_price),
        })),
        shippingAddress: checkout.shippingAddress,
        discountCode:    checkout.discountCode,
        idempotencyKey,
    });

    delete req.session.checkoutData;

    // Build PayFast payload
    const BASE = process.env.BASE_URL || 'http://localhost:3000';
    const order = {
        ...result,
        uuid:                result.orderUuid,
        total_amount:        result.totalAmount,
        user_email:          userData.email,
        order_number:        result.orderNumber,
        shipping_first_name: checkout.shippingAddress.shippingFirstName,
        shipping_last_name:  checkout.shippingAddress.shippingLastName,
        idempotency_key:     idempotencyKey,
    };

    const { payfastData, payfastUrl } = paymentService.buildPayload(order, {
        return: `${BASE}/payment/success?order=${result.orderUuid}`,
        cancel: `${BASE}/payment/cancel?order=${result.orderUuid}`,
        notify: `${BASE}/payment/notify`,
    });

    res.render('checkout/payfast-redirect', {
        title:       'Redirecting to Payment | Maison Luxe',
        payfastData,
        payfastUrl,
    });
}));

module.exports = router;
