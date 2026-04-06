import { useState, useEffect } from 'react';
import { Search, Plus, Tag, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../services/coupon.service';
import { getCategories, getProducts } from '../services/product.service';
export default function Discounts() {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    filterCoupons();
  }, [searchTerm, coupons]);

  const loadCoupons = async () => {
    try {
      console.log('🔄 Loading coupons...');
      const response = await getCoupons();
      console.log('✅ Coupons loaded:', response.data.length);
      setCoupons(response.data || []);
    } catch (error) {
      console.error('❌ Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCoupons = () => {
    let filtered = coupons;

    if (searchTerm) {
      filtered = filtered.filter(coupon =>
        coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCoupons(filtered);
  };

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setShowModal(true);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setShowModal(true);
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await deleteCoupon(id);
      alert('Coupon deleted successfully');
      loadCoupons();
    } catch (error) {
      console.error('❌ Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const newActiveState = !coupon.is_active;
      await updateCoupon(coupon.id, { is_active: newActiveState });

      // Optimistically update the local state instead of reloading
      setCoupons(prevCoupons =>
        prevCoupons.map(c =>
          c.id === coupon.id ? { ...c, is_active: newActiveState } : c
        )
      );

      alert(`Coupon ${newActiveState ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('❌ Error toggling coupon:', error);
      alert('Failed to update coupon');
      // Reload on error to ensure consistency
      loadCoupons();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      dateStyle: 'medium'
    });
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discount Coupons</h1>
          <p className="text-gray-600 mt-2">Create and manage promotional coupons</p>
        </div>
        <button
          onClick={handleCreateCoupon}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`bg-white rounded-lg shadow p-6 border-2 ${!coupon.is_active || isExpired(coupon.valid_until)
                ? 'border-gray-200 opacity-60'
                : 'border-primary'
              }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-gray-900">{coupon.code}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(coupon)}
                  className="text-gray-600 hover:text-primary"
                  title={coupon.is_active ? 'Deactivate' : 'Activate'}
                >
                  {coupon.is_active ? (
                    <ToggleRight className="w-6 h-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleEditCoupon(coupon)}
                  className="text-gray-600 hover:text-primary"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteCoupon(coupon.id)}
                  className="text-gray-600 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{coupon.description}</p>
            
            {(coupon.applicable_category_name || coupon.applicable_product_name) && (
              <div className="mb-4 inline-flex flex-col gap-1 items-start">
                {coupon.applicable_category_name && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                    Category: {coupon.applicable_category_name}
                  </span>
                )}
                {coupon.applicable_product_name && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100">
                    Product: {coupon.applicable_product_name}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-semibold text-primary">
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}%`
                    : `₹${coupon.discount_value}`}
                </span>
              </div>
              {coupon.min_order_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min Order:</span>
                  <span className="font-medium">₹{coupon.min_order_amount}</span>
                </div>
              )}
              {coupon.max_discount_amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Discount:</span>
                  <span className="font-medium">₹{coupon.max_discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usage:</span>
                <span className="font-medium">
                  {coupon.used_count} / {coupon.usage_limit || '∞'}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-1">
              <div className="text-xs text-gray-500">
                Valid: {formatDate(coupon.valid_from)} - {formatDate(coupon.valid_until)}
              </div>
              {isExpired(coupon.valid_until) && (
                <div className="text-xs text-red-600 font-semibold">EXPIRED</div>
              )}
              {!coupon.is_active && !isExpired(coupon.valid_until) && (
                <div className="text-xs text-gray-600 font-semibold">INACTIVE</div>
              )}
              {coupon.is_active && !isExpired(coupon.valid_until) && (
                <div className="text-xs text-green-600 font-semibold">ACTIVE</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No coupons found</p>
          <p className="text-sm text-gray-400 mt-2">Create your first coupon to get started</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <CouponModal
          coupon={editingCoupon}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadCoupons();
          }}
        />
      )}
    </div>
  );
}

// Coupon Modal Component
function CouponModal({ coupon, onClose, onSave }) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value || '',
    min_order_amount: coupon?.min_order_amount || 0,
    max_discount_amount: coupon?.max_discount_amount || '',
    usage_limit: coupon?.usage_limit || '',
    valid_from: coupon?.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
    valid_until: coupon?.valid_until?.split('T')[0] || '',
    applicable_category_id: coupon?.applicable_category_id || '',
    applicable_product_id: coupon?.applicable_product_id || '',
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data)).catch(console.error);
    getProducts({ limit: 1000 }).then((res) => setProducts(res.data.products || [])).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (coupon) {
        // Update existing coupon
        await updateCoupon(coupon.id, formData);
        alert('Coupon updated successfully');
      } else {
        // Create new coupon
        await createCoupon(formData);
        alert('Coupon created successfully');
      }
      onSave();
    } catch (error) {
      console.error('❌ Error saving coupon:', error);
      alert(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {coupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
                disabled={!!coupon}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type *
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              rows="2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable Category
            </label>
            <select
              value={formData.applicable_category_id}
              onChange={(e) => setFormData({ ...formData, applicable_category_id: e.target.value, applicable_product_id: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Value *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Order Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Discount Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From *
              </label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until *
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {coupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
