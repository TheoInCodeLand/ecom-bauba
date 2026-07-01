'use strict';
const express = require('express');
const router  = express.Router();
const { isOwner } = require('../../middleware/auth');
const { adminLimiter } = require('../../config/rateLimit');

router.use(isOwner);
router.use(adminLimiter);

router.use('/',             require('./dashboard'));
router.use('/products',     require('./products'));
router.use('/categories',   require('./categories'));
router.use('/orders',       require('./orders'));
router.use('/customers',    require('./customers'));
router.use('/inventory',    require('./inventory'));
router.use('/settings',     require('./settings'));

module.exports = router;
