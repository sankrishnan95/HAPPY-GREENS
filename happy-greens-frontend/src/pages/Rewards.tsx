import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Gift, TrendingUp, TrendingDown, Minus, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getLoyaltyInfo, getLoyaltyHistory, LoyaltyInfo, LoyaltyTransaction } from '../services/loyalty.service';
import toast from 'react-hot-toast';

const typeConfig = {
    earned: { icon: TrendingUp, color: 'text-green-600 bg-green-50', sign: '+' },
    redeemed: { icon: TrendingDown, color: 'text-red-500 bg-red-50', sign: '' },
    reversed: { icon: Minus, color: 'text-gray-500 bg-gray-100', sign: '' },
};

export default function Rewards() {
    const { user } = useStore();
    const navigate = useNavigate();
    const [loyalty, setLoyalty] = useState<LoyaltyInfo | null>(null);
    const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [info, hist] = await Promise.all([getLoyaltyInfo(), getLoyaltyHistory()]);
            setLoyalty(info);
            setHistory(hist);
        } catch {
            toast.error('Failed to load rewards');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg mb-4">
                    <Star className="w-8 h-8 text-white fill-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">My Rewards</h1>
                <p className="text-gray-500 mt-2">Earn 1 point for every ₹40 spent. Redeem at checkout — 1 point = ₹1 off.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-sm font-medium opacity-80 mb-1">Available Points</p>
                    <p className="text-4xl font-bold">{loyalty?.loyalty_points ?? 0}</p>
                    <p className="text-xs opacity-70 mt-1">≡ ₹{loyalty?.loyalty_points ?? 0} discount</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Earned</p>
                    <p className="text-3xl font-bold text-gray-900">{loyalty?.total_points_earned ?? 0}</p>
                    <div className="flex items-center gap-1 mt-1 text-green-600 text-xs font-medium">
                        <TrendingUp className="w-3.5 h-3.5" /> All time
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Redeemed</p>
                    <p className="text-3xl font-bold text-gray-900">{loyalty?.total_points_redeemed ?? 0}</p>
                    <div className="flex items-center gap-1 mt-1 text-orange-500 text-xs font-medium">
                        <Gift className="w-3.5 h-3.5" /> Savings used
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-green-600" /> How Points Work
                </h2>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">•</span> Earn <strong>1 point for every ₹40</strong> spent on delivered orders.</li>
                    <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">•</span> Redeem at checkout — <strong>1 point = ₹1 discount</strong> (max 50% of order).</li>
                    <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">•</span> Points are awarded only after your order is <strong>delivered</strong>.</li>
                    <li className="flex items-start gap-2"><span className="text-green-600 font-bold mt-0.5">•</span> If an order is cancelled, earned points from that order are <strong>reversed</strong>.</li>
                </ul>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Points Activity</h2>
                </div>
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <ShoppingBag className="w-12 h-12 mb-3 opacity-40" />
                        <p className="font-medium">No activity yet</p>
                        <p className="text-sm mt-1">Start shopping to earn your first points!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {history.map((tx) => {
                            const cfg = typeConfig[tx.type] ?? typeConfig.earned;
                            const Icon = cfg.icon;
                            return (
                                <li key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                    <div className={`p-2 rounded-xl ${cfg.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <span className={`text-base font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.points > 0 ? '+' : ''}{tx.points} pts
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
