import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/auth.service';
import Button from '../components/Button';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await forgotPassword(email);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
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
                    <div className="text-5xl mb-4">🔒</div>
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Forgot Password?</h1>
                    <p className="text-gray-600">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm text-center font-medium backdrop-blur-sm">{error}</div>}

                {submitted ? (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-medium border border-green-200 backdrop-blur-sm">
                            Check your email! We've sent a recovery link to <strong className="text-gray-900">{email}</strong>.
                        </div>
                        <Link to="/login">
                            <Button variant="primary" className="w-full mt-4 shadow-lg shadow-green-600/30 font-bold">Return to Login</Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-white/60 bg-white/60 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-inner focus:bg-white/80"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                            />
                        </div>

                        <Button type="submit" variant="primary" size="lg" className="w-full shadow-lg shadow-green-600/30 font-bold" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        <p className="text-center mt-6 text-gray-600 font-medium">
                            Remember your password? <Link to="/login" className="text-green-600 font-bold hover:text-green-700 transition-colors">Log in</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
