import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /api/loyalty
 * Returns loyalty summary for the authenticated user
 */
export const getLoyaltyInfo = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    try {
        const result = await pool.query(
            `SELECT loyalty_points, total_points_earned, total_points_redeemed
             FROM users WHERE id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ success: true, loyalty: result.rows[0] });
    } catch (error) {
        console.error('Error fetching loyalty info:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/loyalty/history
 * Returns loyalty transaction history for the authenticated user
 */
export const getLoyaltyHistory = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    try {
        const result = await pool.query(
            `SELECT lt.id, lt.type, lt.points, lt.description, lt.created_at, lt.order_id
             FROM loyalty_transactions lt
             WHERE lt.user_id = $1
             ORDER BY lt.created_at DESC
             LIMIT 50`,
            [userId]
        );
        res.json({ success: true, history: result.rows });
    } catch (error) {
        console.error('Error fetching loyalty history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
