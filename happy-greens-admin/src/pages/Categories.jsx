import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, FolderTree, ImagePlus } from 'lucide-react';
import api from '../services/api';
import { uploadImages } from '../services/upload.service';
import { API_BASE_URL } from '../services/api';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', image_url: '', parent_id: '', is_active: true });
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to load categories', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', image_url: '', parent_id: '', is_active: true });
        setEditingId(null);
        setShowForm(false);
        setError('');
    };

    const handleEdit = (cat) => {
        setFormData({ name: cat.name, description: cat.description || '', image_url: cat.image_url || '', parent_id: cat.parent_id || '', is_active: cat.is_active !== false });
        setEditingId(cat.id);
        setShowForm(true);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) { setError('Name is required'); return; }
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/products/categories/${editingId}`, formData);
            } else {
                await api.post('/products/categories', formData);
            }
            resetForm();
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        setError('');
        try {
            const payload = new FormData();
            payload.append('images', file);
            const data = await uploadImages(payload);
            const uploaded = data.images?.[0];
            if (!uploaded) throw new Error('Upload failed');
            const imageUrl = /^https?:\/\//i.test(uploaded) ? uploaded : `${API_BASE_URL}${uploaded}`;
            setFormData((prev) => ({ ...prev, image_url: imageUrl }));
        } catch (err) {
            setError(err.response?.data?.message || 'Image upload failed');
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (cat) => {
        if (!window.confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/products/categories/${cat.id}`);
            fetchCategories();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete');
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
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-600 mt-1">Manage your product categories</p>
                </div>
                {!showForm && (
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus className="w-5 h-5" />
                        Add Category
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Category' : 'New Category'}</h2>
                        <button type="button" onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Fresh Fruits" autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Category (Optional)</label>
                            <select value={formData.parent_id || ''} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none">
                                <option value="">None (Top-level Category)</option>
                                {categories.filter(c => (!editingId || c.id !== editingId)).map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name} {cat.parent_id ? '(Sub)' : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none" placeholder="Short description (optional)" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Image</label>
                            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 sm:flex-row sm:items-center">
                                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Category preview" className="h-full w-full object-contain p-2" />
                                    ) : (
                                        <ImagePlus className="h-7 w-7 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">Used on the storefront homepage.</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <label className="inline-flex cursor-pointer items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                                            {uploadingImage ? 'Uploading...' : 'Upload Image'}
                                            <input type="file" accept="image/*,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                        </label>
                                        {formData.image_url && (
                                            <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="is_active"
                                checked={formData.is_active} 
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} 
                                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">Visible in Storefront</label>
                        </div>
                        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50">
                                <Check className="w-4 h-4" />
                                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                            <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                        </div>
                    </div>
                </form>
            )}

            {categories.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No categories yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first category to organize products</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {categories.filter(c => !c.parent_id).map((cat) => (
                            <CategoryRow 
                                key={cat.id} 
                                category={cat} 
                                allCategories={categories} 
                                onEdit={handleEdit} 
                                onDelete={handleDelete} 
                                depth={0} 
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CategoryRow({ category, allCategories, onEdit, onDelete, depth = 0 }) {
    const children = allCategories.filter(c => c.parent_id === category.id);
    const hasChildren = children.length > 0;

    const toggleActive = async (e) => {
        e.stopPropagation();
        try {
            await api.put(`/products/categories/${category.id}`, {
                ...category,
                is_active: !category.is_active
            });
            window.location.reload(); // Simple way to refresh for now
        } catch (err) {
            alert('Failed to toggle status');
        }
    };

    return (
        <>
            <div className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${depth > 0 ? 'bg-gray-50/30' : ''} ${!category.is_active ? 'opacity-60' : ''}`} style={{ paddingLeft: `${24 + depth * 32}px` }}>
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                    {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="h-full w-full object-contain p-1.5" />
                    ) : (
                        <FolderTree className="h-5 w-5 text-gray-400" />
                    )}
                </div>
                <div className="min-w-0 flex-1 relative">
                    {depth > 0 && (
                        <div className="w-4 h-4 rounded-bl-sm border-b-2 border-l-2 border-gray-300 opacity-40 absolute -ml-6 mt-[-6px]" />
                    )}
                    <div className="flex items-center gap-3">
                        <span className={`font-semibold ${depth === 0 ? 'text-gray-900' : 'text-gray-700'} ${!category.is_active ? 'italic' : ''}`}>{category.name}</span>
                        {!category.is_active && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">Hidden</span>}
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-mono">{category.slug}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        {category.description && <span className="text-sm text-gray-500 truncate">{category.description}</span>}
                        <span className="text-xs text-gray-400">{category.product_count || 0} product{category.product_count !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <button 
                        onClick={toggleActive}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full transition-colors ${category.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        title={category.is_active ? 'Click to hide' : 'Click to show'}
                    >
                        {category.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <div className="flex items-center gap-1.5 border-l border-gray-100 pl-3">
                        <button onClick={() => onEdit(category)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(category)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            {hasChildren && (
                <div className="border-t border-gray-100">
                    {children.map(child => (
                        <CategoryRow 
                            key={child.id} 
                            category={child} 
                            allCategories={allCategories} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            depth={depth + 1} 
                        />
                    ))}
                </div>
            )}
        </>
    );
}
