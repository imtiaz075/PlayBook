import React, { useState } from 'react';
import {
  ShieldCheck,
  Cloud,
  Laptop,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, isLoggingIn, currentUser, logout } = useAuth();
  const { setActivePage } = useApp();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      setActivePage('dashboard');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed before completing. Please try again.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignorable
      } else {
        setErrorMsg(err?.message || 'Failed to authenticate with Google. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="md:col-span-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glow / backdrop decor */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles size={14} />
              <span>Multi-Device Workspace Sync</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              PlayBook <span className="text-indigo-400">Workspace</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Your complete freelancer operating system. Track billable hours, manage client contracts, meet countdown deadlines, and keep financial records in one unified command center.
            </p>

            {/* Benefit bullets */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300 mt-0.5">
                  <Database size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Unique User ID Cloud Storage</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your personal history, clients, tasks, and timers are securely partitioned to your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-emerald-300 mt-0.5">
                  <Cloud size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Seamless Cross-Device Access</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Switch between your work laptop, home desktop, or tablet. Your data syncs automatically in real time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-300 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Encrypted Google OAuth 2.0</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zero-password authentication backed by Google security infrastructure and strict database security rules.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Device Sync Visual Indicator */}
          <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Laptop size={14} className="text-slate-400" />
              <span>Laptop</span>
              <span className="text-indigo-400 font-bold">⇄</span>
              <Smartphone size={14} className="text-slate-400" />
              <span>Mobile</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 size={13} />
              <span>Instant sync active</span>
            </div>
          </div>
        </div>

        {/* Right Side: Sign-In Box */}
        <div className="md:col-span-5 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-sm w-full mx-auto">
            {currentUser ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-indigo-600 shadow-md">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xl">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} />
                    <span>Signed In</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-2">
                    {currentUser.displayName || 'Freelancer'}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Unique User ID:</span>
                    <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                      {currentUser.uid.substring(0, 12)}...
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Database Status:</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Connected & Synced
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setActivePage('dashboard')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    onClick={() => logout()}
                    className="w-full py-2 px-4 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    Sign Out of Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                    <Lock size={22} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Secure Account Login
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in with your Google account to automatically back up and restore your personal data across any browser or device.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Professional "Sign in with Google" Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm transition-all duration-200 hover:shadow hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {isLoggingIn ? (
                    <RefreshCw size={18} className="animate-spin text-indigo-600" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  )}
                  <span>{isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>

                {/* Security badges */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                    <span>Protected by Google Authentication & SSL</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Cloud size={13} className="text-indigo-600 shrink-0" />
                    <span>Personal records sync to your account UID</span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-400">
                    Authentication is required to securely access workspace records.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
