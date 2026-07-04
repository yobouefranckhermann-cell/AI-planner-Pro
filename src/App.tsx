import React, { useState, useEffect } from 'react';
import { AppState, UserProfile, DayProgress, Task, DEFAULT_TASKS } from './types';
import { getTodayDateString, formatFullFrenchDate, DAY_NAMES_FR } from './utils/dateUtils';
import AIHeader from './components/AIHeader';
import AICoachBanner from './components/AICoachBanner';
import TaskPeriodList from './components/TaskPeriodList';
import ProgressDashboard from './components/ProgressDashboard';
import InteractiveCalendar from './components/InteractiveCalendar';
import AnnualReport from './components/AnnualReport';
import TaskPlanner from './components/TaskPlanner';
import SettingsPanel from './components/SettingsPanel';
import { 
  Sunrise, Sun, Moon, BarChart2, Calendar, Award, PlusCircle, Settings, 
  Sparkles, CheckCircle2 
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'ai_planner_pro_state_v1';

const INITIAL_PROFILE: UserProfile = {
  name: 'Franck',
  email: 'yobouefranckhermann@gmail.com',
  textScale: 1.0,
  notifications: {
    tasks: true,
    morning: true,
    evening: false,
  }
};

const INITIAL_HISTORY: { [date: string]: DayProgress } = {
  // Pre-seed June 30, 2026 to match screenshot completion percentage perfectly (31% or 4 tasks completed)
  '2026-06-30': {
    date: '2026-06-30',
    completedTaskIds: ['m1', 'm2', 'm3', 'm4'], // Early Waking, Prière, Méditation, Sport
    actions: [],
    journal: "Bilan positif. Réveil de fer, méditation concentrée."
  },
  // Add today with empty completed tasks to begin fresh
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'matin' | 'journée' | 'soir' | 'progres' | 'calendrier' | 'annee' | 'planificateur' | 'reglages'>('matin');
  
  // App state
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<{ [date: string]: DayProgress }>(INITIAL_HISTORY);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Clock
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  // 1. DIGITAL CLOCK & LIVE DATE
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Formatting time HH:MM:SS
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);

      // French Date format
      const todayStr = getTodayDateString();
      setCurrentDateStr(formatFullFrenchDate(todayStr));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. STATE PERSISTENCE (LOCAL STORAGE)
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: AppState = JSON.parse(stored);
        let loadedTasks = parsed.customTasks || [];
        
        // Migrate defaults to customTasks so they are fully editable
        const hasDefaults = loadedTasks.some(t => t.id === 'm1' || t.id === 's1');
        if (!hasDefaults && loadedTasks.length === 0) {
          loadedTasks = [...DEFAULT_TASKS];
        } else if (!hasDefaults) {
          loadedTasks = [...DEFAULT_TASKS, ...loadedTasks];
        }
        setCustomTasks(loadedTasks);

        if (parsed.profile) {
          setProfile({
            ...INITIAL_PROFILE,
            ...parsed.profile,
            theme: parsed.profile.theme || 'noir' // Default to noir
          });
        } else {
          setProfile({ ...INITIAL_PROFILE, theme: 'noir' });
        }
        
        // Merge stored history with the default seeded history
        if (parsed.history) {
          setHistory({
            ...INITIAL_HISTORY,
            ...parsed.history
          });
        }
        if (parsed.chatMessages) setChatMessages(parsed.chatMessages);
      } catch (e) {
        console.error('Error loading state from localStorage', e);
      }
    } else {
      // First run: save standard seeds
      const defaultState: AppState = {
        profile: { ...INITIAL_PROFILE, theme: 'noir' },
        customTasks: [...DEFAULT_TASKS],
        history: INITIAL_HISTORY,
        chatMessages: [],
      };
      setCustomTasks([...DEFAULT_TASKS]);
      setProfile({ ...INITIAL_PROFILE, theme: 'noir' });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultState));
    }
  }, []);

  // Sync to local storage whenever state changes
  const saveStateToLocalStorage = (
    updatedProfile: UserProfile,
    updatedCustomTasks: Task[],
    updatedHistory: { [date: string]: DayProgress }
  ) => {
    const fullState: AppState = {
      profile: updatedProfile,
      customTasks: updatedCustomTasks,
      history: updatedHistory,
      chatMessages,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fullState));
  };

  // 3. SYNC WITH BACKEND CLOUD DATABASE FOR GMAIL USER
  const syncWithCloudServer = async (): Promise<{ success: boolean; message: string }> => {
    if (!profile.email) {
      return { success: false, message: 'Email requis pour la synchronisation.' };
    }

    try {
      const stateToSave = {
        profile,
        customTasks,
        history,
        chatMessages,
      };

      const response = await fetch(`/api/state?email=${encodeURIComponent(profile.email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateToSave),
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, message: 'Données sauvegardées en ligne avec succès !' };
      } else {
        return { success: false, message: `Échec de sauvegarde : ${data.message}` };
      }
    } catch (e: any) {
      console.error('Error syncing with cloud', e);
      return { success: false, message: `Erreur serveur : ${e.message}` };
    }
  };

  // Fetch from Cloud (Restore)
  const fetchStateFromCloud = async (email: string) => {
    try {
      const response = await fetch(`/api/state?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (data.success && data.state) {
        const cloudState: AppState = data.state;
        if (cloudState.profile) setProfile(cloudState.profile);
        if (cloudState.customTasks) setCustomTasks(cloudState.customTasks);
        if (cloudState.history) setHistory(cloudState.history);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudState));
        return { success: true, message: 'Vos données cloud ont été restaurées avec succès !' };
      } else {
        return { success: false, message: 'Aucun profil trouvé en ligne. Synchronisation locale activée.' };
      }
    } catch (e: any) {
      return { success: false, message: `Erreur de restauration : ${e.message}` };
    }
  };

  // 4. HANDLERS FOR TASK INTERACTION
  const handleToggleTask = (taskId: string) => {
    const todayStr = getTodayDateString();
    const todayProgress = history[todayStr] || { completedTaskIds: [], actions: [] };
    
    let updatedCompletedIds = [...todayProgress.completedTaskIds];
    if (updatedCompletedIds.includes(taskId)) {
      updatedCompletedIds = updatedCompletedIds.filter(id => id !== taskId);
    } else {
      updatedCompletedIds.push(taskId);
    }

    const updatedHistory = {
      ...history,
      [todayStr]: {
        ...todayProgress,
        date: todayStr,
        completedTaskIds: updatedCompletedIds,
      }
    };

    setHistory(updatedHistory);
    saveStateToLocalStorage(profile, customTasks, updatedHistory);
  };

  const handleAddTodayAction = (actionName: string) => {
    const todayStr = getTodayDateString();
    const todayProgress = history[todayStr] || { completedTaskIds: [], actions: [] };

    const updatedHistory = {
      ...history,
      [todayStr]: {
        ...todayProgress,
        date: todayStr,
        actions: [...(todayProgress.actions || []), actionName]
      }
    };

    setHistory(updatedHistory);
    saveStateToLocalStorage(profile, customTasks, updatedHistory);
  };

  const handleToggleTodayAction = (index: number) => {
    // For today actions, we can store completed index or state.
    // Let's use the journal or another field, or just toggle by name suffix or custom completedTaskIds.
    // For simplicity, we toggle a "check" state on custom actions by checking if completedTaskIds has custom_action_idx
    const todayStr = getTodayDateString();
    const todayProgress = history[todayStr] || { completedTaskIds: [], actions: [] };
    const actionId = `custom_action_${index}`;

    let updatedCompletedIds = [...todayProgress.completedTaskIds];
    if (updatedCompletedIds.includes(actionId)) {
      updatedCompletedIds = updatedCompletedIds.filter(id => id !== actionId);
    } else {
      updatedCompletedIds.push(actionId);
    }

    const updatedHistory = {
      ...history,
      [todayStr]: {
        ...todayProgress,
        date: todayStr,
        completedTaskIds: updatedCompletedIds,
      }
    };

    setHistory(updatedHistory);
    saveStateToLocalStorage(profile, customTasks, updatedHistory);
  };

  const handleDeleteTodayAction = (index: number) => {
    const todayStr = getTodayDateString();
    const todayProgress = history[todayStr] || { completedTaskIds: [], actions: [] };

    // Remove the action from the list
    const updatedActions = (todayProgress.actions || []).filter((_, idx) => idx !== index);

    // Also adjust indices in completedTaskIds
    const completedActionId = `custom_action_${index}`;
    const updatedCompletedIds = todayProgress.completedTaskIds
      .filter(id => id !== completedActionId)
      .map(id => {
        if (id.startsWith('custom_action_')) {
          const idx = parseInt(id.replace('custom_action_', ''), 10);
          if (idx > index) {
            return `custom_action_${idx - 1}`;
          }
        }
        return id;
      });

    const updatedHistory = {
      ...history,
      [todayStr]: {
        ...todayProgress,
        date: todayStr,
        actions: updatedActions,
        completedTaskIds: updatedCompletedIds,
      }
    };

    setHistory(updatedHistory);
    saveStateToLocalStorage(profile, customTasks, updatedHistory);
  };

  const handleUpdateCustomTask = (updatedTask: Task) => {
    const updatedCustom = customTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setCustomTasks(updatedCustom);
    saveStateToLocalStorage(profile, updatedCustom, history);
  };

  const handlePlanFutureAction = (actionName: string, dateStr: string) => {
    // Adds a planned task directly into the specific history date
    const targetProgress = history[dateStr] || { completedTaskIds: [], actions: [] };

    const updatedHistory = {
      ...history,
      [dateStr]: {
        ...targetProgress,
        date: dateStr,
        actions: [...(targetProgress.actions || []), actionName]
      }
    };

    setHistory(updatedHistory);
    saveStateToLocalStorage(profile, customTasks, updatedHistory);
  };

  // 5. PROFILE & CUSTOM TASKS HANDLERS
  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveStateToLocalStorage(newProfile, customTasks, history);

    // If email changed, try to auto-fetch existing data in background
    if (newProfile.email !== profile.email) {
      fetchStateFromCloud(newProfile.email);
    }
  };

  const handleAddCustomTask = (taskData: Omit<Task, 'id' | 'isDefault'>) => {
    const newTask: Task = {
      ...taskData,
      id: `c_${Date.now()}`,
      isDefault: false,
    };
    const updatedCustom = [...customTasks, newTask];
    setCustomTasks(updatedCustom);
    saveStateToLocalStorage(profile, updatedCustom, history);
  };

  const handleDeleteCustomTask = (taskId: string) => {
    const updatedCustom = customTasks.filter(t => t.id !== taskId);
    setCustomTasks(updatedCustom);
    saveStateToLocalStorage(profile, updatedCustom, history);
  };

  // 6. BACKUP FILE EXPORT/IMPORT
  const handleExportData = () => {
    const fullState: AppState = { profile, customTasks, history, chatMessages };
    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_planner_pro_sauvegarde_${profile.name.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed: AppState = JSON.parse(e.target?.result as string);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.customTasks) setCustomTasks(parsed.customTasks);
        if (parsed.history) setHistory(parsed.history);
        saveStateToLocalStorage(parsed.profile, parsed.customTasks, parsed.history);
        alert('Données importées avec succès !');
      } catch (err) {
        alert('Format de fichier invalide.');
      }
    };
    reader.readAsText(file);
  };

  // Assemble all active tasks. If they are already migrated, just use customTasks.
  const allActiveTasks = customTasks.some(t => t.id === 'm1' || t.id === 's1')
    ? customTasks
    : [...DEFAULT_TASKS, ...customTasks];

  // Calculate stats for today
  const todayStr = getTodayDateString();
  const todayProgress = history[todayStr] || { completedTaskIds: [], actions: [] };
  
  // Filter out custom_action_ index from completedTaskIds
  const completedTasksToday = allActiveTasks.filter(t => todayProgress.completedTaskIds.includes(t.id));
  const pendingTasksToday = allActiveTasks.filter(t => !todayProgress.completedTaskIds.includes(t.id));

  const completedTodayActions = (todayProgress.actions || []).filter((_, idx) => 
    todayProgress.completedTaskIds.includes(`custom_action_${idx}`)
  );

  const completedCount = completedTasksToday.length + completedTodayActions.length;
  const totalCount = allActiveTasks.filter(t => t.period !== 'journée').length + (todayProgress.actions || []).length;

  return (
    <div 
      className={`w-full min-h-screen bg-slate-950 flex justify-center items-center py-0 sm:py-8 font-sans transition-all selection:bg-[#f15a24] selection:text-white theme-${profile.theme || 'noir'}`}
      style={{ fontSize: `${profile.textScale}rem` }}
    >
      {/* Phone container */}
      <div className={`w-full sm:max-w-md h-screen sm:h-[850px] bg-white flex flex-col relative sm:rounded-[40px] sm:shadow-2xl overflow-hidden border-4 border-slate-900/10 theme-${profile.theme || 'noir'}`}>
        
        {/* Dynamic header with Digital Ticking clock, streak and percentage */}
        <AIHeader
          currentDateStr={currentDateStr}
          currentTimeStr={currentTime}
          streak={Object.keys(history).length}
          completedCount={completedCount}
          totalCount={totalCount}
        />

        {/* Dynamic AI Coach chatbot banner */}
        <AICoachBanner
          userName={profile.name}
          currentTimeStr={currentTime}
          completedTasks={completedTasksToday.map(t => t.name)}
          pendingTasks={pendingTasksToday.map(t => t.name)}
          streak={Object.keys(history).length}
          currentDateStr={currentDateStr}
          textScale={profile.textScale}
        />

        {/* TABS CONTAINER (MAIN VIEWPORTS) */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
          {activeTab === 'matin' && (
            <TaskPeriodList
              period="matin"
              allTasks={allActiveTasks}
              completedTaskIds={todayProgress.completedTaskIds}
              onToggleTask={handleToggleTask}
              onAddTodayAction={handleAddTodayAction}
              onPlanFutureAction={handlePlanFutureAction}
              onDeleteTodayAction={handleDeleteTodayAction}
              todayActions={todayProgress.actions || []}
              onToggleTodayAction={handleToggleTodayAction}
              completedTodayActionsIndices={(todayProgress.actions || [])
                .map((_, idx) => idx)
                .filter(idx => todayProgress.completedTaskIds.includes(`custom_action_${idx}`))}
              textScale={profile.textScale}
            />
          )}

          {activeTab === 'journée' && (
            <TaskPeriodList
              period="journée"
              allTasks={allActiveTasks}
              completedTaskIds={todayProgress.completedTaskIds}
              onToggleTask={handleToggleTask}
              onAddTodayAction={handleAddTodayAction}
              onPlanFutureAction={handlePlanFutureAction}
              onDeleteTodayAction={handleDeleteTodayAction}
              todayActions={todayProgress.actions || []}
              onToggleTodayAction={handleToggleTodayAction}
              completedTodayActionsIndices={(todayProgress.actions || [])
                .map((_, idx) => idx)
                .filter(idx => todayProgress.completedTaskIds.includes(`custom_action_${idx}`))}
              textScale={profile.textScale}
            />
          )}

          {activeTab === 'soir' && (
            <TaskPeriodList
              period="soir"
              allTasks={allActiveTasks}
              completedTaskIds={todayProgress.completedTaskIds}
              onToggleTask={handleToggleTask}
              onAddTodayAction={handleAddTodayAction}
              onPlanFutureAction={handlePlanFutureAction}
              onDeleteTodayAction={handleDeleteTodayAction}
              todayActions={todayProgress.actions || []}
              onToggleTodayAction={handleToggleTodayAction}
              completedTodayActionsIndices={(todayProgress.actions || [])
                .map((_, idx) => idx)
                .filter(idx => todayProgress.completedTaskIds.includes(`custom_action_${idx}`))}
              textScale={profile.textScale}
            />
          )}

          {activeTab === 'progres' && (
            <ProgressDashboard
              state={{ profile, customTasks, history, chatMessages }}
              allTasks={allActiveTasks}
              textScale={profile.textScale}
            />
          )}

          {activeTab === 'calendrier' && (
            <InteractiveCalendar
              state={{ profile, customTasks, history, chatMessages }}
              allTasks={allActiveTasks}
              textScale={profile.textScale}
            />
          )}

          {activeTab === 'annee' && (
            <AnnualReport
              state={{ profile, customTasks, history, chatMessages }}
              textScale={profile.textScale}
            />
          )}

          {activeTab === 'planificateur' && (
            <TaskPlanner
              customTasks={customTasks}
              onAddCustomTask={handleAddCustomTask}
              onDeleteCustomTask={handleDeleteCustomTask}
              onUpdateCustomTask={handleUpdateCustomTask}
              textScale={profile.textScale}
            />
          )}

          {activeTab === 'reglages' && (
            <SettingsPanel
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onSyncWithServer={syncWithCloudServer}
              onExportData={handleExportData}
              onImportData={handleImportData}
              textScale={profile.textScale}
            />
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="bg-white border-t border-gray-100 px-2 py-3 flex justify-between items-center shadow-lg rounded-b-[40px] overflow-x-auto gap-1 select-none">
          {/* Matin Tab */}
          <button
            onClick={() => setActiveTab('matin')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'matin' ? 'text-[#f15a24] font-bold bg-[#f15a24]/5' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Sunrise size={18} />
            <span className="text-[10px] tracking-tight">Matin</span>
          </button>

          {/* Journée Tab */}
          <button
            onClick={() => setActiveTab('journée')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'journée' ? 'text-[#f15a24] font-bold bg-[#f15a24]/5' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Sun size={18} />
            <span className="text-[10px] tracking-tight font-medium">Jour</span>
          </button>

          {/* Soir Tab */}
          <button
            onClick={() => setActiveTab('soir')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'soir' ? 'text-[#f15a24] font-bold bg-[#f15a24]/5' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Moon size={18} />
            <span className="text-[10px] tracking-tight">Soir</span>
          </button>

          {/* Progress Tab */}
          <button
            onClick={() => setActiveTab('progres')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'progres' ? 'text-[#f15a24] font-bold bg-[#f15a24]/5' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <BarChart2 size={18} />
            <span className="text-[10px] tracking-tight">Progrès</span>
          </button>

          {/* Calendrier Tab */}
          <button
            onClick={() => setActiveTab('calendrier')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'calendrier' ? 'text-[#f15a24] font-bold bg-[#f15a24]/5' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Calendar size={18} />
            <span className="text-[10px] tracking-tight">Calendrier</span>
          </button>

          {/* Année Tab */}
          <button
            onClick={() => setActiveTab('annee')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'annee' ? 'text-[#f15a24] font-bold bg-[#f15a24]/5' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Award size={18} />
            <span className="text-[10px] tracking-tight">Année</span>
          </button>

          {/* Planificateur Tab */}
          <button
            onClick={() => setActiveTab('planificateur')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'planificateur' ? 'text-[#f15a24] font-bold bg-[#f15a24]/5' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <PlusCircle size={18} />
            <span className="text-[10px] tracking-tight">Ajouter</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setActiveTab('reglages')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'reglages' ? 'text-[#f15a24] font-bold bg-[#f15a24]/5' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Settings size={18} />
            <span className="text-[10px] tracking-tight">Réglages</span>
          </button>
        </div>

      </div>
    </div>
  );
}
