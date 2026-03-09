import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Menu, Search, MapPin, Star, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getWishlist } from '../services/wishlist.service';
import { API_BASE_URL } from '../config/api';

const Navbar = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const cart = useStore((state) => state.cart);
    const user = useStore((state) => state.user);
    const token = useStore((state) => state.token);
    const wishlistIds = useStore((state) => state.wishlistIds);
    const setWishlist = useStore((state) => state.setWishlist);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const [location, setLocation] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
    }, [searchParams]);

    useEffect(() => {
        if (!user || !token) {
            setWishlist([]);
            return;
        }

        getWishlist()
            .then((data) => setWishlist((data.items || []).map((item: any) => item.id)))
            .catch(() => setWishlist([]));
    }, [user, token, setWishlist]);

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
        if (searchQuery.trim()) {
            navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/shop');
        }
    };

    useEffect(() => {
        fetch('https://get.geojs.io/v1/ip/geo.json')
            .then((res) => res.json())
            .then((data) => setLocation(data.city))
            .catch(() => setLocation(''));
    }, []);

    return (
        <nav className="glass sticky top-0 z-50 shadow-soft">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2 group">
                        <img
                            src="/logo.png"
                            alt="Happy Greens"
                            className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform shadow-sm"
                        />
                        <span className="text-2xl font-display font-bold text-gradient">Happy Greens</span>
                    </Link>

                    {location && (
                        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100 ml-6 mr-2 animate-fade-in shadow-sm">
                            <MapPin className="h-4 w-4 fill-green-600 text-green-700" />
                            <span>{location}</span>
                        </div>
                    )}

                    <form
                        onSubmit={handleSearch}
                        className="hidden md:flex flex-1 max-w-xl mx-4 relative group"
                        onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                setShowSuggestions(false);
                            }
                        }}
                    >
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                            placeholder="Search for fresh groceries..."
                            className="w-full px-4 py-2.5 pl-11 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        />
                        <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-14 left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in text-gray-800">
                                {suggestions.map((product) => (
                                    <div
                                        key={product.id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            navigate(`/product/${product.id}`);
                                            setShowSuggestions(false);
                                            setSearchQuery('');
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                                    >
                                        <div className="h-10 w-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={product.images && product.images.length > 0 ? product.images[0] : product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                                            <p className="text-xs text-green-600 font-bold truncate">Rs. {product.discountPrice || product.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>

                    <div className="flex items-center gap-6">
                        <Link
                            to="/shop"
                            className="hidden md:block font-semibold text-gray-700 hover:text-primary-600 transition-colors"
                        >
                            Shop
                        </Link>

                        {user && (
                            <Link
                                to="/wishlist"
                                className="relative flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-500 transition-colors"
                            >
                                <Heart className="w-4 h-4 fill-rose-400 text-rose-500" />
                                Wishlist
                                {wishlistIds.length > 0 && (
                                    <span className="absolute -top-2 -right-4 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                                        {wishlistIds.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        {user && (
                            <Link
                                to="/rewards"
                                className="hidden md:flex items-center gap-1 font-semibold text-yellow-600 hover:text-yellow-500 transition-colors"
                            >
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                                Rewards
                            </Link>
                        )}

                        <Link to="/cart" className="relative hover:text-primary-600 transition-colors group">
                            <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-gradient-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-medium animate-bounce-soft">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <Link to="/profile" className="flex items-center gap-2 hover:text-primary-600 transition-colors group">
                                <div className="bg-gradient-primary p-1.5 rounded-full group-hover:scale-110 transition-transform">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                <span className="hidden md:block text-sm font-semibold">{user.full_name}</span>
                            </Link>
                        ) : (
                            <Link to="/login" className="flex items-center gap-2 font-semibold text-gray-700 hover:text-primary-600 transition-colors group">
                                <User className="h-6 w-6 group-hover:scale-110 transition-transform" />
                                <span className="hidden md:block text-sm">Login</span>
                            </Link>
                        )}

                        <button className="md:hidden hover:text-primary-600 transition-colors">
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <div className="md:hidden pb-4">
                    <form
                        onSubmit={handleSearch}
                        className="relative"
                        onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                setShowSuggestions(false);
                            }
                        }}
                    >
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                            placeholder="Search..."
                            className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all bg-white/50 backdrop-blur-sm"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-12 left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in text-gray-800">
                                {suggestions.map((product) => (
                                    <div
                                        key={product.id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            navigate(`/product/${product.id}`);
                                            setShowSuggestions(false);
                                            setSearchQuery('');
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                                    >
                                        <div className="h-10 w-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={product.images && product.images.length > 0 ? product.images[0] : product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                                            <p className="text-xs text-green-600 font-bold truncate">Rs. {product.discountPrice || product.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;



