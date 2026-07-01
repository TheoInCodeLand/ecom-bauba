'use strict';
const { pool } = require('../config/database');

const auditModel = {
    async log(action, entityType, entityId, newValues, client = pool, extra = {}) {
        try {
            await client.query(
                `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, ip_address, metadata)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [extra.userId||null, action, entityType||null, entityId||null,
                 newValues ? JSON.stringify(newValues) : null,
                 extra.ip||null, extra.metadata ? JSON.stringify(extra.metadata) : null]
            );
        } catch {
            // Never crash on audit failure
        }
    },

    async getForEntity(entityType, entityId, limit = 20) {
        const { rows } = await pool.query(
            `SELECT a.*, u.first_name, u.last_name FROM audit_log a
             LEFT JOIN users u ON u.id=a.user_id
             WHERE a.entity_type=$1 AND a.entity_id=$2
             ORDER BY a.created_at DESC LIMIT $3`,
            [entityType, entityId, limit]
        );
        return rows;
    },
};

module.exports = auditModel;
