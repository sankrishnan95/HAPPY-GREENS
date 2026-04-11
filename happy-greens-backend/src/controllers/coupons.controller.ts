import { Request, Response } from 'express';
import {pool} from '../db';
import { applyCouponToCalculatedItems, COUPON_ERROR_CODES, prepareCalculatedOrderItems } from '../services/order-pricing.service';

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

        const toNullIfEmpty = (value: any) => {
            if (value === '' || value === undefined) return null;
            return value;
        };

        const adjustValidUntil = (dateStr: string) => {
            if (!dateStr) return dateStr;
            return dateStr.length === 10 ? `${dateStr} 23:59:59` : dateStr;
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
                adjustValidUntil(valid_until),
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
        if (error.constraint === 'valid_dates') {
            return res.status(400).json({ message: 'Valid until date must be after valid from date' });
        }
        res.status(500).json({ message: 'Server error', error: String(error.message) });
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

        const toNullIfEmpty = (value: any) => {
            if (value === '' || value === undefined) return null;
            return value;
        };

        const adjustValidUntil = (dateStr: string) => {
            if (!dateStr) return dateStr;
            return dateStr.length === 10 ? `${dateStr} 23:59:59` : dateStr;
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
                adjustValidUntil(valid_until), 
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
    } catch (error: any) {
        if (error.constraint === 'valid_dates') {
            return res.status(400).json({ message: 'Valid until date must be after valid from date' });
        }
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

        const calculatedItems = await prepareCalculatedOrderItems(pool, cart_items);
        const subtotal = calculatedItems.reduce((sum, item) => sum + item.price, 0);

        const { couponDiscount, validatedCouponId } = await applyCouponToCalculatedItems(
            pool,
            calculatedItems,
            code,
            userId ? Number(userId) : null
        );

        const couponResult = await pool.query('SELECT id, code, discount_type, discount_value FROM coupons WHERE id = $1', [validatedCouponId]);

        if (couponResult.rows.length === 0) {
            return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });
        }

        const coupon = couponResult.rows[0];
        const final_amount = Math.max(0, subtotal - couponDiscount);

        res.json({
            valid: true,
            coupon_id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: couponDiscount.toFixed(2),
            final_amount: final_amount.toFixed(2),
            message: `Coupon applied! You saved Rs. ${couponDiscount.toFixed(2)}`
        });
    } catch (error) {
        console.error('Error validating coupon:', error);

        if (error instanceof Error) {
            if (error.message === 'INVALID_COUPON') return res.status(404).json({ valid: false, message: 'Invalid or expired coupon code' });
            if (error.message === 'COUPON_NOT_APPLICABLE') return res.status(400).json({ valid: false, message: 'This coupon is not applicable to any items in your cart' });
            if (error.message === 'COUPON_MIN_ORDER') return res.status(400).json({ valid: false, message: 'Minimum applicable item amount was not met' });
            if (error.message === 'COUPON_USAGE_LIMIT') return res.status(400).json({ valid: false, message: 'Coupon usage limit reached' });
            if (error.message === 'COUPON_ALREADY_USED') return res.status(400).json({ valid: false, message: 'You have already used this coupon' });
            if (error.message === 'INVALID_ITEMS' || error.message === 'INVALID_PRODUCT' || COUPON_ERROR_CODES.has(error.message)) return res.status(400).json({ valid: false, message: 'Invalid cart items for coupon validation' });
        }

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

/**
 * Get Public Active Coupons
 * GET /api/coupons/active
 */
export const getActiveCoupons = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT 
                c.id, c.code, c.description, c.discount_type, c.discount_value, 
                c.min_order_amount, c.max_discount_amount, c.valid_from, c.valid_until,
                cat.name as applicable_category_name
            FROM coupons c
            LEFT JOIN categories cat ON c.applicable_category_id = cat.id
            WHERE c.is_active = true 
              AND c.valid_until > NOW() 
              AND (c.valid_from <= NOW() OR c.valid_from IS NULL)
            ORDER BY c.created_at DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching active coupons:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
