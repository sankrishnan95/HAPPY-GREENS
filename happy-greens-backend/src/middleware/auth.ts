import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT_SECRET is required - no default fallback for security
if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
    const token = headerToken || queryToken;

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // @ts-ignore
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

/**
 * Admin Role Middleware
 * Requires user to be authenticated and have admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    next();
};
