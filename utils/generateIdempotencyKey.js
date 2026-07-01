'use strict';
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate an idempotency key from context
 * @param {string} context - e.g. 'checkout', 'order'
 * @param {*} payload - extra data to hash
 * @returns {string}
 */
function generateIdempotencyKey(context = '', payload = '') {
    const hash = crypto
        .createHash('sha256')
        .update(String(payload))
        .digest('hex')
        .slice(0, 12);
    return `${uuidv4()}-${context}-${hash}`;
}

module.exports = generateIdempotencyKey;
