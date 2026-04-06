import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getInitialQuantity, incrementQuantity, normalizeUnit } from '../utils/productUnits';
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart } from '../services/cart.service';
import { getWishlist } from '../services/wishlist.service';

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
    coupon: { code: string; discount: number; message: string } | null;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    setCoupon: (coupon: { code: string; discount: number; message: string } | null) => void;
    setUser: (user: User | null, token: string | null) => void;
    setWishlist: (productIds: number[]) => void;
    addWishlistItem: (productId: number) => void;
    removeWishlistItem: (productId: number) => void;
    logout: () => void;
    syncCartWithBackend: () => Promise<void>;
    syncWishlistWithBackend: () => Promise<void>;
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
        (set, get) => ({
            cart: [],
            user: null,
            token: null,
            wishlistIds: [],
            coupon: null,
            setCoupon: (coupon) => set({ coupon }),
            addToCart: (product) => {
                const normalizedProduct = normalizeCartItem(product);
                const quantityToAdd = getInitialQuantity(normalizedProduct);
                
                set((state) => {
                    const existing = state.cart.find((item) => item.id === product.id);
                    if (existing) {
                        return {
                            cart: state.cart.map((item) =>
                                item.id === product.id ? { ...item, quantity: incrementQuantity(item, item.quantity) } : item
                            ),
                            coupon: null,
                        };
                    }
                    return { cart: [...state.cart, { ...normalizedProduct, quantity: quantityToAdd }], coupon: null };
                });

                if (get().user && get().token) {
                    apiAddToCart(product.id, quantityToAdd).catch(console.error);
                }
            },
            removeFromCart: (productId) => {
                set((state) => ({
                    cart: state.cart.filter((item) => item.id !== productId),
                    coupon: null,
                }));
                if (get().user && get().token) {
                    apiRemoveFromCart(productId).catch(console.error);
                }
            },
            updateQuantity: (productId, quantity) => {
                set((state) => ({
                    coupon: null,
                    cart: state.cart.flatMap((item) => {
                        if (item.id !== productId) return [item];
                        const nextQuantity = Number(quantity);
                        return nextQuantity <= 0 ? [] : [{ ...item, quantity: nextQuantity }];
                    }),
                }));
                if (get().user && get().token) {
                    const nextQuantity = Number(quantity);
                    if (nextQuantity <= 0) {
                        apiRemoveFromCart(productId).catch(console.error);
                    } else {
                        apiUpdateCartItem(productId, nextQuantity).catch(console.error);
                    }
                }
            },
            clearCart: () => {
                set({ cart: [], coupon: null });
                if (get().user && get().token) {
                    apiClearCart().catch(console.error);
                }
            },
            setUser: (user, token) =>
                set((state) => {
                    const currentUserId = state.user?.id ?? null;
                    const nextUserId = user?.id ?? null;
                    const isSwitchingAccounts = currentUserId !== null && nextUserId !== null && currentUserId !== nextUserId;

                    return {
                        user,
                        token,
                        cart: isSwitchingAccounts ? [] : state.cart,
                        wishlistIds: isSwitchingAccounts ? [] : state.wishlistIds,
                    };
                }),
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
            logout: () => set({ user: null, token: null, cart: [], wishlistIds: [], coupon: null }),
            syncCartWithBackend: async () => {
                try {
                    const localCart = get().cart || [];
                    const backendCart = await getCart();
                    
                    for (const item of localCart) {
                        const existingInBackend = backendCart.find((b: any) => b.product_id === item.id);
                        if (!existingInBackend && item.id) {
                            await apiAddToCart(item.id, item.quantity).catch(console.error);
                        }
                    }
                    
                    const finalCart = await getCart();
                    set({ cart: finalCart.map((item: any) => ({ ...normalizeCartItem(item), id: item.product_id })) });
                } catch (error) {
                    console.error('Failed to sync cart', error);
                }
            },
            syncWishlistWithBackend: async () => {
                try {
                    const data = await getWishlist();
                    set({ wishlistIds: (data.items || []).map((item: any) => item.id) });
                } catch (error) {
                    console.error('Failed to sync wishlist', error);
                }
            }
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
