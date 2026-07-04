import React, { useState } from 'react';
import { UserProfile, AppState } from '../types';
import { 
  Settings, User, Bell, Sliders, Save, FileText, Download, Upload, 
  Smartphone, Shield, Check, RefreshCw, AlertTriangle, Eye, Palette,
  Globe
} from 'lucide-react';

const TRANSLATIONS = {
  fr: {
    language: 'Langue / Language / Idioma',
    langSelect: 'Langue de l\'application',
    chooseLangDesc: 'Sélectionnez votre langue d\'affichage préférée pour toute l\'interface.',
    accountTitle: 'Compte Unique & Sauvegarde',
    accountDesc: "Renseigne ton nom et Gmail. Toutes tes données seront sauvegardées sur ton compte unique et se chargeront automatiquement sur n'importe quel appareil !",
    fullName: 'Nom Complet / Pseudo',
    gmailAddress: 'Adresse Gmail',
    saveLocal: 'Sauver Localement',
    syncCloud: 'Appliquer & Sync Cloud',
    logout: 'Se Déconnecter',
    logoutBtn: 'Option 2 : Se déconnecter de l\'appareil',
    changeNameGmail: 'Option 1 : Appliquer les modifications',
    changeNameGmailDesc: 'Mettez à jour vos identifiants pour synchroniser vos données.',
    appTheme: 'Thème de l\'Application',
    themeDesc: 'Sélectionnez un style de couleur.',
    themeLight: 'Blanc',
    themeDark: 'Noir',
    themeOrange: 'Orange',
    appSize: 'Taille de l\'Application',
    sizeDesc: 'Ajustez la taille de police globale.',
    notificationTitle: 'Rappels & Notifications',
    remindersTasks: 'Rappels de tâches',
    remindersTasksDesc: 'Alerte à l\'heure exacte',
    remindersMorning: 'Message matinal IA',
    remindersMorningDesc: 'Résumé et motivation à 04h30',
    remindersEvening: 'Bilan du soir IA',
    remindersEveningDesc: 'Rapport de discipline à 21h00',
    pdfTitle: 'Rapport PDF Quotidien',
    pdfDesc: 'Génère un bilan quotidien imprimable ou enregistrable en PDF.',
    pdfBtn: 'Générer et Imprimer le Rapport PDF',
    backupTitle: 'Sauvegarde & Restauration',
    backupDesc: 'Exporte/importe vos données locales au format JSON.',
    export: 'Exporter JSON',
    import: 'Importer JSON',
    apkTitle: 'Convertir en APK Mobile',
    apkDesc: 'Installer l\'application sur smartphone.',
    apkBtnHide: 'Masquer le tutoriel',
    apkBtnShow: 'Afficher le tutoriel APK',
    syncSuccess: 'Profil mis à jour avec succès !',
    syncingText: 'Synchronisation cloud en cours...',
    twoOptionsTitle: 'Deux Options de Compte',
    twoOptionsDesc: 'Choisissez soit d\'appliquer vos changements de Nom/Gmail (Option 1), soit de vous déconnecter (Option 2) :',
  },
  en: {
    language: 'Language / Langue / Idioma',
    langSelect: 'Application Language',
    chooseLangDesc: 'Select your preferred interface language for the application.',
    accountTitle: 'Unique Account & Cloud Backup',
    accountDesc: 'Fill in your name and Gmail. All your data will be saved on your unique cloud account and synced automatically across any device!',
    fullName: 'Full Name / Nickname',
    gmailAddress: 'Gmail Address',
    saveLocal: 'Save Locally',
    syncCloud: 'Apply & Sync Cloud',
    logout: 'Log Out',
    logoutBtn: 'Option 2: Log out from this device',
    changeNameGmail: 'Option 1: Apply and save changes',
    changeNameGmailDesc: 'Update your login credentials to sync your data.',
    appTheme: 'Application Theme',
    themeDesc: 'Select a visual theme style.',
    themeLight: 'Light/Blanc',
    themeDark: 'Dark/Noir',
    themeOrange: 'Orange',
    appSize: 'Application Size',
    sizeDesc: 'Adjust global font size scale.',
    notificationTitle: 'Reminders & Notifications',
    remindersTasks: 'Task Reminders',
    remindersTasksDesc: 'Alert at exact habit time',
    remindersMorning: 'Morning AI Message',
    remindersMorningDesc: 'Summary and motivation at 04:30 AM',
    remindersEvening: 'Evening AI Review',
    remindersEveningDesc: 'Discipline report at 09:00 PM',
    pdfTitle: 'Daily PDF Report',
    pdfDesc: 'Generate printable or PDF-savable daily review report.',
    pdfBtn: 'Generate & Print PDF Report',
    backupTitle: 'Backup & Restore',
    backupDesc: 'Export/import your local state via JSON file.',
    export: 'Export JSON',
    import: 'Import JSON',
    apkTitle: 'Convert to Mobile APK',
    apkDesc: 'Install the app on your smartphone.',
    apkBtnHide: 'Hide tutorial',
    apkBtnShow: 'Show APK tutorial',
    syncSuccess: 'Profile updated successfully!',
    syncingText: 'Cloud synchronisation in progress...',
    twoOptionsTitle: 'Two Account Options',
    twoOptionsDesc: 'Choose either to apply your Name/Gmail changes (Option 1) or to log out of the app (Option 2):',
  },
  es: {
    language: 'Idioma / Langue / Language',
    langSelect: 'Idioma de la aplicación',
    chooseLangDesc: 'Seleccione su idioma de visualización preferido para toda la aplicación.',
    accountTitle: 'Cuenta Única y Copia en la Nube',
    accountDesc: 'Completa tu nombre y Gmail. ¡Todos tus datos se guardarán en tu cuenta única de la nube y se sincronizarán en cualquier dispositivo!',
    fullName: 'Nombre Completo / Apodo',
    gmailAddress: 'Correo Gmail',
    saveLocal: 'Guardar Local',
    syncCloud: 'Aplicar y Sincronizar Nube',
    logout: 'Cerrar Sesión',
    logoutBtn: 'Opción 2: Cerrar sesión en el dispositivo',
    changeNameGmail: 'Opción 1: Aplicar y guardar cambios',
    changeNameGmailDesc: 'Actualice sus credenciales para sincronizar sus datos.',
    appTheme: 'Tema de la Aplicación',
    themeDesc: 'Seleccione un estilo de tema visual.',
    themeLight: 'Blanco',
    themeDark: 'Negro/Noir',
    themeOrange: 'Naranja',
    appSize: 'Tamaño de la Aplicación',
    sizeDesc: 'Ajuste la escala de fuente global.',
    notificationTitle: 'Recordatorios y Notificaciones',
    remindersTasks: 'Recordatorios de tareas',
    remindersTasksDesc: 'Alerta a la hora exacta',
    remindersMorning: 'Mensaje matutino de IA',
    remindersMorningDesc: 'Resumen y motivación a las 04:30 AM',
    remindersEvening: 'Bilan de la tarde de IA',
    remindersEveningDesc: 'Informe de disciplina a las 09:00 PM',
    pdfTitle: 'Informe Diario en PDF',
    pdfDesc: 'Genere un informe de progreso imprimible o guardable en PDF.',
    pdfBtn: 'Generar e Imprimir Informe PDF',
    backupTitle: 'Copia de Seguridad',
    backupDesc: 'Exporte/importe sus datos locales en formato JSON.',
    export: 'Exportar JSON',
    import: 'Importar JSON',
    apkTitle: 'Convertir en APK Móvil',
    apkDesc: 'Instalar la aplicación en su teléfono inteligente.',
    apkBtnHide: 'Ocultar tutorial',
    apkBtnShow: 'Mostrar tutorial de APK',
    syncSuccess: '¡Perfil actualizado con éxito!',
    syncingText: 'Sincronización en la nube en curso...',
    twoOptionsTitle: 'Dos Opciones de Cuenta',
    twoOptionsDesc: 'Elija aplicar sus cambios de Nombre/Gmail (Opción 1) o cerrar sesión (Opción 2):',
  }
};

