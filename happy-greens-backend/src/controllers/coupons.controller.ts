import { Request, Response } from 'express';
import {pool} from '../db';

/**
 * Create Coupon
 * POST /api/admin/coupons
 * 
 * Creates a new discount coupon
 */
export const createCoupon = async (req: Request, res: Response) => {
    try {
        const {
            code,
            description,
            discount_type,
            discount_value,
            min_order_amount,
            max_discount_amount,
            usage_limit,
            valid_from,
            valid_until,
            applicable_category_id,
            applicable_product_id
        } = req.body;

        const userId = (req as any).user?.id;

        // Validate discount type
        if (!['flat', 'percentage'].includes(discount_type)) {
            return res.status(400).json({ message: 'Invalid discount type. Use flat or percentage' });
        }

        // Validate discount value
        if (discount_value <= 0) {
            return res.status(400).json({ message: 'Discount value must be greater than 0' });
        }

        if (discount_type === 'percentage' && discount_value > 100) {
            return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
        }

        // Helper function to convert empty strings to null
        const toNullIfEmpty = (value: any) => {
            if (value === '' || value === undefined) return null;
            return value;
        };

        // Create coupon
        const result = await pool.query(
            `INSERT INTO coupons 
             (code, description, discount_type, discount_value, min_order_amount, 
              max_discount_amount, usage_limit, valid_from, valid_until, created_by,
              applicable_category_id, applicable_product_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
                code.toUpperCase(),
                description,
                discount_type,
                discount_value,
                min_order_amount || 0,
                toNullIfEmpty(max_discount_amount),
                toNullIfEmpty(usage_limit),
                valid_from,
                valid_until,
                userId,
                toNullIfEmpty(applicable_category_id),
                toNullIfEmpty(applicable_product_id)
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Error creating coupon:', error);
        
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get All Coupons
 * GET /api/admin/coupons?active=true
 */
export const getCoupons = async (req: Request, res: Response) => {
    try {
        const { active } = req.query;

        let query = `
            SELECT 
                c.*,
                u.full_name as created_by_name,
                cat.name as applicable_category_name,
                p.name as applicable_product_name
            FROM coupons c
            LEFT JOIN users u ON c.created_by = u.id
            LEFT JOIN categories cat ON c.applicable_category_id = cat.id
            LEFT JOIN products p ON c.applicable_product_id = p.id
        `;

        const params: any[] = [];

        if (active === 'true') {
            query += ' WHERE c.is_active = true AND c.valid_until > NOW()';
        } else if (active === 'false') {
            query += ' WHERE c.is_active = false OR c.valid_until <= NOW()';
        }

        query += ' ORDER BY c.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Coupon by ID
 * GET /api/admin/coupons/:id
 */
export const getCouponById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                c.*,
                u.full_name as created_by_name,
                cat.name as applicable_category_name,
                p.name as applicable_product_name
             FROM coupons c
             LEFT JOIN users u ON c.created_by = u.id
             LEFT JOIN categories cat ON c.applicable_category_id = cat.id
             LEFT JOIN products p ON c.applicable_product_id = p.id
             WHERE c.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching coupon:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update Coupon
 * PUT /api/admin/coupons/:id
 */
export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            description,
            discount_value,
            min_order_amount,
            max_discount_amount,
            usage_limit,
            valid_from,
            valid_until,
            is_active,
            applicable_category_id,
            applicable_product_id
        } = req.body;

        // Helper function to convert empty strings to null
        const toNullIfEmpty = (value: any) => {
            if (value === '' || value === undefined) return null;
            return value;
        };

        const result = await pool.query(
            `UPDATE coupons 
             SET description = COALESCE($1, description),
                 discount_value = COALESCE($2, discount_value),
                 min_order_amount = COALESCE($3, min_order_amount),
                 max_discount_amount = $4,
                 usage_limit = $5,
                 valid_from = COALESCE($6, valid_from),
                 valid_until = COALESCE($7, valid_until),
                 is_active = COALESCE($8, is_active),
                 applicable_category_id = $9,
                 applicable_product_id = $10,
                 updated_at = NOW()
             WHERE id = $11
             RETURNING *`,
            [
                description, 
                discount_value, 
                min_order_amount, 
                toNullIfEmpty(max_discount_amount), 
                toNullIfEmpty(usage_limit), 
                valid_from, 
                valid_until, 
                is_active, 
                toNullIfEmpty(applicable_category_id),
                toNullIfEmpty(applicable_product_id),
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Delete Coupon
 * DELETE /api/admin/coupons/:id
 */
export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM coupons WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Validate Coupon (Public API for customers)
 * POST /api/coupons/validate
 * 
 * Validates coupon and calculates discount
 */
export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const { code, cart_items } = req.body;
        const userId = (req as any).user?.id;

        if (!code || !cart_items || !Array.isArray(cart_items)) {
            return res.status(400).json({ message: 'Code and valid cart_items array are required' });
        }

        // Get coupon
        const couponResult = await pool.query(
            `SELECT * FROM coupons 
             WHERE UPPER(code) = UPPER($1) 
             AND is_active = true 
             AND valid_from <= NOW() 
             AND valid_until >= NOW()`,
            [code]
        );

        if (couponResult.rows.length === 0) {
            return res.status(404).json({ 
                valid: false,
                message: 'Invalid or expired coupon code' 
            });
        }

        const coupon = couponResult.rows[0];

        let applicable_subtotal = 0;
        let total_order_amount = 0;

        for (const item of cart_items) {
            const itemTotal = Number(item.price) * Number(item.quantity || 1);
            total_order_amount += itemTotal;

            let isApplicable = true;
            if (coupon.applicable_category_id && Number(item.category_id) !== Number(coupon.applicable_category_id)) isApplicable = false;
            if (coupon.applicable_product_id && Number(item.product_id) !== Number(coupon.applicable_product_id)) isApplicable = false;

            if (isApplicable) applicable_subtotal += itemTotal;
        }

        if (applicable_subtotal === 0) {
            return res.status(400).json({ valid: false, message: 'This coupon is not applicable to any items in your cart' });
        }

        // Check minimum order amount
        if (applicable_subtotal < parseFloat(coupon.min_order_amount)) {
            return res.status(400).json({
                valid: false,
                message: `Minimum applicable item amount is ₹${coupon.min_order_amount}`
            });
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({
                valid: false,
                message: 'Coupon usage limit reached'
            });
        }

        // Check if user already used this coupon (if logged in)
        if (userId) {
            const usageResult = await pool.query(
                'SELECT id FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
                [coupon.id, userId]
            );

            if (usageResult.rows.length > 0) {
                return res.status(400).json({
                    valid: false,
                    message: 'You have already used this coupon'
                });
            }
        }

        // Calculate discount
        let discount_amount = 0;
        if (coupon.discount_type === 'flat') {
            discount_amount = parseFloat(coupon.discount_value);
        } else { // percentage
            discount_amount = (applicable_subtotal * parseFloat(coupon.discount_value)) / 100;
            
            // Apply max discount cap if set
            if (coupon.max_discount_amount) {
                discount_amount = Math.min(discount_amount, parseFloat(coupon.max_discount_amount));
            }
        }

        // discount cannot be greater than the applicable subtotal
        discount_amount = Math.min(discount_amount, applicable_subtotal);
        const final_amount = Math.max(0, total_order_amount - discount_amount);

        res.json({
            valid: true,
            coupon_id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: discount_amount.toFixed(2),
            final_amount: final_amount.toFixed(2),
            message: `Coupon applied! You saved ₹${discount_amount.toFixed(2)}`
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Coupon Usage Stats
 * GET /api/admin/coupons/:id/usage
 */
export const getCouponUsage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                cu.*,
                u.full_name as customer_name,
                o.total_amount as order_amount
             FROM coupon_usage cu
             JOIN users u ON cu.user_id = u.id
             JOIN orders o ON cu.order_id = o.id
             WHERE cu.coupon_id = $1
             ORDER BY cu.used_at DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching coupon usage:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
