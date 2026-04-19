import * as Sentry from '@sentry/node';
import { logger } from './logger';

const SENTRY_DSN = process.env.SENTRY_DSN;

export const initBackendMonitoring = () => {
    if (!SENTRY_DSN) {
        logger.warn('Sentry DSN not configured. Backend error monitoring is disabled.');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.2),
    });
};

export const captureBackendException = (error: unknown, context: Record<string, unknown> = {}) => {
    if (!SENTRY_DSN) return;
    Sentry.captureException(error, { extra: context });
};

export { Sentry };
