'use strict';
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
});

// Verify connection on startup (only if credentials are set)
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter.verify((err) => {
        if (err) {
            logger.warn('Mailer connection could not be verified', { err: err.message });
        } else {
            logger.info('Mail server ready');
        }
    });
}

module.exports = transporter;
