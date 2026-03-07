import { Printer, Eye, Clock } from "lucide-react";
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  placed: "bg-orange-100 text-orange-800",
  accepted: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800"
};
export default function OrdersTable({ orders, onViewOrder, onPrintInvoice, onStatusUpdate }) {
  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };
  const handleStatusChange = (orderId, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return;
    const notes = prompt(`Update order #${orderId} to ${newStatus}.
Add notes (optional):`);
    if (notes !== null) {
      onStatusUpdate(orderId, newStatus, notes);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "min-w-full divide-y divide-gray-200" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Order ID"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Customer"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Amount"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Payment Method"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Status"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Date"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", { className: "bg-white divide-y divide-gray-200" }, orders.map((order) => /* @__PURE__ */ React.createElement(
    "tr",
    {
      key: order.id,
      className: "hover:bg-gray-50 transition-colors cursor-pointer",
      onClick: () => onViewOrder(order)
    },
    /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline" }, "#", order.id), order.items_count && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, order.items_count, " items")),
    /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium text-gray-900" }, order.customer_name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, order.customer_email)),
    /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-gray-900" }, "\u20B9", parseFloat(order.total_amount).toFixed(2))),
    /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, order.payment_method && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 uppercase border" }, order.payment_method)),
    /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: order.status,
        onChange: (e) => handleStatusChange(order.id, order.status, e.target.value),
        className: `px-3 py-1 text-xs font-semibold rounded-full cursor-pointer border-0 ${getStatusColor(order.status)}`
      },
      /* @__PURE__ */ React.createElement("option", { value: "pending" }, "Pending"),
      /* @__PURE__ */ React.createElement("option", { value: "placed" }, "Placed"),
      /* @__PURE__ */ React.createElement("option", { value: "paid" }, "Paid"),
      /* @__PURE__ */ React.createElement("option", { value: "accepted" }, "Accepted"),
      /* @__PURE__ */ React.createElement("option", { value: "shipped" }, "Shipped"),
      /* @__PURE__ */ React.createElement("option", { value: "delivered" }, "Delivered"),
      /* @__PURE__ */ React.createElement("option", { value: "cancelled" }, "Cancelled")
    )),
    /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center text-sm text-gray-500" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-4 h-4 mr-1" }), formatDate(order.created_at))),
    /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          onViewOrder(order);
        },
        className: "text-primary hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors",
        title: "View Details"
      },
      /* @__PURE__ */ React.createElement(Eye, { className: "w-4 h-4" }),
      "View"
    ), ["paid", "delivered", "placed", "shipped"].includes(order.status) && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: (e) => {
          e.stopPropagation();
          onPrintInvoice(order.id);
        },
        className: "text-green-600 hover:text-green-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors",
        title: "Print Invoice"
      },
      /* @__PURE__ */ React.createElement(Printer, { className: "w-4 h-4" }),
      "Print"
    )))
  ))))));
}
