// ============================================================
// formatCurrency – formats a number as Indian Rupee string
// Usage: formatCurrency(123.4)  →  "₹123.40"
// ============================================================
export const formatCurrency = (value: number | string | null | undefined): string => {
    const num = Number(value);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toFixed(2)}`;
};

// ============================================================
// formatDate – formats an ISO date string to a human-readable date
// Usage: formatDate('2024-01-15T09:00:00Z')  →  "15 Jan 2024"
// ============================================================
export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
};

// ============================================================
// formatDateTime – like formatDate but includes time
// ============================================================
export const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    try {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
};

// Re-export getStatusColor so all pages can import it from one place
export { getStatusColor } from './status';
