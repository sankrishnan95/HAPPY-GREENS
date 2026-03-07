import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Package, Users, AlertTriangle } from "lucide-react";
import { getRevenueMetrics, getProductMetrics, getCustomerMetrics } from "../services/analytics.service";
const COLORS = ["#2d5016", "#4ade80", "#fb923c", "#3b82f6", "#8b5cf6", "#ec4899"];
export default function Reports() {
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadReportsData();
  }, []);
  const loadReportsData = async () => {
    try {
      const [revenueRes, productsRes, customersRes] = await Promise.all([
        getRevenueMetrics(),
        getProductMetrics(),
        getCustomerMetrics()
      ]);
      const revenueByDay = (revenueRes.data.revenue_by_day || []).slice(0, 30).reverse().map((item) => ({
        date: new Date(item.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: parseFloat(item.revenue)
      }));
      const topProds = (productsRes.data.top_products_by_revenue || []).slice(0, 10).map((p) => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name,
        revenue: parseFloat(p.total_revenue)
      }));
      const topCusts = (customersRes.data.top_customers || []).slice(0, 10);
      const lowStock = productsRes.data.low_stock_products || [];
      const categoryPerf = {};
      (productsRes.data.category_performance || []).forEach((cat) => {
        categoryPerf[cat.category_name] = parseFloat(cat.total_revenue);
      });
      const catData = Object.entries(categoryPerf).map(([name, value]) => ({
        name,
        value
      }));
      setRevenueData(revenueByDay);
      setTopProducts(topProds);
      setTopCustomers(topCusts);
      setLowStockProducts(lowStock);
      setCategoryData(catData);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center h-64" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-900" }, "Reports & Analytics"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mt-2" }, "Business insights and performance metrics")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(TrendingUp, { className: "w-5 h-5 text-primary" }), /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-900" }, "Revenue Trend (Last 30 Days)")), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(LineChart, { data: revenueData }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "date" }), /* @__PURE__ */ React.createElement(YAxis, null), /* @__PURE__ */ React.createElement(Tooltip, { formatter: (value) => `\u20B9${value.toFixed(2)}` }), /* @__PURE__ */ React.createElement(Legend, null), /* @__PURE__ */ React.createElement(Line, { type: "monotone", dataKey: "revenue", stroke: "#2d5016", strokeWidth: 2 })))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(Package, { className: "w-5 h-5 text-primary" }), /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-900" }, "Top Products by Revenue")), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(BarChart, { data: topProducts }, /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "name", angle: -45, textAnchor: "end", height: 100 }), /* @__PURE__ */ React.createElement(YAxis, null), /* @__PURE__ */ React.createElement(Tooltip, { formatter: (value) => `\u20B9${value.toFixed(2)}` }), /* @__PURE__ */ React.createElement(Bar, { dataKey: "revenue", fill: "#2d5016" }))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(Package, { className: "w-5 h-5 text-primary" }), /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-900" }, "Category Performance")), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 300 }, /* @__PURE__ */ React.createElement(PieChart, null, /* @__PURE__ */ React.createElement(
    Pie,
    {
      data: categoryData,
      cx: "50%",
      cy: "50%",
      labelLine: false,
      label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`,
      outerRadius: 80,
      fill: "#8884d8",
      dataKey: "value"
    },
    categoryData.map((entry, index) => /* @__PURE__ */ React.createElement(Cell, { key: `cell-${index}`, fill: COLORS[index % COLORS.length] }))
  ), /* @__PURE__ */ React.createElement(Tooltip, { formatter: (value) => `\u20B9${value.toFixed(2)}` })))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(Users, { className: "w-5 h-5 text-primary" }), /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-900" }, "Top Customers")), /* @__PURE__ */ React.createElement("div", { className: "overflow-auto max-h-[300px]" }, /* @__PURE__ */ React.createElement("table", { className: "min-w-full" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50 sticky top-0" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase" }, "Customer"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase" }, "Orders"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase" }, "Total Spent"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-200" }, topCustomers.map((customer, index) => /* @__PURE__ */ React.createElement("tr", { key: index }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-sm text-gray-900" }, customer.full_name), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-sm text-gray-900" }, customer.total_orders), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-sm text-gray-900" }, "\u20B9", parseFloat(customer.total_spent).toFixed(2))))))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-5 h-5 text-orange-600" }), /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-900" }, "Low Stock Alerts")), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "min-w-full divide-y divide-gray-200" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" }, "Product"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" }, "Category"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" }, "Stock"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" }, "Status"))), /* @__PURE__ */ React.createElement("tbody", { className: "bg-white divide-y divide-gray-200" }, lowStockProducts.map((product, index) => /* @__PURE__ */ React.createElement("tr", { key: index }, /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" }, product.name), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500" }, product.category_name), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900" }, product.stock_quantity), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800" }, "Low Stock")))))), lowStockProducts.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-center py-8" }, /* @__PURE__ */ React.createElement("p", { className: "text-gray-500" }, "No low stock items")))));
}
