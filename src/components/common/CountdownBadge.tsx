import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CountdownBadgeProps {
  deadline: string; // YYYY-MM-DD or ISO string
  time?: string; // HH:mm if separate
  isCompleted?: boolean;
  compact?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  deadline,
  time,
  isCompleted = false,
  compact = false,
  showIcon = true,
  className = '',
}) => {
  const [timeInfo, setTimeInfo] = useState(() => calculateTimeRemaining(deadline, time));

  useEffect(() => {
    // Immediate calculation
    setTimeInfo(calculateTimeRemaining(deadline, time));

    // Live tick every 5 seconds for smooth countdown
    const interval = setInterval(() => {
      setTimeInfo(calculateTimeRemaining(deadline, time));
    }, 5000);

    return () => clearInterval(interval);
  }, [deadline, time]);

  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono text-[11px] px-2 py-0.5 ${className}`}
      >
        {showIcon && <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />}
        <span>Completed</span>
      </span>
    );
  }

  const { isOverdue, days, hours, minutes, totalSeconds, label, urgency } = timeInfo;

  if (isOverdue) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-md border font-mono text-[11px] px-2 py-0.5 animate-pulse bg-rose-50 text-rose-700 border-rose-200 shadow-xs ${className}`}
        title={`Deadline was ${deadline}${time ? ` at ${time}` : ''}`}
      >
        {showIcon && <AlertTriangle size={12} className="text-rose-600 shrink-0" />}
        <span>
          {compact ? `Overdue ${label}` : `Overdue by ${label}`}
        </span>
      </span>
    );
  }

  if (urgency === 'today') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-md border font-mono text-[11px] px-2 py-0.5 bg-amber-50 text-amber-800 border-amber-200 shadow-xs ${className}`}
        title={`Due today by ${time || 'end of day'}`}
      >
        {showIcon && <Clock size={12} className="text-amber-600 shrink-0" />}
        <span>{compact ? `Due in ${label}` : `Due Today (${label} left)`}</span>
      </span>
    );
  }

  if (urgency === 'soon') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-md border font-mono text-[11px] px-2 py-0.5 bg-orange-50 text-orange-700 border-orange-200 shadow-xs ${className}`}
        title={`Due on ${deadline}`}
      >
        {showIcon && <Clock size={12} className="text-orange-600 shrink-0" />}
        <span>Due Soon ({label})</span>
      </span>
    );
  }

  // Future > 48h
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border font-mono text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 border-slate-200 ${className}`}
      title={`Due on ${deadline}`}
    >
      {showIcon && <Clock size={12} className="text-slate-500 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};

export function calculateTimeRemaining(deadlineStr: string, timeStr?: string) {
  if (!deadlineStr) {
    return {
      isOverdue: false,
      days: 0,
      hours: 0,
      minutes: 0,
      totalSeconds: 0,
      label: 'No deadline',
      urgency: 'normal' as const,
    };
  }

  const now = new Date();
  let target: Date;

  // If already full ISO or contains T
  if (deadlineStr.includes('T')) {
    target = new Date(deadlineStr);
  } else {
    // Format YYYY-MM-DD
    const [year, month, day] = deadlineStr.split('-').map(Number);
    if (timeStr && timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      target = new Date(year, month - 1, day, hours, minutes, 0, 0);
    } else {
      // End of that day (23:59:59)
      target = new Date(year, month - 1, day, 23, 59, 59, 999);
    }
  }

  const diffMs = target.getTime() - now.getTime();
  const totalSeconds = Math.round(diffMs / 1000);
  const isOverdue = diffMs < 0;

  const absDiffMs = Math.abs(diffMs);
  const totalMinutes = Math.floor(absDiffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  let label = '';
  if (isOverdue) {
    if (days > 0) {
      label = `${days}d ${hours}h`;
    } else if (hours > 0) {
      label = `${hours}h ${minutes}m`;
    } else {
      label = `${Math.max(1, minutes)}m`;
    }
  } else {
    if (days > 1) {
      label = `${days}d ${hours}h`;
    } else if (days === 1) {
      label = `1d ${hours}h`;
    } else if (hours > 0) {
      label = `${hours}h ${minutes}m`;
    } else {
      label = `${Math.max(1, minutes)}m`;
    }
  }

  let urgency: 'overdue' | 'today' | 'soon' | 'normal' = 'normal';
  if (isOverdue) {
    urgency = 'overdue';
  } else {
    const isSameCalendarDay =
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth() &&
      target.getDate() === now.getDate();

    if (isSameCalendarDay || diffMs < 86400000) {
      urgency = 'today';
    } else if (diffMs < 48 * 3600 * 1000) {
      urgency = 'soon';
    }
  }

  return {
    isOverdue,
    days,
    hours,
    minutes,
    totalSeconds,
    label,
    urgency,
  };
}
