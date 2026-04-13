import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Search, Star, Heart, Menu, X, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import OptimizedImage from './OptimizedImage';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const cart = useStore((state) => state.cart);
    const user = useStore((state) => state.user);
    const token = useStore((state) => state.token);
    const wishlistIds = useStore((state) => state.wishlistIds);
    const syncWishlistWithBackend = useStore((state) => state.syncWishlistWithBackend);
    const syncCartWithBackend = useStore((state) => state.syncCartWithBackend);
    const cartCount = cart.length;

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
    }, [searchParams]);

    useEffect(() => {
        if (user && token) {
            syncWishlistWithBackend();
            syncCartWithBackend();
        }
    }, [user, token, syncWishlistWithBackend, syncCartWithBackend]);

    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length === 0) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/products?q=${encodeURIComponent(searchQuery)}&limit=5`);
                setSuggestions(res.data.products);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Failed to fetch suggestions');
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        navigate(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : '/shop');
        setShowSuggestions(false);
        setMenuOpen(false);
    };

    const quickLinks = [
        { label: 'Shop', to: '/shop' },
        ...(user ? [{ label: 'Rewards', to: '/rewards' }] : []),
        ...(user ? [{ label: 'Wishlist', to: '/wishlist' }] : []),
        { label: user ? 'Profile' : 'Login', to: user ? '/profile' : '/login' },
    ];

    return (
        <>
            <nav className="glass border-b border-white/70 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 md:px-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => setMenuOpen(true)}
                                className="safe-touch inline-flex items-center justify-center rounded-2xl border border-[#dbe7d0] bg-white text-slate-700 shadow-sm md:hidden"
                                aria-label="Open menu"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setMenuOpen(false)}>
                                <img
                                    src="/logo.png"
                                    alt="Happy Greens"
                                    className="h-[3.35rem] w-[3.35rem] object-contain sm:h-[3.8rem] sm:w-[3.8rem]"
                                    loading="eager"
                                    decoding="async"
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-[1.12rem] font-display font-bold leading-none text-gradient">Happy Greens</p>
                                    <p className="truncate text-[0.76rem] font-medium text-slate-500">Groceries in minutes</p>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            {user && <NotificationBell />}
                            {user && (
                                <Link
                                    to="/wishlist"
                                    className="safe-touch relative inline-flex items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm"
                                    aria-label="Wishlist"
                                >
                                    <Heart className="h-5 w-5 fill-rose-300" />
                                    {wishlistIds.length > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                            {wishlistIds.length}
                                        </span>
                                    )}
                                </Link>
                            )}

                            <Link to="/cart" className="safe-touch relative inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.2)]" aria-label="Cart">
                                <ShoppingCart className="h-5 w-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-lime-400 px-1 text-[10px] font-bold text-slate-900">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 md:hidden">
                        <Link to={user ? '/profile' : '/login'} className="safe-touch inline-flex items-center gap-2 rounded-2xl border border-[#dbe7d0] bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
                            <User className="h-4 w-4" />
                            <span>{user ? 'Account' : 'Login'}</span>
                        </Link>
                    </div>

                    <div className="mobile-search-shell" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowSuggestions(false); }}>
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }} placeholder="Search vegetables, fruits, milk..." className="h-12 w-full bg-transparent pl-10 pr-24 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400" />
                            <button type="submit" className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center justify-center rounded-full bg-green-600 px-3 text-xs font-bold text-white shadow-sm">Search</button>
                        </form>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-[1.25rem] border border-[#e4ecda] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.14)]">
                                {suggestions.map((product) => (
                                    <button key={product.id} type="button" onMouseDown={(e) => { e.preventDefault(); navigate(`/product/${product.id}`); setShowSuggestions(false); setSearchQuery(''); }} className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-0 hover:bg-slate-50">
                                        <div className="h-12 w-12 overflow-hidden rounded-2xl bg-[#f4f8ef]">
                                            <OptimizedImage src={product.images && product.images.length > 0 ? product.images[0] : product.image_url} alt={product.name} className="h-full w-full object-cover" width={48} height={48} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                                            <p className="mt-0.5 text-xs font-bold text-green-700">Rs. {product.discountPrice || product.price}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-300" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hidden items-center justify-end gap-4 md:flex">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Link to="/shop" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-green-700">Shop</Link>
                            {user && <Link to="/wishlist" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-rose-600">Wishlist</Link>}
                            {user && <Link to="/rewards" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-amber-600"><Star className="h-4 w-4" />Rewards</Link>}
                            <Link to={user ? '/profile' : '/login'} className="inline-flex items-center gap-2 rounded-full border border-[#dbe7d0] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><User className="h-4 w-4" /><span>{user ? user.full_name : 'Login'}</span></Link>
                        </div>
                    </div>
                </div>
            </nav>

            {menuOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-950/45 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
                    <aside className="mobile-app-card absolute left-3 right-3 top-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-700/70">Menu</p>
                                <p className="mt-1 text-lg font-display font-bold text-slate-900">Browse Happy Greens</p>
                            </div>
                            <button type="button" onClick={() => setMenuOpen(false)} className="safe-touch inline-flex items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="space-y-2 px-3 py-3">
                            {quickLinks.map((item) => (
                                <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#f5f8f0]">
                                    <span>{item.label}</span>
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                </Link>
                            ))}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
};

export default Navbar;
