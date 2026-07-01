'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../../utils/catchAsync');
const orderModel = require('../../models/orderModel');
const stockService  = require('../../services/stockService');
const emailService  = require('../../services/emailService');
const paginate      = require('../../utils/paginate');
const formatCurrency = require('../../utils/formatCurrency');
const dayjs          = require('dayjs');

router.get('/', catchAsync(async (req, res) => {
    const { page=1, status='', search='' } = req.query;
    const total  = await orderModel.adminCount(status||null, search);
    const pag    = paginate(total, page, 20);
    const orders = await orderModel.adminList({ limit:20, offset:pag.offset, status:status||null, search });
    res.render('admin/orders/list', {
        title: 'Orders | Admin',
        orders, pagination: pag, status, search, formatCurrency, dayjs,
    });
}));

router.get('/:id', catchAsync(async (req, res) => {
    const order   = await orderModel.findById(req.params.id);
    if (!order) { req.flash('error','Order not found'); return res.redirect('/admin/orders'); }
    const [items, history] = await Promise.all([
        orderModel.getItems(order.id),
        orderModel.getStatusHistory(order.id),
    ]);
    res.render('admin/orders/detail', {
        title:  `Order ${order.order_number} | Admin`,
        order, items, history, formatCurrency, dayjs,
    });
}));

router.post('/:id/status', catchAsync(async (req, res) => {
    const { status, note, trackingNumber, shippingCarrier, trackingUrl } = req.body;
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });

    const extra = {};
    if (trackingNumber)  extra.trackingNumber  = trackingNumber;
    if (shippingCarrier) extra.shippingCarrier = shippingCarrier;
    if (trackingUrl)     extra.trackingUrl     = trackingUrl;
    if (status === 'shipped') extra.shippedAt  = new Date();

    await orderModel.updateStatus(order.id, status, extra);
    await orderModel.addStatusHistory(order.id, status, note || null, req.session.user.id);

    // Email customer
    emailService.sendOrderStatusUpdate(order, status, trackingNumber).catch(() => {});

    req.flash('success', `Order status updated to ${status}`);
    res.redirect(`/admin/orders/${order.id}`);
}));

module.exports = router;
