'use strict';
const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');
const logger = require('../config/logger');

router.get('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expected) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const count = await stockService.expireStale();
        if (count > 0) logger.info(`Reservation cleanup: expired ${count} stock hold(s)`);
        res.status(200).json({ success: true, expired: count });
    } catch (err) {
        logger.error('Reservation cleanup cron failed', { err: err.message });
        res.status(500).json({ success: false, error: 'Cleanup failed' });
    }
});

module.exports = router;