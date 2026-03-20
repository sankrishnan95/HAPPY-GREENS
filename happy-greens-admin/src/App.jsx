import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import ProductEdit from './pages/ProductEdit';
import Deliveries from './pages/Deliveries';
import Discounts from './pages/Discounts';
import Banners from './pages/Banners';
import BannerEdit from './pages/BannerEdit';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import OrderDetails from './pages/OrderDetails';
import ProtectedRoute from './components/ProtectedRoute';
import SalesAnalytics from './pages/analytics/SalesAnalytics';
import ProductAnalytics from './pages/analytics/ProductAnalytics';
import CustomerAnalytics from './pages/analytics/CustomerAnalytics';
import OrderAnalytics from './pages/analytics/OrderAnalytics';
import InventoryInsights from './pages/analytics/InventoryInsights';
import TrafficAnalytics from './pages/analytics/TrafficAnalytics';

function AdminAuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleExpired = () => {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('admin:auth-expired', handleExpired);
    return () => window.removeEventListener('admin:auth-expired', handleExpired);
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthRedirectHandler />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="products" element={<Products />} />
          <Route path="products/edit/:id" element={<ProductEdit />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="discounts" element={<Discounts />} />
          <Route path="banners" element={<Banners />} />
          <Route path="banners/edit/:id" element={<BannerEdit />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="analytics" element={<Navigate to="/analytics/sales" replace />} />
          <Route path="analytics/sales" element={<SalesAnalytics />} />
          <Route path="analytics/products" element={<ProductAnalytics />} />
          <Route path="analytics/customers" element={<CustomerAnalytics />} />
          <Route path="analytics/orders" element={<OrderAnalytics />} />
          <Route path="analytics/inventory" element={<InventoryInsights />} />
          <Route path="analytics/traffic" element={<TrafficAnalytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
