'use strict';
const express    = require('express');
const router     = express.Router();
const catchAsync = require('../../utils/catchAsync');
const categoryModel = require('../../models/categoryModel');
const generateSlug  = require('../../utils/generateSlug');

router.get('/', catchAsync(async (req, res) => {
    const tree = await categoryModel.getTree();
    
    // Flatten tree and compute depth/tier
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

    res.render('admin/categories', { title: 'Categories | Admin', categories: flatCategories });
}));

router.post('/new', catchAsync(async (req, res) => {
    const { name, parentId, description, position, isActive, showInNav } = req.body;
    const slug = generateSlug(name);
    await categoryModel.create({ parentId: parentId||null, name, slug, description, position: parseInt(position)||0, isActive: isActive==='on', showInNav: showInNav==='on' });
    req.flash('success', `Category "${name}" created.`);
    res.redirect('/admin/categories');
}));

router.post('/:id/update', catchAsync(async (req, res) => {
    const { name, parentId, description, position, isActive, showInNav } = req.body;
    const slug = generateSlug(name);
    await categoryModel.update(req.params.id, { parentId: parentId||null, name, slug, description, position: parseInt(position)||0, isActive: isActive==='on', showInNav: showInNav==='on' });
    req.flash('success', 'Category updated.');
    res.redirect('/admin/categories');
}));

router.post('/:id/delete', catchAsync(async (req, res) => {
    await categoryModel.delete(req.params.id);
    req.flash('success', 'Category deleted.');
    res.redirect('/admin/categories');
}));

module.exports = router;
