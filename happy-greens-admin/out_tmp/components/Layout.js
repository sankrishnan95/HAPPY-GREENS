import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
export default function Layout() {
  return /* @__PURE__ */ React.createElement("div", { className: "flex h-screen bg-gray-50" }, /* @__PURE__ */ React.createElement(Sidebar, null), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement(Header, null), /* @__PURE__ */ React.createElement("main", { className: "flex-1 overflow-y-auto p-6" }, /* @__PURE__ */ React.createElement(Outlet, null))));
}
