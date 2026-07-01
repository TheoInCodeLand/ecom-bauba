'use strict';
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${stack || message}`;
    if (Object.keys(meta).length) {
        log += ` ${JSON.stringify(meta)}`;
    }
    return log;
});

const transports = [];
const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';

if (!isServerless) {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    transports.push(
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
        })
    );
}

// Always log to console in serverless (e.g., Vercel) or local development
if (isServerless || process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({ format: 'HH:mm:ss' }),
            errors({ stack: true }),
            logFormat
        ),
    }));
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'http',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    transports: transports,
});

// Morgan stream integration
logger.stream = {
    write: (message) => logger.http(message.trim()),
};

module.exports = logger;
