import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit2, Trash2, Package } from "lucide-react";
import { getProducts, deleteProduct, updateProductStatus, updateProduct } from "../services/product.service";
export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const navigate = useNavigate();
  useEffect(() => {
    loadProducts();
  }, []);
  useEffect(() => {
    filterProducts();
  }, [searchTerm, categoryFilter, products]);
  const loadProducts = async () => {
    try {
      console.log("\u{1F504} Loading products...");
      const response = await getProducts({ limit: 100 });
      console.log("\u2705 Products loaded:", response.data);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("\u274C Error loading products:", error);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };
  const filterProducts = () => {
    let filtered = products;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category_id === parseInt(categoryFilter));
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (product) => product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };
  const handleCreateProduct = () => {
    navigate("/products/edit/new");
  };
  const handleEditProduct = (product) => {
    navigate(`/products/edit/${product.id}`);
  };
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      alert("Product deleted successfully");
      loadProducts();
    } catch (error) {
      console.error("\u274C Error deleting product:", error);
      alert("Failed to delete product");
    }
  };
  const handleUpdateStock = async (id, currentStock) => {
    const newStock = prompt(`Update stock for product ID ${id}:
Current stock: ${currentStock}`, currentStock);
    if (newStock === null || newStock === currentStock.toString()) return;
    try {
      await updateProduct(id, { stock_quantity: parseInt(newStock) });
      alert("Stock updated successfully");
      loadProducts();
    } catch (error) {
      console.error("\u274C Error updating stock:", error);
      alert("Failed to update stock");
    }
  };
  const getStockStatus = (stock) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock < 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };
  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await updateProductStatus(productId, !currentStatus);
      loadProducts();
    } catch (error) {
      console.error("\u274C Error toggling product status:", error);
      alert("Failed to update product status");
    }
  };
  const categories = [...new Map(products.map((p) => [p.category_id, { id: p.category_id, name: p.category_name }])).values()];
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center h-64" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "mb-8 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-900" }, "Products & Inventory"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mt-2" }, "Manage products and monitor stock levels")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCreateProduct,
      className: "flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-5 h-5" }),
    "Add Product"
  )), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search products...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
    }
  )), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: categoryFilter,
      onChange: (e) => setCategoryFilter(e.target.value),
      className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
    },
    /* @__PURE__ */ React.createElement("option", { value: "all" }, "All Categories"),
    categories.map((cat) => /* @__PURE__ */ React.createElement("option", { key: cat.id, value: cat.id }, cat.name))
  ))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "min-w-full divide-y divide-gray-200" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Product"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Category"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Price"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Stock"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Status"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", { className: "bg-white divide-y divide-gray-200" }, filteredProducts.map((product) => {
    const stockStatus = getStockStatus(product.stock_quantity);
    return /* @__PURE__ */ React.createElement("tr", { key: product.id, className: "hover:bg-gray-50 transition-colors" }, /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex-shrink-0 h-12 w-12 rounded overflow-hidden bg-gray-100 relative" }, product.images?.length > 0 || product.image_url ? /* @__PURE__ */ React.createElement(
      "img",
      {
        src: product.images?.length > 0 ? product.images[0] : product.image_url,
        alt: product.name,
        className: "h-full w-full object-cover",
        onError: (e) => {
          e.currentTarget.style.display = "none";
          if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = "flex";
        }
      }
    ) : null, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "absolute inset-0 flex items-center justify-center bg-gray-100",
        style: { display: product.images?.length > 0 || product.image_url ? "none" : "flex" }
      },
      /* @__PURE__ */ React.createElement(Package, { className: "w-6 h-6 text-gray-400" })
    )), /* @__PURE__ */ React.createElement("div", { className: "ml-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium text-gray-900" }, product.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, product.description?.substring(0, 50), "...")))), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-900" }, product.category_name)), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, product.discountPrice ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-gray-400 line-through" }, "\u20B9", parseFloat(product.price).toFixed(2)), /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-green-600" }, "\u20B9", parseFloat(product.discountPrice).toFixed(2))) : /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-gray-900" }, "\u20B9", parseFloat(product.price).toFixed(2)), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, "per ", product.unit || "kg")), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleUpdateStock(product.id, product.stock_quantity),
        className: "text-sm font-medium text-primary hover:text-primary-700"
      },
      product.stock_quantity,
      " ",
      product.unit || "kg"
    )), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 items-start" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}` }, stockStatus.label), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => toggleProductStatus(product.id, product.isActive),
        className: `px-3 py-1 text-xs font-semibold rounded-full border-0 transition-colors ${product.isActive ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"}`
      },
      product.isActive ? "Active" : "Inactive"
    ))), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleEditProduct(product),
        className: "text-primary hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors",
        title: "Edit Product"
      },
      /* @__PURE__ */ React.createElement(Edit2, { className: "w-4 h-4" }),
      "Edit"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleDeleteProduct(product.id, product.name),
        className: "text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors",
        title: "Delete Product"
      },
      /* @__PURE__ */ React.createElement(Trash2, { className: "w-4 h-4" }),
      "Delete"
    ))));
  }))))), filteredProducts.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-center py-12 bg-white rounded-lg shadow mt-6" }, /* @__PURE__ */ React.createElement(Package, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500" }, "No products found"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mt-2" }, "Create your first product to get started")));
}
