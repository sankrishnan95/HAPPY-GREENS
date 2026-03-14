import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
    getCustomerAnalyticsData,
    getInventoryInsightsData,
    getOrderAnalyticsData,
    getProductAnalyticsData,
    getSalesAnalyticsData,
    getTrafficAnalyticsData,
    recordAnalyticsEvent,
} from '../services/analytics.service';

const getOptionalUserId = (req: Request): number | null => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

    if (!token || !process.env.JWT_SECRET) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload & { id?: string | number };
        const parsed = Number(decoded?.id);
        return Number.isFinite(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

const sanitizeText = (value: unknown, maxLength: number): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : null;
};

const sanitizeProductId = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const trackAnalyticsEvent = async (req: Request, res: Response) => {
    const eventType = sanitizeText(req.body?.event_type, 64);
    const page = sanitizeText(req.body?.page, 255);
    const productId = sanitizeProductId(req.body?.product_id);
    const userId = getOptionalUserId(req);

    if (!eventType) {
        return res.status(400).json({ message: 'event_type is required' });
    }

    res.status(202).json({ success: true });

    setImmediate(() => {
        void recordAnalyticsEvent({
            eventType,
            userId,
            productId,
            page,
        }).catch((error) => {
            console.error('Analytics tracking error:', error);
        });
    });
};

export const getSalesAnalytics = async (_req: Request, res: Response) => {
    try {
        res.json(await getSalesAnalyticsData());
    } catch (error) {
        console.error('Sales analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProductAnalytics = async (_req: Request, res: Response) => {
    try {
        res.json(await getProductAnalyticsData());
    } catch (error) {
        console.error('Product analytics detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getCustomerAnalytics = async (_req: Request, res: Response) => {
    try {
        res.json(await getCustomerAnalyticsData());
    } catch (error) {
        console.error('Customer analytics detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getOrderAnalytics = async (_req: Request, res: Response) => {
    try {
        res.json(await getOrderAnalyticsData());
    } catch (error) {
        console.error('Order analytics detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getInventoryInsights = async (_req: Request, res: Response) => {
    try {
        res.json(await getInventoryInsightsData());
    } catch (error) {
        console.error('Inventory analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTrafficAnalytics = async (_req: Request, res: Response) => {
    try {
        res.json(await getTrafficAnalyticsData());
    } catch (error) {
        console.error('Traffic analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
