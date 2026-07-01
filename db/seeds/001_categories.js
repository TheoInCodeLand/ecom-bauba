'use strict';
require('dotenv').config();
const { pool } = require('../../config/database');
const generateSlug = require('../../utils/generateSlug');

const taxonomy = [
    {
        name: 'Women',
        children: [
            {
                name: 'Clothing',
                children: ['Dresses', 'Tops', 'Pants', 'Skirts']
            },
            {
                name: 'Shoes',
                children: ['Heels', 'Sneakers', 'Boots']
            },
            {
                name: 'Accessories',
                children: ['Bags', 'Jewelry', 'Sunglasses']
            }
        ]
    },
    {
        name: 'Men',
        children: [
            {
                name: 'Clothing',
                children: ['T-shirts', 'Hoodies', 'Pants', 'Suits']
            },
            {
                name: 'Shoes',
                children: ['Boots', 'Sneakers', 'Dress Shoes']
            }
        ]
    },
    {
        name: 'Kids',
        children: [
            {
                name: 'Boys',
                children: ['T-shirts', 'Shorts']
            },
            {
                name: 'Girls',
                children: ['Dresses', 'Leggings']
            }
        ]
    },
    {
        name: 'Sale',
        children: []
    },
    {
        name: 'New Arrivals',
        children: []
    }
];

async function insertCategory(name, parentId, position = 0, parentSlug = '') {
    let slug = generateSlug(name);
    if (parentSlug) slug = `${parentSlug}-${slug}`;
    const { rows } = await pool.query(
        `INSERT INTO categories (parent_id, name, slug, position) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
         RETURNING id, slug`,
        [parentId, name, slug, position]
    );
    return rows[0];
}

async function run() {
    console.log('Seeding categories...');
    try {
        let deptPos = 0;
        for (const dept of taxonomy) {
            console.log(`- Department: ${dept.name}`);
            const { id: deptId, slug: deptSlug } = await insertCategory(dept.name, null, deptPos++);
            
            let catPos = 0;
            for (const cat of dept.children) {
                console.log(`  - Category: ${cat.name}`);
                const { id: catId, slug: catSlug } = await insertCategory(cat.name, deptId, catPos++, deptSlug);
                
                let subPos = 0;
                for (const sub of cat.children) {
                    console.log(`    - Subcategory: ${sub}`);
                    await insertCategory(sub, catId, subPos++, catSlug);
                }
            }
        }
        console.log('Category seeding completed successfully.');
    } catch (err) {
        console.error('Error seeding categories:', err);
    } finally {
        await pool.end();
    }
}

run();
