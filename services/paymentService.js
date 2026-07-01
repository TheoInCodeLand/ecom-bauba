'use strict';
const crypto = require('crypto');
const dns = require('dns').promises;
const config = require('../config/payfast');
const { generateSignature } = require('../utils/payfastSignature');

// PayFast publishes their IPs as DNS A-records on these hostnames.
// Resolve at runtime instead of hardcoding, since PayFast's network
// has migrated to AWS (July 2025) and IPs can change again.
// See: https://support.payfast.help/portal/en/kb/articles/what-ip-addresses-does-payfast-use-20-9-2022
const PAYFAST_IP_HOSTS = [
    'www.payfast.co.za',
    'api.payfast.co.za',
    'ips.payfast.co.za',
    'w1w.payfast.co.za',
    'w2w.payfast.co.za',
];

// Cache resolved IPs for 5 minutes to avoid a DNS lookup on every ITN.
let _ipCache = { ips: new Set(), expiresAt: 0 };

async function resolvePayFastIPs() {
    const now = Date.now();
    if (now < _ipCache.expiresAt && _ipCache.ips.size > 0) {
        return _ipCache.ips;
    }

    const results = await Promise.allSettled(
        PAYFAST_IP_HOSTS.map(host => dns.resolve4(host))
    );

    const ips = new Set();
    for (const r of results) {
        if (r.status === 'fulfilled') r.value.forEach(ip => ips.add(ip));
    }

    if (ips.size > 0) {
        _ipCache = { ips, expiresAt: now + 5 * 60 * 1000 };
    }

    return ips;
}

const paymentService = {
    /**
     * Build the payload for a PayFast standard (redirect) integration.
     * Empty optional fields are omitted so they are excluded from the
     * signature string — including them as '' causes signature mismatch.
     */
    buildPayload(order, returnUrls) {
        const data = {
            merchant_id: config.merchantId,
            merchant_key: config.merchantKey,
            return_url: returnUrls.return,
            cancel_url: returnUrls.cancel,
            notify_url: returnUrls.notify,
            m_payment_id: order.uuid,
            amount: parseFloat(order.total_amount).toFixed(2),
            item_name: `Maison Luxe Order ${order.order_number}`,
        };

        // Only add optional fields when they have a value — empty strings
        // must not appear in the signature string.
        if (order.shipping_first_name) data.name_first = order.shipping_first_name;
        if (order.shipping_last_name) data.name_last = order.shipping_last_name;
        if (order.user_email) data.email_address = order.user_email;
        if (order.order_number) data.item_description = `Order #${order.order_number}`;
        if (order.id) data.custom_int1 = String(order.id);
        if (order.idempotency_key) data.custom_str1 = order.idempotency_key;
        if (order.user_email) {
            data.email_confirmation = '1';
            data.confirmation_address = order.user_email;
        }

        data.signature = generateSignature(data, config.passphrase);
        return { payfastData: data, payfastUrl: config.baseUrl };
    },

    /**
     * Validate an incoming ITN notification.
     * PayFast requires all four checks:
     *   1. Valid signature
     *   2. Valid source IP
     *   3. Payment amount matches expected order amount
     *   4. payment_status === 'COMPLETE'
     *
     * This method handles (1) and (4). Checks (2) and (3) are exposed
     * as separate async methods so the controller can run them against
     * its own data and respond with the correct HTTP status per check.
     */
    validateITN(body) {
        // Check 4: payment must be complete
        if (body.payment_status !== 'COMPLETE') {
            return false;
        }

        // Check 1: signature
        const { signature, ...rest } = body;
        const expected = generateSignature(rest, config.passphrase);
        try {
            return crypto.timingSafeEqual(
                Buffer.from(signature, 'utf8'),
                Buffer.from(expected, 'utf8')
            );
        } catch {
            return false;
        }
    },

    /**
     * Check 2: verify the ITN came from a PayFast IP.
     * Resolves PayFast's published DNS hostnames at runtime so the list
     * stays accurate as their infrastructure changes.
     */
    async validateSourceIP(ip) {
        const clean = (ip || '').replace('::ffff:', '').trim();
        const validIPs = await resolvePayFastIPs();
        return validIPs.has(clean);
    },

    /**
     * Check 3: verify the ITN amount matches the order's stored total.
     * Call this in your ITN controller after loading the order from DB.
     *
     * @param {string|number} itnAmount   - body.amount from PayFast ITN
     * @param {string|number} orderAmount - order.total_amount from your DB
     */
    validateAmount(itnAmount, orderAmount) {
        return parseFloat(itnAmount).toFixed(2) === parseFloat(orderAmount).toFixed(2);
    },
};

module.exports = paymentService;
