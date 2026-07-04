import React from 'react';
import { AppState } from '../types';
import { MONTH_SHORT_FR } from '../utils/dateUtils';
import { Award, Zap, CheckCircle2, TrendingUp, BarChart2 } from 'lucide-react';

interface AnnualReportProps {
  state: AppState;
  textScale: number;
  isSubTab?: boolean;
}

export default function AnnualReport({ state, textScale, isSubTab }: AnnualReportProps) {
  // Let's calculate some annual metrics
  const totalTrackedDays = Object.keys(state.history).length;
  
  // Calculate completion rate per month for 2026
  const getMonthStats = () => {
    // Return array of 12 numbers representing average completion per month
    const monthlySums = Array(12).fill(0);
    const monthlyCounts = Array(12).fill(0);

    Object.entries(state.history).forEach(([dateStr, prog]) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year === 2026) {
        const monthIndex = month - 1;
        const total = 10; // Assume 10 base tasks
        const completed = prog.completedTaskIds.length;
        const percent = total > 0 ? (completed / total) * 100 : 0;
        
        monthlySums[monthIndex] += percent;
        monthlyCounts[monthIndex] += 1;
      }
    });

    return monthlySums.map((sum, idx) => {
      const count = monthlyCounts[idx];
      return count > 0 ? Math.round(sum / count) : 0;
    });
  };

  const monthPercentages = getMonthStats();

  // Find best month
  const maxMonthIdx = monthPercentages.indexOf(Math.max(...monthPercentages));
  const bestMonth = monthPercentages[maxMonthIdx] > 0 ? MONTH_SHORT_FR[maxMonthIdx] : 'Aucun';

  // Average annual completion
  const validMonths = monthPercentages.filter(p => p > 0);
  const averageAnnualPercent = validMonths.length > 0 
    ? Math.round(validMonths.reduce((a, b) => a + b, 0) / validMonths.length) 
    : 0;

  return (
    <div className={isSubTab 
      ? "flex flex-col gap-4 text-slate-200 theme-annual-report w-full" 
      : "flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-[#0A0B0E] text-slate-200 theme-annual-report w-full"
    }>
      
      {/* 1. MAIN CARD "BILAN ANNUEL 2026" */}
      <div className="bg-gradient-to-br from-[#161922] to-[#12141C] border border-slate-800 rounded-3xl p-5 text-white shadow-md flex flex-col gap-4 theme-annual-card">
        <div className="flex items-center gap-2 pb-1">
          <BarChart2 className="text-emerald-400 theme-annual-icon" size={18} />
          <h3 className="font-bold text-sm text-slate-200 font-serif theme-annual-title">Bilan annuel 2026</h3>
        </div>
        {/* Solid orange/accent underline directly below header */}
        <div className="w-full h-[2px] bg-emerald-500 theme-annual-line" />
 
        {/* Aggregate statistics in 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 py-1">
          {/* Cell 1: Tâches */}
          <div className="flex flex-col items-center justify-center bg-slate-800/40 border border-slate-800/30 rounded-2xl p-3 text-center theme-annual-cell">
            <span className="text-2xl font-black text-emerald-400 font-mono theme-annual-value">{state.customTasks.length || 4}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 font-mono theme-annual-label">Tâches</span>
          </div>

          {/* Cell 2: Jours Actifs */}
          <div className="flex flex-col items-center justify-center bg-slate-800/40 border border-slate-800/30 rounded-2xl p-3 text-center theme-annual-cell">
            <span className="text-2xl font-black text-emerald-400 font-mono theme-annual-value">{totalTrackedDays || 1}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 font-mono theme-annual-label">Jours Actifs</span>
          </div>

          {/* Cell 3: Couverture */}
          <div className="flex flex-col items-center justify-center bg-slate-800/40 border border-slate-800/30 rounded-2xl p-3 text-center theme-annual-cell">
            <span className="text-2xl font-black text-emerald-400 font-mono theme-annual-value">{averageAnnualPercent || 0}%</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 font-mono theme-annual-label">Couverture</span>
          </div>

          {/* Cell 4: Tâches/Jour */}
          <div className="flex flex-col items-center justify-center bg-slate-800/40 border border-slate-800/30 rounded-2xl p-3 text-center theme-annual-cell">
            <span className="text-2xl font-black text-emerald-400 font-mono theme-annual-value">{state.customTasks.length || 13}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 font-mono theme-annual-label">Tâches/Jour</span>
          </div>
        </div>
      </div>
 
      {/* 2. MONTHS GRAPHIC BARS */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4 theme-annual-card">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono theme-annual-subtitle">
          Progression par mois
        </h4>
 
        <div className="flex flex-col gap-3">
          {MONTH_SHORT_FR.map((monthStr, idx) => {
            let pct = monthPercentages[idx];
            return (
              <div key={monthStr} className="flex items-center gap-3">
                {/* Month label */}
                <span className="text-[10px] font-bold text-slate-400 w-8 tracking-wider font-mono theme-annual-month">{monthStr}</span>
                
                {/* Progress bar */}
                <div className="flex-1 bg-slate-800/80 h-2 rounded-full overflow-hidden relative theme-annual-track">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-emerald-500 theme-annual-fill"
                    style={{ width: `${pct || 0}%` }}
                  />
                </div>
 
                {/* Percentage label */}
                <span className="text-[10px] font-mono font-bold w-8 text-right text-emerald-400 theme-annual-percent">
                  {pct || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
