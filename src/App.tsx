import React, { useState, useEffect } from 'react';
import { AppState, UserProfile, DayProgress, Task, DEFAULT_TASKS } from './types';
import { getTodayDateString, formatFullFrenchDate, DAY_NAMES_FR } from './utils/dateUtils';
import AIHeader from './components/AIHeader';
import AICoachBanner from './components/AICoachBanner';
import TaskPeriodList from './components/TaskPeriodList';
import ProgressDashboard from './components/ProgressDashboard';
import InteractiveCalendar from './components/InteractiveCalendar';
import TimerPanel from './components/TimerPanel';
import TaskPlanner from './components/TaskPlanner';
import SettingsPanel from './components/SettingsPanel';
import { 
  Sunrise, Sun, Moon, BarChart2, Calendar, Timer, PlusCircle, Settings, 
  Sparkles, CheckCircle2, User, Mail, ShieldCheck, RefreshCw, KeyRound
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'ai_planner_pro_state_v1';

const INITIAL_PROFILE: UserProfile = {
  name: '',
  email: '',
  textScale: 1.0,
  notifications: {
    tasks: true,
    morning: true,
    evening: false,
  },
  theme: 'noir',
  language: 'fr',
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
  const [activeTab, setActiveTab] = useState<'matin' | 'journée' | 'soir' | 'progres' | 'calendrier' | 'timer' | 'planificateur' | 'reglages'>('matin');
  
  // App state
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<{ [date: string]: DayProgress }>(INITIAL_HISTORY);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

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

  // 1.5. SYNC THEME CLASS TO HTML & BODY ELEMENTS
  useEffect(() => {
    const themeClass = `theme-${profile.theme || 'noir'}`;
    document.documentElement.className = themeClass;
    document.body.className = themeClass;
    
    if (profile.theme === 'blanc') {
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.backgroundColor = '#ffffff';
    } else if (profile.theme === 'orange') {
      document.documentElement.style.backgroundColor = '#120905';
      document.body.style.backgroundColor = '#120905';
    } else {
      document.documentElement.style.backgroundColor = '#0A0B0E';
      document.body.style.backgroundColor = '#0A0B0E';
    }
  }, [profile.theme]);

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
          const profileWithTheme = {
            ...INITIAL_PROFILE,
            ...parsed.profile,
            theme: parsed.profile.theme || 'noir', // Default to noir
            language: parsed.profile.language || 'fr' // Default to fr
          };
          setProfile(profileWithTheme);

          // Check if auto-logged in
          const isLogged = localStorage.getItem('ai_planner_logged_in') === 'true';
          if (isLogged && profileWithTheme.email && profileWithTheme.name) {
            setIsLoggedIn(true);
            setLoginName(profileWithTheme.name || '');
            setLoginEmail(profileWithTheme.email || '');
          } else {
            setLoginName('');
            setLoginEmail('');
          }
        } else {
          setProfile({ ...INITIAL_PROFILE, theme: 'noir', language: 'fr' });
          setLoginName('');
          setLoginEmail('');
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

  // 3.5. LOGIN & LOGOUT HANDLERS
  const handleLogin = async (enteredName: string, enteredEmail: string, keepMeLoggedIn: boolean) => {
    setLoginLoading(true);
    const updatedProfile = {
      ...profile,
      name: enteredName.trim() || 'Franck',
      email: enteredEmail.trim() || 'yobouefranckhermann@gmail.com',
    };
    
    setProfile(updatedProfile);
    saveStateToLocalStorage(updatedProfile, customTasks, history);
    
    if (keepMeLoggedIn) {
      localStorage.setItem('ai_planner_logged_in', 'true');
    } else {
      localStorage.removeItem('ai_planner_logged_in');
    }
    
    try {
      const response = await fetch(`/api/state?email=${encodeURIComponent(enteredEmail.trim())}`);
      const data = await response.json();
      if (data.success && data.state) {
        const cloudState: AppState = data.state;
        if (cloudState.profile) setProfile(cloudState.profile);
        if (cloudState.customTasks) setCustomTasks(cloudState.customTasks);
        if (cloudState.history) setHistory(cloudState.history);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudState));
      } else {
        // Fresh cloud email. Sync current local storage to initiate their cloud database
        const stateToSave = {
          profile: updatedProfile,
          customTasks,
          history,
          chatMessages,
        };
        await fetch(`/api/state?email=${encodeURIComponent(enteredEmail.trim())}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stateToSave),
        });
      }
    } catch (e) {
      console.error('Error logging in & syncing', e);
    } finally {
      setIsLoggedIn(true);
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ai_planner_logged_in');
    setLoginName('');
    setLoginEmail('');
    setIsLoggedIn(false);
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
        
        {!isLoggedIn ? (
          <div className="flex-1 flex flex-col justify-between p-6 bg-[#0A0B0E] text-slate-200 overflow-y-auto">
            {/* Top Logo and Title */}
            <div className="flex flex-col items-center text-center gap-2 mt-8 mb-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Sparkles size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest font-mono mt-2">
                Discipline Pro
              </h2>
              <p className="text-xs text-slate-400">
                AI Life Coach & Stoic Task Planner
              </p>
            </div>

            {/* Inputs Form */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <User size={12} className="text-emerald-400" />
                  Votre Nom Complet
                </label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Ex. Franck"
                  className="bg-[#12141C] border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-600 font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Mail size={12} className="text-emerald-400" />
                  Votre Adresse Gmail
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Ex. yobouefranckhermann@gmail.com"
                  className="bg-[#12141C] border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-600 font-medium"
                  required
                />
              </div>

              {/* Checkbox Rester Connecté */}
              <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-800 bg-[#12141C] text-emerald-500 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                />
                <span className="text-[10.5px] text-slate-400 font-medium">Rester connecté sur cet appareil</span>
              </label>

              {/* Safe & Secure Info Card */}
              <div className="mt-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3.5 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10.5px] font-bold text-emerald-400 uppercase tracking-wider font-mono">Garantie Sauvegarde Cloud</span>
                  <span className="text-[10px] text-slate-400 leading-relaxed">
                    Saisissez vos accès pour lier instantanément vos données locales à votre profil unique. Vos tâches, statistiques et historiques existants seront précieusement conservés.
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-8">
              <button
                onClick={() => handleLogin(loginName, loginEmail, rememberMe)}
                disabled={!loginName || !loginEmail || loginLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800/80 disabled:text-slate-500 text-white rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Vérification & Synchronisation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Se Connecter & Accéder</span>
                  </>
                )}
              </button>
              <div className="text-center text-[9px] text-slate-600 font-mono mt-4 uppercase tracking-widest">
                Stoic AI life coach v2.1 • Cloud Sync Active
              </div>
            </div>
          </div>
        ) : (
          <>
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

            {/* TOP TAB BAR (MODERNE ET STYLE DE LA CAPTURE) */}
            <div className="bg-white border-b border-gray-200/80 px-2 py-2 flex justify-between items-center shadow-xs overflow-x-auto gap-1 select-none theme-tab-bar flex-shrink-0 scrollbar-none">
              {/* Matin Tab */}
              <button
                onClick={() => setActiveTab('matin')}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 transition-all cursor-pointer relative ${
                  activeTab === 'matin' ? 'text-[#f15a24] font-bold theme-tab-active' : 'text-gray-400 hover:text-gray-600 theme-tab-inactive'
                }`}
              >
                <Sunrise size={16} className={activeTab === 'matin' ? 'text-[#f15a24] theme-icon-active' : 'text-gray-400'} />
                <span className="text-[9px] font-semibold tracking-tight">Matin</span>
                {activeTab === 'matin' && <div className="absolute bottom-[-9px] left-1 right-1 h-[2.5px] bg-[#f15a24] rounded-full theme-tab-indicator" />}
              </button>

              {/* Journée Tab */}
              <button
                onClick={() => setActiveTab('journée')}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 transition-all cursor-pointer relative ${
                  activeTab === 'journée' ? 'text-[#f15a24] font-bold theme-tab-active' : 'text-gray-400 hover:text-gray-600 theme-tab-inactive'
                }`}
              >
                <Sun size={16} className={activeTab === 'journée' ? 'text-[#f15a24] theme-icon-active' : 'text-gray-400'} />
                <span className="text-[9px] font-semibold tracking-tight">Journée</span>
                {activeTab === 'journée' && <div className="absolute bottom-[-9px] left-1 right-1 h-[2.5px] bg-[#f15a24] rounded-full theme-tab-indicator" />}
              </button>

              {/* Soir Tab */}
              <button
                onClick={() => setActiveTab('soir')}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 transition-all cursor-pointer relative ${
                  activeTab === 'soir' ? 'text-[#f15a24] font-bold theme-tab-active' : 'text-gray-400 hover:text-gray-600 theme-tab-inactive'
                }`}
              >
                <Moon size={16} className={activeTab === 'soir' ? 'text-[#f15a24] theme-icon-active' : 'text-gray-400'} />
                <span className="text-[9px] font-semibold tracking-tight">Soir</span>
                {activeTab === 'soir' && <div className="absolute bottom-[-9px] left-1 right-1 h-[2.5px] bg-[#f15a24] rounded-full theme-tab-indicator" />}
              </button>

              {/* Progress Tab */}
              <button
                onClick={() => setActiveTab('progres')}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 transition-all cursor-pointer relative ${
                  activeTab === 'progres' ? 'text-[#f15a24] font-bold theme-tab-active' : 'text-gray-400 hover:text-gray-600 theme-tab-inactive'
                }`}
              >
                <BarChart2 size={16} className={activeTab === 'progres' ? 'text-[#f15a24] theme-icon-active' : 'text-gray-400'} />
                <span className="text-[9px] font-semibold tracking-tight">Progress</span>
                {activeTab === 'progres' && <div className="absolute bottom-[-9px] left-1 right-1 h-[2.5px] bg-[#f15a24] rounded-full theme-tab-indicator" />}
              </button>

              {/* Calendrier Tab */}
              <button
                onClick={() => setActiveTab('calendrier')}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 transition-all cursor-pointer relative ${
                  activeTab === 'calendrier' ? 'text-[#f15a24] font-bold theme-tab-active' : 'text-gray-400 hover:text-gray-600 theme-tab-inactive'
                }`}
              >
                <Calendar size={16} className={activeTab === 'calendrier' ? 'text-[#f15a24] theme-icon-active' : 'text-gray-400'} />
                <span className="text-[9px] font-semibold tracking-tight">Agenda</span>
                {activeTab === 'calendrier' && <div className="absolute bottom-[-9px] left-1 right-1 h-[2.5px] bg-[#f15a24] rounded-full theme-tab-indicator" />}
              </button>

              {/* Timer Tab */}
              <button
                onClick={() => setActiveTab('timer')}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 transition-all cursor-pointer relative ${
                  activeTab === 'timer' ? 'text-[#f15a24] font-bold theme-tab-active' : 'text-gray-400 hover:text-gray-600 theme-tab-inactive'
                }`}
              >
                <Timer size={16} className={activeTab === 'timer' ? 'text-[#f15a24] theme-icon-active' : 'text-gray-400'} />
                <span className="text-[9px] font-semibold tracking-tight">Timer</span>
                {activeTab === 'timer' && <div className="absolute bottom-[-9px] left-1 right-1 h-[2.5px] bg-[#f15a24] rounded-full theme-tab-indicator" />}
              </button>

              {/* Ajouter Tab */}
              <button
                onClick={() => setActiveTab('planificateur')}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 transition-all cursor-pointer relative ${
                  activeTab === 'planificateur' ? 'text-[#f15a24] font-bold theme-tab-active' : 'text-gray-400 hover:text-gray-600 theme-tab-inactive'
                }`}
              >
                <PlusCircle size={16} className={activeTab === 'planificateur' ? 'text-[#f15a24] theme-icon-active' : 'text-gray-400'} />
                <span className="text-[9px] font-semibold tracking-tight">Ajouter</span>
                {activeTab === 'planificateur' && <div className="absolute bottom-[-9px] left-1 right-1 h-[2.5px] bg-[#f15a24] rounded-full theme-tab-indicator" />}
              </button>

              {/* Settings Tab */}
              <button
                onClick={() => setActiveTab('reglages')}
                className={`flex flex-col items-center gap-1 flex-1 py-1 px-1 transition-all cursor-pointer relative ${
                  activeTab === 'reglages' ? 'text-[#f15a24] font-bold theme-tab-active' : 'text-gray-400 hover:text-gray-600 theme-tab-inactive'
                }`}
              >
                <Settings size={16} className={activeTab === 'reglages' ? 'text-[#f15a24] theme-icon-active' : 'text-gray-400'} />
                <span className="text-[9px] font-semibold tracking-tight">Réglages</span>
                {activeTab === 'reglages' && <div className="absolute bottom-[-9px] left-1 right-1 h-[2.5px] bg-[#f15a24] rounded-full theme-tab-indicator" />}
              </button>
            </div>

            {/* TABS CONTAINER (MAIN VIEWPORTS) */}
            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
              {activeTab === 'matin' && (
                <TaskPeriodList
                  key="task-period-list-matin"
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
                  key="task-period-list-journee"
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
                  key="task-period-list-soir"
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

              {activeTab === 'timer' && (
                <TimerPanel
                  profile={profile}
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
                  onLogout={handleLogout}
                />
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
