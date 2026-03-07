import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { TrendingUp, ShoppingBag, IndianRupee, Users, Filter, MapPin, Globe } from 'lucide-react';
import { getDashboardAnalytics } from '../services/analytics.service';
import toast from 'react-hot-toast';

const TIME_FILTERS = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 90 Days', value: '90' },
    { label: 'All Time', value: 'all' }
];

export default function Analytics() {
    const [timeFilter, setTimeFilter] = useState('7');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        metrics: {
            totalOrders: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            avgOrdersPerDay: 0,
            avgSalesPerDay: 0,
            returningCustomerRate: 0,
            daysCalculated: 7
        },
        chartData: [],
        topRegions: []
    });

    useEffect(() => {
        fetchAnalytics();
    }, [timeFilter]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await getDashboardAnalytics(timeFilter);
            setData(response.data);
        } catch (error) {
            console.error('Failed to load analytics dashboard', error);
            toast.error('Could not load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const metrics = data.metrics;

    // Custom Tooltip for charts
    const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-100 shadow-strong rounded-xl">
                    <p className="text-gray-500 text-sm mb-1">{label}</p>
                    <p className="font-bold text-gray-900">
                        {prefix}{Number(payload[0].value).toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header & Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Store Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Analyzing data for the {TIME_FILTERS.find(f => f.value === timeFilter)?.label.toLowerCase()}.
                    </p>
                </div>

                <div className="relative inline-flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    {TIME_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setTimeFilter(filter.value)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${timeFilter === filter.value
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <>
                    {/* Top 4 Primary Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Avg Orders Per Day */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Avg Orders Per Day</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {Number(metrics.avgOrdersPerDay).toFixed(1)}
                            </p>
                        </div>

                        {/* Avg Order Value */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Avg Order Value</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                ₹{Number(metrics.avgOrderValue).toFixed(2)}
                            </p>
                        </div>

                        {/* Avg Sales Per Day */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                    <IndianRupee className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Avg Sales Per Day</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                ₹{Number(metrics.avgSalesPerDay).toFixed(2)}
                            </p>
                        </div>

                        {/* Returning Customers % */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Returning Customers</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {Number(metrics.returningCustomerRate).toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {/* Chart Container 1: Total Orders Over Time */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Total Orders Over Time</h3>
                                <p className="text-sm text-gray-500">Cumulative order volume across {metrics.daysCalculated} days: <span className="font-bold text-gray-900">{metrics.totalOrders}</span></p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#orderGradient)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart Container 2: Gross Sales Over Time */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Gross Sales Over Time</h3>
                                <p className="text-sm text-gray-500">Total processed revenue: <span className="font-bold text-gray-900">₹{metrics.totalRevenue.toLocaleString()}</span></p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value}`} />
                                    <RechartsTooltip content={<CustomTooltip prefix="₹" />} />
                                    <Area type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#salesGradient)" activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Sub Analytics Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Regional Sales */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <MapPin className="w-5 h-5 text-gray-500" />
                                <h3 className="text-lg font-bold text-gray-900">Sales by Region</h3>
                            </div>

                            {data.topRegions.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No regional data available yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.topRegions.map((region, idx) => (
                                        <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-medium text-gray-900 capitalize">{region.region}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">₹{region.sales.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">{region.orders} orders</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Traffic Source Placeholder */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Globe className="w-5 h-5 text-gray-500" />
                                <h3 className="text-lg font-bold text-gray-900">Traffic Sources</h3>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { source: 'Direct', val: '45%' },
                                    { source: 'Google Organic', val: '30%' },
                                    { source: 'Instagram Ads', val: '15%' },
                                    { source: 'Facebook', val: '10%' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                        <span className="font-medium text-gray-700">{item.source}</span>
                                        <span className="font-bold text-gray-900">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-4 text-center italic">*Traffic sources are currently simulated placeholders mapping to future integrations.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
