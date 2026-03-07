import api from './api';

export interface LoyaltyInfo {
    loyalty_points: number;
    total_points_earned: number;
    total_points_redeemed: number;
}

export interface LoyaltyTransaction {
    id: number;
    type: 'earned' | 'redeemed' | 'reversed';
    points: number;
    description: string;
    created_at: string;
    order_id: number | null;
}

/**
 * Fetch loyalty summary for the logged-in user
 */
export const getLoyaltyInfo = async (): Promise<LoyaltyInfo> => {
    const res = await api.get('/loyalty');
    return res.data.loyalty;
};

/**
 * Fetch loyalty transaction history for the logged-in user
 */
export const getLoyaltyHistory = async (): Promise<LoyaltyTransaction[]> => {
    const res = await api.get('/loyalty/history');
    return res.data.history;
};
