'use strict';
const { pool } = require('../config/database');

(async () => {
    // Show all recent orders
    const { rows } = await pool.query(
        `SELECT id, order_number, status, payment_status, total_amount, created_at
         FROM orders ORDER BY created_at DESC LIMIT 10`
    );
    console.log('\nRecent orders:');
    console.table(rows);

    // If you pass an order ID as argument, mark it paid
    const orderId = process.argv[2];
    if (orderId) {
        await pool.query(
            `UPDATE orders
             SET status='processing', payment_status='paid', paid_at=NOW(), updated_at=NOW()
             WHERE id=$1`,
            [orderId]
        );
        console.log(`\n✓ Order ${orderId} marked as paid/processing.`);
    } else {
        console.log('\nTo mark an order as paid, run:');
        console.log('  node scripts/mark-paid.js <order_id>');
    }

    await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
