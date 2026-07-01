'use strict';
const express = require('express');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');
const productModel = require('../../models/productModel');
const categoryModel = require('../../models/categoryModel');
const multerConfig = require('../../config/multer');
const cloudinary = require('../../config/cloudinary');
const sharp = require('sharp');
const generateSlug = require('../../utils/generateSlug');
const sanitiseHtml = require('../../utils/sanitiseHtml');
const paginate = require('../../utils/paginate');
const formatCurrency = require('../../utils/formatCurrency');
const { pool } = require('../../config/database');

function uploadBufferToCloudinary(buffer, options) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        stream.end(buffer);
    });
}

async function processImage(file, productId) {
    const buffer = await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

    const filename = `product-${productId}-${Date.now()}`;
    const result = await uploadBufferToCloudinary(buffer, {
        folder: 'maison-luxe/products',
        public_id: filename,
        format: 'webp',
    });

    return result.secure_url;
}

// ─── List ──────────────────────────────────────────────────────────────────
router.get('/', catchAsync(async (req, res) => {
    const { page = 1, search = '', status } = req.query;
    const isActive = status === 'active' ? true : status === 'inactive' ? false : null;
    const total = await productModel.adminCount(search, isActive);
    const pag = paginate(total, page, 20);
    const products = await productModel.adminList({ limit: 20, offset: pag.offset, search, isActive });
    res.render('admin/products/list', {
        title: 'Products | Admin',
        products, pagination: pag, search, status, formatCurrency,
    });
}));

// ─── New ───────────────────────────────────────────────────────────────────
router.get('/new', catchAsync(async (req, res) => {
    const tree = await categoryModel.getTree();
    const flatCategories = [];
    function flatten(nodes, depth) {
        nodes.forEach(node => {
            flatCategories.push({ ...node, depth });
            if (node.children && node.children.length) {
                flatten(node.children, depth + 1);
            }
        });
    }
    flatten(tree, 0);

    res.render('admin/products/form', {
        title: 'Add Product | Admin',
        product: null, categories: flatCategories, formatCurrency, images: [], variants: [],
    });
}));

router.post('/new', multerConfig.array('images', 10), catchAsync(async (req, res) => {
    const { name, categoryId, brand, basePrice, compareAtPrice, shortDescription,
        description, isActive, isFeatured, isNewArrival, isBestseller, isLimitedEdition,
        tags, metaTitle, metaDescription, materialDetails, careInstructions,
        fitAndSizing, originCountry, designerNotes } = req.body;

    const slug = generateSlug(name);
    const sanitised = sanitiseHtml(description || '');

    const product = await productModel.create({
        categoryId: parseInt(categoryId), name, slug, brand, shortDescription,
        description: sanitised, materialDetails, careInstructions, fitAndSizing, originCountry, designerNotes,
        basePrice: parseFloat(basePrice), compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        isActive: isActive === 'on', isFeatured: isFeatured === 'on', isNewArrival: isNewArrival === 'on',
        isBestseller: isBestseller === 'on', isLimitedEdition: isLimitedEdition === 'on',
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        metaTitle, metaDescription,
    });

    // Process uploaded images
    if (req.files?.length) {
        for (let i = 0; i < req.files.length; i++) {
            const url = await processImage(req.files[i], product.id);
            await productModel.addImage(product.id, url, name, i === 0, i);
        }
    }

    req.flash('success', `Product "${name}" created.`);
    res.redirect(`/admin/products/${product.id}/edit`);
}));

// ─── Edit ──────────────────────────────────────────────────────────────────
router.get('/:id/edit', catchAsync(async (req, res) => {
    const tree = await categoryModel.getTree();
    const flatCategories = [];
    function flatten(nodes, depth) {
        nodes.forEach(node => {
            flatCategories.push({ ...node, depth });
            if (node.children && node.children.length) {
                flatten(node.children, depth + 1);
            }
        });
    }
    flatten(tree, 0);

    const product = await productModel.findById(req.params.id);
    if (!product) { req.flash('error', 'Product not found'); return res.redirect('/admin/products'); }
    const [images, variants] = await Promise.all([
        productModel.getImages(product.id),
        productModel.getVariantsAdmin(product.id),
    ]);
    res.render('admin/products/form', {
        title: `Edit: ${product.name} | Admin`,
        product, categories: flatCategories, images, variants, formatCurrency,
    });
}));

