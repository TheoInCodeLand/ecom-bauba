'use strict';
const { pool } = require('../config/database');

const productModel = {
    async findBySlug(slug) {
        const { rows } = await pool.query(
            `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
                    c.parent_id AS category_parent_id
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.slug = $1`,
            [slug]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
        return rows[0] || null;
    },

    async getImages(productId) {
        const { rows } = await pool.query(
            'SELECT * FROM product_images WHERE product_id=$1 ORDER BY is_primary DESC, position ASC',
            [productId]
        );
        return rows;
    },

    async getVariants(productId) {
        const { rows } = await pool.query(
            `SELECT pv.*, 
                    COALESCE(pv.price_override, p.base_price) AS effective_price,
                    json_agg(json_build_object(
                        'attribute_type', va.attribute_type,
                        'attribute_value', va.attribute_value,
                        'display_value', va.display_value
                    ) ORDER BY va.position) AS attributes
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             LEFT JOIN variant_attributes va ON va.variant_id = pv.id
             WHERE pv.product_id=$1 AND pv.is_active=TRUE
             GROUP BY pv.id, p.base_price
             ORDER BY pv.position ASC`,
            [productId]
        );
        return rows;
    },

    async getVariantById(variantId) {
        const { rows } = await pool.query(
            `SELECT pv.*, p.name AS product_name, p.slug AS product_slug,
                    COALESCE(pv.price_override, p.base_price) AS effective_price,
                    p.base_price
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             WHERE pv.id = $1`,
            [variantId]
        );
        return rows[0] || null;
    },

    async getVariantsAdmin(productId) {
        const { rows } = await pool.query(
            `SELECT pv.id, pv.sku, pv.price_override, pv.stock_quantity, pv.low_stock_threshold,
                    pv.position, pv.is_active, pv.created_at,
                    COALESCE(pv.price_override, p.base_price) AS effective_price,
                    COALESCE(
                        json_agg(json_build_object(
                            'attribute_type', va.attribute_type,
                            'attribute_value', va.attribute_value
                        ) ORDER BY va.position) FILTER (WHERE va.id IS NOT NULL),
                        '[]'::json
                    ) AS attributes
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             LEFT JOIN variant_attributes va ON va.variant_id = pv.id
             WHERE pv.product_id=$1
             GROUP BY pv.id, p.base_price
             ORDER BY pv.position ASC, pv.id ASC`,
            [productId]
        );
        return rows;
    },

    async getRelated(productId, categoryId, limit = 4) {

        const { rows } = await pool.query(
            `SELECT p.id, p.name, p.slug, p.base_price, p.compare_at_price, p.average_rating,
                    pi.url AS primary_image
             FROM products p
             LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
             WHERE p.is_active=TRUE AND p.category_id=$2 AND p.id != $1
             ORDER BY p.is_featured DESC, p.purchase_count DESC
             LIMIT $3`,
            [productId, categoryId, limit]
        );
        return rows;
    },

    async browse({ categoryId, minPrice, maxPrice, colours, sizes, sort = 'newest', limit = 24, offset = 0, search }) {
        let params = [];
        let conditions = ['p.is_active = TRUE'];

        if (categoryId) {
            params.push(categoryId);
            conditions.push(`p.category_id IN (
                WITH RECURSIVE cat_tree AS (
                    SELECT id FROM categories WHERE id = $${params.length}
                    UNION ALL
                    SELECT c.id FROM categories c JOIN cat_tree ct ON c.parent_id = ct.id
                )
                SELECT id FROM cat_tree
            )`);
        }

        if (minPrice != null) { params.push(minPrice); conditions.push(`p.base_price >= $${params.length}`); }
        if (maxPrice != null) { params.push(maxPrice); conditions.push(`p.base_price <= $${params.length}`); }

        if (colours && colours.length) {
            params.push(colours);
            conditions.push(`EXISTS (
                SELECT 1 FROM variant_attributes va2
                JOIN product_variants pv2 ON va2.variant_id=pv2.id
                WHERE pv2.product_id=p.id AND va2.attribute_type='Colour'
                AND va2.attribute_value = ANY($${params.length})
            )`);
        }

        if (search) {
            params.push(search);
            conditions.push(`p.search_vector @@ plainto_tsquery('english', $${params.length})`);
        }

        const where = conditions.join(' AND ');

        let orderBy;
        switch (sort) {
            case 'price_asc': orderBy = 'p.base_price ASC'; break;
            case 'price_desc': orderBy = 'p.base_price DESC'; break;
            case 'rating': orderBy = 'p.average_rating DESC'; break;
            case 'bestselling': orderBy = 'p.purchase_count DESC'; break;
            default: orderBy = 'p.published_at DESC NULLS LAST, p.id DESC';
        }

        params.push(limit, offset);
        const query = `
            SELECT p.id, p.uuid, p.name, p.slug, p.base_price, p.compare_at_price,
                   p.short_description, p.average_rating, p.review_count,
                   p.is_new_arrival, p.is_bestseller, p.is_limited_edition, p.is_featured,
                   p.brand, p.tags,
                   pi.url AS primary_image,
                   (EXISTS(SELECT 1 FROM product_variants pv3 WHERE pv3.product_id=p.id AND pv3.stock_quantity>0 AND pv3.is_active=TRUE)) AS in_stock
            FROM products p
            LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
            WHERE ${where}
            ORDER BY ${orderBy}
            LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const countQuery = `SELECT COUNT(*)::int AS total FROM products p WHERE ${where}`;

        const [{ rows }, { rows: countRows }] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, params.slice(0, -2)),
        ]);

        return { products: rows, total: countRows[0]?.total || 0 };
    },

    async getNewArrivals(limit = 8) {
        const { rows } = await pool.query(
            `SELECT p.id, p.name, p.slug, p.base_price, p.compare_at_price,
                    p.average_rating, p.is_new_arrival, pi.url AS primary_image
             FROM products p
             LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
             WHERE p.is_active=TRUE AND p.is_new_arrival=TRUE
             ORDER BY p.published_at DESC NULLS LAST
             LIMIT $1`,
            [limit]
        );
        return rows;
    },

    async getBestsellers(limit = 4) {
        const { rows } = await pool.query(
            `SELECT p.id, p.name, p.slug, p.base_price, p.compare_at_price,
                    p.average_rating, p.review_count, pi.url AS primary_image
             FROM products p
             LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
             WHERE p.is_active=TRUE AND p.is_bestseller=TRUE
             ORDER BY p.purchase_count DESC
             LIMIT $1`,
            [limit]
        );
        return rows;
    },

    async getFeatured(limit = 4) {
        const { rows } = await pool.query(
            `SELECT p.id, p.name, p.slug, p.base_price, p.compare_at_price,
                    p.average_rating, pi.url AS primary_image
             FROM products p
             LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
             WHERE p.is_active=TRUE AND p.is_featured=TRUE
             LIMIT $1`,
            [limit]
        );
        return rows;
    },

    async incrementViews(id) {
        await pool.query('UPDATE products SET view_count=view_count+1 WHERE id=$1', [id]);
    },

    // Admin
    async adminList({ limit = 20, offset = 0, search = '', isActive = null }) {
        const params = [];
        let where = '1=1';
        if (search) { params.push(`%${search}%`); where += ` AND (p.name ILIKE $${params.length} OR p.brand ILIKE $${params.length})`; }
        if (isActive !== null) { params.push(isActive); where += ` AND p.is_active=$${params.length}`; }
        params.push(limit, offset);
        const { rows } = await pool.query(
            `SELECT p.id, p.name, p.slug, p.brand, p.base_price, p.is_active,
                    p.is_featured, p.is_new_arrival,
                    c.name AS category_name, p.created_at,
                    pi.url AS primary_image,
                    (SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id=p.id) AS stock_total
             FROM products p
             LEFT JOIN categories c ON c.id=p.category_id
             LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=TRUE
             WHERE ${where}
             ORDER BY p.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );
        return rows;
    },

    async adminCount(search = '', isActive = null) {
        const params = [];
        let where = '1=1';
        if (search) { params.push(`%${search}%`); where += ` AND (name ILIKE $${params.length} OR brand ILIKE $${params.length})`; }
        if (isActive !== null) { params.push(isActive); where += ` AND is_active=$${params.length}`; }
        const { rows } = await pool.query(`SELECT COUNT(*)::int AS cnt FROM products WHERE ${where}`, params);
        return rows[0]?.cnt || 0;
    },

    async create(data, client = pool) {
        const {
            categoryId, name, slug, brand, skuPrefix, shortDescription, description,
            materialDetails, careInstructions, fitAndSizing, originCountry, designerNotes,
            basePrice, compareAtPrice, costPrice, vatInclusive, vatRate,
            weightGrams, isActive, isFeatured, isNewArrival, isBestseller, isLimitedEdition,
            tags, metaTitle, metaDescription
        } = data;
        const { rows } = await client.query(
            `INSERT INTO products (category_id,name,slug,brand,sku_prefix,short_description,description,
             material_details,care_instructions,fit_and_sizing,origin_country,designer_notes,
             base_price,compare_at_price,cost_price,vat_inclusive,vat_rate,weight_grams,
             is_active,is_featured,is_new_arrival,is_bestseller,is_limited_edition,
             tags,meta_title,meta_description,published_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
             CASE WHEN $19 THEN NOW() ELSE NULL END)
             RETURNING *`,
            [categoryId, name, slug, brand || null, skuPrefix || null, shortDescription || null, description || '',
                materialDetails || null, careInstructions || null, fitAndSizing || null, originCountry || null, designerNotes || null,
                basePrice, compareAtPrice || null, costPrice || null, vatInclusive !== false, vatRate || 15, weightGrams || null,
                !!isActive, !!isFeatured, !!isNewArrival, !!isBestseller, !!isLimitedEdition,
                tags || null, metaTitle || null, metaDescription || null]
        );
        return rows[0];
    },

    async update(id, data) {
        const {
            categoryId, name, slug, brand, shortDescription, description,
            materialDetails, careInstructions, basePrice, compareAtPrice, costPrice,
            isActive, isFeatured, isNewArrival, isBestseller, isLimitedEdition,
            tags, metaTitle, metaDescription, designerNotes, fitAndSizing, originCountry
        } = data;
        const { rows } = await pool.query(
            `UPDATE products SET category_id=$2,name=$3,slug=$4,brand=$5,short_description=$6,
             description=$7,material_details=$8,care_instructions=$9,base_price=$10,
             compare_at_price=$11,cost_price=$12,is_active=$13,is_featured=$14,is_new_arrival=$15,
             is_bestseller=$16,is_limited_edition=$17,tags=$18,meta_title=$19,meta_description=$20,
             designer_notes=$21,fit_and_sizing=$22,origin_country=$23,
             published_at=CASE WHEN $13 AND published_at IS NULL THEN NOW() ELSE published_at END,
             updated_at=NOW()
             WHERE id=$1 RETURNING *`,
            [id, categoryId, name, slug, brand || null, shortDescription || null, description || '',
                materialDetails || null, careInstructions || null, basePrice, compareAtPrice || null, costPrice || null,
                !!isActive, !!isFeatured, !!isNewArrival, !!isBestseller, !!isLimitedEdition,
                tags || null, metaTitle || null, metaDescription || null,
                designerNotes || null, fitAndSizing || null, originCountry || null]
        );
        return rows[0];
    },

    async delete(id) {
        await pool.query('DELETE FROM products WHERE id=$1', [id]);
    },

    async toggleActive(id, isActive) {
        await pool.query(
            `UPDATE products SET is_active=$2,
             published_at=CASE WHEN $2 AND published_at IS NULL THEN NOW() ELSE published_at END,
             updated_at=NOW() WHERE id=$1`,
            [id, isActive]
        );
    },

    // Variants admin
    async addVariant(productId, data, client = pool) {
        const { sku, priceOverride, stockQuantity, lowStockThreshold, weightGrams, imageUrl, position, isActive } = data;
        const { rows } = await client.query(
            `INSERT INTO product_variants (product_id,sku,price_override,stock_quantity,low_stock_threshold,weight_grams,image_url,position,is_active)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [productId, sku || null, priceOverride || null, stockQuantity || 0, lowStockThreshold || 3, weightGrams || null, imageUrl || null, position || 0, isActive !== false]
        );
        return rows[0];
    },

    async addVariantAttribute(variantId, type, value, displayValue, position = 0, client = pool) {
        await client.query(
            `INSERT INTO variant_attributes (variant_id,attribute_type,attribute_value,display_value,position)
             VALUES ($1,$2,$3,$4,$5) ON CONFLICT (variant_id, attribute_type) DO UPDATE SET attribute_value=$3,display_value=$4`,
            [variantId, type, value, displayValue || null, position]
        );
    },

    async addImage(productId, url, altText, isPrimary, position, variantId = null) {
        if (isPrimary) {
            await pool.query('UPDATE product_images SET is_primary=FALSE WHERE product_id=$1', [productId]);
        }
        const { rows } = await pool.query(
            `INSERT INTO product_images (product_id,variant_id,url,alt_text,is_primary,position)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [productId, variantId || null, url, altText || null, !!isPrimary, position || 0]
        );
        return rows[0];
    },

    async deleteImage(imageId, productId) {
        await pool.query('DELETE FROM product_images WHERE id=$1 AND product_id=$2', [imageId, productId]);
    },

    async getLowStock(threshold = 3) {
        const { rows } = await pool.query(
            `SELECT pv.id, pv.product_id, pv.sku, pv.stock_quantity, pv.low_stock_threshold,
                    p.name AS product_name, p.slug AS product_slug
             FROM product_variants pv
             JOIN products p ON p.id=pv.product_id
             WHERE pv.stock_quantity <= pv.low_stock_threshold AND pv.is_active=TRUE AND p.is_active=TRUE
             ORDER BY pv.stock_quantity ASC`,
            []
        );
        return rows;
    },

    async adjustStock(variantId, delta, client = pool) {
        const { rows } = await client.query(
            `UPDATE product_variants SET stock_quantity = GREATEST(0, stock_quantity + $2), updated_at=NOW()
             WHERE id=$1 RETURNING stock_quantity`,
            [variantId, delta]
        );
        return rows[0]?.stock_quantity;
    },
};

module.exports = productModel;