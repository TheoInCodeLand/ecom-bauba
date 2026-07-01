'use strict';

/**
 * isAuthenticated — user must be logged in
 */
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) return next();
    req.flash('error', 'Please log in to continue.');
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
}

/**
 * isOwner — user must have owner role
 */
function isOwner(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'owner') {
        return next();
    }
    return res.status(403).render('errors/403', {
        title: 'Access Denied | Maison Luxe',
        message: 'You do not have permission to access this area.',
    });
}

/**
 * isCustomer — user must be a registered customer (not owner)
 */
function isCustomer(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'customer') {
        return next();
    }
    return res.redirect('/auth/login');
}

/**
 * guestOnly — redirect to account if already logged in
 */
function guestOnly(req, res, next) {
    if (req.session && req.session.user) {
        const role = req.session.user.role;
        return res.redirect(role === 'owner' ? '/admin' : '/account');
    }
    next();
}

module.exports = { isAuthenticated, isOwner, isCustomer, guestOnly };
