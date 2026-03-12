import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/product.service';
import ProductCard from '../components/ProductCard';
import { Filter, SlidersHorizontal } from 'lucide-react';

const categories = ['Fruits', 'Vegetables', 'Dairy', 'Staples', 'Snacks', 'Beverages'];

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

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
            if (products.length === 0) {
                setLoading(true);
            } else {
                setFetching(true);
            }

            try {
                const res = await getProducts({ category, q, page, sort, limit: 12 });
                setProducts(res.products);
                setTotalPages(res.totalPages);
            } catch (error) {
                console.log('Backend not reachable, using dummy data');
                let filtered = DUMMY_PRODUCTS;
                if (category) {
                    filtered = DUMMY_PRODUCTS.filter((p) => p.category_name.toLowerCase() === category.toLowerCase());
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

    const updateParams = (updater: (params: URLSearchParams) => void) => {
        const newParams = new URLSearchParams(searchParams);
        updater(newParams);
        setSearchParams(newParams);
    };

    const handleCategoryChange = (cat: string) => {
        updateParams((params) => {
            if (cat) params.set('category', cat.toLowerCase());
            else params.delete('category');
            params.set('page', '1');
        });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateParams((params) => {
            if (e.target.value) params.set('sort', e.target.value);
            else params.delete('sort');
            params.set('page', '1');
        });
    };

    const handlePageChange = (newPage: number) => {
        updateParams((params) => {
            params.set('page', String(newPage));
        });
    };

    return (
        <div className="space-y-4">
            <section className="mobile-app-card rounded-[1.8rem] p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="section-kicker">Browse products</p>
                        <h1 className="mt-1 text-[1.45rem] font-display font-bold text-slate-900 md:text-[2rem]">
                            {category ? category.charAt(0).toUpperCase() + category.slice(1) : q ? `Search: ${q}` : 'All groceries'}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">Fast-moving essentials arranged for mobile shopping.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters((prev) => !prev)}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-[1rem] border border-[#d7e4cc] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 md:hidden"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>

                        <div className="inline-flex min-h-[44px] items-center gap-2 rounded-[1rem] border border-[#d7e4cc] bg-white px-3">
                            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                            <select
                                value={sort}
                                onChange={handleSortChange}
                                className="h-11 bg-transparent pr-2 text-sm font-semibold text-slate-700 outline-none"
                            >
                                <option value="">Newest</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => handleCategoryChange('')}
                        className={`min-h-[40px] whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category === '' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-[#d7e4cc]'}`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryChange(cat)}
                            className={`min-h-[40px] whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category === cat.toLowerCase() ? 'bg-green-600 text-white' : 'bg-white text-slate-700 border border-[#d7e4cc]'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className={`${showFilters ? 'block' : 'hidden'} rounded-[1.4rem] border border-[#e1ead8] bg-white p-3 md:hidden`}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-green-700/70">Quick filter</p>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => (
                            <button
                                key={`mobile-${cat}`}
                                type="button"
                                onClick={() => {
                                    handleCategoryChange(cat);
                                    setShowFilters(false);
                                }}
                                className={`rounded-[1rem] px-3 py-3 text-sm font-semibold ${category === cat.toLowerCase() ? 'bg-green-600 text-white' : 'bg-[#f5f8f1] text-slate-700'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {loading ? (
                <div className="app-grid">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-64 animate-pulse rounded-[1.5rem] bg-[#eaf0e2]"></div>
                    ))}
                </div>
            ) : (
                <>
                    <div className={`app-grid transition-opacity duration-200 ${fetching ? 'opacity-50' : 'opacity-100'}`}>
                        {products.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    <div className="mobile-app-card flex items-center justify-between rounded-[1.5rem] px-4 py-3">
                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={() => handlePageChange(page - 1)}
                            className="min-h-[44px] rounded-[1rem] border border-[#d7e4cc] px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-semibold text-slate-600">Page {page} / {totalPages}</span>
                        <button
                            type="button"
                            disabled={page === totalPages}
                            onClick={() => handlePageChange(page + 1)}
                            className="min-h-[44px] rounded-[1rem] border border-[#d7e4cc] px-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Shop;
