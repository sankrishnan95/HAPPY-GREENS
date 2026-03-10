import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { API_BASE_URL } from '../config/api';
import { normalizeImageUrl } from '../utils/image';

const AdminDashboard = () => {
    const { user, token } = useStore();
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '1',
        image_url: ''
    });

    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const res = await axios.get(`${API_BASE_URL}/api/products?limit=100`);
        setProducts(res.data.products);
    };

    const confirmDelete = (id: number) => {
        setProductToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/products/${productToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeleteModalOpen(false);
            setProductToDelete(null);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert('Failed to delete product');
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            stock_quantity: product.stock_quantity,
            category_id: product.category_id || '1',
            image_url: product.image_url || ''
        });
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', price: '', stock_quantity: '', category_id: '1', image_url: '' });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}/api/products/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE_URL}/api/products`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            fetchProducts();
            setFormData({ name: '', description: '', price: '', stock_quantity: '', category_id: '1', image_url: '' });
            setEditingId(null);
        } catch (error) {
            console.error(error);
            alert(editingId ? 'Failed to update product' : 'Failed to create product');
        }
    };

    if (!user || user.role !== 'admin') {
        return <div className="text-center py-20">Access Denied</div>;
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your product inventory</p>
                </div>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAdd}
                >
                    <Plus className="h-5 w-5" /> Add Product
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gradient-soft border-b-2 border-gray-200">
                        <tr>
                            <th className="p-5 font-display font-bold text-gray-900">Product</th>
                            <th className="p-5 font-display font-bold text-gray-900">Price</th>
                            <th className="p-5 font-display font-bold text-gray-900">Stock</th>
                            <th className="p-5 font-display font-bold text-gray-900 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product: any) => (
                            <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-soft p-2 rounded-xl">
                                            <img src={normalizeImageUrl(product.image_url)} alt="" className="w-14 h-14 rounded object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = normalizeImageUrl(null); }} />
                                        </div>
                                        <span className="font-semibold text-gray-900">{product.name}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className="font-bold text-lg text-gray-900">₹{product.price}</span>
                                </td>
                                <td className="p-5">
                                    <Badge
                                        variant={product.stock_quantity === 0 ? 'error' : product.stock_quantity < 10 ? 'warning' : 'success'}
                                        size="md"
                                    >
                                        {product.stock_quantity} units
                                    </Badge>
                                </td>
                                <td className="p-5">
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit product"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(product.id)}
                                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete product"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal for Add Product */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                placeholder="Name"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <input
                                placeholder="Description"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="Price"
                                    type="number"
                                    className="w-full px-4 py-2 border rounded-lg"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                                <input
                                    placeholder="Stock"
                                    type="number"
                                    className="w-full px-4 py-2 border rounded-lg"
                                    value={formData.stock_quantity}
                                    onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                />
                            </div>
                            <input
                                placeholder="Image URL"
                                className="w-full px-4 py-2 border rounded-lg"
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                            />
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">{editingId ? 'Update' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Delete Product?</h2>
                        <p className="text-gray-600 mb-8">This action cannot be undone. Are you sure you want to delete this product?</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;


