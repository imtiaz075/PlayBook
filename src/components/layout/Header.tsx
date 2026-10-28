import React from 'react';
import {
  Menu,
  Bell,
  Settings as SettingsIcon,
  Play,
  Pause,
  Square,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    activePage,
    activeTimer,
    elapsedSeconds,
    pauseTimer,
    resumeTimer,
    stopTimer,
    startTimer,
    displayCurrency,
    setDisplayCurrency,
    ratesData,
    refreshExchangeRates,
    notifications,
    setNotificationDrawerOpen,
    setSettingsOpen,
  } = useApp();

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
  };

  const availableCurrencies = ['USD', 'USDT', 'EUR', 'GBP', 'PKR', 'INR', 'BDT', 'AED', 'SAR', 'CAD', 'AUD'];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3 bg-white border-b border-slate-200">
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

      {/* Zone 2: Currency Switcher, Notifications, Settings (Timer removed from center) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">Currency:</span>
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
      </div>
    </header>
  );
};
