export default function StatsCard({ title, value, icon: Icon, trend, color = "primary" }) {
  const colorClasses = {
    primary: "bg-primary-50 text-primary-600",
    secondary: "bg-green-50 text-green-600",
    warning: "bg-orange-50 text-orange-600",
    info: "bg-blue-50 text-blue-600"
  };
  return /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg shadow p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium text-gray-600" }, title), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-bold text-gray-900 mt-2" }, value), trend && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 mt-2" }, trend)), /* @__PURE__ */ React.createElement("div", { className: `p-4 rounded-full ${colorClasses[color]}` }, /* @__PURE__ */ React.createElement(Icon, { className: "w-8 h-8" }))));
}
