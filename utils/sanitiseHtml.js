'use strict';
const sanitizeHtml = require('sanitize-html');

const allowedTags = [
    'p','br','strong','em','u','s','ul','ol','li',
    'h2','h3','h4','blockquote','a','span','div',
];

const allowedAttributes = {
    'a': ['href', 'title', 'target'],
    'span': ['class'],
    'div':  ['class'],
};

/**
 * Strip dangerous HTML, allow safe formatting tags
 * @param {string} dirty - raw HTML input
 * @returns {string} sanitised HTML
 */
function sanitiseHtml(dirty) {
    if (!dirty) return '';
    return sanitizeHtml(dirty, {
        allowedTags,
        allowedAttributes,
        allowedSchemes: ['https', 'http', 'mailto'],
    });
}

module.exports = sanitiseHtml;
