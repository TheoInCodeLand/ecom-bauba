'use strict';
const crypto = require('crypto');

/**
 * Build the outbound PayFast MD5 signature (payment initiation).
 * Uses a fixed key order as required by PayFast for the payment form.
 */
function generateSignature(data, passphrase = '') {
    const orderedKeys = [
        'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
        'name_first', 'name_last', 'email_address', 'm_payment_id', 'amount',
        'item_name', 'item_description', 'custom_int1', 'custom_str1',
        'email_confirmation', 'confirmation_address',
    ];

    const pairs = orderedKeys
        .filter(k => data[k] !== undefined && data[k] !== '' && data[k] !== null)
        .map(k => `${k}=${encodeURIComponent(String(data[k]).trim()).replace(/%20/g, '+')}`);

    if (passphrase) {
        pairs.push(`passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`);
    }

    const str = pairs.join('&');
    return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Build the ITN signature from the raw body PayFast POSTed.
 * IMPORTANT: must use ALL fields in the order they were received,
 * excluding only the 'signature' field itself.
 * Empty-string values are excluded per PayFast spec.
 *
 * @param {Object} body       - req.body from the ITN POST (all fields)
 * @param {string} passphrase - PayFast passphrase
 * @returns {string} MD5 hex signature
 */
function generateITNSignature(body, passphrase = '') {
    const pairs = Object.keys(body)
        .filter(k => k !== 'signature' && body[k] !== '' && body[k] !== null && body[k] !== undefined)
        .map(k => `${k}=${encodeURIComponent(String(body[k]).trim()).replace(/%20/g, '+')}`);

    if (passphrase) {
        pairs.push(`passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`);
    }

    const str = pairs.join('&');
    return crypto.createHash('md5').update(str).digest('hex');
}

module.exports = { generateSignature, generateITNSignature };
