'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const { autocompleteLimiter } = require('../config/rateLimit');
const { pool } = require('../config/database');

router.get('/', catchAsync(async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) return res.render('search', { title: 'Search | Maison Luxe', products: [], query: '', total: 0 });

    const { rows } = await pool.query(
        `SELECT p.id, p.name, p.slug, p.base_price, p.brand, pi.url AS primary_image,
                ts_rank(p.search_vector, plainto_tsquery('english',$1)) AS rank
         FROM products p
         LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
         WHERE p.is_active=TRUE AND p.search_vector @@ plainto_tsquery('english',$1)
         ORDER BY rank DESC LIMIT 30`,
        [q]
    );

    res.render('search', {
        title:    `"${q}" — Search | Maison Luxe`,
        products: rows,
        query:    q,
        total:    rows.length,
        pagination: { totalPages: 1, page: 1 },
    });
}));

// Autocomplete endpoint (JSON)
router.get('/autocomplete', autocompleteLimiter, catchAsync(async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const { rows } = await pool.query(
        `SELECT p.name, p.slug, pi.url AS image, p.base_price
         FROM products p
         LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
         WHERE p.is_active=TRUE AND p.search_vector @@ plainto_tsquery('english',$1)
         LIMIT 6`,
        [q]
    );
    res.json(rows);
}));

module.exports = router;
