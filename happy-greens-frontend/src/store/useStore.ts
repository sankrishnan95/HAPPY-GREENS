import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
    id: number;
    name: string;
    price: number;
    discountPrice?: number;
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

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            cart: [],
            user: null,
            token: null,
            wishlistIds: [],
            addToCart: (product) =>
                set((state) => {
                    const existing = state.cart.find((item) => item.id === product.id);
                    if (existing) {
                        return {
                            cart: state.cart.map((item) =>
                                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                            ),
                        };
                    }
                    return { cart: [...state.cart, { ...product, quantity: 1 }] };
                }),
            removeFromCart: (productId) =>
                set((state) => ({
                    cart: state.cart.filter((item) => item.id !== productId),
                })),
            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    cart: state.cart.map((item) =>
                        item.id === productId ? { ...item, quantity } : item
                    ),
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
        }
    )
);
