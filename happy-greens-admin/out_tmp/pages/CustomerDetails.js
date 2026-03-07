import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag, CreditCard, Clock, CheckCircle, Package } from "lucide-react";
import { getCustomerById } from "../services/customer.service";
import { getOrders } from "../services/order.service";
import toast from "react-hot-toast";
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  placed: "bg-orange-100 text-orange-800",
  accepted: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-red-100 text-red-800"
};
export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchCustomerData();
  }, [id]);
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, ordersRes] = await Promise.all([
        getCustomerById(id),
        getOrders("all", { customerId: id })
      ]);
      setCustomer(customerRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error("Failed to load customer details:", error);
      toast.error("Customer not found");
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex justify-center items-center h-64" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" }));
  }
  if (!customer) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 max-w-6xl mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/customers"),
      className: "p-2 hover:bg-gray-100 rounded-lg transition-colors"
    },
    /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-6 h-6 text-gray-600" })
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "Customer Profile"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "ID: #", customer.id))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1 h-fit" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center text-center pb-6 border-b border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-4xl font-bold mb-4 shadow-inner" }, customer.name?.charAt(0).toUpperCase() || "C"), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-gray-900" }, customer.name || "Unnamed Customer"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "Customer since ", new Date(customer.created_at).toLocaleDateString())), /* @__PURE__ */ React.createElement("div", { className: "pt-6 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 text-gray-600" }, /* @__PURE__ */ React.createElement(Mail, { className: "w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement("a", { href: `mailto:${customer.email}`, className: "hover:text-primary-600" }, customer.email)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 text-gray-600" }, /* @__PURE__ */ React.createElement(Phone, { className: "w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement("a", { href: `tel:${customer.phone}`, className: "hover:text-primary-600" }, customer.phone || "No phone provided"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gray-50 rounded-xl p-4 text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mb-1" }, "Total Orders"), /* @__PURE__ */ React.createElement("p", { className: "text-xl font-bold text-gray-900" }, customer.total_orders)), /* @__PURE__ */ React.createElement("div", { className: "bg-primary-50 rounded-xl p-4 text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-primary-600 mb-1" }, "Total Spent"), /* @__PURE__ */ React.createElement("p", { className: "text-xl font-bold text-primary-700" }, "\u20B9", parseFloat(customer.total_spent).toFixed(2))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2" }, /* @__PURE__ */ React.createElement("div", { className: "p-6 border-b border-gray-100 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-900 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(ShoppingBag, { className: "w-5 h-5 text-primary-600" }), "Order History"), /* @__PURE__ */ React.createElement("span", { className: "bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-xs font-semibold" }, orders.length, " orders found")), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-gray-50 text-sm border-b border-gray-100" }, /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-semibold text-gray-600" }, "Order ID"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-semibold text-gray-600" }, "Date"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-semibold text-gray-600" }, "Items"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-semibold text-gray-600" }, "Total"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-semibold text-gray-600" }, "Status"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-100" }, orders.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "5", className: "px-6 py-12 text-center text-gray-500" }, /* @__PURE__ */ React.createElement(Package, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), /* @__PURE__ */ React.createElement("p", null, "This customer hasn't placed any orders yet."))) : orders.map((order) => /* @__PURE__ */ React.createElement("tr", { key: order.id, className: "hover:bg-gray-50 transition-colors cursor-pointer", onClick: () => navigate(`/orders/${order.id}`) }, /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 font-medium text-primary-600 hover:text-primary-800 hover:underline" }, "#", order.id), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 text-sm text-gray-600" }, new Date(order.created_at).toLocaleDateString()), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 text-sm text-gray-600" }, order.items_count, " items"), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 font-semibold text-gray-900" }, "\u20B9", order.total_amount), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("span", { className: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}` }, order.status))))))))));
}
