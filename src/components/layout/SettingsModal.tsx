import React, { useState } from 'react';
import { X, Save, Volume2, Globe, Percent, Bell, User, Check, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playNotificationChime } from '../../services/audio';

export const SettingsModal: React.FC = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    settings,
    updateSettings,
    ratesData,
    updateCustomRates,
    refreshExchangeRates,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'fees' | 'notifications' | 'rates'>('profile');

  // Form states
  const [formData, setFormData] = useState({ ...settings });
  const [customRates, setCustomRates] = useState<Record<string, number>>({ ...ratesData.rates });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [browserPermStatus, setBrowserPermStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  if (!settingsOpen) return null;

  const handleSave = () => {
    updateSettings(formData);
    updateCustomRates(customRates);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setBrowserPermStatus(res);
        if (res === 'granted') {
          new Notification('FreelanceOS Notifications Enabled', {
            body: 'You will receive reminders for deadlines and schedules.',
          });
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Freelancer OS Settings</h2>
            <p className="text-xs text-slate-500">Configure business info, platform fees, rates, and reminders</p>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-6 bg-slate-50/50">
          {[
            { id: 'profile', label: 'Freelancer & Invoicing', icon: User },
            { id: 'fees', label: 'Platform Fees', icon: Percent },
            { id: 'notifications', label: 'Alerts & Reminders', icon: Bell },
            { id: 'rates', label: 'Currencies & Rates', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Freelancer Name</label>
                  <input
                    type="text"
                    value={formData.freelancerName}
                    onChange={(e) => setFormData({ ...formData, freelancerName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={formData.freelancerTitle}
                    onChange={(e) => setFormData({ ...formData, freelancerTitle: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company / Studio Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email (for Invoices)</label>
                  <input
                    type="email"
                    value={formData.freelancerEmail}
                    onChange={(e) => setFormData({ ...formData, freelancerEmail: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tax ID / Business Registration</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Default Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={formData.defaultHourlyRate}
                    onChange={(e) => setFormData({ ...formData, defaultHourlyRate: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Earnings Target ($)</label>
                  <input
                    type="number"
                    value={formData.monthlyEarningsGoal}
                    onChange={(e) => setFormData({ ...formData, monthlyEarningsGoal: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Business Address</label>
                <input
                  type="text"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Instructions (appears on generated PDF invoices)</label>
                <textarea
                  rows={3}
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800"
                  placeholder="Bank wire transfer details, Wise email, USDT wallet address, etc."
                />
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Configure default platform deduction fees. Net project earnings will be calculated automatically:
                <br />
                <span className="font-semibold text-slate-800">Net project value = Gross price − Platform fee</span>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(formData.platformFees).map(([platform, fee]) => (
                  <div key={platform} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800">{platform}</span>
                      <p className="text-[11px] text-slate-500">
                        {platform === 'Fiverr'
                          ? 'Standard 20% commission'
                          : platform === 'Upwork'
                          ? 'Freelancer service fee (15%)'
                          : platform === 'Direct Clients'
                          ? 'No platform intermediary'
                          : 'Custom platform fee'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={fee}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            platformFees: {
                              ...formData.platformFees,
                              [platform]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 text-xs text-right px-2 py-1.5 border border-slate-300 rounded-md font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-600 font-semibold">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">In-App Notifications</span>
                    <p className="text-[11px] text-slate-500">Show notification toasts and drawer badges for reminders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notificationPreferences.inApp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          inApp: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Audible Chimes</span>
                    <p className="text-[11px] text-slate-500">Play clean Web Audio chime on deadlines, timer completion, and alarms</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => playNotificationChime('complete')}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <Volume2 size={12} />
                      <span>Test Sound</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={formData.notificationPreferences.sound}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationPreferences: {
                            ...formData.notificationPreferences,
                            sound: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Browser Native Notifications</span>
                    <p className="text-[11px] text-slate-500">Status: <span className="font-medium text-slate-700 capitalize">{browserPermStatus}</span></p>
                  </div>
                  {browserPermStatus !== 'granted' ? (
                    <button
                      type="button"
                      onClick={requestBrowserPermission}
                      className="px-2.5 py-1 text-[11px] font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Grant Permission
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <Check size={14} /> Enabled
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Deadline Warning Threshold (Hours before deadline)
                  </label>
                  <input
                    type="number"
                    value={formData.notificationPreferences.deadlineWarningHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationPreferences: {
                          ...formData.notificationPreferences,
                          deadlineWarningHours: Number(e.target.value),
                        },
                      })
                    }
                    className="w-32 text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Exchange Rates (USD Base)</h4>
                  <p className="text-[11px] text-slate-500">
                    Last updated: {new Date(ratesData.lastUpdated).toLocaleString()}
                    {ratesData.isCustom && ' · (Custom user overrides)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await refreshExchangeRates();
                    setCustomRates({ ...ratesData.rates });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                >
                  <RefreshCw size={13} />
                  <span>Fetch Live Rates</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(customRates).map(([code, rate]) => (
                  <div key={code} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-800 block">{code}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[11px] text-slate-500">1 USD =</span>
                      <input
                        type="number"
                        step="0.01"
                        value={rate}
                        onChange={(e) =>
                          setCustomRates({
                            ...customRates,
                            [code]: Number(e.target.value),
                          })
                        }
                        className="w-full text-xs px-2 py-1 border border-slate-300 rounded font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={14} /> Settings saved successfully
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettingsOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
