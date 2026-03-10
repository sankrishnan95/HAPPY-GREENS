import { Request } from 'express';

export const getPublicBaseUrl = (req: Request): string => {
    const configured = process.env.PUBLIC_BASE_URL?.trim();
    if (configured) {
        return configured.replace(/\/+$/, '');
    }

    const host = req.get('host');
    if (!host) return '';
    return `https://${host}`;
};

export const normalizeMediaUrl = (value: any, baseUrl: string): any => {
    if (typeof value !== 'string') return value;

    const raw = value.trim();
    if (!raw) return raw;

    if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

    if (raw.startsWith('http://localhost') || raw.startsWith('https://localhost')) {
        try {
            const parsed = new URL(raw);
            return baseUrl ? `${baseUrl}${parsed.pathname}` : parsed.pathname;
        } catch {
            return raw;
        }
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

    if (!baseUrl) return raw;

    if (raw.startsWith('/uploads/')) return `${baseUrl}${raw}`;
    if (raw.startsWith('uploads/')) return `${baseUrl}/${raw}`;
    if (raw.startsWith('/')) return `${baseUrl}${raw}`;

    return `${baseUrl}/uploads/${raw}`;
};
