import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { register, googleLogin } from '../services/auth.service';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

const Register = () => {
    const navigate = useNavigate();
    const setUser = useStore((state) => state.setUser);
    const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await register(formData);
            setUser(data.user, data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const data = await googleLogin(credentialResponse.credential);
            setUser(data.user, data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google registration failed');
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
            {/* Light overlay */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />

            {/* Back to Home Button */}
            <Link 
                to="/" 
                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors bg-white/60 hover:bg-white/90 p-2 sm:px-4 sm:py-2 rounded-full backdrop-blur-md border border-white/60 shadow-sm"
            >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Back to Home</span>
            </Link>

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl">
                <h1 className="text-3xl font-display font-bold mb-6 text-center text-gray-900">Create Account</h1>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-200">{error}</div>}

                {googleClientId && (
                    <div className="mb-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Registration Failed')}
                            text="signup_with"
                        />
                    </div>
                )}

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200/60"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-gray-500 font-medium">
                            {googleClientId ? 'Or sign up with email' : 'Sign up with email'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-white/60 bg-white/60 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-inner focus:bg-white/80"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-white/60 bg-white/60 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-inner focus:bg-white/80"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-white/60 bg-white/60 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-inner focus:bg-white/80"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full shadow-lg shadow-green-600/30 font-bold"
                    >
                        Sign Up
                    </Button>
                </form>

                <p className="text-center mt-6 text-gray-600 font-medium">
                    Already have an account? <Link to="/login" className="text-green-600 font-bold hover:text-green-700 transition-colors">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
