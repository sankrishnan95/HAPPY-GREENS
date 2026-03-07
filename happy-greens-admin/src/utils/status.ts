// ============================================================
// Order & Delivery status colour map
// Single source of truth — imported by all pages/components
// ============================================================
export const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    placed: 'bg-orange-100 text-orange-800',
    accepted: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-red-100 text-red-800',
};

/** Returns the Tailwind classes for a given status, with a grey fallback. */
export const getStatusColor = (status: string): string =>
    STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800';

// ============================================================
// Valid status transitions for orders
// ============================================================
export const ORDER_STATUS_OPTIONS = [
    'pending',
    'placed',
    'accepted',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
] as const;
