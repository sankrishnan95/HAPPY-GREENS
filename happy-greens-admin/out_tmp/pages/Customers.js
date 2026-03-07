import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, ExternalLink } from "lucide-react";
import { getCustomers } from "../services/customer.service";
import toast from "react-hot-toast";
export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    fetchCustomers();
  }, []);
  useEffect(() => {
    let filtered = customers;
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = customers.filter(
        (c) => c.name && c.name.toLowerCase().includes(query) || c.email && c.email.toLowerCase().includes(query) || c.phone && c.phone.includes(query)
      );
    }
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "Customers"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "Manage and view registered shoppers.")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-3 w-full sm:w-auto" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search customers...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-gray-50 border-b border-gray-100" }, /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 text-sm font-semibold text-gray-600" }, "Customer"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 text-sm font-semibold text-gray-600" }, "Contact"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 text-sm font-semibold text-gray-600" }, "Joined"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 text-sm font-semibold text-gray-600" }, "Total Orders"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 text-sm font-semibold text-gray-600" }, "Total Spent"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 text-sm font-semibold text-gray-600 text-right" }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-100" }, loading ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "6", className: "px-6 py-12 text-center text-gray-500" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" }))) : filteredCustomers.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "6", className: "px-6 py-12 text-center text-gray-500" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center" }, /* @__PURE__ */ React.createElement(Users, { className: "w-12 h-12 text-gray-300 mb-4" }), /* @__PURE__ */ React.createElement("p", null, "No customers found matching your search.")))) : filteredCustomers.map((customer) => /* @__PURE__ */ React.createElement("tr", { key: customer.id, className: "hover:bg-gray-50 transition-colors" }, /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold" }, customer.name?.charAt(0).toUpperCase() || "C"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-gray-900" }, customer.name || "Unnamed Customer"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "ID: #", customer.id)))), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-900" }, customer.email), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500" }, customer.phone || "No phone")), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 text-sm text-gray-600" }, new Date(customer.created_at).toLocaleDateString()), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" }, customer.total_orders, " orders")), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 font-medium text-gray-900" }, "\u20B9", parseFloat(customer.total_spent).toFixed(2)), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 text-right" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate(`/customers/${customer.id}`),
      className: "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
    },
    "View ",
    /* @__PURE__ */ React.createElement(ExternalLink, { className: "w-4 h-4" })
  )))))))));
}
