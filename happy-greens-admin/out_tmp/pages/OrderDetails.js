import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, MapPin, Package, CreditCard, Clock, CheckCircle, GitCommitHorizontal, Printer } from "lucide-react";
import { getOrderById, updateOrderStatus, getInvoiceUrl } from "../services/order.service";
import toast, { Toaster } from "react-hot-toast";
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
const STATUS_OPTIONS = [
  "pending",
  "placed",
  "accepted",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];
export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    fetchOrderDetails();
  }, [id]);
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await getOrderById(id);
      setOrder(response.data);
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Order not found");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const notes = window.prompt(`Updating to "${newStatus}". Add a note (optional):`);
    if (notes === null) return;
    try {
      setUpdating(true);
      await updateOrderStatus(id, newStatus, notes || null);
      toast.success(`Order status updated to ${newStatus}`);
      await fetchOrderDetails();
    } catch (error) {
      console.error("Error updating status", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };
  const handlePrintInvoice = async () => {
    try {
      const url = getInvoiceUrl(id, "a4");
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1e3);
          }, 500);
        });
      }
    } catch (error) {
      console.error("\u274C Invoice error:", error);
      toast.error(`Invoice failed: ${error.message}`);
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center h-full" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" }));
  }
  if (!order) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 pb-12" }, /* @__PURE__ */ React.createElement(Toaster, { position: "top-right" }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("button", { onClick: () => navigate("/orders"), className: "p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200" }, /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-6 h-6 text-gray-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "Order #", order.id), /* @__PURE__ */ React.createElement("span", { className: `px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[order.status] || "bg-gray-100"}` }, order.status)), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "Placed on ", new Date(order.created_at).toLocaleString()))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handlePrintInvoice,
      className: "flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Printer, { className: "w-4 h-4" }),
    "Print Invoice"
  ), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      disabled: updating,
      value: order.status,
      onChange: handleStatusChange,
      className: "appearance-none pl-4 pr-10 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors outline-none cursor-pointer disabled:opacity-50"
    },
    STATUS_OPTIONS.map((opt) => /* @__PURE__ */ React.createElement("option", { key: opt, value: opt, className: "text-gray-900 bg-white" }, opt.charAt(0).toUpperCase() + opt.slice(1)))
  ), /* @__PURE__ */ React.createElement(CheckCircle, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" })))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-gray-50 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Package, { className: "w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement("h2", { className: "font-bold text-gray-900" }, "Order Items")), /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-gray-50" }, order.items?.map((item, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "px-6 py-4 flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100" }, /* @__PURE__ */ React.createElement("img", { src: item.image_url || "https://via.placeholder.com/150", alt: item.product_name, className: "w-full h-full object-cover" })), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-900 truncate" }, item.product_name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-0.5" }, "Quantity: ", item.quantity, " ", item.unit || "units")), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-gray-900" }, "\u20B9", item.price * item.quantity), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-0.5" }, "\u20B9", item.price, "/unit"))))), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-6 bg-gray-50 grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "Payment Method"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(CreditCard, { className: "w-4 h-4 text-gray-400" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-gray-900 uppercase" }, order.payment_method))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1 text-right" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, "Subtotal"), /* @__PURE__ */ React.createElement("span", { className: "text-gray-900 font-medium" }, "\u20B9", order.total_amount)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, "Delivery Fee"), /* @__PURE__ */ React.createElement("span", { className: "text-green-600 font-medium" }, "FREE")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-900" }, "Total"), /* @__PURE__ */ React.createElement("span", { className: "text-primary-600" }, "\u20B9", order.total_amount))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-6" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement("h2", { className: "font-bold text-gray-900" }, "Order Timeline")), /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, (order.timeline || []).length > 0 ? order.timeline.map((event, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex gap-4 relative" }, idx !== order.timeline.length - 1 && /* @__PURE__ */ React.createElement("div", { className: "absolute left-2.5 top-6 bottom-[-24px] w-0.5 bg-gray-100" }), /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded-full bg-primary-100 border-4 border-white shadow-sm flex-shrink-0 mt-1 z-10 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-primary-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-gray-900 uppercase tracking-tight" }, event.status), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-0.5" }, new Date(event.created_at).toLocaleString()), event.notes && /* @__PURE__ */ React.createElement("div", { className: "mt-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 text-gray-600 italic" }, '"', event.notes, '"')))) : /* @__PURE__ */ React.createElement("div", { className: "flex gap-4 relative" }, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded-full bg-green-100 border-4 border-white shadow-sm flex-shrink-0 mt-1 z-10 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-1.5 rounded-full bg-green-600" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-gray-900" }, "Order Placed"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-0.5" }, new Date(order.created_at).toLocaleString())))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(User, { className: "w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement("h2", { className: "font-bold text-gray-900" }, "Customer Details")), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold" }, order.customer_name?.charAt(0)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-gray-900" }, order.customer_name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, order.customer_email))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(MapPin, { className: "w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement("h2", { className: "font-bold text-gray-900" }, "Delivery Address")), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-50 p-4 rounded-xl border border-gray-100" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-700 leading-relaxed font-medium" }, order.delivery_address || "No address provided"))))));
}
