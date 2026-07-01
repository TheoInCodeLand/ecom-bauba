'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isAuthenticated } = require('../middleware/auth');
const orderModel  = require('../models/orderModel');
const paginate    = require('../utils/paginate');
const formatCurrency = require('../utils/formatCurrency');
const dayjs       = require('dayjs');

router.get('/', isAuthenticated, catchAsync(async (req, res) => {
    const userId = req.session.user.id;
    const { page=1 } = req.query;
    const total  = await orderModel.countForUser(userId);
    const pag    = paginate(total, page, 10);
    const orders = await orderModel.getForUser(userId, { limit:10, offset:pag.offset });

    res.render('account/orders', {
        title:  'My Orders | Maison Luxe',
        orders, pagination: pag, formatCurrency, dayjs,
    });
}));

router.get('/:uuid', isAuthenticated, catchAsync(async (req, res) => {
    const order = await orderModel.findByUuid(req.params.uuid);
    if (!order || order.user_id !== req.session.user.id) {
        return res.status(404).render('errors/404', { title:'404 | Maison Luxe', message:'Order not found' });
    }
    const [items, history] = await Promise.all([
        orderModel.getItems(order.id),
        orderModel.getStatusHistory(order.id),
    ]);
    res.render('account/order-detail', {
        title:   `Order #${order.order_number} | Maison Luxe`,
        order, items, history, formatCurrency, dayjs,
    });
}));

module.exports = router;
