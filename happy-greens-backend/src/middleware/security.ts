import { NextFunction, Request, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const applySecurityHeaders = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    );
    next();
};

export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
    if (!isProduction) {
        return next();
    }

    const forwardedProto = req.header('x-forwarded-proto');
    if (forwardedProto && forwardedProto !== 'https') {
        return res.status(400).json({ message: 'HTTPS is required' });
    }

    next();
};
