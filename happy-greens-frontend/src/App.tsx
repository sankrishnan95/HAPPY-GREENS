import { ReactNode, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useNavigationType, Link } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Navbar from './components/Navbar';
import AndroidIcon from './components/AndroidIcon';
import AndroidStartupIntro from './components/AndroidStartupIntro';
import { ANDROID_APP_DOWNLOAD_URL } from './config/appDownload';
import { Toaster } from 'react-hot-toast';
import { trackPageView } from './services/analytics.service';
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
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const RefundCancellationPolicy = lazy(() => import('./pages/RefundCancellationPolicy'));
const MonitoringDebug = lazy(() => import('./pages/MonitoringDebug'));

const loadingCharacters = ['tomato', 'coffee', 'shampoo'] as const;
type LoadingCharacter = (typeof loadingCharacters)[number];

const RandomStoreCharacter = () => {
    const [character, setCharacter] = useState<LoadingCharacter>(() =>
        loadingCharacters[Math.floor(Math.random() * loadingCharacters.length)],
    );

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setCharacter((current) => {
                const nextCharacters = loadingCharacters.filter((item) => item !== current);
                return nextCharacters[Math.floor(Math.random() * nextCharacters.length)];
            });
        }, 1150);

        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <div className={`delivery-loader__character delivery-loader__character--${character}`} key={character} aria-hidden="true">
            {character === 'tomato' ? (
                <svg viewBox="0 0 100 110" role="presentation">
                    <path className="character-tomato__leaf" d="M49 22C38 9 29 15 36 27c-13-8-19 1-6 10-14 0-13 11 3 12h35c15-3 13-14 0-14 12-11 3-20-9-9 2-15-9-18-15-4Z" />
                    <path className="character-tomato__body" d="M50 28c-10-9-30-7-38 8-13 24-5 59 20 66 9 3 13-2 18-2s10 5 19 2c25-7 33-42 20-66-8-15-28-17-39-8Z" />
                    <ellipse className="character-face__cheek" cx="28" cy="65" rx="7" ry="4" />
                    <ellipse className="character-face__cheek" cx="72" cy="65" rx="7" ry="4" />
                    <ellipse className="character-face__eye" cx="39" cy="54" rx="3.5" ry="5" />
                    <ellipse className="character-face__eye" cx="61" cy="54" rx="3.5" ry="5" />
                    <path className="character-face__smile" d="M40 67q10 12 20 0" />
                    <path className="character-shine" d="M22 43q4-9 12-10" />
                </svg>
            ) : character === 'coffee' ? (
                <svg viewBox="0 0 100 110" role="presentation">
                    <path className="character-coffee__cup" d="M25 27h50l-7 70q-18 9-36 0Z" />
                    <path className="character-coffee__lid" d="M22 22q0-5 6-5h44q6 0 6 5v7H22Z" />
                    <path className="character-coffee__rim" d="M25 29h50v5H25z" />
                    <path className="character-coffee__sleeve" d="M28 49h44l-3 31H31Z" />
                    <circle className="character-coffee__logo" cx="50" cy="63" r="10" />
                    <path className="character-coffee__logo-mark" d="M50 56c-5 0-6 5-3 8l3 3 3-3c3-3 2-8-3-8Zm-1-3h2l1 2h-4z" />
                    <text className="character-coffee__brand" x="50" y="78">STARBUCKS</text>
                    <ellipse className="character-face__eye" cx="42" cy="88" rx="2.8" ry="3.5" />
                    <ellipse className="character-face__eye" cx="57" cy="88" rx="2.8" ry="3.5" />
                    <path className="character-face__smile" d="M45 96q5 5 10 0" />
                    <path className="character-shine" d="m31 38 2 5" />
                </svg>
            ) : (
                <svg viewBox="0 0 100 110" role="presentation">
                    <path className="character-shampoo__cap" d="M40 13h20v12H40zM36 25h28v11H36z" />
                    <path className="character-shampoo__body" d="M35 35q0-5 6-5h18q6 0 6 5v8q11 7 11 19v24q0 9-9 9H33q-9 0-9-9V62q0-12 11-19Z" />
                    <path className="character-shampoo__label" d="M31 55h38v25H31z" />
                    <path className="character-shampoo__flower" d="M50 58c-5-8-11 0-4 4-9-2-9 7 0 6-6 6 1 11 5 4 4 7 11 2 5-4 9 1 9-8 0-6 7-4 1-12-4-4Z" />
                    <ellipse className="character-face__eye" cx="42" cy="88" rx="2.6" ry="3.4" />
                    <ellipse className="character-face__eye" cx="57" cy="88" rx="2.6" ry="3.4" />
                    <path className="character-face__smile" d="M44 96q5 5 10 0" />
                    <path className="character-shine" d="M31 60q1-8 7-11" />
                </svg>
            )}
        </div>
    );
};

