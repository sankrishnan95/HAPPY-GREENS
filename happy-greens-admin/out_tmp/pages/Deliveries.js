import { useState, useEffect } from "react";
import { Search, Truck, Package, MapPin, Clock, Plus } from "lucide-react";
import { getDeliveries, updateDeliveryStatus } from "../services/delivery.service";
const DELIVERY_TABS = [
  { label: "All", value: "all", color: "gray" },
  { label: "Pickup Pending", value: "pickup_pending", color: "yellow" },
  { label: "In Transit", value: "in_transit", color: "blue" },
  { label: "Out for Delivery", value: "out_for_delivery", color: "purple" },
  { label: "Delivered", value: "delivered", color: "green" },
  { label: "RTO", value: "rto", color: "orange" },
  { label: "Lost", value: "lost", color: "red" }
];
const STATUS_COLORS = {
  pickup_pending: "bg-yellow-100 text-yellow-800",
  in_transit: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  rto: "bg-orange-100 text-orange-800",
  lost: "bg-red-100 text-red-800"
};
export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  useEffect(() => {
    loadDeliveries();
  }, [activeTab]);
  useEffect(() => {
    filterDeliveries();
  }, [searchTerm, deliveries]);
  const loadDeliveries = async () => {
    try {
      console.log("\u{1F504} Loading deliveries with status:", activeTab);
      const response = await getDeliveries(activeTab);
      console.log("\u2705 Deliveries loaded:", response.data.length);
      setDeliveries(response.data || []);
    } catch (error) {
      console.error("\u274C Error loading deliveries:", error);
    } finally {
      setLoading(false);
    }
  };
  const filterDeliveries = () => {
    let filtered = deliveries;
    if (searchTerm) {
      filtered = filtered.filter(
        (delivery) => delivery.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) || delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || delivery.order_number?.toString().includes(searchTerm)
      );
    }
    setFilteredDeliveries(filtered);
  };
  const handleStatusUpdate = async (deliveryId, newStatus) => {
    const notes = prompt(`Update delivery to ${newStatus}.
Add notes (optional):`);
    if (notes === null) return;
    try {
      console.log(`\u{1F504} Updating delivery ${deliveryId} to ${newStatus}`);
      const response = await updateDeliveryStatus(deliveryId, newStatus, notes);
      console.log("\u2705 Delivery status updated:", response.data);
      loadDeliveries();
      alert(`Delivery status updated to ${newStatus}`);
    } catch (error) {
      console.error("\u274C Error updating delivery status:", error);
      alert("Failed to update delivery status");
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };
  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center h-64" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "mb-8 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-900" }, "Delivery Control Center"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mt-2" }, "Track and manage deliveries"))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "border-b border-gray-200" }, /* @__PURE__ */ React.createElement("nav", { className: "flex -mb-px overflow-x-auto" }, DELIVERY_TABS.map((tab) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: tab.value,
      onClick: () => setActiveTab(tab.value),
      className: `px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.value ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`
    },
    tab.label,
    activeTab === tab.value && deliveries.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "ml-2 px-2 py-1 text-xs rounded-full bg-primary text-white" }, deliveries.length)
  ))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search by tracking number, customer name, or order ID...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "min-w-full divide-y divide-gray-200" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Tracking"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Order"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Customer"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Courier"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Status"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, "Estimated Delivery"))), /* @__PURE__ */ React.createElement("tbody", { className: "bg-white divide-y divide-gray-200" }, filteredDeliveries.map((delivery) => /* @__PURE__ */ React.createElement("tr", { key: delivery.id, className: "hover:bg-gray-50 transition-colors" }, /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center" }, /* @__PURE__ */ React.createElement(Package, { className: "w-5 h-5 text-primary mr-2" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium text-gray-900" }, delivery.tracking_number), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, "ID: ", delivery.id)))), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium text-gray-900" }, "Order #", delivery.order_number), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, "\u20B9", parseFloat(delivery.total_amount).toFixed(2))), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium text-gray-900" }, delivery.customer_name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 flex items-center" }, /* @__PURE__ */ React.createElement(MapPin, { className: "w-3 h-3 mr-1" }), delivery.delivery_address?.substring(0, 30), "...")), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center" }, /* @__PURE__ */ React.createElement(Truck, { className: "w-4 h-4 text-gray-400 mr-2" }), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-900" }, delivery.courier_name || "Not assigned"))), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      value: delivery.delivery_status,
      onChange: (e) => handleStatusUpdate(delivery.id, e.target.value),
      className: `px-3 py-1 text-xs font-semibold rounded-full cursor-pointer border-0 ${getStatusColor(delivery.delivery_status)}`
    },
    /* @__PURE__ */ React.createElement("option", { value: "pickup_pending" }, "Pickup Pending"),
    /* @__PURE__ */ React.createElement("option", { value: "in_transit" }, "In Transit"),
    /* @__PURE__ */ React.createElement("option", { value: "out_for_delivery" }, "Out for Delivery"),
    /* @__PURE__ */ React.createElement("option", { value: "delivered" }, "Delivered"),
    /* @__PURE__ */ React.createElement("option", { value: "rto" }, "RTO"),
    /* @__PURE__ */ React.createElement("option", { value: "lost" }, "Lost")
  )), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 whitespace-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center text-sm text-gray-500" }, /* @__PURE__ */ React.createElement(Clock, { className: "w-4 h-4 mr-1" }), formatDate(delivery.estimated_delivery)), delivery.actual_delivery && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-green-600 mt-1" }, "Delivered: ", formatDate(delivery.actual_delivery))))))))), filteredDeliveries.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-center py-12 bg-white rounded-lg shadow mt-6" }, /* @__PURE__ */ React.createElement(Truck, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500" }, "No deliveries found"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mt-2" }, activeTab !== "all" ? `No ${activeTab.replace("_", " ")} deliveries` : "Try adjusting your search")));
}
