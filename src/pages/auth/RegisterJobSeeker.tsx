import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, Mail, Lock, Phone, MapPin, Briefcase, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';

export const RegisterJobSeeker: React.FC = () => {
  const { registerJobSeeker, loginWithGoogle, userLocation, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(userLocation?.city || 'New York, NY');
  const [authError, setAuthError] = useState<{ title: string; message: string; isOperationNotAllowed: boolean } | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (password !== confirmPassword) {
      setAuthError({
        title: 'Password Mismatch',
        message: 'The entered passwords do not match. Please re-enter them.',
        isOperationNotAllowed: false,
      });
      return;
    }

    if (password.length < 6) {
      setAuthError({
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters.',
        isOperationNotAllowed: false,
      });
      return;
    }

    try {
      await registerJobSeeker({
        fullName,
        email,
        pass: password,
        phone,
        city,
        locationName: city,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      });
      navigate('/seeker/dashboard');
    } catch (err: any) {
      console.error('Seeker registration error:', err);
      setAuthError(getFriendlyAuthErrorMessage(err));
    }
  };

  const handleGoogleSignup = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle('jobSeeker');
      navigate('/seeker/dashboard');
    } catch (err: any) {
      console.error('Google signup error:', err);
      setAuthError(getFriendlyAuthErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200">
              <UserCheck className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Seeker Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover part-time jobs nearby and apply instantly
          </p>
        </div>

        {/* Actionable Error Alert */}
        {authError && (
          <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-900 block text-sm">{authError.title}</strong>
                <p className="text-amber-800 mt-1 leading-relaxed">{authError.message}</p>
              </div>
            </div>

            {authError.isOperationNotAllowed && (
              <div className="pt-2 border-t border-amber-200/80 space-y-2">
                <p className="text-[11px] font-semibold text-amber-900">How to fix in Firebase Console:</p>
                <ol className="list-decimal list-inside text-[11px] text-amber-800 space-y-1 pl-1">
                  <li>Open the <strong>Firebase Console</strong> and select your project</li>
                  <li>Navigate to <strong>Authentication &rarr; Sign-in method</strong></li>
                  <li>Click on <strong>Email/Password</strong> and toggle <strong>Enable</strong></li>
                  <li>Click <strong>Save</strong> and return here to register</li>
                </ol>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    Continue with Google Instead
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full mb-4 flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold transition-all shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Register with Google
        </button>

        <div className="relative flex items-center my-5">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="shrink-0 mx-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Or register with Email
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">City / Locality</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="New York, NY"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Register as Job Seeker'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Log In Here
            </Link>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Are you an Employer?{' '}
            <Link to="/register/employer" className="text-indigo-600 font-semibold hover:underline">
              Register Employer Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
