import React from 'react';
import { X, Check, Bell, AlertTriangle, Info, CheckCircle, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationDrawer: React.FC = () => {
  const {
    notificationDrawerOpen,
    setNotificationDrawerOpen,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setActivePage,
  } = useApp();

  if (!notificationDrawerOpen) return null;

  const handleNotificationClick = (linkPage?: string, id?: string) => {
    if (id) {
      markNotificationAsRead(id);
    }
    if (linkPage) {
      setActivePage(linkPage);
      setNotificationDrawerOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setNotificationDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Notifications & Alerts</h2>
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-md">
                  {notifications.filter((n) => !n.read).length} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                onClick={() => setNotificationDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <Bell size={32} className="stroke-1 mb-2 opacity-50" />
                <p className="text-xs font-medium text-slate-600">No active notifications</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You're all caught up with deadlines and schedules!
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isAlert = notif.type === 'alert';
                const isWarning = notif.type === 'warning';
                const isSuccess = notif.type === 'success';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.linkPage, notif.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      notif.read
                        ? 'bg-slate-50/70 border-slate-200 opacity-75'
                        : isAlert
                        ? 'bg-rose-50/60 border-rose-200 shadow-xs'
                        : isWarning
                        ? 'bg-amber-50/60 border-amber-200'
                        : isSuccess
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="shrink-0 mt-0.5">
                        {isAlert ? (
                          <AlertTriangle size={15} className="text-rose-600" />
                        ) : isWarning ? (
                          <AlertTriangle size={15} className="text-amber-600" />
                        ) : isSuccess ? (
                          <CheckCircle size={15} className="text-emerald-600" />
                        ) : (
                          <Info size={15} className="text-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-xs font-semibold truncate ${
                              notif.read ? 'text-slate-700' : 'text-slate-900'
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>
                            {new Date(notif.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {notif.linkPage && (
                            <span className="text-indigo-600 font-medium hover:underline">
                              View details →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
