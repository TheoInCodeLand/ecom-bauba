'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const { isAuthenticated } = require('../middleware/auth');
const userModel   = require('../models/userModel');
const wishlistModel = require('../models/wishlistModel');
const orderModel  = require('../models/orderModel');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const multerConfig = require('../config/multer');
const sharp        = require('sharp');
const path         = require('path');
const fs           = require('fs');
const formatCurrency = require('../utils/formatCurrency');

// ─── Dashboard ─────────────────────────────────────────────────────────────
router.get('/', isAuthenticated, catchAsync(async (req, res) => {
    const userId = req.session.user.id;
    const [recentOrders, wishlistCount, addresses] = await Promise.all([
        orderModel.getForUser(userId, { limit:3, offset:0 }),
        wishlistModel.count(userId),
        userModel.getAddresses(userId),
    ]);
    const user = await userModel.findById(userId);
    res.render('account/dashboard', {
        title: 'My Account | Maison Luxe',
        user, recentOrders, wishlistCount, addresses, formatCurrency,
    });
}));

// ─── Profile ───────────────────────────────────────────────────────────────
router.get('/profile', isAuthenticated, catchAsync(async (req, res) => {
    const user = await userModel.findById(req.session.user.id);
    res.render('account/profile', { title: 'My Profile | Maison Luxe', user });
}));

router.post('/profile', isAuthenticated, catchAsync(async (req, res) => {
    const { firstName, lastName, phone, dateOfBirth, gender, newsletterOptIn } = req.body;
    await userModel.updateProfile(req.session.user.id, { firstName, lastName, phone, dateOfBirth, gender, newsletterOptIn });
    req.session.user.firstName = firstName;
    req.session.user.lastName  = lastName;
    req.flash('success', 'Profile updated.');
    res.redirect('/account/profile');
}));

// ─── Avatar Upload ─────────────────────────────────────────────────────────
router.post('/avatar', isAuthenticated, multerConfig.single('avatar'), catchAsync(async (req, res) => {
    if (!req.file) { req.flash('error','No file uploaded.'); return res.redirect('/account/profile'); }
    const dir = path.join(__dirname,'..','public','uploads','avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive:true });
    const filename = `avatar-${req.session.user.id}-${Date.now()}.webp`;
    await sharp(req.file.path).resize(200,200,{ fit:'cover' }).webp({ quality:85 }).toFile(path.join(dir, filename));
    fs.unlinkSync(req.file.path);
    const url = `/uploads/avatars/${filename}`;
    await userModel.updateAvatar(req.session.user.id, url);
    req.session.user.avatarUrl = url;
    req.flash('success','Avatar updated.');
    res.redirect('/account/profile');
}));

// ─── Security ──────────────────────────────────────────────────────────────
router.get('/security', isAuthenticated, (req, res) => {
    res.render('account/security', { title: 'Security | Maison Luxe' });
});

router.post('/security/change-password', isAuthenticated, catchAsync(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword || newPassword.length < 8) {
        req.flash('error','Passwords do not match or too short.');
        return res.redirect('/account/security');
    }
    const ok = await authService.changePassword(req.session.user.id, currentPassword, newPassword);
    if (!ok) { req.flash('error','Current password is incorrect.'); return res.redirect('/account/security'); }
    const user = await userModel.findById(req.session.user.id);
    emailService.sendPasswordChanged(user).catch(() => {});
    req.flash('success','Password updated successfully.');
    res.redirect('/account/security');
}));

// ─── Addresses ─────────────────────────────────────────────────────────────
router.get('/addresses', isAuthenticated, catchAsync(async (req, res) => {
    const addresses = await userModel.getAddresses(req.session.user.id);
    res.render('account/addresses', { title: 'My Addresses | Maison Luxe', addresses });
}));

router.post('/addresses', isAuthenticated, catchAsync(async (req, res) => {
    await userModel.addAddress(req.session.user.id, req.body);
    req.flash('success','Address added.');
    res.redirect('/account/addresses');
}));

router.post('/addresses/:id/update', isAuthenticated, catchAsync(async (req, res) => {
    await userModel.updateAddress(req.params.id, req.session.user.id, req.body);
    req.flash('success','Address updated.');
    res.redirect('/account/addresses');
}));

router.post('/addresses/:id/delete', isAuthenticated, catchAsync(async (req, res) => {
    await userModel.deleteAddress(req.params.id, req.session.user.id);
    req.flash('success','Address deleted.');
    res.redirect('/account/addresses');
}));

module.exports = router;
