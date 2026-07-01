'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../../utils/catchAsync');
const orderModel   = require('../../models/orderModel');
const productModel = require('../../models/productModel');
const userModel    = require('../../models/userModel');
const { pool }     = require('../../config/database');
const formatCurrency = require('../../utils/formatCurrency');

router.get('/', catchAsync(async (req, res) => {
    const [stats, recentOrders, lowStock] = await Promise.all([
        orderModel.getRecentStats(),
        orderModel.adminList({ limit:10, offset:0 }),
        productModel.getLowStock(),
    ]);

    // Revenue chart data (last 7 days)
    const { rows: chartData } = await pool.query(`
        SELECT date_trunc('day', created_at) AS day,
               COALESCE(SUM(total_amount) FILTER (WHERE payment_status='paid'), 0) AS revenue,
               COUNT(*) AS orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day ASC
    `);

    const userCount = await userModel.count();

    res.render('admin/dashboard', {
        title:   'Admin Dashboard | Maison Luxe',
        stats,
        recentOrders,
        lowStock,
        chartData: JSON.stringify(chartData),
        userCount,
        formatCurrency,
    });
}));

module.exports = router;
