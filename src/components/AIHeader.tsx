import React from 'react';
import { Flame } from 'lucide-react';

interface AIHeaderProps {
  currentDateStr: string;
  currentTimeStr: string;
  streak: number;
  completedCount: number;
  totalCount: number;
}

export default function AIHeader({
  currentDateStr,
  currentTimeStr,
  streak,
  completedCount,
  totalCount,
}: AIHeaderProps) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full bg-gradient-to-b from-[#161922] to-[#0A0B0E] px-5 py-4 border-b border-slate-800/50 flex flex-col gap-3 rounded-t-[36px] theme-header">
      {/* Title, Date and Streak */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg tracking-tight font-serif">
            <span className="text-slate-300 font-light theme-header-ai">AI-</span>
            <span className="text-emerald-400 font-bold theme-header-title">Planify</span>
          </h1>
          <p className="text-[11px] text-emerald-500/80 font-mono tracking-wider capitalize mt-0.5 theme-header-date">
            {currentDateStr}
          </p>
        </div>

        {/* Right side: Streak and Time */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full shadow-sm theme-streak-badge">
            <span className="text-emerald-400 text-xs theme-streak-fire">🔥</span>
            <span className="text-xs font-mono font-bold text-emerald-300 theme-streak-text">{streak}</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest mt-0.5 theme-clock">
            {currentTimeStr}
          </span>
        </div>
      </div>

      {/* Goal Progress bar */}
      <div className="w-full mt-1.5">
        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest theme-goal-label">
          <span>TÂCHE GOAL</span>
          <span className="text-emerald-400 font-mono font-bold theme-goal-percent">{percent}%</span>
        </div>
        <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden mt-1 relative border border-slate-800/20 theme-goal-track">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs shadow-emerald-400 theme-goal-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
