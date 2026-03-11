import { Request, Response } from 'express';
import { pool } from '../db';

let wishlistSchemaReady = false;

const ensureWishlistSchema = async (): Promise<void> => {
  if (wishlistSchemaReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id SERIAL PRIMARY KEY,
      wishlist_id INTEGER NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(wishlist_id, product_id)
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_wishlist_items_product ON wishlist_items(product_id)');

  wishlistSchemaReady = true;
};

const getAuthenticatedUserId = (req: Request): number | null => {
  // @ts-ignore
  const userId = req.user?.id;
  if (!userId || Number.isNaN(Number(userId))) {
    return null;
  }

  return Number(userId);
};

const ensureWishlist = async (userId: number): Promise<number> => {
  const existing = await pool.query('SELECT id FROM wishlists WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const created = await pool.query(
    'INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id',
    [userId]
  );

  return created.rows[0].id;
};

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await ensureWishlistSchema();
    const wishlistId = await ensureWishlist(userId);

    const result = await pool.query(
      `SELECT p.*, p.discount_price as "discountPrice", p.is_active as "isActive", c.name as category_name
       FROM wishlist_items wi
       JOIN products p ON p.id = wi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE wi.wishlist_id = $1 AND p.is_deleted = false AND COALESCE(p.is_active, true) = true
       ORDER BY wi.created_at DESC`,
      [wishlistId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({ message: 'Unable to load wishlist' });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { productId } = req.body;

    if (!productId || Number.isNaN(Number(productId))) {
      return res.status(400).json({ message: 'Valid productId is required' });
    }

    await ensureWishlistSchema();

    const productResult = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_deleted = false',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const wishlistId = await ensureWishlist(userId);

    await pool.query(
      'INSERT INTO wishlist_items (wishlist_id, product_id) VALUES ($1, $2) ON CONFLICT (wishlist_id, product_id) DO NOTHING',
      [wishlistId, productId]
    );

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Unable to add to wishlist' });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const productId = Number(req.params.productId);
    if (!productId || Number.isNaN(productId)) {
      return res.status(400).json({ message: 'Valid productId is required' });
    }

    await ensureWishlistSchema();

    const wishlist = await pool.query('SELECT id FROM wishlists WHERE user_id = $1', [userId]);
    if (wishlist.rows.length === 0) {
      return res.status(204).send();
    }

    await pool.query(
      'DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2',
      [wishlist.rows[0].id, productId]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Unable to remove from wishlist' });
  }
};

