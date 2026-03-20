import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
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

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

const sanitizeName = (value: string): string =>
    value.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

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

        const images = isCloudinaryConfigured
            ? await Promise.all(files.map(uploadToCloudinary))
            : await Promise.all(files.map(saveLocalFile));

        res.status(200).json({ images });
    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ message: 'Server file upload failed' });
    }
});

export default router;
