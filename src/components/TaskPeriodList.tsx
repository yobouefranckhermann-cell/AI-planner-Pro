import React, { useState } from 'react';
import { Task, DayProgress } from '../types';
import { Plus, Calendar, Check, Circle, AlertCircle, Sparkles } from 'lucide-react';

interface TaskPeriodListProps {
  period: 'matin' | 'journée' | 'soir';
  allTasks: Task[];
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
  // Day-period specific actions
  onAddTodayAction: (name: string) => void;
  onPlanFutureAction: (name: string, dateStr: string) => void;
  todayActions: string[];
  onToggleTodayAction: (index: number) => void;
  completedTodayActionsIndices: number[];
  textScale: number;
}

export default function TaskPeriodList({
  period,
  allTasks,
  completedTaskIds,
  onToggleTask,
  onAddTodayAction,
  onPlanFutureAction,
  todayActions,
  onToggleTodayAction,
  completedTodayActionsIndices,
  textScale,
}: TaskPeriodListProps) {
  const [newAction, setNewAction] = useState('');
  const [futureActionName, setFutureActionName] = useState('');
  const [futureActionDate, setFutureActionDate] = useState('');
  const [showFuturePlanner, setShowFuturePlanner] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const filteredTasks = allTasks.filter((t) => t.period === period);

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim()) return;
    onAddTodayAction(newAction.trim());
    setNewAction('');
  };

  const handlePlanFuture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!futureActionName.trim() || !futureActionDate) return;
    onPlanFutureAction(futureActionName.trim(), futureActionDate);
    setSuccessMsg(`Tâche planifiée pour le ${new Date(futureActionDate).toLocaleDateString('fr-FR')} !`);
    setFutureActionName('');
    setFutureActionDate('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Organize Morning Tasks into sections
  const getMorningSections = (tasks: Task[]) => {
    return [
      {
        title: '⏰ RÉVEIL & SPIRITUALITÉ',
        tasks: tasks.filter((t) => ['m1', 'm2', 'm3'].includes(t.id) || (t.isDefault === false && t.id.startsWith('c_'))),
      },
      {
        title: '🏋️ SPORT & CORPS',
        tasks: tasks.filter((t) => ['m4', 'm5'].includes(t.id)),
      },
      {
        title: '📚 ENSEIGNEMENT & FORMATION',
        tasks: tasks.filter((t) => t.id === 'm6'),
      },
    ].filter((s) => s.tasks.length > 0);
  };

  // Organize Evening Tasks into sections
  const getEveningSections = (tasks: Task[]) => {
    return [
      {
        title: '🛁 HYGIÈNE & DÉTENTE',
        tasks: tasks.filter((t) => t.id === 's1' || (t.isDefault === false && t.id.startsWith('c_'))),
      },
      {
        title: '💻 FORMATION DU SOIR',
        tasks: tasks.filter((t) => t.id === 's2'),
      },
      {
        title: '📖 LECTURE & JOURNAL',
        tasks: tasks.filter((t) => ['s3', 's4'].includes(t.id)),
      },
    ].filter((s) => s.tasks.length > 0);
  };

  const renderTaskCard = (t: Task) => {
    const isCompleted = completedTaskIds.includes(t.id);
    return (
      <button
        key={t.id}
        onClick={() => onToggleTask(t.id)}
        className={`w-full flex items-center justify-between p-4 bg-[#12141C] rounded-2xl border transition-all cursor-pointer text-left ${
          isCompleted
            ? 'border-emerald-500/30 bg-[#10b981]/5 shadow-xs shadow-emerald-950/20'
            : 'border-slate-800 hover:border-slate-700 hover:bg-[#161922] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Custom Checkbox circle */}
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-700 bg-[#0A0B0E]'
            }`}
          >
            {isCompleted && <Check size={14} className="text-white font-extrabold" />}
          </div>

          <div className="flex flex-col">
            <span
              className={`font-semibold text-slate-200 transition-all ${
                isCompleted ? 'line-through text-slate-500' : ''
              }`}
              style={{ fontSize: `${textScale * 0.85}rem` }}
            >
              {t.name}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-medium">
              {t.timeStart}
              {t.timeEnd ? ` - ${t.timeEnd}` : ''}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 bg-[#0A0B0E] text-slate-200">
      {period === 'matin' && (
        <div className="flex flex-col gap-6">
          {getMorningSections(filteredTasks).map((section) => (
            <div key={section.title} className="flex flex-col gap-2.5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">
                {section.title}
              </h3>
              <div className="flex flex-col gap-2.5">
                {section.tasks.map(renderTaskCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {period === 'soir' && (
        <div className="flex flex-col gap-6">
          {getEveningSections(filteredTasks).map((section) => (
            <div key={section.title} className="flex flex-col gap-2.5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">
                {section.title}
              </h3>
              <div className="flex flex-col gap-2.5">
                {section.tasks.map(renderTaskCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {period === 'journée' && (
        <div className="flex flex-col gap-5">
          {/* Action du jour Planner Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-100" />
              <h3 className="font-bold text-sm tracking-tight text-white font-serif">Planificateur en Journée</h3>
            </div>
            <p className="text-[10px] text-emerald-100/95 mt-1 leading-relaxed">
              Planifie tes actions du jour ou projette des tâches dans le futur pour qu'elles apparaissent automatiquement sur ton calendrier !
            </p>
          </div>

          {/* Quick Add for Today */}
          <form onSubmit={handleAddAction} className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">
              🎯 Action d'aujourd'hui
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex. Réunion de travail, Préparer dossier..."
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="flex-1 bg-[#12141C] border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 text-white p-2.5 rounded-xl hover:bg-emerald-600 shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          </form>

          {/* Today's Custom Actions List */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">
              📋 Actions du Jour
            </h4>
            {todayActions.length === 0 ? (
              <div className="bg-[#12141C] border border-dashed border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-500">
                Aucune action facultative ajoutée pour aujourd'hui.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {todayActions.map((action, idx) => {
                  const isDone = completedTodayActionsIndices.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => onToggleTodayAction(idx)}
                      className={`w-full flex items-center gap-3 p-3.5 bg-[#12141C] rounded-xl border text-left transition-all cursor-pointer ${
                        isDone
                          ? 'border-emerald-500/20 bg-[#10b981]/5 shadow-2xs'
                          : 'border-slate-800 hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
                        }`}
                      >
                        {isDone && <Check size={12} className="text-white font-bold" />}
                      </div>
                      <span
                        className={`text-xs font-semibold text-slate-200 ${
                          isDone ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {action}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toggle for Future Planner */}
          <button
            onClick={() => setShowFuturePlanner(!showFuturePlanner)}
            className="w-full py-2.5 bg-[#12141C] hover:bg-[#161922] rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-800"
          >
            <Calendar size={14} />
            <span>{showFuturePlanner ? 'Masquer le planificateur futur' : 'Planifier pour le futur'}</span>
          </button>

          {/* Future Planner Form */}
          {showFuturePlanner && (
            <form onSubmit={handlePlanFuture} className="bg-[#12141C] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-slate-200 font-serif">Planifier une Tâche Future</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Description de l'action</label>
                <input
                  type="text"
                  placeholder="Ex. Rdv dentiste, Bilan mensuel..."
                  value={futureActionName}
                  onChange={(e) => setFutureActionName(e.target.value)}
                  className="bg-[#0A0B0E] border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Date d'exécution</label>
                <input
                  type="date"
                  value={futureActionDate}
                  onChange={(e) => setFutureActionDate(e.target.value)}
                  className="bg-[#0A0B0E] border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200"
                  required
                />
              </div>

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5">
                  <Check size={12} />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm mt-1"
              >
                Sauvegarder dans le Calendrier
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
