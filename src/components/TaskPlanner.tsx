import React, { useState } from 'react';
import { Task } from '../types';
import { PlusCircle, Clock, Trash2, Check, Star } from 'lucide-react';

interface TaskPlannerProps {
  customTasks: Task[];
  onAddCustomTask: (task: Omit<Task, 'id' | 'isDefault'>) => void;
  onDeleteCustomTask: (taskId: string) => void;
  textScale: number;
}

export default function TaskPlanner({
  customTasks,
  onAddCustomTask,
  onDeleteCustomTask,
  textScale,
}: TaskPlannerProps) {
  const [name, setName] = useState('');
  const [period, setPeriod] = useState<'matin' | 'journée' | 'soir'>('matin');
  const [timeStart, setTimeStart] = useState('06:00');
  const [timeEnd, setTimeEnd] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCustomTask({
      name: name.trim(),
      period,
      timeStart,
      timeEnd: timeEnd || undefined,
    });

    setName('');
    setTimeEnd('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-[#0A0B0E] text-slate-200">
      
      {/* 1. CREATION FORM */}
      <form onSubmit={handleSubmit} className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800/50 pb-3">
          <PlusCircle size={18} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">Ajouter une Nouvelle Tâche</h3>
        </div>

        {/* Task Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Nom de la tâche</label>
          <input
            type="text"
            placeholder="Ex. Méditation stoïcienne, Étude de code..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#0A0B0E] border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-500"
            required
          />
        </div>

        {/* Period selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Période de la journée</label>
          <div className="grid grid-cols-3 gap-2">
            {(['matin', 'journée', 'soir'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                  period === p
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-[#0A0B0E] border-slate-800 text-slate-400 hover:bg-[#161922]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Times configuration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Heure de début</label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className="bg-[#0A0B0E] border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Heure de fin (Optionnel)</label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className="bg-[#0A0B0E] border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200"
            />
          </div>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[11px] font-medium flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>Tâche ajoutée avec succès ! Elle apparaît maintenant dans vos listes.</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm mt-1"
        >
          Enregistrer la Tâche Personnalisée
        </button>
      </form>

      {/* 2. CUSTOM TASKS LIST */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 font-mono">
          Mes Tâches Personnalisées ({customTasks.length})
        </h4>

        {customTasks.length === 0 ? (
          <div className="border border-dashed border-slate-850 rounded-2xl p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
            <Star size={18} className="text-slate-600" />
            <span>Aucune tâche personnalisée créée pour le moment.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {customTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-[#0A0B0E] rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">{t.name}</span>
                    <span className="text-[10px] text-slate-500 capitalize font-mono">
                      {t.timeStart}{t.timeEnd ? ` - ${t.timeEnd}` : ''} • {t.period}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteCustomTask(t.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                  title="Supprimer la tâche"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
