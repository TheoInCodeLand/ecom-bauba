'use strict';
const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
    // Log the error
    logger.error('Unhandled error', {
        err:    err.message,
        stack:  err.stack,
        url:    req.url,
        method: req.method,
        userId: req.session?.user?.id,
        ip:     req.ip,
    });

    // CSRF token error
    if (err.code === 'EBADCSRFTOKEN') {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({ error: 'Invalid form token. Please refresh and try again.' });
        }
        return res.status(403).render('errors/403', {
            title:   '403 | Maison Luxe',
            message: 'Invalid form submission. Please refresh the page and try again.',
        });
    }

    // Stock unavailable
    if (err.type === 'StockError') {
        req.flash('error', err.message);
        return res.redirect('/cart');
    }

    // Idempotency conflict
    if (err.type === 'IdempotencyConflict') {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(409).json({ error: err.message });
        }
        req.flash('info', 'Your order is already being processed.');
        return res.redirect('/orders');
    }

    const status = err.status || err.statusCode || 500;

    // Don't leak internals in production
    const message = process.env.NODE_ENV === 'production'
        ? 'Something went wrong. Our team has been notified.'
        : err.message;

    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(status).json({ error: message });
    }

    if (status === 404) {
        return res.status(404).render('errors/404', {
            title:   '404 | Maison Luxe',
            message: 'Page not found',
        });
    }

    return res.status(status).render('errors/500', {
        title:   'Error | Maison Luxe',
        message,
    });
};
