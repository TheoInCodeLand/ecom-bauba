'use strict';
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./database');

module.exports = session({
    store: new pgSession({
        pool,
        tableName: 'session',
        createTableIfMissing: true,
        ttl: 60 * 60 * 24 * 7,         // 7 days in seconds
        pruneSessionInterval: 60 * 15,  // Prune expired every 15 min
    }),
    secret: process.env.SESSION_SECRET || 'maison-luxe-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'mlsid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in ms
    },
});
