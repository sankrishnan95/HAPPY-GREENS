import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/auth.service';
import Button from '../components/Button';

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
        <div className="max-w-md mx-auto mt-16">
            <div className="bg-white p-10 rounded-4xl shadow-medium border border-gray-100">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🔒</div>
                    <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Forgot Password?</h1>
                    <p className="text-gray-600">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center font-medium border border-red-200">{error}</div>}

                {submitted ? (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-medium border border-green-200">
                            Check your email! We've sent a recovery link to <strong>{email}</strong>.
                        </div>
                        <Link to="/login">
                            <Button variant="outline" className="w-full mt-4">Return to Login</Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                            />
                        </div>

                        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        <p className="text-center mt-6 text-gray-600">
                            Remember your password? <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">Log in</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
