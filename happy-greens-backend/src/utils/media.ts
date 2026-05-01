import { Request } from 'express';
import fs from 'fs';
import path from 'path';

const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';
const FALLBACK_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';

const normalizeProtocol = (value: string): string => {
    const raw = value.trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^https\/\//i.test(raw)) return raw.replace(/^https\/\//i, 'https://');
    if (/^http\/\//i.test(raw)) return raw.replace(/^http\/\//i, 'http://');
    if (/^\/\/[^/]/.test(raw)) return `https:${raw}`;
    return raw;
};

const getFallbackByExtension = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) {
        return FALLBACK_VIDEO_URL;
    }
    return FALLBACK_IMAGE_URL;
};

const getUploadsFilePath = (pathname: string): string => {
    const filename = pathname.replace(/^\/uploads\//, '');
    return path.join(process.cwd(), 'uploads', filename);
};

const hasLocalUploadFile = (pathname: string): boolean => {
    if (!pathname.startsWith('/uploads/')) return false;
    const localPath = getUploadsFilePath(pathname);
    return fs.existsSync(localPath);
};

const isSameOrigin = (url: URL, baseUrl: string): boolean => {
    if (!baseUrl) return false;
    try {
        return url.origin === new URL(baseUrl).origin;
    } catch {
        return false;
    }
};

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

    const raw = normalizeProtocol(value);
    if (!raw) return raw;

    if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

    if (raw.startsWith('http://localhost') || raw.startsWith('https://localhost')) {
        try {
            const parsed = new URL(raw);
            const pathname = parsed.pathname;
            if (pathname.startsWith('/uploads/') && !hasLocalUploadFile(pathname)) {
                return getFallbackByExtension(pathname);
            }
            return baseUrl ? `${baseUrl}${pathname}` : pathname;
        } catch {
            return getFallbackByExtension(raw);
        }
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        try {
            const parsed = new URL(raw);
            const isBackendUploadUrl = isSameOrigin(parsed, baseUrl);
            if (isBackendUploadUrl && parsed.pathname.startsWith('/uploads/') && !hasLocalUploadFile(parsed.pathname)) {
                return getFallbackByExtension(parsed.pathname);
            }
            return raw;
        } catch {
            return getFallbackByExtension(raw);
        }
    }

    if (!baseUrl) return raw;

    if (raw.startsWith('/uploads/')) {
        if (!hasLocalUploadFile(raw)) return getFallbackByExtension(raw);
        return `${baseUrl}${raw}`;
    }

    if (raw.startsWith('uploads/')) {
        const normalized = `/${raw}`;
        if (!hasLocalUploadFile(normalized)) return getFallbackByExtension(raw);
        return `${baseUrl}/${raw}`;
    }

    if (raw.startsWith('/')) return `${baseUrl}${raw}`;

    const uploadsPath = `/uploads/${raw}`;
    if (!hasLocalUploadFile(uploadsPath)) return getFallbackByExtension(raw);
    return `${baseUrl}${uploadsPath}`;
};
