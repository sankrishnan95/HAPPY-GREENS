import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { trackEvent } from './services/analytics.service';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const OrdersList = lazy(() => import('./pages/OrdersList'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

const PageFallback = () => (
    <div className="page-shell flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
    </div>
);

const PageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        trackEvent('page_view', { page: `${location.pathname}${location.search}` });
    }, [location.pathname, location.search]);

    return null;
};

const AuthRedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleAuthExpired = () => {
            if (location.pathname !== '/login') {
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('auth:expired', handleAuthExpired);
        return () => window.removeEventListener('auth:expired', handleAuthExpired);
    }, [location.pathname, navigate]);

    return null;
};

function App() {
    return (
        <Router>
            <PageTracker />
            <AuthRedirectHandler />
            <div className="min-h-screen flex flex-col overflow-x-hidden">
                <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
                <Navbar />
                <main className="page-shell flex-grow w-full">
                    <Suspense fallback={<PageFallback />}>
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
                    </Suspense>
                </main>
                <footer className="bg-gray-800 px-4 py-5 text-center text-white sm:px-6 sm:py-6">
                    <p className="text-sm sm:text-base">&copy; 2026 Happy Greens. All rights reserved.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
