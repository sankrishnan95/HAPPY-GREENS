export interface OrderData {
    id: number;
    total_amount: number;
    discount_amount?: number;
    points_used?: number;
    status: string;
    payment_method: string;
    created_at: Date;
    full_name: string;
    email: string;
    phone: string;
    shipping_address: any;
    payment_amount: number;
    payment_gateway: string;
    payment_method_type: string;
    gateway_payment_id: string;
}

export interface OrderItem {
    product_name: string;
    quantity: number;
    unit?: string;
    price_at_purchase: number;
    original_price_at_purchase?: number;
    line_total: number;
}
