'use strict';

module.exports = {
    merchantId:  process.env.PAYFAST_MERCHANT_ID  || '10000100',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
    passphrase:  process.env.PAYFAST_PASSPHRASE   || 'jt7NOE43FZPn',
    isSandbox:   process.env.PAYFAST_SANDBOX === 'true',
    get baseUrl() {
        return this.isSandbox
            ? 'https://sandbox.payfast.co.za/eng/process'
            : 'https://www.payfast.co.za/eng/process';
    },
    // PayFast valid source IPs (production + sandbox)
    validateIPs: [
        '197.97.145.144',
        '197.97.145.145',
        '197.97.145.146',
        '197.97.145.147',
        '197.97.145.148',
        '197.97.145.149',
        // For local sandbox testing allow 127.0.0.1
        '127.0.0.1',
        '::1',
        '::ffff:127.0.0.1',
    ],
};
