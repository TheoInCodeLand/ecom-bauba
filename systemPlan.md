Ran a command, created a file
Ran a command, created a file

Create output directory and start writing the massive markdown file

Script

Luxury ecommerce system design document - Part 1: Overview, Architecture, Database
markdown

# MAISON LUXE — Luxury E-Commerce Platform
## Comprehensive System Design & Engineering Specification

> **Document Version:** 1.0.0
> **Classification:** Full-Stack Engineering Blueprint
> **Stack:** Node.js · Express · EJS · CSS · Vanilla JS · PostgreSQL (Neon) · Nodemailer (Gmail) · PayFast Sandbox
> **Intended Audience:** Engineers, Developers, AI Agents, Technical Stakeholders

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Philosophy & Design Principles](#2-system-philosophy--design-principles)
3. [Technology Stack Deep Dive](#3-technology-stack-deep-dive)
4. [Architecture Overview](#4-architecture-overview)
5. [Project Directory Structure](#5-project-directory-structure)
6. [Database Design (PostgreSQL / Neon)](#6-database-design-postgresql--neon)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Authentication & Session Management](#8-authentication--session-management)
9. [Core Feature Modules](#9-core-feature-modules)
   - 9.1 [Landing Page](#91-landing-page)
   - 9.2 [Product Catalogue & Browsing](#92-product-catalogue--browsing)
   - 9.3 [Product Detail & Variants](#93-product-detail--variants)
   - 9.4 [Cart & Wishlist](#94-cart--wishlist)
   - 9.5 [Checkout & Payment Flow](#95-checkout--payment-flow)
   - 9.6 [Order Management](#96-order-management)
   - 9.7 [Shop Owner Dashboard](#97-shop-owner-dashboard)
   - 9.8 [Customer Account Portal](#98-customer-account-portal)
   - 9.9 [Search & Discovery](#99-search--discovery)
10. [Idempotency & Transaction Safety](#10-idempotency--transaction-safety)
11. [Stock Reservation System](#11-stock-reservation-system)
12. [Payment Integration (PayFast Sandbox)](#12-payment-integration-payfast-sandbox)
13. [Email System (Nodemailer / Gmail)](#13-email-system-nodemailer--gmail)
14. [Security Architecture](#14-security-architecture)
15. [Rate Limiting Strategy](#15-rate-limiting-strategy)
16. [Error Handling & Resilience](#16-error-handling--resilience)
17. [EJS Views & Frontend Architecture](#17-ejs-views--frontend-architecture)
18. [API Route Reference](#18-api-route-reference)
19. [Middleware Stack](#19-middleware-stack)
20. [Environment Configuration](#20-environment-configuration)
21. [Luxury UX & Experience Standards](#21-luxury-ux--experience-standards)
22. [Performance Optimization](#22-performance-optimization)
23. [Deployment Considerations](#23-deployment-considerations)
24. [Testing Strategy](#24-testing-strategy)
25. [Future Roadmap](#25-future-roadmap)

---

## 1. Executive Summary

**Maison Luxe** is a full-featured, production-grade luxury e-commerce platform built on a Node.js/Express/EJS/PostgreSQL stack. It serves three distinct user roles — **Visitor**, **Customer**, and **Shop Owner** — and provides a seamless, high-end shopping experience selling bags, clothing (with sub-categories), shoes, jewellery, and accessories.

The platform is engineered to peak e-commerce standards with:
- **Idempotent payment processing** to prevent duplicate charges across network failures
- **Stock hold/reservation system** to prevent overselling during concurrent purchases
- **Role-based access control** with granular permissions
- **Comprehensive product management** with unlimited variant dimensions (size, colour, material, etc.)
- **Real-time stock tracking** per variant with reservation windows
- **Multi-tier category taxonomy** (Category → Subcategory → Sub-subcategory)
- **Luxury-grade UX** including wishlist, recently viewed, curated collections, and editorial content
- **Security-first design** with CSRF, rate limiting, input sanitisation, SQL injection prevention, and more
- **Transactional email** for every customer lifecycle event
- **Resilient architecture** that handles network failures, partial failures, and retries gracefully

---

## 2. System Philosophy & Design Principles

### 2.1 Luxury-First UX
Every interface decision must reinforce brand premium positioning. Speed, clarity, and elegance take priority over feature density. White space is a design element, not wasted space.

### 2.2 Data Integrity Above All
Commerce systems that lose money lose trust. Every purchase path is transactional at the database layer, idempotent at the application layer, and confirmed at the payment layer. No corner cases can result in double charges or oversells.

### 2.3 Defence in Depth
Security is layered: authentication → authorisation → input validation → rate limiting → audit logging. No single failure point compromises the system.

### 2.4 Fail Gracefully
Network errors, payment gateway timeouts, and partial failures are handled with clear user feedback, automatic retry logic, and safe state recovery. Users are never left in an ambiguous state.

### 2.5 Operator Empowerment
The shop owner must be able to run the full business without developer intervention: add products, manage inventory, process orders, view analytics, and configure the store.

### 2.6 Accessibility & Internationalisation
WCAG 2.1 AA compliance is a baseline requirement. Currency display uses South African Rands (ZAR) given PayFast's context, with formatting per locale standards.

---

## 3. Technology Stack Deep Dive

|
 Layer 
|
 Technology 
|
 Purpose 
|
|
-------
|
-----------
|
---------
|
|
 Runtime 
|
 Node.js 20 LTS 
|
 Server-side JavaScript engine 
|
|
 Web Framework 
|
 Express.js 4.x 
|
 HTTP routing, middleware pipeline 
|
|
 Template Engine 
|
 EJS 3.x 
|
 Server-side HTML rendering 
|
|
 Database 
|
 PostgreSQL 15 via Neon 
|
 Relational data, ACID transactions 
|
|
 DB Client 
|
`pg`
 (node-postgres) 
|
 PostgreSQL driver with pool support 
|
|
 Sessions 
|
`express-session`
 + 
`connect-pg-simple`
|
 Session persistence in PostgreSQL 
|
|
 Authentication 
|
 bcrypt + custom session middleware 
|
 Password hashing, session-based auth 
|
|
 Payments 
|
 PayFast Sandbox 
|
 ZAR payment processing 
|
|
 Email 
|
 Nodemailer + Gmail SMTP 
|
 Transactional email delivery 
|
|
 File Uploads 
|
 Multer + local disk (or Cloudinary) 
|
 Product image handling 
|
|
 Security 
|
`helmet`
, 
`csurf`
, 
`express-rate-limit`
|
 HTTP security headers, CSRF, rate limiting 
|
|
 Input Validation 
|
`express-validator`
|
 Server-side input sanitisation & validation 
|
|
 Logging 
|
`morgan`
 + 
`winston`
|
 HTTP request logs and application logs 
|
|
 Scheduling 
|
`node-cron`
|
 Expired stock reservation cleanup 
|
|
 Utilities 
|
`uuid`
, 
`crypto`
, 
`dayjs`
|
 ID generation, hashing, date handling 
|
|
 Environment 
|
`dotenv`
|
 Secrets management 
|
|
 Process Manager 
|
 PM2 (production) 
|
 Daemon, clustering, auto-restart 
|

### 3.1 Why EJS Over a Frontend Framework
EJS was chosen for:
- **SEO** — Server-rendered HTML is fully crawlable by search engines, essential for product discoverability.
- **Simplicity** — No build pipeline complexity; EJS templates compile on request.
- **Performance** — No client-side bundle hydration; page load is immediate.
- **Luxury standards** — Full control over HTML structure, animation timing, and interaction without framework constraints.

### 3.2 Why Neon PostgreSQL
- Serverless PostgreSQL with autoscaling to zero — no idle cost.
- Full ACID compliance for transactional commerce.
- Connection pooling via Neon's built-in pooler (PgBouncer under the hood).
- Branching for development/staging environments.
- `node-postgres` (`pg`) is battle-tested with decades of production use.

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT BROWSER                                   │
│                    (HTML + CSS + Vanilla JS / EJS rendered)                 │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                         REVERSE PROXY (Nginx / Render)                      │
│         Static asset serving · SSL termination · Gzip compression           │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                        EXPRESS.JS APPLICATION SERVER                        │
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Middleware │  │   Routers    │  │  Controllers  │  │   Services     │  │
│  │  Pipeline   │  │              │  │               │  │                │  │
│  │             │  │  /           │  │  auth.ctrl    │  │  payment.svc   │  │
│  │  helmet     │  │  /shop       │  │  product.ctrl │  │  email.svc     │  │
│  │  cors       │  │  /products   │  │  order.ctrl   │  │  stock.svc     │  │
│  │  csrf       │  │  /cart       │  │  cart.ctrl    │  │  search.svc    │  │
│  │  session    │  │  /checkout   │  │  user.ctrl    │  │  image.svc     │  │
│  │  morgan     │  │  /orders     │  │  shop.ctrl    │  │  cache.svc     │  │
│  │  rate-limit │  │  /admin      │  │  admin.ctrl   │  │                │  │
│  │  validator  │  │  /api        │  │  review.ctrl  │  │                │  │
│  │  auth-guard │  │  /auth       │  │  search.ctrl  │  │                │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
└──────────┬─────────────────────────────────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────────────────────────────┐
    │                     DATA & EXTERNAL SERVICES                         │
    │                                                                      │
    │  ┌─────────────────┐  ┌────────────────┐  ┌───────────────────┐    │
    │  │  PostgreSQL      │  │  PayFast API   │  │  Gmail SMTP       │    │
    │  │  (Neon)          │  │  (Sandbox)     │  │  (Nodemailer)     │    │
    │  │                  │  │                │  │                   │    │
    │  │  - Products      │  │  - ITN webhook │  │  - Order confirm  │    │
    │  │  - Orders        │  │  - Payment     │  │  - Shipping       │    │
    │  │  - Users         │  │    initiation  │  │  - Password reset │    │
    │  │  - Sessions      │  │  - Signature   │  │  - Welcome        │    │
    │  │  - Reservations  │  │    validation  │  │  - Abandoned cart │    │
    │  │  - Idempotency   │  └────────────────┘  └───────────────────┘    │
    │  │    keys          │                                                │
    │  │  - Audit logs    │  ┌────────────────┐                           │
    │  └─────────────────┘  │  File Storage  │                           │
    │                        │  (local/CDN)   │                           │
    │                        │  - Images      │                           │
    │                        └────────────────┘                           │
    └──────────────────────────────────────────────────────────────────────┘
```

### 4.1 Request Lifecycle

```
Browser Request
     │
     ▼
Helmet (sets security headers)
     │
     ▼
Morgan (logs request)
     │
     ▼
Rate Limiter (checks IP/user bucket)
     │
     ▼
Cookie Parser + Session Loader
     │
     ▼
CSRF Token Validation (POST/PUT/PATCH/DELETE)
     │
     ▼
Auth Guard Middleware (injects req.user)
     │
     ▼
Input Validator (sanitise & validate body/query/params)
     │
     ▼
Router → Controller → Service → Database
     │
     ▼
EJS Template Render / JSON Response
     │
     ▼
Response to Browser
```

---

## 5. Project Directory Structure

```
maison-luxe/
├── app.js                          # Express app factory (no listen here)
├── server.js                       # Entry point — binds port, starts server
├── package.json
├── .env                            # Environment variables (never commit)
├── .env.example                    # Template for environment setup
├── .gitignore
│
├── config/
│   ├── database.js                 # Neon PostgreSQL pool config
│   ├── session.js                  # express-session + pg store config
│   ├── mailer.js                   # Nodemailer transporter setup
│   ├── payfast.js                  # PayFast environment config & helpers
│   ├── multer.js                   # File upload config
│   ├── rateLimit.js                # Rate limiter instances
│   └── logger.js                   # Winston logger config
│
├── middleware/
│   ├── auth.js                     # isAuthenticated, isOwner, isCustomer
│   ├── csrf.js                     # CSRF token generation & validation
│   ├── errorHandler.js             # Global error handler
│   ├── notFound.js                 # 404 handler
│   ├── locals.js                   # Injects common EJS locals (user, cart count, etc.)
│   ├── validateRequest.js          # Wraps express-validator chains
│   └── activityLogger.js          # Logs user actions to audit_log table
│
├── routes/
│   ├── index.js                    # Landing page + general pages
│   ├── auth.js                     # Register, login, logout, password reset
│   ├── shop.js                     # Browse shop, collections
│   ├── products.js                 # Product detail, variant selection
│   ├── categories.js               # Category & subcategory browsing
│   ├── cart.js                     # Cart CRUD
│   ├── wishlist.js                 # Wishlist management
│   ├── checkout.js                 # Checkout flow, PayFast initiation
│   ├── payment.js                  # PayFast ITN webhook, return/cancel
│   ├── orders.js                   # Customer order history & tracking
│   ├── account.js                  # Customer account settings
│   ├── search.js                   # Full-text search
│   └── admin/
│       ├── index.js                # Admin dashboard overview
│       ├── products.js             # Product CRUD
│       ├── categories.js           # Category CRUD
│       ├── orders.js               # Order management
│       ├── customers.js            # Customer management
│       ├── inventory.js            # Stock management
│       ├── analytics.js            # Sales analytics
│       └── settings.js             # Store settings
│
├── controllers/
│   ├── authController.js
│   ├── shopController.js
│   ├── productController.js
│   ├── categoryController.js
│   ├── cartController.js
│   ├── wishlistController.js
│   ├── checkoutController.js
│   ├── paymentController.js
│   ├── orderController.js
│   ├── accountController.js
│   ├── searchController.js
│   └── admin/
│       ├── dashboardController.js
│       ├── productAdminController.js
│       ├── categoryAdminController.js
│       ├── orderAdminController.js
│       ├── customerAdminController.js
│       ├── inventoryController.js
│       ├── analyticsController.js
│       └── settingsController.js
│
├── services/
│   ├── authService.js              # Registration, login, token management
│   ├── productService.js           # Product queries, variant resolution
│   ├── categoryService.js          # Category tree building
│   ├── cartService.js              # Cart logic, price calculation
│   ├── stockService.js             # Stock reservation, release, confirmation
│   ├── checkoutService.js          # Order creation, idempotency checks
│   ├── paymentService.js           # PayFast signature gen/verification
│   ├── orderService.js             # Order queries, status updates
│   ├── emailService.js             # All email templates and sending
│   ├── searchService.js            # Full-text search with PostgreSQL tsvector
│   ├── imageService.js             # Image upload, resize, optimise
│   ├── analyticsService.js         # Sales data aggregation
│   └── idempotencyService.js       # Idempotency key management
│
├── models/
│   ├── userModel.js                # User DB queries
│   ├── productModel.js             # Product + variant DB queries
│   ├── categoryModel.js            # Category tree queries
│   ├── orderModel.js               # Order DB queries
│   ├── cartModel.js                # Cart persistence queries
│   ├── reviewModel.js              # Product review queries
│   ├── wishlistModel.js            # Wishlist queries
│   └── auditModel.js               # Audit log queries
│
├── validators/
│   ├── authValidator.js            # Registration & login rules
│   ├── productValidator.js         # Product creation/edit rules
│   ├── checkoutValidator.js        # Shipping & payment input rules
│   ├── accountValidator.js         # Profile update rules
│   └── reviewValidator.js          # Review submission rules
│
├── utils/
│   ├── formatCurrency.js           # ZAR/locale number formatting
│   ├── generateSlug.js             # URL-friendly slugs from names
│   ├── generateIdempotencyKey.js   # UUID v4 + context hash
│   ├── paginate.js                 # Pagination helper
│   ├── payfastSignature.js         # MD5 signature builder
│   ├── sanitiseHtml.js             # Strip dangerous HTML from rich text
│   └── catchAsync.js               # Async error wrapper for controllers
│
├── db/
│   ├── migrations/                 # Sequential SQL migration files
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_categories.sql
│   │   ├── 003_create_products.sql
│   │   ├── 004_create_variants.sql
│   │   ├── 005_create_orders.sql
│   │   ├── 006_create_cart.sql
│   │   ├── 007_create_reviews.sql
│   │   ├── 008_create_wishlist.sql
│   │   ├── 009_create_sessions.sql
│   │   ├── 010_create_idempotency.sql
│   │   ├── 011_create_stock_reservations.sql
│   │   ├── 012_create_audit_log.sql
│   │   ├── 013_create_collections.sql
│   │   ├── 014_create_discount_codes.sql
│   │   ├── 015_create_store_settings.sql
│   │   └── 016_add_search_indexes.sql
│   └── seed.js                     # Development seed data
│
├── public/
│   ├── css/
│   │   ├── global.css              # CSS variables, resets, typography
│   │   ├── layout.css              # Grid, flex utilities
│   │   ├── nav.css                 # Navigation styles
│   │   ├── footer.css              # Footer styles
│   │   ├── landing.css             # Landing page specific
│   │   ├── shop.css                # Shop browse page
│   │   ├── product.css             # Product detail page
│   │   ├── cart.css                # Cart page
│   │   ├── checkout.css            # Checkout pages
│   │   ├── account.css             # Account dashboard
│   │   ├── admin.css               # Admin panel
│   │   ├── auth.css                # Login/register pages
│   │   ├── animations.css          # Micro-animations, transitions
│   │   └── responsive.css          # Mobile-first breakpoints
│   ├── js/
│   │   ├── main.js                 # Global JS (nav, flash messages)
│   │   ├── product.js              # Variant selector, gallery, zoom
│   │   ├── cart.js                 # AJAX cart updates
│   │   ├── checkout.js             # Checkout form validation, PayFast submit
│   │   ├── admin-product.js        # Admin product form (dynamic variants)
│   │   ├── admin-dashboard.js      # Admin analytics charts
│   │   ├── search.js               # Live search autocomplete
│   │   ├── wishlist.js             # Wishlist toggle
│   │   └── image-gallery.js        # Product image lightbox & zoom
│   └── images/
│       ├── logo.svg
│       ├── favicon.ico
│       └── placeholders/
│
├── views/
│   ├── partials/
│   │   ├── head.ejs                # <head> meta, CSS links
│   │   ├── nav.ejs                 # Main navigation bar
│   │   ├── footer.ejs              # Site footer
│   │   ├── flash.ejs               # Flash message display
│   │   ├── breadcrumb.ejs          # Category breadcrumb trail
│   │   ├── product-card.ejs        # Reusable product card component
│   │   ├── pagination.ejs          # Pagination controls
│   │   ├── star-rating.ejs         # Review star display
│   │   ├── cart-item.ejs           # Cart line item
│   │   ├── admin-sidebar.ejs       # Admin nav sidebar
│   │   └── csrf-token.ejs          # Hidden CSRF input field
│   │
│   ├── landing.ejs                 # Public landing / home page
│   ├── shop.ejs                    # Browse all products / filtered
│   ├── product-detail.ejs          # Single product with variants
│   ├── category.ejs                # Category listing page
│   ├── search-results.ejs          # Search results
│   ├── cart.ejs                    # Shopping cart
│   ├── wishlist.ejs                # Customer wishlist
│   │
│   ├── checkout/
│   │   ├── address.ejs             # Step 1: Shipping address
│   │   ├── review.ejs              # Step 2: Order review
│   │   └── processing.ejs          # Step 3: Payment redirect / processing
│   │
│   ├── payment/
│   │   ├── success.ejs             # Payment success landing
│   │   └── cancel.ejs              # Payment cancelled landing
│   │
│   ├── orders/
│   │   ├── history.ejs             # Customer order list
│   │   └── detail.ejs              # Single order detail & tracking
│   │
│   ├── account/
│   │   ├── dashboard.ejs           # Account overview
│   │   ├── profile.ejs             # Edit personal info
│   │   ├── addresses.ejs           # Manage saved addresses
│   │   ├── security.ejs            # Change password, 2FA (future)
│   │   └── preferences.ejs         # Communication preferences
│   │
│   ├── auth/
│   │   ├── login.ejs
│   │   ├── register.ejs
│   │   ├── forgot-password.ejs
│   │   └── reset-password.ejs
│   │
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   ├── products/
│   │   │   ├── list.ejs
│   │   │   ├── create.ejs
│   │   │   └── edit.ejs
│   │   ├── categories/
│   │   │   ├── list.ejs
│   │   │   └── form.ejs
│   │   ├── orders/
│   │   │   ├── list.ejs
│   │   │   └── detail.ejs
│   │   ├── customers/
│   │   │   ├── list.ejs
│   │   │   └── detail.ejs
│   │   ├── inventory/
│   │   │   └── dashboard.ejs
│   │   └── settings/
│   │       └── store.ejs
│   │
│   ├── errors/
│   │   ├── 404.ejs
│   │   ├── 500.ejs
│   │   └── 403.ejs
│   │
│   └── pages/
│       ├── about.ejs
│       ├── contact.ejs
│       ├── faq.ejs
│       ├── shipping-policy.ejs
│       ├── returns-policy.ejs
│       └── privacy-policy.ejs
│
├── emails/
│   ├── templates/
│   │   ├── welcome.html
│   │   ├── order-confirmation.html
│   │   ├── order-shipped.html
│   │   ├── order-delivered.html
│   │   ├── order-cancelled.html
│   │   ├── password-reset.html
│   │   ├── abandoned-cart.html
│   │   ├── back-in-stock.html
│   │   └── payment-failed.html
│   └── emailBuilder.js             # Inject variables into HTML templates
│
├── cron/
│   └── reservationCleanup.js       # Expire stale stock holds every 10 min
│
└── logs/
    ├── combined.log
    └── error.log
```

---

## 6. Database Design (PostgreSQL / Neon)

All tables use `TIMESTAMPTZ` for time values. UUIDs are used for externally-facing IDs where appropriate to prevent enumeration attacks. Sequential integers are used for internal foreign keys for performance.

### 6.1 Entity Relationship Overview

```
users ──────────────────────────┐
  │                              │
  ├── addresses                  │
  ├── cart_items                 │
  ├── wishlists                  │
  ├── orders ──────────────────► order_items
  ├── reviews                    │         │
  ├── password_reset_tokens      │         ▼
  └── sessions                   │    product_variants
                                 │         ▲
categories (self-referencing) ──►│         │
  └── subcategories              │    products ──────────────────┐
       └── sub-subcategories     │         │                      │
                                 │         ├── product_images     │
                                 │         ├── product_variants   │
                                 │         │    ├── variant_attrs │
                                 │         │    └── stock_count   │
                                 │         └── product_collections│
                                 │                                │
collections ◄────────────────────┘                               │
                                                                  │
stock_reservations ──────────────────────────────────────────────┘
idempotency_keys
audit_log
discount_codes
store_settings
```

### 6.2 Complete Table Definitions

#### `users`
```sql
CREATE TABLE users (
    id                      SERIAL PRIMARY KEY,
    uuid                    UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    role                    VARCHAR(20) NOT NULL DEFAULT 'customer'
                                CHECK (role IN ('visitor','customer','owner')),
    -- Identity
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    email                   VARCHAR(255) UNIQUE NOT NULL,
    phone                   VARCHAR(30),
    date_of_birth           DATE,
    gender                  VARCHAR(20) CHECK (gender IN ('male','female','non-binary','prefer_not_to_say')),
    
    -- Authentication
    password_hash           TEXT NOT NULL,
    email_verified          BOOLEAN DEFAULT FALSE,
    email_verify_token      TEXT,
    email_verify_token_exp  TIMESTAMPTZ,
    is_active               BOOLEAN DEFAULT TRUE,
    
    -- Profile enrichment
    avatar_url              TEXT,
    preferred_language      VARCHAR(10) DEFAULT 'en',
    preferred_currency      VARCHAR(3) DEFAULT 'ZAR',
    newsletter_opt_in       BOOLEAN DEFAULT FALSE,
    sms_opt_in              BOOLEAN DEFAULT FALSE,
    marketing_opt_in        BOOLEAN DEFAULT FALSE,
    
    -- Account stats (denormalised for performance)
    total_orders            INT DEFAULT 0,
    total_spent             DECIMAL(12,2) DEFAULT 0.00,
    loyalty_points          INT DEFAULT 0,
    
    -- Loyalty tier
    loyalty_tier            VARCHAR(20) DEFAULT 'bronze'
                                CHECK (loyalty_tier IN ('bronze','silver','gold','platinum')),
    
    -- Security
    failed_login_attempts   INT DEFAULT 0,
    locked_until            TIMESTAMPTZ,
    last_login_at           TIMESTAMPTZ,
    last_login_ip           INET,
    last_seen_at            TIMESTAMPTZ,
    
    -- Meta
    notes                   TEXT,                        -- Owner-only internal notes on customer
    referred_by             INT REFERENCES users(id),
    referral_code           VARCHAR(20) UNIQUE,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_loyalty_tier ON users(loyalty_tier);
```

#### `addresses`
```sql
CREATE TABLE addresses (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(50) DEFAULT 'Home',      -- Home, Work, Other
    is_default      BOOLEAN DEFAULT FALSE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    company         VARCHAR(150),
    address_line_1  VARCHAR(255) NOT NULL,
    address_line_2  VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    province        VARCHAR(100),
    postal_code     VARCHAR(20),
    country         VARCHAR(100) DEFAULT 'South Africa',
    phone           VARCHAR(30),
    delivery_notes  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
```

#### `categories`
```sql
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    parent_id       INT REFERENCES categories(id) ON DELETE RESTRICT,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(120) UNIQUE NOT NULL,
    description     TEXT,
    image_url       TEXT,
    icon_class      VARCHAR(50),            -- CSS icon class
    position        INT DEFAULT 0,          -- Sort order
    is_active       BOOLEAN DEFAULT TRUE,
    show_in_nav     BOOLEAN DEFAULT TRUE,
    meta_title      VARCHAR(255),
    meta_description TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sample taxonomy:
-- Level 0 (parent_id IS NULL): Bags, Clothing, Shoes, Jewellery, Accessories, Beauty
-- Level 1 (parent_id = Clothing): Men, Women, Children, Unisex
-- Level 2 (parent_id = Women under Clothing): Tops, Bottoms, Dresses, Outerwear, Activewear
-- Level 1 (parent_id = Bags): Handbags, Clutches, Backpacks, Travel, Wallets
-- Level 1 (parent_id = Shoes): Heels, Flats, Sneakers, Boots, Sandals, Men's Shoes
-- Level 1 (parent_id = Jewellery): Necklaces, Earrings, Rings, Bracelets, Watches

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);
```

#### `products`
```sql
CREATE TABLE products (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    category_id         INT NOT NULL REFERENCES categories(id),
    slug                VARCHAR(255) UNIQUE NOT NULL,
    
    -- Identification
    name                VARCHAR(255) NOT NULL,
    brand               VARCHAR(100),
    sku_prefix          VARCHAR(50),            -- e.g. "BAG-CHN-001"
    
    -- Rich description
    short_description   VARCHAR(500),           -- Shown on cards
    description         TEXT NOT NULL,          -- Full rich text / HTML
    material_details    TEXT,                   -- Fabric, leather type, etc.
    care_instructions   TEXT,
    fit_and_sizing      TEXT,                   -- For clothing
    origin_country      VARCHAR(100),
    designer_notes      TEXT,                   -- Editorial/story content
    
    -- Pricing (base price; variants may override)
    base_price          DECIMAL(10,2) NOT NULL,
    compare_at_price    DECIMAL(10,2),          -- Crossed-out original price
    cost_price          DECIMAL(10,2),          -- Internal cost (owner only)
    vat_inclusive       BOOLEAN DEFAULT TRUE,
    vat_rate            DECIMAL(5,2) DEFAULT 15.00,
    
    -- Tax & shipping
    weight_grams        INT,
    length_cm           DECIMAL(8,2),
    width_cm            DECIMAL(8,2),
    height_cm           DECIMAL(8,2),
    requires_shipping   BOOLEAN DEFAULT TRUE,
    is_fragile          BOOLEAN DEFAULT FALSE,
    
    -- Discovery
    tags                TEXT[],                 -- PostgreSQL array for tag search
    search_vector       TSVECTOR,               -- Full-text search vector
    
    -- Status
    is_active           BOOLEAN DEFAULT FALSE,  -- Draft by default
    is_featured         BOOLEAN DEFAULT FALSE,
    is_new_arrival      BOOLEAN DEFAULT FALSE,
    is_bestseller       BOOLEAN DEFAULT FALSE,
    is_limited_edition  BOOLEAN DEFAULT FALSE,
    
    -- SEO
    meta_title          VARCHAR(255),
    meta_description    TEXT,
    canonical_url       TEXT,
    
    -- Analytics (denormalised)
    view_count          INT DEFAULT 0,
    wishlist_count      INT DEFAULT 0,
    purchase_count      INT DEFAULT 0,
    average_rating      DECIMAL(3,2) DEFAULT 0,
    review_count        INT DEFAULT 0,
    
    -- Timestamps
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_search_vector
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
```

#### `variant_attribute_types`
```sql
-- Defines what dimension types are possible (Size, Colour, Material, Length, etc.)
CREATE TABLE variant_attribute_types (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,    -- "Size", "Colour", "Material"
    display_name VARCHAR(100),
    input_type  VARCHAR(20) DEFAULT 'text'
                    CHECK (input_type IN ('text','colour','image','button')),
    position    INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed values:
-- Size, Colour, Material, Length, Width, Style, Edition
```

#### `product_variants`
```sql
CREATE TABLE product_variants (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             VARCHAR(100) UNIQUE,
    
    -- Pricing override (NULL = use product base_price)
    price_override  DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    
    -- Stock
    stock_quantity  INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT DEFAULT 3,
    track_inventory BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,
    
    -- Physical
    weight_grams    INT,
    
    -- Display
    image_url       TEXT,          -- Variant-specific image (e.g. colour swatch photo)
    position        INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
```

#### `variant_attributes`
```sql
-- Links a variant to its dimension values (e.g. Size=Large, Colour=Black)
CREATE TABLE variant_attributes (
    id              SERIAL PRIMARY KEY,
    variant_id      INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_type  VARCHAR(50) NOT NULL,   -- "Size", "Colour", etc.
    attribute_value VARCHAR(100) NOT NULL,  -- "Large", "#000000", "Crocodile Leather"
    display_value   VARCHAR(100),           -- Human label if value is a code
    position        INT DEFAULT 0
);

CREATE UNIQUE INDEX idx_variant_attrs_unique
    ON variant_attributes(variant_id, attribute_type);
CREATE INDEX idx_variant_attrs_variant_id ON variant_attributes(variant_id);
```

#### `product_images`
```sql
CREATE TABLE product_images (
    id          SERIAL PRIMARY KEY,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  INT REFERENCES product_variants(id) ON DELETE SET NULL,
    url         TEXT NOT NULL,
    alt_text    VARCHAR(255),
    position    INT DEFAULT 0,
    is_primary  BOOLEAN DEFAULT FALSE,
    width       INT,
    height      INT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_variant_id ON product_images(variant_id);
```

#### `collections`
```sql
-- Curated editorial collections (e.g. "Summer Soirée", "The Power Wardrobe")
CREATE TABLE collections (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(120) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    headline        VARCHAR(500),
    description     TEXT,
    hero_image_url  TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    position        INT DEFAULT 0,
    valid_from      TIMESTAMPTZ,
    valid_until     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_products (
    collection_id   INT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position        INT DEFAULT 0,
    PRIMARY KEY (collection_id, product_id)
);
```

#### `orders`
```sql
CREATE TABLE orders (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    order_number        VARCHAR(30) UNIQUE NOT NULL,    -- e.g. "ML-2024-000001"
    user_id             INT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status lifecycle
    status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                            CHECK (status IN (
                                'pending',          -- Created, awaiting payment
                                'payment_pending',  -- Redirected to PayFast
                                'paid',             -- ITN confirmed
                                'processing',       -- Being picked & packed
                                'ready_to_ship',    -- Packed, awaiting courier
                                'shipped',          -- In transit
                                'delivered',        -- Confirmed delivery
                                'cancelled',        -- Cancelled (pre-ship)
                                'refunded',         -- Full refund issued
                                'partially_refunded',
                                'failed'            -- Payment failed
                            )),
    payment_status      VARCHAR(30) DEFAULT 'unpaid'
                            CHECK (payment_status IN ('unpaid','paid','failed','refunded','partial_refund')),
    
    -- Payment
    payment_method      VARCHAR(50),            -- 'payfast'
    payment_reference   VARCHAR(255),           -- PayFast m_payment_id
    payfast_payment_id  VARCHAR(255),           -- PayFast's pf_payment_id
    idempotency_key     VARCHAR(255) UNIQUE,    -- Prevents duplicate orders
    
    -- Amounts (all in ZAR, stored as cents-precision decimals)
    subtotal            DECIMAL(12,2) NOT NULL,
    shipping_cost       DECIMAL(12,2) DEFAULT 0.00,
    discount_amount     DECIMAL(12,2) DEFAULT 0.00,
    vat_amount          DECIMAL(12,2) DEFAULT 0.00,
    total_amount        DECIMAL(12,2) NOT NULL,
    
    -- Discount
    discount_code_id    INT REFERENCES discount_codes(id),
    discount_code       VARCHAR(50),
    
    -- Shipping address snapshot (denormalised to preserve at time of order)
    shipping_first_name     VARCHAR(100),
    shipping_last_name      VARCHAR(100),
    shipping_company        VARCHAR(150),
    shipping_address_line_1 VARCHAR(255),
    shipping_address_line_2 VARCHAR(255),
    shipping_city           VARCHAR(100),
    shipping_province       VARCHAR(100),
    shipping_postal_code    VARCHAR(20),
    shipping_country        VARCHAR(100),
    shipping_phone          VARCHAR(30),
    
    -- Billing (optional, if different)
    billing_same_as_shipping BOOLEAN DEFAULT TRUE,
    billing_first_name      VARCHAR(100),
    billing_last_name       VARCHAR(100),
    billing_address_line_1  VARCHAR(255),
    billing_city            VARCHAR(100),
    billing_province        VARCHAR(100),
    billing_postal_code     VARCHAR(20),
    billing_country         VARCHAR(100),
    
    -- Fulfilment
    shipping_carrier        VARCHAR(100),
    tracking_number         VARCHAR(255),
    tracking_url            TEXT,
    estimated_delivery      DATE,
    shipped_at              TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    
    -- Customer notes
    customer_notes          TEXT,
    internal_notes          TEXT,   -- Owner-only
    
    -- Timestamps
    paid_at             TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_idempotency ON orders(idempotency_key);
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

#### `order_items`
```sql
CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INT REFERENCES products(id) ON DELETE SET NULL,
    variant_id      INT REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Snapshot at time of purchase (prices/names may change later)
    product_name        VARCHAR(255) NOT NULL,
    variant_description TEXT,           -- e.g. "Black / Size 38 / Crocodile"
    sku                 VARCHAR(100),
    product_image_url   TEXT,
    
    quantity        INT NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(10,2) NOT NULL,
    total_price     DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Refund tracking
    refunded_quantity   INT DEFAULT 0,
    refunded_amount     DECIMAL(10,2) DEFAULT 0.00,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

#### `cart_items`
```sql
CREATE TABLE cart_items (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    session_id  VARCHAR(255),                   -- For guest carts
    variant_id  INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    
    -- One entry per user/variant or session/variant
    UNIQUE (user_id, variant_id),
    UNIQUE (session_id, variant_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_session_id ON cart_items(session_id);
```

#### `stock_reservations`
```sql
-- Holds stock during checkout to prevent overselling
CREATE TABLE stock_reservations (
    id              SERIAL PRIMARY KEY,
    variant_id      INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    user_id         INT REFERENCES users(id) ON DELETE SET NULL,
    session_id      VARCHAR(255),
    quantity        INT NOT NULL CHECK (quantity > 0),
    reservation_token VARCHAR(255) UNIQUE NOT NULL,    -- UUID, used to release/confirm
    status          VARCHAR(20) DEFAULT 'held'
                        CHECK (status IN ('held','confirmed','released','expired')),
    expires_at      TIMESTAMPTZ NOT NULL,              -- Typically NOW() + 15 minutes
    order_id        INT REFERENCES orders(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_variant_id ON stock_reservations(variant_id);
CREATE INDEX idx_reservations_session ON stock_reservations(session_id);
CREATE INDEX idx_reservations_expires ON stock_reservations(expires_at) WHERE status = 'held';
CREATE INDEX idx_reservations_token ON stock_reservations(reservation_token);
```

#### `idempotency_keys`
```sql
-- Prevents duplicate payment processing on retries / network failures
CREATE TABLE idempotency_keys (
    id              SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    user_id         INT REFERENCES users(id),
    resource_type   VARCHAR(50) NOT NULL,       -- 'order', 'payment'
    resource_id     INT,                        -- The order ID once created
    request_hash    TEXT,                       -- MD5 of request body
    response_status INT,                        -- HTTP status of original response
    response_body   JSONB,                      -- Cached response to replay
    status          VARCHAR(20) DEFAULT 'processing'
                        CHECK (status IN ('processing','completed','failed')),
    expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_idempotency_key ON idempotency_keys(idempotency_key);
CREATE INDEX idx_idempotency_user ON idempotency_keys(user_id);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
```

#### `reviews`
```sql
CREATE TABLE reviews (
    id          SERIAL PRIMARY KEY,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id    INT REFERENCES orders(id) ON DELETE SET NULL,   -- Verified purchase
    
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title       VARCHAR(255),
    body        TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    
    -- Helpfulness votes
    helpful_yes INT DEFAULT 0,
    helpful_no  INT DEFAULT 0,
    
    -- Moderation
    status      VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
    moderated_at TIMESTAMPTZ,
    
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (product_id, user_id)   -- One review per product per user
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_status ON reviews(status);
```

#### `wishlists`
```sql
CREATE TABLE wishlists (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  INT REFERENCES product_variants(id) ON DELETE SET NULL,
    added_at    TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (user_id, product_id)
);

CREATE INDEX idx_wishlist_user_id ON wishlists(user_id);
```

#### `discount_codes`
```sql
CREATE TABLE discount_codes (
    id                  SERIAL PRIMARY KEY,
    code                VARCHAR(50) UNIQUE NOT NULL,
    description         VARCHAR(255),
    type                VARCHAR(20) NOT NULL
                            CHECK (type IN ('percentage','fixed','free_shipping','bogo')),
    value               DECIMAL(10,2),          -- 10 for 10% or R10.00 fixed
    minimum_order_value DECIMAL(10,2),
    maximum_discount    DECIMAL(10,2),          -- Cap on percentage discounts
    
    -- Restrictions
    applies_to          VARCHAR(20) DEFAULT 'all'
                            CHECK (applies_to IN ('all','category','product','collection')),
    applicable_ids      INT[],                  -- IDs of products/categories
    customer_ids        INT[],                  -- Restrict to specific customers
    
    -- Limits
    usage_limit         INT,                    -- Total uses allowed (NULL = unlimited)
    usage_per_customer  INT DEFAULT 1,
    usage_count         INT DEFAULT 0,
    
    -- Validity
    is_active           BOOLEAN DEFAULT TRUE,
    starts_at           TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE discount_code_uses (
    id              SERIAL PRIMARY KEY,
    discount_code_id INT NOT NULL REFERENCES discount_codes(id),
    user_id         INT REFERENCES users(id),
    order_id        INT REFERENCES orders(id),
    discount_amount DECIMAL(10,2),
    used_at         TIMESTAMPTZ DEFAULT NOW()
);
```

#### `audit_log`
```sql
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,      -- 'login', 'order.created', 'product.updated', etc.
    entity_type VARCHAR(50),               -- 'order', 'product', 'user'
    entity_id   INT,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);
```

#### `password_reset_tokens`
```sql
CREATE TABLE password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,      -- bcrypt hash of the raw token
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pwd_reset_user_id ON password_reset_tokens(user_id);
```

#### `sessions`
```sql
-- Managed by connect-pg-simple; shown for reference
CREATE TABLE session (
    sid     VARCHAR NOT NULL COLLATE "default",
    sess    JSON NOT NULL,
    expire  TIMESTAMPTZ NOT NULL
);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX idx_session_expire ON session(expire);
```

#### `store_settings`
```sql
CREATE TABLE store_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT,
    label       VARCHAR(255),
    category    VARCHAR(50),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Keys:
-- store_name, store_tagline, contact_email, contact_phone, store_address
-- shipping_base_cost, free_shipping_threshold
-- announcement_banner_text, announcement_banner_active
-- maintenance_mode, maintenance_message
-- currency, vat_number, company_registration
-- social_instagram, social_facebook, social_pinterest, social_tiktok
-- returns_policy_days, loyalty_points_per_rand
```

#### `order_status_history`
```sql
CREATE TABLE order_status_history (
    id          SERIAL PRIMARY KEY,
    order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      VARCHAR(30) NOT NULL,
    note        TEXT,
    changed_by  INT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
```

---

## 7. User Roles & Permissions

### 7.1 Role Definitions

|
 Role 
|
 Description 
|
 Creation 
|
|
------
|
-------------
|
----------
|
|
`visitor`
|
 Unauthenticated browser 
|
 Default for anonymous users 
|
|
`customer`
|
 Registered & authenticated shopper 
|
 Self-registration 
|
|
`owner`
|
 Store administrator with full access 
|
 Manually assigned or seeded 
|

### 7.2 Permission Matrix

|
 Action 
|
 Visitor 
|
 Customer 
|
 Owner 
|
|
--------
|
---------
|
----------
|
-------
|
|
 View landing page 
|
 ✅ 
|
 ✅ 
|
 ✅ 
|
|
 Browse shop & products 
|
 ✅ 
|
 ✅ 
|
 ✅ 
|
|
 View product details 
|
 ✅ 
|
 ✅ 
|
 ✅ 
|
|
 Search products 
|
 ✅ 
|
 ✅ 
|
 ✅ 
|
|
 Add to cart 
|
 ✅ (session) 
|
 ✅ 
|
 ✅ 
|
|
 View wishlist 
|
 ❌ 
|
 ✅ 
|
 ✅ 
|
|
 Checkout & purchase 
|
 ❌ (redirect to login) 
|
 ✅ 
|
 ❌ 
|
|
 View own orders 
|
 ❌ 
|
 ✅ 
|
 ✅ 
|
|
 Write reviews 
|
 ❌ 
|
 ✅ (verified purchase) 
|
 ✅ 
|
|
 Access account dashboard 
|
 ❌ 
|
 ✅ 
|
 ✅ 
|
|
 Access admin dashboard 
|
 ❌ 
|
 ❌ 
|
 ✅ 
|
|
 Create/edit products 
|
 ❌ 
|
 ❌ 
|
 ✅ 
|
|
 Manage categories 
|
 ❌ 
|
 ❌ 
|
 ✅ 
|
|
 Manage orders 
|
 ❌ 
|
 ❌ 
|
 ✅ 
|
|
 View customer list 
|
 ❌ 
|
 ❌ 
|
 ✅ 
|
|
 View analytics 
|
 ❌ 
|
 ❌ 
|
 ✅ 
|
|
 Apply/create discounts 
|
 ✅ (use only) 
|
 ✅ (use only) 
|
 ✅ (create & use) 
|

### 7.3 Guest Cart Merge
When a visitor with items in their session cart logs in, the cart is merged: guest session items are added to the authenticated customer's cart. If the same variant exists in both, quantities are summed (capped at available stock).

---

## 8. Authentication & Session Management

### 8.1 Registration Flow

```
1. Customer submits registration form
2. Server validates:
   - Email format, uniqueness
   - Password strength (min 8 chars, uppercase, lowercase, number, special char)
   - All required fields present
3. bcrypt.hash(password, 12) — cost factor 12
4. INSERT into users with email_verify_token = crypto.randomBytes(32).toString('hex')
5. Send verification email with tokenised link
6. Redirect to "Check your email" page
7. On link click: validate token, set email_verified = TRUE, clear token
8. Merge any guest cart items
9. Establish authenticated session
10. Redirect to account dashboard with welcome message
```

### 8.2 Login Flow

```
1. POST /auth/login with email + password
2. Rate limit check (5 attempts per 15 minutes per IP + per email)
3. Lookup user by email
4. If user.locked_until > NOW(): reject with lockout message
5. bcrypt.compare(password, hash)
6. On failure:
   - Increment failed_login_attempts
   - If >= 5: set locked_until = NOW() + 30 minutes
   - Return generic error ("Invalid email or password")
7. On success:
   - Reset failed_login_attempts = 0, locked_until = NULL
   - Update last_login_at, last_login_ip
   - Regenerate session ID (session fixation prevention)
   - Store user ID, role in session
   - Merge guest cart
   - Redirect to intended page or account dashboard
```

### 8.3 Session Configuration

```javascript
// config/session.js
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./database');

module.exports = session({
    store: new pgSession({
        pool,
        tableName: 'session',
        createTableIfMissing: false,    // Created by migration
        ttl: 60 * 60 * 24 * 7,         // 7 days in seconds
        pruneSessionInterval: 60 * 15  // Clean expired every 15 min
    }),
    secret: process.env.SESSION_SECRET,    // 64-char random string
    resave: false,
    saveUninitialized: false,
    name: 'mlsid',                         // Non-default cookie name
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7   // 7 days in ms
    }
});
```

### 8.4 Password Reset Flow

```
1. POST /auth/forgot-password with email
2. Always respond with "If that email exists, a link was sent" (prevent enumeration)
3. If email found:
   a. Generate raw token = crypto.randomBytes(32).toString('hex')
   b. Store token_hash = bcrypt.hash(rawToken, 10) in password_reset_tokens
   c. expires_at = NOW() + 1 hour
   d. Email link: /auth/reset-password?token=<rawToken>&id=<userId>
4. On form submission:
   a. Lookup unused, unexpired token for userId
   b. bcrypt.compare(rawToken, stored token_hash)
   c. If valid: update password_hash, mark token used, destroy all sessions for user
   d. Send "password changed" confirmation email
   e. Redirect to login
```

---

## 9. Core Feature Modules

### 9.1 Landing Page

The landing page is the brand's digital storefront — it must be visually arresting and commercially effective.

**Sections (top to bottom):**

1. **Hero Banner** — Full-viewport animated hero with brand statement, seasonal campaign headline, and dual CTAs ("Shop New Arrivals" / "Explore Collections"). Optional auto-rotating carousel for multiple campaigns.

2. **Announcement Bar** — Sticky thin bar above nav for shipping promotions, new collection launches, or limited-time offers. Configurable from store settings.

3. **New Arrivals Strip** — Horizontal scroll of 8 newest active products. "Just In" badge on each.

4. **Shop by Category** — Visual grid of top-level category cards with hover animation. Shows Bags, Clothing, Shoes, Jewellery, Accessories, Beauty.

5. **Featured Collection** — Full-bleed editorial section for the current hero collection. Asymmetric image/text layout. Links to `/collections/:slug`.

6. **Bestsellers** — 4-column grid of products flagged `is_bestseller = TRUE`.

7. **Brand Values Strip** — Icon + text for "Authentic Luxury", "Free Shipping Over R2,500", "Easy Returns", "Secure Payment".

8. **Editorial / The Journal** — 3-column grid of latest editorial content (static blog posts, managed as EJS pages).

9. **Social Proof Band** — Customer reviews aggregate rating + select review quotes.

10. **Newsletter Signup** — Email capture with first-name field. Double opt-in via email. Value offer ("Join for 10% off your first order").

11. **Footer** — Full-width footer with nav links, social icons, payment logos, legal links.

**Data fetched by `shopController.getLanding()`:**
```javascript
// Parallel DB queries using Promise.all for performance
const [newArrivals, categories, featuredCollection, bestsellers, reviews] = 
    await Promise.all([
        productService.getNewArrivals(8),
        categoryService.getTopLevelWithImages(),
        collectionService.getFeaturedCollection(),
        productService.getBestsellers(4),
        reviewService.getApprovedHighlights(6)
    ]);
```

### 9.2 Product Catalogue & Browsing

**Route:** `GET /shop` and `GET /category/:slug` and `GET /category/:slug/:subslug`

**Features:**
- Filterable by category (hierarchical), price range, size, colour, brand, rating
- Sortable by: Newest, Price (Low→High / High→Low), Bestselling, Rating, Most Reviewed
- URL-persistent filters (filter state stored in query params, shareable links)
- Pagination (24 products per page, cursor-based for performance)
- Active filter display with individual remove buttons
- Breadcrumb navigation for category hierarchy
- Product count display ("Showing 24 of 143 results")
- Grid/List toggle (preference stored in localStorage)
- Lazy-loaded product images with blur-up placeholder effect
- Wishlist heart toggle on each product card (AJAX, no page reload)

**Filter UI:**
- Sidebar panel with collapsible filter sections
- Mobile: slide-in filter drawer from bottom
- Price range: dual-handle range slider (vanilla JS)
- Colour: visual swatch buttons
- Size: pill/button selectors

**SQL Example — filtered product query:**
```sql
SELECT p.id, p.name, p.slug, p.short_description, p.base_price,
       p.compare_at_price, p.average_rating, p.review_count,
       p.is_new_arrival, p.is_bestseller, p.is_limited_edition,
       pi.url AS primary_image,
       MIN(pv.price_override) FILTER (WHERE pv.price_override IS NOT NULL) AS min_variant_price,
       MAX(pv.stock_quantity) > 0 AS in_stock
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = TRUE
WHERE p.is_active = TRUE
  AND ($1::INT IS NULL OR p.category_id IN (
      WITH RECURSIVE cat_tree AS (
          SELECT id FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id FROM categories c INNER JOIN cat_tree ct ON c.parent_id = ct.id
      ) SELECT id FROM cat_tree
  ))
  AND ($2::DECIMAL IS NULL OR p.base_price >= $2)
  AND ($3::DECIMAL IS NULL OR p.base_price <= $3)
  AND ($4::TEXT[] IS NULL OR EXISTS (
      SELECT 1 FROM variant_attributes va
      JOIN product_variants pv2 ON va.variant_id = pv2.id
      WHERE pv2.product_id = p.id AND va.attribute_type = 'Colour'
        AND va.attribute_value = ANY($4)
  ))
GROUP BY p.id, pi.url
ORDER BY CASE WHEN $5 = 'newest' THEN p.published_at END DESC,
         CASE WHEN $5 = 'price_asc' THEN p.base_price END ASC,
         CASE WHEN $5 = 'price_desc' THEN p.base_price END DESC,
         CASE WHEN $5 = 'rating' THEN p.average_rating END DESC
LIMIT $6 OFFSET $7;
```

### 9.3 Product Detail & Variants

**Route:** `GET /products/:slug`

This is the most critical conversion page. Every element is designed to communicate luxury, authenticity, and value.

**Page Sections:**

1. **Image Gallery** — Left: thumbnail strip (vertical). Centre: main image with zoom on hover (CSS transform scale + JavaScript-controlled crop window). "View Full Screen" lightbox. Swipe gesture support on mobile. Variant selection changes active image set.

2. **Product Information Panel (right side):**
   - Brand name (link to brand filter)
   - Product name (H1)
   - Star rating + review count (scroll-to-reviews anchor)
   - Price (with comparison/original if on sale)
   - "VAT inclusive" label
   - **Variant Selectors** — dynamically rendered per `variant_attribute_types`:
     - Colour: visual swatches with tooltip on hover
     - Size: pill buttons. Out-of-stock = strikethrough + disabled
     - Other attributes: appropriate input type per `input_type`
   - Size guide modal trigger (if clothing/shoes)
   - Stock status: "In Stock", "Only 2 left", "Out of Stock", "Low Stock"
   - Quantity selector
   - "Add to Cart" CTA (primary, large)
   - "Add to Wishlist" button
   - Express Checkout note (future: Apple/Google Pay)
   - Secure checkout badges (PayFast, SSL)

3. **Product Description Tabs:**
   - Overview (rich description)
   - Details (material, care, origin)
   - Shipping & Returns
   - Size Guide (if applicable)

4. **Variant Logic (JavaScript):**
```javascript
// When any variant attribute changes:
// 1. Collect all currently selected attribute values
// 2. Find matching variant from preloaded JSON
// 3. Update price, stock status, images, SKU display
// 4. Enable/disable other attribute options based on valid combinations

const allVariants = <%- JSON.stringify(variants) %>;

function findMatchingVariant(selectedAttrs) {
    return allVariants.find(v =>
        Object.entries(selectedAttrs).every(([type, val]) =>
            v.attributes.some(a => a.attribute_type === type && a.attribute_value === val)
        )
    );
}
```

5. **Recently Viewed** — Horizontal strip of last 8 products visited (stored in `localStorage`, rendered client-side).

6. **You May Also Like** — 4 products from same category, server-rendered. Excludes current product.

7. **Customer Reviews Section:**
   - Rating distribution bar chart
   - Review list with verified purchase badge
   - Helpful vote buttons (AJAX)
   - Review form (logged-in verified purchasers only)
   - Moderation status messaging

**SEO:**
- Dynamic `<title>` = `{Product Name} | {Brand} | Maison Luxe`
- `meta description` = product `short_description`
- Open Graph tags for social sharing
- Schema.org `Product` JSON-LD structured data:
```html

{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "<%= product.name %>",
  "image": ["<%= product.images.map(i => i.url) %>"],
  "description": "<%= product.short_description %>",
  "brand": { "@type": "Brand", "name": "<%= product.brand %>" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "ZAR",
    "price": "<%= selectedVariant.price %>",
    "availability": "<%= inStock ? 'InStock' : 'OutOfStock' %>"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "<%= product.average_rating %>",
    "reviewCount": "<%= product.review_count %>"
  }
}

```

### 9.4 Cart & Wishlist

**Cart Features:**
- Persistent server-side cart for authenticated users (survives browser close)
- Session-based cart for guests (15-day session cookie)
- AJAX add-to-cart — no page reload, slide-in mini-cart confirmation drawer
- Quantity updater with stock validation on each change
- Remove item button with undo capability (30-second window)
- Cart item sub-total updates in real-time via JavaScript
- Out-of-stock warning if item becomes unavailable since add
- Saved-for-later functionality
- Cart summary sidebar: subtotal, estimated shipping, estimated VAT, total
- "Proceed to Checkout" CTA
- Recommended items at cart bottom
- Empty cart state with CTAs back to shop

**Wishlist Features:**
- Toggle from any product card or detail page (AJAX)
- Full wishlist page with date added
- Move to cart from wishlist
- Share wishlist link (public UUID-based URL)
- "Price dropped" badge if item price reduced since add
- Back-in-stock notification request if item is OOS

### 9.5 Checkout & Payment Flow

**Multi-Step Checkout:**

```
Step 1: Shipping Address
  - Select saved address or enter new one
  - Validate all fields server-side
  - Option to save address to profile
  - Shipping method selection (standard/express if multiple available)

Step 2: Order Review
  - Line items summary with images
  - Applied discount code input
  - Order totals: subtotal, shipping, discount, VAT, total
  - Selected shipping address display
  - Edit links back to Step 1
  - Terms & conditions checkbox
  - "Proceed to Payment" button (creates order + reserves stock)

Step 3: Payment (PayFast Redirect)
  - Generate PayFast form with signed parameters
  - Auto-submit form to PayFast sandbox
  - Loading overlay while processing

Step 4a: Success return (/payment/return)
  - Display "Thank you" confirmation
  - Order number and summary
  - Email confirmation note

Step 4b: Cancel return (/payment/cancel)
  - Friendly messaging
  - Order preserved in 'payment_pending' status for 24h
  - Stock holds released if abandoned for > 15 min

PayFast ITN Webhook (/payment/notify)
  - Validate server-to-server notification
  - Confirm payment
  - Update order status
  - Release stock holds → confirm stock decrement
  - Send order confirmation email
  - Update user loyalty points
```

**Critical: Order Creation is Atomic:**
```javascript
// checkoutService.js — createOrder()
const client = await pool.connect();
try {
    await client.query('BEGIN');
    
    // 1. Check idempotency key (prevent duplicate on retry)
    const existing = await idempotencyService.check(idempotencyKey, client);
    if (existing?.status === 'completed') return existing.response_body;
    
    // 2. Mark idempotency key as processing
    await idempotencyService.markProcessing(idempotencyKey, userId, client);
    
    // 3. Lock variant rows for update (SELECT ... FOR UPDATE)
    await client.query(`SELECT id, stock_quantity FROM product_variants
        WHERE id = ANY($1) FOR UPDATE`, [variantIds]);
    
    // 4. Validate stock availability (including holds)
    const stockValid = await stockService.validateAndHold(cartItems, sessionId, client);
    if (!stockValid.ok) throw new StockError(stockValid.message);
    
    // 5. Validate & apply discount code
    const discount = await discountService.validate(discountCode, userId, subtotal, client);
    
    // 6. Calculate final amounts
    const totals = calculateTotals(cartItems, discount, shippingCost);
    
    // 7. Create order record
    const order = await orderModel.create({ userId, ...totals, ...shippingAddr }, client);
    
    // 8. Create order items (price snapshot)
    await orderModel.createItems(order.id, cartItems, client);
    
    // 9. Link reservations to order
    await stockService.linkReservationsToOrder(order.id, sessionId, client);
    
    // 10. Update discount code usage count
    if (discount) await discountService.recordUse(discount.id, userId, order.id, client);
    
    // 11. Clear cart
    await cartModel.clearByUser(userId, client);
    
    // 12. Log audit event
    await auditModel.log('order.created', 'order', order.id, { total: totals.totalAmount }, client);
    
    // 13. Mark idempotency as completed with response
    await idempotencyService.markCompleted(idempotencyKey, order, client);
    
    await client.query('COMMIT');
    return order;

} catch (err) {
    await client.query('ROLLBACK');
    await idempotencyService.markFailed(idempotencyKey);
    throw err;
} finally {
    client.release();
}
```

### 9.6 Order Management

**Customer Order History (`/orders`):**
- Chronological list of all orders with status badge
- Order number, date, total, item count
- Filter by status
- "Track Order" link for shipped orders
- "Reorder" button (adds same items to cart)
- "Write a Review" prompt for delivered orders with unreviewed items
- "Request Return" button within 30 days of delivery
- Full order detail page: all items, addresses, payment info, status timeline

**Order Status Timeline:**
```
○ Order Placed ──► ○ Payment Confirmed ──► ○ Processing ──► ○ Ready to Ship ──► ○ Shipped ──► ● Delivered
```

### 9.7 Shop Owner Dashboard

**Dashboard Overview (`/admin`):**
- Revenue today / this week / this month / this year vs. prior period
- Orders today / pending / processing / shipped
- Low stock alerts (variants below threshold)
- Recent orders table
- Top selling products (last 30 days)
- Revenue chart (line chart — last 30 days)
- New customers today
- Conversion rate (visitors to orders)

**Product Management (`/admin/products`):**
- Sortable, searchable product list with inline status toggle
- Bulk actions: activate, deactivate, delete, tag, feature
- Product creation form:
  - All base product fields
  - Rich text editor for description (via contenteditable + simple toolbar)
  - Multiple image uploads (drag and drop reorder, primary selection)
  - Category picker (hierarchical dropdown)
  - Tag input with autocomplete
  - Dynamic variant builder:
    - Select active attribute types for this product
    - Enter values for each attribute
    - Matrix automatically generates all combinations
    - Set individual prices, SKUs, stock, images per variant
    - Activate/deactivate individual variants
  - SEO fields section
  - Publishing controls (draft/active, scheduled publish date)
  - Preview button (opens product page in new tab as preview)

**Category Management (`/admin/categories`):**
- Hierarchical tree view with drag-drop reorder
- Create/edit form: name, parent, description, image, nav visibility
- Category activity toggle
- Product count display per category

**Order Management (`/admin/orders`):**
- Full order list with advanced filters (status, date range, customer, min/max amount)
- Bulk status updates
- Order detail: all items, customer info, payment details, audit trail
- Status update with customer notification email trigger
- Tracking number entry + carrier link
- Internal notes field
- Refund initiation (manual, outside PayFast)
- Print order/packing slip

**Inventory Dashboard (`/admin/inventory`):**
- Low stock alert panel (all variants below threshold)
- Stock adjustment form (add/remove units with reason log)
- Export inventory CSV
- Bulk stock import via CSV

**Customer Management (`/admin/customers`):**
- Customer list with total spend, order count, loyalty tier
- Customer detail: full profile, order history, addresses, notes, activity log
- Internal notes (visible only to owner)
- Email customer directly (opens draft email)
- Disable/suspend account
- Loyalty points manual adjustment

**Analytics (`/admin/analytics`):**
- Revenue by day/week/month/year
- Top products by revenue and quantity
- Top categories
- Customer acquisition over time
- Average order value trend
- Discount code performance report
- Export all reports as CSV

**Store Settings (`/admin/settings`):**
- General: store name, tagline, contact info
- Shipping: rates, free shipping threshold, carriers
- Payment: PayFast credentials (masked display)
- SEO: default meta title/description
- Notifications: email recipients for new orders, low stock
- Announcement bar: text and enable/disable
- Maintenance mode toggle
- Loyalty programme configuration

### 9.8 Customer Account Portal

**Dashboard (`/account`):**
- Personalised greeting with loyalty tier badge
- Quick stats: total orders, wishlist items, points balance
- Recent order summary (last 3)
- Recommended products (based on purchase history)
- Recently viewed products

**Profile (`/account/profile`):**
- Edit: first name, last name, phone, date of birth, gender
- Profile photo upload
- Display email (cannot change without re-verify flow)
- Communication preferences (newsletter, SMS, marketing)

**Addresses (`/account/addresses`):**
- View all saved addresses
- Add new / edit / delete
- Set default shipping/billing

**Security (`/account/security`):**
- Change password
- View active sessions (device, location, last active)
- Revoke specific sessions
- Login activity log (last 10 logins with IP and timestamp)

**Preferences (`/account/preferences`):**
- Preferred currency display
- Size preferences (clothing: UK/EU/US, shoes: EU size)
- Brand preferences
- Notification preferences

### 9.9 Search & Discovery

**Route:** `GET /search?q=...&sort=...&page=...`

**Implementation — PostgreSQL Full-Text Search:**
```sql
SELECT p.id, p.name, p.slug, p.base_price, p.average_rating,
       pi.url AS primary_image,
       ts_rank_cd(p.search_vector, query) AS rank,
       ts_headline('english', p.short_description, query,
           'MaxWords=20, MinWords=10, ShortWord=3') AS excerpt
FROM products p,
     to_tsquery('english', $1) query   -- e.g. "leather & handbag"
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
WHERE p.is_active = TRUE
  AND p.search_vector @@ query
ORDER BY rank DESC
LIMIT $2 OFFSET $3;
```

**Autocomplete (AJAX):**
- Endpoint: `GET /search/autocomplete?q=:term` (rate-limited to 30 req/min)
- Returns top 6 product suggestions + top 3 category suggestions
- Results appear in dropdown below search bar
- Uses PostgreSQL prefix search via `plainto_tsquery` + `ILIKE`
- Debounced at 300ms in client JS

---

## 10. Idempotency & Transaction Safety

### 10.1 Problem Statement
In e-commerce, network failures between the client and server can cause requests to be retried. Without idempotency, a retry of an order creation request could:
- Create two orders for the same items
- Charge the customer twice
- Decrement stock twice

### 10.2 Idempotency Key Strategy

Every checkout POST request includes an `idempotency_key` generated client-side:
```javascript
// checkout.js (client)
// Generated when the checkout page loads, stored in a hidden form field
const idempotencyKey = 
    crypto.randomUUID() + '-' + Date.now();
```

On the server, before any order creation:
```javascript
// idempotencyService.js
async function check(key, userId) {
    const result = await pool.query(
        `SELECT * FROM idempotency_keys 
         WHERE idempotency_key = $1 AND expires_at > NOW()`, [key]
    );
    if (!result.rows[0]) return null;
    
    const record = result.rows[0];
    
    if (record.status === 'completed') {
        // Replay the original success response
        return { replayed: true, data: record.response_body };
    }
    
    if (record.status === 'processing') {
        // Request is still in flight — return 409 Conflict
        throw new ConflictError('Request is already being processed');
    }
    
    if (record.status === 'failed') {
        // Previous attempt failed — safe to retry (delete old key)
        await pool.query(`DELETE FROM idempotency_keys WHERE idempotency_key = $1`, [key]);
        return null;
    }
}
```

### 10.3 PayFast ITN Idempotency

The PayFast Instant Transaction Notification (ITN) can be sent multiple times (PayFast retries if your server returns non-200). The handler is idempotent:

```javascript
// paymentController.js
async function handleITN(req, res) {
    const { m_payment_id, pf_payment_id, payment_status, amount_gross } = req.body;
    
    // 1. Immediately return 200 to PayFast (prevents retries from timing out)
    res.status(200).send('OK');
    
    // 2. Process asynchronously
    try {
        // Validate PayFast signature
        const isValid = payfastService.validateSignature(req.body);
        if (!isValid) {
            await auditLog('payfast.itn.invalid_signature', { body: req.body });
            return;
        }
        
        // Validate host IP is PayFast's
        const validIP = await payfastService.validateSourceIP(req.ip);
        if (!validIP) return;
        
        // Fetch order — idempotency check
        const order = await orderModel.getByPaymentRef(m_payment_id);
        if (!order) return;
        
        // Idempotency: if already paid, skip processing
        if (order.payment_status === 'paid') {
            await auditLog('payfast.itn.duplicate_ignored', { orderId: order.id });
            return;
        }
        
        if (payment_status === 'COMPLETE') {
            // Validate amount matches
            if (parseFloat(amount_gross) !== parseFloat(order.total_amount)) {
                await auditLog('payfast.itn.amount_mismatch', { orderId: order.id });
                return;
            }
            
            await processSuccessfulPayment(order, pf_payment_id);
        } else if (payment_status === 'FAILED' || payment_status === 'CANCELLED') {
            await processFailedPayment(order, payment_status);
        }
    } catch (err) {
        logger.error('ITN processing error', { err, body: req.body });
    }
}

async function processSuccessfulPayment(order, pfPaymentId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update order status
        await orderModel.updateStatus(order.id, 'paid', { 
            paidAt: new Date(),
            pfPaymentId 
        }, client);
        
        // Confirm stock reservations (permanently decrement)
        await stockService.confirmReservations(order.id, client);
        
        // Award loyalty points
        await userModel.awardPoints(order.user_id, 
            Math.floor(order.total_amount * POINTS_PER_RAND), client);
        
        // Log status history
        await orderModel.addStatusHistory(order.id, 'paid', 'Payment confirmed by PayFast', client);
        
        await client.query('COMMIT');
        
        // Send confirmation email (outside transaction)
        await emailService.sendOrderConfirmation(order);
        
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
```

---

## 11. Stock Reservation System

### 11.1 Problem Statement
If two customers simultaneously view the last unit of an item and both add to cart and proceed to checkout, without a reservation system, both could succeed in placing an order — resulting in overselling and fulfilment failure.

### 11.2 Reservation Lifecycle

```
BROWSING
    │
    ▼
Add to Cart ──── (no hold placed yet; cart reflects available stock)
    │
    ▼
Proceed to Checkout (Step 1)
    │
    ▼
POST /checkout/review (Step 2) ──────► stockService.reserve()
    │                                        │
    │                                        ▼
    │                               INSERT stock_reservation
    │                               WITH expires_at = NOW() + 15 min
    │                                        │
    │                               Available stock check:
    │                               stock_quantity - SUM(active holds) >= requested_qty
    │                                        │
    │                               If OK: Return reservation_token
    │                               If not: Return error "Item no longer available"
    │
    ▼
Pay via PayFast ──────────────────── (hold active for 15 min)
    │
    ├── Payment SUCCESS (ITN received) ──► stockService.confirm()
    │                                         UPDATE reservation status = 'confirmed'
    │                                         UPDATE product_variants stock_quantity -= qty
    │
    ├── Payment CANCELLED/FAILED ────────► stockService.release()
    │                                         UPDATE reservation status = 'released'
    │
    └── No action for > 15 min ──────────► CRON: expire reservation
                                              UPDATE reservation status = 'expired'
```

### 11.3 Available Stock Calculation

The "real" available stock shown to customers is calculated dynamically:

```sql
-- Available stock = physical stock - active holds
SELECT pv.stock_quantity -
    COALESCE(
        (SELECT SUM(sr.quantity)
         FROM stock_reservations sr
         WHERE sr.variant_id = pv.id
           AND sr.status = 'held'
           AND sr.expires_at > NOW()
           AND sr.user_id != $1   -- Exclude this user's own holds
        ), 0
    ) AS available_quantity
FROM product_variants pv
WHERE pv.id = $2;
```

### 11.4 Reservation Cleanup Cron

```javascript
// cron/reservationCleanup.js
const cron = require('node-cron');

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
    try {
        const result = await pool.query(`
            UPDATE stock_reservations
            SET status = 'expired', updated_at = NOW()
            WHERE status = 'held'
              AND expires_at < NOW()
            RETURNING id, variant_id, quantity
        `);
        
        if (result.rows.length > 0) {
            logger.info(`Expired ${result.rows.length} stock reservations`);
        }
    } catch (err) {
        logger.error('Reservation cleanup cron failed', { err });
    }
});
```

---

## 12. Payment Integration (PayFast Sandbox)

### 12.1 PayFast Sandbox Configuration

```javascript
// config/payfast.js
module.exports = {
    merchantId: process.env.PAYFAST_MERCHANT_ID,
    merchantKey: process.env.PAYFAST_MERCHANT_KEY,
    passphrase: process.env.PAYFAST_PASSPHRASE,
    baseUrl: process.env.PAYFAST_SANDBOX
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process',
    validateIPs: [
        '197.97.145.144', '197.97.145.145',
        '197.97.145.146', '197.97.145.147',
        // Sandbox IPs
        '197.97.145.148', '197.97.145.149',
    ]
};
```

### 12.2 Payment Form Generation

```javascript
// services/paymentService.js
const crypto = require('crypto');

function buildPayFastPayload(order, returnUrls) {
    const data = {
        merchant_id:    config.merchantId,
        merchant_key:   config.merchantKey,
        return_url:     returnUrls.return,
        cancel_url:     returnUrls.cancel,
        notify_url:     returnUrls.notify,
        name_first:     order.shipping_first_name,
        name_last:      order.shipping_last_name,
        email_address:  order.user_email,
        m_payment_id:   order.uuid,         // Our internal reference
        amount:         order.total_amount.toFixed(2),
        item_name:      `Maison Luxe Order ${order.order_number}`,
        item_description: `${order.item_count} item(s)`,
        custom_int1:    order.id,           // Internal DB ID
        custom_str1:    order.idempotency_key,
        email_confirmation: 1,
        confirmation_address: order.user_email,
    };

    // Generate MD5 signature
    const signature = generateSignature(data, config.passphrase);
    return { ...data, signature };
}

function generateSignature(data, passphrase) {
    // Build query string in EXACT key order PayFast requires
    const orderedKeys = [
        'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
        'name_first', 'name_last', 'email_address', 'm_payment_id',
        'amount', 'item_name', 'item_description', 'custom_int1', 'custom_str1',
        'email_confirmation', 'confirmation_address'
    ];
    
    let str = orderedKeys
        .filter(k => data[k] !== undefined && data[k] !== '')
        .map(k => `${k}=${encodeURIComponent(String(data[k]).trim())}`)
        .join('&');
    
    if (passphrase) str += `&passphrase=${encodeURIComponent(passphrase)}`;
    
    return crypto.createHash('md5').update(str).digest('hex');
}

function validateITNSignature(pfData, passphrase) {
    const { signature, ...dataWithoutSig } = pfData;
    const expectedSig = generateSignature(dataWithoutSig, passphrase);
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig)
    );
}
```

### 12.3 EJS Checkout Form

```html
<!-- views/checkout/processing.ejs -->
<%- include('../partials/head') %>

  
    
    Securing your payment...
  
  
  
  
    <% Object.entries(payfastData).forEach(([key, value]) => { %>
      
    <% }) %>
  
  
  
    // Auto-submit after 500ms to allow page render
    setTimeout(() => document.getElementById('payfast-form').submit(), 500);
  

```

---

## 13. Email System (Nodemailer / Gmail)

### 13.1 Configuration

```javascript
// config/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,  // Gmail App Password (not account password)
    },
    pool: true,         // Reuse SMTP connection
    maxConnections: 5,
    maxMessages: 100,
});

// Verify connection on startup
transporter.verify((err) => {
    if (err) logger.error('Mailer connection failed', { err });
    else logger.info('Mail server ready');
});

module.exports = transporter;
```

### 13.2 Email Templates & Events

All emails use branded HTML templates with inline CSS for maximum email client compatibility.

|
 Email Event 
|
 Trigger 
|
 Template 
|
|
-------------
|
---------
|
----------
|
|
 Welcome 
|
 Registration complete 
|
`welcome.html`
|
|
 Email Verification 
|
 Registration 
|
`verify-email.html`
|
|
 Order Confirmation 
|
 Payment confirmed (ITN) 
|
`order-confirmation.html`
|
|
 Order Processing 
|
 Status → processing 
|
`order-processing.html`
|
|
 Order Shipped 
|
 Tracking number added 
|
`order-shipped.html`
|
|
 Order Delivered 
|
 Status → delivered 
|
`order-delivered.html`
|
|
 Order Cancelled 
|
 Order cancelled 
|
`order-cancelled.html`
|
|
 Password Reset 
|
 Forgot password request 
|
`password-reset.html`
|
|
 Payment Failed 
|
 PayFast failed status 
|
`payment-failed.html`
|
|
 Abandoned Cart 
|
 2h after last cart activity 
|
`abandoned-cart.html`
|
|
 Back in Stock 
|
 Wishlist item restocked 
|
`back-in-stock.html`
|
|
 Low Stock Alert 
|
 Variant hits threshold 
|
`low-stock-alert.html`
 (to owner) 
|
|
 New Order Alert 
|
 New paid order 
|
`new-order-alert.html`
 (to owner) 
|
|
 Return Request 
|
 Customer initiates return 
|
`return-request.html`
|
|
 Review Approved 
|
 Owner approves review 
|
`review-approved.html`
|

### 13.3 Email Service

```javascript
// services/emailService.js
const transporter = require('../config/mailer');
const emailBuilder = require('../emails/emailBuilder');

async function sendOrderConfirmation(order) {
    const items = await orderModel.getItemsByOrderId(order.id);
    const html = emailBuilder.build('order-confirmation', {
        customerName: order.shipping_first_name,
        orderNumber: order.order_number,
        orderDate: dayjs(order.created_at).format('DD MMM YYYY'),
        items: items.map(item => ({
            name: item.product_name,
            variant: item.variant_description,
            quantity: item.quantity,
            price: formatCurrency(item.unit_price),
            image: item.product_image_url,
        })),
        subtotal: formatCurrency(order.subtotal),
        shipping: formatCurrency(order.shipping_cost),
        discount: order.discount_amount > 0 ? formatCurrency(order.discount_amount) : null,
        total: formatCurrency(order.total_amount),
        shippingAddress: buildAddressString(order),
        trackingUrl: `${process.env.BASE_URL}/orders/${order.uuid}`,
    });
    
    await transporter.sendMail({
        from: `"Maison Luxe" <${process.env.GMAIL_USER}>`,
        to: order.user_email,
        subject: `Your Maison Luxe Order #${order.order_number} is Confirmed`,
        html,
        text: stripHtml(html),   // Plain text fallback
    });
}
```

---

## 14. Security Architecture

### 14.1 HTTP Security Headers (Helmet)

```javascript
// app.js
const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'nonce-<%= nonce %>'",         // Dynamic nonce via middleware
                "https://sandbox.payfast.co.za",
            ],
            styleSrc: ["'self'", "'unsafe-inline'"],    // Needed for EJS inline styles
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,   // PayFast iframe compatibility
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
```

### 14.2 CSRF Protection

```javascript
// middleware/csrf.js
const csrf = require('csurf');

// Cookie-based CSRF (works with EJS forms)
const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax' } });

module.exports = csrfProtection;

// In every EJS form:
// 
// Generated in controller: res.locals.csrfToken = req.csrfToken();
```

### 14.3 Input Sanitisation

```javascript
// validators/productValidator.js
const { body } = require('express-validator');
const sanitiseHtml = require('../utils/sanitiseHtml');

const createProductRules = [
    body('name').trim().notEmpty().isLength({ max: 255 })
        .withMessage('Product name is required (max 255 characters)'),
    
    body('description').trim().notEmpty()
        .customSanitizer(value => sanitiseHtml(value))  // Allow safe HTML only
        .withMessage('Description is required'),
    
    body('base_price').isDecimal({ decimal_digits: '0,2' }).isFloat({ min: 0 })
        .withMessage('Valid price required'),
    
    body('category_id').isInt({ min: 1 })
        .withMessage('Valid category required'),
    
    body('tags').optional().isArray(),
    body('tags.*').trim().isLength({ max: 50 }),
];
```

### 14.4 SQL Injection Prevention

All database queries use parameterised queries exclusively:
```javascript
// NEVER:
pool.query(`SELECT * FROM users WHERE email = '${email}'`);

// ALWAYS:
pool.query('SELECT * FROM users WHERE email = $1', [email]);
```

The `pg` library (node-postgres) escapes all parameters automatically when using the parameterised query interface.

### 14.5 Account Security

- **Password requirements:** Minimum 8 characters, must contain uppercase, lowercase, digit, and special character.
- **bcrypt cost factor:** 12 (≈250ms per hash — secure against brute force, acceptable for UX).
- **Account lockout:** 5 failed attempts triggers 30-minute lockout. Notification email sent on lockout.
- **Session fixation:** `req.session.regenerate()` called on every login.
- **Concurrent sessions:** Tracked; visible in account security panel.
- **Secure cookies:** `httpOnly`, `secure` (production), `sameSite: 'lax'`.
- **Password reset:** Time-limited tokens (1 hour), bcrypt-hashed in DB, single-use.
- **Email enumeration prevention:** Forgot password always returns same response regardless of whether email exists.

### 14.6 File Upload Security

```javascript
// config/multer.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/temp/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
    }
    cb(null, true);
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,  // 5MB max
        files: 10,                    // Max 10 files per upload
    }
});
```

After upload, all images are processed through Sharp (resize, optimise, strip EXIF metadata):
```javascript
const sharp = require('sharp');

async function processProductImage(inputPath, outputPath) {
    await sharp(inputPath)
        .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .withMetadata(false)        // Strip EXIF (privacy + security)
        .toFile(outputPath);
}
```

### 14.7 PayFast ITN Source Validation

```javascript
async function validateSourceIP(ip) {
    const validIPs = require('../config/payfast').validateIPs;
    // Handle proxied requests (Nginx sets X-Forwarded-For)
    const clientIP = ip.replace('::ffff:', '');
    
    if (!validIPs.includes(clientIP)) {
        logger.warn('PayFast ITN from invalid IP', { ip: clientIP });
        return false;
    }
    return true;
}
```

---

## 15. Rate Limiting Strategy

```javascript
// config/rateLimit.js
const rateLimit = require('express-rate-limit');

// General API rate limit
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,      // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// Authentication rate limit (strict)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.body.email || req.ip,
    message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});

// Password reset (very strict)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,      // 1 hour
    max: 3,
    keyGenerator: (req) => req.body.email || req.ip,
    message: { error: 'Too many password reset requests.' }
});

// Search autocomplete
const autocompleteLimiter = rateLimit({
    windowMs: 60 * 1000,            // 1 minute
    max: 60,
});

// Checkout / order creation
const checkoutLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.session?.userId || req.ip,
    message: { error: 'Too many checkout attempts.' }
});

// Admin actions
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    keyGenerator: (req) => req.session?.userId || req.ip,
});

// PayFast ITN webhook (allow PayFast's IPs generously)
const itnLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
});

module.exports = {
    generalLimiter, authLimiter, passwordResetLimiter,
    autocompleteLimiter, checkoutLimiter, adminLimiter, itnLimiter
};
```

**Applied in routes:**
```javascript
// routes/auth.js
router.post('/login', authLimiter, authValidator.loginRules, authController.login);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

// routes/checkout.js
router.post('/review', checkoutLimiter, isAuthenticated, checkoutController.review);
```

---

## 16. Error Handling & Resilience

### 16.1 Global Error Handler

```javascript
// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
    logger.error('Unhandled error', {
        err: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        userId: req.session?.userId,
        ip: req.ip,
    });
    
    // CSRF token error
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).render('errors/403', {
            message: 'Invalid form submission. Please try again.'
        });
    }
    
    // Validation error
    if (err.type === 'ValidationError') {
        return res.status(422).render('errors/422', { errors: err.errors });
    }
    
    // Stock error
    if (err.type === 'StockError') {
        req.flash('error', err.message);
        return res.redirect('/cart');
    }
    
    // PayFast payment conflict
    if (err.type === 'IdempotencyConflict') {
        return res.status(409).json({ error: err.message });
    }
    
    const status = err.status || err.statusCode || 500;
    
    // Don't leak stack traces in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong. Our team has been notified.'
        : err.message;
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(status).json({ error: message });
    }
    
    res.status(status).render(`errors/${status === 404 ? 404 : 500}`, { message });
};
```

### 16.2 Database Connection Resilience

```javascript
// config/database.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },    // Neon requires SSL
    max: 20,                               // Max pool connections
    min: 2,                               // Min idle connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: false,
});

pool.on('error', (err, client) => {
    logger.error('Unexpected PostgreSQL pool error', { err });
});

pool.on('connect', () => {
    logger.debug('New PostgreSQL connection established');
});

module.exports = { pool };
```

### 16.3 Async Error Wrapper

```javascript
// utils/catchAsync.js
// Wraps async controller functions to forward errors to express error handler
module.exports = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Usage:
router.get('/checkout', catchAsync(checkoutController.showReview));
```

### 16.4 Network Failure Handling (Client-Side)

```javascript
// public/js/checkout.js
async function submitCheckout(event) {
    event.preventDefault();
    const btn = document.getElementById('checkout-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    // Show loading overlay immediately
    showLoadingOverlay();
    
    try {
        const response = await fetch('/checkout/create-order', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('[name="_csrf"]').value
            },
            body: JSON.stringify(collectFormData()),
            signal: AbortSignal.timeout(30000),   // 30s timeout
        });
        
        if (response.status === 409) {
            // Idempotency conflict — order may already exist, redirect to orders
            window.location.href = '/orders?notice=duplicate';
            return;
        }
        
        if (!response.ok) throw new Error('Order creation failed');
        
        const { payfastData, payfastUrl } = await response.json();
        
        // Build and submit PayFast form
        submitPayfastForm(payfastData, payfastUrl);
        
    } catch (err) {
        hideLoadingOverlay();
        btn.disabled = false;
        btn.textContent = 'Proceed to Payment';
        
        if (err.name === 'TimeoutError') {
            showError('The request timed out. Please check your connection and try again.');
        } else {
            showError('Something went wrong. Your card has NOT been charged. Please try again.');
        }
    }
}
```

---

## 17. EJS Views & Frontend Architecture

### 17.1 Template Conventions

**No layouts are used.** Every page is a self-contained `.ejs` file that includes partials explicitly. This provides full control over each page's `<head>` content, scripts, and body structure.

```html

<%- include('partials/head', { 
    title: 'Page Title | Maison Luxe',
    description: 'Meta description',
    extraCss: ['product.css']   // Optional page-specific CSS
}) %>


  <%- include('partials/nav') %>
  <%- include('partials/flash') %>
  
  
    
  
  
  <%- include('partials/footer') %>
  
  
    

```

### 17.2 CSS Architecture (No Framework)

CSS is written in semantic, component-scoped vanilla CSS with CSS Custom Properties for theming.

```css
/* public/css/global.css */
:root {
    /* Brand Palette */
    --color-black:          #0a0a0a;
    --color-off-white:      #f8f6f1;
    --color-warm-white:     #fdfaf5;
    --color-champagne:      #e8d9b5;
    --color-gold:           #c9a96e;
    --color-gold-dark:      #9a7a4a;
    --color-charcoal:       #2c2c2c;
    --color-grey-light:     #e8e4de;
    --color-grey-medium:    #9e9690;
    --color-error:          #c0392b;
    --color-success:        #27ae60;
    --color-warning:        #e67e22;
    
    /* Typography */
    --font-serif:           'Cormorant Garamond', Georgia, serif;
    --font-sans:            'Montserrat', 'Helvetica Neue', sans-serif;
    --font-body-size:       16px;
    --font-small:           13px;
    --line-height-base:     1.6;
    
    /* Spacing */
    --space-xs:     4px;
    --space-sm:     8px;
    --space-md:     16px;
    --space-lg:     24px;
    --space-xl:     40px;
    --space-2xl:    64px;
    --space-3xl:    96px;
    
    /* Layout */
    --container-max:    1320px;
    --container-pad:    24px;
    --nav-height:       72px;
    
    /* Effects */
    --transition-base:  200ms ease;
    --transition-slow:  400ms ease;
    --shadow-card:      0 2px 20px rgba(0,0,0,0.06);
    --shadow-hover:     0 8px 40px rgba(0,0,0,0.12);
    --border-radius:    2px;            /* Minimal radius for luxury feel */
    --border-light:     1px solid var(--color-grey-light);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: var(--font-sans);
    font-size: var(--font-body-size);
    line-height: var(--line-height-base);
    color: var(--color-charcoal);
    background-color: var(--color-warm-white);
    -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
    font-family: var(--font-serif);
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: 0.02em;
    color: var(--color-black);
}
```

### 17.3 Locals Middleware

Injected before every render:
```javascript
// middleware/locals.js
module.exports = async (req, res, next) => {
    res.locals.user = req.session?.user || null;
    res.locals.isOwner = req.session?.user?.role === 'owner';
    res.locals.isAuthenticated = !!req.session?.user;
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
    
    // Cart item count (for nav badge)
    res.locals.cartCount = await cartService.getCount(
        req.session?.user?.id, 
        req.sessionID
    );
    
    // Flash messages
    res.locals.flash = {
        success: req.flash('success'),
        error: req.flash('error'),
        info: req.flash('info'),
    };
    
    // Store settings (cached)
    res.locals.store = await settingsService.getCached();
    
    // Page nonce for CSP
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    
    next();
};
```

---

## 18. API Route Reference

### 18.1 Public Routes

|
 Method 
|
 Path 
|
 Controller 
|
 Description 
|
|
--------
|
------
|
-----------
|
-------------
|
|
 GET 
|
`/`
|
 shopController.getLanding 
|
 Landing page 
|
|
 GET 
|
`/shop`
|
 shopController.getShop 
|
 Browse all products 
|
|
 GET 
|
`/category/:slug`
|
 categoryController.get 
|
 Category page 
|
|
 GET 
|
`/category/:slug/:subslug`
|
 categoryController.getSub 
|
 Subcategory page 
|
|
 GET 
|
`/products/:slug`
|
 productController.getDetail 
|
 Product detail 
|
|
 GET 
|
`/search`
|
 searchController.results 
|
 Search results 
|
|
 GET 
|
`/search/autocomplete`
|
 searchController.autocomplete 
|
 Live search 
|
|
 GET 
|
`/collections/:slug`
|
 collectionController.get 
|
 Collection page 
|
|
 GET 
|
`/about`
|
 pageController.about 
|
 About page 
|
|
 GET 
|
`/contact`
|
 pageController.contact 
|
 Contact page 
|
|
 POST 
|
`/contact`
|
 pageController.submitContact 
|
 Contact form 
|
|
 GET 
|
`/faq`
|
 pageController.faq 
|
 FAQ page 
|

### 18.2 Auth Routes

|
 Method 
|
 Path 
|
 Middleware 
|
 Description 
|
|
--------
|
------
|
-----------
|
-------------
|
|
 GET 
|
`/auth/login`
|
 guestOnly 
|
 Login page 
|
|
 POST 
|
`/auth/login`
|
 authLimiter 
|
 Process login 
|
|
 GET 
|
`/auth/register`
|
 guestOnly 
|
 Register page 
|
|
 POST 
|
`/auth/register`
|
 authLimiter 
|
 Process registration 
|
|
 GET 
|
`/auth/logout`
|
 isAuthenticated 
|
 Logout 
|
|
 GET 
|
`/auth/verify-email`
|
 — 
|
 Email verification link 
|
|
 GET 
|
`/auth/forgot-password`
|
 — 
|
 Forgot password page 
|
|
 POST 
|
`/auth/forgot-password`
|
 passwordResetLimiter 
|
 Request reset 
|
|
 GET 
|
`/auth/reset-password`
|
 — 
|
 Reset password form 
|
|
 POST 
|
`/auth/reset-password`
|
 — 
|
 Set new password 
|

### 18.3 Cart Routes

|
 Method 
|
 Path 
|
 Middleware 
|
 Description 
|
|
--------
|
------
|
-----------
|
-------------
|
|
 GET 
|
`/cart`
|
 — 
|
 View cart 
|
|
 POST 
|
`/cart/add`
|
 — 
|
 Add item (AJAX or form) 
|
|
 PATCH 
|
`/cart/update`
|
 — 
|
 Update quantity (AJAX) 
|
|
 DELETE 
|
`/cart/remove/:variantId`
|
 — 
|
 Remove item (AJAX) 
|
|
 POST 
|
`/cart/merge`
|
 isAuthenticated 
|
 Merge guest cart on login 
|

### 18.4 Checkout Routes

|
 Method 
|
 Path 
|
 Middleware 
|
 Description 
|
|
--------
|
------
|
-----------
|
-------------
|
|
 GET 
|
`/checkout`
|
 isAuthenticated 
|
 Address step 
|
|
 POST 
|
`/checkout/address`
|
 isAuthenticated 
|
 Save address, go to review 
|
|
 GET 
|
`/checkout/review`
|
 isAuthenticated 
|
 Review order step 
|
|
 POST 
|
`/checkout/create-order`
|
 isAuthenticated, checkoutLimiter 
|
 Create order + reserve stock 
|
|
 GET 
|
`/checkout/processing`
|
 isAuthenticated 
|
 Redirect to PayFast 
|

### 18.5 Payment Routes

|
 Method 
|
 Path 
|
 Middleware 
|
 Description 
|
|
--------
|
------
|
-----------
|
-------------
|
|
 GET 
|
`/payment/return`
|
 — 
|
 PayFast return URL (success) 
|
|
 GET 
|
`/payment/cancel`
|
 — 
|
 PayFast cancel URL 
|
|
 POST 
|
`/payment/notify`
|
 itnLimiter 
|
 PayFast ITN webhook 
|

### 18.6 Account Routes

|
 Method 
|
 Path 
|
 Middleware 
|
 Description 
|
|
--------
|
------
|
-----------
|
-------------
|
|
 GET 
|
`/account`
|
 isAuthenticated 
|
 Account dashboard 
|
|
 GET 
|
`/account/profile`
|
 isAuthenticated 
|
 Profile edit 
|
|
 POST 
|
`/account/profile`
|
 isAuthenticated 
|
 Update profile 
|
|
 GET 
|
`/account/addresses`
|
 isAuthenticated 
|
 Saved addresses 
|
|
 POST 
|
`/account/addresses`
|
 isAuthenticated 
|
 Add address 
|
|
 PUT 
|
`/account/addresses/:id`
|
 isAuthenticated 
|
 Edit address 
|
|
 DELETE 
|
`/account/addresses/:id`
|
 isAuthenticated 
|
 Delete address 
|
|
 GET 
|
`/account/security`
|
 isAuthenticated 
|
 Security settings 
|
|
 POST 
|
`/account/security/password`
|
 isAuthenticated 
|
 Change password 
|
|
 GET 
|
`/orders`
|
 isAuthenticated 
|
 Order history 
|
|
 GET 
|
`/orders/:uuid`
|
 isAuthenticated 
|
 Order detail 
|

### 18.7 Admin Routes (all require `isOwner` middleware)

|
 Method 
|
 Path 
|
 Description 
|
|
--------
|
------
|
-------------
|
|
 GET 
|
`/admin`
|
 Dashboard overview 
|
|
 GET 
|
`/admin/products`
|
 Product list 
|
|
 GET 
|
`/admin/products/create`
|
 New product form 
|
|
 POST 
|
`/admin/products`
|
 Create product 
|
|
 GET 
|
`/admin/products/:id/edit`
|
 Edit product form 
|
|
 PUT 
|
`/admin/products/:id`
|
 Update product 
|
|
 DELETE 
|
`/admin/products/:id`
|
 Delete product 
|
|
 POST 
|
`/admin/products/:id/images`
|
 Upload images 
|
|
 DELETE 
|
`/admin/products/:id/images/:imageId`
|
 Delete image 
|
|
 GET 
|
`/admin/categories`
|
 Category list 
|
|
 POST 
|
`/admin/categories`
|
 Create category 
|
|
 PUT 
|
`/admin/categories/:id`
|
 Update category 
|
|
 DELETE 
|
`/admin/categories/:id`
|
 Delete category 
|
|
 GET 
|
`/admin/orders`
|
 Order list 
|
|
 GET 
|
`/admin/orders/:id`
|
 Order detail 
|
|
 PUT 
|
`/admin/orders/:id/status`
|
 Update order status 
|
|
 POST 
|
`/admin/orders/:id/tracking`
|
 Add tracking 
|
|
 GET 
|
`/admin/customers`
|
 Customer list 
|
|
 GET 
|
`/admin/customers/:id`
|
 Customer detail 
|
|
 GET 
|
`/admin/inventory`
|
 Stock dashboard 
|
|
 POST 
|
`/admin/inventory/adjust`
|
 Adjust stock 
|
|
 GET 
|
`/admin/analytics`
|
 Analytics dashboard 
|
|
 GET 
|
`/admin/settings`
|
 Store settings 
|
|
 POST 
|
`/admin/settings`
|
 Update settings 
|
|
 GET 
|
`/admin/discounts`
|
 Discount codes list 
|
|
 POST 
|
`/admin/discounts`
|
 Create discount code 
|
|
 PUT 
|
`/admin/discounts/:id`
|
 Update discount code 
|

---

## 19. Middleware Stack

```javascript
// app.js — middleware in order of execution

// 1. Security headers
app.use(helmet({ /* ... see 14.1 */ }));

// 2. Trust proxy (if behind Nginx/Render)
app.set('trust proxy', 1);

// 3. HTTP request logger
app.use(morgan('combined', { stream: logger.stream }));

// 4. Static file serving
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',           // Cache static assets
    etag: true,
}));

// 5. Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Cookie parser
app.use(cookieParser());

// 7. Session
app.use(sessionMiddleware);

// 8. CSRF protection (after session)
app.use(csrfProtection);

// 9. Flash messages
app.use(flash());

// 10. Inject common locals (user, cart count, flash, store settings)
app.use(localsMiddleware);

// 11. General rate limit
app.use(generalLimiter);

// 12. Template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 13. Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/shop', shopRouter);
// ... etc.

// 14. 404 handler
app.use(notFoundHandler);

// 15. Global error handler (must be last, 4 args)
app.use(errorHandler);
```

---

## 20. Environment Configuration

```bash
# .env.example — copy to .env and fill in values

# ─── Server ───────────────────────────────────
NODE_ENV=development                 # 'production' in prod
PORT=3000
BASE_URL=http://localhost:3000       # Full public URL

# ─── Security ─────────────────────────────────
SESSION_SECRET=<64-char-random-string>
CSRF_SECRET=<32-char-random-string>

# ─── Database (Neon PostgreSQL) ───────────────
DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require

# ─── Email (Gmail) ────────────────────────────
GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx   # Gmail App Password

# ─── PayFast ──────────────────────────────────
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn        # Optional, but recommended
PAYFAST_SANDBOX=true                    # false in production

# ─── Uploads ──────────────────────────────────
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE_MB=5

# ─── Business Config ──────────────────────────
FREE_SHIPPING_THRESHOLD=2500            # ZAR amount for free shipping
DEFAULT_SHIPPING_COST=150               # ZAR flat rate
STOCK_RESERVATION_MINUTES=15           # How long holds last
LOYALTY_POINTS_PER_RAND=1              # Points earned per ZAR spent
ABANDONED_CART_HOURS=2                 # Hours before abandoned cart email

# ─── Logging ──────────────────────────────────
LOG_LEVEL=info                          # error|warn|info|debug

# ─── Admin ────────────────────────────────────
ADMIN_EMAIL=admin@yourstore.com
```

---

## 21. Luxury UX & Experience Standards

These are non-negotiable standards that distinguish a luxury platform from a generic e-commerce template.

### 21.1 Visual Identity
- Serif typeface (Cormorant Garamond) for all headings — conveys heritage and elegance
- Sans-serif (Montserrat) for body text — clean and legible at all sizes
- Restrained colour palette: near-black, warm whites, champagne, and gold accent
- Generous whitespace — content breathes; never crowded
- Micro-animations: button state transitions, card hover effects, page load reveals
- Hover states on product cards: secondary image cross-fades in on hover

### 21.2 Performance as Luxury
- Lighthouse score target: 90+ on all pages
- Lazy-loaded images with blur-up placeholder (low-res base64 inline, then full image)
- CSS `aspect-ratio` on image containers to prevent layout shift
- No render-blocking JavaScript — all scripts deferred
- Critical CSS inlined in `<head>` for above-the-fold content
- Product images served in WebP with JPEG fallback
- Font subsetting (only include characters used in brand name)

### 21.3 Interaction Design
- Every action has immediate visual feedback (spinner, success animation)
- Error messages appear inline next to the field — never as generic alerts
- Progress indicators on multi-step checkout
- Sticky cart summary on checkout/review pages
- "Add to Cart" confirmation: slide-in mini-cart from right (non-blocking)
- Size guide opens in modal overlay, not new page
- Image zoom on hover (not on click) — desktop only, pinch-zoom on mobile
- Quantity stepper with +/- buttons (not raw text input)

### 21.4 Mobile-First Responsive Design
- Navigation: hamburger menu with full-screen overlay on mobile
- Product grid: 1 col (mobile) → 2 col (tablet) → 3-4 col (desktop)
- Filters: slide-up bottom drawer on mobile
- Touch targets: minimum 48x48px
- Swipe gestures on product image gallery
- Sticky "Add to Cart" bar at bottom of screen on mobile product page

### 21.5 Luxury-Specific Features
- **Editorial Collections** — Curated product groups with campaign photography and storytelling copy, not just product lists.
- **"The Journal"** — Brand editorial content (trend reports, style guides, care guides). Positions Maison Luxe as an authority, not just a retailer.
- **Personalisation** — Recommendations based on purchase/browse history. "Because You Bought X..." and "Complete the Look" sections.
- **Loyalty Programme** — Tiered (Bronze → Silver → Gold → Platinum) with visible tier benefits and progress tracker in account dashboard. Points earned per ZAR spent, redeemable for discounts.
- **Back-in-Stock Notifications** — On OOS product pages, email capture form. Triggered when stock restocked.
- **Gift Messaging** — Option in checkout to add gift message (printed on packing slip).
- **Verified Purchase Badges** — Reviews only accepted from customers who purchased the product. Badge displayed prominently.
- **Product Storytelling** — Designer Notes field on each product for brand narrative about the piece's inspiration, craftsmanship, or history.
- **Certificate of Authenticity** — Downloadable PDF generated post-purchase for high-value items.
- **Size Guide Modals** — Per-category (clothing: UK/EU/US/IT sizing charts; shoes: EU/UK/US; bags: dimensions diagram).
- **"Recently Viewed"** — Persistent across sessions for authenticated users (stored in DB), localStorage for guests.
- **"Complete the Look"** — Manually curated by owner: product A → suggests Products B, C, D.
- **Announcement Bar** — Configurable from admin. Rotating messages with close button.

### 21.6 Trust Signals
- Payment security badges in cart and checkout footer
- SSL padlock indicator in checkout header
- "100% Authentic Guarantee" badge on all product pages
- Customer review count and aggregate rating
- Secure order confirmation email with order number
- Real-time order status tracking page
- Dedicated returns policy page (easy to find in footer)
- Physical address and phone number in footer (legitimacy signal)

---

## 22. Performance Optimization

### 22.1 Database Performance
- All foreign key columns are indexed
- Full-text search uses GIN-indexed `tsvector` column (precomputed via trigger)
- Product listing query avoids N+1 via JOINs and `GROUP BY`
- Session store uses PostgreSQL with indexed `expire` column for efficient cleanup
- Neon's connection pooler (PgBouncer) handles connection multiplexing
- Frequently read store settings are cached in memory (TTL: 5 minutes)
- Category tree is cached (TTL: 10 minutes) since it rarely changes

```javascript
// Simple in-memory cache with TTL
class SimpleCache {
    constructor() { this.store = new Map(); }
    
    set(key, value, ttlSeconds) {
        this.store.set(key, { 
            value, 
            expiresAt: Date.now() + (ttlSeconds * 1000) 
        });
    }
    
    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
        return entry.value;
    }
    
    invalidate(key) { this.store.delete(key); }
}

module.exports = new SimpleCache();
```

### 22.2 Image Optimization
- Sharp resizes product images to standard sizes on upload: 400px (card), 800px (gallery), 1200px (zoom)
- WebP output with JPEG fallback
- `srcset` and `sizes` attributes for responsive image loading
- All images served with `Cache-Control: public, max-age=31536000` (1 year, immutable)

### 22.3 Frontend Performance
- CSS loaded in `<head>` (no render blocking)
- JS loaded at end of `<body>` or as `defer`
- External fonts loaded with `font-display: swap`
- Critical images (above fold) use `loading="eager"`, all others `loading="lazy"`
- No jQuery or heavy front-end libraries
- Cart updates use lightweight `fetch()` API calls

---

## 23. Deployment Considerations

### 23.1 Recommended Hosting
- **Render.com** — Free tier supports Node.js, easy environment variable management, built-in TLS
- **Railway.app** — Simple Node.js deployment, persistent file storage
- **Fly.io** — Global edge deployment, excellent for low-latency

### 23.2 Neon Database
- Use Neon's branching feature: `main` for production, `dev` branch for development
- Connection string includes `?sslmode=require` — mandatory for Neon
- Set `max` pool connections to match Neon plan limit (free tier: 25 connections)
- Use Neon's built-in connection pooler endpoint for the application (port 5432 pooled)

### 23.3 Environment Separation
```
Production:
  NODE_ENV=production
  PAYFAST_SANDBOX=false
  Neon: main branch
  Gmail: production app password

Development:
  NODE_ENV=development  
  PAYFAST_SANDBOX=true
  Neon: dev branch
  Gmail: test account or Mailtrap
```

### 23.4 File Storage in Production
Local disk storage is not persistent on most PaaS providers (Render, Fly). Options:
- **Cloudinary** (recommended): Free tier, built-in CDN, image transformations on URL
- **AWS S3 + CloudFront**
- **Backblaze B2**

If using Cloudinary, update `imageService.js` to upload via the Cloudinary SDK and store returned `secure_url` in the database.

### 23.5 PM2 Configuration (Self-Hosted)
```json
// ecosystem.config.js
{
  "apps": [{
    "name": "maison-luxe",
    "script": "server.js",
    "instances": "max",         
    "exec_mode": "cluster",
    "env_production": {
      "NODE_ENV": "production",
      "PORT": 3000
    },
    "max_memory_restart": "512M",
    "error_file": "logs/pm2-error.log",
    "out_file": "logs/pm2-out.log"
  }]
}
```

---

## 24. Testing Strategy

### 24.1 Testing Layers

**Unit Tests** — Individual service and utility functions:
- `generateSignature()` — correct MD5 output
- `calculateTotals()` — price math with discounts and VAT
- `validateITNSignature()` — accepts valid, rejects tampered
- `stockService.validateAndHold()` — correct reservation logic

**Integration Tests** — Route handlers with test database:
- Registration, login, password reset flows
- Cart add/update/remove
- Checkout order creation (with and without race conditions)
- PayFast ITN processing (including duplicate handling)
- Admin CRUD operations

**E2E Tests** (optional, Playwright):
- Full purchase flow: browse → add to cart → checkout → payment → confirmation
- Admin: create product → publish → verify visible in shop

### 24.2 Testing PayFast in Sandbox

1. Set `PAYFAST_SANDBOX=true`
2. Use PayFast sandbox credentials (available at sandbox.payfast.co.za)
3. Use PayFast test cards (Visa: 4000000000000002)
4. For ITN testing locally, use ngrok to expose localhost to the internet:
   ```bash
   ngrok http 3000
   # Set NOTIFY_URL to ngrok URL in checkout
   ```

---

## 25. Future Roadmap

|
 Feature 
|
 Priority 
|
 Notes 
|
|
---------
|
----------
|
-------
|
|
 Wishlist sharing 
|
 Medium 
|
 Public UUID-based URL 
|
|
 "Complete the Look" 
|
 High 
|
 Manual admin curation tool 
|
|
 Multi-currency display 
|
 Medium 
|
 Display in USD/EUR, charge ZAR 
|
|
 Apple Pay / Google Pay 
|
 High 
|
 Via PayFast's wallet support 
|
|
 WhatsApp order notifications 
|
 Medium 
|
 Twilio WhatsApp API 
|
|
 Affiliate/referral programme 
|
 Low 
|
 Track referral code conversions 
|
|
 Product comparison 
|
 Low 
|
 Side-by-side spec comparison 
|
|
 Live chat widget 
|
 Medium 
|
 Embed Crisp/Tawk.to 
|
|
 Subscription boxes 
|
 Low 
|
 Monthly luxury curations 
|
|
 Virtual try-on (AR) 
|
 Future 
|
 WebXR for accessories 
|
|
 Product video support 
|
 Medium 
|
 Upload/embed product videos 
|
|
 Abandoned cart recovery 
|
 High 
|
 2h cron + email with cart contents 
|
|
 Advanced analytics (GA4) 
|
 Medium 
|
 Server-side events 
|
|
 Inventory CSV import 
|
 Medium 
|
 Bulk stock/product onboarding 
|
|
 Gift cards 
|
 Medium 
|
 Stored value, redeemable at checkout 
|
|
 Two-factor authentication 
|
 High 
|
 TOTP via authenticator app 
|
|
 Loyalty points redemption at checkout 
|
 High 
|
 Deduct from order total 
|

---

## Appendix A: Database Migration Order

Run migrations in this order on a fresh database:
```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009 → 010 → 011 → 012 → 013 → 014 → 015 → 016
```

Dependencies:
- `users` must exist before `addresses`, `cart_items`, `wishlists`, `orders`, `reviews`
- `categories` must exist before `products`
- `products` must exist before `product_variants`, `product_images`, `collections`
- `product_variants` must exist before `cart_items`, `stock_reservations`, `order_items`
- `orders` must exist before `order_items`, `order_status_history`
- `discount_codes` must exist before `orders` (FK reference)

---

## Appendix B: Key npm Packages

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "pg": "^8.11.0",
    "connect-pg-simple": "^9.0.0",
    "express-session": "^1.17.3",
    "bcrypt": "^5.1.0",
    "csurf": "^1.11.0",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.1.0",
    "express-validator": "^7.0.1",
    "nodemailer": "^6.9.4",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.4",
    "morgan": "^1.10.0",
    "winston": "^3.10.0",
    "node-cron": "^3.0.2",
    "uuid": "^9.0.0",
    "dayjs": "^1.11.9",
    "connect-flash": "^0.1.1",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.3.1",
    "sanitize-html": "^2.11.0",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "supertest": "^6.3.3"
  }
}
```

---

## Appendix C: Glossary

|
 Term 
|
 Definition 
|
|
------
|
-----------
|
|
 ITN 
|
 Instant Transaction Notification — PayFast's server-to-server payment confirmation 
|
|
 Idempotency Key 
|
 A unique token per request that ensures retried requests produce the same result without side effects 
|
|
 Stock Reservation 
|
 A temporary hold on inventory units during active checkout, preventing overselling 
|
|
 CSRF 
|
 Cross-Site Request Forgery — attack where malicious sites trick browsers into making authenticated requests 
|
|
 CSP 
|
 Content Security Policy — HTTP header restricting resource origins to prevent XSS 
|
|
 tsvector 
|
 PostgreSQL data type storing pre-processed lexemes for full-text search 
|
|
 GIN Index 
|
 Generalized Inverted Index — PostgreSQL index type optimised for tsvector and array columns 
|
|
 pgBouncer 
|
 Connection pooler used by Neon to multiplex app connections to PostgreSQL 
|
|
 EJS Partial 
|
 Reusable template fragment included with 
`<%- include('path') %>`
|
|
 Loyalty Tier 
|
 Customer classification (Bronze/Silver/Gold/Platinum) based on lifetime spend 
|
|
 PGS 
|
 Parameterised Query Substitution — 
`$1, $2`
 placeholders in 
`pg`
 that prevent SQL injection 
|
|
 Compare-at Price 
|
 The original or crossed-out price shown alongside a discounted price 
|
|
 VAT-inclusive 
|
 Product prices include 15% South African VAT 
|
|
 Stock Hold 
|
 Synonym for Stock Reservation 
|
|
 Flash Message 
|
 One-time session message displayed after redirect (success/error notifications) 
|

---

*Document maintained by: Senior Engineering Team, Maison Luxe*
*Last Updated: 2024*
*Classification: Internal Engineering Reference*