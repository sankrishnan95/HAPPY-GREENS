import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Shield, Clock, Leaf } from 'lucide-react';
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
        <div className="space-y-16 pb-12 md:space-y-24 lg:space-y-32 max-w-7xl mx-auto">
            <section className="mobile-app-card hero-banner overflow-hidden rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">
                {loadingBanners ? (
                    <div className="min-h-[280px] md:min-h-[400px] lg:min-h-[480px] animate-pulse bg-gray-100" />
                ) : (
                    <div className="relative min-h-[280px] md:min-h-[400px] lg:min-h-[480px]">
                        <div className="absolute inset-0">
                            {isVideo(heroBanner?.image_url) ? (
                                <video src={normalizeImageUrl(heroBanner.image_url)} className="hero-banner-media" autoPlay loop muted playsInline preload="metadata" />
                            ) : (
                                <OptimizedImage src={heroBanner?.image_url} alt="Storefront Hero" className="hero-banner-media" width={1280} height={720} aspectRatio="16 / 9" loading="eager" fetchPriority="high" sizes="100vw" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="relative z-10 flex h-full flex-col justify-end px-6 py-8 text-center sm:px-8 sm:py-10 md:px-12 md:py-16 items-center">
                            <Badge variant="accent" size="sm" className="mb-5 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-md">
                                {heroBanner?.subheading || 'Express slots available today'}
                            </Badge>
                            <h1 className="max-w-[20ch] text-[2rem] font-semibold tracking-tight text-white leading-tight sm:text-[2.75rem] md:text-[3.5rem] lg:text-[4.5rem]">
                                {heroBanner?.title || 'Fresh groceries delivered like an app, not a store.'}
                            </h1>
                            <p className="mt-4 max-w-[42ch] text-[0.95rem] font-medium leading-relaxed text-white/80 sm:text-base md:text-lg">
                                {heroBanner?.description || 'Daily essentials, fruits, vegetables and dairy packed for fast doorstep delivery.'}
                            </p>
                            <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center w-full sm:w-auto">
                                <Link to={heroBanner?.link || '/shop'} className="w-full sm:w-[200px]">
                                    <Button variant="accent" size="lg" className="w-full rounded-[24px] bg-white text-black hover:bg-gray-100 border-none font-semibold text-[1.05rem] py-3.5 transition-transform hover:scale-105">Shop fresh</Button>
                                </Link>
                                <Link to="/shop?category=vegetables" className="w-full sm:w-[200px]">
                                    <Button variant="outline" size="lg" className="w-full rounded-[24px] border border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold text-[1.05rem] py-3.5 backdrop-blur-sm transition-transform hover:scale-105">Explore veggies</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section className="space-y-6 px-2">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-[1.75rem] font-semibold tracking-tight text-black sm:text-[2rem]">Shop by category</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500">Find exactly what you need quickly.</p>
                    </div>
                    <Link to="/shop" className="hidden sm:block text-[0.9rem] font-semibold text-black hover:underline underline-offset-4">View all</Link>
                </div>

                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6 lg:gap-8">
                    {categories.map((cat) => (
                        <Link key={cat.name} to={`/shop?category=${cat.name.toLowerCase()}`} className="group relative overflow-hidden rounded-[24px] bg-white p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08)]">
                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-50 p-2 sm:h-20 sm:w-20 transition-transform duration-300 group-hover:scale-110">
                                    <OptimizedImage src={cat.image} alt={cat.name} className="h-full w-full rounded-full object-cover" width={160} height={160} aspectRatio="1 / 1" sizes="(max-width: 767px) 30vw, 16vw" />
                                </div>
                                <h3 className="text-center text-[0.9rem] font-semibold tracking-tight text-black">{cat.name}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="sm:hidden flex justify-center mt-2">
                    <Link to="/shop" className="text-[0.9rem] font-semibold text-black hover:underline underline-offset-4">View all categories</Link>
                </div>
            </section>

            <section className="overflow-hidden rounded-[32px] bg-gray-50 px-6 py-10 md:px-12 md:py-16 lg:px-16 lg:py-20 text-center">
                <div className="mx-auto max-w-2xl mb-10 md:mb-14">
                    <h2 className="text-[2rem] font-semibold tracking-tight text-black sm:text-[2.5rem]">Built for daily groceries</h2>
                    <p className="mt-3 text-base text-gray-500 sm:text-lg">Experience the fastest delivery with no compromises on quality.</p>
                </div>
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
                    {features.map((feature) => (
                        <div key={feature.title} className="flex flex-col items-center">
                            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] text-black">
                                <feature.icon className="h-6 w-6" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-[1.05rem] font-semibold tracking-tight text-black">{feature.title}</h3>
                            <p className="mt-2 text-[0.85rem] leading-relaxed text-gray-500 max-w-[20ch]">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="overflow-hidden rounded-[32px] bg-black text-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)]">
                {loadingBanners ? (
                    <div className="min-h-[220px] md:min-h-[280px] animate-pulse bg-gray-800" />
                ) : (
                    <div className="grid gap-8 p-8 md:grid-cols-[1fr_1fr] md:items-center md:gap-12 md:p-12 lg:p-16">
                        <div className="order-2 md:order-1 flex flex-col items-center text-center md:items-start md:text-left">
                            <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-widest text-gray-400">Smart basket deal</p>
                            <h2 className="text-[2rem] font-semibold tracking-tight leading-tight sm:text-[2.5rem] md:text-[3rem]">
                                {dealBanner?.title || 'Save more on fresh baskets this week'}
                            </h2>
                            <p className="mt-4 max-w-[40ch] text-[1rem] leading-relaxed text-gray-400 md:text-[1.1rem]">
                                {dealBanner?.description || 'A rotating set of fruits, vegetables and staples at a better bundle price.'}
                            </p>
                            <div className="mt-8 w-full sm:w-auto">
                                <Link to={dealBanner?.link || '/shop'}>
                                    <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-[24px] bg-white text-black hover:bg-gray-200 border-none font-semibold px-8 py-3.5 transition-transform hover:scale-105">View offers</Button>
                                </Link>
                            </div>
                        </div>

                        <div className="order-1 md:order-2 overflow-hidden rounded-[24px] bg-gray-900 shadow-2xl">
                            {isVideo(dealBanner?.image_url) ? (
                                <video src={normalizeImageUrl(dealBanner.image_url)} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" autoPlay loop muted playsInline preload="metadata" />
                            ) : (
                                <OptimizedImage src={dealBanner?.image_url} alt="Deals Graphic" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" width={960} height={720} aspectRatio="4 / 3" sizes="(max-width: 767px) 100vw, 50vw" />
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
