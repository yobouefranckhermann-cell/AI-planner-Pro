import React, { useState } from 'react';
import { UserProfile, AppState } from '../types';
import { 
  Settings, User, Bell, Sliders, Save, FileText, Download, Upload, 
  Smartphone, Shield, Check, RefreshCw, AlertTriangle, Eye, Palette 
} from 'lucide-react';

interface SettingsPanelProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onSyncWithServer: () => Promise<{ success: boolean; message: string }>;
  onExportData: () => void;
  onImportData: (file: File) => void;
  textScale: number;
}

export default function SettingsPanel({
  profile,
  onUpdateProfile,
  onSyncWithServer,
  onExportData,
  onImportData,
  textScale,
}: SettingsPanelProps) {
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
    setSyncStatus('Profil mis à jour localement !');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setSyncStatus('Synchronisation avec le cloud en cours...');
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
      
      {/* 1. PROFILE SECTION (SYNC WITH UNIQUE ACCOUNT) */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <User size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">Compte Unique & Sauvegarde</h3>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          Renseigne ton nom et Gmail. Toutes tes données seront sauvegardées sur ton compte unique et se chargeront automatiquement sur n'importe quel appareil !
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">Nom Complet</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="bg-[#0A0B0E] border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">Adresse Gmail</label>
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

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleUpdateProfileLocal}
              className="py-2 px-3 border border-slate-800 rounded-xl hover:bg-[#161922] font-bold text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Save size={12} />
              <span>Sauver Local</span>
            </button>
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-600 text-white bg-emerald-500 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>Sync Cloud</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TEXT SIZE SLIDER */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Sliders size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">Taille de l'Application</h3>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mt-1">
          <span>Réduire (-10%)</span>
          <span className="text-emerald-400 font-bold font-mono">{Math.round(textScale * 100)}%</span>
          <span>Agrandir (+50%)</span>
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
          Faites glisser pour ajuster instantanément la taille de la police et la densité d'affichage de toute l'interface.
        </p>
      </div>

      {/* 2.5. CHOIX DU THÈME */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Palette size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">Thème de l'Application</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            { id: 'blanc', name: 'Blanc', desc: 'Thème clair épuré', colorBg: 'bg-white border-slate-200 text-slate-900', colorDot: 'bg-slate-400' },
            { id: 'noir', name: 'Noir', desc: 'Saphir nocturne', colorBg: 'bg-[#0A0B0E] border-slate-800 text-slate-200', colorDot: 'bg-emerald-500' },
            { id: 'orange', name: 'Orange', desc: 'Énergie vibrante', colorBg: 'bg-[#1c100b] border-amber-950 text-amber-100', colorDot: 'bg-[#f15a24]' },
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
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">Rappels & Notifications</h3>
        </div>

        <div className="flex flex-col gap-3 mt-1">
          <button
            onClick={() => handleToggleNotification('tasks')}
            className="flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Rappels de tâches</span>
              <span className="text-[10px] text-slate-500">Alerte à l'heure exacte des habitudes</span>
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
              <span className="text-xs font-bold text-slate-200">Message matinal IA</span>
              <span className="text-[10px] text-slate-500">Résumé et motivation de l'assistant à 04h30</span>
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
              <span className="text-xs font-bold text-slate-200">Bilan du soir IA</span>
              <span className="text-[10px] text-slate-500">Rapport de discipline envoyé à 21h00</span>
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
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">Rapport PDF Quotidien</h3>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          Génère instantanément ton bilan quotidien personnalisé avec graphique récapitulatif pour analyser ta progression. Prêt à être imprimé ou enregistré en PDF.
        </p>
        <button
          onClick={() => setShowPdfPreview(true)}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Eye size={14} />
          <span>Générer et Imprimer le Rapport PDF</span>
        </button>
      </div>

      {/* 5. BACKUP DATA FILES */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Save size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">Sauvegarde & Restauration</h3>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          Exporte toutes tes données locales sous forme de fichier JSON pour en faire des copies de sauvegarde physiques ou les importer ultérieurement.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={onExportData}
            className="py-2 border border-slate-800 rounded-xl hover:bg-[#161922] font-bold text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Download size={12} />
            <span>Exporter</span>
          </button>
          <label className="py-2 border border-slate-800 rounded-xl hover:bg-[#161922] font-bold text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1 text-center">
            <Upload size={12} />
            <span>Importer</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && onImportData(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 6. APK GUIDE FOR FRANCK */}
      <div className="bg-[#12141C] border border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2.5">
          <Smartphone size={16} className="text-emerald-400" />
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-widest font-mono">Convertir en APK Mobile</h3>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed -mt-1">
          Apprends comment installer facilement cette application sur ton smartphone Android comme une application native ou la compiler en fichier .apk.
        </p>
        <button
          onClick={() => setShowApkGuide(!showApkGuide)}
          className="w-full py-2 bg-[#0A0B0E] hover:bg-[#161922] border border-slate-800 rounded-xl font-bold text-xs text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <span>{showApkGuide ? 'Masquer le tutoriel' : 'Afficher le tutoriel APK'}</span>
        </button>

        {showApkGuide && (
          <div className="bg-[#161922] border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-mono">
              <Check size={14} />
              <span>Méthode 1 : Installation PWA (Instantané)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed pl-5">
              Ouvre l'application sur ton téléphone Android via <strong>Google Chrome</strong>. Clique sur les <strong>3 points</strong> en haut à droite, puis sélectionne <strong>"Ajouter à l'écran d'accueil"</strong>. L'application se comportera à 100% comme une APK native, sans bandeau de navigateur !
            </p>

            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-mono border-t border-slate-800/40 pt-2">
              <Check size={14} />
              <span>Méthode 2 : Compiler un fichier APK en 2 minutes</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed pl-5">
              1. Copie l'URL complète de cette application.<br />
              2. Rends-toi sur le site gratuit <strong>Webintoapp.com</strong> ou <strong>AppMySite</strong>.<br />
              3. Colle l'URL de l'app, choisis le nom <strong>"AI Planner Pro"</strong>, choisis l'icône, puis clique sur <strong>"Generate App"</strong>.<br />
              4. Télécharge et installe directement le fichier <code>.apk</code> sur ton smartphone !
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
                <span className="font-bold text-[9px] text-emerald-400 uppercase tracking-widest font-mono">Rapport de Discipline</span>
                <span className="font-bold text-sm text-slate-200 font-serif">Aperçu du Rapport Quotidien</span>
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
