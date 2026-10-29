import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Coffee,
  CheckCircle2,
  Clock,
  Settings,
  ChevronDown,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Square,
  FastForward,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InfoTooltip } from './Tooltip';

export const WorkingHoursTimer: React.FC = () => {
  const {
    workdayState,
    startWorkday,
    pauseWorkday,
    resumeWorkday,
    startBreak,
    resumeFromBreak,
    skipBreak,
    endWorkday,
    updateWorkdayConfig,
    personalSessions,
    activePersonalSession,
    getPersonalDailyTotalSeconds,
    setActivePage,
  } = useApp();

  const [configOpen, setConfigOpen] = useState(false);
  const [customWorkHours, setCustomWorkHours] = useState(
    Math.floor(workdayState.targetWorkMinutes / 60).toString()
  );
  const [customWorkMinutes, setCustomWorkMinutes] = useState(
    (workdayState.targetWorkMinutes % 60).toString()
  );
  const [customBreakMinutes, setCustomBreakMinutes] = useState(
    workdayState.targetBreakMinutes.toString()
  );
  const [showSkipBreakModal, setShowSkipBreakModal] = useState(false);

  // Live timer tick every second for real-time second-by-second updates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (workdayState.status === 'working' || workdayState.status === 'on_break') {
      const interval = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [workdayState.status]);

  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Calculate Today's Total Personal Working Time (Completed sessions + active running session)
  const todayTotalPersonalSeconds = getPersonalDailyTotalSeconds(todayStr);

  // 2. Current Active Session Elapsed Time
  const currentSessionElapsedSeconds = activePersonalSession
    ? Math.max(0, Math.floor((now - activePersonalSession.startTimestamp) / 1000))
    : workdayState.status === 'working' && workdayState.currentIntervalStartTime
    ? Math.max(0, Math.floor((now - workdayState.currentIntervalStartTime) / 1000))
    : 0;

  // 3. Calculate Total Break Seconds
  let breakSeconds = workdayState.accumulatedBreakSeconds;
  let currentBreakElapsedSeconds = 0;
  if (workdayState.status === 'on_break' && workdayState.currentBreakStartTime) {
    currentBreakElapsedSeconds = Math.max(0, Math.floor((now - workdayState.currentBreakStartTime) / 1000));
    breakSeconds += currentBreakElapsedSeconds;
  }

  // 4. Calculate Total Elapsed Workday Duration
  let totalElapsedSeconds = 0;
  if (workdayState.workdayStartTime) {
    if (workdayState.status === 'completed' || workdayState.status === 'idle') {
      totalElapsedSeconds = todayTotalPersonalSeconds + breakSeconds;
    } else {
      totalElapsedSeconds = Math.max(0, Math.floor((now - workdayState.workdayStartTime) / 1000));
    }
  }

  // 5. Progress towards target work interval
  const targetWorkSec = workdayState.targetWorkMinutes * 60;
  const workProgressPct = targetWorkSec > 0 ? Math.min(100, Math.round((todayTotalPersonalSeconds / targetWorkSec) * 100)) : 0;
  const isWorkTargetCompleted = todayTotalPersonalSeconds >= targetWorkSec && targetWorkSec > 0;

  // 6. Break calculations
  const targetBreakSec = workdayState.targetBreakMinutes * 60;
  const remainingBreakSec = targetBreakSec - currentBreakElapsedSeconds;
  const isBreakOverdue = remainingBreakSec < 0;
  const breakOverdueSec = Math.abs(remainingBreakSec);

  // Filter today's personal sessions for the short overview list
  const todaySessions = personalSessions.filter((s) => s.date === todayStr);
  const recentSessions = todaySessions.slice(0, 3);

  const formatHms = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMs = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyConfig = (workMin: number, breakMin: number) => {
    updateWorkdayConfig(workMin, breakMin);
    setConfigOpen(false);
  };

  const handleApplyCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const wH = parseInt(customWorkHours, 10) || 0;
    const wM = parseInt(customWorkMinutes, 10) || 0;
    const bM = parseInt(customBreakMinutes, 10) || 15;
    const totalWMin = Math.max(15, wH * 60 + wM);
    const totalBMin = Math.max(5, bM);
    updateWorkdayConfig(totalWMin, totalBMin);
    setConfigOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Clock size={16} />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Personal Working Hours Timer</h3>
            <InfoTooltip content="Dedicated personal productivity timer. Tracks individual working sessions and daily focus time independently of client billing." />
          </div>
        </div>

        {/* Clear Status Badges & Target Setting Toggle */}
        <div className="flex items-center gap-2">
          {workdayState.status === 'working' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Timer Running</span>
            </span>
          ) : workdayState.status === 'on_break' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
              <Coffee size={13} className="text-amber-600 animate-bounce" />
              <span>On Break</span>
            </span>
          ) : workdayState.status === 'paused' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Pause size={12} />
              <span>Timer Paused</span>
            </span>
          ) : workdayState.status === 'completed' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <CheckCircle2 size={13} className="text-purple-600" />
              <span>Workday Completed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Timer Stopped</span>
            </span>
          )}

          {/* Config Button */}
          <button
            onClick={() => setConfigOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            title="Configure target intervals"
          >
            <Settings size={13} />
            <span>
              {Math.floor(workdayState.targetWorkMinutes / 60)}h / {workdayState.targetBreakMinutes}m
            </span>
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Interval Configuration Dropdown Panel */}
      {configOpen && (
        <div className="p-4 bg-slate-100/70 border-b border-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Configure Daily Work & Break Targets</span>
              <span className="text-[11px] text-slate-500">Presets apply immediately without losing elapsed time</span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Work Interval Target
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '3 Hours', val: 180 },
                    { label: '4 Hours', val: 240 },
                    { label: '6 Hours', val: 360 },
                    { label: '8 Hours', val: 480 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => handleApplyConfig(p.val, workdayState.targetBreakMinutes)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        workdayState.targetWorkMinutes === p.val
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Break Duration
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '15m', val: 15 },
                    { label: '30m', val: 30 },
                    { label: '1h', val: 60 },
                    { label: '2h', val: 120 },
                  ].map((b) => (
                    <button
                      key={b.val}
                      onClick={() => handleApplyConfig(workdayState.targetWorkMinutes, b.val)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        workdayState.targetBreakMinutes === b.val
                          ? 'bg-amber-600 text-white font-semibold shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Inputs */}
            <form onSubmit={handleApplyCustomConfig} className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Custom Target:</span>
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={customWorkHours}
                  onChange={(e) => setCustomWorkHours(e.target.value)}
                  className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono"
                />
                <span className="text-slate-500">hours</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customWorkMinutes}
                  onChange={(e) => setCustomWorkMinutes(e.target.value)}
                  className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono"
                />
                <span className="text-slate-500">mins work</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customBreakMinutes}
                  onChange={(e) => setCustomBreakMinutes(e.target.value)}
                  className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono"
                />
                <span className="text-slate-500">mins break</span>
              </div>

              <button
                type="submit"
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded transition-colors ml-auto cursor-pointer"
              >
                Apply Custom Target
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Section 1: Main Numbers & Progress (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Today's Total Personal Working Time */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold block">
                  Today's Total Working Time
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-indigo-600 tabular-nums mt-0.5">
                  {formatHms(todayTotalPersonalSeconds)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>{todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} recorded</span>
                  {workdayState.status === 'working' && (
                    <span className="text-emerald-600 font-semibold">(live accumulating)</span>
                  )}
                </div>
              </div>

              {/* Current Session Elapsed Time */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold block">
                    Current Session
                  </span>
                  {workdayState.status === 'working' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      In progress
                    </span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums mt-0.5">
                  {workdayState.status === 'working' ? formatHms(currentSessionElapsedSeconds) : '00:00:00'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {workdayState.status === 'working' && activePersonalSession
                    ? `Started at ${activePersonalSession.startTime}`
                    : workdayState.status === 'on_break'
                    ? `Break elapsed: ${formatHms(breakSeconds)}`
                    : 'Timer is ready to start'}
                </div>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Work Interval Target ({Math.floor(workdayState.targetWorkMinutes / 60)}h{' '}
                  {workdayState.targetWorkMinutes % 60 ? `${workdayState.targetWorkMinutes % 60}m` : ''})
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {workProgressPct}% ({Math.floor(todayTotalPersonalSeconds / 60)}m / {workdayState.targetWorkMinutes}m)
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  style={{ width: `${workProgressPct}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    isWorkTargetCompleted
                      ? 'bg-emerald-500'
                      : workProgressPct > 75
                      ? 'bg-indigo-600'
                      : 'bg-indigo-500'
                  }`}
                />
              </div>
            </div>

            {/* Break Countdown Status when on Break */}
            {workdayState.status === 'on_break' && (
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isBreakOverdue
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Coffee size={16} className={isBreakOverdue ? 'text-rose-600' : 'text-amber-600'} />
                  <div>
                    <span className="text-xs font-bold">
                      {isBreakOverdue ? 'Break Overdue!' : 'Break Time Remaining'}
                    </span>
                    <p className="text-[11px] opacity-90">
                      {isBreakOverdue
                        ? `Overdue by ${formatMs(breakOverdueSec)}. Ready to get back to work?`
                        : `${formatMs(remainingBreakSec)} remaining before next session`}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-sm">
                  {isBreakOverdue ? `+${formatMs(breakOverdueSec)}` : formatMs(remainingBreakSec)}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Action Controls (Cols 8-12) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3 pt-2 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-6">
            {/* Primary Action Buttons */}
            {workdayState.status === 'idle' && (
              <button
                onClick={startWorkday}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <Play size={18} fill="currentColor" />
                <span>Start Personal Timer</span>
              </button>
            )}

            {workdayState.status === 'working' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={startBreak}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <Coffee size={15} />
                    <span>Take Break</span>
                  </button>

                  <button
                    onClick={pauseWorkday}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Pause size={15} />
                    <span>Pause</span>
                  </button>
                </div>

                <button
                  onClick={endWorkday}
                  className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Square size={14} />
                  <span>End Workday & Finalize</span>
                </button>
              </div>
            )}

            {workdayState.status === 'on_break' && (
              <div className="space-y-2">
                <button
                  onClick={resumeFromBreak}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Resume Work Session</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowSkipBreakModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <FastForward size={14} />
                    <span>Skip Break</span>
                  </button>

                  <button
                    onClick={pauseWorkday}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Pause size={14} />
                    <span>Pause</span>
                  </button>
                </div>

                <button
                  onClick={endWorkday}
                  className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Square size={14} />
                  <span>End Workday</span>
                </button>
              </div>
            )}

            {workdayState.status === 'paused' && (
              <div className="space-y-2">
                <button
                  onClick={resumeWorkday}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Resume Session</span>
                </button>

                <button
                  onClick={endWorkday}
                  className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Square size={14} />
                  <span>End Workday</span>
                </button>
              </div>
            )}

            {workdayState.status === 'completed' && (
              <div className="space-y-2">
                <button
                  onClick={startWorkday}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <RotateCcw size={15} />
                  <span>Start New Working Session</span>
                </button>
              </div>
            )}

            {/* Quick Stats Line */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} today</span>
              <span>{workdayState.breaksCount} break{workdayState.breaksCount === 1 ? '' : 's'}</span>
              <span>Total Break: {Math.floor(breakSeconds / 60)}m</span>
            </div>
          </div>
        </div>

        {/* Section 3: Recent Personal Working Sessions Overview & Navigation to Today Page */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Recent Personal Working Sessions (Today)</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-semibold">
                {todaySessions.length}
              </span>
            </div>

            <button
              onClick={() => setActivePage('today')}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              <span>View Full History on Today Page</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {todaySessions.length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
              No personal working sessions recorded today yet. Click <span className="font-semibold text-indigo-600">Start Personal Timer</span> above to begin your first focus block.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {recentSessions.map((session, idx) => {
                const isSessionRunning = session.status === 'in_progress';
                const duration = isSessionRunning
                  ? Math.max(0, Math.floor((now - session.startTimestamp) / 1000))
                  : session.durationSeconds;

                return (
                  <div
                    key={session.id}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                      isSessionRunning
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">
                        Session #{todaySessions.length - idx}
                      </span>
                      {isSessionRunning ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          In Progress
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          Completed
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{session.startTime} → {session.endTime || 'Now'}</span>
                      <span className="font-mono font-bold text-slate-800 tabular-nums">
                        {formatHms(duration)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Work Interval Complete Banner */}
        {isWorkTargetCompleted && workdayState.status === 'working' && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-emerald-900 text-xs">
              <Sparkles size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Your work interval target is reached!</span>
                <span className="ml-1 text-emerald-800">Great focus today. Time for a recovery break.</span>
              </div>
            </div>
            <button
              onClick={startBreak}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              Start Break ({workdayState.targetBreakMinutes}m)
            </button>
          </div>
        )}
      </div>

      {/* Skip Break Confirmation Modal */}
      {showSkipBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900">Skip this break?</h4>
            <p className="text-xs text-slate-600 mt-1">
              Are you sure you want to skip your scheduled recovery break and immediately get back to working?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSkipBreakModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  skipBreak();
                  setShowSkipBreakModal(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Yes, Skip Break
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
