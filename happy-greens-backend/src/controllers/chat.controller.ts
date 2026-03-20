import { Request, Response } from 'express';
import { pool } from '../db';
import { getPublicBaseUrl, normalizeMediaUrl } from '../utils/media';

type ChatIntent = 'ORDER_STATUS' | 'DELIVERY_INFO' | 'OFFERS' | 'PRODUCT_SEARCH' | 'CART_HELP' | 'PAYMENT_HELP' | 'UNKNOWN';

type ProductRow = {
    id: number;
    name: string;
    price: string | number;
    discount_price?: string | number | null;
    image_url?: string | null;
    images?: string[] | null;
};

const normalizeMessage = (value: unknown) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 300) : '';

const getProductSearchQuery = (message: string) => {
    const lowered = message.toLowerCase();
    const stripped = lowered
        .replace(/\b(find|search|show|browse|look for|looking for|need|want|product|products|item|items|please)\b/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return stripped;
};

export const detectIntent = (message: string): ChatIntent => {
    const lowered = message.toLowerCase();

    if (/(order|track|status|where is my order|latest order|recent order)/.test(lowered)) {
        return 'ORDER_STATUS';
    }

    if (/(delivery|arrive|eta|when will it come|shipping|ship)/.test(lowered)) {
        return 'DELIVERY_INFO';
    }

    if (/(offer|offers|discount|coupon|deal|deals|sale)/.test(lowered)) {
        return 'OFFERS';
    }

    if (/(cart|remove from cart|add to cart|quantity|checkout cart|basket)/.test(lowered)) {
        return 'CART_HELP';
    }

    if (/(payment|pay|upi|card|razorpay|cash on delivery|cod|refund)/.test(lowered)) {
        return 'PAYMENT_HELP';
    }

    if (/(find|search|browse|show|product|products|vegetable|vegetables|fruit|fruits|milk|rice|apple|banana|tomato|potato|onion|carrot)/.test(lowered)) {
        return 'PRODUCT_SEARCH';
    }

    return 'UNKNOWN';
};

export const formatProducts = (products: Array<{ name: string; price: number }>) =>
    products.map((product) => `${product.name} - Rs.${product.price.toFixed(2)}`).join('\n');

const getLatestOrderResponse = async (userId: number) => {
    const result = await pool.query(
        `SELECT id, status, total_amount, created_at
         FROM orders
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
    );

    if (result.rows.length === 0) {
        return 'You do not have any orders yet. Once you place one, I can help track it.';
    }

    const order = result.rows[0];
    return `Your latest order #${order.id} is currently ${order.status}. It was placed on ${new Date(order.created_at).toLocaleString('en-IN')} and totals Rs.${Number(order.total_amount || 0).toFixed(2)}.`;
};

const getDeliveryInfoResponse = async (userId: number) => {
    const result = await pool.query(
        `SELECT id, status, created_at
         FROM orders
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
    );

    if (result.rows.length === 0) {
        return 'There is no active delivery yet. Place an order and I can help with delivery updates.';
    }

    const order = result.rows[0];
    if (order.status === 'delivered') {
        return `Order #${order.id} has already been delivered.`;
    }

    if (order.status === 'cancelled') {
        return `Order #${order.id} was cancelled, so there is no delivery in progress.`;
    }

    return `Order #${order.id} is in ${order.status} status. Delivery timing depends on the next status updates, but your latest order is still active.`;
};

const getOffersResponse = async () => {
    try {
        const result = await pool.query(
            `SELECT code, discount_type, discount_value
             FROM coupons
             WHERE is_active = true
               AND valid_from <= NOW()
               AND valid_until >= NOW()
             ORDER BY valid_until ASC
             LIMIT 3`
        );

        if (result.rows.length === 0) {
            return 'There are no active offers right now, but new deals are added regularly. Please check again soon.';
        }

        const offerLines = result.rows.map((coupon) => {
            const value = coupon.discount_type === 'percentage'
                ? `${Number(coupon.discount_value)}% off`
                : `Rs.${Number(coupon.discount_value).toFixed(0)} off`;
            return `${coupon.code}: ${value}`;
        });

        return `Here are the latest offers:\n${offerLines.join('\n')}`;
    } catch {
        return 'I could not load offers right now. Please try again in a moment.';
    }
};

const getCartHelpResponse = async (userId: number) => {
    const result = await pool.query(
        `SELECT COUNT(*) AS items_count, COALESCE(SUM(quantity), 0) AS units_count
         FROM cart_items
         WHERE user_id = $1`,
        [userId]
    );

    const summary = result.rows[0];
    const itemsCount = Number(summary?.items_count || 0);
    const unitsCount = Number(summary?.units_count || 0);

    if (itemsCount === 0) {
        return 'Your cart is empty right now. Browse products and tap Add to Cart to get started.';
    }

    return `Your cart currently has ${itemsCount} item${itemsCount === 1 ? '' : 's'} and ${unitsCount} total unit${unitsCount === 1 ? '' : 's'}. You can update quantities from the cart page before checkout.`;
};

const getPaymentHelpResponse = () =>
    'Happy Greens supports Razorpay for UPI and card payments, along with Cash on Delivery where available. At checkout, choose your preferred payment method and follow the payment prompt to complete the order.';

const getProductSearchResponse = async (message: string, req: Request) => {
    const searchQuery = getProductSearchQuery(message);
    if (!searchQuery) {
        return 'Tell me the product name you want, for example: tomato, milk, banana, or rice.';
    }

    const result = await pool.query(
        `SELECT id, name, price, discount_price, image_url, images
         FROM products
         WHERE is_deleted = false
           AND COALESCE(is_active, true) = true
           AND name ILIKE $1
         ORDER BY name ASC
         LIMIT 5`,
        [`%${searchQuery}%`]
    );

    if (result.rows.length === 0) {
        return `I could not find products matching "${searchQuery}". Try a specific product name like tomato, carrot, milk, or apple.`;
    }

    const baseUrl = getPublicBaseUrl(req);
    const products = result.rows.map((product: ProductRow) => ({
        id: product.id,
        name: product.name,
        price: Number(product.discount_price ?? product.price ?? 0),
        image_url: normalizeMediaUrl(
            Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image_url,
            baseUrl
        ),
    }));

    return {
        message: `Here are some matching products:\n${formatProducts(products)}`,
        products,
    };
};

export const chat = async (req: Request, res: Response) => {
    try {
        const message = normalizeMessage(req.body?.message);
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const intent = detectIntent(message);

        if (intent === 'ORDER_STATUS') {
            return res.json({ intent, response: await getLatestOrderResponse(userId) });
        }

        if (intent === 'DELIVERY_INFO') {
            return res.json({ intent, response: await getDeliveryInfoResponse(userId) });
        }

        if (intent === 'OFFERS') {
            return res.json({ intent, response: await getOffersResponse() });
        }

        if (intent === 'CART_HELP') {
            return res.json({ intent, response: await getCartHelpResponse(userId) });
        }

        if (intent === 'PAYMENT_HELP') {
            return res.json({ intent, response: getPaymentHelpResponse() });
        }

        if (intent === 'PRODUCT_SEARCH') {
            const productResponse = await getProductSearchResponse(message, req);
            if (typeof productResponse === 'string') {
                return res.json({ intent, response: productResponse, products: [] });
            }

            return res.json({ intent, response: productResponse.message, products: productResponse.products });
        }

        return res.json({
            intent: 'UNKNOWN',
            response: 'I can help with order status, delivery info, offers, product search, cart help, and payment questions. Try asking: track my order, show offers, what is in my cart, or how can I pay?',
        });
    } catch (error) {
        console.error('Error processing chat request:', error);
        return res.status(500).json({ message: 'Unable to process chat right now' });
    }
};
