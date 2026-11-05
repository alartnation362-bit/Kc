import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, ArrowRight, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess
}) => {
  const { login, register, switchRole, loginWithSSO } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  // Sync tab with defaultTab whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setErrorMsg(null);
      setShowAdminPortal(false);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleSSO = async (provider: 'google' | 'apple') => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const defaultEmail = provider === 'google' ? 'alartnation362@gmail.com' : 'investor@icloud.com';
      const defaultName = provider === 'google' ? 'Google Staker' : 'Apple iCloud Staker';
      await loginWithSSO(provider, defaultEmail, defaultName);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to authenticate with ${provider === 'google' ? 'Google' : 'Apple iCloud'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (tab === 'register' && !name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      if (tab === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      if (msg.includes('Unexpected end of JSON') || msg.includes('JSON')) {
        setErrorMsg('Authentication server connection error. Please try again.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoStaker = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await switchRole('user');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize demo session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await switchRole('admin');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize administrator session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 my-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">VaultStake Access Portal</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tab === 'register' ? 'New Staker Registration' : 'Institutional Staking Authentication'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 my-4">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
              setShowAdminPortal(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'login'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
            }`}
          >
            {t('nav.signIn', 'Sign In')}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
              setShowAdminPortal(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'register'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
            }`}
          >
            Create Staker Account
          </button>
        </div>

        {/* Sign In Only: Quick Staker Demo Access (NEVER shown during registration/sign up) */}
        {tab === 'login' && !showAdminPortal && (
          <div className="p-3 mb-4 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400 uppercase font-mono font-semibold tracking-wider">
                Instant Staker Demo
              </span>
              <span className="text-amber-500 dark:text-amber-400 font-mono text-[10px]">1-Click Login</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoStaker}
              className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Alex Morgan (Investor Staker)</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  alex.morgan@crypto.org · Ready with staking portfolio
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}

        {/* Isolated Admin Sign-In Portal (only accessed deliberately when in login mode) */}
        {tab === 'login' && showAdminPortal && (
          <div className="p-3 mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/50 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-800 dark:text-amber-300 font-bold uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Clearance Desk</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAdminPortal(false)}
                className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                Return to Staker Login
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Access restricted to authorized compliance and custody administrators.
            </p>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Elena Rostova (Chief Administrator)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  admin@vaultstake.io · Full administrative controls
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>
        )}

        {/* When tab === 'register', NO admin login or demo boxes are rendered at all! */}
        {tab === 'register' && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">New Investor Account:</span> Enjoy daily returns from 1.0% to 4.2%, non-custodial multi-sig custody, and 100% flexible unstaking anytime.
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google & Apple / iCloud SSO Section */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSSO('google')}
            className="w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSSO('apple')}
            className="w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0 fill-current text-slate-900 dark:text-white" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.9-11.99-14.57-6.02-9.37-10.9-20.09-14.65-32.16-3.75-12.07-5.63-23.36-5.63-33.87 0-14.28 3.51-26.04 10.53-35.29 7.02-9.25 15.72-13.98 26.1-14.21 4.58 0 9.87 1.25 15.87 3.75 6 2.5 9.87 3.8 11.62 3.89 1.52-.09 5.56-1.42 12.11-3.99 6.56-2.58 12.18-3.7 16.88-3.38 12.51.98 22.42 5.69 29.74 14.13-10.99 6.64-16.38 15.77-16.16 27.38.22 9.04 3.66 16.63 10.33 22.78 6.66 6.14 14.54 9.68 23.63 10.63-2.07 6.42-4.57 13.06-7.51 19.92zM119.22 31.86c0-7.39 2.68-14.24 8.04-20.55 5.37-6.31 11.95-10.35 19.74-12.11.87 4.9 1.05 9.47.54 13.71-.87 7.08-3.92 13.44-9.16 19.09-5.23 5.66-11.62 9.25-19.16 10.77-.11-3.7-.11-7.33 0-10.91z" />
            </svg>
            <span>Continue with Apple / iCloud</span>
          </button>
        </div>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] font-mono uppercase text-slate-400">
            or continue with email credentials
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-400 mb-1">
                Full Name / Entity Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Satoshi Nakamoto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
                <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer"
            >
              <span>{tab === 'login' ? 'Sign In to Vault' : 'Initialize Staker Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          {tab === 'register' ? (
            <p className="text-slate-600 dark:text-slate-400 text-center w-full">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg(null);
                }}
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <div className="flex items-center justify-between w-full text-[11px] text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg(null);
                  setShowAdminPortal(false);
                }}
                className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                Need an account? <span className="font-semibold text-amber-600 dark:text-amber-400">Sign Up</span>
              </button>

              {!showAdminPortal && (
                <button
                  type="button"
                  onClick={() => setShowAdminPortal(true)}
                  className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-[10px]"
                >
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>Admin Portal</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
