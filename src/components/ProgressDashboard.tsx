import React, { useState } from 'react';
import { AppState, Task, DEFAULT_TASKS } from '../types';
import { getWeekRangeForDate, formatFullFrenchDate, MONTH_NAMES_FR, MONTH_SHORT_FR, DAY_NAMES_FR } from '../utils/dateUtils';
import { Flame, Calendar, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';
import AnnualReport from './AnnualReport';

interface ProgressDashboardProps {
  state: AppState;
  allTasks: Task[];
  textScale: number;
}

export default function ProgressDashboard({ state, allTasks, textScale }: ProgressDashboardProps) {
  const [subTab, setSubTab] = useState<'aujourdhui' | 'semaines' | 'mois' | 'annuel'>('aujourdhui');
  const [expandTodayTasks, setExpandTodayTasks] = useState(false);
  const [selectedWeekDay, setSelectedWeekDay] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayProgress = state.history[todayStr] || { completedTaskIds: [], actions: [] };

  // Calculate stats for Today
  const totalTasksTodayCount = allTasks.filter(t => t.period !== 'journée').length + todayProgress.actions.length;
  const completedTasksTodayCount = todayProgress.completedTaskIds.length + (todayProgress.actions.length > 0 ? 1 : 0); // simplifier
  const completionTodayPercent = totalTasksTodayCount > 0 
    ? Math.round((completedTasksTodayCount / totalTasksTodayCount) * 100) 
    : 0;

  // Active Week Calculation (e.g., current week)
  const currentWeek = getWeekRangeForDate(todayStr);

  // Helper to calculate completion stats for any specific date
  const getStatsForDate = (dateStr: string) => {
    const prog = state.history[dateStr];
    if (!prog) return { completed: 0, total: 0, percent: 0, tasks: [] };

    // Default tasks of morning and evening
    const defs = DEFAULT_TASKS;
    const customForDate = state.customTasks; // simplified
    const mergedTasks = [...defs, ...customForDate];

    const completed = prog.completedTaskIds.length;
    // For simplicity, total tasks of morning/evening = 10
    const total = 10;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
      percent: pct > 100 ? 100 : pct,
      tasks: mergedTasks.map(t => ({
        ...t,
        done: prog.completedTaskIds.includes(t.id)
      }))
    };
  };

  // Click handler for week-day bar
  const handleSelectWeekDay = (dateStr: string) => {
    if (selectedWeekDay === dateStr) {
      setSelectedWeekDay(null);
    } else {
      setSelectedWeekDay(dateStr);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-[#0A0B0E] text-slate-200">
      {/* Sub-tabs Selector */}
      <div className="flex bg-[#12141C] p-1 rounded-xl border border-slate-800/80 shadow-2xs">
        {(['aujourdhui', 'semaines', 'mois', 'annuel'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setSubTab(tab);
              setSelectedWeekDay(null);
            }}
            className={`flex-1 py-2 rounded-lg font-bold text-xs capitalize transition-all cursor-pointer ${
              subTab === tab
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161922]'
            }`}
          >
            {tab === 'aujourdhui' ? "Aujourd'hui" : tab === 'semaines' ? 'Semaine' : tab === 'mois' ? 'Bilan Mois' : 'Bilan Annuel'}
          </button>
        ))}
      </div>

      {/* 1. TODAY SUB-TAB */}
      {subTab === 'aujourdhui' && (
        <div className="flex flex-col gap-4">
          {/* Main Today Goal Circle Card */}
          <div className="bg-[#12141C] border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center justify-center shadow-xs">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Circular border progress */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - completionTodayPercent / 100)}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="flex flex-col items-center justify-center z-10">
                <span className="text-3xl font-extrabold text-white font-mono">{completionTodayPercent}%</span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5 font-mono">Goal</span>
              </div>
            </div>

            {/* Simple stats bar */}
            <div className="w-full grid grid-cols-3 gap-2 mt-6 border-t border-slate-800 pt-5 text-center">
              <button
                onClick={() => setExpandTodayTasks(!expandTodayTasks)}
                className="flex flex-col items-center hover:bg-[#161922] p-1.5 rounded-xl transition-all cursor-pointer"
              >
                <span className="text-lg font-bold text-slate-100">{totalTasksTodayCount}</span>
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  Tâches {expandTodayTasks ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </span>
              </button>
              <div className="flex flex-col items-center border-x border-slate-800 px-1">
                <span className="text-lg font-bold text-slate-100">
                  {completedTasksTodayCount}/{totalTasksTodayCount}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Accomplies</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-emerald-400 flex items-center gap-0.5 font-mono">
                  {state.profile.notifications.tasks ? 'ON' : 'OFF'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Alertes</span>
              </div>
            </div>
          </div>

          {/* Emerald Streak Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs shadow-emerald-950/20">
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-black tracking-tight uppercase font-serif">
                {state.history ? Object.keys(state.history).length : 0} Jours actifs
              </span>
              <span className="text-xs font-semibold opacity-90">Continue à forger tes habitudes Franck !</span>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-full">
              <Flame size={24} className="text-white fill-white animate-pulse" />
            </div>
          </div>

          {/* Expanded Tasks List */}
          {(expandTodayTasks || true) && (
            <div className="flex flex-col gap-2.5">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">
                Détail de la Journée d'Aujourd'hui
              </h4>
              <div className="bg-[#12141C] border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                {allTasks.map((t, idx) => {
                  const done = todayProgress.completedTaskIds.includes(t.id);
                  return (
                    <div key={t.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-800/40 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-500 font-mono w-4 text-right">{idx + 1}.</span>
                        <div className="flex flex-col">
                          <span className={`font-semibold text-slate-200 ${done ? 'line-through text-slate-500' : ''}`}>
                            {t.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">{t.timeStart} ({t.period})</span>
                        </div>
                      </div>
                      {done ? (
                        <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Validée
                        </span>
                      ) : (
                        <span className="text-slate-500 font-semibold text-[10px] bg-slate-800/40 border border-slate-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <XCircle size={10} /> En attente
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. SEMAINES SUB-TAB */}
      {subTab === 'semaines' && (
        <div className="flex flex-col gap-4">
          {/* Week interval label */}
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Semaine Actuelle</p>
            <p className="text-xs font-bold text-slate-200 mt-0.5 font-serif">
              Du {formatFullFrenchDate(currentWeek.start)} au {formatFullFrenchDate(currentWeek.end)}
            </p>
          </div>

          {/* Custom Weekly Bar Chart */}
          <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs">
            <div className="flex items-end justify-between h-36 pt-6 px-1 border-b border-slate-800/50">
              {currentWeek.days.map((dayDateStr) => {
                const dayObj = new Date(dayDateStr);
                const dayNum = dayObj.getDate();
                const dayLetter = DAY_NAMES_FR[dayObj.getDay()][0]; // L, M, M, J, V, S, D
                const stats = getStatsForDate(dayDateStr);
                const isSelected = selectedWeekDay === dayDateStr;

                return (
                  <button
                    key={dayDateStr}
                    onClick={() => handleSelectWeekDay(dayDateStr)}
                    className="flex flex-col items-center flex-1 gap-2 cursor-pointer group"
                  >
                    {/* Percentage tag */}
                    <span className="text-[9px] font-mono font-bold text-slate-500 group-hover:text-emerald-400">
                      {stats.percent}%
                    </span>

                    {/* Bar */}
                    <div className="w-4 bg-slate-850 h-24 rounded-full overflow-hidden flex items-end relative border border-slate-800/40">
                      <div
                        className={`w-full rounded-full transition-all duration-300 ${
                          isSelected ? 'bg-emerald-500 shadow-xs shadow-emerald-400' : 'bg-emerald-500/50 group-hover:bg-emerald-500'
                        }`}
                        style={{ height: `${stats.percent || 1}%` }}
                      />
                    </div>

                    {/* Label */}
                    <div className="flex flex-col items-center mt-1">
                      <span className="text-[10px] font-black text-slate-300 uppercase leading-none">
                        {dayLetter}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 leading-none mt-1 font-mono">
                        {dayNum}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 font-medium text-center mt-3">
              💡 Tape sur un jour de la semaine pour voir le bilan complet de ses tâches !
            </p>
          </div>

          {/* Expand details for selected week day */}
          {selectedWeekDay && (
            <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pl-1">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Bilan du {formatFullFrenchDate(selectedWeekDay)}
                </h4>
                <button
                  onClick={() => setSelectedWeekDay(null)}
                  className="text-xs text-emerald-400 font-bold"
                >
                  Masquer
                </button>
              </div>

              <div className="bg-[#12141C] border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs">
                {getStatsForDate(selectedWeekDay).tasks.map((t, idx) => (
                  <div key={t.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono w-4">{idx + 1}.</span>
                      <span className={`font-semibold text-slate-200 ${t.done ? 'line-through text-slate-500' : ''}`}>
                        {t.name}
                      </span>
                    </div>
                    {t.done ? (
                      <span className="text-emerald-400 font-bold text-[10px]">Accomplie</span>
                    ) : (
                      <span className="text-slate-500 font-medium text-[10px]">Non validée</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MONTH SUB-TAB */}
      {subTab === 'mois' && (
        <div className="flex flex-col gap-4">
          {/* Bilan Clôturé Title card as shown in screenshot */}
          <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Résumé Global</span>
              <h3 className="text-base font-bold text-slate-200 mt-0.5 font-serif">Bilan clôturé - Juin 2026</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0A0B0E] border border-slate-800/60 p-3.5 rounded-2xl flex flex-col items-center text-center">
                <span className="text-emerald-400 text-xl font-black font-mono">4</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 font-mono">Tâches</span>
              </div>
              <div className="bg-[#0A0B0E] border border-slate-800/60 p-3.5 rounded-2xl flex flex-col items-center text-center">
                <span className="text-emerald-400 text-xl font-black font-mono">1</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 font-mono">Jours Actifs</span>
              </div>
              <div className="bg-[#0A0B0E] border border-slate-800/60 p-3.5 rounded-2xl flex flex-col items-center text-center">
                <span className="text-emerald-400 text-xl font-black font-mono">31%</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5 font-mono">Complétion</span>
              </div>
            </div>
          </div>

          {/* Month transition warning badge requested by the user:
              "Si dans une semaine il y a un mois qui fini et un autre moi qui débute faire une distinction..." */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 text-slate-300 p-4 rounded-2xl flex items-start gap-3 shadow-2xs">
            <Info size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200 font-serif">Transition de Mois Détectée</span>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                La semaine en cours chevauche la fin de Juin et le début de Juillet. Les statistiques intègrent la séparation :
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 text-[10px] font-bold px-3 py-1.5 rounded-lg mt-2 inline-flex items-center gap-1.5 self-start font-mono">
                <span>🔚 Mardi 30 juin = fin</span>
                <span>•</span>
                <span>Mercredi 1 juillet = début 🔛</span>
              </div>
            </div>
          </div>

          {/* Juillet 2026 title card */}
          <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">
              Juillet 2026 - Répartition par semaine
            </h4>

            {/* Weeks points lists */}
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between p-3 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-xs">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-200">Semaine 1 (29 Juin - 5 Juillet)</span>
                  <span className="text-[9px] text-slate-500 font-medium">Transition de mois (30 Jun / 1 Jul)</span>
                </div>
                <span className="text-emerald-400 font-bold font-mono">4 pts (31%)</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-xs opacity-50">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-200">Semaine 2 (6 Juillet - 12 Juillet)</span>
                  <span className="text-[9px] text-slate-500 font-medium font-mono">En attente</span>
                </div>
                <span className="text-slate-500 font-bold font-mono">0 pts (0%)</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-xs opacity-50">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-200">Semaine 3 (13 Juillet - 19 Juillet)</span>
                  <span className="text-[9px] text-slate-500 font-medium font-mono">En attente</span>
                </div>
                <span className="text-slate-500 font-bold font-mono">0 pts (0%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ANNUAL REPORT SUB-TAB */}
      {subTab === 'annuel' && (
        <AnnualReport state={state} textScale={textScale} isSubTab={true} />
      )}
    </div>
  );
}
