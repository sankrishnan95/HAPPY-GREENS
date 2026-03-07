import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import ProductEdit from "./pages/ProductEdit";
import Deliveries from "./pages/Deliveries";
import Discounts from "./pages/Discounts";
import Banners from "./pages/Banners";
import BannerEdit from "./pages/BannerEdit";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Analytics from "./pages/Analytics";
import OrderDetails from "./pages/OrderDetails";
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return /* @__PURE__ */ React.createElement(BrowserRouter, null, /* @__PURE__ */ React.createElement(Routes, null, /* @__PURE__ */ React.createElement(Route, { path: "/login", element: /* @__PURE__ */ React.createElement(Login, null) }), /* @__PURE__ */ React.createElement(
    Route,
    {
      path: "/",
      element: /* @__PURE__ */ React.createElement(ProtectedRoute, null, /* @__PURE__ */ React.createElement(Layout, null))
    },
    /* @__PURE__ */ React.createElement(Route, { index: true, element: /* @__PURE__ */ React.createElement(Dashboard, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "orders", element: /* @__PURE__ */ React.createElement(Orders, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "orders/:id", element: /* @__PURE__ */ React.createElement(OrderDetails, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "products", element: /* @__PURE__ */ React.createElement(Products, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "products/edit/:id", element: /* @__PURE__ */ React.createElement(ProductEdit, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "deliveries", element: /* @__PURE__ */ React.createElement(Deliveries, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "discounts", element: /* @__PURE__ */ React.createElement(Discounts, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "banners", element: /* @__PURE__ */ React.createElement(Banners, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "banners/edit/:id", element: /* @__PURE__ */ React.createElement(BannerEdit, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "customers", element: /* @__PURE__ */ React.createElement(Customers, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "customers/:id", element: /* @__PURE__ */ React.createElement(CustomerDetails, null) }),
    /* @__PURE__ */ React.createElement(Route, { path: "analytics", element: /* @__PURE__ */ React.createElement(Analytics, null) })
  ), /* @__PURE__ */ React.createElement(Route, { path: "*", element: /* @__PURE__ */ React.createElement(Navigate, { to: "/", replace: true }) })));
}
export default App;
