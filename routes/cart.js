'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const cartModel  = require('../models/cartModel');
const productModel = require('../models/productModel');
const formatCurrency = require('../utils/formatCurrency');

// ─── View Cart ─────────────────────────────────────────────────────────────
router.get('/', catchAsync(async (req, res) => {
    const userId    = req.session?.user?.id;
    const sessionId = req.sessionID;
    const items     = await cartModel.getItems(userId, sessionId);
    const subtotal  = items.reduce((s,i) => s + i.unit_price * i.quantity, 0);
    const FREE_SHIP = parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 2500;
    const shipping  = subtotal >= FREE_SHIP ? 0 : (parseFloat(process.env.DEFAULT_SHIPPING_COST) || 150);

    res.render('cart', {
        title: 'Your Cart | Maison Luxe',
        items,
        subtotal,
        shipping,
        total: subtotal + shipping,
        formatCurrency,
        freeShippingThreshold: FREE_SHIP,
        freeShippingRemaining: Math.max(0, FREE_SHIP - subtotal),
    });
}));

// ─── Add to Cart ───────────────────────────────────────────────────────────
router.post('/add', catchAsync(async (req, res) => {
    const { variantId, quantity = 1 } = req.body;
    if (!variantId) return res.status(400).json({ error: 'No variant selected.' });

    const variant = await productModel.getVariantById(variantId);
    if (!variant || !variant.is_active) {
        return res.status(404).json({ error: 'Product unavailable.' });
    }
    if (variant.stock_quantity < quantity && !variant.allow_backorder) {
        return res.status(400).json({ error: 'Insufficient stock.' });
    }

    const userId    = req.session?.user?.id;
    const sessionId = req.sessionID;
    await cartModel.upsert(userId, sessionId, parseInt(variantId), parseInt(quantity));

    // Return updated cart count for UI badge
    const count = await cartModel.getCount(userId, sessionId);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, cartCount: count, message: 'Added to cart' });
    }
    req.flash('success', 'Item added to your cart.');
    res.redirect('/cart');
}));

// ─── Update Quantity ───────────────────────────────────────────────────────
router.post('/update', catchAsync(async (req, res) => {
    const { variantId, quantity } = req.body;
    const userId    = req.session?.user?.id;
    const sessionId = req.sessionID;
    await cartModel.updateQuantity(userId, sessionId, parseInt(variantId), parseInt(quantity));
    const items    = await cartModel.getItems(userId, sessionId);
    const subtotal = items.reduce((s,i) => s + i.unit_price * i.quantity, 0);
    const FREE_SHIP = parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 2500;
    const shipping  = subtotal >= FREE_SHIP ? 0 : 150;
    res.json({ success: true, subtotal, shipping, total: subtotal+shipping, cartCount: items.reduce((s,i)=>s+i.quantity,0) });
}));

// ─── Remove Item ───────────────────────────────────────────────────────────
router.post('/remove', catchAsync(async (req, res) => {
    const { variantId } = req.body;
    const userId    = req.session?.user?.id;
    const sessionId = req.sessionID;
    await cartModel.removeItem(userId, sessionId, parseInt(variantId));
    const count = await cartModel.getCount(userId, sessionId);
    res.json({ success: true, cartCount: count });
}));

module.exports = router;
