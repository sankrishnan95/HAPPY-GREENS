import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { login, googleLogin, firebasePhoneLogin } from '../services/auth.service';
import { GoogleLogin } from '@react-oauth/google';
import Button from '../components/Button';
import { Mail, ArrowRight, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { isFirebasePhoneAuthConfigured, requestPhoneOtp } from '../services/firebase.service';
import type { ConfirmationResult } from 'firebase/auth';

const Login = () => {
    const navigate = useNavigate();
    const { user, setUser } = useStore((state) => ({ user: state.user, setUser: state.setUser }));
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await login(formData);
            setUser(data.user, data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const data = await googleLogin(credentialResponse.credential);
            setUser(data.user, data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google login failed');
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (!isFirebasePhoneAuthConfigured()) {
                throw new Error('Firebase phone auth is not configured');
            }

            const normalizedPhone = phone.replace(/\D/g, '');
            if (normalizedPhone.length !== 10) {
                throw new Error('Enter a valid 10-digit phone number');
            }

            const confirmation = await requestPhoneOtp(`+91${normalizedPhone}`);
            setConfirmationResult(confirmation);
            setOtpSent(true);
            toast.success('OTP sent to ' + normalizedPhone);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (!confirmationResult) {
                throw new Error('OTP session expired. Please request a new code.');
            }

            const credential = await confirmationResult.confirm(otp);
            const idToken = await credential.user.getIdToken();
            const data = await firebasePhoneLogin(idToken);
            setUser(data.user, data.token);
            toast.success('Successfully logged in!');
            navigate('/');
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16">
            <div className="bg-white p-10 rounded-4xl shadow-medium border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Sign in to continue shopping</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center font-medium border border-red-200">{error}</div>}

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
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-400">{googleClientId ? 'Or continue with' : 'Continue with'}</span>
                    </div>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
                    <button
                        onClick={() => setLoginMode('email')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${loginMode === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Mail className="w-4 h-4" /> Email
                    </button>
                    <button
                        onClick={() => setLoginMode('phone')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${loginMode === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Smartphone className="w-4 h-4" /> Phone
                    </button>
                </div>

                {loginMode === 'email' ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your@email.com"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-gray-700">Password</label>
                                <Link to="/forgot-password" className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">Forgot password?</Link>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="********"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full shadow-lg shadow-primary-200"
                            isLoading={loading}
                        >
                            Login
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-5">
                        {!otpSent ? (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all font-bold placeholder:font-normal"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="9876543210"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">We'll send you a 6-digit one-time password.</p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter 6-digit OTP</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all text-center text-2xl font-bold tracking-[0.5em]"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setConfirmationResult(null);
                                    }}
                                    className="text-xs text-primary-600 font-bold mt-3 hover:underline"
                                >
                                    Change phone number
                                </button>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full shadow-lg shadow-primary-200"
                            isLoading={loading}
                        >
                            {otpSent ? 'Verify & Login' : 'Send Code'}
                            {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                        </Button>
                    </form>
                )}

                <p className="text-center mt-8 text-gray-600">
                    Don't have an account? <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">Sign up</Link>
                </p>
                <div id="firebase-recaptcha-container"></div>
            </div>
        </div>
    );
};

export default Login;

