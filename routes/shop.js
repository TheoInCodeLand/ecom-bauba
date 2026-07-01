'use strict';
const express  = require('express');
const router   = express.Router();
const catchAsync = require('../utils/catchAsync');
const productModel  = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const paginate  = require('../utils/paginate');

router.get('/', catchAsync(async (req, res) => {
    const { sort='newest', page=1, minPrice, maxPrice, colour, size, category } = req.query;
    const limit = 24;
    const pag   = paginate(0, page, limit);

    let categoryId = null;
    let categoryObj = null;
    if (category) {
        categoryObj = await categoryModel.findBySlug(category);
        if (categoryObj) categoryId = categoryObj.id;
    }

    const colours = colour ? (Array.isArray(colour) ? colour : [colour]) : null;
    const sizes   = size   ? (Array.isArray(size)   ? size   : [size])   : null;

    const { products, total } = await productModel.browse({
        categoryId, minPrice, maxPrice, colours, sizes, sort,
        limit, offset: pag.offset,
    });

    const pagination = paginate(total, page, limit);
    const categories = await categoryModel.getTopLevel();

    res.render('shop', {
        title:      'Shop | Maison Luxe',
        description:'Browse our curated collection of luxury bags, clothing, shoes and jewellery.',
        products,
        pagination,
        categories,
        category:   categoryObj,
        filters:    { sort, minPrice, maxPrice, colour, size },
        total,
    });
}));

module.exports = router;
