'use strict';
const slugify = require('slugify');

/**
 * Generate a URL-safe slug from a string
 * @param {string} text
 * @returns {string}
 */
function generateSlug(text) {
    return slugify(text, {
        lower: true,
        strict: true,
        trim: true,
    });
}

module.exports = generateSlug;
