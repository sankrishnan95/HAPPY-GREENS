import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Users, AlertTriangle } from "lucide-react";
import StatsCard from "../components/StatsCard";
import { getRevenueMetrics, getOrderMetrics, getCustomerMetrics, getProductMetrics } from "../services/analytics.service";
export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    lowStock: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadDashboardData();
  }, []);
  const loadDashboardData = async () => {
    try {
      const [revenueRes, ordersRes, customersRes, productsRes] = await Promise.all([
        getRevenueMetrics(),
        getOrderMetrics(),
        getCustomerMetrics(),
        getProductMetrics()
      ]);
      const todayRevenue = revenueRes.data.revenue_by_day?.[0]?.revenue || revenueRes.data.total_revenue || 0;
      const todayOrders = ordersRes.data.orders_by_day?.[0]?.count || ordersRes.data.total_orders || 0;
      const lowStockCount = productsRes.data.low_stock_products?.length || 0;
      setStats({
        revenue: todayRevenue,
        orders: todayOrders,
        customers: customersRes.data.total_customers || 0,
        lowStock: lowStockCount
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center h-64" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-900" }, "Dashboard"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mt-2" }, "Welcome to Happy Greens Admin Panel")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" }, /* @__PURE__ */ React.createElement(
    StatsCard,
    {
      title: "Today's Revenue",
      value: `\u20B9${stats.revenue.toFixed(2)}`,
      icon: DollarSign,
      color: "primary",
      trend: "Total revenue today"
    }
  ), /* @__PURE__ */ React.createElement(
    StatsCard,
    {
      title: "Today's Orders",
      value: stats.orders,
      icon: ShoppingBag,
      color: "secondary",
      trend: "Orders placed today"
    }
  ), /* @__PURE__ */ React.createElement(
    StatsCard,
    {
      title: "Total Customers",
      value: stats.customers,
      icon: Users,
      color: "info",
      trend: "Registered customers"
    }
  ), /* @__PURE__ */ React.createElement(
    StatsCard,
    {
      title: "Low Stock Items",
      value: stats.lowStock,
      icon: AlertTriangle,
      color: "warning",
      trend: "Items need reordering"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-gray-900 mb-4" }, "Quick Actions"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" }, /* @__PURE__ */ React.createElement(
    "a",
    {
      href: "/orders",
      className: "p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
    },
    /* @__PURE__ */ React.createElement(ShoppingBag, { className: "w-8 h-8 text-primary mb-2" }),
    /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-gray-900" }, "Manage Orders"),
    /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mt-1" }, "View and process orders")
  ), /* @__PURE__ */ React.createElement(
    "a",
    {
      href: "/products",
      className: "p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
    },
    /* @__PURE__ */ React.createElement(AlertTriangle, { className: "w-8 h-8 text-orange-600 mb-2" }),
    /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-gray-900" }, "Check Inventory"),
    /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mt-1" }, "Monitor stock levels")
  ), /* @__PURE__ */ React.createElement(
    "a",
    {
      href: "/reports",
      className: "p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors"
    },
    /* @__PURE__ */ React.createElement(DollarSign, { className: "w-8 h-8 text-green-600 mb-2" }),
    /* @__PURE__ */ React.createElement("h3", { className: "font-semibold text-gray-900" }, "View Reports"),
    /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mt-1" }, "Analytics and insights")
  ))));
}
