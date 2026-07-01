# Admin Flows — Full Audit & Fix Plan

## Summary

After a full inspection of the project, the backend infrastructure (DB, models, routes) is in good shape. The main gaps are all in the **admin UI layer** — specifically the product variant management which exists in the DB/model but has zero UI. Additionally, several minor bugs and missing features exist across admin pages.

---

## Issues Found

### 🔴 Critical — Variant Management (No UI at All)
The DB (`product_variants`, `variant_attributes`) and model (`addVariant`, `addVariantAttribute`, `getVariants`) fully support multi-variant products (Size, Colour, etc.), but:
- The product `form.ejs` has **no variants section** — you can never add/edit variants from the admin
- The `routes/admin/products.js` has **no POST endpoints** for creating/updating/deleting variants
- This is the biggest missing feature

### 🔴 Critical — Inventory page: `p.total_stock` vs `stock_total`
The `list.ejs` for products references `p.total_stock` (line 56–57) but the DB query alias is `stock_total`. Will show 0 for all products.

### 🟡 Medium — Categories: No Edit functionality
The categories page has a "Delete" button but **no inline edit form**. You can create and delete but not update/rename a category.

### 🟡 Medium — Inventory page: missing `product_id` on variant model query
The `getLowStock()` query returns `pv.id` as `item.id`, and `inventory.ejs` builds an edit link as `/admin/products/<%= item.product_id %>/edit` but the model doesn't return `product_id` separately (it's `pv.product_id` in SQL but the `SELECT` only uses aliases).

Actually checking: the SQL does `JOIN products p ON p.id=pv.product_id` and selects `p.name AS product_name, p.slug AS product_slug` — but does NOT select `pv.product_id` explicitly. So `item.product_id` in the template is **undefined**.

### 🟡 Medium — CSRF token missing on inventory `/adjust` POST  
The `adjustStock` JS function in `inventory.ejs` sends a JSON POST but doesn't include the CSRF token. This will fail if CSRF middleware is active on that route.

### 🟢 Minor — Products list: no variant count shown  
The product list shows total stock via subquery but no indicator of how many variants a product has.

### 🟢 Minor — Dashboard `stats` field names mismatch
`getRecentStats()` returns `today_count`, `pending_count` etc., but `dashboard.ejs` references `stats.total_orders` and `stats.pending_orders` which don't exist in the query.

### 🟢 Minor — `getRecentStats` missing `total_orders`
The stats query calculates `today_count`, `today_revenue`, `pending_count`, `processing_count`, `shipped_count`, `month_revenue` — but the dashboard widget asks for `stats.total_orders` which is missing.

---

## Proposed Changes

### 1. Fix `list.ejs` stock column name mismatch
#### [MODIFY] [list.ejs](file:///c:/Users/22033/Desktop/com/views/admin/products/list.ejs)
Change `p.total_stock` → `p.stock_total` (lines 56–57).

### 2. Fix `getLowStock` to include `product_id`
#### [MODIFY] [productModel.js](file:///c:/Users/22033/Desktop/com/models/productModel.js)
Add `pv.product_id` to the SELECT in `getLowStock()`.

### 3. Fix dashboard stats field name mismatch
#### [MODIFY] [orderModel.js](file:///c:/Users/22033/Desktop/com/models/orderModel.js)
Add `COUNT(*) AS total_orders` and fix `pending_orders` alias in `getRecentStats()`.

### 4. Fix CSRF on inventory adjust  
#### [MODIFY] [inventory.ejs](file:///c:/Users/22033/Desktop/com/views/admin/inventory.ejs)
Add CSRF token to the fetch call (or switch to a form-based approach).

### 5. Add Category Edit functionality
#### [MODIFY] [categories.ejs](file:///c:/Users/22033/Desktop/com/views/admin/categories.ejs)
Add an inline edit modal/panel triggered from each row's Edit button.

### 6. Add full Variant Management UI — the big one
#### [MODIFY] [products/form.ejs](file:///c:/Users/22033/Desktop/com/views/admin/products/form.ejs)
Add a complete "Variants" section below the SEO card that allows:
- Viewing existing variants in a table
- Adding new variants (SKU, attributes like Size/Colour, stock qty, price override)
- Deleting variants

#### [MODIFY] [routes/admin/products.js](file:///c:/Users/22033/Desktop/com/routes/admin/products.js)
Add REST endpoints:
- `POST /admin/products/:id/variants/new` — create a variant + attributes
- `POST /admin/products/:id/variants/:vid/delete` — delete variant
- `POST /admin/products/:id/variants/:vid/update` — update stock/price

### 7. Fix form.ejs missing `variants` on new product
The new product route now passes `images: []` but still doesn't pass `variants: []`. When the variant section is added to form.ejs, this will crash. Pre-emptively fix.
#### [MODIFY] [routes/admin/products.js](file:///c:/Users/22033/Desktop/com/routes/admin/products.js)
Add `variants: []` to the GET `/new` render call.

---

## Verification Plan

### Manual Verification
1. Navigate to `/admin` — dashboard stats show correctly
2. Navigate to `/admin/products` — stock column shows numbers (not 0)
3. Click "Add Product" — form loads without errors, variants section present
4. Create a product, then go to edit — can add a Size variant (e.g. S/M/L) with stock qty
5. Navigate to `/admin/inventory` — low stock items show with working Edit links and ±1 buttons
6. Navigate to `/admin/categories` — can create, edit, and delete categories
7. Navigate to `/admin/orders` — lists orders correctly
8. Navigate to `/admin/customers` — lists customers correctly
