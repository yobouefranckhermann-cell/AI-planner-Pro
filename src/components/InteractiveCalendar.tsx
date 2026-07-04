import React, { useState, useEffect } from 'react';
import { AppState, Task, DEFAULT_TASKS } from '../types';
import { 
  getTodayDateString, 
  formatFullFrenchDate, 
  MONTH_NAMES_FR, 
  parseSearchDate, 
  DAY_NAMES_FR 
} from '../utils/dateUtils';
import { Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Circle, CalendarDays } from 'lucide-react';

interface InteractiveCalendarProps {
  state: AppState;
  allTasks: Task[];
  textScale: number;
}

export default function InteractiveCalendar({ state, allTasks, textScale }: InteractiveCalendarProps) {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  // Active Calendar Month & Year views
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchQuery.trim()) return;

    const parsed = parseSearchDate(searchQuery);
    if (parsed) {
      setSelectedDate(parsed);
      const [y, m, d] = parsed.split('-').map(Number);
      setCurrentMonth(m - 1);
      setCurrentYear(y);
    } else {
      setSearchError('Format non reconnu. Utilisez "JJ/MM/AAAA", "hier" ou "aujourd\'hui".');
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Generate days in month grid
  const getDaysInMonthGrid = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday is 0
    // We want Monday (1) as the first column in French, so adjust:
    // JS: 0=D, 1=L, 2=M, 3=M, 4=J, 5=V, 6=S
    // FR Index: L=0, M=1, M=2, J=3, V=4, S=5, D=6
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    // Pad empty cells before 1st of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    // Add real days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  };

  // Check if date is in future
  const isFutureDate = (dateStr: string) => {
    return dateStr > todayStr;
  };

  // Get tasks and completion for selectedDate
  const getTasksForSelectedDate = () => {
    const progress = state.history[selectedDate];
    const isFuture = isFutureDate(selectedDate);

    if (isFuture) {
      return { isFuture: true, tasks: [], completedCount: 0 };
    }

    const completedIds = progress?.completedTaskIds || [];
    const tasksWithStatus = allTasks.map(t => ({
      ...t,
      done: completedIds.includes(t.id)
    }));

    const completedCount = tasksWithStatus.filter(t => t.done).length;

    return {
      isFuture: false,
      tasks: tasksWithStatus,
      completedCount
    };
  };

  const { isFuture, tasks, completedCount } = getTasksForSelectedDate();
  const daysGrid = getDaysInMonthGrid();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-[#0A0B0E] text-slate-200">
      
      {/* 1. SEARCH BAR */}
      <form onSubmit={handleSearch} className="flex flex-col gap-1.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un jour passé (ex. 30/06/2026, hier...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141C] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-500 shadow-3xs"
          />
          <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
          <button
            type="submit"
            className="absolute right-2.5 top-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase cursor-pointer transition-colors"
          >
            Voir
          </button>
        </div>
        {searchError && (
          <span className="text-[10px] text-red-400 font-medium pl-1">{searchError}</span>
        )}
      </form>

      {/* 2. CALENDAR COMPONENT */}
      <div className="bg-[#12141C] border border-slate-800/80 rounded-3xl p-4 shadow-xs">
        {/* Calendar Nav */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
              {MONTH_NAMES_FR[currentMonth]} {currentYear}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-[#0A0B0E] border border-slate-800 text-slate-400 hover:bg-[#161922] transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-[#0A0B0E] border border-slate-800 text-slate-400 hover:bg-[#161922] transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar Header (Days) */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase mb-2 font-mono">
          <span>L</span>
          <span>M</span>
          <span>M</span>
          <span>J</span>
          <span>V</span>
          <span>S</span>
          <span>D</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysGrid.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} />;
            }

            const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = cellDateStr === todayStr;
            const isSelected = cellDateStr === selectedDate;
            const isFutureDay = cellDateStr > todayStr;
            const progress = state.history[cellDateStr];
            
            // Completion rate color dot
            let bgStyle = "bg-transparent";
            let textStyle = "text-slate-300 font-semibold";

            if (isSelected) {
              bgStyle = "bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-950/40";
              textStyle = "text-white";
            } else if (isToday) {
              bgStyle = "bg-[#161922] text-emerald-400 border border-emerald-500/30";
            } else if (isFutureDay) {
              textStyle = "text-slate-600 font-medium";
            } else if (progress && progress.completedTaskIds.length > 0) {
              // Day completed something in the past
              bgStyle = "bg-[#10b981]/5 border border-emerald-500/20 text-emerald-400";
            }

            return (
              <button
                key={`day-${dayNum}`}
                onClick={() => setSelectedDate(cellDateStr)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all relative cursor-pointer ${bgStyle} ${textStyle}`}
              >
                <span>{dayNum}</span>
                {/* Visual tiny indicator dot if this day had completed tasks */}
                {!isSelected && progress && progress.completedTaskIds.length > 0 && (
                  <div className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-1 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DAY DETAILS */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">
          Bilan du {formatFullFrenchDate(selectedDate)} {selectedDate === todayStr ? "(Aujourd'hui)" : ""}
        </h4>

        {isFuture ? (
          <div className="bg-[#12141C] border border-slate-800 rounded-2xl p-6 text-center shadow-2xs flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-300">Pas de donnée sauvegardée pour le moment</p>
            <p className="text-[10px] text-slate-500">Vous ne pouvez pas valider de tâches pour les jours futurs.</p>
          </div>
        ) : (
          <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-2xs">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800/50 pb-2 mb-1 font-mono">
              <span>Statut des Tâches</span>
              <span className="text-emerald-400 font-bold">{completedCount} / {tasks.length} Validées</span>
            </div>

            {tasks.map((t, idx) => (
              <div key={t.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono w-4 text-right">{idx + 1}.</span>
                  <div className="flex flex-col">
                    <span className={`font-semibold text-slate-200 ${t.done ? 'line-through text-slate-500' : ''}`}>
                      {t.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium capitalize">{t.timeStart} • {t.period}</span>
                  </div>
                </div>
                {t.done ? (
                  <span className="text-green-400 font-bold text-[10px] flex items-center gap-0.5">
                    <CheckCircle2 size={10} /> Validée
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium text-[10px]">Non validée</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
