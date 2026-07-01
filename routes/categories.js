'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const categoryModel = require('../models/categoryModel');
const productModel  = require('../models/productModel');
const paginate      = require('../utils/paginate');

router.get(/(.*)/, catchAsync(async (req, res) => {
    // req.params[0] gives the whole path, e.g. "/women/clothing/tops"
    const pathSegments = req.params[0].split('/').filter(Boolean);
    if (pathSegments.length === 0) return res.redirect('/shop');

    const targetSlug = pathSegments[pathSegments.length - 1];
    const category = await categoryModel.findBySlug(targetSlug);
    
    if (!category) {
        return res.status(404).render('errors/404', { title: '404 | Maison Luxe', message: 'Category not found' });
    }

    const { sort='newest', page=1, minPrice, maxPrice } = req.query;
    const pag = paginate(0, page, 24);
    
    const { products, total } = await productModel.browse({ 
        categoryId: category.id, 
        sort, 
        minPrice, 
        maxPrice, 
        limit:24, 
        offset: pag.offset 
    });
    
    const pagination  = paginate(total, page, 24);
    const children    = await categoryModel.getChildren(category.id);
    const breadcrumb  = await categoryModel.getBreadcrumb(category.id);

    res.render('category', {
        title:      `${category.name} | Maison Luxe`,
        description: category.description || `Shop ${category.name} at Maison Luxe`,
        category, products, pagination, children, breadcrumb, total,
        filters: { sort, minPrice, maxPrice },
    });
}));

module.exports = router;
