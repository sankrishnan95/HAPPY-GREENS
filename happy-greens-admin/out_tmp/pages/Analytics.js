import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp, ShoppingBag, IndianRupee, Users, Filter, MapPin, Globe } from "lucide-react";
import { getDashboardAnalytics } from "../services/analytics.service";
import toast from "react-hot-toast";
const TIME_FILTERS = [
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
  { label: "All Time", value: "all" }
];
export default function Analytics() {
  const [timeFilter, setTimeFilter] = useState("7");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    metrics: {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      avgOrdersPerDay: 0,
      avgSalesPerDay: 0,
      returningCustomerRate: 0,
      daysCalculated: 7
    },
    chartData: [],
    topRegions: []
  });
  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getDashboardAnalytics(timeFilter);
      setData(response.data);
    } catch (error) {
      console.error("Failed to load analytics dashboard", error);
      toast.error("Could not load analytics data");
    } finally {
      setLoading(false);
    }
  };
  const metrics = data.metrics;
  const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
    if (active && payload && payload.length) {
      return /* @__PURE__ */ React.createElement("div", { className: "bg-white p-4 border border-gray-100 shadow-strong rounded-xl" }, /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 text-sm mb-1" }, label), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-900" }, prefix, Number(payload[0].value).toLocaleString()));
    }
    return null;
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-8 pb-8" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "Store Analytics"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "Analyzing data for the ", TIME_FILTERS.find((f) => f.value === timeFilter)?.label.toLowerCase(), ".")), /* @__PURE__ */ React.createElement("div", { className: "relative inline-flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm" }, TIME_FILTERS.map((filter) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: filter.value,
      onClick: () => setTimeFilter(filter.value),
      className: `px-4 py-2 text-sm font-medium rounded-md transition-all ${timeFilter === filter.value ? "bg-primary-50 text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`
    },
    filter.label
  )))), loading ? /* @__PURE__ */ React.createElement("div", { className: "flex justify-center items-center h-64" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-blue-50 text-blue-600 rounded-xl" }, /* @__PURE__ */ React.createElement(ShoppingBag, { className: "w-6 h-6" }))), /* @__PURE__ */ React.createElement("h3", { className: "text-gray-500 text-sm font-medium" }, "Avg Orders Per Day"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-gray-900 mt-2" }, metrics.avgOrdersPerDay.toFixed(1))), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-green-50 text-green-600 rounded-xl" }, /* @__PURE__ */ React.createElement(TrendingUp, { className: "w-6 h-6" }))), /* @__PURE__ */ React.createElement("h3", { className: "text-gray-500 text-sm font-medium" }, "Avg Order Value"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-gray-900 mt-2" }, "\u20B9", metrics.avgOrderValue.toFixed(2))), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-purple-50 text-purple-600 rounded-xl" }, /* @__PURE__ */ React.createElement(IndianRupee, { className: "w-6 h-6" }))), /* @__PURE__ */ React.createElement("h3", { className: "text-gray-500 text-sm font-medium" }, "Avg Sales Per Day"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-gray-900 mt-2" }, "\u20B9", metrics.avgSalesPerDay.toFixed(2))), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-orange-50 text-orange-600 rounded-xl" }, /* @__PURE__ */ React.createElement(Users, { className: "w-6 h-6" }))), /* @__PURE__ */ React.createElement("h3", { className: "text-gray-500 text-sm font-medium" }, "Returning Customers"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-gray-900 mt-2" }, metrics.returningCustomerRate.toFixed(1), "%"))), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-gray-900" }, "Total Orders Over Time"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "Cumulative order volume across ", metrics.daysCalculated, " days: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-900" }, metrics.totalOrders)))), /* @__PURE__ */ React.createElement("div", { className: "h-[300px] w-full" }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /* @__PURE__ */ React.createElement(AreaChart, { data: data.chartData, margin: { top: 10, right: 10, left: -20, bottom: 0 } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "orderGradient", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.3 }), /* @__PURE__ */ React.createElement("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 }))), /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f3f4f6" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "date", axisLine: false, tickLine: false, tick: { fontSize: 12, fill: "#6b7280" }, dy: 10 }), /* @__PURE__ */ React.createElement(YAxis, { axisLine: false, tickLine: false, tick: { fontSize: 12, fill: "#6b7280" } }), /* @__PURE__ */ React.createElement(RechartsTooltip, { content: /* @__PURE__ */ React.createElement(CustomTooltip, null) }), /* @__PURE__ */ React.createElement(Area, { type: "monotone", dataKey: "orders", stroke: "#3b82f6", strokeWidth: 3, fillOpacity: 1, fill: "url(#orderGradient)", activeDot: { r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 } }))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-gray-900" }, "Gross Sales Over Time"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "Total processed revenue: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-900" }, "\u20B9", metrics.totalRevenue.toLocaleString())))), /* @__PURE__ */ React.createElement("div", { className: "h-[300px] w-full" }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: "100%" }, /* @__PURE__ */ React.createElement(AreaChart, { data: data.chartData, margin: { top: 10, right: 10, left: 10, bottom: 0 } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "salesGradient", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "5%", stopColor: "#22c55e", stopOpacity: 0.3 }), /* @__PURE__ */ React.createElement("stop", { offset: "95%", stopColor: "#22c55e", stopOpacity: 0 }))), /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#f3f4f6" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "date", axisLine: false, tickLine: false, tick: { fontSize: 12, fill: "#6b7280" }, dy: 10 }), /* @__PURE__ */ React.createElement(YAxis, { axisLine: false, tickLine: false, tick: { fontSize: 12, fill: "#6b7280" }, tickFormatter: (value) => `\u20B9${value}` }), /* @__PURE__ */ React.createElement(RechartsTooltip, { content: /* @__PURE__ */ React.createElement(CustomTooltip, { prefix: "\u20B9" }) }), /* @__PURE__ */ React.createElement(Area, { type: "monotone", dataKey: "sales", stroke: "#22c55e", strokeWidth: 3, fillOpacity: 1, fill: "url(#salesGradient)", activeDot: { r: 6, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 } }))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-6" }, /* @__PURE__ */ React.createElement(MapPin, { className: "w-5 h-5 text-gray-500" }), /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-gray-900" }, "Sales by Region")), data.topRegions.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-center text-gray-500 py-8" }, "No regional data available yet.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, data.topRegions.map((region, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm" }, idx + 1), /* @__PURE__ */ React.createElement("span", { className: "font-medium text-gray-900 capitalize" }, region.region)), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-900" }, "\u20B9", region.sales.toLocaleString()), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, region.orders, " orders")))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-6" }, /* @__PURE__ */ React.createElement(Globe, { className: "w-5 h-5 text-gray-500" }), /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-gray-900" }, "Traffic Sources")), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, [
    { source: "Direct", val: "45%" },
    { source: "Google Organic", val: "30%" },
    { source: "Instagram Ads", val: "15%" },
    { source: "Facebook", val: "10%" }
  ].map((item, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium text-gray-700" }, item.source), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-900" }, item.val)))), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-4 text-center italic" }, "*Traffic sources are currently simulated placeholders mapping to future integrations.")))));
}
