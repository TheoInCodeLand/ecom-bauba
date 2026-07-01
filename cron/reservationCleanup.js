'use strict';
const cron        = require('node-cron');
const stockService = require('../services/stockService');
const logger      = require('../config/logger');

// Run every 10 minutes — expire stale stock holds
cron.schedule('*/10 * * * *', async () => {
    try {
        const count = await stockService.expireStale();
        if (count > 0) logger.info(`Reservation cleanup: expired ${count} stock hold(s)`);
    } catch (err) {
        logger.error('Reservation cleanup cron failed', { err: err.message });
    }
});

logger.info('Reservation cleanup cron registered (every 10 min)');
