import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import crypto, { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const r2Endpoint = process.env.R2_ENDPOINT?.replace(/\/+$/, '');
const r2Bucket = process.env.R2_BUCKET || 'happy-greens-media';
const r2UploadFolder = process.env.R2_UPLOAD_FOLDER || 'uploads';
const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');
const isR2Configured = Boolean(
    r2Endpoint &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    r2Bucket &&
    r2PublicBaseUrl
);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

const sanitizeName = (value: string): string =>
    value.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

const encodeStoragePath = (value: string): string =>
    value.split('/').map((part) => encodeURIComponent(part)).join('/');

const hmac = (key: crypto.BinaryLike | crypto.KeyObject, value: string): Buffer =>
    crypto.createHmac('sha256', key).update(value).digest();

const hashHex = (value: crypto.BinaryLike): string =>
    crypto.createHash('sha256').update(value).digest('hex');

const getStorageProvider = (): 'r2' | 'cloudinary' | 'local' => {
    const configuredProvider = (process.env.UPLOAD_PROVIDER || process.env.MEDIA_STORAGE_PROVIDER || '').toLowerCase();

    if (configuredProvider === 'r2') {
        if (!isR2Configured) {
            throw new Error('R2 storage selected but R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, or R2_PUBLIC_BASE_URL is missing');
        }
        return 'r2';
    }

    if (configuredProvider === 'cloudinary') {
        if (!isCloudinaryConfigured) {
            throw new Error('Cloudinary storage selected but Cloudinary env vars are missing');
        }
        return 'cloudinary';
    }

    // Mixed mode: once R2 env is present, only new uploads go there.
    if (isR2Configured) return 'r2';
    if (isCloudinaryConfigured) return 'cloudinary';
    return 'local';
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedFileTypes = /jpeg|jpg|png|webp|gif|mp4|webm/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype.toLowerCase());

    if (extname && mimetype) {
        return cb(null, true);
    }
    cb(new Error('Images and short videos only!'));
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
});

const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const base = path.basename(file.originalname, path.extname(file.originalname));
    const publicId = `${Date.now()}-${sanitizeName(base)}`;

    return new Promise((resolve, reject) => {
        const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: process.env.CLOUDINARY_FOLDER || 'happy-greens',
                resource_type: resourceType,
                public_id: publicId,
                format: ext || undefined,
            },
            (error, result) => {
                if (error || !result?.secure_url) {
                    return reject(error || new Error('Cloudinary upload failed'));
                }
                resolve(result.secure_url);
            }
        );

        stream.end(file.buffer);
    });
};

const uploadToR2 = async (file: Express.Multer.File): Promise<string> => {
    if (!r2Endpoint || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !r2PublicBaseUrl) {
        throw new Error('R2 storage is not configured');
    }

    const now = new Date();
    const ext = path.extname(file.originalname).toLowerCase();
    const base = sanitizeName(path.basename(file.originalname, ext)) || 'media';
    const folder = r2UploadFolder.replace(/^\/+|\/+$/g, '');
    const storagePath = [
        folder,
        String(now.getFullYear()),
        String(now.getMonth() + 1).padStart(2, '0'),
        `${Date.now()}-${randomUUID()}-${base}${ext}`,
    ].filter(Boolean).join('/');

    const encodedBucket = encodeURIComponent(r2Bucket);
    const encodedPath = encodeStoragePath(storagePath);
    const uploadUrl = `${r2Endpoint}/${encodedBucket}/${encodedPath}`;
    const endpointHost = new URL(r2Endpoint).host;
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const payloadHash = hashHex(file.buffer);
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalHeaders = [
        `content-type:${file.mimetype}`,
        `host:${endpointHost}`,
        `x-amz-content-sha256:${payloadHash}`,
        `x-amz-date:${amzDate}`,
        '',
    ].join('\n');
    const canonicalRequest = [
        'PUT',
        `/${encodedBucket}/${encodedPath}`,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHash,
    ].join('\n');
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        hashHex(canonicalRequest),
    ].join('\n');
    const dateKey = hmac(`AWS4${process.env.R2_SECRET_ACCESS_KEY}`, dateStamp);
    const regionKey = hmac(dateKey, region);
    const serviceKey = hmac(regionKey, service);
    const signingKey = hmac(serviceKey, 'aws4_request');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    const authorization = `AWS4-HMAC-SHA256 Credential=${process.env.R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            Authorization: authorization,
            'Content-Type': file.mimetype,
            'Cache-Control': 'public, max-age=31536000',
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzDate,
        },
        body: new Blob([file.buffer as unknown as BlobPart], { type: file.mimetype }),
    });

    if (!response.ok) {
        const message = await response.text().catch(() => '');
        throw new Error(`R2 upload failed (${response.status}): ${message}`);
    }

    return `${r2PublicBaseUrl}/${encodedPath}`;
};

const saveLocalFile = async (file: Express.Multer.File): Promise<string> => {
    const filename = `${Date.now()}-${sanitizeName(file.originalname)}`;
    const filePath = path.join(uploadDir, filename);
    await fsPromises.writeFile(filePath, file.buffer);
    return `/uploads/${filename}`;
};

router.post('/', authenticate, requireAdmin, upload.array('images', 10), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No media files uploaded' });
        }

        const provider = getStorageProvider();
        const uploadFile =
            provider === 'r2'
                ? uploadToR2
                : provider === 'cloudinary'
                    ? uploadToCloudinary
                    : saveLocalFile;

        const images = await Promise.all(files.map(uploadFile));

        res.status(200).json({ images, provider });
    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ message: 'Server file upload failed' });
    }
});

export default router;
