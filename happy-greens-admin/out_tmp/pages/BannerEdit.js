import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Upload, X, ImageIcon } from "lucide-react";
import { getBannerById, createBanner, updateBanner } from "../services/banner.service";
import { uploadImages } from "../services/upload.service";
import toast, { Toaster } from "react-hot-toast";
const BannerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isNew = id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const isVideo = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.startsWith("data:video") || url.startsWith("blob:");
  };
  const [formData, setFormData] = useState({
    title: "",
    subheading: "",
    description: "",
    image_url: "",
    link: "",
    is_active: true,
    display_order: 0
  });
  useEffect(() => {
    if (!isNew) {
      fetchBanner();
    }
  }, [id, isNew]);
  const fetchBanner = async () => {
    try {
      const { data } = await getBannerById(id);
      setFormData({
        title: data.banner.title || "",
        subheading: data.banner.subheading || "",
        description: data.banner.description || "",
        image_url: data.banner.image_url || "",
        link: data.banner.link || "",
        is_active: data.banner.is_active,
        display_order: data.banner.display_order || 0
      });
      setImagePreview(data.banner.image_url);
    } catch (error) {
      toast.error("Failed to fetch banner details");
      navigate("/banners");
    } finally {
      setLoading(false);
    }
  };
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Media size should be less than 20MB");
      return;
    }
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("images", file);
      const blobUrl = URL.createObjectURL(file);
      setImagePreview(blobUrl);
      toast.loading("Uploading image...", { id: "upload" });
      const data = await uploadImages(uploadFormData);
      toast.success("Image uploaded successfully!", { id: "upload" });
      const serverImageUrl = `http://localhost:3000${data.images[0]}`;
      setFormData((prev) => ({ ...prev, image_url: serverImageUrl }));
      setImagePreview(serverImageUrl);
    } catch (error) {
      console.error("Upload Error:", error);
      toast.error("Image upload failed", { id: "upload" });
      setImagePreview(formData.image_url);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      return toast.error("Title is required");
    }
    if (!formData.image_url) {
      return toast.error("An image must be uploaded");
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        display_order: formData.display_order === "" ? 0 : Number(formData.display_order)
      };
      if (isNew) {
        await createBanner(payload);
        toast.success("Banner created successfully");
      } else {
        await updateBanner(id, payload);
        toast.success("Banner updated successfully");
      }
      setTimeout(() => navigate("/banners"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center h-full" }, /* @__PURE__ */ React.createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" }));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto space-y-6 pb-12" }, /* @__PURE__ */ React.createElement(Toaster, { position: "top-right" }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 mb-8" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/banners"),
      className: "p-2 hover:bg-gray-100 rounded-full transition-colors"
    },
    /* @__PURE__ */ React.createElement(ArrowLeft, { className: "w-6 h-6 text-gray-600" })
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, isNew ? "Create New Banner" : "Edit Banner"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mt-1" }, isNew ? "Add a new promotional banner to the storefront" : "Update banner details and image"))), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-900 mb-4 border-b pb-2" }, "Banner Image"), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-2xl h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden relative flex items-center justify-center group transition-colors hover:border-primary-400" }, imagePreview ? /* @__PURE__ */ React.createElement(React.Fragment, null, isVideo(imagePreview) && imagePreview.startsWith("blob:") ? /* @__PURE__ */ React.createElement("video", { src: imagePreview, className: "w-full h-full object-cover", autoPlay: true, loop: true, muted: true, playsInline: true }) : isVideo(imagePreview) && !imagePreview.startsWith("blob:") ? /* @__PURE__ */ React.createElement("video", { src: imagePreview, className: "w-full h-full object-cover", autoPlay: true, loop: true, muted: true, playsInline: true }) : /* @__PURE__ */ React.createElement("img", { src: imagePreview, alt: "Preview", className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => fileInputRef.current?.click(),
      className: "bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
    },
    /* @__PURE__ */ React.createElement(Upload, { className: "w-4 h-4" }),
    " Change Media"
  ))) : /* @__PURE__ */ React.createElement("div", { className: "text-center p-6 flex flex-col items-center cursor-pointer", onClick: () => fileInputRef.current?.click() }, /* @__PURE__ */ React.createElement(ImageIcon, { className: "w-12 h-12 text-gray-300 mb-3" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 font-medium" }, "Click to upload banner media"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, "Recommended: 1200x500px, max 20MB (.jpg, .png, .mp4)")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      ref: fileInputRef,
      className: "hidden",
      accept: "image/*,video/mp4,video/webm",
      onChange: handleImageUpload
    }
  )), imagePreview && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setImagePreview(null);
        setFormData((p) => ({ ...p, image_url: "" }));
      },
      className: "text-red-500 hover:text-red-600 text-sm font-semibold flex items-center gap-1"
    },
    /* @__PURE__ */ React.createElement(X, { className: "w-4 h-4" }),
    " Remove Media"
  )))), /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-gray-900 mb-4 border-b pb-2" }, "Banner Details"), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Banner Title *"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      required: true,
      value: formData.title,
      onChange: (e) => setFormData({ ...formData, title: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
      placeholder: "e.g. Summer Fruit Sale"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Subheading"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: formData.subheading,
      onChange: (e) => setFormData({ ...formData, subheading: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
      placeholder: "e.g. Deal of the Day"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-1" }, "Short text that appears above the main title.")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Description"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: formData.description,
      onChange: (e) => setFormData({ ...formData, description: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none",
      placeholder: "e.g. Limited time offer on fresh exotic fruits and veggies!"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-1" }, "Appears below the main title on the banner.")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Target Link"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: formData.link,
      onChange: (e) => setFormData({ ...formData, link: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
      placeholder: "e.g. /shop?category=fruits"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-1" }, "The URL users go to when they click the banner.")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Display Order"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      value: formData.display_order,
      onChange: (e) => setFormData({ ...formData, display_order: e.target.value }),
      className: "w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 mt-1" }, "Lower numbers show up first (e.g. 0, 1, 2)")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center pt-6" }, /* @__PURE__ */ React.createElement("label", { className: "flex items-center cursor-pointer gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      className: "sr-only",
      checked: formData.is_active,
      onChange: (e) => setFormData({ ...formData, is_active: e.target.checked })
    }
  ), /* @__PURE__ */ React.createElement("div", { className: `block w-14 h-8 rounded-full transition-colors ${formData.is_active ? "bg-green-500" : "bg-gray-300"}` }), /* @__PURE__ */ React.createElement("div", { className: `absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.is_active ? "transform translate-x-6" : ""}` })), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-gray-900" }, formData.is_active ? "Banner is Active" : "Banner is Hidden")))))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-4 pt-4" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => navigate("/banners"),
      className: "px-6 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 cursor-pointer",
      disabled: saving
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: saving,
      className: "px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 flex items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
    },
    /* @__PURE__ */ React.createElement(Save, { className: "w-5 h-5" }),
    saving ? "Saving..." : "Save Banner"
  ))));
};
export default BannerEdit;
