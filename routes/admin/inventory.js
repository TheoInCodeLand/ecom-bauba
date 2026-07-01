'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../../utils/catchAsync');
const productModel = require('../../models/productModel');

router.get('/', catchAsync(async (req, res) => {
    const lowStock = await productModel.getLowStock();
    res.render('admin/inventory', { title: 'Inventory | Admin', lowStock });
}));

router.post('/adjust', catchAsync(async (req, res) => {
    const { variantId, delta } = req.body;
    const newQty = await productModel.adjustStock(parseInt(variantId), parseInt(delta));
    res.json({ success: true, quantity: newQty });
}));

module.exports = router;
