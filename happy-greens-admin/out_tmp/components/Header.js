import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { removeToken } from "../utils/auth";
export default function Header() {
  const navigate = useNavigate();
  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };
  return /* @__PURE__ */ React.createElement("header", { className: "bg-white border-b border-gray-200 px-6 py-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold text-gray-800" }, "Admin Panel"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "Manage your grocery store")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg" }, /* @__PURE__ */ React.createElement(User, { className: "w-5 h-5 text-gray-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium text-gray-700" }, "Admin")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleLogout,
      className: "flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    },
    /* @__PURE__ */ React.createElement(LogOut, { className: "w-5 h-5" }),
    /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, "Logout")
  ))));
}
