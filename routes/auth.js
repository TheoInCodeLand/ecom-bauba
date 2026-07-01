'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const authService  = require('../services/authService');
const emailService = require('../services/emailService');
const cartModel    = require('../models/cartModel');
const userModel    = require('../models/userModel');
const { guestOnly, isAuthenticated } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../config/rateLimit');

// ─── Login ────────────────────────────────────────────────────────────────
router.get('/login', guestOnly, (req, res) => {
    res.render('auth/login', { title: 'Sign In | Maison Luxe', returnTo: req.query.returnTo || '' });
});

router.post('/login', authLimiter, catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email?.toLowerCase().trim(), password, req.ip);

    if (result.error) {
        req.flash('error', result.error);
        return res.redirect('/auth/login');
    }

    // Merge guest cart
    const sessionId = req.sessionID;
    req.session.regenerate(async (err) => {
        if (err) return res.redirect('/auth/login');
        req.session.user = authService.buildSessionUser(result.user);
        await cartModel.mergeGuestCart(result.user.id, sessionId);
        const returnTo = req.body.returnTo || req.session.returnTo || (result.user.role === 'owner' ? '/admin' : '/account');
        delete req.session.returnTo;
        res.redirect(returnTo);
    });
}));

// ─── Register ─────────────────────────────────────────────────────────────
router.get('/register', guestOnly, (req, res) => {
    res.render('auth/register', { title: 'Create Account | Maison Luxe' });
});

router.post('/register', authLimiter, catchAsync(async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/auth/register');
    }
    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('/auth/register');
    }
    if (password.length < 8) {
        req.flash('error', 'Password must be at least 8 characters.');
        return res.redirect('/auth/register');
    }

    try {
        const { user, emailVerifyToken } = await authService.register({
            firstName: firstName.trim(),
            lastName:  lastName.trim(),
            email:     email.toLowerCase().trim(),
            password,
        });

        // Send emails (non-blocking)
        emailService.sendWelcome(user).catch(() => {});
        emailService.sendVerifyEmail(user, emailVerifyToken).catch(() => {});

        // Auto-login
        const sessionId = req.sessionID;
        req.session.regenerate(async () => {
            req.session.user = authService.buildSessionUser(user);
            await cartModel.mergeGuestCart(user.id, sessionId);
            req.flash('success', `Welcome to Maison Luxe, ${user.first_name}! Please check your email to verify your account.`);
            res.redirect('/account');
        });
    } catch (err) {
        req.flash('error', err.message || 'Registration failed. Please try again.');
        res.redirect('/auth/register');
    }
}));

// ─── Logout ───────────────────────────────────────────────────────────────
router.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('mlsid');
        res.redirect('/');
    });
});

// ─── Email Verification ───────────────────────────────────────────────────
router.get('/verify-email', catchAsync(async (req, res) => {
    const { token } = req.query;
    if (!token) return res.redirect('/');

    const user = await authService.verifyEmail(token);
    if (!user) {
        req.flash('error', 'Invalid or expired verification link.');
        return res.redirect('/auth/login');
    }
    if (req.session.user) req.session.user.emailVerified = true;
    req.flash('success', 'Email verified! Your account is fully active.');
    res.redirect('/account');
}));

// ─── Forgot Password ──────────────────────────────────────────────────────
router.get('/forgot-password', guestOnly, (req, res) => {
    res.render('auth/forgot-password', { title: 'Forgot Password | Maison Luxe' });
});

router.post('/forgot-password', passwordResetLimiter, catchAsync(async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email?.toLowerCase().trim());
    if (result) {
        emailService.sendPasswordReset(result.user, result.rawToken).catch(() => {});
    }
    // Always show same response
    req.flash('info', 'If that email is registered, a reset link has been sent.');
    res.redirect('/auth/forgot-password');
}));

// ─── Reset Password ───────────────────────────────────────────────────────
router.get('/reset-password', (req, res) => {
    res.render('auth/reset-password', {
        title:  'Reset Password | Maison Luxe',
        token:  req.query.token || '',
        userId: req.query.id   || '',
    });
});

router.post('/reset-password', catchAsync(async (req, res) => {
    const { token, userId, password, confirmPassword } = req.body;
    if (password !== confirmPassword || password.length < 8) {
        req.flash('error', 'Passwords do not match or too short.');
        return res.redirect(`/auth/reset-password?token=${token}&id=${userId}`);
    }
    const ok = await authService.resetPassword(userId, token, password);
    if (!ok) {
        req.flash('error', 'Invalid or expired reset link.');
        return res.redirect('/auth/forgot-password');
    }
    const user = await userModel.findById(userId);
    if (user) emailService.sendPasswordChanged(user).catch(() => {});
    req.flash('success', 'Password updated. Please sign in.');
    res.redirect('/auth/login');
}));

module.exports = router;
