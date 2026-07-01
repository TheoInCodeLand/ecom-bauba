'use strict';
const express  = require('express');
const router   = express.Router();
const catchAsync = require('../utils/catchAsync');
const productModel  = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const reviewModel   = require('../models/reviewModel');
const wishlistModel = require('../models/wishlistModel');
const { pool }      = require('../config/database');

// ─── Landing Page ─────────────────────────────────────────────────────────
router.get('/', catchAsync(async (req, res) => {
    const [newArrivals, categories, bestsellers, reviews] = await Promise.all([
        productModel.getNewArrivals(8),
        categoryModel.getTopLevel(),
        productModel.getBestsellers(4),
        reviewModel.getHighlights(4),
    ]);

    // Featured collection
    let featuredCollection = null;
    try {
        const { rows } = await pool.query(
            `SELECT c.*, array_agg(json_build_object('id',p.id,'name',p.name,'slug',p.slug,'base_price',p.base_price,'primary_image',pi.url)) AS products
             FROM collections c
             LEFT JOIN collection_products cp ON cp.collection_id=c.id
             LEFT JOIN products p ON p.id=cp.product_id AND p.is_active=TRUE
             LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
             WHERE c.is_active=TRUE AND (c.valid_until IS NULL OR c.valid_until>NOW())
             GROUP BY c.id ORDER BY c.position ASC LIMIT 1`
        );
        featuredCollection = rows[0] || null;
    } catch { /* collections not critical */ }

    res.render('landing', {
        title:      res.locals.store?.store_name || 'Maison Luxe',
        description: res.locals.store?.seo_description || 'Curated Luxury Fashion',
        newArrivals,
        categories,
        bestsellers,
        reviews,
        featuredCollection,
    });
}));

// ─── Static Pages ─────────────────────────────────────────────────────────
router.get('/about',            (req, res) => res.render('pages/about',           { title: 'About Us | Maison Luxe' }));
router.get('/contact',          (req, res) => res.render('pages/contact',         { title: 'Contact | Maison Luxe' }));
router.get('/faq',              (req, res) => res.render('pages/faq',             { title: 'FAQ | Maison Luxe' }));
router.get('/shipping-policy',  (req, res) => res.render('pages/shipping-policy', { title: 'Shipping Policy | Maison Luxe' }));
router.get('/returns-policy',   (req, res) => res.render('pages/returns-policy',  { title: 'Returns Policy | Maison Luxe' }));
router.get('/privacy-policy',   (req, res) => res.render('pages/privacy-policy',  { title: 'Privacy Policy | Maison Luxe' }));

router.post('/contact', catchAsync(async (req, res) => {
    req.flash('success', 'Thank you for your message. We\'ll be in touch within 24 hours.');
    res.redirect('/contact');
}));

module.exports = router;
