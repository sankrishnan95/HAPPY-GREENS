import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, Leaf } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import Button from '../components/Button';
import Badge from '../components/Badge';
import OptimizedImage from '../components/OptimizedImage';
import { getActiveBanners } from '../services/banner.service';
import { normalizeImageUrl } from '../utils/image';
import { getProducts } from '../services/product.service';
import ProductCard from '../components/ProductCard';

const CATEGORY_IMAGES: Record<string, string> = {
    'fruits': '/categories/apple.png',
    'vegetables': '/categories/broccoli.png',
    'dairy': '/categories/milk.png',
    'staples': '/categories/rice.png',
    'snacks': '/categories/chips.png',
    'beverages': '/categories/juice.png',
    'flowers': '/categories/flowers-dahlia.png',
    'laundromat': '/categories/detergent.png',
    'personal-care': '/categories/shampoo.png',
};
const FALLBACK_CATEGORY_IMAGE = '/categories/apple.png';

const normalizeCategoryImageKey = (value: unknown) =>
    typeof value === 'string'
        ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : '';

const getCategoryImage = (category: { slug?: string; name?: string }) => {
    const slugKey = normalizeCategoryImageKey(category.slug);
    const nameKey = normalizeCategoryImageKey(category.name);
    return CATEGORY_IMAGES[slugKey] || CATEGORY_IMAGES[nameKey] || FALLBACK_CATEGORY_IMAGE;
};

const CATEGORY_DISPLAY_ORDER = ['vegetables', 'fruits'];