const StorefrontLoader = ({ label }: { label?: string }) => (
    <div className="flex flex-col items-center justify-center text-center">
        <div className="delivery-loader" aria-hidden="true">
            <div className="delivery-loader__track" />
            <RandomStoreCharacter />
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
        trackPageView(`${location.pathname}${location.search}`);
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

const NativeBackButtonHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const navigationType = useNavigationType();
    const routeStack = useRef<string[]>([]);
    const currentRoute = `${location.pathname}${location.search}${location.hash}`;

    useEffect(() => {
        const stack = routeStack.current;

        if (stack.length === 0) {
            stack.push(currentRoute);
            return;
        }

        if (navigationType === 'PUSH') {
            if (stack[stack.length - 1] !== currentRoute) stack.push(currentRoute);
            return;
        }

        if (navigationType === 'REPLACE') {
            stack[stack.length - 1] = currentRoute;
            return;
        }

        const previousIndex = stack.lastIndexOf(currentRoute);
        if (previousIndex >= 0) {
            stack.splice(previousIndex + 1);
        } else {
            stack.push(currentRoute);
        }
    }, [currentRoute, navigationType]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let isDisposed = false;
        let listener: { remove: () => Promise<void> } | undefined;

        CapacitorApp.addListener('backButton', () => {
            const stack = routeStack.current;
            if (stack.length > 1) {
                stack.pop();
                navigate(stack[stack.length - 1], { replace: true });
            } else if (location.pathname !== '/') {
                stack[0] = '/';
                navigate('/', { replace: true });
            } else {
                void CapacitorApp.exitApp();
            }
        }).then((handle) => {
            if (isDisposed) {
                void handle.remove();
            } else {
                listener = handle;
            }
        });

        return () => {
            isDisposed = true;
            void listener?.remove();
        };
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
            <NativeBackButtonHandler />
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
                            <Route path="/help-support" element={<HelpSupport />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                            <Route path="/refund-cancellation-policy" element={<RefundCancellationPolicy />} />
                            <Route path="/debug/monitoring" element={<MonitoringDebug />} />
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
                                    {ANDROID_APP_DOWNLOAD_URL && <a href={ANDROID_APP_DOWNLOAD_URL} download="Happy-Greens-Storefront.apk" className="inline-flex items-center gap-2 rounded-full border border-lime-300/50 bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-600"><AndroidIcon className="h-5 w-5" />Download Android app</a>}
                                </div>
                                <p className="text-sm text-white/60 mt-2 sm:mt-4">&copy; 2026 Happy Greens. All rights reserved.</p>
                            </div>
                        </div>
                    </footer>
                    )}
                </div>
        </>
    );
}

function App() {
    return (
        <>
            <Router>
                <BackendReadinessGate>
                    <AppLayout />
                </BackendReadinessGate>
            </Router>
            <AndroidStartupIntro />
        </>
    );
}

export default App;
