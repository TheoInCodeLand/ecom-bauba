'use strict';

/**
 * Build pagination metadata
 * @param {number} total   - total number of records
 * @param {number} page    - current page (1-based)
 * @param {number} limit   - records per page
 * @returns {{ page, limit, totalPages, offset, hasPrev, hasNext }}
 */
function paginate(total, page = 1, limit = 24) {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit) || 24));
    const totalPages = Math.ceil(total / l);
    return {
        page:       p,
        limit:      l,
        total,
        totalPages,
        offset:     (p - 1) * l,
        hasPrev:    p > 1,
        hasNext:    p < totalPages,
        prevPage:   p - 1,
        nextPage:   p + 1,
    };
}

module.exports = paginate;
