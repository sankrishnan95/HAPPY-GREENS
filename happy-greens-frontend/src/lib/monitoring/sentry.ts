import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initFrontendMonitoring = () => {
    if (!SENTRY_DSN) return;

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],
        tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.2),
        replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0.1),
        replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || 1),
    });
};

export const captureFrontendException = (error: unknown, extra?: Record<string, unknown>) => {
    if (!SENTRY_DSN) return;
    Sentry.captureException(error, { extra });
};

export const captureFrontendMessage = (message: string, extra?: Record<string, unknown>) => {
    if (!SENTRY_DSN) return;
    Sentry.captureMessage(message, { level: 'info', extra });
};

export { Sentry };
