import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, Leaf } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import Button from '../components/Button';
import Badge from '../components/Badge';
import OptimizedImage from '../components/OptimizedImage';
import { getActiveBanners } from '../services/banner.service';
import { normalizeImageUrl } from '../utils/image';

const categories = [
    { name: 'Fruits', image: '/categories/apple.png' },
    { name: 'Vegetables', image: '/categories/broccoli.png' },
    { name: 'Dairy', image: '/categories/milk.png' },
    { name: 'Staples', image: '/categories/rice.png' },
    { name: 'Snacks', image: '/categories/chips.png' },
    { name: 'Beverages', image: '/categories/juice.png' },
    { name: 'Flowers', image: '/categories/picotee.png' },
    { name: 'Laundromate', image: '/categories/detergent.png' },
    { name: 'Personal Care', image: '/categories/shampoo.png' },
];

const features = [
    { icon: Truck, title: '10 min delivery', description: 'Fast slots in busy city zones', tone: 'bg-green-50 text-green-700' },
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
        fetchBanners();
    }, []);

    const heroBanner = banners.length > 0 ? banners[0] : null;
    const dealBanner = banners.length > 1 ? banners[1] : null;

    return (
        <div className="space-y-4 pb-4 md:space-y-6 lg:space-y-8">
            <motion.section 
                initial="hidden" animate="visible" variants={fadeInUp}
                className="mobile-app-card hero-banner overflow-hidden rounded-[1.8rem]"
            >
                {loadingBanners ? (
                    <div className="min-h-[240px] md:min-h-[320px] lg:min-h-[380px] animate-pulse bg-slate-200" />
                ) : (
                    <div className="relative min-h-[240px] md:min-h-[320px] lg:min-h-[380px]">
                        <div className="absolute inset-0">
                            {isVideo(heroBanner?.image_url) ? (
                                <video src={normalizeImageUrl(heroBanner.image_url)} className="hero-banner-media" autoPlay loop muted playsInline preload="metadata" />
                            ) : (
                                <OptimizedImage src={heroBanner?.image_url} alt="Storefront Hero" className="hero-banner-media" width={1280} height={720} aspectRatio="16 / 9" loading="eager" fetchPriority="high" sizes="100vw" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/35 to-lime-500/20" />

                        <div className="relative z-10 flex h-full flex-col justify-end px-4 py-5 sm:px-5 sm:py-6 md:max-w-[70%] md:px-7 md:py-7 lg:px-10 lg:py-9">
                            <Badge variant="accent" size="sm" className="mb-3 w-fit border-white/20 bg-white/15 text-white backdrop-blur-sm">
                                {heroBanner?.subheading || 'Express slots available today'}
                            </Badge>
                            <h1 className="max-w-[14ch] text-[1.7rem] font-display font-bold text-white sm:text-[2rem] md:text-[2.7rem] lg:text-[3.5rem]">{heroBanner?.title || 'Fresh groceries delivered like an app, not a store.'}</h1>
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

                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="flex overflow-x-auto gap-4 md:gap-8 pb-8 pt-4 hide-scrollbar snap-x snap-mandatory px-2">
                    {categories.map((cat) => (
                        <motion.div key={cat.name} variants={fadeInUp} className="flex-none snap-start">
                            <Link to={`/shop?category=${cat.name.toLowerCase()}`} className="group flex flex-col items-center justify-center gap-3 min-w-[76px] sm:min-w-[90px] md:min-w-[110px]">
                                <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 items-center justify-center transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-110">
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        loading="lazy"
                                        className="h-full w-full object-contain mix-blend-multiply filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.15)] md:drop-shadow-[0_12px_20px_rgba(0,0,0,0.12)]"
                                    />
                                </div>
                                <h3 className="text-center text-[0.85rem] md:text-[0.95rem] font-semibold text-slate-800 transition-colors group-hover:text-green-700">{cat.name}</h3>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.section>

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
                    <div className="min-h-[180px] md:min-h-[220px] animate-pulse bg-green-800/20" />
                ) : (
                    <div className="grid gap-4 p-4 md:grid-cols-[1.15fr_0.85fr] md:items-center md:p-5 lg:p-6">
                        <div>
                            <p className="section-kicker !text-white/70">Smart basket deal</p>
                            <h2 className="mt-1 text-[1.45rem] font-display font-bold md:text-[2rem]">{dealBanner?.title || 'Save more on fresh baskets this week'}</h2>
                            <p className="mt-2 max-w-[34ch] text-sm leading-6 text-white/85 md:text-base">{dealBanner?.description || 'A rotating set of fruits, vegetables and staples at a better bundle price.'}</p>
                            <div className="mt-4"><Link to={dealBanner?.link || '/shop'} className="w-full sm:w-auto"><Button variant="accent" size="lg" className="w-full sm:w-auto">View offers</Button></Link></div>
                        </div>

                        <div className="overflow-hidden rounded-[1.5rem] bg-white/10 p-1 backdrop-blur-sm">
                            {isVideo(dealBanner?.image_url) ? (
                                <video src={normalizeImageUrl(dealBanner.image_url)} className="hero-banner-media max-h-[230px] rounded-[1.3rem]" autoPlay loop muted playsInline preload="metadata" />
                            ) : (
                                <OptimizedImage src={dealBanner?.image_url} alt="Deals Graphic" className="hero-banner-media max-h-[230px] rounded-[1.3rem]" width={960} height={720} aspectRatio="4 / 3" sizes="(max-width: 767px) 100vw, 40vw" />
                            )}
                        </div>
                    </div>
                )}
            </motion.section>
        </div>
    );
};

export default Home;
