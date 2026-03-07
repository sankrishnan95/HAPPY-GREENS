import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Mail, Lock, AlertCircle } from "lucide-react";
import { login } from "../services/auth.service";
import { setToken } from "../utils/auth";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      console.log("\u{1F510} Attempting login...");
      const response = await login(email, password);
      console.log("\u2705 Login successful:", response.data);
      console.log("\u{1F3AB} Token received:", response.data.token?.substring(0, 20) + "...");
      setToken(response.data.token);
      console.log("\u{1F4BE} Token saved to localStorage");
      console.log("\u{1F511} Verify token exists:", !!localStorage.getItem("adminToken"));
      navigate("/");
    } catch (err) {
      console.error("\u274C Login failed:", err);
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-primary-50 p-4 rounded-full mb-4" }, /* @__PURE__ */ React.createElement(Leaf, { className: "w-12 h-12 text-primary" })), /* @__PURE__ */ React.createElement("h1", { className: "text-3xl font-bold text-gray-900" }, "Happy Greens"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 mt-2" }, "Admin Dashboard")), error && /* @__PURE__ */ React.createElement("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-red-800" }, error)), /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Email Address"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "email",
      value: email,
      onChange: (e) => setEmail(e.target.value),
      className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition",
      placeholder: "admin@happygreens.com",
      required: true
    }
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-2" }, "Password"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      value: password,
      onChange: (e) => setPassword(e.target.value),
      className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition",
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      required: true
    }
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: loading,
      className: "w-full bg-primary hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    },
    loading ? "Signing in..." : "Sign In"
  )), /* @__PURE__ */ React.createElement("div", { className: "mt-6 text-center" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "Default: admin@happygreens.com / admin123"))));
}
