'use strict';
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// General API rate limit
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => req.path.startsWith('/public') || req.path.startsWith('/uploads'),
});

// Authentication (strict)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.body?.email || ipKeyGenerator(req),
    message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

// Password reset (very strict)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: (req) => req.body?.email || ipKeyGenerator(req),
    message: { error: 'Too many password reset requests. Please try again in an hour.' },
});

// Search autocomplete
const autocompleteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
});

// Checkout / order creation
const checkoutLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.session?.user?.id?.toString() || ipKeyGenerator(req),
    message: { error: 'Too many checkout attempts.' },
});

// Admin actions
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    keyGenerator: (req) => req.session?.user?.id?.toString() || ipKeyGenerator(req),
});

// PayFast ITN webhook
const itnLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
});

module.exports = {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    autocompleteLimiter,
    checkoutLimiter,
    adminLimiter,
    itnLimiter,
};
