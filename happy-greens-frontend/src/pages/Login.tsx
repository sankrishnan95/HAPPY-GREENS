import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { login, googleLogin } from '../services/auth.service';
import { GoogleLogin } from '@react-oauth/google';
import Button from '../components/Button';

const Login = () => {
    const navigate = useNavigate();
    const { user, setUser } = useStore((state) => ({ user: state.user, setUser: state.setUser }));
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

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

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
            {/* Background image */}
            <img
                src="/login-bg.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Glassmorphic card */}
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/15 p-10 shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-white/70">Sign in to continue shopping</p>
                </div>

                {error && <div className="bg-red-500/20 border border-red-400/30 text-red-200 p-4 rounded-xl mb-6 text-sm text-center font-medium backdrop-blur-sm">{error}</div>}

                {googleClientId && (
                    <div className="mb-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                        />
                    </div>
                )}

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-white/60 backdrop-blur-sm">{googleClientId ? 'Or continue with' : 'Continue with'}</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all backdrop-blur-sm"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-white/80">Password</label>
                            <Link to="/forgot-password" className="text-sm text-green-300 font-semibold hover:text-green-200 transition-colors">Forgot password?</Link>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all backdrop-blur-sm"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="********"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full shadow-lg shadow-green-900/30"
                        isLoading={loading}
                    >
                        Login
                    </Button>
                </form>

                <p className="text-center mt-8 text-white/70">
                    Don't have an account? <Link to="/register" className="text-green-300 font-semibold hover:text-green-200 transition-colors">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

