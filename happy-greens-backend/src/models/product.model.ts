export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    discountPrice?: number | null;
    stock_quantity: number;
    category_id: number | null;
    image_url: string;
    images?: string[];
    isActive: boolean;
    is_deleted: boolean;
    created_at: Date;
    category_name?: string;
}

export interface CreateProductDTO {
    name: string;
    description: string;
    price: number;
    discountPrice?: number | null;
    stock_quantity: number;
    category_id: number | null;
    image_url: string;
    images?: string[];
    isActive?: boolean;
}
