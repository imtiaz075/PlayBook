import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Settings as SettingsIcon,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    activePage,
    setActivePage,
    displayCurrency,
    setDisplayCurrency,
    ratesData,
    refreshExchangeRates,
    notifications,
    setNotificationDrawerOpen,
    setSettingsOpen,
  } = useApp();

  const {
    currentUser,
    loginWithGoogle,
    logout,
    isAuthLoading,
    syncStatus,
    lastSyncedAt,
    setShowLoginModal,
  } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    today: 'Today',
    schedule: 'Schedule',
    tasks: 'Tasks',
    time: 'Time Tracker',
    contacts: 'Clients',
    earnings: 'Earnings',
    goals: 'Goals',
    budget: 'Budget',
    reports: 'Reports',
    login: 'Account & Login',
  };

  const availableCurrencies = ['USD', 'USDT', 'EUR', 'GBP', 'PKR', 'INR', 'BDT', 'AED', 'SAR', 'CAD', 'AUD'];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-2.5 bg-white border-b border-slate-200">
      {/* Zone 1: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900 tracking-tight text-base whitespace-nowrap">
            {pageTitles[activePage] || 'Dashboard'}
          </span>
          <span className="text-slate-400 hidden sm:inline">·</span>
          <span className="text-xs text-slate-500 hidden sm:inline whitespace-nowrap">
            PlayBook Workspace
          </span>
        </div>
      </div>

      {/* Zone 2: Cloud Sync Badge, Currency Switcher, Notifications, Settings, Google Auth */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Cloud Sync Status Indicator */}
        {currentUser && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-600"
            title={
              syncStatus === 'syncing'
                ? 'Syncing changes to cloud...'
                : syncStatus === 'synced'
                ? `Saved to database under UID: ${currentUser.uid}. Last synced: ${lastSyncedAt || 'just now'}`
                : 'Offline or syncing error'
            }
          >
            {syncStatus === 'syncing' ? (
              <>
                <RefreshCw size={12} className="animate-spin text-indigo-600 shrink-0" />
                <span className="text-indigo-600 font-semibold">Syncing</span>
              </>
            ) : syncStatus === 'synced' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
                <span className="text-slate-700 font-medium">Cloud Synced</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} className="text-amber-500 shrink-0" />
                <span className="text-amber-700">Sync Warning</span>
              </>
            )}
          </div>
        )}

        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium hidden md:inline">Currency:</span>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 cursor-pointer focus:outline-none"
            aria-label="Display currency"
          >
            {availableCurrencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
          <button
            onClick={() => refreshExchangeRates()}
            className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors ml-0.5"
            title={`Last updated: ${new Date(ratesData.lastUpdated).toLocaleTimeString()}. Click to refresh.`}
          >
            <RefreshCw size={11} />
          </button>
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => setNotificationDrawerOpen(true)}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications and reminders"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="System and profile settings"
        >
          <SettingsIcon size={18} />
        </button>

        {/* Authentication Zone */}
        {currentUser ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title={`Logged in as ${currentUser.displayName || currentUser.email}`}
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()
                )}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden lg:inline max-w-[110px] truncate">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Signed in with Google
                  </span>
                  <p className="font-semibold text-slate-900 truncate mt-0.5">
                    {currentUser.displayName || 'Freelancer'}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px] truncate">
                    {currentUser.email}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>User ID:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {currentUser.uid.substring(0, 10)}...
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setActivePage('login');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <User size={14} className="text-indigo-600" />
                    <span>Account & Cloud Sync Details</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all duration-150 hover:border-slate-400 cursor-pointer"
            title="Sign in with Google to sync your personal data across devices"
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
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
