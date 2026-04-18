import { ReactNode, Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatbotWidget from './components/ChatbotWidget';
import { Toaster } from 'react-hot-toast';
import { trackEvent } from './services/analytics.service';
import { checkBackendHealth } from './services/api';

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
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const RefundCancellationPolicy = lazy(() => import('./pages/RefundCancellationPolicy'));

const StorefrontLoader = ({ label }: { label?: string }) => (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="delivery-loader" aria-hidden="true">
            <div className="delivery-loader__track" />
            <div className="delivery-loader__spark delivery-loader__spark--one" />
            <div className="delivery-loader__spark delivery-loader__spark--two" />
            <div className="delivery-loader__spark delivery-loader__spark--three" />
            <div className="delivery-loader__scooter">
                <div className="delivery-loader__crate">
                    <span className="delivery-loader__veg delivery-loader__veg--leaf" />
                    <span className="delivery-loader__veg delivery-loader__veg--orange" />
                </div>
                <div className="delivery-loader__rider">
                    <span className="delivery-loader__helmet" />
                    <span className="delivery-loader__face" />
                    <span className="delivery-loader__body" />
                    <span className="delivery-loader__arm" />
                    <span className="delivery-loader__scarf" />
                </div>
                <div className="delivery-loader__bike">
                    <span className="delivery-loader__handle" />
                    <span className="delivery-loader__mirror" />
                    <span className="delivery-loader__seat" />
                    <span className="delivery-loader__frame" />
                    <span className="delivery-loader__panel" />
                    <span className="delivery-loader__headlight" />
                    <span className="delivery-loader__fender" />
                    <span className="delivery-loader__exhaust" />
                    <span className="delivery-loader__wheel delivery-loader__wheel--front" />
                    <span className="delivery-loader__wheel delivery-loader__wheel--back" />
                </div>
            </div>
        </div>
        {label ? <p className="mt-4 text-sm font-medium text-slate-600">{label}</p> : null}
    </div>
);

const PageFallback = () => (
    <div className="page-shell flex min-h-[40vh] items-center justify-center">
        <StorefrontLoader label="Packing fresh picks..." />
    </div>
);

const BackendReadinessGate = ({ children }: { children: ReactNode }) => {
    const location = useLocation();
    const [isReady, setIsReady] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const bypassPaths = new Set([
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/privacy-policy',
        '/terms-and-conditions',
        '/refund-cancellation-policy',
    ]);
    const shouldBypass = bypassPaths.has(location.pathname);

    useEffect(() => {
        if (shouldBypass) {
            return;
        }

        let timeoutId: number | undefined;
        let isMounted = true;
        const controller = new AbortController();

        const verifyBackend = async () => {
            try {
                await checkBackendHealth(controller.signal);
                if (isMounted) {
                    setIsReady(true);
                }
            } catch (_) {
                if (isMounted) {
                    setAttempts((current) => current + 1);
                    timeoutId = window.setTimeout(verifyBackend, 2000);
                }
            }
        };

        verifyBackend();

        return () => {
            isMounted = false;
            controller.abort();
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    if (shouldBypass || isReady) {
        return children;
    }

    return (
        <div className="page-shell flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <StorefrontLoader />
            <h1 className="mt-6 text-xl font-semibold text-slate-900">Starting storefront services</h1>
            <p className="mt-2 max-w-md text-sm text-slate-600">
                The backend is waking up. We&apos;ll continue automatically as soon as it&apos;s ready.
            </p>
            {attempts > 2 ? (
                <p className="mt-3 text-xs text-slate-500">Still checking backend readiness. Retrying every 2 seconds.</p>
            ) : null}
        </div>
    );
};

const PageTracker = () => {
    const location = useLocation();

    useEffect(() => {
        trackEvent('page_view', { page: `${location.pathname}${location.search}` });
    }, [location.pathname, location.search]);

    return null;
};

const ScrollToTop = () => {
    const location = useLocation();

    useEffect(() => {
        // Let the Shop page handle its own scroll restoration
        if (location.pathname === '/shop') {
            return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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

const authPaths = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

function AppLayout() {
    const location = useLocation();
    const isAuthPage = authPaths.has(location.pathname);

    return (
        <>
            <ScrollToTop />
            <PageTracker />
            <AuthRedirectHandler />
            <div className="min-h-screen flex flex-col">
                <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
                {!isAuthPage && <Navbar />}
                <main className={isAuthPage ? 'flex-grow w-full' : 'page-shell flex-grow w-full pb-16 sm:pb-24'}>
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
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                            <Route path="/refund-cancellation-policy" element={<RefundCancellationPolicy />} />
                        </Routes>
                    </Suspense>
                </main>
                    {!isAuthPage && (
                    <footer className="bg-gray-800 px-4 py-8 text-white sm:px-6 sm:py-10">
                        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row md:items-start text-center md:text-left">
                            <div className="flex flex-col items-center md:items-start gap-4 max-w-sm">
                                <Link to="/" className="flex items-center gap-3">
                                    <div className="rounded-full bg-white p-1">
                                        <img
                                            src="/logo.png"
                                            alt="Happy Greens"
                                            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <p className="text-xl font-display font-bold leading-none text-white tracking-wide">Happy Greens</p>
                                        <p className="text-xs font-medium text-white/70 mt-1">Groceries in minutes</p>
                                    </div>
                                </Link>
                                <div className="text-sm text-white/80 space-y-1 mt-2">
                                    <p>Contact: <a href="mailto:happygreenspy@gmail.com" className="hover:text-white transition-colors">happygreenspy@gmail.com</a></p>
                                    <p className="leading-relaxed">Address: No 89, Point Care St, Nellithoppe, Puducherry, 605005.</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-4 md:items-end">
                                <div className="flex flex-col items-center gap-3 text-sm text-white/80 md:items-end sm:flex-row sm:gap-6">
                                    <Link to="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</Link>
                                    <Link to="/terms-and-conditions" className="transition-colors hover:text-white">Terms &amp; Conditions</Link>
                                    <Link to="/refund-cancellation-policy" className="transition-colors hover:text-white">Refund Policy</Link>
                                </div>
                                <p className="text-sm text-white/60 mt-2 sm:mt-4">&copy; 2026 Happy Greens. All rights reserved.</p>
                            </div>
                        </div>
                    </footer>
                    )}
                    {!isAuthPage && <ChatbotWidget />}
                </div>
        </>
    );
}

function App() {
    return (
        <Router>
            <BackendReadinessGate>
                <AppLayout />
            </BackendReadinessGate>
        </Router>
    );
}

export default App;
