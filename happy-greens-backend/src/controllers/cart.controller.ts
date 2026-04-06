import { Request, Response } from 'express';
import { pool } from '../db';
import { buildUnitConfig, calculateLineTotal, isValidQuantityForConfig, normalizeQuantityForUnit } from '../services/unit-pricing.service';

const getProductForCart = async (productId: number) => {
    const result = await pool.query(
        `SELECT id, name, price, discount_price, price_per_unit, unit, min_qty, step_qty, image_url, is_active, is_deleted
         FROM products
         WHERE id = $1`,
        [productId]
    );

    return result.rows[0] || null;
};

const getOrCreateCartId = async (userId: number): Promise<number> => {
    const existing = await pool.query('SELECT id FROM carts WHERE user_id = $1 LIMIT 1', [userId]);
    if (existing.rows[0]?.id) return Number(existing.rows[0].id);

    const created = await pool.query(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
        [userId]
    );
    return Number(created.rows[0].id);
};

export const getCart = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    try {
        const result = await pool.query(
            `SELECT ci.id as cart_item_id, ci.quantity, ci.unit, p.id as product_id, p.name, p.price, p.discount_price as "discountPrice",
                    p.price_per_unit as "pricePerUnit", p.min_qty as "minQty", p.step_qty as "stepQty", p.image_url
             FROM carts c
             JOIN cart_items ci ON ci.cart_id = c.id
             JOIN products p ON ci.product_id = p.id
             WHERE c.user_id = $1`,
            [userId]
        );

        res.json(result.rows.map((row) => ({
            ...row,
            id: Number(row.product_id),
            quantity: Number(row.quantity),
            lineTotal: calculateLineTotal(Number(row.quantity), buildUnitConfig(row)),
        })));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const addToCart = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { productId, quantity } = req.body;
    try {
        const normalizedProductId = Number(productId);
        if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0) {
            return res.status(400).json({ message: 'Invalid cart payload' });
        }

        const product = await getProductForCart(normalizedProductId);
        if (!product || product.is_deleted || product.is_active === false) {
            return res.status(400).json({ message: 'Invalid product' });
        }

        const config = buildUnitConfig(product);
        const normalizedQuantity = normalizeQuantityForUnit(quantity, config.unit);
        if (!isValidQuantityForConfig(normalizedQuantity, config)) {
            return res.status(400).json({ message: 'Invalid quantity for selected product unit' });
        }

        const cartId = await getOrCreateCartId(userId);
        const existing = await pool.query('SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, normalizedProductId]);

        if (existing.rows.length > 0) {
            const currentQuantity = Number(existing.rows[0].quantity || 0);
            const newQty = normalizeQuantityForUnit(currentQuantity + normalizedQuantity, config.unit);
            if (!isValidQuantityForConfig(newQty, config)) {
                return res.status(400).json({ message: 'Invalid quantity for selected product unit' });
            }
            const update = await pool.query('UPDATE cart_items SET quantity = $1, unit = $2 WHERE id = $3 RETURNING *', [newQty, config.unit, existing.rows[0].id]);
            return res.json({ ...update.rows[0], quantity: Number(update.rows[0].quantity) });
        }

        const result = await pool.query(
            'INSERT INTO cart_items (cart_id, product_id, quantity, unit) VALUES ($1, $2, $3, $4) RETURNING *',
            [cartId, normalizedProductId, normalizedQuantity, config.unit]
        );
        res.status(201).json({ ...result.rows[0], quantity: Number(result.rows[0].quantity) });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateCartItem = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        const normalizedProductId = Number(id);
        if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0) {
            return res.status(400).json({ message: 'Invalid cart payload' });
        }

        const existingResult = await pool.query(
            `SELECT ci.*
             FROM carts c
             JOIN cart_items ci ON ci.cart_id = c.id
             WHERE c.user_id = $1 AND ci.product_id = $2`,
            [userId, normalizedProductId]
        );
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        const existing = existingResult.rows[0];
        const product = await getProductForCart(Number(existing.product_id));
        if (!product || product.is_deleted || product.is_active === false) {
            return res.status(400).json({ message: 'Invalid product' });
        }

        const config = buildUnitConfig(product);
        const normalizedQuantity = normalizeQuantityForUnit(quantity, config.unit);
        if (!Number.isFinite(normalizedQuantity)) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        if (normalizedQuantity <= 0) {
            await pool.query('DELETE FROM cart_items WHERE id = $1', [existing.id]);
            return res.json({ message: 'Item removed' });
        }

        if (!isValidQuantityForConfig(normalizedQuantity, config)) {
            return res.status(400).json({ message: 'Invalid quantity for selected product unit' });
        }

        const result = await pool.query(
            'UPDATE cart_items SET quantity = $1, unit = $2 WHERE id = $3 RETURNING *',
            [normalizedQuantity, config.unit, existing.id]
        );
        res.json({ ...result.rows[0], quantity: Number(result.rows[0].quantity) });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const removeCartItem = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    try {
        const normalizedProductId = Number(id);
        if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0) {
            return res.status(400).json({ message: 'Invalid cart item id' });
        }
        await pool.query(
            `DELETE FROM cart_items ci
             USING carts c
             WHERE ci.cart_id = c.id
               AND c.user_id = $1
               AND ci.product_id = $2`,
            [userId, normalizedProductId]
        );
        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const clearCart = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    try {
        await pool.query(
            `DELETE FROM cart_items ci
             USING carts c
             WHERE ci.cart_id = c.id
               AND c.user_id = $1`,
            [userId]
        );
        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
