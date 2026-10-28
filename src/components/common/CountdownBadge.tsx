import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

    // Real-time 1-second ticking countdown
    const interval = setInterval(() => {
      setTimeInfo(calculateTimeRemaining(deadline, time));
    }, 1000);

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

  const { isOverdue, label, urgency } = timeInfo;

  if (isOverdue) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-md border font-mono text-[11px] px-2 py-0.5 bg-rose-50 text-rose-700 border-rose-200 shadow-2xs ${className}`}
        title={`Deadline was ${deadline}${time ? ` at ${time}` : ''}`}
      >
        {showIcon && <AlertTriangle size={12} className="text-rose-600 shrink-0 animate-pulse" />}
        <span>{compact ? label : `Overdue by ${label}`}</span>
      </span>
    );
  }

  if (urgency === 'today') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-md border font-mono text-[11px] px-2 py-0.5 bg-amber-50 text-amber-800 border-amber-300 shadow-2xs ${className}`}
        title={`Due today by ${time || 'end of day'}`}
      >
        {showIcon && <Clock size={12} className="text-amber-600 shrink-0" />}
        <span>{compact ? label : `Deadline in ${label}`}</span>
      </span>
    );
  }

  if (urgency === 'soon') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-md border font-mono text-[11px] px-2 py-0.5 bg-orange-50 text-orange-800 border-orange-200 shadow-2xs ${className}`}
        title={`Due on ${deadline}`}
      >
        {showIcon && <Clock size={12} className="text-orange-600 shrink-0" />}
        <span>Due in {label}</span>
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
      <span>In {label}</span>
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
      seconds: 0,
      totalSeconds: 0,
      label: 'No deadline',
      urgency: 'normal' as const,
    };
  }

  const now = new Date();
  let target: Date;

  if (deadlineStr.includes('T')) {
    target = new Date(deadlineStr);
  } else {
    const [year, month, day] = deadlineStr.split('-').map(Number);
    if (timeStr && timeStr.includes(':')) {
      const cleanTime = timeStr.trim().split('-')[0].trim();
      const [hours, minutes] = cleanTime.split(':').map(Number);
      target = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
    } else {
      target = new Date(year, month - 1, day, 23, 59, 59, 999);
    }
  }

  const diffMs = target.getTime() - now.getTime();
  const isOverdue = diffMs < 0;

  const absDiffMs = Math.abs(diffMs);
  const totalSeconds = Math.floor(absDiffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  let label = '';
  if (days > 0) {
    label = `${days}d ${hh}h ${mm}m ${ss}s`;
  } else {
    label = `${hh}h ${mm}m ${ss}s`;
  }

  let urgency: 'overdue' | 'today' | 'soon' | 'normal' = 'normal';
  if (isOverdue) {
    urgency = 'overdue';
  } else {
    const isSameCalendarDay =
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth() &&
      target.getDate() === now.getDate();

    if (isSameCalendarDay || diffMs <= 12 * 3600 * 1000) {
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
    seconds,
    totalSeconds,
    label,
    urgency,
  };
}
