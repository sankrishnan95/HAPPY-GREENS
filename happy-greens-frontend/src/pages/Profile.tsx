import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { getOrders } from '../services/order.service';
import {
    createProfileAddress,
    deleteProfileAddress,
    getProfileAddresses,
    setDefaultProfileAddress,
    type AddressPayload,
    type SavedAddress,
    updateProfile,
    updateProfileAddress,
} from '../services/auth.service';
import Button from '../components/Button';

const emptyAddressForm: AddressPayload = {
    label: 'Home',
    full_name: '',
    phone: '',
    address_line: '',
    locality: '',
    landmark: '',
    city: '',
    state: '',
    zip: '',
    is_default: false,
};

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
    const [addresses, setAddresses] = useState<SavedAddress[]>([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [addressMessage, setAddressMessage] = useState('');
    const [addressError, setAddressError] = useState('');
    const [addressFormOpen, setAddressFormOpen] = useState(false);
    const [addressSaving, setAddressSaving] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const [addressForm, setAddressForm] = useState<AddressPayload>(emptyAddressForm);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
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
        if (!user || !token) return;
        const fetchAddresses = async () => {
            setAddressesLoading(true);
            try {
                const data = await getProfileAddresses();
                setAddresses(data.addresses || []);
            } catch (err) {
                console.error('Failed to load addresses:', err);
            } finally {
                setAddressesLoading(false);
            }
        };
        fetchAddresses();
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

    const resetAddressForm = () => {
        setAddressForm({
            ...emptyAddressForm,
            full_name: user.full_name || '',
            phone: user.phone || '',
            is_default: addresses.length === 0,
        });
        setEditingAddressId(null);
        setAddressFormOpen(false);
    };

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

    const openNewAddressForm = () => {
        setAddressError('');
        setAddressMessage('');
        setAddressForm({
            ...emptyAddressForm,
            label: addresses.length === 0 ? 'Home' : 'Address',
            full_name: user.full_name || '',
            phone: user.phone || '',
            is_default: addresses.length === 0,
        });
        setEditingAddressId(null);
        setAddressFormOpen(true);
    };

    const openEditAddressForm = (address: SavedAddress) => {
        setAddressError('');
        setAddressMessage('');
        setAddressForm({
            label: address.label,
            full_name: address.full_name,
            phone: address.phone,
            address_line: address.address_line,
            locality: address.locality || '',
            landmark: address.landmark || '',
            city: address.city,
            state: address.state || '',
            zip: address.zip,
            is_default: address.is_default,
        });
        setEditingAddressId(address.id);
        setAddressFormOpen(true);
    };

    const handleSaveAddress = async () => {
        if (!addressForm.full_name.trim() || !addressForm.address_line.trim() || !addressForm.city.trim()) {
            setAddressError('Please fill in the recipient name, address, and city');
            return;
        }
        if (!/^\d{10}$/.test(addressForm.phone)) {
            setAddressError('Phone number must be a valid 10-digit mobile number');
            return;
        }
        if (!/^\d{6}$/.test(addressForm.zip)) {
            setAddressError('Pincode must be a valid 6-digit code');
            return;
        }

        setAddressSaving(true);
        setAddressError('');
        setAddressMessage('');
        try {
            const payload = {
                ...addressForm,
                label: addressForm.label.trim() || 'Address',
                full_name: addressForm.full_name.trim(),
                phone: addressForm.phone.trim(),
                address_line: addressForm.address_line.trim(),
                locality: addressForm.locality.trim(),
                landmark: addressForm.landmark.trim(),
                city: addressForm.city.trim(),
                state: addressForm.state.trim(),
                zip: addressForm.zip.trim(),
            };

            const data = editingAddressId
                ? await updateProfileAddress(editingAddressId, payload)
                : await createProfileAddress(payload);

            setAddresses(data.addresses || []);
            setAddressMessage(editingAddressId ? 'Address updated successfully' : 'Address added successfully');
            resetAddressForm();
        } catch (err: any) {
            setAddressError(err.response?.data?.message || 'Failed to save address');
        } finally {
            setAddressSaving(false);
        }
    };

    const handleDeleteAddress = async (id: number) => {
        setAddressError('');
        setAddressMessage('');
        try {
            const data = await deleteProfileAddress(id);
            setAddresses(data.addresses || []);
            if (editingAddressId === id) {
                resetAddressForm();
            }
            setAddressMessage('Address removed');
        } catch (err: any) {
            setAddressError(err.response?.data?.message || 'Failed to delete address');
        }
    };

    const handleSetDefaultAddress = async (id: number) => {
        setAddressError('');
        setAddressMessage('');
        try {
            const data = await setDefaultProfileAddress(id);
            setAddresses(data.addresses || []);
            setAddressMessage('Default address updated');
        } catch (err: any) {
            setAddressError(err.response?.data?.message || 'Failed to update default address');
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <h1 className="mb-8 text-3xl font-bold">My Profile</h1>

            <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
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
                {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">{error}</div>}
                {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{message}</div>}
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-primary-500"
                                value={profileForm.full_name}
                                onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                placeholder="Enter your name"
                            />
                        ) : (
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Email</label>
                        <input
                            type="email"
                            className="w-full cursor-not-allowed rounded-lg border-2 border-gray-100 bg-gray-50 px-4 py-2 text-gray-500"
                            value={user.email}
                            readOnly
                            disabled
                        />
                        <p className="mt-1 text-xs text-gray-500">Your login email cannot be edited here.</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Account Type</label>
                        <p className="font-medium capitalize">{user.role}</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Phone Number</label>
                        <div className="space-y-2">
                            {isEditing ? (
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">+91</span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        className="w-full rounded-lg border-2 border-gray-200 py-2 pl-14 pr-4 focus:border-primary-500"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                        placeholder="Enter 10-digit mobile number"
                                    />
                                </div>
                            ) : (
                                <p className="font-medium text-gray-900">{user.phone ? `+91 ${user.phone}` : 'Not provided'}</p>
                            )}
                            {user.phone_verified ? (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Verified</span>
                            ) : (
                                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">Not verified</span>
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

            <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Saved Addresses</h2>
                    </div>
                    {!addressFormOpen && (
                        <button
                            type="button"
                            onClick={openNewAddressForm}
                            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                            Add Address
                        </button>
                    )}
                </div>
                {addressError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">{addressError}</div>}
                {addressMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{addressMessage}</div>}

                {addressFormOpen && (
                    <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm text-gray-600">Label</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    value={addressForm.label}
                                    onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                                    placeholder="Home, Work, etc."
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-gray-600">Recipient Name</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    value={addressForm.full_name}
                                    onChange={(e) => setAddressForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                    placeholder="Enter recipient name"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-gray-600">Phone</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">+91</span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-14 pr-4 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        value={addressForm.phone}
                                        onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                        placeholder="Enter mobile number"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-gray-600">Pincode</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    value={addressForm.zip}
                                    onChange={(e) => setAddressForm((prev) => ({ ...prev, zip: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                    placeholder="Enter pincode"
                                />
                            </div>
                        </div>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-gray-600">Address Line</label>
                                <textarea
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    value={addressForm.address_line}
                                    onChange={(e) => setAddressForm((prev) => ({ ...prev, address_line: e.target.value }))}
                                    placeholder="Flat / House No, Building, Street"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm text-gray-600">Locality / Area</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        value={addressForm.locality}
                                        onChange={(e) => setAddressForm((prev) => ({ ...prev, locality: e.target.value }))}
                                        placeholder="Locality / Area"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-gray-600">Landmark</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        value={addressForm.landmark}
                                        onChange={(e) => setAddressForm((prev) => ({ ...prev, landmark: e.target.value }))}
                                        placeholder="Nearby landmark"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-gray-600">City</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                                        placeholder="Enter city"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-gray-600">State</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        value={addressForm.state}
                                        onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                                        placeholder="Enter state"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={addressForm.is_default}
                                    onChange={(e) => setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                                />
                                Set as default address
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button variant="primary" onClick={handleSaveAddress} disabled={addressSaving}>
                                    {addressSaving ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
                                </Button>
                                <Button variant="outline" onClick={resetAddressForm} disabled={addressSaving}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {addressesLoading ? (
                    <div className="flex justify-center py-6">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-600"></div>
                    </div>
                ) : addresses.length === 0 ? (
                    <div />
                ) : (
                    <div className="space-y-3">
                        {addresses.map((address) => (
                            <div key={address.id} className="rounded-xl border border-gray-100 p-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900">{address.label}</p>
                                            {address.is_default && (
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Default</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{address.full_name}</p>
                                        <p className="text-sm text-gray-600">
                                            {address.address_line}
                                            {address.locality ? `, ${address.locality}` : ''}
                                            {address.landmark ? `, ${address.landmark}` : ''}
                                        </p>
                                        <p className="text-sm text-gray-600">{[address.city, address.state, address.zip].filter(Boolean).join(', ')}</p>
                                        <p className="text-sm text-gray-600">+91 {address.phone}</p>
                                    </div>
                                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[9rem]">
                                        {!address.is_default && (
                                            <button
                                                type="button"
                                                onClick={() => handleSetDefaultAddress(address.id)}
                                                className="rounded-md border border-blue-200 px-2.5 py-1.5 text-left text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                                            >
                                                Make Default
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => openEditAddressForm(address)}
                                            className="rounded-md border border-gray-200 px-2.5 py-1.5 text-left text-xs font-semibold text-primary-600 transition hover:bg-gray-50 hover:text-primary-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAddress(address.id)}
                                            className="rounded-md border border-red-200 px-2.5 py-1.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Order History</h2>
                    <Link to="/orders" className="text-sm font-semibold text-green-600 hover:text-green-700">View All →</Link>
                </div>
                {ordersLoading ? (
                    <div className="flex justify-center py-6">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-600"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-gray-600">No orders yet. Start shopping to see your order history here!</p>
                ) : (
                    <div className="space-y-3">
                        {orders.slice(0, 3).map((order: any) => (
                            <Link
                                key={order.id}
                                to={`/orders/${order.id}`}
                                className="block rounded-lg border border-gray-100 p-4 transition-all hover:border-green-200 hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">Order #{order.id}</p>
                                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-700">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                                            order.status === 'delivered'
                                                ? 'bg-green-100 text-green-800'
                                                : order.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                                {order.payment_method && (
                                    <p className="mt-2 text-xs uppercase text-gray-400">Payment: {order.payment_method}</p>
                                )}
                            </Link>
                        ))}
                        {orders.length > 3 && (
                            <Link to="/orders" className="block py-2 text-center text-sm font-semibold text-green-600 hover:underline">
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
