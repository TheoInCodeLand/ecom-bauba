'use strict';
require('dotenv').config();
const { pool } = require('./config/database');
const productModel = require('./models/productModel');

async function test() {
  try {
    const total = await productModel.adminCount('', null);
    console.log('Total products (adminCount):', total);

    const products = await productModel.adminList({ limit: 20, offset: 0, search: '', isActive: null });
    console.log('Products returned (adminList):', products.length);
    if (products.length > 0) {
      console.log('First product:', JSON.stringify(products[0], null, 2));
    } else {
      console.log('No products found in DB!');
    }
  } catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
  process.exit(0);
}
test();
