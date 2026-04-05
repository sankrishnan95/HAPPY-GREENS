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

        let query = 'SELECT p.*, p.discount_price as "discountPrice", p.is_active as "isActive", p.price_per_unit as "pricePerUnit", p.min_qty as "minQty", p.step_qty as "stepQty", c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_deleted = false';

        if (req.query.admin !== 'true') {
            query += ' AND p.is_active = true';
        }

        const params: any[] = [];
        let paramCount = 1;

        if (category) {
            const normalizedCategory = String(category).trim().toLowerCase();
            query += ` AND (
                LOWER(TRIM(c.slug)) = $${paramCount}
                OR LOWER(TRIM(c.name)) = $${paramCount}
                OR LOWER(REPLACE(TRIM(c.name), ' ', '-')) = $${paramCount}
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

        if (sort === 'price_asc') {
            query += ' ORDER BY COALESCE(p.discount_price, p.price_per_unit, p.price) ASC';
        } else if (sort === 'price_desc') {
            query += ' ORDER BY COALESCE(p.discount_price, p.price_per_unit, p.price) DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        let countQuery = 'SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_deleted = false';
        const countParams: any[] = [];
        let countParam = 1;

        if (req.query.admin !== 'true') {
            countQuery += ' AND p.is_active = true';
        }

        if (category) {
            const normalizedCategory = String(category).trim().toLowerCase();
            countQuery += ` AND (
                LOWER(TRIM(c.slug)) = $${countParam}
                OR LOWER(TRIM(c.name)) = $${countParam}
                OR LOWER(REPLACE(TRIM(c.name), ' ', '-')) = $${countParam}
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

        const totalResult = await pool.query(countQuery, countParams);
        const baseUrl = getPublicBaseUrl(req);

        res.json({
            products: result.rows.map((row: any) => mapProductMedia(row, baseUrl)),
            total: Number(totalResult.rows[0].count),
            page: Number(page),
            totalPages: Math.ceil(Number(totalResult.rows[0].count) / Number(limit))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT p.*, p.discount_price as "discountPrice", p.is_active as "isActive", p.price_per_unit as "pricePerUnit", p.min_qty as "minQty", p.step_qty as "stepQty", c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1 AND p.is_deleted = false', [id]);

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
        const { name, description, price, pricePerUnit, discountPrice, stock_quantity, category_id, image_url, images = [], unit, minQty, stepQty, isActive = true } = req.body;
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

        let initialImages = images;
        if (image_url && initialImages.length === 0) {
            initialImages = [image_url];
        }

        const result = await pool.query(
            'INSERT INTO products (name, description, price, price_per_unit, discount_price, stock_quantity, category_id, image_url, images, unit, min_qty, step_qty, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13) RETURNING *, discount_price as "discountPrice", is_active as "isActive", price_per_unit as "pricePerUnit", min_qty as "minQty", step_qty as "stepQty"',
            [safeName, safeDescription, safePricePerUnit, safePricePerUnit, safeDiscountPrice, finalStockQuantity, finalCategoryId, image_url, JSON.stringify(initialImages), safeUnit, safeMinQty, safeStepQty, Boolean(isActive)]
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
        const { name, description, price, pricePerUnit, discountPrice, stock_quantity, category_id, image_url, images, unit, minQty, stepQty, isActive } = req.body;
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

        let query = 'UPDATE products SET name = $1, description = $2, price = $3, price_per_unit = $4, discount_price = $5, stock_quantity = $6, image_url = $7, unit = $8, min_qty = $9, step_qty = $10';
        const params: any[] = [safeName, safeDescription, safePricePerUnit, safePricePerUnit, safeDiscountPrice, finalStockQuantity, image_url, safeUnit, safeMinQty, safeStepQty];

        if (category_id !== undefined && category_id !== null && String(category_id).trim() !== '') {
            const finalCategoryId = parseOptionalInt(category_id);
            if (finalCategoryId === null) {
                return res.status(400).json({ message: 'Invalid category_id' });
            }
            query += `, category_id = $${params.length + 1}`;
            params.push(finalCategoryId);
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

export const getCategories = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT id, name, slug FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
