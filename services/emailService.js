'use strict';
const transporter  = require('../config/mailer');
const fs           = require('fs');
const path         = require('path');
const logger       = require('../config/logger');
const formatCurrency = require('../utils/formatCurrency');
const dayjs        = require('dayjs');

function loadTemplate(name) {
    const p = path.join(__dirname, '..', 'emails', 'templates', `${name}.html`);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
}

function render(template, vars) {
    let html = template;
    Object.entries(vars).forEach(([k, v]) => {
        html = html.replace(new RegExp(`{{${k}}}`, 'g'), v ?? '');
    });
    return html;
}

async function send(to, subject, html) {
    if (!process.env.GMAIL_USER) {
        logger.warn(`Email skipped (no Gmail config): ${subject} → ${to}`);
        return;
    }
    try {
        await transporter.sendMail({
            from:    `"Maison Luxe" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
            text: html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        });
        logger.info(`Email sent: ${subject} → ${to}`);
    } catch (err) {
        logger.error(`Email failed: ${subject} → ${to}`, { err: err.message });
    }
}

const emailService = {
    async sendWelcome(user) {
        const tmpl = loadTemplate('welcome');
        if (!tmpl) return;
        const html = render(tmpl, {
            firstName: user.first_name,
            email:     user.email,
            storeUrl:  process.env.BASE_URL || 'http://localhost:3000',
        });
        await send(user.email, 'Welcome to Maison Luxe ✨', html);
    },

    async sendVerifyEmail(user, token) {
        const url  = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
        const tmpl = loadTemplate('verify-email');
        const html = tmpl
            ? render(tmpl, { firstName: user.first_name, verifyUrl: url })
            : `<p>Hi ${user.first_name},</p><p>Please verify your email: <a href="${url}">${url}</a></p>`;
        await send(user.email, 'Please verify your Maison Luxe email', html);
    },

    async sendPasswordReset(user, token) {
        const url  = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}&id=${user.id}`;
        const tmpl = loadTemplate('password-reset');
        const html = tmpl
            ? render(tmpl, { firstName: user.first_name, resetUrl: url })
            : `<p>Hi ${user.first_name},</p><p>Reset your password: <a href="${url}">${url}</a></p><p>This link expires in 1 hour.</p>`;
        await send(user.email, 'Reset your Maison Luxe password', html);
    },

    async sendOrderConfirmation(order, items) {
        const tmpl = loadTemplate('order-confirmation');
        const itemsHtml = (items || []).map(i =>
            `<tr><td>${i.product_name}</td><td>${i.variant_description||''}</td><td>${i.quantity}</td><td>${formatCurrency(i.unit_price)}</td></tr>`
        ).join('');
        const html = tmpl
            ? render(tmpl, {
                firstName:   order.shipping_first_name,
                orderNumber: order.order_number,
                orderDate:   dayjs(order.created_at).format('DD MMM YYYY'),
                items:       itemsHtml,
                subtotal:    formatCurrency(order.subtotal),
                shipping:    formatCurrency(order.shipping_cost),
                total:       formatCurrency(order.total_amount),
                trackingUrl: `${process.env.BASE_URL}/orders/${order.uuid}`,
            })
            : `<p>Hi ${order.shipping_first_name}, your order #${order.order_number} is confirmed! Total: ${formatCurrency(order.total_amount)}</p>`;
        await send(order.user_email, `Your Maison Luxe Order #${order.order_number} is Confirmed ✓`, html);
    },

    async sendOrderStatusUpdate(order, status, trackingNumber = null) {
        const subjects = {
            processing:    `Your order #${order.order_number} is being prepared`,
            ready_to_ship: `Your order #${order.order_number} is ready to ship`,
            shipped:       `Your order #${order.order_number} has been shipped`,
            delivered:     `Your order #${order.order_number} has been delivered`,
            cancelled:     `Your order #${order.order_number} has been cancelled`,
        };
        const subject = subjects[status] || `Update on your order #${order.order_number}`;
        const html = `
            <div style="font-family:sans-serif;max-width:600px;margin:auto">
                <h2 style="color:#0a0a0a">Order Update</h2>
                <p>Hi ${order.shipping_first_name},</p>
                <p>Your order <strong>#${order.order_number}</strong> status: <strong>${status.replace(/_/g,' ').toUpperCase()}</strong></p>
                ${trackingNumber ? `<p>Tracking: <strong>${trackingNumber}</strong></p>` : ''}
                <p><a href="${process.env.BASE_URL}/orders/${order.uuid}" style="background:#c9a96e;color:#fff;padding:12px 24px;text-decoration:none;border-radius:2px">View Order</a></p>
                <p>— Maison Luxe Team</p>
            </div>`;
        await send(order.user_email, subject, html);
    },

    async sendPasswordChanged(user) {
        const html = `<div style="font-family:sans-serif;max-width:600px;margin:auto"><p>Hi ${user.first_name},</p><p>Your Maison Luxe password has been successfully changed.</p><p>If you didn't make this change, contact us immediately.</p></div>`;
        await send(user.email, 'Your Maison Luxe password has been changed', html);
    },
};

module.exports = emailService;
