'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isAuthenticated } = require('../middleware/auth');
const wishlistModel = require('../models/wishlistModel');

router.get('/', isAuthenticated, catchAsync(async (req, res) => {
    const items = await wishlistModel.getForUser(req.session.user.id);
    res.render('wishlist', { title: 'My Wishlist | Maison Luxe', items });
}));

router.post('/toggle', isAuthenticated, catchAsync(async (req, res) => {
    const { productId } = req.body;
    const added = await wishlistModel.toggle(req.session.user.id, parseInt(productId));
    const count = await wishlistModel.count(req.session.user.id);
    res.json({ success: true, added, wishlistCount: count });
}));

module.exports = router;
