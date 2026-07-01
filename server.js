'use strict';
require('dotenv').config();
const app    = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    logger.info(`🏛  Maison Luxe running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// ─── Cron Jobs ───────────────────────────────────────────────────────────────
require('./cron/reservationCleanup');

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { logger.error('Uncaught exception',  { err }); process.exit(1); });
process.on('unhandledRejection', (err) => { logger.error('Unhandled rejection', { err }); });
