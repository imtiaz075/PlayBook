import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  ArrowRight,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PersonalWorkSession } from '../../types';

export const PersonalWorkingSessionsSection: React.FC = () => {
  const {
    personalSessions,
    activePersonalSession,
    getPersonalDailyTotalSeconds,
    calculateSessionSecondsForDay,
    deletePersonalSession,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Live tick to keep active session duration updating every second
  const [, setTick] = useState(0);
  useEffect(() => {
    if (activePersonalSession) {
      const interval = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [activePersonalSession]);

  const now = Date.now();

  // 1. Calculate Total Personal Working Time for Selected Date
  const selectedDateTotalSeconds = useMemo(() => {
    return getPersonalDailyTotalSeconds(selectedDate);
  }, [getPersonalDailyTotalSeconds, selectedDate, personalSessions, activePersonalSession, now]);

  // 2. Filter sessions that belong to the selected date (including split midnight sessions)
  const dateSessions = useMemo(() => {
    return personalSessions
      .map((session) => {
        const secOnDate = calculateSessionSecondsForDay(session, selectedDate, now);
        return {
          session,
          secOnDate,
        };
      })
      .filter((item) => item.secOnDate > 0 || item.session.date === selectedDate)
      .sort((a, b) => b.session.startTimestamp - a.session.startTimestamp);
  }, [personalSessions, selectedDate, calculateSessionSecondsForDay, now]);

  const formatHms = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      {/* Section Header with Date Selector */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Personal Working Sessions
            </h2>
            <p className="text-xs text-slate-500">
              Detailed chronological log of your individual focus blocks
            </p>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <button
            onClick={handleNextDay}
            disabled={isToday}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Prominent Daily Total Working Time Display Banner */}
      <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
            {isToday ? "Today's Total Working Time" : `Total Working Time (${selectedDate})`}
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums mt-0.5 text-white">
            {formatHms(selectedDateTotalSeconds)}
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            {(selectedDateTotalSeconds / 3600).toFixed(2)} hours accumulated across {dateSessions.length} session{dateSessions.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activePersonalSession && isToday ? (
            <div className="bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>Session currently active</span>
            </div>
          ) : (
            <div className="bg-white/10 px-3.5 py-2 rounded-xl text-xs text-slate-300">
              Personal Productivity Log
            </div>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-5">
        {dateSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Clock size={36} className="mx-auto mb-3 text-slate-300 stroke-1" />
            <h4 className="text-sm font-semibold text-slate-700">No Personal Working Sessions Recorded</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {isToday
                ? 'Start the Personal Working Hours Timer above to begin tracking your productivity sessions for today.'
                : `No personal focus sessions were recorded on ${selectedDate}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2 pb-1 border-b border-slate-100">
              <span>Saved Session Timeline</span>
              <span>{dateSessions.length} total session{dateSessions.length === 1 ? '' : 's'}</span>
            </div>

            {dateSessions.map((item, index) => {
              const { session } = item;
              const isRunning = session.status === 'in_progress';
              const durationSec = isRunning
                ? Math.max(0, Math.floor((now - session.startTimestamp) / 1000))
                : item.secOnDate || session.durationSeconds;

              return (
                <div
                  key={session.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isRunning
                      ? 'bg-emerald-50/60 border-emerald-200 ring-1 ring-emerald-300/50'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        isRunning
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      #{dateSessions.length - index}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {session.startTime}
                        </span>
                        <span className="text-slate-400">→</span>
                        {isRunning ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>In progress</span>
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-900">
                            {session.endTime || 'Completed'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium">
                          {isRunning ? 'Currently recording' : 'Completed focus session'}
                        </span>
                        {session.date !== selectedDate && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            Midnight Split
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Duration and Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Duration
                      </span>
                      <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                        {formatHms(durationSec)}
                      </span>
                    </div>

                    {!isRunning && (
                      <button
                        onClick={() => deletePersonalSession(session.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete session record"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
