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
    { name: 'Fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=60', tone: 'from-orange-100 to-orange-50', emoji: 'Apple' },
    { name: 'Vegetables', image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=500&q=60', tone: 'from-green-100 to-lime-50', emoji: 'Greens' },
    { name: 'Dairy', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=60', tone: 'from-sky-100 to-cyan-50', emoji: 'Milk' },
    { name: 'Staples', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=60', tone: 'from-yellow-100 to-amber-50', emoji: 'Daily' },
    { name: 'Snacks', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=500&q=60', tone: 'from-rose-100 to-pink-50', emoji: 'Snacks' },
    { name: 'Beverages', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60', tone: 'from-violet-100 to-fuchsia-50', emoji: 'Drinks' },
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
                className="space-y-3"
            >
                <div className="flex items-end justify-between gap-3">
                    <div><p className="section-kicker">Browse faster</p><h2 className="section-title mt-1">Shop by category</h2></div>
                    <Link to="/shop" className="text-sm font-semibold text-green-700">View all</Link>
                </div>

                <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-6">
                    {categories.map((cat) => (
                        <motion.div key={cat.name} variants={fadeInUp} className="h-full">
                            <Link to={`/shop?category=${cat.name.toLowerCase()}`} className="mobile-app-card block h-full overflow-hidden rounded-[1.4rem]">
                                <div className={`bg-gradient-to-br ${cat.tone} p-3`}>
                                    <div className="mb-2 inline-flex rounded-full bg-white/70 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-700">{cat.emoji}</div>
                                    <OptimizedImage src={cat.image} alt={cat.name} className="mx-auto h-16 w-full object-contain md:h-20" width={160} height={160} aspectRatio="1 / 1" sizes="(max-width: 767px) 30vw, 16vw" />
                                </div>
                                <div className="px-2 pb-3 pt-2 text-center"><h3 className="text-[0.82rem] font-semibold text-slate-900 md:text-sm">{cat.name}</h3></div>
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
