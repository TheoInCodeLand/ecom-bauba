'use strict';
require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const crypto = require('crypto');

const logger = require('./config/logger');
const sessionMiddleware = require('./config/session');
const { generalLimiter } = require('./config/rateLimit');

// Routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const shopRouter = require('./routes/shop');
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const cartRouter = require('./routes/cart');
const wishlistRouter = require('./routes/wishlist');
const checkoutRouter = require('./routes/checkout');
const paymentRouter = require('./routes/payment');
const ordersRouter = require('./routes/orders');
const accountRouter = require('./routes/account');
const searchRouter = require('./routes/search');
const adminRouter = require('./routes/admin/index');

// Middleware
const localsMiddleware = require('./middleware/locals');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://sandbox.payfast.co.za", "https://www.payfast.co.za", "https://fonts.googleapis.com"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            objectSrc: ["'none'"],
            formAction: ["'self'", "https://sandbox.payfast.co.za", "https://www.payfast.co.za"],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
}));

// ─── Trust Proxy (for Render/Fly/Nginx) ─────────────────────────────────────
app.set('trust proxy', 1);

// ─── HTTP Logger ─────────────────────────────────────────────────────────────
app.use(morgan('combined', { stream: logger.stream }));

// ─── Static Files ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
}));

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Session ─────────────────────────────────────────────────────────────────
app.use(sessionMiddleware);

// ─── Flash Messages ──────────────────────────────────────────────────────────
app.use(flash());

// ─── Common Locals ───────────────────────────────────────────────────────────
app.use(localsMiddleware);

// ─── General Rate Limit ──────────────────────────────────────────────────────
app.use(generalLimiter);

// ─── View Engine ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/shop', shopRouter);
app.use('/products', productsRouter);
app.use('/category', categoriesRouter);
app.use('/cart', cartRouter);
app.use('/wishlist', wishlistRouter);
app.use('/checkout', checkoutRouter);
app.use('/payment', paymentRouter);
app.use('/orders', ordersRouter);
app.use('/account', accountRouter);
app.use('/search', searchRouter);
app.use('/admin', adminRouter);

// ─── 404 & Error Handlers ────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;