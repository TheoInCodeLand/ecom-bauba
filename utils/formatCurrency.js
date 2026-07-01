'use strict';
/**
 * Format a number as South African Rand (ZAR)
 * @param {number} amount
 * @returns {string} e.g. "R 1 299.00"
 */
function formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
    }).format(Number(amount));
}

module.exports = formatCurrency;