const features = [
    { icon: Truck, title: 'Same day delivery', description: 'Fast slots in busy city zones', tone: 'bg-green-50 text-green-700' },
    { icon: Leaf, title: 'Farm fresh', description: 'Fresh stock with daily replenishment', tone: 'bg-lime-50 text-lime-700' },
    { icon: Shield, title: 'Quality checked', description: 'Packed and inspected before dispatch', tone: 'bg-sky-50 text-sky-700' },
    { icon: Clock, title: 'Open all day', description: 'Quick reorder at any hour you need', tone: 'bg-amber-50 text-amber-700' },
];

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const Home = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [offerProducts, setOfferProducts] = useState<any[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);

    const isVideo = (url: string) => {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.webm');
    };

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await getActiveBanners();
                if (data && data.success && data.banners) {
                    setBanners(data.banners);
                }
            } catch {
                console.error('Failed to fetch banners');
            } finally {
                setLoadingBanners(false);
            }
        };
        const fetchOffers = async () => {
            try {
                const data = await getProducts({ hasOffer: true, limit: 10 });
                if (data && data.products) {
                    setOfferProducts(data.products);
                }
            } catch {
                console.error('Failed to fetch offers');
            } finally {
                setLoadingOffers(false);
            }
        };
        const fetchCategories = async () => {
            try {
                // re-use product.service.ts if we export it, wait we need to import it at top of Home.tsx
                const { getCategories } = await import('../services/product.service');
                const data = await getCategories(true);
                if (data) {
                    const topLevelCategories = data.filter((c: any) => !c.parent_id);
                    const sortedCategories = [...topLevelCategories].sort((a: any, b: any) => {
                        const aKey = normalizeCategoryImageKey(a.slug || a.name);
                        const bKey = normalizeCategoryImageKey(b.slug || b.name);
                        const aIndex = CATEGORY_DISPLAY_ORDER.indexOf(aKey);
                        const bIndex = CATEGORY_DISPLAY_ORDER.indexOf(bKey);

                        if (aIndex !== -1 || bIndex !== -1) {
                            if (aIndex === -1) return 1;
                            if (bIndex === -1) return -1;
                            return aIndex - bIndex;
                        }

                        return String(a.name || '').localeCompare(String(b.name || ''));
                    });
                    setCategories(sortedCategories);
                }
            } catch {
                console.error('Failed to fetch categories');
            }
        };

        fetchBanners();
        fetchOffers();
        fetchCategories();
    }, []);

    const heroBanner = banners.length > 0 ? banners[0] : null;
    const dealBanner = banners.length > 1 ? banners[1] : null;
    const heroTitle = heroBanner?.title || 'Fresh groceries delivered like an app, not a store.';
    const happyGreensMatch = heroTitle.match(/happy greens/i);
    const heroTitlePrefix = happyGreensMatch ? heroTitle.slice(0, happyGreensMatch.index).trim() : '';
    const heroTitleBrand = happyGreensMatch ? heroTitle.slice(happyGreensMatch.index!, happyGreensMatch.index! + happyGreensMatch[0].length) : '';
    const heroTitleSuffix = happyGreensMatch ? heroTitle.slice(happyGreensMatch.index! + happyGreensMatch[0].length).trim() : '';

    return (
        <div className="space-y-4 pb-4 md:space-y-6 lg:space-y-8">
            <motion.section 
                initial="hidden" animate="visible" variants={fadeInUp}
                className="mobile-app-card hero-banner overflow-hidden rounded-[1.8rem]"
            >
                {loadingBanners ? (
                    <div className="min-h-[280px] md:min-h-[380px] lg:min-h-[440px] animate-pulse bg-slate-200" />
                ) : (
                    <div className="relative min-h-[280px] md:min-h-[380px] lg:min-h-[440px]">
                        <div className="absolute inset-0">
                            {isVideo(heroBanner?.image_url) ? (
                                <video src={normalizeImageUrl(heroBanner.image_url)} className="hero-banner-media" autoPlay loop muted playsInline preload="metadata" />
                            ) : (
                                <OptimizedImage src={heroBanner?.image_url} alt="Storefront Hero" className="hero-banner-media" width={1280} height={720} loading="eager" fetchPriority="high" sizes="100vw" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/40 via-slate-900/15 to-lime-500/10" />

                        <div className="relative z-10 flex h-full flex-col justify-end px-4 py-5 sm:px-5 sm:py-6 md:max-w-[70%] md:px-7 md:py-7 lg:px-10 lg:py-9">
                            <Badge variant="accent" size="sm" className="mb-3 w-fit border-white/20 bg-white/15 text-white backdrop-blur-sm">
                                {heroBanner?.subheading || 'Express slots available today'}
                            </Badge>
                            <h1 className="max-w-[14ch] font-display font-bold text-white">
                                {heroTitleBrand ? (
                                    <span className="flex flex-col gap-1">
                                        {heroTitlePrefix ? (
                                            <span className="text-[0.92rem] font-semibold uppercase tracking-[0.18em] text-amber-200 sm:text-[1rem] md:text-[1.1rem]">
                                                {heroTitlePrefix}
                                            </span>
                                        ) : null}
                                        <span className="text-[1.9rem] sm:text-[2.35rem] md:text-[3rem] lg:text-[3.7rem]">
                                            {heroTitleBrand}
                                        </span>
                                        {heroTitleSuffix ? (
                                            <span className="text-[0.98rem] font-medium tracking-[0.04em] text-white/88 sm:text-[1.05rem] md:text-[1.15rem]">
                                                {heroTitleSuffix}
                                            </span>
                                        ) : null}
                                    </span>
                                ) : (
                                    <span className="text-[1.7rem] sm:text-[2rem] md:text-[2.7rem] lg:text-[3.5rem]">
                                        {heroTitle}
                                    </span>
                                )}
                            </h1>
                            <p className="mt-3 max-w-[34ch] text-sm leading-6 text-white/90 sm:text-[0.95rem] md:text-base">{heroBanner?.description || 'Daily essentials, fruits, vegetables and dairy packed for fast doorstep delivery.'}</p>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <Link to={heroBanner?.link || '/shop'} className="w-full sm:w-auto"><Button variant="accent" size="lg" className="w-full sm:w-auto">Shop fresh<ArrowRight className="h-4 w-4" /></Button></Link>
                                <Link to="/shop?category=vegetables" className="w-full sm:w-auto"><Button variant="outline" size="lg" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto">Explore veggies</Button></Link>
                            </div>
                        </div>
                    </div>
                )}
            </motion.section>

            <motion.section 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
                className="space-y-4"
            >
                <div className="flex items-end justify-between gap-3 px-2">
                    <div><h2 className="text-[1.35rem] font-display font-bold text-slate-900 md:text-[1.6rem]">Categories</h2></div>
                    <Link to="/shop" className="text-[0.85rem] font-bold text-green-700 hover:text-green-800 transition">View all</Link>
                </div>

                <div className="-mx-1 overflow-x-auto px-1 pb-6 pt-4 hide-scrollbar overscroll-x-contain">
                    <div className="flex min-w-max gap-4 px-3 md:gap-8">
                    {categories.length > 0 ? categories.map((cat) => (
                        <div key={cat.id} className="flex-none snap-start">
                            <Link to={`/shop?category=${cat.slug}`} className="group flex flex-col items-center justify-center gap-3 min-w-[76px] sm:min-w-[90px] md:min-w-[110px]">
                                <div className="relative flex h-20 w-20 rounded-[1.75rem] sm:h-24 sm:w-24 md:h-28 md:w-28 items-center justify-center transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03]">
                                    <img
                                        src={getCategoryImage(cat)}
                                        alt={cat.name}
                                        loading="eager"
                                        decoding="async"
                                        fetchPriority="high"
                                        onError={(e) => {
                                            if (e.currentTarget.src.endsWith(FALLBACK_CATEGORY_IMAGE)) return;
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = FALLBACK_CATEGORY_IMAGE;
                                        }}
                                        className="h-full w-full object-contain p-0.5 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.05)] md:drop-shadow-[0_10px_16px_rgba(0,0,0,0.05)]"
                                    />
                                </div>
                                <h3 className="text-center text-[0.85rem] md:text-[0.95rem] font-semibold text-slate-800 transition-colors group-hover:text-green-700">{cat.name}</h3>
                            </Link>
                        </div>
                    )) : (
                        [1,2,3,4,5,6].map(i => (
                            <div key={i} className="flex-none w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-[1.75rem] bg-slate-100 animate-pulse" />
                        ))
                    )}
                    </div>
                </div>
            </motion.section>

            {offerProducts.length > 0 || loadingOffers ? (
                <motion.section 
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
                    className="space-y-4"
                >
                    <div className="flex items-end justify-between gap-3 px-2">
                        <div>
                            <p className="section-kicker">Grab these deals</p>
                            <h2 className="mt-1 text-[1.35rem] font-display font-bold text-slate-900 md:text-[1.6rem]">Special Offers</h2>
                        </div>
                        <Link to="/shop?hasOffer=true" className="text-[0.85rem] font-bold text-green-700 hover:text-green-800 transition">View all</Link>
                    </div>

                    {loadingOffers ? (
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-1 pb-6 pt-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="min-w-[180px] md:min-w-[220px] h-[340px] animate-pulse rounded-[1.35rem] bg-slate-200" />
                            ))}
                        </div>
                    ) : (
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="-mx-1 overflow-x-auto px-1 pb-6 pt-2 hide-scrollbar overscroll-x-contain">
                            <div className="flex min-w-max gap-4 px-3 md:gap-6">
                                {offerProducts.map((product) => (
                                    <motion.div key={product.id} variants={fadeInUp} className="flex-none snap-start w-[180px] md:w-[220px]">
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.section>
            ) : null}

            <motion.section 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
                className="mobile-app-card overflow-hidden rounded-[1.8rem] p-4 md:p-5 lg:p-6"
            >
                <div className="mb-4 flex items-end justify-between gap-3"><div><p className="section-kicker">Why people stay</p><h2 className="section-title mt-1">Built for daily groceries</h2></div></div>
                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {features.map((feature) => (
                        <motion.div key={feature.title} variants={fadeInUp} className="rounded-[1.4rem] bg-[#f8faf5] p-3 md:p-4">
                            <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${feature.tone}`}><feature.icon className="h-5 w-5" strokeWidth={1.8} /></div>
                            <h3 className="text-sm font-bold text-slate-900">{feature.title}</h3>
                            <p className="mt-1 text-[0.82rem] leading-5 text-slate-600">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.section>

            <motion.section 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
                className="mobile-app-card overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-green-700 via-green-600 to-lime-500 text-white"
            >
                {loadingBanners ? (
                    <div className="min-h-[220px] md:min-h-[280px] animate-pulse bg-green-800/20" />
                ) : (
                    <div className="grid gap-4 p-4 md:grid-cols-[1.15fr_0.85fr] md:items-center md:p-5 lg:p-6">
                        <div>
                            <p className="section-kicker !text-white/70">Smart basket deal</p>
                            <h2 className="mt-1 text-[1.45rem] font-display font-bold md:text-[2rem]">{dealBanner?.title || 'Save more on fresh baskets this week'}</h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-white/85 md:text-base">{dealBanner?.description || 'A rotating set of fruits, vegetables and staples at a better bundle price.'}</p>
                            <div className="mt-4"><Link to={dealBanner?.link || '/shop'} className="w-full sm:w-auto"><Button variant="accent" size="lg" className="w-full sm:w-auto">View offers</Button></Link></div>
                        </div>

                        <div className="overflow-hidden rounded-[1.5rem] bg-white/10 p-1 backdrop-blur-sm h-full w-full">
                            {isVideo(dealBanner?.image_url) ? (
                                <video src={normalizeImageUrl(dealBanner.image_url)} className="hero-banner-media max-h-[280px] w-full h-full object-cover rounded-[1.3rem]" autoPlay loop muted playsInline preload="metadata" />
                            ) : (
                                <OptimizedImage src={dealBanner?.image_url} alt="Deals Graphic" className="hero-banner-media max-h-[280px] w-full h-full object-cover rounded-[1.3rem]" width={960} height={720} sizes="(max-width: 767px) 100vw, 40vw" />
                            )}
                        </div>
                    </div>
                )}
            </motion.section>
        </div>
    );
};

export default Home;
