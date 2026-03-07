import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../services/wishlist.service';
import { useStore } from '../store/useStore';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

const Wishlist = () => {
    const user = useStore((state) => state.user);
    const setWishlist = useStore((state) => state.setWishlist);
    const removeWishlistItem = useStore((state) => state.removeWishlistItem);

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        getWishlist()
            .then((data) => {
                const wishlistItems = data.items || [];
                setItems(wishlistItems);
                setWishlist(wishlistItems.map((item: any) => item.id));
            })
            .catch((error: any) => toast.error(error?.response?.data?.message || 'Unable to load wishlist'))
            .finally(() => setLoading(false));
    }, [user, setWishlist]);

    const handleRemove = async (productId: number) => {
        removeWishlistItem(productId);
        setItems((prev) => prev.filter((item) => item.id !== productId));

        try {
            await removeFromWishlist(productId);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Unable to remove item');
        }
    };

    if (!user) {
        return (
            <div className="max-w-xl mx-auto text-center py-16">
                <Heart className="h-10 w-10 mx-auto mb-3 text-rose-500" />
                <h1 className="text-2xl font-bold mb-2">Wishlist</h1>
                <p className="text-gray-600 mb-6">Please login to save and manage wishlist items.</p>
                <Link to="/login" className="inline-flex px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                    Login
                </Link>
            </div>
        );
    }

    if (loading) {
        return <div className="text-center py-16">Loading wishlist...</div>;
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <Heart className="h-6 w-6 text-rose-500 fill-rose-400" />
                <h1 className="text-3xl font-bold">My Wishlist</h1>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-gray-600 mb-4">No items in your wishlist yet.</p>
                    <Link to="/shop" className="inline-flex px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                        Browse products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map((product) => (
                        <div key={product.id} className="relative">
                            <ProductCard product={product} />
                            <button
                                onClick={() => handleRemove(product.id)}
                                className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-white/90 border border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;

