import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import OrdersList from './pages/OrdersList';
import OrderDetail from './pages/OrderDetail';
import Rewards from './pages/Rewards';
import Wishlist from './pages/Wishlist';
import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col">
                <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
                <Navbar />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/orders" element={<OrdersList />} />
                        <Route path="/orders/:id" element={<OrderDetail />} />
                        <Route path="/rewards" element={<Rewards />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                    </Routes>
                </main>
                <footer className="bg-gray-800 text-white py-6 text-center">
                    <p>&copy; 2026 Happy Greens. All rights reserved.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
