'use strict';
const { pool } = require('../config/database');
const cache    = require('../utils/cache');

const categoryModel = {
    async getAll() {
        const { rows } = await pool.query(
            `SELECT c.*, p.name AS parent_name
             FROM categories c
             LEFT JOIN categories p ON p.id = c.parent_id
             ORDER BY c.position ASC, c.name ASC`
        );
        return rows;
    },

    async getTopLevel() {
        const { rows } = await pool.query(
            `SELECT c.*, 
                    (SELECT COUNT(*)::int FROM products p WHERE p.category_id IN (
                        WITH RECURSIVE ct AS (SELECT id FROM categories WHERE id=c.id UNION ALL SELECT ch.id FROM categories ch JOIN ct ON ch.parent_id=ct.id)
                        SELECT id FROM ct
                    ) AND p.is_active=TRUE) AS product_count
             FROM categories c WHERE c.parent_id IS NULL AND c.is_active=TRUE
             ORDER BY c.position ASC, c.name ASC`
        );
        return rows;
    },

    async getChildren(parentId) {
        const { rows } = await pool.query(
            'SELECT * FROM categories WHERE parent_id=$1 AND is_active=TRUE ORDER BY position ASC, name ASC',
            [parentId]
        );
        return rows;
    },

    async findBySlug(slug) {
        const { rows } = await pool.query('SELECT * FROM categories WHERE slug=$1 LIMIT 1', [slug]);
        return rows[0] || null;
    },

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM categories WHERE id=$1 LIMIT 1', [id]);
        return rows[0] || null;
    },

    async getTree() {
        let tree = cache.get('category_tree');
        if (tree) return tree;

        const { rows } = await pool.query(
            'SELECT * FROM categories WHERE is_active=TRUE ORDER BY position ASC, name ASC'
        );
        // Build tree
        const map = {};
        rows.forEach(c => { map[c.id] = { ...c, children: [] }; });
        tree = [];
        rows.forEach(c => {
            if (c.parent_id && map[c.parent_id]) {
                map[c.parent_id].children.push(map[c.id]);
            } else if (!c.parent_id) {
                tree.push(map[c.id]);
            }
        });
        cache.set('category_tree', tree, 600); // 10 min
        return tree;
    },

    async getBreadcrumb(categoryId) {
        const crumbs = [];
        let current = await this.findById(categoryId);
        while (current) {
            crumbs.unshift(current);
            if (current.parent_id) {
                current = await this.findById(current.parent_id);
            } else {
                break;
            }
        }
        return crumbs;
    },

    async create(data) {
        const { parentId, name, slug, description, imageUrl, position, isActive, showInNav } = data;
        const { rows } = await pool.query(
            `INSERT INTO categories (parent_id,name,slug,description,image_url,position,is_active,show_in_nav)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [parentId||null, name, slug, description||null, imageUrl||null, position||0, isActive!==false, showInNav!==false]
        );
        cache.invalidate('category_tree');
        return rows[0];
    },

    async update(id, data) {
        const { parentId, name, slug, description, imageUrl, position, isActive, showInNav } = data;
        const { rows } = await pool.query(
            `UPDATE categories SET parent_id=$2,name=$3,slug=$4,description=$5,image_url=$6,
             position=$7,is_active=$8,show_in_nav=$9,updated_at=NOW() WHERE id=$1 RETURNING *`,
            [id, parentId||null, name, slug, description||null, imageUrl||null, position||0, !!isActive, !!showInNav]
        );
        cache.invalidate('category_tree');
        return rows[0];
    },

    async delete(id) {
        await pool.query('DELETE FROM categories WHERE id=$1', [id]);
        cache.invalidate('category_tree');
    },

    async getNavCategories() {
        let nav = cache.get('nav_categories');
        if (nav) return nav;
        const { rows } = await pool.query(
            'SELECT * FROM categories WHERE show_in_nav=TRUE AND is_active=TRUE ORDER BY position ASC, name ASC'
        );
        cache.set('nav_categories', rows, 300);
        return rows;
    },
};

module.exports = categoryModel;
