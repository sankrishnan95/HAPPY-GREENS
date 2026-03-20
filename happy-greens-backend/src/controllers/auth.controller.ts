import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db';
import { sendEmail } from '../services/email.service';
import { sendSms } from '../services/sms.service';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizePhone = (phone: unknown): string | null => {
    if (typeof phone !== 'string') return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    return null;
};

const createAndStoreOtp = async (phone: string) => {
    const rateLimitCheck = await pool.query(
        `SELECT COUNT(*) FROM phone_otps WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [phone]
    );
    if (parseInt(rateLimitCheck.rows[0].count, 10) >= 5) {
        throw new Error('RATE_LIMIT');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    await pool.query(
        `INSERT INTO phone_otps (phone, otp_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
        [phone, otpHash]
    );

    return otp;
};

const validateLatestOtp = async (phone: string, otp: string) => {
    const otpRecordResult = await pool.query(
        `SELECT * FROM phone_otps
         WHERE phone = $1 AND verified = false AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [phone]
    );

    if (otpRecordResult.rows.length === 0) {
        throw new Error('OTP_EXPIRED');
    }

    const otpRecord = otpRecordResult.rows[0];

    if (otpRecord.attempts >= 3) {
        throw new Error('OTP_ATTEMPTS');
    }

    await pool.query('UPDATE phone_otps SET attempts = attempts + 1 WHERE id = $1', [otpRecord.id]);

    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp_hash);
    if (!isMatch) {
        throw new Error('OTP_INVALID');
    }

    await pool.query('UPDATE phone_otps SET verified = true WHERE id = $1', [otpRecord.id]);
};

export const register = async (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const full_name = typeof req.body?.full_name === 'string' ? req.body.full_name.trim().slice(0, 150) : '';
    if (!email || !email.includes('@') || password.length < 8 || !full_name) {
        return res.status(400).json({ message: 'Invalid registration details' });
    }
    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role, phone, phone_verified',
            [email, passwordHash, full_name]
        );

        const token = jwt.sign({ id: newUser.rows[0].id, role: newUser.rows[0].role }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ user: newUser.rows[0], token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, phone: user.phone, phone_verified: user.phone_verified },
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email is required' });
    }
    try {
        const userResult = await pool.query('SELECT id, full_name FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.json({ message: 'If the account exists, a password reset link has been sent' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
            [resetToken, tokenExpires, email]
        );

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/reset-password?token=${resetToken}`;
        const message = `Hello ${userResult.rows[0].full_name || 'User'},\n\nYou requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

        await sendEmail(email, 'Password Reset - Happy Greens', message);

        res.json({ message: 'If the account exists, a password reset link has been sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!token || password.length < 8) {
        return res.status(400).json({ message: 'Invalid password reset request' });
    }
    try {
        const userResult = await pool.query(
            'SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [passwordHash, userResult.rows[0].id]
        );

        res.json({ message: 'Password has been successfully reset' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Google ID token is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({ message: 'Google OAuth is not configured on server' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ message: 'Invalid Google token payload' });
        }

        const { email, name, sub: google_id } = payload;

        let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(randomPassword, salt);

            userResult = await pool.query(
                `INSERT INTO users (email, password_hash, full_name, google_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, email, full_name, role, phone, phone_verified, google_id`,
                [email, passwordHash, name || 'Google User', google_id]
            );
        } else if (!userResult.rows[0].google_id) {
            await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [google_id, userResult.rows[0].id]);
            userResult = await pool.query(
                'SELECT id, email, full_name, role, phone, phone_verified, google_id FROM users WHERE id = $1',
                [userResult.rows[0].id]
            );
        } else if (userResult.rows[0].google_id !== google_id) {
            return res.status(400).json({ message: 'This email is already linked to a different Google account' });
        } else {
            userResult = await pool.query(
                'SELECT id, email, full_name, role, phone, phone_verified, google_id FROM users WHERE id = $1',
                [userResult.rows[0].id]
            );
        }

        const user = userResult.rows[0];
        const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, phone: user.phone, phone_verified: user.phone_verified },
            token: jwtToken
        });
    } catch (error: any) {
        const message = String(error?.message || 'Google authentication failed');
        console.error('Google Login Error:', message);

        if (message.toLowerCase().includes('wrong recipient') || message.toLowerCase().includes('audience')) {
            return res.status(400).json({ message: 'Google client ID mismatch between frontend and backend' });
        }

        if (message.toLowerCase().includes('jwt') || message.toLowerCase().includes('token')) {
            return res.status(400).json({ message: 'Invalid or expired Google ID token' });
        }

        res.status(500).json({ message: 'Server error during Google auth' });
    }
};

// ============================================================================
// PASSWORDLESS OTP AUTHENTICATION
// ============================================================================
export const sendOtp = async (req: Request, res: Response) => {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const otp = await createAndStoreOtp(phone);

        // Send SMS
        const message = `Your Happy Greens verification code is ${otp}. It will expire in 5 minutes.`;
        await sendSms(phone, message, otp);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        if (error instanceof Error && error.message === 'RATE_LIMIT') {
            return res.status(429).json({ message: 'Too many OTP requests. Please try again later.' });
        }
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    const phone = normalizePhone(req.body?.phone);
    const { otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    try {
        await validateLatestOtp(phone, otp);

        // Find existing user or create a new one
        let userResult = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        let user;

        if (userResult.rows.length > 0) {
            user = userResult.rows[0];
            // If phone wasn't verified before, mark it verified
            if (!user.phone_verified) {
                await pool.query('UPDATE users SET phone_verified = true WHERE id = $1', [user.id]);
                user.phone_verified = true;
            }
        } else {
            // New User Registration via OTP
            // Email/Password are NOT NULL in DB, so we generate a dummy email and random password hash
            const dummyEmail = `${phone.replace(/\D/g, '')}@happygreens.app`;
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const dummyPasswordHash = await bcrypt.hash(randomPassword, salt);

            const newUserResult = await pool.query(
                `INSERT INTO users(email, password_hash, full_name, phone, phone_verified)
            VALUES($1, $2, $3, $4, $5) 
                 RETURNING id, email, full_name, role, phone, phone_verified`,
                [dummyEmail, dummyPasswordHash, `User ${phone.slice(-4)}`, phone, true]
            );
            user = newUserResult.rows[0];
        }

        // Issue JWT
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                phone: user.phone,
                phone_verified: user.phone_verified
            },
            token
        });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'OTP_EXPIRED') {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }
            if (error.message === 'OTP_ATTEMPTS') {
                return res.status(429).json({ message: 'Maximum verification attempts reached. Please request a new OTP.' });
            }
            if (error.message === 'OTP_INVALID') {
                return res.status(400).json({ message: 'Invalid OTP' });
            }
        }
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};

export const sendPhoneVerificationOtp = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const phone = normalizePhone(req.body?.phone);

    if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (!phone) {
        return res.status(400).json({ message: 'Valid phone number is required' });
    }

    try {
        const existingPhoneOwner = await pool.query(
            'SELECT id FROM users WHERE phone = $1 AND id <> $2',
            [phone, userId]
        );
        if (existingPhoneOwner.rows.length > 0) {
            return res.status(400).json({ message: 'This phone number is already linked to another account' });
        }

        const otp = await createAndStoreOtp(phone);
        const message = `Your Happy Greens verification code is ${otp}. It will expire in 5 minutes.`;
        await sendSms(phone, message, otp);

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        if (error instanceof Error && error.message === 'RATE_LIMIT') {
            return res.status(429).json({ message: 'Too many OTP requests. Please try again later.' });
        }
        console.error('Error sending phone verification OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

export const verifyPhoneVerificationOtp = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const phone = normalizePhone(req.body?.phone);
    const { otp } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    try {
        const existingPhoneOwner = await pool.query(
            'SELECT id FROM users WHERE phone = $1 AND id <> $2',
            [phone, userId]
        );
        if (existingPhoneOwner.rows.length > 0) {
            return res.status(400).json({ message: 'This phone number is already linked to another account' });
        }

        await validateLatestOtp(phone, otp);

        const updatedUserResult = await pool.query(
            `UPDATE users
             SET phone = $1, phone_verified = true
             WHERE id = $2
             RETURNING id, email, full_name, role, phone, phone_verified`,
            [phone, userId]
        );

        res.json({
            message: 'Phone verified successfully',
            user: updatedUserResult.rows[0],
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'OTP_EXPIRED') {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }
            if (error.message === 'OTP_ATTEMPTS') {
                return res.status(429).json({ message: 'Maximum verification attempts reached. Please request a new OTP.' });
            }
            if (error.message === 'OTP_INVALID') {
                return res.status(400).json({ message: 'Invalid OTP' });
            }
        }
        console.error('Error verifying phone for existing user:', error);
        res.status(500).json({ message: 'Failed to verify phone' });
    }
};

