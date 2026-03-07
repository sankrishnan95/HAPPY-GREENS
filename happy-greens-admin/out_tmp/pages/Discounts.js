import { useState, useEffect } from "react";
import { Search, Plus, Tag, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from "../services/coupon.service";
export default function Discounts() {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  useEffect(() => {
    loadCoupons();
  }, []);
  useEffect(() => {
    filterCoupons();
  }, [searchTerm, coupons]);
  const loadCoupons = async () => {
    try {
      console.log("\u{1F504} Loading coupons...");
      const response = await getCoupons();
      console.log("\u2705 Coupons loaded:", response.data.length);
      setCoupons(response.data || []);
    } catch (error) {
      console.error("\u274C Error loading coupons:", error);
    } finally {
      setLoading(false);
    }
  };
  const filterCoupons = () => {
    let filtered = coupons;
    if (searchTerm) {
      filtered = filtered.filter(
        (coupon) => coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) || coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCoupons(filtered);
  };
  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setShowModal(true);
  };
  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setShowModal(true);
  };
  const handleDeleteCoupon = async (id) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteCoupon(id);
      alert("Coupon deleted successfully");
      loadCoupons();
    } catch (error) {
      console.error("\u274C Error deleting coupon:", error);
      alert("Failed to delete coupon");
    }
  };
  const handleToggleActive = async (coupon) => {
    try {
      const newActiveState = !coupon.is_active;
      await updateCoupon(coupon.id, { is_active: newActiveState });
      setCoupons(
        (prevCoupons) => prevCoupons.map(
          (c) => c.id === coupon.id ? { ...c, is_active: newActiveState } : c
        )
      );
      alert(`Coupon ${newActiveState ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("\u274C Error toggling coupon:", error);
      alert("Failed to update coupon");
      loadCoupons();
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      dateStyle: "medium"
    });
  };
  const isExpired = (validUntil) => {
    return new Date(validUntil) < /* @__PURE__ */ new Date();
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center h-64" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "mb-8 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-900" }, "Discount Coupons"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mt-2" }, "Create and manage promotional coupons")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleCreateCoupon,
      className: "flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-5 h-5" }),
    "Create Coupon"
  )), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search by code or description...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, filteredCoupons.map((coupon) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: coupon.id,
      className: `bg-white rounded-lg shadow p-6 border-2 ${!coupon.is_active || isExpired(coupon.valid_until) ? "border-gray-200 opacity-60" : "border-primary"}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Tag, { className: "w-5 h-5 text-primary" }), /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-gray-900" }, coupon.code)), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleToggleActive(coupon),
        className: "text-gray-600 hover:text-primary",
        title: coupon.is_active ? "Deactivate" : "Activate"
      },
      coupon.is_active ? /* @__PURE__ */ React.createElement(ToggleRight, { className: "w-6 h-6 text-green-600" }) : /* @__PURE__ */ React.createElement(ToggleLeft, { className: "w-6 h-6 text-gray-400" })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleEditCoupon(coupon),
        className: "text-gray-600 hover:text-primary",
        title: "Edit"
      },
      /* @__PURE__ */ React.createElement(Edit2, { className: "w-5 h-5" })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => handleDeleteCoupon(coupon.id),
        className: "text-gray-600 hover:text-red-600",
        title: "Delete"
      },
      /* @__PURE__ */ React.createElement(Trash2, { className: "w-5 h-5" })
    ))),
    /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 mb-4" }, coupon.description),
    /* @__PURE__ */ React.createElement("div", { className: "space-y-2 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-600" }, "Discount:"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-primary" }, coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `\u20B9${coupon.discount_value}`)), coupon.min_order_amount > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-600" }, "Min Order:"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, "\u20B9", coupon.min_order_amount)), coupon.max_discount_amount && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-600" }, "Max Discount:"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, "\u20B9", coupon.max_discount_amount)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-600" }, "Usage:"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, coupon.used_count, " / ", coupon.usage_limit || "\u221E"))),
    /* @__PURE__ */ React.createElement("div", { className: "border-t pt-4 space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, "Valid: ", formatDate(coupon.valid_from), " - ", formatDate(coupon.valid_until)), isExpired(coupon.valid_until) && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-red-600 font-semibold" }, "EXPIRED"), !coupon.is_active && !isExpired(coupon.valid_until) && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-600 font-semibold" }, "INACTIVE"), coupon.is_active && !isExpired(coupon.valid_until) && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-green-600 font-semibold" }, "ACTIVE"))
  ))), filteredCoupons.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-center py-12 bg-white rounded-lg shadow" }, /* @__PURE__ */ React.createElement(Tag, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500" }, "No coupons found"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-400 mt-2" }, "Create your first coupon to get started")), showModal && /* @__PURE__ */ React.createElement(
    CouponModal,
    {
      coupon: editingCoupon,
      onClose: () => setShowModal(false),
      onSave: () => {
        setShowModal(false);
        loadCoupons();
      }
    }
  ));
}
function CouponModal({ coupon, onClose, onSave }) {
  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    description: coupon?.description || "",
    discount_type: coupon?.discount_type || "percentage",
    discount_value: coupon?.discount_value || "",
    min_order_amount: coupon?.min_order_amount || 0,
    max_discount_amount: coupon?.max_discount_amount || "",
    usage_limit: coupon?.usage_limit || "",
    valid_from: coupon?.valid_from?.split("T")[0] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    valid_until: coupon?.valid_until?.split("T")[0] || ""
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (coupon) {
        await updateCoupon(coupon.id, formData);
        alert("Coupon updated successfully");
      } else {
        await createCoupon(formData);
        alert("Coupon created successfully");
      }
      onSave();
    } catch (error) {
      console.error("\u274C Error saving coupon:", error);
      alert(error.response?.data?.message || "Failed to save coupon");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "p-6 border-b" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-gray-900" }, coupon ? "Edit Coupon" : "Create New Coupon")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "p-6 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Coupon Code *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: formData.code,
      onChange: (e) => setFormData({ ...formData, code: e.target.value.toUpperCase() }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none",
      required: true,
      disabled: !!coupon
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Discount Type *"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: formData.discount_type,
      onChange: (e) => setFormData({ ...formData, discount_type: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none",
      required: true
    },
    /* @__PURE__ */ React.createElement("option", { value: "percentage" }, "Percentage (%)"),
    /* @__PURE__ */ React.createElement("option", { value: "flat" }, "Flat Amount (\u20B9)")
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Description"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: formData.description,
      onChange: (e) => setFormData({ ...formData, description: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none",
      rows: "2"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Discount Value *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: formData.discount_value,
      onChange: (e) => setFormData({ ...formData, discount_value: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none",
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Min Order Amount"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: formData.min_order_amount,
      onChange: (e) => setFormData({ ...formData, min_order_amount: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Max Discount Amount"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.01",
      value: formData.max_discount_amount,
      onChange: (e) => setFormData({ ...formData, max_discount_amount: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Usage Limit"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      value: formData.usage_limit,
      onChange: (e) => setFormData({ ...formData, usage_limit: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none",
      placeholder: "Unlimited"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Valid From *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: formData.valid_from,
      onChange: (e) => setFormData({ ...formData, valid_from: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none",
      required: true
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Valid Until *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: formData.valid_until,
      onChange: (e) => setFormData({ ...formData, valid_until: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none",
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-4 pt-4" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: "flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
    },
    coupon ? "Update Coupon" : "Create Coupon"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
    },
    "Cancel"
  )))));
}
