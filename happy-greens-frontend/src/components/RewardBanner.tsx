import { Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const RewardBanner = () => {
    return (
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-rose-500 to-orange-500 p-6 md:p-8 flex items-center justify-between shadow-lg shadow-orange-500/20">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 right-[20%] w-48 h-48 bg-rose-300/30 rounded-full blur-2xl translate-y-1/2"></div>
            
            {/* Golden Fireflies / Sparkles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen">
                <div className="absolute top-[20%] left-[10%] w-1.5 h-1.5 bg-yellow-200 rounded-full shadow-[0_0_8px_2px_rgba(253,224,71,0.8)] animate-pulse" style={{ animationDuration: '2s' }}></div>
                <div className="absolute top-[60%] left-[30%] w-2 h-2 bg-yellow-300 rounded-full shadow-[0_0_12px_3px_rgba(253,224,71,0.9)] animate-bounce" style={{ animationDuration: '3s' }}></div>
                <div className="absolute top-[30%] left-[55%] w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_6px_2px_rgba(250,204,21,0.8)] animate-ping" style={{ animationDuration: '2.5s' }}></div>
                <div className="absolute top-[80%] left-[50%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,255,255,0.8)] animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}></div>
                <div className="absolute top-[25%] left-[85%] w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_0_10px_3px_rgba(253,224,71,0.8)] animate-pulse" style={{ animationDuration: '2.8s' }}></div>
                <div className="absolute top-[70%] left-[80%] w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_6px_2px_rgba(250,204,21,0.8)] animate-bounce" style={{ animationDuration: '2.2s' }}></div>
                <div className="absolute top-[40%] left-[20%] w-1 h-1 bg-yellow-200 rounded-full shadow-[0_0_8px_2px_rgba(253,224,71,0.8)] animate-ping" style={{ animationDuration: '3.5s' }}></div>
            </div>
            
            {/* Left Content */}
            <div className="relative z-10 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white mb-4 backdrop-blur-md">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>Happy Rewards Program</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                    Earn Reward Points
                </h2>
                <p className="text-rose-50 text-sm md:text-base mb-6 leading-relaxed">
                    Shop now and earn points on every purchase. Redeem your points for exciting discounts and exclusive offers on farm-fresh groceries.
                </p>
                <Link 
                    to="/rewards"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition-colors px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm group"
                >
                    View Rewards
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Right Graphic Area - Hidden on small mobile to save space md:flex */}
            <div className="relative hidden sm:flex items-center justify-center w-40 h-40 md:w-48 md:h-48 select-none">
                {/* Decorative shapes behind the trophy */}
                <div className="absolute w-24 h-24 bg-white/30 rounded-full mix-blend-overlay animate-pulse opacity-80 blur-xl"></div>
                <div className="absolute w-16 h-16 bg-yellow-300 rounded-3xl rotate-12 -right-4 top-4 mix-blend-overlay opacity-60 blur-lg"></div>
                
                {/* The main Trophy icon */}
                <div className="relative z-10 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full p-6 shadow-2xl shadow-yellow-900/30 transform hover:scale-105 transition-transform duration-300">
                    <Trophy className="w-12 h-12 md:w-16 md:h-16 text-rose-900" strokeWidth={1.5} />
                    
                    {/* Floating star */}
                    <div className="absolute -top-2 -right-2 text-yellow-200 animate-bounce">✨</div>
                </div>
            </div>
        </div>
    );
};

export default RewardBanner;
