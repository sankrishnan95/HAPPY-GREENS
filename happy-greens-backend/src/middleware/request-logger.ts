import { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

const generateRequestId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startedAt = process.hrtime.bigint();
    const requestId = req.headers['x-request-id']?.toString() || generateRequestId();

    res.setHeader('x-request-id', requestId);
    res.locals.requestId = requestId;

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        logger.log(logLevel, 'API request completed', {
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    });

    next();
};
