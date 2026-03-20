import { Request, Response } from 'express';
import { pool } from '../db';

export const getCart = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id; // Assuming auth middleware attaches user
    try {
        const result = await pool.query(
            'SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image_url FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const addToCart = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    const { productId, quantity } = req.body;
    try {
        const normalizedProductId = Number(productId);
        const normalizedQuantity = Number(quantity);
        if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0 || !Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0 || normalizedQuantity > 100) {
            return res.status(400).json({ message: 'Invalid cart payload' });
        }

        // Check if item exists
        const existing = await pool.query('SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, normalizedProductId]);

        if (existing.rows.length > 0) {
            const newQty = existing.rows[0].quantity + normalizedQuantity;
            const update = await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *', [newQty, existing.rows[0].id]);
            return res.json(update.rows[0]);
        }

        const result = await pool.query(
            'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [userId, normalizedProductId, normalizedQuantity]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateCartItem = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        const normalizedId = Number(id);
        const normalizedQuantity = Number(quantity);
        if (!Number.isInteger(normalizedId) || normalizedId <= 0 || !Number.isFinite(normalizedQuantity)) {
            return res.status(400).json({ message: 'Invalid cart payload' });
        }

        if (normalizedQuantity <= 0) {
            await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [normalizedId, userId]);
            return res.json({ message: 'Item removed' });
        }
        if (!Number.isInteger(normalizedQuantity) || normalizedQuantity > 100) {
            return res.status(400).json({ message: 'Quantity must be between 1 and 100' });
        }
        const result = await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *', [normalizedQuantity, normalizedId, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const removeCartItem = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    const { id } = req.params;
    try {
        const normalizedId = Number(id);
        if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
            return res.status(400).json({ message: 'Invalid cart item id' });
        }
        await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [normalizedId, userId]);
        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
