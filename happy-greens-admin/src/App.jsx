import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Analytics from './pages/Analytics';
import OrderDetails from './pages/OrderDetails';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
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
          <Route path="analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
