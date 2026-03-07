import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/product.service';
import ProductCard from '../components/ProductCard';
import { Filter } from 'lucide-react';

const categories = ['Fruits', 'Vegetables', 'Dairy', 'Staples', 'Snacks', 'Beverages'];

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [totalPages, setTotalPages] = useState(1);

    const category = searchParams.get('category') || '';
    const q = searchParams.get('q') || '';
    const page = Number(searchParams.get('page')) || 1;
    const sort = searchParams.get('sort') || '';

    const DUMMY_PRODUCTS = [
        { id: 1, name: 'Fresh Spinach', price: 40, category_name: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=60' },
        { id: 2, name: 'Organic Carrots', price: 60, category_name: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=60' },
        { id: 3, name: 'Red Tomatoes', price: 30, category_name: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=60' },
        { id: 4, name: 'Potatoes', price: 35, category_name: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=60' },
        { id: 5, name: 'Broccoli', price: 80, category_name: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=500&q=60' },
        { id: 6, name: 'Bell Peppers', price: 50, category_name: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1563565375-f3fdf5ec2e97?auto=format&fit=crop&w=500&q=60' },
        { id: 7, name: 'Fresh Apples', price: 120, category_name: 'Fruits', image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=60' },
        { id: 8, name: 'Bananas', price: 40, category_name: 'Fruits', image_url: 'https://images.unsplash.com/photo-1571771896612-610175226155?auto=format&fit=crop&w=500&q=60' },
        { id: 9, name: 'Milk', price: 60, category_name: 'Dairy', image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=60' },
        { id: 10, name: 'Cheese', price: 150, category_name: 'Dairy', image_url: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=500&q=60' },
    ];

    useEffect(() => {
        const fetchProducts = async () => {
            // Only show skeleton loading on initial load
            if (products.length === 0) {
                setLoading(true);
            } else {
                setFetching(true);
            }

            try {
                // Try fetching from backend first
                const res = await getProducts({ category, q, page, sort, limit: 12 });
                setProducts(res.products);
                setTotalPages(res.totalPages);
            } catch (error) {
                console.log('Backend not reachable, using dummy data');
                // Filter dummy data based on category
                let filtered = DUMMY_PRODUCTS;
                if (category) {
                    filtered = DUMMY_PRODUCTS.filter(p => p.category_name === category);
                }
                // @ts-ignore
                setProducts(filtered);
                setTotalPages(1);
            } finally {
                setLoading(false);
                setFetching(false);
            }
        };

        fetchProducts();
    }, [category, q, page, sort]);

    const handleCategoryChange = (cat: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (cat) newParams.set('category', cat.toLowerCase());
        else newParams.delete('category');
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newParams = new URLSearchParams(searchParams);
        if (e.target.value) newParams.set('sort', e.target.value);
        else newParams.delete('sort');
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', String(newPage));
        setSearchParams(newParams);
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <div className="bg-gradient-soft p-6 rounded-3xl shadow-soft border border-gray-100 sticky top-24">
                    <div className="flex items-center gap-2 mb-6">
                        <Filter className="h-5 w-5 text-primary-600" />
                        <h2 className="font-display font-bold text-xl text-gray-900">Filters</h2>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold mb-4 text-gray-700">Categories</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleCategoryChange('')}
                                className={`block w-full text-left px-4 py-2.5 rounded-xl transition-all font-medium ${category === '' ? 'bg-gradient-primary text-white shadow-soft' : 'hover:bg-white hover:shadow-sm'}`}
                            >
                                All Products
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`block w-full text-left px-4 py-2.5 rounded-xl transition-all font-medium ${category === cat.toLowerCase() ? 'bg-gradient-primary text-white shadow-soft' : 'hover:bg-white hover:shadow-sm'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-gray-900">
                        {category ? category.charAt(0).toUpperCase() + category.slice(1) : (q ? `Search Results for "${q}"` : 'All Products')}
                    </h1>
                    <select
                        value={sort}
                        onChange={handleSortChange}
                        className="border-2 border-gray-200 rounded-xl px-5 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all font-medium"
                    >
                        <option value="">Sort by: Newest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                    </select>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 transition-opacity duration-200 ${fetching ? 'opacity-50' : 'opacity-100'}`}>
                            {products.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => handlePageChange(page - 1)}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 font-medium">Page {page} of {totalPages}</span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => handlePageChange(page + 1)}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Shop;
