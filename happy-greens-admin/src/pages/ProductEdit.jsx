import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { getProductById, createProduct, updateProduct, getCategories } from '../services/product.service';
import { uploadImages } from '../services/upload.service';
import { API_BASE_URL } from '../services/api';

export default function ProductEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        category_id: '',
        stock_quantity: '',
        unit: 'kg',
        isActive: true,
        images: [],
        image_url: '' // Legacy fallback
    });

    useEffect(() => {
        fetchCategories();
        if (!isNew) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await getCategories();
            if (response.data) {
                setCategories(response.data);
                if (isNew && response.data.length > 0) {
                    setFormData(prev => ({ ...prev, category_id: response.data[0].id }));
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const fetchProduct = async () => {
        try {
            const response = await getProductById(id);
            const product = response.data;
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                discountPrice: product.discountPrice || '',
                category_id: product.category_id || '',
                stock_quantity: product.stock_quantity || '',
                unit: product.unit || 'kg',
                isActive: product.isActive ?? true,
                images: product.images || (product.image_url ? [product.image_url] : []),
                image_url: product.image_url || ''
            });
        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Failed to load product');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const maxUploads = 10 - formData.images.length;
        if (files.length > maxUploads) {
            alert(`You can only upload ${maxUploads} more images (max 10 total).`);
            return;
        }

        setUploading(true);
        const payload = new FormData();
        files.forEach(file => payload.append('images', file));

        try {
            const data = await uploadImages(payload);
            const uploadedPaths = data.images;
            // Provide full paths combining URL domain
            const fullPaths = uploadedPaths.map(p => `${API_BASE_URL}${p}`);

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...fullPaths]
            }));
            alert('Images uploaded successfully');
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (indexToRemove) => {
        setFormData(prev => {
            const newImages = prev.images.filter((_, i) => i !== indexToRemove);
            return {
                ...prev,
                images: newImages,
                image_url: newImages.length > 0 ? newImages[0] : ''
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
                stock_quantity: parseInt(formData.stock_quantity),
                category_id: parseInt(formData.category_id)
            };

            if (isNew) {
                await createProduct(payload);
                alert('Product created successfully');
            } else {
                await updateProduct(id, payload);
                alert('Product updated successfully');
            }
            navigate('/products');
        } catch (error) {
            console.error('Error saving product:', error);
            alert(error.response?.data?.message || 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/products')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isNew ? 'Create New Product' : 'Edit Product'}
                        </h1>
                        <p className="text-gray-600 mt-1">Manage product details and images</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Product'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Availability Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability</h2>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor="isActive" className="text-md font-medium text-gray-900 cursor-pointer">
                            Available for Sale (Visible on Storefront)
                        </label>
                    </div>
                </div>

                {/* Basic Info Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                rows="4"
                            />
                        </div>
                        {categories.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    required
                                >
                                    <option value="">Select a category...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Regular Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Discounted Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.discountPrice}
                                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Leave empty for no discount"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                                <input
                                    type="number"
                                    value={formData.stock_quantity}
                                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    required
                                >
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="g">Gram (g)</option>
                                    <option value="l">Liter (l)</option>
                                    <option value="ml">Milliliter (ml)</option>
                                    <option value="piece">Piece</option>
                                    <option value="dozen">Dozen</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Images Gallery */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Product Images</h2>
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <UploadCloud className="w-5 h-5" />
                            {uploading ? 'Uploading...' : 'Upload Images'}
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {formData.images.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No images uploaded yet</p>
                            <p className="text-sm text-gray-400 mt-1">Upload JPEG, PNG, or WebP (max 5MB each)</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {formData.images.map((imgUrl, idx) => (
                                <div key={idx} className={`relative group rounded-lg overflow-hidden border-2 ${idx === 0 ? 'border-primary' : 'border-gray-200'}`}>
                                    <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-32 object-cover" />
                                    {idx === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-xs text-center py-1">
                                            Main Image
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Or Provide Image URL directly</label>
                        <input
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => {
                                setFormData({ ...formData, image_url: e.target.value });
                                if (e.target.value && !formData.images.includes(e.target.value)) {
                                    setFormData(prev => ({ ...prev, images: [...prev.images, e.target.value] }));
                                }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                </div>

            </form>
        </div>
    );
}

