import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { Search, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { getProducts, deleteProduct, updateProductStatus, updateProduct, getCategories, bulkUpdateProductCategory } from '../services/product.service';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProductsAndCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, categoryFilter, products]);

  const loadProductsAndCategories = async () => {
    try {
      const fetchAllProducts = async () => {
        const pageSize = 100;
        const firstPage = await getProducts({ limit: pageSize, page: 1 });
        const totalPages = firstPage.data.totalPages || 1;
        const allProducts = [...(firstPage.data.products || [])];

        if (totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              getProducts({ limit: pageSize, page: index + 2 })
            )
          );
          remainingPages.forEach((response) => {
            allProducts.push(...(response.data.products || []));
          });
        }

        return allProducts;
      };

      const [productsResponse, categoriesResponse] = await Promise.all([
        fetchAllProducts(),
        getCategories()
      ]);

      setProducts(productsResponse);
      setCategories((categoriesResponse.data || []).map((category) => ({
        id: category.id,
        name: category.name
      })));
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category_id === parseInt(categoryFilter));
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    setSelectedProductIds((current) => current.filter((id) => filteredProducts.some((product) => product.id === id)));
  }, [filteredProducts]);

  const handleCreateProduct = () => {
    navigate('/products/edit/new');
  };

  const handleEditProduct = (product) => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteProduct(id);
      alert('Product deleted successfully');
      loadProductsAndCategories();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleUpdateStock = async (id, currentStock) => {
    const newStock = prompt(`Update stock for product ID ${id}:\nCurrent stock: ${currentStock}`, currentStock);
    if (newStock === null || newStock === currentStock.toString()) return;

    try {
      await updateProduct(id, { stock_quantity: parseInt(newStock) });
      alert('Stock updated successfully');
      loadProductsAndCategories();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredProducts.map((product) => product.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.includes(id));
    setSelectedProductIds(allSelected ? [] : visibleIds);
  };

  const handleBulkCategoryUpdate = async () => {
    if (selectedProductIds.length === 0) {
      alert('Select products first');
      return;
    }
    if (!bulkCategoryId) {
      alert('Select a category');
      return;
    }

    setBulkUpdating(true);
    try {
      await bulkUpdateProductCategory(selectedProductIds, bulkCategoryId);
      setSelectedProductIds([]);
      setBulkCategoryId('');
      await loadProductsAndCategories();
      alert('Category updated successfully');
    } catch (error) {
      console.error('Error updating product categories:', error);
      alert(error.response?.data?.message || 'Failed to update categories');
    } finally {
      setBulkUpdating(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const getUnitLabel = (unit) => {
    switch (String(unit || '').toUpperCase()) {
      case 'GRAM': return 'kg';
      case 'LITRE': return 'litre';
      case 'DOZEN': return 'dozen';
      default: return 'piece';
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await updateProductStatus(productId, !currentStatus);
      loadProductsAndCategories();
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Failed to update product status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products & Inventory</h1>
          <p className="mt-2 text-gray-600">Manage products and monitor stock levels</p>
        </div>
        <button
          onClick={handleCreateProduct}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-700 sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {selectedProductIds.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-green-100 bg-green-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-green-800">
              {selectedProductIds.length} product{selectedProductIds.length === 1 ? '' : 's'} selected
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                className="min-h-[40px] rounded-lg border border-green-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Add category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkCategoryUpdate}
                disabled={bulkUpdating || !bulkCategoryId}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {bulkUpdating ? 'Updating...' : 'Apply'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] divide-y divide-gray-200 lg:min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && filteredProducts.every((product) => selectedProductIds.includes(product.id))}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity);
                return (
                  <tr key={product.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          {product.images?.length > 0 || product.image_url ? (
                            <img
                              src={product.images?.length > 0 ? product.images[0] : product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="absolute inset-0 flex items-center justify-center bg-gray-100"
                            style={{ display: product.images?.length > 0 || product.image_url ? 'none' : 'flex' }}
                          >
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.description?.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{product.category_name}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {product.discountPrice ? (
                        <>
                          <div className="text-sm font-semibold text-gray-400 line-through">
                            {formatCurrency(product.price)}
                          </div>
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(product.discountPrice)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(product.price)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        per {getUnitLabel(product.unit)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => handleUpdateStock(product.id, product.stock_quantity)}
                        className="min-h-[44px] text-sm font-medium text-primary hover:text-primary-700"
                      >
                        {product.stock_quantity} in stock
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                        <button
                          onClick={() => toggleProductStatus(product.id, product.isActive)}
                          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold transition-colors ${product.isActive ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="flex min-h-[44px] items-center gap-1 rounded px-2 py-1 text-primary transition-colors hover:bg-primary-50 hover:text-primary-700"
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="flex min-h-[44px] items-center gap-1 rounded px-2 py-1 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
