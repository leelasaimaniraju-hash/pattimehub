import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getFriendlyAuthErrorMessage, AuthErrorInfo } from '../../utils/authErrors';
import { AuthErrorAlert } from '../../components/common/AuthErrorAlert';

export const AdminAccess: React.FC = () => {
  const { currentUser, role, login, loginWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // If already authenticated as admin, jump straight to the dashboard
  useEffect(() => {
    if (!loading && currentUser && role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [currentUser, role, loading, navigate]);

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Wait for auth context to resolve role
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin login error:', err);
      setAuthError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle('admin');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Google admin login error:', err);
      setAuthError(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Top Bar */}
      <header className="relative z-10 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5 text-white group">
          <div className="p-2 bg-indigo-600 rounded-xl group-hover:scale-105 transition-transform shadow-lg shadow-indigo-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block leading-none">
              PART TIME<span className="text-indigo-400 ml-1">HUB</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Admin Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Regular User Sign In
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl mb-2 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Administrator Access
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Secure moderation gateway for platform administration, verification controls, and marketplace oversight.
            </p>
          </div>

          {/* Actionable Error Alert */}
          <AuthErrorAlert
            error={authError}
            onContinueGoogle={handleGoogleAdminLogin}
            showGoogleAlternative={true}
          />

          {/* 1-Click Google Admin Sign In */}
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-white border border-slate-700 rounded-2xl text-xs font-bold transition-all shadow-md hover:border-slate-600 disabled:opacity-50"
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
            <span>Sign in with Google (Admin Email)</span>
          </button>

          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="shrink-0 mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Or Administrator Credentials
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleAdminEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@parttimehub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder:text-slate-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder:text-slate-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating Admin...' : 'Authenticate & Enter Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Notice */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> End-to-End RBAC Protected
            </span>
            <Link to="/" className="text-slate-400 hover:text-slate-200 hover:underline">
              Return Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-4 text-center text-[11px] text-slate-500">
        Part Time Hub • Administrative Security Console • Only authorized emails granted access.
      </footer>
    </div>
  );
};
