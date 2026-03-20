import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getInitialQuantity, incrementQuantity, normalizeUnit } from '../utils/productUnits';

interface Product {
    id: number;
    name: string;
    price: number;
    discountPrice?: number;
    pricePerUnit?: number;
    unit?: string;
    minQty?: number;
    stepQty?: number;
    image_url: string;
    images?: string[];
}

interface CartItem extends Product {
    quantity: number;
}

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    phone?: string;
    phone_verified?: boolean;
}

interface AppState {
    cart: CartItem[];
    user: User | null;
    token: string | null;
    wishlistIds: number[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    setUser: (user: User | null, token: string | null) => void;
    setWishlist: (productIds: number[]) => void;
    addWishlistItem: (productId: number) => void;
    removeWishlistItem: (productId: number) => void;
    logout: () => void;
}

const normalizeCartItem = (item: any): CartItem => {
    const baseProduct = {
        ...item,
        unit: normalizeUnit(item?.unit),
        minQty: Number(item?.minQty ?? 1),
        stepQty: Number(item?.stepQty ?? 1),
        pricePerUnit: Number(item?.pricePerUnit ?? item?.price ?? 0),
    };

    const rawQuantity = Number(item?.quantity);
    const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0
        ? rawQuantity
        : getInitialQuantity(baseProduct);

    return {
        ...baseProduct,
        quantity,
    };
};

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            cart: [],
            user: null,
            token: null,
            wishlistIds: [],
            addToCart: (product) =>
                set((state) => {
                    const normalizedProduct = normalizeCartItem(product);
                    const existing = state.cart.find((item) => item.id === product.id);
                    if (existing) {
                        return {
                            cart: state.cart.map((item) =>
                                item.id === product.id ? { ...item, quantity: incrementQuantity(item, item.quantity) } : item
                            ),
                        };
                    }
                    return { cart: [...state.cart, { ...normalizedProduct, quantity: getInitialQuantity(normalizedProduct) }] };
                }),
            removeFromCart: (productId) =>
                set((state) => ({
                    cart: state.cart.filter((item) => item.id !== productId),
                })),
            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    cart: state.cart.flatMap((item) => {
                        if (item.id !== productId) return [item];
                        const nextQuantity = Number(quantity);
                        return nextQuantity <= 0 ? [] : [{ ...item, quantity: nextQuantity }];
                    }),
                })),
            clearCart: () => set({ cart: [] }),
            setUser: (user, token) => set({ user, token }),
            setWishlist: (productIds) => set({ wishlistIds: [...new Set(productIds)] }),
            addWishlistItem: (productId) =>
                set((state) => ({
                    wishlistIds: state.wishlistIds.includes(productId)
                        ? state.wishlistIds
                        : [...state.wishlistIds, productId],
                })),
            removeWishlistItem: (productId) =>
                set((state) => ({
                    wishlistIds: state.wishlistIds.filter((id) => id !== productId),
                })),
            logout: () => set({ user: null, token: null, cart: [], wishlistIds: [] }),
        }),
        {
            name: 'happy-greens-storage',
            merge: (persistedState: any, currentState) => {
                const nextState = { ...currentState, ...(persistedState || {}) } as AppState;
                return {
                    ...nextState,
                    cart: Array.isArray((persistedState as any)?.cart)
                        ? (persistedState as any).cart.map(normalizeCartItem)
                        : nextState.cart,
                };
            },
        }
    )
);
