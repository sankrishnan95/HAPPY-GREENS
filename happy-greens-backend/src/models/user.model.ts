export interface User {
    id: number;
    email: string;
    password_hash: string;
    full_name: string;
    role: 'customer' | 'admin';
    created_at: Date;
    phone?: string;
    phone_verified?: boolean;
}

export interface UserProfile {
    id: number;
    email: string;
    full_name: string;
    role: string;
    phone?: string;
}
