import { Request, Response } from 'express';
import { pool } from '../db';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { category, q, page = 1, limit = 10, sort } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = 'SELECT p.*, p.discount_price as "discountPrice", p.is_active as "isActive", c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_deleted = false';

        // Hide inactive products unless admin explicitly requests all
        if (req.query.admin !== 'true') {
            query += ' AND p.is_active = true';
        }

        const params: any[] = [];
        let paramCount = 1;

        if (category) {
            query += ` AND c.slug = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (q) {
            query += ` AND p.name ILIKE $${paramCount}`;
            params.push(`%${q}%`);
            paramCount++;
        }

        if (sort === 'price_asc') {
            query += ' ORDER BY p.price ASC';
        } else if (sort === 'price_desc') {
            query += ' ORDER BY p.price DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        let countQuery = 'SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_deleted = false';
        const countParams: any[] = [];
        let countParam = 1;

        if (req.query.admin !== 'true') {
            countQuery += ' AND p.is_active = true';
        }

        if (category) {
            countQuery += ` AND c.slug = $${countParam}`;
            countParams.push(category);
            countParam++;
        }

        if (q) {
            countQuery += ` AND p.name ILIKE $${countParam}`;
            countParams.push(`%${q}%`);
        }

        const totalResult = await pool.query(countQuery, countParams);

        res.json({
            products: result.rows,
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
        const result = await pool.query('SELECT p.*, p.discount_price as "discountPrice", p.is_active as "isActive", c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1 AND p.is_deleted = false', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, price, discountPrice, stock_quantity, category_id, image_url, images = [], isActive = true } = req.body;
        const finalDiscountPrice = discountPrice === '' || discountPrice === undefined ? null : discountPrice;
        const finalCategoryId = category_id === '' || category_id === undefined ? null : category_id;
        const finalStockQuantity = stock_quantity === '' || stock_quantity === undefined ? 0 : parseInt(stock_quantity, 10);

        let initialImages = images;
        // Backwards compatibility for single image requests
        if (image_url && initialImages.length === 0) {
            initialImages = [image_url];
        }

        const result = await pool.query(
            'INSERT INTO products (name, description, price, discount_price, stock_quantity, category_id, image_url, images, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9) RETURNING *, discount_price as "discountPrice", is_active as "isActive"',
            [name, description, price, finalDiscountPrice, finalStockQuantity, finalCategoryId, image_url, JSON.stringify(initialImages), isActive]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error: ' + (error as Error).message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, price, discountPrice, stock_quantity, category_id, image_url, images, isActive } = req.body;
        const finalDiscountPrice = discountPrice === '' || discountPrice === undefined ? null : discountPrice;
        const finalCategoryId = category_id === '' || category_id === undefined ? null : category_id;
        const finalStockQuantity = stock_quantity === '' || stock_quantity === undefined ? 0 : parseInt(stock_quantity, 10);

        let query = 'UPDATE products SET name = $1, description = $2, price = $3, discount_price = $4, stock_quantity = $5, category_id = $6, image_url = $7';
        const params: any[] = [name, description, price, finalDiscountPrice, finalStockQuantity, finalCategoryId, image_url];

        if (images !== undefined) {
            query += `, images = $${params.length + 1}::jsonb`;
            params.push(JSON.stringify(images));
        }

        if (isActive !== undefined) {
            query += `, is_active = $${params.length + 1}`;
            params.push(isActive);
        }

        query += ` WHERE id = $${params.length + 1} RETURNING *, discount_price as "discountPrice", is_active as "isActive"`;
        params.push(id);

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(result.rows[0]);
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
            'UPDATE products SET is_active = $1 WHERE id = $2 RETURNING *, discount_price as "discountPrice", is_active as "isActive"',
            [isActive, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
