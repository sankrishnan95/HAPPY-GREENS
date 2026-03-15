import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { getOrders } from '../services/order.service';
import { sendPhoneVerificationOtp, verifyPhoneVerificationOtp } from '../services/auth.service';
import Button from '../components/Button';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout, setUser, token } = useStore((state) => ({ user: state.user, logout: state.logout, setUser: state.setUser, token: state.token }));

    const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState(user?.phone || '');
    const [otpInput, setOtpInput] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
        // Redirect admin to admin dashboard
        if (user && user.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!user || !token) return;
        const fetchOrders = async () => {
            setOrdersLoading(true);
            try {
                const data = await getOrders();
                setOrders(data || []);
            } catch (err) {
                console.error('Failed to load orders:', err);
            } finally {
                setOrdersLoading(false);
            }
        };
        fetchOrders();
    }, [user, token]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return null;
    }

    const handleSendOtp = async () => {
        if (!phoneInput) {
            setError('Please enter a phone number');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await sendPhoneVerificationOtp(phoneInput);
            setOtpSent(true);
            setMessage('OTP sent! Check your messages.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpInput) {
            setError('Please enter the OTP');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const data = await verifyPhoneVerificationOtp(phoneInput, otpInput);
            setUser(data.user, token);
            setIsVerifyingPhone(false);
            setOtpSent(false);
            setOtpInput('');
            setMessage('Phone verified successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Account Information</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-600">Name</label>
                        <p className="font-medium">{user.full_name}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Account Type</label>
                        <p className="font-medium capitalize">{user.role}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Phone Number</label>
                        <div className="flex items-center gap-3">
                            <p className="font-medium">
                                {user.phone ? user.phone : 'Not provided'}
                            </p>
                            {user.phone_verified ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Verified</span>
                            ) : (
                                <button
                                    onClick={() => setIsVerifyingPhone(!isVerifyingPhone)}
                                    className="text-primary-600 text-sm font-semibold hover:text-primary-700"
                                >
                                    Verify Phone
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isVerifyingPhone && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Phone Verification</h2>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200">{error}</div>}
                    {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm font-medium border border-green-200">{message}</div>}

                    {!otpSent ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder="+1234567890"
                                />
                            </div>
                            <Button variant="primary" onClick={handleSendOtp} disabled={loading}>
                                {loading ? 'Sending...' : 'Send OTP via SMS'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter 6-digit OTP</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500 tracking-widest text-center text-xl"
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value)}
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>
                            <Button variant="primary" onClick={handleVerifyOtp} disabled={loading} className="w-full">
                                {loading ? 'Verifying...' : 'Verify Phone'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Order History</h2>
                    <Link to="/orders" className="text-sm text-green-600 font-semibold hover:text-green-700">View All →</Link>
                </div>
                {ordersLoading ? (
                    <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-gray-600">No orders yet. Start shopping to see your order history here!</p>
                ) : (
                    <div className="space-y-3">
                        {orders.slice(0, 3).map((order: any) => (
                            <Link
                                key={order.id}
                                to={`/orders/${order.id}`}
                                className="block border border-gray-100 rounded-lg p-4 hover:border-green-200 hover:shadow-sm transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-900">Order #{order.id}</p>
                                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-700">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                                {order.payment_method && (
                                    <p className="text-xs text-gray-400 mt-2 uppercase">Payment: {order.payment_method}</p>
                                )}
                            </Link>
                        ))}
                        {orders.length > 3 && (
                            <Link to="/orders" className="block text-center text-sm text-green-600 font-semibold py-2 hover:underline">
                                View all {orders.length} orders →
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <Button variant="secondary" onClick={handleLogout} className="w-full">
                Logout
            </Button>
        </div>
    );
};

export default Profile;

