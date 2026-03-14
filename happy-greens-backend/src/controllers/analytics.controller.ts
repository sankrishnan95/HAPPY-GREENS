import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
    AnalyticsRange,
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

const getAnalyticsRange = (req: Request): AnalyticsRange => {
    const range = typeof req.query.range === 'string' ? req.query.range : '7d';
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;

    return { range, from, to };
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

export const getSalesAnalytics = async (req: Request, res: Response) => {
    try {
        res.json(await getSalesAnalyticsData(getAnalyticsRange(req)));
    } catch (error) {
        console.error('Sales analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProductAnalytics = async (req: Request, res: Response) => {
    try {
        res.json(await getProductAnalyticsData(getAnalyticsRange(req)));
    } catch (error) {
        console.error('Product analytics detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getCustomerAnalytics = async (req: Request, res: Response) => {
    try {
        res.json(await getCustomerAnalyticsData(getAnalyticsRange(req)));
    } catch (error) {
        console.error('Customer analytics detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getOrderAnalytics = async (req: Request, res: Response) => {
    try {
        res.json(await getOrderAnalyticsData(getAnalyticsRange(req)));
    } catch (error) {
        console.error('Order analytics detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getInventoryInsights = async (req: Request, res: Response) => {
    try {
        res.json(await getInventoryInsightsData(getAnalyticsRange(req)));
    } catch (error) {
        console.error('Inventory analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTrafficAnalytics = async (req: Request, res: Response) => {
    try {
        res.json(await getTrafficAnalyticsData(getAnalyticsRange(req)));
    } catch (error) {
        console.error('Traffic analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
