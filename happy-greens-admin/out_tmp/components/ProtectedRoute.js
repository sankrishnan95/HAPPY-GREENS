import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return /* @__PURE__ */ React.createElement(Navigate, { to: "/login", replace: true });
  }
  return children;
}
