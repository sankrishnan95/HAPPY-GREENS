import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const consoleFormat = isProduction
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metadata = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}: ${message}${metadata}`;
        })
    );

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    defaultMeta: { service: 'happy-greens-backend' },
    format: consoleFormat,
    transports: [new winston.transports.Console()],
});

export const logError = (message: string, error: unknown, meta: Record<string, unknown> = {}) => {
    logger.error(message, {
        ...meta,
        error: error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            }
            : error,
    });
};
