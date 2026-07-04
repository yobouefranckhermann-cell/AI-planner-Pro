export interface Task {
  id: string;
  name: string;
  timeStart: string; // "HH:MM"
  timeEnd?: string;  // "HH:MM"
  period: 'matin' | 'journée' | 'soir';
  isDefault?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  textScale: number; // e.g., 1.10 for 110%
  notifications: {
    tasks: boolean;
    morning: boolean;
    evening: boolean;
  };
  theme?: 'blanc' | 'noir' | 'orange';
}

export interface DayProgress {
  date: string; // "YYYY-MM-DD"
  completedTaskIds: string[]; // list of completed task IDs
  actions: string[]; // custom free-form planned actions or reminders
  journal?: string; // evening reflections
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string; // ISO string
}

export interface AppState {
  profile: UserProfile;
  customTasks: Task[];
  history: { [date: string]: DayProgress }; // keyed by "YYYY-MM-DD"
  chatMessages: ChatMessage[];
}

export const DEFAULT_TASKS: Task[] = [
  // MATIN (6 tasks)
  { id: 'm1', name: 'Early Waking', timeStart: '04:30', period: 'matin', isDefault: true },
  { id: 'm2', name: 'Prière', timeStart: '04:35', timeEnd: '05:00', period: 'matin', isDefault: true },
  { id: 'm3', name: 'Méditation', timeStart: '05:00', period: 'matin', isDefault: true },
  { id: 'm4', name: 'Sport', timeStart: '05:05', timeEnd: '05:30', period: 'matin', isDefault: true },
  { id: 'm5', name: 'Douche froide', timeStart: '05:30', period: 'matin', isDefault: true },
  { id: 'm6', name: 'Formation', timeStart: '05:30', timeEnd: '06:30', period: 'matin', isDefault: true },

  // SOIR (4 tasks)
  { id: 's1', name: 'Bain / Douche', timeStart: '20:00', period: 'soir', isDefault: true },
  { id: 's2', name: 'Formation soir', timeStart: '20:00', timeEnd: '21:30', period: 'soir', isDefault: true },
  { id: 's3', name: 'Lecture', timeStart: '22:00', timeEnd: '22:30', period: 'soir', isDefault: true },
  { id: 's4', name: 'Journal / Réflexion', timeStart: '22:30', period: 'soir', isDefault: true },
];
