import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  CheckSquare,
  Calendar,
  Target,
  Bell,
  BellOff,
  Settings,
  X,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InfoTooltip } from './Tooltip';
import {
  parseDeadlineTarget,
  formatLiveCountdown,
  TWELVE_HOURS_MS,
} from '../../services/deadline';

export interface AttentionItem {
  id: string;
  itemId: string;
  title: string;
  subtitle?: string;
  type: 'Task' | 'Schedule' | 'Goal';
  priority: 'high' | 'medium' | 'low';
  targetTimestamp: number;
  remainingMs: number;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}

export const NeedsAttentionSection: React.FC = () => {
  const {
    tasks,
    schedules,
    goals,
    needsAttentionSettings,
    updateNeedsAttentionSettings,
    dismissAttentionItem,
    completeTask,
    toggleScheduleComplete,
    toggleMilestone,
    setActivePage,
  } = useApp();

  // Live timer tick to continuously recalculate remaining deadline times
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    // 1-second interval ensures real-time minute & second transition
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);



  // Compute eligible items: STRICTLY 0 < diffMs <= 12 hours (Overdue diffMs <= 0 is strictly excluded!)
  const eligibleItems = useMemo<AttentionItem[]>(() => {
    const list: AttentionItem[] = [];
    const dismissed = needsAttentionSettings.dismissedItemIds || [];

    // 1. Tasks
    tasks.forEach((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return;
      if (dismissed.includes(t.id)) return;

      const target = parseDeadlineTarget(t.deadline, t.dueTime);
      if (target <= 0) return;
      const diff = target - nowMs;

      // Strict 12-hour rule: approaching within next 12 hours, NOT overdue
      if (diff > 0 && diff <= TWELVE_HOURS_MS) {
        list.push({
          id: `task-${t.id}`,
          itemId: t.id,
          title: t.name,
          subtitle: `${t.clientName} · ${t.platform}`,
          type: 'Task',
          priority: t.priority,
          targetTimestamp: target,
          remainingMs: diff,
          actionLabel: 'Complete',
          onAction: () => completeTask(t.id),
          onDismiss: () => dismissAttentionItem(t.id),
        });
      }
    });

    // 2. Schedules
    schedules.forEach((s) => {
      if (s.isCompleted) return;
      if (dismissed.includes(s.id)) return;

      const target = parseDeadlineTarget(s.date, s.startTime);
      if (target <= 0) return;
      const diff = target - nowMs;

      // Strict 12-hour rule: approaching within next 12 hours, NOT overdue
      if (diff > 0 && diff <= TWELVE_HOURS_MS) {
        list.push({
          id: `schedule-${s.id}`,
          itemId: s.id,
          title: s.title,
          subtitle: s.startTime ? `Scheduled at ${s.startTime}` : 'Scheduled today',
          type: 'Schedule',
          priority: 'medium',
          targetTimestamp: target,
          remainingMs: diff,
          actionLabel: 'Check Off',
          onAction: () => toggleScheduleComplete(s.id),
          onDismiss: () => dismissAttentionItem(s.id),
        });
      }
    });

    // 3. Goals & Milestones
    goals.forEach((g) => {
      if (g.isCompleted) return;

      // Goal-level deadline
      if (!dismissed.includes(g.id)) {
        const goalTarget = parseDeadlineTarget(g.targetDate);
        if (goalTarget > 0) {
          const diff = goalTarget - nowMs;
          if (diff > 0 && diff <= TWELVE_HOURS_MS) {
            list.push({
              id: `goal-${g.id}`,
              itemId: g.id,
              title: g.name,
              subtitle: 'Goal Target Deadline',
              type: 'Goal',
              priority: g.priority,
              targetTimestamp: goalTarget,
              remainingMs: diff,
              actionLabel: 'View Goal',
              onAction: () => setActivePage('goals'),
              onDismiss: () => dismissAttentionItem(g.id),
            });
          }
        }
      }

      // Milestones
      if (g.milestones && g.milestones.length > 0) {
        g.milestones.forEach((m) => {
          if (m.isCompleted) return;
          if (dismissed.includes(m.id)) return;

          const mTarget = parseDeadlineTarget(m.targetDate);
          if (mTarget <= 0) return;
          const diff = mTarget - nowMs;

          if (diff > 0 && diff <= TWELVE_HOURS_MS) {
            list.push({
              id: `milestone-${m.id}`,
              itemId: m.id,
              title: m.title,
              subtitle: `${g.name} · Milestone Step`,
              type: 'Goal',
              priority: g.priority,
              targetTimestamp: mTarget,
              remainingMs: diff,
              actionLabel: 'Mark Complete',
              onAction: () => toggleMilestone(g.id, m.id),
              onDismiss: () => dismissAttentionItem(m.id),
            });
          }
        });
      }
    });

    // Sort by most urgent deadline (shortest remaining time first)
    list.sort((a, b) => a.remainingMs - b.remainingMs);

    return list;
  }, [
    tasks,
    schedules,
    goals,
    needsAttentionSettings.dismissedItemIds,
    nowMs,
    TWELVE_HOURS_MS,
    completeTask,
    toggleScheduleComplete,
    toggleMilestone,
    dismissAttentionItem,
    setActivePage,
  ]);

  // Requirement 2: If no items have deadlines within next 12 hours, hide entire section (no placeholder)
  if (eligibleItems.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Needs Attention"
      className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-amber-50/90 to-orange-50/80 border border-amber-300/90 rounded-2xl shadow-sm transition-all duration-200"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 ring-2 ring-amber-200">
            <AlertTriangle size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Needs Attention
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-amber-200/80 text-amber-900">
                  {eligibleItems.length}
                </span>
              </h2>
              <InfoTooltip content="Upcoming tasks, schedules, and goals with strict deadlines in the next 12 hours. Recalculated live. Recurring alerts trigger every 2 hours until completed." />
            </div>
            <p className="text-xs text-amber-800 font-medium mt-0.5">
              Deadlines approaching within the next 12 hours
            </p>
          </div>
        </div>

        {/* Reminder Settings Dropdown Trigger */}
        <div className="relative flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setConfigOpen((prev) => !prev)}
            aria-expanded={configOpen}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/95 border border-amber-300 text-amber-900 hover:bg-amber-100/70 shadow-2xs transition-colors"
          >
            {needsAttentionSettings.recurringReminderEnabled ? (
              <Bell size={13} className="text-amber-700" />
            ) : (
              <BellOff size={13} className="text-slate-400" />
            )}
            <span>
              {needsAttentionSettings.recurringReminderEnabled
                ? `Alerts every ${needsAttentionSettings.reminderIntervalHours}h`
                : 'Alerts Paused'}
            </span>
            <Settings size={12} className="text-amber-700/70" />
          </button>

          {/* Config Popover */}
          {configOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-72 p-4 bg-white border border-slate-200 rounded-xl shadow-xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notification Settings</span>
                <button
                  type="button"
                  onClick={() => setConfigOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">2-Hour Recurring Reminders</span>
                  <p className="text-[10px] text-slate-500">Alerts until item is completed or deadline passes</p>
                </div>
                <input
                  type="checkbox"
                  checked={needsAttentionSettings.recurringReminderEnabled}
                  onChange={(e) =>
                    updateNeedsAttentionSettings({
                      recurringReminderEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {needsAttentionSettings.recurringReminderEnabled && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-700">Reminder Frequency:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 4].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() =>
                          updateNeedsAttentionSettings({ reminderIntervalHours: hours })
                        }
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                          needsAttentionSettings.reminderIntervalHours === hours
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Every {hours}h
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {needsAttentionSettings.dismissedItemIds.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => updateNeedsAttentionSettings({ dismissedItemIds: [] })}
                    className="flex items-center justify-center gap-1.5 w-full py-1 text-xs text-amber-700 font-semibold hover:bg-amber-50 rounded-md transition-colors"
                  >
                    <RotateCcw size={12} />
                    <span>Restore Dismissed Items ({needsAttentionSettings.dismissedItemIds.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Requirement 6: Single-Column Layout (one item per row, full width) */}
      <div className="space-y-2.5">
        {eligibleItems.map((item) => {
          const typeBadgeStyle =
            item.type === 'Task'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : item.type === 'Schedule'
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200';

          const priorityStyle =
            item.priority === 'high'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : item.priority === 'medium'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

          return (
            <div
              key={item.id}
              className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 bg-white/90 hover:bg-white border border-amber-200/90 hover:border-amber-400 rounded-xl shadow-2xs hover:shadow-sm transition-all duration-150"
            >
              {/* Item Info: Badges & Title */}
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Item Type Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md border ${typeBadgeStyle}`}
                    >
                      {item.type === 'Task' && <CheckSquare size={11} />}
                      {item.type === 'Schedule' && <Calendar size={11} />}
                      {item.type === 'Goal' && <Target size={11} />}
                      <span>{item.type}</span>
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${priorityStyle}`}
                    >
                      {item.priority}
                    </span>

                    {/* Live Countdown Badge (Requirement 7: clear warning style e.g. "Deadline in 08h 35m") */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                      <Clock size={12} className="text-amber-700 shrink-0" />
                      <span className="font-mono tabular-nums">
                        {formatLiveCountdown(item.remainingMs)}
                      </span>
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mt-1">
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug truncate">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={item.onAction}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-sm active:scale-95 transition-all"
                >
                  <CheckCircle2 size={13} />
                  <span>{item.actionLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={item.onDismiss}
                  title="Dismiss alert for this item"
                  aria-label="Dismiss alert"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
