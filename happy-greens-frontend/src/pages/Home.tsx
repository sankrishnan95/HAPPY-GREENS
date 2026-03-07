import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, Leaf } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getActiveBanners } from '../services/banner.service';

const categories = [
    { name: 'Fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=60', color: 'bg-orange-100', icon: '🍎' },
    { name: 'Vegetables', image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=500&q=60', color: 'bg-green-100', icon: '🥬' },
    { name: 'Dairy', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=60', color: 'bg-blue-100', icon: '🥛' },
    { name: 'Staples', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=60', color: 'bg-yellow-100', icon: '🌾' },
    { name: 'Snacks', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=500&q=60', color: 'bg-red-100', icon: '🍿' },
    { name: 'Beverages', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60', color: 'bg-purple-100', icon: '🧃' },
];

const features = [
    { icon: Truck, title: 'Fast Delivery', description: 'Get your groceries delivered within 30 minutes', color: 'text-primary-600' },
    { icon: Leaf, title: 'Farm Fresh', description: '100% organic produce directly from farms', color: 'text-green-600' },
    { icon: Shield, title: 'Quality Assured', description: 'Rigorous quality checks on every product', color: 'text-blue-600' },
    { icon: Clock, title: '24/7 Service', description: 'Order anytime, we\'re always available', color: 'text-orange-600' },
];

const Home = () => {
    const [banners, setBanners] = useState<any[]>([]);

    const isVideo = (url: string) => {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.webm');
    };

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await getActiveBanners();
                if (data.success && data.banners) {
                    setBanners(data.banners);
                }
            } catch (error) {
                console.error("Failed to fetch banners");
            }
        };
        fetchBanners();
    }, []);

    const heroBanner = banners.length > 0 ? banners[0] : null;
    const dealBanner = banners.length > 1 ? banners[1] : null;

    return (
        <div className="space-y-16 animate-fade-in">
            {/* Hero Section */}
            <section className="relative bg-gray-900 rounded-4xl overflow-hidden h-[500px] flex items-center shadow-strong">
                <div className="absolute inset-0">
                    {isVideo(heroBanner?.image_url) ? (
                        <video
                            src={heroBanner.image_url}
                            className="w-full h-full object-cover opacity-60"
                            autoPlay loop muted playsInline
                        />
                    ) : (
                        <img
                            src={heroBanner?.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"}
                            alt="Storefront Hero"
                            className="w-full h-full object-cover opacity-60"
                        />
                    )}
                </div>
                <div className="relative container mx-auto px-8 md:px-16 z-10">
                    <div className="max-w-2xl text-white animate-slide-up">
                        <Badge variant="accent" size="lg" className="mb-6 animate-bounce-soft">
                            {heroBanner?.subheading || "🎉 New: Free Delivery on Orders Above ₹500"}
                        </Badge>
                        <h1 className="text-6xl md:text-7xl font-display font-bold mb-6 leading-tight drop-shadow-md">
                            {heroBanner?.title || (
                                <>Fresh Groceries <br /><span className="text-yellow-300">Delivered Fast</span></>
                            )}
                        </h1>
                        <p className="text-xl md:text-2xl mb-10 opacity-95 font-light drop-shadow-md">
                            {heroBanner?.description || "Get farm-fresh produce and daily essentials delivered to your doorstep in minutes."}
                        </p>
                        <Link to={heroBanner?.link || "/shop"}>
                            <Button variant="accent" size="lg" className="group shadow-lg">
                                Shop Now
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="animate-slide-up">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-4xl font-display font-bold text-gray-900">Shop by Category</h2>
                    <Link to="/shop" className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-2 group">
                        View All
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {categories.map((cat, index) => (
                        <Link
                            key={cat.name}
                            to={`/shop?category=${cat.name.toLowerCase()}`}
                            className="group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`${cat.color} rounded-3xl p-6 mb-3 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-medium relative overflow-hidden`}>
                                <div className="absolute top-2 right-2 text-3xl opacity-20 group-hover:scale-125 transition-transform">
                                    {cat.icon}
                                </div>
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-32 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <h3 className="text-center font-display font-semibold text-lg text-gray-800 group-hover:text-primary-600 transition-colors">
                                {cat.name}
                            </h3>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="bg-gradient-soft rounded-4xl p-12 animate-slide-up">
                <h2 className="text-4xl font-display font-bold text-center mb-12 text-gray-900">Why Choose Happy Greens?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 hover-lift text-center"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={`${feature.color} bg-gradient-to-br from-current to-transparent bg-clip-text`}>
                                <feature.icon className="h-12 w-12 mx-auto mb-4" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-display font-bold text-xl mb-2 text-gray-900">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Deals Banner */}
            <section className="relative bg-gradient-accent rounded-4xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden shadow-strong animate-slide-up">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-10 right-10 text-9xl">🎁</div>
                    <div className="absolute bottom-10 left-10 text-7xl">✨</div>
                </div>
                <div className="flex-1 relative z-10">
                    <Badge variant="accent" size="lg" className="mb-4 bg-white/20 backdrop-blur-sm border-white/30 animate-pulse-soft">
                        {dealBanner?.subheading || "🔥 Deal of the Day"}
                    </Badge>
                    <h2 className="text-5xl font-display font-bold mb-4 text-white">
                        {dealBanner?.title || (
                            <>Get 50% Off on <br />Exotic Fruits</>
                        )}
                    </h2>
                    <p className="text-white/90 mb-8 text-xl font-light">
                        {dealBanner?.description || "Don't miss out on special promotions on farm-fresh deals right now."}
                    </p>
                    <Link to={dealBanner?.link || "/shop"}>
                        <Button variant="primary" size="lg" className="bg-white text-accent-orange hover:bg-gray-100 shadow-lg">
                            Grab Deal Now
                        </Button>
                    </Link>
                </div>
                <div className="flex-1 relative z-10">
                    {isVideo(dealBanner?.image_url) ? (
                        <video
                            src={dealBanner.image_url}
                            className="w-full h-80 object-cover rounded-3xl shadow-strong hover:scale-105 transition-transform duration-500"
                            autoPlay loop muted playsInline
                        />
                    ) : (
                        <img
                            src={dealBanner?.image_url || "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80"}
                            alt="Deals Graphic"
                            className="w-full h-80 object-cover rounded-3xl shadow-strong hover:scale-105 transition-transform duration-500"
                        />
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
