import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  Cloud,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, loginWithGoogle, isLoggingIn } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!showLoginModal) return null;

  const handleSignIn = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      setShowLoginModal(false);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup closed before completion.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Lock size={16} />
            </div>
            <span className="font-bold text-slate-900 text-sm">Account Sign-In</span>
          </div>
          <button
            onClick={() => setShowLoginModal(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-900">
              Sync Across All Your Devices
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with your Google account to automatically store and load your tasks, timers, clients, and invoices securely under your unique user ID.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Professional Google Sign-In Button */}
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm transition-all duration-200 hover:shadow hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:bg-slate-100 disabled:opacity-60 cursor-pointer"
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
            <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <Database size={13} className="text-indigo-600 shrink-0" />
              <span>Data stored under your personal user ID</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
              <span>Security rules protect your documents</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <Cloud size={13} className="text-blue-600 shrink-0" />
              <span>Instant restoration when logging in on other devices</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
