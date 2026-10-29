import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthWelcomeOverlay: React.FC = () => {
  const { loginWithGoogle, loginWithGoogleRedirect, isLoggingIn } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (localSubmitting || isLoggingIn) return;
    setAuthError(null);
    setErrorDetails(null);
    setShowRedirectOption(false);
    setLocalSubmitting(true);

    try {
      await loginWithGoogle();
      // On success, AuthProvider updates currentUser, causing this overlay to unmount automatically
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completion. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('The Google sign-in popup was blocked by your browser.');
        setErrorDetails(
          'Please allow popups for this site in your browser address bar, or use the direct page redirect option below.'
        );
        setShowRedirectOption(true);
      } else if (code === 'auth/unauthorized-domain') {
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'current domain';
        setAuthError('Firebase Authorized Domain Notice: Domain not authorized in Firebase Console.');
        setErrorDetails(
          `Domain "${currentOrigin}" must be added to your Firebase project authorized domains under Authentication > Settings > Authorized Domains.`
        );
        setShowRedirectOption(true);
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In is disabled for this Firebase project.');
        setErrorDetails('Please enable the Google provider in Firebase Console > Authentication > Sign-in method.');
      } else if (code === 'auth/network-request-failed') {
        setAuthError('Network error connecting to Google servers. Please check your internet connection and try again.');
      } else {
        setAuthError(`Sign-in could not be completed: ${message || code || 'Unknown error'}`);
        setShowRedirectOption(true);
      }
    } finally {
      setLocalSubmitting(false);
    }
  };

  const handleRedirectSignIn = async () => {
    if (localSubmitting || isLoggingIn) return;
    setAuthError(null);
    setErrorDetails(null);
    setLocalSubmitting(true);

    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      console.error('Google Redirect Error:', err);
      setAuthError(`Redirect sign-in error: ${err?.message || 'Unable to redirect'}`);
      setLocalSubmitting(false);
    }
  };

  const isBusy = localSubmitting || isLoggingIn;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-heading"
    >
      {/* Subtle background ambient gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Welcome Card */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-10 flex flex-col items-center text-center">
        {/* App Branding */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-indigo-500/20">
            P
          </div>
          <div className="text-left">
            <span className="font-bold text-white tracking-tight text-lg block leading-none">
              PlayBook
            </span>
            <span className="text-[11px] text-indigo-400 font-medium block mt-1">
              Freelancer Productivity Engine
            </span>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles size={13} />
            <span>Secure Workspace Access</span>
          </div>
          <h1
            id="welcome-heading"
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          >
            Welcome Back
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Sign in to access your personal workspace and manage your work.
          </p>
        </div>

        {/* Error Alert if sign-in fails */}
        {authError && (
          <div className="w-full mb-6 p-4 bg-rose-950/70 border border-rose-800 rounded-xl text-left flex items-start gap-3 text-xs text-rose-200 animate-in fade-in duration-200">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-bold text-white block text-xs">Authentication Notice</span>
              <p className="text-rose-200 text-xs leading-relaxed">{authError}</p>
              {errorDetails && (
                <div className="mt-2 p-2.5 bg-rose-900/40 rounded-lg border border-rose-800/60 font-mono text-[11px] text-rose-300 break-all leading-normal">
                  {errorDetails}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prominent Google Sign-In Button */}
        <div className="w-full space-y-3 mb-8">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-3.5 py-3.5 px-5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm rounded-xl border border-slate-200 shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
          >
            {isBusy ? (
              <RefreshCw size={20} className="animate-spin text-indigo-600 shrink-0" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
            <span className="tracking-wide">
              {isBusy ? 'Connecting to Google...' : 'Sign in with Google'}
            </span>
          </button>

          {/* Fallback Redirect Option if Popup is Blocked or Problematic */}
          {showRedirectOption && (
            <button
              type="button"
              onClick={handleRedirectSignIn}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-900/60 hover:bg-indigo-900/90 text-indigo-200 hover:text-white font-medium text-xs rounded-xl border border-indigo-700/60 transition-colors cursor-pointer"
            >
              <span>Popup Blocked? Try Direct Page Redirect →</span>
            </button>
          )}

          <p className="text-[11px] text-slate-500">
            One-click sign-in using your verified Google credentials.
          </p>
        </div>

        {/* Feature Highlights / Security Pillars */}
        <div className="w-full pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Encrypted</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Google OAuth 2.0</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-800 flex items-start gap-2.5">
            <Cloud size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Cloud Sync</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Private User Partition</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-800 flex items-start gap-2.5">
            <Clock size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Productivity</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Timers & Invoices</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