interface SettingsPanelProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onSyncWithServer: () => Promise<{ success: boolean; message: string }>;
  onExportData: () => void;
  onImportData: (file: File) => void;
  textScale: number;
  onLogout?: () => void;
}

export default function SettingsPanel({
  profile,
  onUpdateProfile,
  onSyncWithServer,
  onExportData,
  onImportData,
  textScale,
  onLogout,
}: SettingsPanelProps) {
  const lang = profile.language || 'fr';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const [nameInput, setNameInput] = useState(profile.name);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const handleUpdateProfileLocal = () => {
    onUpdateProfile({
      ...profile,
      name: nameInput.trim() || 'Franck',
      email: emailInput.trim() || 'yobouefranckhermann@gmail.com',
    });
    setSyncStatus(t.syncSuccess);
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(t.syncingText);
    try {
      // First, update local profile state
      onUpdateProfile({
        ...profile,
        name: nameInput.trim() || 'Franck',
        email: emailInput.trim() || 'yobouefranckhermann@gmail.com',
      });
      const result = await onSyncWithServer();
      setSyncStatus(result.message);
    } catch (e: any) {
      setSyncStatus(`Erreur : ${e.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(''), 5000);
    }
  };

  const handleToggleNotification = (key: 'tasks' | 'morning' | 'evening') => {
    onUpdateProfile({
      ...profile,
      notifications: {
        ...profile.notifications,
        [key]: !profile.notifications[key],
      }
    });
  };

  const handleTextScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onUpdateProfile({
      ...profile,
      textScale: value,
    });
  };

  // Triggers print view formatted for PDF
  const handlePrintPdf = () => {
    window.print();
  };
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-[#0A0B0E] text-slate-200">
      
      {/* 0. CHOOSE LANGUAGE PART */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Globe size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">
            {t.language}
          </h3>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          {t.chooseLangDesc}
        </p>

        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            { id: 'fr', label: 'Français 🇫🇷', desc: 'FR' },
            { id: 'en', label: 'English 🇬🇧', desc: 'EN' },
            { id: 'es', label: 'Español 🇪🇸', desc: 'ES' },
          ].map((langOpt) => (
            <button
              key={langOpt.id}
              type="button"
              onClick={() => {
                onUpdateProfile({
                  ...profile,
                  language: langOpt.id as 'fr' | 'en' | 'es'
                });
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                (profile.language || 'fr') === langOpt.id
                  ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-500/5 text-slate-200'
                  : 'border-slate-800 hover:bg-[#161922]/50 text-slate-400'
              }`}
            >
              <span className="text-[11px] font-sans">{langOpt.label}</span>
              <span className="text-[7.5px] opacity-60 font-mono block text-center uppercase font-bold">
                {langOpt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. PROFILE SECTION (SYNC WITH UNIQUE ACCOUNT) */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <User size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">{t.accountTitle}</h3>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          {t.accountDesc}
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">{t.fullName}</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="bg-[#0A0B0E] border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">{t.gmailAddress}</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="bg-[#0A0B0E] border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-500"
            />
          </div>

          {syncStatus && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-1.5">
              {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
              <span>{syncStatus}</span>
            </div>
          )}

          {/* TWO EXPLICIT REQUESTED OPTIONS */}
          <div className="mt-4 border-t border-slate-800/80 pt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5 bg-[#161922]/50 p-3.5 rounded-2xl border border-slate-800/50">
              <span className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1.5 uppercase tracking-wide">
                <Shield size={12} className="text-emerald-400 animate-pulse" />
                {t.twoOptionsTitle}
              </span>
              <p className="text-[9.5px] text-slate-400 leading-relaxed">
                {t.twoOptionsDesc}
              </p>

              <div className="flex flex-col gap-2.5 mt-2">
                {/* Option 1: Appliquer les modifications (Sauver / Changer de Nom/Gmail) */}
                <div className="bg-[#0A0B0E] border border-slate-800/80 p-3 rounded-xl flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">
                    {t.changeNameGmail}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleUpdateProfileLocal}
                      className="py-2 px-3 border border-slate-800 rounded-xl hover:bg-[#161922] font-bold text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Save size={12} />
                      <span>{t.saveLocal}</span>
                    </button>
                    <button
                      onClick={handleSyncCloud}
                      disabled={isSyncing}
                      className="py-2 px-3 bg-emerald-50 hover:bg-emerald-600 text-white bg-emerald-500 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                      <span>{isSyncing ? t.syncingText : t.syncCloud}</span>
                    </button>
                  </div>
                </div>

                {/* Option 2: Se déconnecter de l'appareil */}
                {onLogout && (
                  <div className="bg-[#0A0B0E] border border-slate-800/80 p-3 rounded-xl flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-red-400 font-mono uppercase tracking-wider">
                      {t.logoutBtn}
                    </span>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full py-2.5 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{t.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. TEXT SIZE SLIDER */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Sliders size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">{t.appSize}</h3>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mt-1">
          <span>{lang === 'fr' ? 'Réduire (-10%)' : lang === 'es' ? 'Reducir (-10%)' : 'Reduce (-10%)'}</span>
          <span className="text-emerald-400 font-bold font-mono">{Math.round(textScale * 100)}%</span>
          <span>{lang === 'fr' ? 'Agrandir (+50%)' : lang === 'es' ? 'Aumentar (+50%)' : 'Enlarge (+50%)'}</span>
        </div>

        <input
          type="range"
          min="0.9"
          max="1.5"
          step="0.05"
          value={textScale}
          onChange={handleTextScaleChange}
          className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />
        <p className="text-[9px] text-slate-500 text-center leading-relaxed font-medium">
          {t.sizeDesc}
        </p>
      </div>

      {/* 2.5. CHOIX DU THÈME */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Palette size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">{t.appTheme}</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            { id: 'blanc', name: t.themeLight, desc: lang === 'fr' ? 'Thème clair épuré' : lang === 'es' ? 'Tema claro limpio' : 'Clean light theme', colorBg: 'bg-white border-slate-200 text-slate-900', colorDot: 'bg-slate-400' },
            { id: 'noir', name: t.themeDark, desc: lang === 'fr' ? 'Saphir nocturne' : lang === 'es' ? 'Zafiro nocturno' : 'Night sapphire', colorBg: 'bg-[#0A0B0E] border-slate-800 text-slate-200', colorDot: 'bg-emerald-500' },
            { id: 'orange', name: t.themeOrange, desc: lang === 'fr' ? 'Énergie vibrante' : lang === 'es' ? 'Energía vibrante' : 'Vibrant energy', colorBg: 'bg-[#1c100b] border-amber-950 text-amber-100', colorDot: 'bg-[#f15a24]' },
          ].map((themeOpt) => (
            <button
              key={themeOpt.id}
              type="button"
              onClick={() => {
                onUpdateProfile({
                  ...profile,
                  theme: themeOpt.id as 'blanc' | 'noir' | 'orange'
                });
              }}
              className={`p-2 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                (profile.theme || 'noir') === themeOpt.id
                  ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-500/5'
                  : 'hover:bg-[#161922]/50'
              } ${themeOpt.colorBg}`}
            >
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${themeOpt.colorDot}`} />
                <span className="text-[10px]">{themeOpt.name}</span>
              </div>
              <span className="text-[7.5px] opacity-60 font-medium font-mono block text-center leading-tight">
                {themeOpt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. NOTIFICATIONS SECTION */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Bell size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">{t.notificationTitle}</h3>
        </div>

        <div className="flex flex-col gap-3 mt-1">
          <button
            onClick={() => handleToggleNotification('tasks')}
            className="flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">{t.remindersTasks}</span>
              <span className="text-[10px] text-slate-500">{t.remindersTasksDesc}</span>
            </div>
            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${profile.notifications.tasks ? 'bg-emerald-500' : 'bg-slate-800'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${profile.notifications.tasks ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          <button
            onClick={() => handleToggleNotification('morning')}
            className="flex items-center justify-between text-left cursor-pointer group border-t border-slate-800/40 pt-2.5"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">{t.remindersMorning}</span>
              <span className="text-[10px] text-slate-500">{t.remindersMorningDesc}</span>
            </div>
            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${profile.notifications.morning ? 'bg-emerald-500' : 'bg-slate-800'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${profile.notifications.morning ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          <button
            onClick={() => handleToggleNotification('evening')}
            className="flex items-center justify-between text-left cursor-pointer group border-t border-slate-800/40 pt-2.5"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">{t.remindersEvening}</span>
              <span className="text-[10px] text-slate-500">{t.remindersEveningDesc}</span>
            </div>
            <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${profile.notifications.evening ? 'bg-emerald-500' : 'bg-slate-800'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${profile.notifications.evening ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* 4. PDF REPORT EXPORT */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <FileText size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">{t.pdfTitle}</h3>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          {t.pdfDesc}
        </p>
        <button
          onClick={() => setShowPdfPreview(true)}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Eye size={14} />
          <span>{t.pdfBtn}</span>
        </button>
      </div>

      {/* 5. BACKUP DATA FILES */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Save size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">{t.backupTitle}</h3>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          {t.backupDesc}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={onExportData}
            className="py-2 border border-slate-800 rounded-xl hover:bg-[#161922] font-bold text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Download size={12} />
            <span>{t.export}</span>
          </button>
          <label className="py-2 border border-slate-800 rounded-xl hover:bg-[#161922] font-bold text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1 text-center">
            <Upload size={12} />
            <span>{t.import}</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && onImportData(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 6. APK GUIDE */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Smartphone size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">{t.apkTitle}</h3>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          {t.apkDesc}
        </p>
        <button
          onClick={() => setShowApkGuide(!showApkGuide)}
          className="w-full py-2 bg-[#0A0B0E] hover:bg-[#161922] border border-slate-800 rounded-xl font-bold text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <span>{showApkGuide ? t.apkBtnHide : t.apkBtnShow}</span>
        </button>

        {showApkGuide && (
          <div className="bg-[#161922] border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-mono">
              <Check size={14} />
              <span>{lang === 'fr' ? 'Méthode 1 : Installation PWA (Instantané)' : lang === 'es' ? 'Método 1: Instalación de PWA (instantáneo)' : 'Method 1: PWA Installation (Instant)'}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed pl-5">
              {lang === 'fr' ? (
                <>Ouvre l'application sur ton téléphone Android via <strong>Google Chrome</strong>. Clique sur les <strong>3 points</strong> en haut à droite, puis sélectionne <strong>"Ajouter à l'écran d'accueil"</strong>. L'application se comportera à 100% comme une APK native, sans bandeau de navigateur !</>
              ) : lang === 'es' ? (
                <>Abra la aplicación en su teléfono Android a través de <strong>Google Chrome</strong>. Haga clic en los <strong>3 puntos</strong> de la esquina superior derecha y seleccione <strong>"Agregar a la pantalla de inicio"</strong>. ¡La aplicación funcionará al 100% como una APK nativa, sin la barra del navegador!</>
              ) : (
                <>Open the application on your Android phone using <strong>Google Chrome</strong>. Click on the <strong>3 dots</strong> in the top-right corner, then select <strong>"Add to Home screen"</strong>. The application will behave 100% like a native APK, without a browser bar!</>
              )}
            </p>

            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-mono border-t border-slate-800/40 pt-2">
              <Check size={14} />
              <span>{lang === 'fr' ? 'Méthode 2 : Compiler un fichier APK en 2 minutes' : lang === 'es' ? 'Método 2: Compilar un archivo APK en 2 minutos' : 'Method 2: Compile an APK file in 2 minutes'}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed pl-5">
              {lang === 'fr' ? (
                <>1. Copie l'URL complète de cette application.<br />2. Rends-toi sur le site gratuit <strong>Webintoapp.com</strong> ou <strong>AppMySite</strong>.<br />3. Colle l'URL de l'app, choisis le nom <strong>"AI Planner Pro"</strong>, choisis l'icône, puis clique sur <strong>"Generate App"</strong>.<br />4. Télécharge et installe directement le fichier <code>.apk</code> sur ton smartphone !</>
              ) : lang === 'es' ? (
                <>1. Copie la URL completa de esta aplicación.<br />2. Visite el sitio gratuito <strong>Webintoapp.com</strong> o <strong>AppMySite</strong>.<br />3. Pegue la URL de la aplicación, elija el nombre <strong>"AI Planner Pro"</strong>, elija el ícono y luego haga clic en <strong>"Generate App"</strong>.<br />4. ¡Descargue e instale el archivo <code>.apk</code> directamente en su teléfono inteligente!</>
              ) : (
                <>1. Copy the full URL of this application.<br />2. Go to the free website <strong>Webintoapp.com</strong> or <strong>AppMySite</strong>.<br />3. Paste the app URL, name it <strong>"AI Planner Pro"</strong>, choose an icon, and click <strong>"Generate App"</strong>.<br />4. Download and install the <code>.apk</code> file directly on your smartphone!</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* PDF OVERLAY PREVIEW */}
      {showPdfPreview && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-slate-800 w-full max-w-lg h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-[#161922] text-white border-b border-slate-800 px-5 py-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-bold text-[9px] text-emerald-400 uppercase tracking-widest font-mono">
                  {lang === 'fr' ? 'Rapport de Discipline' : lang === 'es' ? 'Informe de disciplina' : 'Discipline Report'}
                </span>
                <span className="font-bold text-sm text-slate-200 font-serif">
                  {lang === 'fr' ? 'Aperçu du Rapport Quotidien' : lang === 'es' ? 'Vista previa del informe diario' : 'Daily Report Preview'}
                </span>
              </div>
              <button
                onClick={() => setShowPdfPreview(false)}
                className="w-8 h-8 rounded-full bg-[#0A0B0E] border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Printable Area content preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col gap-5 print-view" id="printable-report">
              <div className="border-4 border-double border-gray-900 p-5 flex flex-col gap-4 text-gray-900 font-sans">
                {/* Header inside border */}
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-3">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">AI PLANNER PRO</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">Rapport d'activité • {profile.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-400">Date de génération</p>
                    <p className="text-xs font-bold text-gray-900">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* Grid of indicators */}
                <div className="grid grid-cols-3 gap-3 my-2 text-center">
                  <div className="border border-gray-300 p-2.5 rounded-lg">
                    <span className="text-[9px] font-black text-gray-400 uppercase block">Score de Discipline</span>
                    <span className="text-2xl font-black text-gray-900">100%</span>
                  </div>
                  <div className="border border-gray-300 p-2.5 rounded-lg">
                    <span className="text-[9px] font-black text-gray-400 uppercase block">Jours Actifs</span>
                    <span className="text-2xl font-black text-gray-900">1 Jour</span>
                  </div>
                  <div className="border border-gray-300 p-2.5 rounded-lg">
                    <span className="text-[9px] font-black text-gray-400 uppercase block">Série Actuelle</span>
                    <span className="text-2xl font-black text-emerald-600">2 🔥</span>
                  </div>
                </div>

                {/* Checklist overview */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-900">Tâches Accomplies</h4>
                  <div className="border border-gray-300 rounded-lg p-3 text-xs flex flex-col gap-1.5 bg-gray-50">
                    <div className="flex justify-between text-gray-800 font-bold">
                      <span>✓ Early Waking (04h30)</span>
                      <span className="text-emerald-600 font-black">VALIDÉ</span>
                    </div>
                    <div className="flex justify-between text-gray-800 font-bold border-t border-gray-200 pt-1.5">
                      <span>✓ Prière & Méditation (04h35)</span>
                      <span className="text-emerald-600 font-black">VALIDÉ</span>
                    </div>
                    <div className="flex justify-between text-gray-800 font-bold border-t border-gray-200 pt-1.5">
                      <span>✓ Sport (05h05)</span>
                      <span className="text-green-600 font-black">VALIDÉ</span>
                    </div>
                    <div className="flex justify-between text-gray-800 font-bold border-t border-gray-200 pt-1.5">
                      <span>✓ Douche Froide (05h30)</span>
                      <span className="text-green-600 font-black">VALIDÉ</span>
                    </div>
                  </div>
                </div>

                {/* Coach Quote */}
                <div className="border-l-4 border-emerald-500 bg-emerald-50/5 p-3 rounded-r-lg text-xs italic font-medium text-gray-850 mt-2">
                  "La discipline est la clé de la liberté Franck. Chaque matin debout à 04:30 forge ta légende stoïcienne !" — Ton Coach IA
                </div>
              </div>
            </div>

            {/* Print trigger footer */}
            <div className="p-4 bg-[#161922] border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowPdfPreview(false)}
                className="flex-1 border border-slate-800 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer text-center"
              >
                Annuler
              </button>
              <button
                onClick={handlePrintPdf}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
              >
                <FileText size={14} />
                <span>Télécharger PDF / Imprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
