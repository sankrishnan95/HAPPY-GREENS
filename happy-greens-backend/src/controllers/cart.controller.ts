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
        // Check if item exists
        const existing = await pool.query('SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);

        if (existing.rows.length > 0) {
            const newQty = existing.rows[0].quantity + quantity;
            const update = await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *', [newQty, existing.rows[0].id]);
            return res.json(update.rows[0]);
        }

        const result = await pool.query(
            'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [userId, productId, quantity]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateCartItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        if (quantity <= 0) {
            await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
            return res.json({ message: 'Item removed' });
        }
        const result = await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *', [quantity, id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const removeCartItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
