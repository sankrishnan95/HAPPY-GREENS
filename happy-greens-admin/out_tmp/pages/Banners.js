import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import { getBanners, deleteBanner, updateBanner } from "../services/banner.service";
import toast, { Toaster } from "react-hot-toast";
const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isVideo = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith(".mp4") || lower.endsWith(".webm");
  };
  useEffect(() => {
    fetchBanners();
  }, []);
  const fetchBanners = async () => {
    try {
      const { data } = await getBanners();
      setBanners(data.banners);
    } catch (error) {
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteBanner(id);
      toast.success("Banner deleted successfully");
      fetchBanners();
    } catch (error) {
      toast.error("Failed to delete banner");
    }
  };
  const handleToggleStatus = async (banner) => {
    try {
      await updateBanner(banner.id, {
        is_active: !banner.is_active
      });
      toast.success("Banner status updated");
      fetchBanners();
    } catch (error) {
      toast.error("Failed to update banner status");
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center h-full" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" }));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement(Toaster, { position: "top-right" }), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "Banners"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, "Manage storefront banners and promotions")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/banners/edit/new"),
      className: "flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "w-5 h-5" }),
    "Add Banner"
  )), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-collapse" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "bg-gray-50 border-b border-gray-100 text-gray-500 text-sm" }, /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-medium" }, "Banner"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-medium" }, "Link"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-medium" }, "Order"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-medium" }, "Status"), /* @__PURE__ */ React.createElement("th", { className: "px-6 py-4 font-medium text-right" }, "Actions"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-100" }, banners.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "5", className: "px-6 py-12 text-center text-gray-500" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center" }, /* @__PURE__ */ React.createElement(ImageIcon, { className: "w-12 h-12 text-gray-300 mb-4" }), /* @__PURE__ */ React.createElement("p", null, "No banners found. Add one to get started!")))) : banners.map((banner) => /* @__PURE__ */ React.createElement("tr", { key: banner.id, className: "hover:bg-gray-50 transition-colors" }, /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex-shrink-0 h-16 w-32 rounded overflow-hidden bg-gray-100 relative" }, banner.image_url ? isVideo(banner.image_url) ? /* @__PURE__ */ React.createElement(
    "video",
    {
      src: banner.image_url,
      className: "h-full w-full object-cover",
      autoPlay: true,
      loop: true,
      muted: true,
      playsInline: true
    }
  ) : /* @__PURE__ */ React.createElement(
    "img",
    {
      src: banner.image_url,
      alt: banner.title,
      className: "h-full w-full object-cover"
    }
  ) : /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100" }, /* @__PURE__ */ React.createElement(ImageIcon, { className: "w-6 h-6 text-gray-400" }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-gray-900" }, banner.title)))), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded" }, banner.link || "N/A")), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 text-gray-600" }, banner.display_order), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4 text-gray-600" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleToggleStatus(banner),
      className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${banner.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`
    },
    banner.is_active ? /* @__PURE__ */ React.createElement(CheckCircle, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ React.createElement(XCircle, { className: "w-3.5 h-3.5" }),
    banner.is_active ? "Active" : "Inactive"
  )), /* @__PURE__ */ React.createElement("td", { className: "px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-end gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate(`/banners/edit/${banner.id}`),
      className: "p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors",
      title: "Edit Banner"
    },
    /* @__PURE__ */ React.createElement(Edit2, { className: "w-5 h-5" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleDelete(banner.id),
      className: "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
      title: "Delete Banner"
    },
    /* @__PURE__ */ React.createElement(Trash2, { className: "w-5 h-5" })
  )))))))));
};
export default Banners;
