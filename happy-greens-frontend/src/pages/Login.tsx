import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { login, googleLogin } from '../services/auth.service';
import { GoogleLogin } from '@react-oauth/google';
import Button from '../components/Button';
import { ArrowLeft } from 'lucide-react';
import { getNativeGoogleSignInErrorMessage, initializeNativeGoogleSignIn, isNativeGoogleSignInAvailable, signInWithNativeGoogle } from '../services/nativeGoogleAuth.service';

const Login = () => {
    const navigate = useNavigate();
    const { user, setUser } = useStore((state) => ({ user: state.user, setUser: state.setUser }));
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const showNativeGoogleLogin = isNativeGoogleSignInAvailable();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!showNativeGoogleLogin) return;

        initializeNativeGoogleSignIn().catch((err) => {
            console.error('Native Google sign-in initialization failed', err);
        });
    }, [showNativeGoogleLogin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(formData);
            setUser(data.user, data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setError('');
        setLoading(true);
        try {
            const data = await googleLogin(credentialResponse.credential);
            setUser(data.user, data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleNativeGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const idToken = await signInWithNativeGoogle();
            const data = await googleLogin(idToken);
            setUser(data.user, data.token);
            navigate('/');
        } catch (err: any) {
            setError(err?.response?.data?.message || getNativeGoogleSignInErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
            {/* Background image */}
            <img
                src="/storefront-login-bg.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Light overlay for readability */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />

            {/* Back to Home Button */}
            <Link 
                to="/" 
                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors bg-white/60 hover:bg-white/90 p-2 sm:px-4 sm:py-2 rounded-full backdrop-blur-md border border-white/60 shadow-sm"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Back to Home</span>
            </Link>

            {/* Glassmorphic card */}
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/70 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Sign in to continue shopping</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center font-medium border border-red-200">{error}</div>}

                {showNativeGoogleLogin ? (
                    <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="mb-6 !w-full !border !border-gray-300 !bg-white !text-gray-800 shadow-sm hover:!bg-gray-50"
                        onClick={handleNativeGoogleLogin}
                        isLoading={loading}
                    >
                        <GoogleMark />
                        Continue with Google
                    </Button>
                ) : googleClientId && (
                    <div className="mb-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                        />
                    </div>
                )}

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200/60"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-gray-500 font-medium">
                            {googleClientId ? 'Or continue with' : 'Continue with'}
                        </span>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 border border-white/60 bg-white/60 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-inner focus:bg-white/80"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Password</label>
                            <Link to="/forgot-password" className="text-sm text-green-600 font-semibold hover:text-green-700 transition-colors">Forgot password?</Link>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 border border-white/60 bg-white/60 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-inner focus:bg-white/80"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="********"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full shadow-lg shadow-green-600/30 font-bold"
                        isLoading={loading}
                    >
                        Login
                    </Button>
                </form>

                <p className="text-center mt-8 text-gray-600 font-medium">
                    Don't have an account? <Link to="/register" className="text-green-600 font-bold hover:text-green-700 transition-colors">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

const GoogleMark = () => (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.71 7.18l7.62 5.91c4.45-4.1 7.13-10.14 7.13-17.56Z" />
        <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.12 1.43-4.84 2.28-8.28 2.28-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
);

export default Login;

