import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { Search, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { getProducts, deleteProduct, updateProductStatus, updateProduct, getCategories, bulkUpdateProductCategory } from '../services/product.service';

const PRODUCTS_CACHE_KEY = 'admin_products_page_cache_v1';
const PRODUCTS_SCROLL_KEY = 'admin_products_scroll_v1';
const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;
const PRODUCTS_PER_PAGE = 50;
const SEARCH_DEBOUNCE_MS = 250;
const DEBUG_PRODUCTS_PAGE = import.meta.env.DEV;

const readProductsCache = () => {
  try {
    const raw = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > PRODUCTS_CACHE_TTL_MS) {
      sessionStorage.removeItem(PRODUCTS_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(PRODUCTS_CACHE_KEY);
    return null;
  }
};

const writeProductsCache = (payload) => {
  sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
    ...payload,
    savedAt: Date.now()
  }));
};

const readSavedScroll = () => {
  const raw = sessionStorage.getItem(PRODUCTS_SCROLL_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export default function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const restoreScrollRef = useRef(readSavedScroll());
  const didRestoreScrollRef = useRef(false);
  const categoryFilter = searchParams.get('category') || 'all';
  const currentPage = Math.max(1, Number(searchParams.get('page') || 1));

  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';
    setSearchInput(nextSearch);
    setDebouncedSearchTerm(nextSearch);
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const saveScrollPosition = useCallback(() => {
    sessionStorage.setItem(PRODUCTS_SCROLL_KEY, String(window.scrollY));
  }, []);

  const updateQueryParams = useCallback((updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadProductsAndCategories = useCallback(async ({ preferCache = true } = {}) => {
    if (DEBUG_PRODUCTS_PAGE) {
      console.time('admin-products-load');
    }

    try {
      const cached = preferCache ? readProductsCache() : null;
      if (cached) {
        // Reuse the last loaded list when returning from edit to avoid a full refetch and UI jump.
        setProducts(cached.products || []);
        setCategories(cached.categories || []);
        setLoading(false);

        if (DEBUG_PRODUCTS_PAGE) {
          console.debug('[Products] restored cache', {
            productCount: cached.products?.length || 0,
            categoryCount: cached.categories?.length || 0
          });
          console.timeEnd('admin-products-load');
        }
        return;
      }

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

      const normalizedCategories = (categoriesResponse.data || []).map((category) => ({
        id: category.id,
        name: category.name
      }));

      setProducts(productsResponse);
      setCategories(normalizedCategories);
      writeProductsCache({
        products: productsResponse,
        categories: normalizedCategories
      });

      if (DEBUG_PRODUCTS_PAGE) {
        console.debug('[Products] fetched list', {
          productCount: productsResponse.length,
          categoryCount: normalizedCategories.length
        });
      }
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
      if (DEBUG_PRODUCTS_PAGE) {
        console.timeEnd('admin-products-load');
      }
    }
  }, []);

  useEffect(() => {
    loadProductsAndCategories();
  }, [loadProductsAndCategories]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (categoryFilter !== 'all') {
      const selectedCategoryId = parseInt(categoryFilter, 10);
      filtered = filtered.filter((product) => {
        const categoryIds = Array.isArray(product.category_ids) ? product.category_ids.map(Number) : [];
        return product.category_id === selectedCategoryId || categoryIds.includes(selectedCategoryId);
      });
    }

    if (debouncedSearchTerm) {
      const loweredTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(loweredTerm) ||
        product.description?.toLowerCase().includes(loweredTerm)
      );
    }

    return filtered;
  }, [categoryFilter, debouncedSearchTerm, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, safeCurrentPage]);

  useEffect(() => {
    setSelectedProductIds((current) => current.filter((id) => paginatedProducts.some((product) => product.id === id)));
  }, [paginatedProducts]);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      updateQueryParams({ category: categoryFilter, search: searchInput, page: String(safeCurrentPage) });
    }
  }, [categoryFilter, currentPage, safeCurrentPage, searchInput, updateQueryParams]);

  useLayoutEffect(() => {
    if (loading || didRestoreScrollRef.current) return;

    const savedScroll = restoreScrollRef.current;
    if (savedScroll === null) return;

    // Restore scroll after the filtered page slice is rendered so we do not flash at the top first.
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScroll, behavior: 'auto' });
      didRestoreScrollRef.current = true;
      restoreScrollRef.current = null;
      sessionStorage.removeItem(PRODUCTS_SCROLL_KEY);
    });
  }, [loading, paginatedProducts.length]);

  const handleCreateProduct = useCallback(() => {
    saveScrollPosition();
    navigate(`/products/edit/new?${searchParams.toString()}`);
  }, [navigate, saveScrollPosition, searchParams]);

  const handleEditProduct = useCallback((product) => {
    saveScrollPosition();
    navigate(`/products/edit/${product.id}?${searchParams.toString()}`);
  }, [navigate, saveScrollPosition, searchParams]);

  const handlePageChange = useCallback((nextPage) => {
    updateQueryParams({ category: categoryFilter, search: searchInput, page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [categoryFilter, searchInput, updateQueryParams]);

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteProduct(id);
      const nextProducts = products.filter((product) => product.id !== id);
      setProducts(nextProducts);
      writeProductsCache({ products: nextProducts, categories });
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleUpdateStock = async (id, currentStock) => {
    const newStock = prompt(`Update stock for product ID ${id}:\nCurrent stock: ${currentStock}`, currentStock);
    if (newStock === null || newStock === currentStock.toString()) return;

    try {
      const parsedStock = parseInt(newStock, 10);
      await updateProduct(id, { stock_quantity: parsedStock });
      const nextProducts = products.map((product) =>
        product.id === id ? { ...product, stock_quantity: parsedStock } : product
      );
      setProducts(nextProducts);
      writeProductsCache({ products: nextProducts, categories });
      alert('Stock updated successfully');
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
    const visibleIds = paginatedProducts.map((product) => product.id);
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
      await loadProductsAndCategories({ preferCache: false });
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
      const nextProducts = products.map((product) =>
        product.id === productId ? { ...product, isActive: !currentStatus } : product
      );
      setProducts(nextProducts);
      writeProductsCache({ products: nextProducts, categories });
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

  const startIndex = filteredProducts.length === 0 ? 0 : (safeCurrentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const endIndex = filteredProducts.length === 0 ? 0 : (safeCurrentPage - 1) * PRODUCTS_PER_PAGE + paginatedProducts.length;

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
              value={searchInput}
              onChange={(e) => {
                const nextValue = e.target.value;
                setSearchInput(nextValue);
                updateQueryParams({ search: nextValue, category: categoryFilter, page: '1' });
              }}
              className="min-h-[44px] w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => updateQueryParams({ category: e.target.value, search: searchInput, page: '1' })}
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

      <div className="mb-3 text-xs text-gray-400">
        Showing {startIndex}{startIndex > 0 ? `-${endIndex}` : ''} of {filteredProducts.length} filtered products ({products.length} total)
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] divide-y divide-gray-200 lg:min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedProducts.length > 0 && paginatedProducts.every((product) => selectedProductIds.includes(product.id))}
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
              {paginatedProducts.map((product) => {
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow">
          <p className="text-sm text-gray-500">
            Page {safeCurrentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
