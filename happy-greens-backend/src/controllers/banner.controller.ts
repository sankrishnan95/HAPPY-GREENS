import { Request, Response } from 'express';
import { pool } from '../db';

// 1. Get all banners
export const getBanners = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM banners ORDER BY display_order ASC, created_at DESC');
        res.json({
            success: true,
            banners: result.rows
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch banners' });
    }
};

// 2. Get active banners (for storefront later)
export const getActiveBanners = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await pool.query('SELECT * FROM banners WHERE is_active = true ORDER BY display_order ASC, created_at DESC');
        res.json({
            success: true,
            banners: result.rows
        });
    } catch (error) {
        console.error('Error fetching active banners:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch active banners' });
    }
};

// 3. Get single banner
export const getBannerById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM banners WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Banner not found' });
            return;
        }

        res.json({
            success: true,
            banner: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching banner:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch banner' });
    }
};

// 4. Create banner
export const createBanner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, subheading, description, image_url, link, is_active, display_order } = req.body;

        const parsedDisplayOrder = display_order === '' || isNaN(display_order) ? 0 : parseInt(display_order);

        const result = await pool.query(
            `INSERT INTO banners (title, subheading, description, image_url, link, is_active, display_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                title,
                subheading || null,
                description || null,
                image_url,
                link || null,
                is_active !== undefined ? is_active : true,
                parsedDisplayOrder
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            banner: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error creating banner:', error);
        res.status(500).json({ success: false, message: 'Failed to create banner', details: error.message });
    }
};

// 5. Update banner
export const updateBanner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, subheading, description, image_url, link, is_active, display_order } = req.body;

        // Ensure we handle numeric casting so PG doesn't crash on empty strings
        const parsedDisplayOrder = display_order === '' || isNaN(display_order) ? 0 : parseInt(display_order);

        // Dynamically build SET clause to only update what was provided (e.g if image_url isn't sent, keep existing)
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramCount}`);
            values.push(title);
            paramCount++;
        }
        if (subheading !== undefined) {
            updates.push(`subheading = $${paramCount}`);
            values.push(subheading || null);
            paramCount++;
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount}`);
            values.push(description || null);
            paramCount++;
        }
        if (image_url) {
            updates.push(`image_url = $${paramCount}`);
            values.push(image_url);
            paramCount++;
        }
        if (link !== undefined) {
            updates.push(`link = $${paramCount}`);
            values.push(link || null);
            paramCount++;
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount}`);
            values.push(is_active);
            paramCount++;
        }
        if (display_order !== undefined) {
            updates.push(`display_order = $${paramCount}`);
            values.push(parsedDisplayOrder);
            paramCount++;
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updates.length === 1) { // Only updated_at
            res.status(400).json({ success: false, message: 'No fields provided for update' });
            return;
        }

        values.push(id);
        const query = `
            UPDATE banners
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Banner not found' });
            return;
        }

        res.json({
            success: true,
            message: 'Banner updated successfully',
            banner: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error updating banner:', error);
        res.status(500).json({ success: false, message: 'Failed to update banner', details: error.message });
    }
};

// 6. Delete banner
export const deleteBanner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM banners WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Banner not found' });
            return;
        }

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ success: false, message: 'Failed to delete banner' });
    }
};