router.post('/:id/edit', multerConfig.array('images', 10), catchAsync(async (req, res) => {
    const { name, categoryId, brand, basePrice, compareAtPrice, shortDescription,
        description, isActive, isFeatured, isNewArrival, isBestseller, isLimitedEdition,
        tags, metaTitle, metaDescription, materialDetails, careInstructions,
        fitAndSizing, originCountry, designerNotes } = req.body;

    const slug = generateSlug(name);
    const sanitised = sanitiseHtml(description || '');
    await productModel.update(req.params.id, {
        categoryId: parseInt(categoryId), name, slug, brand, shortDescription,
        description: sanitised, materialDetails, careInstructions, fitAndSizing, originCountry, designerNotes,
        basePrice: parseFloat(basePrice), compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        isActive: isActive === 'on', isFeatured: isFeatured === 'on', isNewArrival: isNewArrival === 'on',
        isBestseller: isBestseller === 'on', isLimitedEdition: isLimitedEdition === 'on',
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        metaTitle, metaDescription,
    });

    if (req.files?.length) {
        for (let i = 0; i < req.files.length; i++) {
            const url = await processImage(req.files[i], req.params.id);
            await productModel.addImage(req.params.id, url, name, false, 99 + i);
        }
    }

    req.flash('success', 'Product updated.');
    res.redirect(`/admin/products/${req.params.id}/edit`);
}));

// ─── Toggle Active ─────────────────────────────────────────────────────────
router.post('/:id/toggle', catchAsync(async (req, res) => {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    await productModel.toggleActive(product.id, !product.is_active);
    res.json({ success: true, isActive: !product.is_active });
}));

// ─── Delete Image ─────────────────────────────────────────────────────────
router.post('/:id/images/:imgId/delete', catchAsync(async (req, res) => {
    await productModel.deleteImage(req.params.imgId, req.params.id);
    req.flash('success', 'Image deleted.');
    res.redirect(`/admin/products/${req.params.id}/edit`);
}));

// ─── Set Primary Image ────────────────────────────────────────────────────
router.post('/:id/images/:imgId/primary', catchAsync(async (req, res) => {
    await pool.query('UPDATE product_images SET is_primary=FALSE WHERE product_id=$1', [req.params.id]);
    await pool.query('UPDATE product_images SET is_primary=TRUE WHERE id=$1 AND product_id=$2', [req.params.imgId, req.params.id]);
    req.flash('success', 'Primary image updated.');
    res.redirect(`/admin/products/${req.params.id}/edit`);
}));

// ─── Variants: Add ────────────────────────────────────────────────────────
router.post('/:id/variants/new', catchAsync(async (req, res) => {
    const productId = parseInt(req.params.id);
    const {
        sku, priceOverride, stockQuantity, lowStockThreshold, position,
        // Dynamic attribute pairs: attrType_0, attrValue_0, attrType_1, attrValue_1 ...
    } = req.body;

    const variant = await productModel.addVariant(productId, {
        sku: sku || null,
        priceOverride: priceOverride ? parseFloat(priceOverride) : null,
        stockQuantity: parseInt(stockQuantity) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 3,
        position: parseInt(position) || 0,
        isActive: true,
    });

    // Process attribute pairs sent as attrType_N / attrValue_N
    const keys = Object.keys(req.body).filter(k => k.startsWith('attrType_'));
    for (const key of keys) {
        const idx = key.split('_')[1];
        const type = req.body[`attrType_${idx}`]?.trim();
        const value = req.body[`attrValue_${idx}`]?.trim();
        if (type && value) {
            await productModel.addVariantAttribute(variant.id, type, value, value, parseInt(idx));
        }
    }

    req.flash('success', 'Variant added.');
    res.redirect(`/admin/products/${productId}/edit`);
}));

// ─── Variants: Update Stock ───────────────────────────────────────────────
router.post('/:id/variants/:vid/stock', catchAsync(async (req, res) => {
    const { quantity } = req.body;
    await pool.query(
        'UPDATE product_variants SET stock_quantity=$1, updated_at=NOW() WHERE id=$2 AND product_id=$3',
        [parseInt(quantity) || 0, req.params.vid, req.params.id]
    );
    req.flash('success', 'Stock updated.');
    res.redirect(`/admin/products/${req.params.id}/edit`);
}));

// ─── Variants: Delete ─────────────────────────────────────────────────────
router.post('/:id/variants/:vid/delete', catchAsync(async (req, res) => {
    await pool.query('DELETE FROM product_variants WHERE id=$1 AND product_id=$2', [req.params.vid, req.params.id]);
    req.flash('success', 'Variant deleted.');
    res.redirect(`/admin/products/${req.params.id}/edit`);
}));

// ─── Delete Product ────────────────────────────────────────────────────────
router.post('/:id/delete', catchAsync(async (req, res) => {
    await productModel.delete(req.params.id);
    req.flash('success', 'Product deleted.');
    res.redirect('/admin/products');
}));

module.exports = router;