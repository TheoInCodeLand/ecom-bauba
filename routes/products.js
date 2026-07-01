'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../utils/catchAsync');
const productModel  = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const reviewModel   = require('../models/reviewModel');
const wishlistModel = require('../models/wishlistModel');

router.get('/:slug', catchAsync(async (req, res) => {
    const product = await productModel.findBySlug(req.params.slug);
    if (!product || !product.is_active) {
        return res.status(404).render('errors/404', { title: '404 | Maison Luxe', message: 'Product not found' });
    }

    const [images, variants, reviews, ratingDist, related, breadcrumb] = await Promise.all([
        productModel.getImages(product.id),
        productModel.getVariants(product.id),
        reviewModel.getForProduct(product.id),
        reviewModel.getRatingDistribution(product.id),
        productModel.getRelated(product.id, product.category_id, 4),
        categoryModel.getBreadcrumb(product.category_id),
    ]);

    const isWishlisted = await wishlistModel.isWishlisted(req.session?.user?.id, product.id);

    // Increment view count async
    productModel.incrementViews(product.id).catch(() => {});

    const primaryImage = images.find(i => i.is_primary) || images[0];

    res.render('product-detail', {
        title:       `${product.name}${product.brand ? ' | ' + product.brand : ''} | Maison Luxe`,
        description: product.short_description || product.description?.slice(0, 160),
        product,
        images,
        variants,
        variantsJson: JSON.stringify(variants),
        reviews,
        ratingDist,
        related,
        breadcrumb,
        isWishlisted,
        primaryImage,
    });
}));

module.exports = router;
