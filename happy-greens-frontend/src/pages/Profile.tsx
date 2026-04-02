import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { getOrders } from '../services/order.service';
import { updateProfile } from '../services/auth.service';
import Button from '../components/Button';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout, setUser, token } = useStore((state) => ({ user: state.user, logout: state.logout, setUser: state.setUser, token: state.token }));

    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
    });
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

    useEffect(() => {
        setProfileForm({
            full_name: user?.full_name || '',
            phone: user?.phone || '',
        });
    }, [user?.full_name, user?.phone]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return null;
    }

    const handleSaveProfile = async () => {
        if (!profileForm.full_name.trim()) {
            setError('Please enter your name');
            return;
        }
        if (profileForm.phone && !/^\d{10}$/.test(profileForm.phone)) {
            setError('Phone number must be a valid 10-digit mobile number');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const data = await updateProfile({
                full_name: profileForm.full_name.trim(),
                phone: profileForm.phone.trim(),
            });
            setUser(data.user, token);
            setMessage('Profile updated successfully');
            setIsEditing(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleStartEditing = () => {
        setError('');
        setMessage('');
        setProfileForm({
            full_name: user.full_name || '',
            phone: user.phone || '',
        });
        setIsEditing(true);
    };

    const handleCancelEditing = () => {
        setError('');
        setMessage('');
        setProfileForm({
            full_name: user.full_name || '',
            phone: user.phone || '',
        });
        setIsEditing(false);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Account Information</h2>
                    {!isEditing && (
                        <button
                            type="button"
                            onClick={handleStartEditing}
                            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                            Edit
                        </button>
                    )}
                </div>
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200">{error}</div>}
                {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm font-medium border border-green-200">{message}</div>}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500"
                                value={profileForm.full_name}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                placeholder="Enter your name"
                            />
                        ) : (
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 border-2 border-gray-100 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            value={user.email}
                            readOnly
                            disabled
                        />
                        <p className="mt-1 text-xs text-gray-500">Your login email cannot be edited here.</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Account Type</label>
                        <p className="font-medium capitalize">{user.role}</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                        <div className="space-y-2">
                            {isEditing ? (
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">+91</span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        className="w-full pl-14 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-500"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                        placeholder="Enter 10-digit mobile number"
                                    />
                                </div>
                            ) : (
                                <p className="font-medium text-gray-900">{user.phone ? `+91 ${user.phone}` : 'Not provided'}</p>
                            )}
                            {user.phone_verified ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Verified</span>
                            ) : (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">Not verified</span>
                            )}
                        </div>
                    </div>
                    {isEditing && (
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button variant="primary" onClick={handleSaveProfile} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Profile'}
                            </Button>
                            <Button variant="outline" onClick={handleCancelEditing} disabled={loading}>
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </div>

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

