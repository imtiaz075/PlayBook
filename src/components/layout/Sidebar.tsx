import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  Timer,
  Users,
  DollarSign,
  Target,
  PieChart,
  FileBarChart,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  LogIn,
  Cloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { activePage, setActivePage, tasks, schedules, setQuickAddOpen } = useApp();
  const { currentUser, setShowLoginModal } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  // Counts for badges
  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && t.deadline < todayStr
  ).length;

  const todayScheduleCount = schedules.filter(
    (s) => s.date === todayStr && !s.isCompleted
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'today',
      label: 'Today',
      icon: CalendarCheck,
      badge: todayScheduleCount > 0 ? todayScheduleCount : undefined,
      isSpecial: true,
    },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'time', label: 'Time Tracker', icon: Timer },
    { id: 'contacts', label: 'Clients', icon: Users },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  const handleNavClick = (id: string) => {
    setActivePage(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-base shadow-sm">
            P
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-semibold text-white tracking-tight text-base block truncate">
                PlayBook
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5 truncate">
                Productivity Engine
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Global Quick Add Button */}
      <div className="p-3">
        <button
          onClick={() => setQuickAddOpen(true)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm ${
            collapsed ? 'px-0' : ''
          }`}
          title="Quick Add Task, Schedule, Expense, Contact"
        >
          <Plus size={16} className="shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Quick Add</span>}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? item.isSpecial
                    ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 shadow-sm'
                    : 'bg-slate-800 text-white border border-slate-700/50'
                  : item.isSpecial
                  ? 'text-indigo-300 hover:bg-slate-800/80 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  size={17}
                  className={`shrink-0 ${
                    isActive
                      ? item.isSpecial
                        ? 'text-indigo-400'
                        : 'text-white'
                      : item.isSpecial
                      ? 'text-indigo-400'
                      : 'text-slate-400'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </div>

              {!collapsed && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                    item.badgeColor || 'bg-indigo-600 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Account / Login Footer Card */}
      <div className="p-3 border-t border-slate-800/80">
        {currentUser ? (
          <div
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-left ${
              collapsed ? 'justify-center p-1.5' : ''
            }`}
            title={`Account: ${currentUser.displayName || currentUser.email}`}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()
              )}
            </div>
            {!collapsed && (
              <div className="truncate flex-1 min-w-0">
                <span className="text-xs font-semibold text-white block truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Cloud Synced
                </span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className={`w-full flex items-center gap-2 p-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/40 text-indigo-200 transition-colors text-xs font-medium ${
              collapsed ? 'justify-center p-1.5' : ''
            }`}
            title="Sign in with Google"
          >
            <LogIn size={15} className="text-indigo-400 shrink-0" />
            {!collapsed && <span>Sign In to Sync</span>}
          </button>
        )}
      </div>

      {/* Footer Motivation Hint */}
      {!collapsed && (
        <div className="p-3 m-3 mt-0 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="line-clamp-2">Consistency builds compounding freelance freedom.</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 ease-in-out h-screen sticky top-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sliding Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-64 z-50 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
