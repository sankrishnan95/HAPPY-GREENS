import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/auth.service';
import Button from '../components/Button';
import { ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
                {/* Background image */}
                <img src="/storefront-login-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                {/* Light overlay for readability */}
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
                
                {/* Back to Home Button */}
                <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors bg-white/60 hover:bg-white/90 p-2 sm:px-4 sm:py-2 rounded-full backdrop-blur-md border border-white/60 shadow-sm">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">Back to Home</span>
                </Link>

                <div className="relative z-10 w-full max-w-md bg-white/70 p-10 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl text-center">
                    <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200 backdrop-blur-sm shadow-sm">
                        <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
                        <p className="text-red-700/80">This password reset link is invalid or has expired.</p>
                        <Link to="/forgot-password">
                            <Button variant="primary" className="mt-6 shadow-lg shadow-green-600/30 w-full font-bold">Request New Link</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await resetPassword({ token: token!, password });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
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

            <div className="relative z-10 w-full max-w-md bg-white/70 p-10 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🔐</div>
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Create New Password</h1>
                    <p className="text-gray-600">Please enter your new password below.</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm text-center font-medium backdrop-blur-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-sm text-center font-medium backdrop-blur-sm">Password reset successful! Redirecting to login...</div>}

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 border border-white/60 bg-white/60 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-inner focus:bg-white/80"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 border border-white/60 bg-white/60 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-inner focus:bg-white/80"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        <Button type="submit" variant="primary" size="lg" className="w-full shadow-lg shadow-green-600/30 font-bold" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
