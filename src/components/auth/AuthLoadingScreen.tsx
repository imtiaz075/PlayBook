import React from 'react';
import { RefreshCw } from 'lucide-react';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none"
      aria-label="Checking authentication status"
    >
      <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-indigo-600/30">
          P
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-white">PlayBook Workspace</h2>
          <p className="text-xs text-slate-400">Verifying security session...</p>
        </div>
        <div className="pt-2">
          <RefreshCw size={22} className="animate-spin text-indigo-400" />
        </div>
      </div>
    </div>
  );
};
