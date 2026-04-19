import { NextFunction, Request, Response } from 'express';
import { captureBackendException } from '../lib/sentry';
import { logError } from '../lib/logger';

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const requestId = res.locals.requestId;

    captureBackendException(error, {
        requestId,
        path: req.originalUrl,
        method: req.method,
    });
    logError('Unhandled API error', error, {
        requestId,
        path: req.originalUrl,
        method: req.method,
    });

    if (res.headersSent) {
        return;
    }

    res.status(500).json({
        message: 'Internal server error',
        requestId,
    });
};
