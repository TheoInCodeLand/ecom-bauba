'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../../utils/catchAsync');
const userModel  = require('../../models/userModel');
const paginate   = require('../../utils/paginate');
const formatCurrency = require('../../utils/formatCurrency');
const dayjs          = require('dayjs');

router.get('/', catchAsync(async (req, res) => {
    const { page=1, search='' } = req.query;
    const total     = await userModel.count(search);
    const pag       = paginate(total, page, 20);
    const customers = await userModel.findAll({ limit:20, offset:pag.offset, search });
    res.render('admin/customers', {
        title: 'Customers | Admin',
        customers, pagination: pag, search, formatCurrency, dayjs,
    });
}));

router.post('/:id/toggle', catchAsync(async (req, res) => {
    const { isActive } = req.body;
    await userModel.toggleActive(req.params.id, isActive === 'true');
    res.json({ success: true });
}));

module.exports = router;
