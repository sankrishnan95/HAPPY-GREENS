import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../services/product.service';
import ProductCard from '../components/ProductCard';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { useSemanticSearch } from '../hooks/useSemanticSearch';

const PRODUCTS_PER_PAGE = 30;

const SHOP_CACHE_KEY = 'shop_products_cache_v2';

const Shop = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const productsRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const prevCacheKeyRef = useRef<string | null>(null);
    const category = searchParams.get('category') || '';
    const q = searchParams.get('q') || '';
    const sort = searchParams.get('sort') || '';
    const cacheKey = `${category}|${q}|${sort}`;

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

    // Continuously save scroll position while on the shop page
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    sessionStorage.setItem('shop_scroll_y', String(window.scrollY));
                    ticking = false;
                });
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Save products to sessionStorage whenever they change
    useEffect(() => {
        if (products.length > 0) {
            try {
                sessionStorage.setItem(SHOP_CACHE_KEY, JSON.stringify({
                    key: cacheKey,
                    products,
                    page,
                    totalPages,
                }));
            } catch (_) { /* quota exceeded, ignore */ }
        }
    }, [products, page, totalPages, cacheKey]);

    useEffect(() => {
        const lastProductId = sessionStorage.getItem('shop_last_product_id');
        const cacheKeyChanged = prevCacheKeyRef.current !== null && prevCacheKeyRef.current !== cacheKey;
        prevCacheKeyRef.current = cacheKey;

        // When the category/sort/query changed, always clear stale scroll & product restoration
        if (cacheKeyChanged) {
            sessionStorage.removeItem('shop_last_product_id');
            sessionStorage.removeItem('shop_scroll_y');
        }

        // Only try to restore from cache when returning to the SAME view (e.g. back from product detail)
        if (!cacheKeyChanged) {
            try {
                const cached = JSON.parse(sessionStorage.getItem(SHOP_CACHE_KEY) || 'null');
                if (cached && cached.key === cacheKey && cached.products?.length > 0) {
                    // Restore cached state instantly
                    setProducts(cached.products);
                    setPage(cached.page);
                    setTotalPages(cached.totalPages);
                    setLoading(false);

                    // Restore scroll position after products render
                    const savedScrollY = sessionStorage.getItem('shop_scroll_y');
                    if (savedScrollY) {
                        const scrollY = parseInt(savedScrollY, 10);
                        setTimeout(() => {
                            window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
                        }, 50);
                    }

                    // Still fetch categories if needed
                    if (allCategories.length === 0) {
                        getCategories(true).then(res => setAllCategories(res || [])).catch(console.error);
                    }

                    const cachedHasTargetProduct = lastProductId
                        ? cached.products.some((product: any) => String(product.id) === lastProductId)
                        : false;

                    if (cachedHasTargetProduct) {
                        return;
                    }
                }
            } catch (_) { /* parse error, fall through to fresh fetch */ }
        }

        // Fresh fetch — either cacheKey changed (new category/sort/query) or no valid cache
        const fetchInitialProducts = async () => {
            setLoading(products.length === 0);
            setPage(1);
            try {
                // Fetch a large catalog if searching, so client-side semantic search can rank everything
                const limit = q ? 1000 : PRODUCTS_PER_PAGE;
                const res = await getProducts({ category, sort, page: 1, limit });
                setProducts(res.products);
                setTotalPages(res.totalPages);
                
                // Scroll to top of products on filter change
                if (cacheKeyChanged && productsRef.current) {
                    const yOffset = -100;
                    const element = productsRef.current;
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            } catch (error) {
                console.log('Backend not reachable, using dummy data');
                setProducts(DUMMY_PRODUCTS);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };

        const fetchCats = async () => {
            try {
                const res = await getCategories(true);
                setAllCategories(res || []);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };

        fetchInitialProducts();
        if (allCategories.length === 0) fetchCats();
    }, [category, q, sort]);

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || page >= totalPages) return;
        
        setLoadingMore(true);
        const nextPage = page + 1;
        try {
            // Never pass `q` to backend so frontend semantic search gets the full catalog
            const limit = q ? 1000 : PRODUCTS_PER_PAGE;
            const res = await getProducts({ category, sort, page: nextPage, limit });
            setProducts(prev => [...prev, ...res.products]);
            setPage(nextPage);
            setTotalPages(res.totalPages);
        } catch (error) {
            console.error("Failed to load more products");
        } finally {
            setLoadingMore(false);
        }
    }, [category, loadingMore, page, q, sort, totalPages]);

    useEffect(() => {
        if (loading || page >= totalPages) return;

        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    handleLoadMore();
                }
            },
            {
                rootMargin: '220px 0px',
                threshold: 0.1,
            }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [handleLoadMore, loading, page, totalPages]);

    useEffect(() => {
        if (loading || loadingMore || products.length === 0) return;

        const lastProductId = sessionStorage.getItem('shop_last_product_id');
        if (!lastProductId) return;

        const hasTargetProduct = products.some((product: any) => String(product.id) === lastProductId);
        if (!hasTargetProduct && page < totalPages) {
            handleLoadMore();
        }
    }, [handleLoadMore, loading, loadingMore, page, products, totalPages]);

    useEffect(() => {
        if (loading || products.length === 0) return;

        const lastProductId = sessionStorage.getItem('shop_last_product_id');
        if (!lastProductId) return;

        if (!products.some((product: any) => String(product.id) === lastProductId)) {
            return;
        }

        const scrollToProduct = () => {
            const productCard = document.querySelector(`[data-product-card-id="${lastProductId}"]`);
            if (!(productCard instanceof HTMLElement)) return;

            const yOffset = -110;
            const y = productCard.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            sessionStorage.removeItem('shop_last_product_id');
        };

        const timeoutId = window.setTimeout(scrollToProduct, 80);
        return () => window.clearTimeout(timeoutId);
    }, [loading, products]);

    const topLevelCategories = allCategories.filter((c: any) => !c.parent_id);
    
    // Determine active category context for subcategories
    let activeSubcategories: any[] = [];
    let activeParentSlug = '';

    if (category) {
        const selectedCatObj = allCategories.find((c: any) => c.slug?.toLowerCase() === category.toLowerCase());
        if (selectedCatObj) {
            const activeParentId = selectedCatObj.parent_id ? selectedCatObj.parent_id : selectedCatObj.id;
            activeSubcategories = allCategories.filter((c: any) => c.parent_id === activeParentId);
            
            const parentObj = allCategories.find((c: any) => c.id === activeParentId);
            if (parentObj) {
                activeParentSlug = parentObj.slug;
            }
        }
    }

    const updateParams = (updater: (params: URLSearchParams) => void) => {
        const newParams = new URLSearchParams(searchParams);
        updater(newParams);
        setSearchParams(newParams);
    };

    const handleCategoryChange = (cat: string) => {
        const normalizedCategory = cat.trim().toLowerCase();
        sessionStorage.removeItem('shop_last_product_id');
        updateParams((params) => {
            if (normalizedCategory) params.set('category', normalizedCategory);
            else params.delete('category');
        });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateParams((params) => {
            if (e.target.value) params.set('sort', e.target.value);
            else params.delete('sort');
        });
    };

    // Semantic search: re-rank fetched products client-side for better relevance
    const { searchedProducts } = useSemanticSearch(products, { query: q });
    // Use semantically re-ranked results when there's an active search query, otherwise use original order
    const displayProducts = q ? searchedProducts : products;

    return (
        <div className="space-y-4">
            <section ref={productsRef} className="mobile-app-card rounded-[1.8rem] p-4 md:p-5">
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

            <section className="sticky top-0 z-30 -mx-3 mb-2 px-3 py-2 backdrop-blur-md bg-white/80 md:top-0 md:-mx-5 md:px-5 md:py-3 border-b border-green-100/50 shadow-sm transition-all duration-300">
                <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => handleCategoryChange('')}
                        className={`min-h-[40px] whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category === '' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-[#d7e4cc]'}`}
                    >
                        All
                    </button>
                    {topLevelCategories.map((cat: any) => {
                        const isActiveParent = category?.toLowerCase() === cat.slug?.toLowerCase() || activeParentSlug?.toLowerCase() === cat.slug?.toLowerCase();
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryChange(cat.slug)}
                                className={`min-h-[40px] whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${isActiveParent ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-[#d7e4cc] hover:bg-slate-50'}`}
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {activeSubcategories.length > 0 && (
                    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1 mt-1">
                        {activeSubcategories.map((sub: any) => (
                            <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleCategoryChange(sub.slug)}
                                className={`min-h-[34px] whitespace-nowrap rounded-full px-5 py-1.5 text-xs font-bold transition-all duration-200 ${
                                    category?.toLowerCase() === sub.slug?.toLowerCase() 
                                    ? 'bg-sky-600 text-white shadow-md transform scale-105' 
                                    : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                                }`}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className={`${showFilters ? 'block' : 'hidden'} rounded-[1.4rem] border border-[#e1ead8] bg-white p-3 md:hidden`}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-green-700/70">Quick filter</p>
                    <div className="grid grid-cols-2 gap-2">
                        {topLevelCategories.map((cat: any) => (
                            <button
                                key={`mobile-${cat.id}`}
                                type="button"
                                onClick={() => {
                                    handleCategoryChange(cat.slug);
                                    setShowFilters(false);
                                }}
                                className={`rounded-[1rem] px-3 py-3 text-sm font-semibold ${category?.toLowerCase() === cat.slug?.toLowerCase() ? 'bg-green-600 text-white' : 'bg-[#f5f8f1] text-slate-700'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {loading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                    {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                        <div key={i} className="h-64 animate-pulse rounded-[1.5rem] bg-[#eaf0e2]"></div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4 transition-opacity duration-200">
                        {displayProducts.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {page < totalPages && (
                        <div ref={loadMoreRef} className="mt-8 flex justify-center pb-8">
                            <div className="inline-flex min-h-[50px] min-w-[180px] items-center justify-center rounded-2xl border border-dashed border-green-200 bg-white/90 px-6 text-sm font-semibold text-green-700 shadow-sm">
                                {loadingMore ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-700 border-t-transparent"></div>
                                        <span>Loading more products...</span>
                                    </div>
                                ) : (
                                    <span>More products loading below</span>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Shop;

