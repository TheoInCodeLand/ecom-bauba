'use strict';
const { pool } = require('../config/database');
const cache    = require('../utils/cache');
const categoryModel = require('../models/categoryModel');

/**
 * Injected before every render — provides user, cart count, flash, store settings, nonce
 */
module.exports = async (req, res, next) => {
    try {
        // Auth state
        res.locals.user            = req.session?.user || null;
        res.locals.isAuthenticated = !!req.session?.user;
        res.locals.isOwner         = req.session?.user?.role === 'owner';
        res.locals.isCustomer      = req.session?.user?.role === 'customer';

        // Flash messages
        res.locals.flash = {
            success: req.flash('success'),
            error:   req.flash('error'),
            info:    req.flash('info'),
            warning: req.flash('warning'),
        };

        // Cart count (cached per session)
        try {
            const userId    = req.session?.user?.id;
            const sessionId = req.sessionID;
            let cartCount = 0;
            if (userId) {
                const r = await pool.query(
                    'SELECT COALESCE(SUM(quantity),0)::int AS cnt FROM cart_items WHERE user_id = $1',
                    [userId]
                );
                cartCount = r.rows[0]?.cnt || 0;
            } else if (sessionId) {
                const r = await pool.query(
                    'SELECT COALESCE(SUM(quantity),0)::int AS cnt FROM cart_items WHERE session_id = $1',
                    [sessionId]
                );
                cartCount = r.rows[0]?.cnt || 0;
            }
            res.locals.cartCount = cartCount;
        } catch {
            res.locals.cartCount = 0;
        }

        // Store settings (cached 5 min)
        let store = cache.get('store_settings');
        if (!store) {
            try {
                const r = await pool.query('SELECT key, value FROM store_settings');
                store = {};
                r.rows.forEach(row => { store[row.key] = row.value; });
                cache.set('store_settings', store, 300);
            } catch {
                store = {
                    store_name:                'Maison Luxe',
                    store_tagline:             'Curated Luxury. Delivered.',
                    announcement_banner_text:  'Free shipping on orders over R2,500',
                    announcement_banner_active:'true',
                };
            }
        }
        res.locals.store = store;

        // CSRF token (if available)
        res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';

        // Category Nav Tree
        res.locals.navTree = await categoryModel.getTree();

        next();
    } catch (err) {
        // Never crash the request due to locals
        res.locals.user            = null;
        res.locals.isAuthenticated = false;
        res.locals.isOwner         = false;
        res.locals.cartCount       = 0;
        res.locals.flash           = { success:[], error:[], info:[], warning:[] };
        res.locals.store           = { store_name: 'Maison Luxe' };
        res.locals.csrfToken       = '';
        res.locals.navTree         = [];
        next();
    }
};
