'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../../utils/catchAsync');
const { pool }   = require('../../config/database');
const cache      = require('../../utils/cache');

router.get('/', catchAsync(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM store_settings ORDER BY category, key');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.render('admin/settings', { title: 'Store Settings | Admin', settings, rows });
}));

router.post('/', catchAsync(async (req, res) => {
    const { body } = req;
    for (const [key, value] of Object.entries(body)) {
        await pool.query(
            'UPDATE store_settings SET value=$2, updated_at=NOW() WHERE key=$1',
            [key, value]
        );
    }
    cache.invalidate('store_settings');
    req.flash('success', 'Settings saved.');
    res.redirect('/admin/settings');
}));

module.exports = router;
