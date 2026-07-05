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
  Sparkles, CheckCircle2, User, Mail, ShieldCheck, RefreshCw, KeyRound, Lock, Smartphone
} from 'lucide-react';
import { db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { saveUserState, loadUserState, generateAndSaveOTP, verifyOTP } from './lib/firestoreService';

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
  const [loginPhone, setLoginPhone] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [latestGeneratedOtp, setLatestGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [retrievingDemo, setRetrievingDemo] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<'idle' | 'sent' | 'not_configured' | 'error' | 'bad_credentials'>('idle');
  const [smsStatus, setSmsStatus] = useState<'idle' | 'sent' | 'limit_reached' | 'error'>('idle');
  const [showSmtpGuide, setShowSmtpGuide] = useState(false);
  const [showSmsGuide, setShowSmsGuide] = useState(false);

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

  // 2. STATE PERSISTENCE (LOCAL STORAGE & GOOGLE FIRESTORE BACKGROUND SYNC)
  useEffect(() => {
    const initApp = async () => {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localParsed: AppState | null = null;
      if (stored) {
        try {
          localParsed = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing stored local state', e);
        }
      }

      // Check if auto-logged in
      const isLogged = localStorage.getItem('ai_planner_logged_in') === 'true';

      if (localParsed) {
        let loadedTasks = localParsed.customTasks || [];
        
        // Migrate defaults to customTasks so they are fully editable
        const hasDefaults = loadedTasks.some(t => t.id === 'm1' || t.id === 's1');
        if (!hasDefaults && loadedTasks.length === 0) {
          loadedTasks = [...DEFAULT_TASKS];
        } else if (!hasDefaults) {
          loadedTasks = [...DEFAULT_TASKS, ...loadedTasks];
        }
        setCustomTasks(loadedTasks);

        if (localParsed.profile) {
          const profileWithTheme = {
            ...INITIAL_PROFILE,
            ...localParsed.profile,
            theme: localParsed.profile.theme || 'noir', // Default to noir
            language: localParsed.profile.language || 'fr' // Default to fr
          };
          setProfile(profileWithTheme);

          const activeIdentifier = profileWithTheme.email || profileWithTheme.phone;

          if (isLogged && activeIdentifier) {
            setIsLoggedIn(true);
            setLoginName(profileWithTheme.name || '');
            setLoginEmail(profileWithTheme.email || '');
            setLoginPhone(profileWithTheme.phone || '');

            // Real-time restoration from Google Firestore in the background
            try {
              const cloudState = await loadUserState(activeIdentifier);
              if (cloudState) {
                if (cloudState.profile) setProfile(cloudState.profile);
                if (cloudState.customTasks) setCustomTasks(cloudState.customTasks);
                if (cloudState.history) setHistory(prev => ({ ...prev, ...cloudState.history }));
                if (cloudState.chatMessages) setChatMessages(cloudState.chatMessages);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudState));
              }
            } catch (err) {
              console.error('Error syncing Firestore state on startup:', err);
            }
          } else {
            setLoginName('');
            setLoginEmail('');
            setLoginPhone('');
          }
        } else {
          setProfile({ ...INITIAL_PROFILE, theme: 'noir', language: 'fr' });
          setLoginName('');
          setLoginEmail('');
          setLoginPhone('');
        }
        
        // Merge stored history with the default seeded history
        if (localParsed.history) {
          setHistory({
            ...INITIAL_HISTORY,
            ...localParsed.history
          });
        }
        if (localParsed.chatMessages) setChatMessages(localParsed.chatMessages);
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
    };

    initApp();
  }, []);

  // Sync to local storage and Google Firestore whenever state changes
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

    // Auto-sync with Firestore in real-time if logged in
    const isLogged = localStorage.getItem('ai_planner_logged_in') === 'true';
    const activeId = updatedProfile.email || updatedProfile.phone;
    if (isLogged && activeId) {
      saveUserState(activeId, fullState).catch(e => {
        console.error('Failed to sync to Firestore in background:', e);
      });
    }
  };

  // 3. SYNC WITH GOOGLE FIRESTORE
  const syncWithCloudServer = async (): Promise<{ success: boolean; message: string }> => {
    const activeId = profile.email || profile.phone;
    if (!activeId) {
      return { success: false, message: 'Email ou Téléphone requis pour la synchronisation.' };
    }

    try {
      const stateToSave: AppState = {
        profile,
        customTasks,
        history,
        chatMessages,
      };

      const success = await saveUserState(activeId, stateToSave);
      if (success) {
        return { success: true, message: 'Données sauvegardées sur Google Firestore avec succès !' };
      } else {
        return { success: false, message: 'Échec de sauvegarde sur Google Firestore.' };
      }
    } catch (e: any) {
      console.error('Error syncing with Firestore:', e);
      return { success: false, message: `Erreur Firestore : ${e.message}` };
    }
  };

  // Fetch from Google Firestore (Restore)
  const fetchStateFromCloud = async (email: string) => {
    try {
      const cloudState = await loadUserState(email);
      if (cloudState) {
        if (cloudState.profile) setProfile(cloudState.profile);
        if (cloudState.customTasks) setCustomTasks(cloudState.customTasks);
        if (cloudState.history) setHistory(cloudState.history);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudState));
        return { success: true, message: 'Vos données cloud ont été restaurées depuis Firestore avec succès !' };
      } else {
        return { success: false, message: 'Aucun profil trouvé sur Google Firestore. Synchronisation locale activée.' };
      }
    } catch (e: any) {
      return { success: false, message: `Erreur de restauration : ${e.message}` };
    }
  };

  // 3.5. SECURE GMAIL & SMS VERIFICATION, LOGIN & LOGOUT HANDLERS
  const handleRequestOtp = async (enteredName: string, enteredEmail: string) => {
    const activeIdentifier = authMethod === 'email' ? enteredEmail.trim() : loginPhone.trim();

    if (!activeIdentifier) {
      if (authMethod === 'email') {
        setOtpError("Veuillez entrer une adresse e-mail Gmail valide.");
      } else {
        setOtpError("Veuillez entrer un numéro de téléphone valide (ex. +2250707070707).");
      }
      return;
    }

    setOtpError('');
    setLoginLoading(true);
    setSmtpStatus('idle');
    setSmsStatus('idle');

    try {
      const code = await generateAndSaveOTP(activeIdentifier);
      if (code) {
        setLatestGeneratedOtp(code);
        setOtpSent(true);

        if (authMethod === 'email') {
          // Attempt sending the OTP email via backend
          try {
            const response = await fetch('/api/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: enteredEmail.trim(),
                code: code,
                name: enteredName.trim() || 'Franck'
              })
            });
            const resData = await response.json();
            if (resData.success) {
              if (resData.emailed) {
                setSmtpStatus('sent');
              } else if (resData.message === 'SMTP_NOT_CONFIGURED') {
                setSmtpStatus('not_configured');
              } else {
                setSmtpStatus('error');
              }
            } else {
              if (resData.isBadCredentials) {
                setSmtpStatus('bad_credentials');
              } else {
                setSmtpStatus('error');
              }
              console.error('SMTP error returned:', resData.message);
            }
          } catch (mailErr) {
            console.error('Failed to trigger SMTP email API:', mailErr);
            setSmtpStatus('error');
          }
        } else {
          // Attempt sending the OTP SMS via backend
          try {
            const response = await fetch('/api/send-sms-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: loginPhone.trim(),
                code: code
              })
            });
            const resData = await response.json();
            if (resData.success) {
              setSmsStatus('sent');
            } else {
              if (resData.quotaExceeded) {
                setSmsStatus('limit_reached');
              } else {
                setSmsStatus('error');
              }
              console.error('SMS error returned:', resData.message);
            }
          } catch (smsErr) {
            console.error('Failed to trigger SMS API:', smsErr);
            setSmsStatus('error');
          }
        }
      } else {
        setOtpError("Impossible de générer le code de sécurité. Vérifiez vos paramètres Firestore.");
      }
    } catch (err: any) {
      setOtpError(`Erreur : ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyAndLogin = async (enteredName: string, enteredEmail: string, keepMeLoggedIn: boolean) => {
    if (!enteredOtp.trim()) {
      setOtpError("Veuillez saisir le code à 6 chiffres.");
      return;
    }
    setOtpError('');
    setLoginLoading(true);

    const activeIdentifier = authMethod === 'email' ? enteredEmail.trim().toLowerCase() : loginPhone.trim();

    try {
      const isValid = await verifyOTP(activeIdentifier, enteredOtp);
      if (!isValid) {
        setOtpError("Code de vérification incorrect ou expiré. Veuillez réessayer.");
        setLoginLoading(false);
        return;
      }

      // Validated! Construct user profile
      const updatedProfile = {
        ...profile,
        name: enteredName.trim() || 'Franck',
        email: authMethod === 'email' ? enteredEmail.trim().toLowerCase() : '',
        phone: authMethod === 'phone' ? loginPhone.trim() : '',
      };
      setProfile(updatedProfile);

      // Load existing user data from Google Firestore
      const cloudState = await loadUserState(activeIdentifier);
      if (cloudState) {
        if (cloudState.profile) {
          setProfile({
            ...cloudState.profile,
            name: enteredName.trim() || cloudState.profile.name || 'Franck',
            email: authMethod === 'email' ? enteredEmail.trim().toLowerCase() : (cloudState.profile.email || ''),
            phone: authMethod === 'phone' ? loginPhone.trim() : (cloudState.profile.phone || '')
          });
        }
        if (cloudState.customTasks) setCustomTasks(cloudState.customTasks);
        if (cloudState.history) setHistory(cloudState.history);
        if (cloudState.chatMessages) setChatMessages(cloudState.chatMessages);
        
        // Save merged state to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudState));
      } else {
        // Fresh cloud user. Sync current local storage to initiate their cloud database doc
        const stateToSave = {
          profile: updatedProfile,
          customTasks,
          history,
          chatMessages,
        };
        await saveUserState(activeIdentifier, stateToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      }

      if (keepMeLoggedIn) {
        localStorage.setItem('ai_planner_logged_in', 'true');
      } else {
        localStorage.removeItem('ai_planner_logged_in');
      }

      setIsLoggedIn(true);
      // Clean up verification states
      setOtpSent(false);
      setEnteredOtp('');
      setLatestGeneratedOtp('');
    } catch (e: any) {
      console.error('Error logging in & syncing', e);
      setOtpError(`Erreur d'authentification : ${e.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ai_planner_logged_in');
    setLoginName('');
    setLoginEmail('');
    setLoginPhone('');
    setIsLoggedIn(false);
    setOtpSent(false);
    setEnteredOtp('');
    setLatestGeneratedOtp('');
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
            <div className="flex flex-col items-center text-center gap-2 mt-4 mb-4">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <Sparkles size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest font-mono mt-2">
                Discipline Pro
              </h2>
              <p className="text-xs text-slate-400">
                Garantie de Sécurité & Base de Données Google
              </p>
            </div>

            {/* Inputs Form */}
            <div className="flex flex-col gap-4">
              {!otpSent ? (
                /* PHASE 1: ENTER NAME & EMAIL */
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <User size={12} className="text-emerald-400" />
                      Nom d'utilisateur / Votre Nom
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
                </>
              ) : (
                /* PHASE 2: VERIFY CODE */
                <>
                  <div className="flex flex-col gap-1 text-center bg-slate-900/30 border border-slate-800/60 p-3 rounded-2xl mb-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Cible de vérification</span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {loginEmail}
                    </span>
                    <button
                      onClick={() => setOtpSent(false)}
                      className="text-[9px] text-slate-500 hover:text-slate-300 font-semibold underline mt-1 cursor-pointer"
                    >
                      Modifier les coordonnées
                    </button>
                  </div>

                  {/* SMTP Sending Feedback Status Alerts */}
                  {smtpStatus === 'sent' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[10px] text-emerald-400 leading-relaxed">
                      📧 <strong>Code envoyé !</strong> Un e-mail contenant votre code de sécurité à 6 chiffres a été envoyé à <strong>{loginEmail}</strong>. Veuillez vérifier votre boîte de réception (et vos spams).
                    </div>
                  )}

                  {smtpStatus === 'not_configured' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-400 leading-relaxed">
                      ℹ️ <strong>Moteur d'envoi Gmail en attente :</strong> Pour recevoir le code directement sur votre boîte Gmail, configurez vos variables <code>SMTP_USER</code> et <code>SMTP_PASS</code> dans les Secrets d'AI Studio.
                    </div>
                  )}

                  {smtpStatus === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[10px] text-red-400 leading-relaxed">
                      ❌ <strong>Erreur d'envoi SMTP :</strong> Nous n'avons pas pu distribuer l'e-mail. Vérifiez vos variables SMTP ou votre mot de passe d'application Gmail dans le panneau Secrets.
                    </div>
                  )}

                  {smtpStatus === 'bad_credentials' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[10px] text-red-300 leading-relaxed flex flex-col gap-1.5">
                      <span className="font-bold text-red-400 text-[10.5px]">⚠️ Identifiants Gmail Refusés (Erreur 535)</span>
                      <p>
                        Google a rejeté la connexion SMTP. Cela se produit lorsque vous utilisez votre mot de passe Gmail habituel au lieu d'un <strong>Mot de passe d'application</strong> sécurisé.
                      </p>
                      <div className="bg-black/40 rounded-lg p-2.5 border border-red-500/20 text-[9px] text-slate-300 flex flex-col gap-1 mt-0.5">
                        <span className="font-semibold text-slate-200">🔧 Comment résoudre en 1 minute :</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                          <li>Activez la <strong>Validation en 2 étapes</strong> sur votre compte Gmail.</li>
                          <li>Créez un <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-semibold">Mot de passe d'application</a>.</li>
                          <li>Copiez le code de <strong>16 caractères</strong> généré.</li>
                          <li>Mettez à jour la variable <code>SMTP_PASS</code> dans le menu <strong>Settings &gt; Secrets</strong> d'AI Studio.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5 justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock size={12} className="text-emerald-400" />
                        Saisir le Code OTP de Sécurité
                      </span>
                      <span className="text-[9px] text-slate-500">6 chiffres</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex. 123456"
                      className="bg-[#12141C] border border-slate-800 rounded-xl px-3 py-3 text-center text-lg tracking-widest font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder-slate-700"
                      required
                    />
                  </div>
                </>
              )}

              {/* Error Display */}
              {otpError && (
                <div className="text-[10.5px] bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-center font-semibold leading-relaxed">
                  ⚠️ {otpError}
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="mb-6">
              {!otpSent ? (
                <button
                  onClick={() => handleRequestOtp(loginName, loginEmail)}
                  disabled={!loginName || !loginEmail || loginLoading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800/80 disabled:text-slate-500 text-white rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Génération du code de sécurité...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Demander mon Code par E-mail</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleVerifyAndLogin(loginName, loginEmail, rememberMe)}
                  disabled={enteredOtp.length < 6 || loginLoading}
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
                      <span>Confirmer & Accéder à mes données</span>
                    </>
                  )}
                </button>
              )}
              <div className="text-center text-[9px] text-slate-600 font-mono mt-4 uppercase tracking-widest">
                Google Firestore Cloud • Connexion Sécurisée
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
                  onUpdateProfile={handleUpdateProfile}
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
