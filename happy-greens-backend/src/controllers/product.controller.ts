import { Request, Response } from 'express';
import { pool } from '../db';
import { getPublicBaseUrl, normalizeMediaUrl } from '../utils/media';
import { buildUnitConfig, normalizeUnit } from '../services/unit-pricing.service';

const parseIntOrDefault = (value: any, fallback: number): number => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parseOptionalInt = (value: any): number | null => {
    if (value === '' || value === undefined || value === null) return null;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const mapProductMedia = (product: any, baseUrl: string) => {
    const config = buildUnitConfig(product);
    return {
        ...product,
        unit: config.unit,
        pricePerUnit: config.pricePerUnit,
        minQty: config.minQty,
        stepQty: config.stepQty,
        image_url: normalizeMediaUrl(product.image_url, baseUrl),
        images: Array.isArray(product.images)
            ? product.images.map((img: any) => normalizeMediaUrl(img, baseUrl))
            : product.images,
    };
};

const sanitizeText = (value: unknown, maxLength: number): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : null;
};

const parsePositiveNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
};

const sanitizeUnitPayload = (value: unknown) => normalizeUnit(value);

const parseQuantityRule = (value: unknown, fallback: number) => {
    if (value === '' || value === undefined || value === null) return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
};

const validateQuantityRules = (unit: string, minQty: number, stepQty: number) => {
    if (unit === 'GRAM' || unit === 'PIECE' || unit === 'DOZEN') {
        if (!Number.isInteger(minQty) || !Number.isInteger(stepQty)) {
            return 'Quantity rules must be whole numbers for grams, dozen, and piece products';
        }
    }
    return null;
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { category, q, page = 1, limit = 10, sort, hasOffer } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const debugProducts = process.env.DEBUG_PRODUCTS === 'true';

        if (debugProducts) {
            console.log(`[products] start page=${page} limit=${limit} admin=${req.query.admin} category=${category ?? 'n/a'} q=${q ?? 'n/a'} sort=${sort ?? 'n/a'} hasOffer=${hasOffer ?? 'n/a'}`);
        }

        let query = `
            SELECT p.*, p.discount_price as "discountPrice", p.is_active as "isActive", 
                   p.price_per_unit as "pricePerUnit", p.min_qty as "minQty", p.step_qty as "stepQty", 
                   c.name as category_name,
                   (SELECT json_agg(json_build_object('id', cats.id, 'name', cats.name, 'slug', cats.slug)) 
                    FROM categories cats WHERE cats.id = ANY(p.category_ids)) as category_tags
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_deleted = false
        `;

        if (req.query.admin !== 'true') {
            query += ' AND p.is_active = true';
        }

        const params: any[] = [];
        let paramCount = 1;

        if (category) {
            const normalizedCategory = String(category).trim().toLowerCase();
            query += ` AND EXISTS (
                SELECT 1
                FROM categories selected_cat
                JOIN categories cat_match
                  ON (cat_match.id = p.category_id OR cat_match.id = ANY(p.category_ids))
                WHERE (LOWER(TRIM(selected_cat.slug)) = $${paramCount}
                       OR LOWER(TRIM(selected_cat.name)) = $${paramCount}
                       OR LOWER(REPLACE(TRIM(selected_cat.name), ' ', '-')) = $${paramCount})
                  AND (cat_match.id = selected_cat.id OR cat_match.parent_id = selected_cat.id)
            )`;
            params.push(normalizedCategory);
            paramCount++;
        }

        if (hasOffer === 'true') {
            query += ` AND p.discount_price IS NOT NULL AND p.discount_price < COALESCE(p.price_per_unit, p.price)`;
        }

        if (q) {
            query += ` AND p.name ILIKE $${paramCount}`;
            params.push(`%${q}%`);
            paramCount++;
        }

        if (hasOffer === 'true') {
            query += ' ORDER BY (COALESCE(p.price_per_unit, p.price) - p.discount_price) DESC, p.created_at DESC';
        } else if (sort === 'price_asc') {
            query += ' ORDER BY COALESCE(p.discount_price, p.price_per_unit, p.price) ASC';
        } else if (sort === 'price_desc') {
            query += ' ORDER BY COALESCE(p.discount_price, p.price_per_unit, p.price) DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        if (debugProducts) {
            console.log(`[products] running main query params=${JSON.stringify(params)}`);
        }
        const result = await pool.query(query, params);
        if (debugProducts) {
            console.log(`[products] main query done rows=${result.rows.length}`);
        }

        let countQuery = 'SELECT COUNT(*) FROM products p WHERE p.is_deleted = false';
        const countParams: any[] = [];
        let countParam = 1;

        if (req.query.admin !== 'true') {
            countQuery += ' AND p.is_active = true';
        }

        if (category) {
            const normalizedCategory = String(category).trim().toLowerCase();
            countQuery += ` AND EXISTS (
                SELECT 1
                FROM categories selected_cat
                JOIN categories cat_match
                  ON (cat_match.id = p.category_id OR cat_match.id = ANY(p.category_ids))
                WHERE (LOWER(TRIM(selected_cat.slug)) = $${countParam}
                       OR LOWER(TRIM(selected_cat.name)) = $${countParam}
                       OR LOWER(REPLACE(TRIM(selected_cat.name), ' ', '-')) = $${countParam})
                  AND (cat_match.id = selected_cat.id OR cat_match.parent_id = selected_cat.id)
            )`;
            countParams.push(normalizedCategory);
            countParam++;
        }

        if (hasOffer === 'true') {
            countQuery += ` AND p.discount_price IS NOT NULL AND p.discount_price < COALESCE(p.price_per_unit, p.price)`;
        }

        if (q) {
            countQuery += ` AND p.name ILIKE $${countParam}`;
            countParams.push(`%${q}%`);
        }

        if (debugProducts) {
            console.log(`[products] running count query params=${JSON.stringify(countParams)}`);
        }
        const totalResult = await pool.query(countQuery, countParams);
        if (debugProducts) {
            console.log(`[products] count query done total=${totalResult.rows[0]?.count}`);
        }
        const baseUrl = getPublicBaseUrl(req);

        res.json({
            products: result.rows.map((row: any) => mapProductMedia(row, baseUrl)),
            total: Number(totalResult.rows[0].count),
            page: Number(page),
            totalPages: Math.ceil(Number(totalResult.rows[0].count) / Number(limit))
        });
    } catch (error) {
        console.error('[products] handler error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT p.*, p.discount_price as "discountPrice", p.is_active as "isActive", 
                   p.price_per_unit as "pricePerUnit", p.min_qty as "minQty", p.step_qty as "stepQty", 
                   c.name as category_name,
                   (SELECT json_agg(json_build_object('id', cats.id, 'name', cats.name, 'slug', cats.slug)) 
                    FROM categories cats WHERE cats.id = ANY(p.category_ids)) as category_tags
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = $1 AND p.is_deleted = false
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const baseUrl = getPublicBaseUrl(req);
        res.json(mapProductMedia(result.rows[0], baseUrl));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, price, pricePerUnit, discountPrice, stock_quantity, category_id, category_ids, image_url, images = [], unit, minQty, stepQty, isActive = true } = req.body;
        const safeName = sanitizeText(name, 150);
        const safeDescription = typeof description === 'string' ? description.trim().slice(0, 5000) : '';
        const safeUnit = sanitizeUnitPayload(unit);
        const effectivePrice = pricePerUnit ?? price;
        const safePricePerUnit = parsePositiveNumber(effectivePrice);
        if (!safeName || safePricePerUnit === null) {
            return res.status(400).json({ message: 'Valid product name and price per unit are required' });
        }
        const finalDiscountPrice = discountPrice === '' || discountPrice === undefined ? null : discountPrice;
        const safeDiscountPrice = finalDiscountPrice === null ? null : parsePositiveNumber(finalDiscountPrice);
        if (finalDiscountPrice !== null && safeDiscountPrice === null) {
            return res.status(400).json({ message: 'Invalid discount price' });
        }
        const finalCategoryId = parseOptionalInt(category_id);
        const inputCategoryIds = Array.isArray(category_ids) ? category_ids : [];
        const finalCategoryIds = [...new Set(inputCategoryIds.map(Number).filter(Number.isInteger))];
        if (finalCategoryIds.length === 0 && finalCategoryId) {
            finalCategoryIds.push(finalCategoryId);
        }

        const finalStockQuantity = parseIntOrDefault(stock_quantity, 0);
        if (finalStockQuantity < 0 || finalStockQuantity > 100000) {
            return res.status(400).json({ message: 'Invalid stock quantity' });
        }

        const safeMinQty = parseQuantityRule(minQty, 1);
        const safeStepQty = parseQuantityRule(stepQty, 1);
        if (safeMinQty === null || safeStepQty === null) {
            return res.status(400).json({ message: 'Invalid quantity rules' });
        }
        const quantityRuleError = validateQuantityRules(safeUnit, safeMinQty, safeStepQty);
        if (quantityRuleError) {
            return res.status(400).json({ message: quantityRuleError });
        }

        const normalizedImages = Array.isArray(images)
            ? images.filter((image: unknown) => typeof image === 'string' && image.trim()).map((image: string) => image.trim())
            : [];
        const primaryImageUrl = typeof image_url === 'string' && image_url.trim()
            ? image_url.trim()
            : (normalizedImages[0] || '');
        const initialImages = normalizedImages.length > 0
            ? normalizedImages
            : (primaryImageUrl ? [primaryImageUrl] : []);

        const result = await pool.query(
            'INSERT INTO products (name, description, price, price_per_unit, discount_price, stock_quantity, category_id, category_ids, image_url, images, unit, min_qty, step_qty, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::int[], $9, $10::jsonb, $11, $12, $13, $14) RETURNING *, discount_price as "discountPrice", is_active as "isActive", price_per_unit as "pricePerUnit", min_qty as "minQty", step_qty as "stepQty"',
            [safeName, safeDescription, safePricePerUnit, safePricePerUnit, safeDiscountPrice, finalStockQuantity, finalCategoryId, finalCategoryIds, primaryImageUrl, JSON.stringify(initialImages), safeUnit, safeMinQty, safeStepQty, Boolean(isActive)]
        );
        const baseUrl = getPublicBaseUrl(req);
        res.status(201).json(mapProductMedia(result.rows[0], baseUrl));
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error: ' + (error as Error).message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, price, pricePerUnit, discountPrice, stock_quantity, category_id, category_ids, image_url, images, unit, minQty, stepQty, isActive } = req.body;
        const safeName = sanitizeText(name, 150);
        const safeDescription = typeof description === 'string' ? description.trim().slice(0, 5000) : '';
        const safeUnit = sanitizeUnitPayload(unit);
        const effectivePrice = pricePerUnit ?? price;
        const safePricePerUnit = parsePositiveNumber(effectivePrice);
        if (!safeName || safePricePerUnit === null) {
            return res.status(400).json({ message: 'Valid product name and price per unit are required' });
        }
        const finalDiscountPrice = discountPrice === '' || discountPrice === undefined ? null : discountPrice;
        const safeDiscountPrice = finalDiscountPrice === null ? null : parsePositiveNumber(finalDiscountPrice);
        if (finalDiscountPrice !== null && safeDiscountPrice === null) {
            return res.status(400).json({ message: 'Invalid discount price' });
        }
        const finalCategoryId = parseOptionalInt(category_id);
        const inputCategoryIds = Array.isArray(category_ids) ? category_ids : [];
        const finalCategoryIds = [...new Set(inputCategoryIds.map(Number).filter(Number.isInteger))];
        if (finalCategoryIds.length === 0 && finalCategoryId) {
            finalCategoryIds.push(finalCategoryId);
        }

        const finalStockQuantity = parseIntOrDefault(stock_quantity, 0);
        if (finalStockQuantity < 0 || finalStockQuantity > 100000) {
            return res.status(400).json({ message: 'Invalid stock quantity' });
        }

        const safeMinQty = parseQuantityRule(minQty, 1);
        const safeStepQty = parseQuantityRule(stepQty, 1);
        if (safeMinQty === null || safeStepQty === null) {
            return res.status(400).json({ message: 'Invalid quantity rules' });
        }
        const quantityRuleError = validateQuantityRules(safeUnit, safeMinQty, safeStepQty);
        if (quantityRuleError) {
            return res.status(400).json({ message: quantityRuleError });
        }

        const normalizedImages = Array.isArray(images)
            ? images.filter((image: unknown) => typeof image === 'string' && image.trim()).map((image: string) => image.trim())
            : [];
        const primaryImageUrl = typeof image_url === 'string' && image_url.trim()
            ? image_url.trim()
            : (normalizedImages[0] || '');

        let query = 'UPDATE products SET name = $1, description = $2, price = $3, price_per_unit = $4, discount_price = $5, stock_quantity = $6, image_url = $7, unit = $8, min_qty = $9, step_qty = $10';
        const params: any[] = [safeName, safeDescription, safePricePerUnit, safePricePerUnit, safeDiscountPrice, finalStockQuantity, primaryImageUrl, safeUnit, safeMinQty, safeStepQty];

        if (category_id !== undefined && category_id !== null && String(category_id).trim() !== '') {
            const finalCategoryId = parseOptionalInt(category_id);
            if (finalCategoryId === null) {
                return res.status(400).json({ message: 'Invalid category_id' });
            }
            query += `, category_id = $${params.length + 1}`;
            params.push(finalCategoryId);
        }

        if (category_ids !== undefined) {
            query += `, category_ids = $${params.length + 1}::int[]`;
            params.push(finalCategoryIds);
        }

        if (images !== undefined) {
            query += `, images = $${params.length + 1}::jsonb`;
            params.push(JSON.stringify(images));
        }

        if (isActive !== undefined) {
            query += `, is_active = $${params.length + 1}`;
            params.push(isActive);
        }

        query += ` WHERE id = $${params.length + 1} RETURNING *, discount_price as "discountPrice", is_active as "isActive", price_per_unit as "pricePerUnit", min_qty as "minQty", step_qty as "stepQty"`;
        params.push(id);

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        const baseUrl = getPublicBaseUrl(req);
        res.json(mapProductMedia(result.rows[0], baseUrl));
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error: ' + (error as Error).message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('UPDATE products SET is_deleted = true WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateProductStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be a boolean' });
        }

        const result = await pool.query(
            'UPDATE products SET is_active = $1 WHERE id = $2 RETURNING *, discount_price as "discountPrice", is_active as "isActive", price_per_unit as "pricePerUnit", min_qty as "minQty", step_qty as "stepQty"',
            [isActive, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        const baseUrl = getPublicBaseUrl(req);
        res.json(mapProductMedia(result.rows[0], baseUrl));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const bulkUpdateProductCategory = async (req: Request, res: Response) => {
    try {
        const { productIds, categoryId } = req.body;
        const ids = Array.isArray(productIds)
            ? [...new Set(productIds.map(Number).filter(Number.isInteger))]
            : [];
        const nextCategoryId = Number(categoryId);

        if (ids.length === 0) {
            return res.status(400).json({ message: 'Select at least one product' });
        }

        if (!Number.isInteger(nextCategoryId)) {
            return res.status(400).json({ message: 'Select a valid category' });
        }

        const categoryCheck = await pool.query('SELECT id FROM categories WHERE id = $1', [nextCategoryId]);
        if (categoryCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const result = await pool.query(
            `
                UPDATE products
                SET category_ids = (
                    SELECT ARRAY(
                        SELECT DISTINCT category_id
                        FROM unnest(
                            COALESCE(products.category_ids, ARRAY[]::int[])
                            || CASE WHEN products.category_id IS NULL THEN ARRAY[]::int[] ELSE ARRAY[products.category_id] END
                            || ARRAY[$1]::int[]
                        ) AS category_id
                        WHERE category_id IS NOT NULL
                    )
                )
                WHERE id = ANY($2::int[])
                  AND is_deleted = false
                RETURNING id
            `,
            [nextCategoryId, ids]
        );

        res.json({
            message: `Added category to ${result.rowCount} product${result.rowCount === 1 ? '' : 's'}`,
            updatedCount: result.rowCount,
        });
    } catch (error) {
        console.error('Error bulk updating product categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const { activeOnly } = req.query;
        let query = `
            WITH product_category_links AS (
                SELECT p.category_id AS category_id
                FROM products p
                WHERE p.is_deleted = false
                  AND p.category_id IS NOT NULL

                UNION ALL

                SELECT UNNEST(COALESCE(p.category_ids, ARRAY[]::int[])) AS category_id
                FROM products p
                WHERE p.is_deleted = false
            ),
            product_counts AS (
                SELECT category_id, COUNT(*)::int AS product_count
                FROM product_category_links
                WHERE category_id IS NOT NULL
                GROUP BY category_id
            )
            SELECT
                c.id,
                c.name,
                c.slug,
                c.description,
                c.image_url,
                c.parent_id,
                c.is_active,
                COALESCE(pc.product_count, 0) AS product_count
            FROM categories c
            LEFT JOIN product_counts pc ON pc.category_id = c.id
        `;
        
        const params: any[] = [];
        if (activeOnly === 'true') {
            query += ` WHERE COALESCE(c.is_active, true) = true`;
        }
        
        query += ` ORDER BY c.name ASC`;
        
        const result = await pool.query(query, params);
        const baseUrl = getPublicBaseUrl(req);
        res.json(result.rows.map((category) => ({
            ...category,
            image_url: normalizeMediaUrl(category.image_url, baseUrl),
        })));
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, description, image_url, parent_id, is_active } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const safeName = name.trim().slice(0, 100);
        const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const safeDescription = typeof description === 'string' ? description.trim().slice(0, 500) : '';
        const safeImageUrl = typeof image_url === 'string' ? image_url.trim().slice(0, 1000) : '';

        const existing = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'A category with this name already exists' });
        }

        const safeParentId = (!parent_id || isNaN(Number(parent_id))) ? null : Number(parent_id);
        const safeIsActive = is_active === undefined ? true : !!is_active;

        const result = await pool.query(
            'INSERT INTO categories (name, slug, description, image_url, parent_id, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [safeName, slug, safeDescription, safeImageUrl, safeParentId, safeIsActive]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, image_url, parent_id, is_active } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Category name is required' });
        }
        const safeName = name.trim().slice(0, 100);
        const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const safeDescription = typeof description === 'string' ? description.trim().slice(0, 500) : '';
        const safeImageUrl = typeof image_url === 'string' ? image_url.trim().slice(0, 1000) : '';

        const conflict = await pool.query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
        if (conflict.rows.length > 0) {
            return res.status(409).json({ message: 'Another category with this name already exists' });
        }
        
        const safeParentId = (!parent_id || isNaN(Number(parent_id))) ? null : Number(parent_id);
        if (safeParentId === Number(id)) {
            return res.status(400).json({ message: 'Category cannot be its own parent' });
        }
        const safeIsActive = is_active === undefined ? true : !!is_active;

        const result = await pool.query(
            'UPDATE categories SET name = $1, slug = $2, description = $3, image_url = $4, parent_id = $5, is_active = $6 WHERE id = $7 RETURNING *',
            [safeName, slug, safeDescription, safeImageUrl, safeParentId, safeIsActive, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productCheck = await pool.query(
            `
                SELECT COUNT(*)::int as count
                FROM products
                WHERE is_deleted = false
                  AND (
                      category_id = $1
                      OR $1 = ANY(COALESCE(category_ids, ARRAY[]::int[]))
                  )
            `,
            [id]
        );
        if (productCheck.rows[0].count > 0) {
            return res.status(400).json({ message: `Cannot delete: ${productCheck.rows[0].count} product(s) still assigned to this category` });
        }
        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
