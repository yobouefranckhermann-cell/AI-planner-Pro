import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Hourglass, Bell, Mic, VolumeX, Volume2 } from 'lucide-react';
import { UserProfile } from '../types';

interface TimerPanelProps {
  profile?: UserProfile;
  textScale: number;
}

export default function TimerPanel({ profile, textScale }: TimerPanelProps) {
  // Picker state
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(37); // Set default to 37 minutes like screenshot!
  const [seconds, setSeconds] = useState(0);

  // Active countdown state
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [initialDuration, setInitialDuration] = useState<number>(0);

  // Alert & Ringing state
  const [alertType, setAlertType] = useState<'alarm' | 'voice'>('alarm');
  const [isRinging, setIsRinging] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeAlarmRef = useRef<{ stop: () => void } | null>(null);
  const testAlarmRef = useRef<{ stop: () => void } | null>(null);

  // Format Helper: pad digits
  const pad = (n: number) => n.toString().padStart(2, '0');

  // Alarm sound generator: plays a pulsing dual-tone beep for specified duration
  const playAlarmSound = (durationSeconds: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const start = audioCtx.currentTime;
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, start); // A5 Tone
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, start); // A4 Tone

      gainNode.gain.setValueAtTime(0, start);
      
      const beepInterval = 0.5; // beep every 0.5s
      for (let t = 0; t < durationSeconds; t += beepInterval) {
        // Pulse sound on
        gainNode.gain.setValueAtTime(0.25, start + t);
        // Pulse sound off
        gainNode.gain.setValueAtTime(0, start + t + 0.25);
      }
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start(start);
      osc2.start(start);
      
      osc1.stop(start + durationSeconds);
      osc2.stop(start + durationSeconds);

      return {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
            audioCtx.close();
          } catch (err) {}
        }
      };
    } catch (e) {
      console.error("AudioContext not supported or blocked", e);
      return null;
    }
  };

  // Text-To-Speech generator: speaks stoic reminder mentioning the user's name
  const playVoiceSpeech = (name: string, language: string = 'fr') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // clear previous speech
      
      const isEn = language === 'en';
      const textToSpeak = isEn 
        ? "Time's up! Move on to something else."
        : (name ? `C'est fini ${name.trim()}, passe à autre chose.` : "C'est fini, passe à autre chose.");
        
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = isEn ? 'en-US' : 'fr-FR';
      utterance.rate = 0.95; // slightly deliberate for stoic impact
      utterance.pitch = 1.0;
      
      // Try to find a voice that matches the language
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(isEn ? 'en' : 'fr'));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis not supported in this browser.");
    }
  };

  // Stop any active alerts
  const stopAlert = () => {
    setIsRinging(false);
    if (activeAlarmRef.current) {
      activeAlarmRef.current.stop();
      activeAlarmRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Test current alert setting immediately
  const testCurrentAlert = () => {
    if (isTesting) {
      // Stop testing
      setIsTesting(false);
      if (testAlarmRef.current) {
        testAlarmRef.current.stop();
        testAlarmRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      // Stop any active real alarms first
      stopAlert();
      
      setIsTesting(true);
      if (alertType === 'alarm') {
        const handle = playAlarmSound(5); // test for 5 seconds
        if (handle) {
          testAlarmRef.current = handle;
        }
        setTimeout(() => {
          setIsTesting(false);
        }, 5000);
      } else {
        playVoiceSpeech(profile?.name || '', profile?.language || 'fr');
        setTimeout(() => {
          setIsTesting(false);
        }, 4000);
      }
    }
  };

  // Trigger alert when countdown ends
  const triggerAlert = () => {
    setIsRinging(true);

    if (alertType === 'alarm') {
      const handle = playAlarmSound(10); // Sounds for exactly 10 seconds as requested!
      if (handle) {
        activeAlarmRef.current = handle;
      }
      // Automatically turn off ringing state after 10 seconds
      setTimeout(() => {
        setIsRinging(false);
      }, 10000);
    } else {
      // Soft chime first, then voice
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}

      // Speak voice after a tiny delay
      setTimeout(() => {
        playVoiceSpeech(profile?.name || '', profile?.language || 'fr');
      }, 400);

      // Automatically turn off ringing after 5 seconds for voice
      setTimeout(() => {
        setIsRinging(false);
      }, 5000);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeAlarmRef.current) activeAlarmRef.current.stop();
      if (testAlarmRef.current) testAlarmRef.current.stop();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Increment/Decrement Wheel Helpers
  const adjustValue = (
    type: 'hours' | 'minutes' | 'seconds',
    direction: 'up' | 'down'
  ) => {
    if (isRunning || isRinging) return; // Prevent changing picker while running or ringing

    if (type === 'hours') {
      setHours((prev) => {
        let next = direction === 'up' ? prev + 1 : prev - 1;
        if (next > 99) return 0;
        if (next < 0) return 99;
        return next;
      });
    } else if (type === 'minutes') {
      setMinutes((prev) => {
        let next = direction === 'up' ? prev + 1 : prev - 1;
        if (next > 59) return 0;
        if (next < 0) return 59;
        return next;
      });
    } else {
      setSeconds((prev) => {
        let next = direction === 'up' ? prev + 1 : prev - 1;
        if (next > 59) return 0;
        if (next < 0) return 59;
        return next;
      });
    }
  };

  // Quick Preset Selection
  const applyPreset = (h: number, m: number, s: number) => {
    if (isRunning) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    stopAlert();
    if (isTesting) {
      setIsTesting(false);
      if (testAlarmRef.current) {
        testAlarmRef.current.stop();
        testAlarmRef.current = null;
      }
    }
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    setTimeLeft(null); // Reset countdown view to picker view
  };

  // Start / Pause Control
  const handleStartPause = () => {
    stopAlert();
    if (isTesting) {
      setIsTesting(false);
      if (testAlarmRef.current) {
        testAlarmRef.current.stop();
        testAlarmRef.current = null;
      }
    }
    if (isRunning) {
      // Pause
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      // Start
      let totalSecs = timeLeft;
      if (timeLeft === null || timeLeft === 0) {
        totalSecs = hours * 3600 + minutes * 60 + seconds;
        if (totalSecs === 0) return; // cannot start a 00:00:00 timer
        setInitialDuration(totalSecs);
      }
      
      setTimeLeft(totalSecs);
      setIsRunning(true);
    }
  };

  // Reset Control
  const handleReset = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(null);
    stopAlert();
    if (isTesting) {
      setIsTesting(false);
      if (testAlarmRef.current) {
        testAlarmRef.current.stop();
        testAlarmRef.current = null;
      }
    }
  };

  // Countdown timer engine
  useEffect(() => {
    if (isRunning && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev !== null && prev > 1) {
            return prev - 1;
          } else {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            triggerAlert();
            return 0;
          }
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, alertType]);

  // Calculations for current countdown digits
  const getCountdownDigits = () => {
    if (timeLeft === null) return { h: hours, m: minutes, s: seconds };
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    return { h, m, s };
  };

  const currentDigits = getCountdownDigits();

  // Helper to get surrounding values for picker layout
  const getPrevValue = (val: number, max: number) => {
    let prev = val - 1;
    return prev < 0 ? max : prev;
  };

  const getNextValue = (val: number, max: number) => {
    let next = val + 1;
    return next > max ? 0 : next;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-6 py-6 bg-[#0A0B0E] text-slate-200 overflow-y-auto w-full theme-timer-panel">
      
      {/* 1. Header Title */}
      <div className="flex flex-col items-center gap-1 mt-2 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 animate-pulse theme-timer-icon">
          <Hourglass size={18} className="text-emerald-400" />
        </div>
        <h3 className="font-bold text-sm text-slate-200 tracking-wider font-serif uppercase mt-2 theme-timer-title">
          Minuteur Stoïcien
        </h3>
        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          Focus & Discipline
        </p>
      </div>

      {/* 2. Interactive Scrolling Wheel Display */}
      <div className="flex flex-col items-center justify-center w-full my-4 min-h-[160px]">
        {timeLeft === null ? (
          /* PICKER MODE (WHEEL FEEL AS SHOWN IN SCREENSHOT) */
          <div className="flex items-center justify-center gap-8 font-sans select-none">
            {/* Hours Column */}
            <div className="flex flex-col items-center w-16">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Hours</span>
              <button onClick={() => adjustValue('hours', 'up')} className="text-slate-600 hover:text-emerald-400 font-bold py-1 text-sm transition-colors">▲</button>
              <span className="text-2xl font-semibold text-slate-600 opacity-20 font-mono">
                {pad(getPrevValue(hours, 99))}
              </span>
              <span className="text-4xl font-extrabold text-slate-200 my-1 font-mono scale-110 transition-transform theme-timer-active-digit">
                {pad(hours)}
              </span>
              <span className="text-2xl font-semibold text-slate-600 opacity-20 font-mono">
                {pad(getNextValue(hours, 99))}
              </span>
              <button onClick={() => adjustValue('hours', 'down')} className="text-slate-600 hover:text-emerald-400 font-bold py-1 text-sm transition-colors">▼</button>
            </div>

            {/* Separator */}
            <span className="text-3xl font-black text-slate-700 pt-8 font-mono">:</span>

            {/* Minutes Column */}
            <div className="flex flex-col items-center w-16">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Minutes</span>
              <button onClick={() => adjustValue('minutes', 'up')} className="text-slate-600 hover:text-emerald-400 font-bold py-1 text-sm transition-colors">▲</button>
              <span className="text-2xl font-semibold text-slate-600 opacity-20 font-mono">
                {pad(getPrevValue(minutes, 59))}
              </span>
              <span className="text-4xl font-extrabold text-slate-200 my-1 font-mono scale-110 transition-transform theme-timer-active-digit">
                {pad(minutes)}
              </span>
              <span className="text-2xl font-semibold text-slate-600 opacity-20 font-mono">
                {pad(getNextValue(minutes, 59))}
              </span>
              <button onClick={() => adjustValue('minutes', 'down')} className="text-slate-600 hover:text-emerald-400 font-bold py-1 text-sm transition-colors">▼</button>
            </div>

            {/* Separator */}
            <span className="text-3xl font-black text-slate-700 pt-8 font-mono">:</span>

            {/* Seconds Column */}
            <div className="flex flex-col items-center w-16">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">Seconds</span>
              <button onClick={() => adjustValue('seconds', 'up')} className="text-slate-600 hover:text-emerald-400 font-bold py-1 text-sm transition-colors">▲</button>
              <span className="text-2xl font-semibold text-slate-600 opacity-20 font-mono">
                {pad(getPrevValue(seconds, 59))}
              </span>
              <span className="text-4xl font-extrabold text-slate-200 my-1 font-mono scale-110 transition-transform theme-timer-active-digit">
                {pad(seconds)}
              </span>
              <span className="text-2xl font-semibold text-slate-600 opacity-20 font-mono">
                {pad(getNextValue(seconds, 59))}
              </span>
              <button onClick={() => adjustValue('seconds', 'down')} className="text-slate-600 hover:text-emerald-400 font-bold py-1 text-sm transition-colors">▼</button>
            </div>
          </div>
        ) : (
          /* COUNTDOWN / RINGING ACTIVE VIEW */
          <div className="flex flex-col items-center justify-center font-mono w-full px-4">
            {isRinging ? (
              <div className="flex flex-col items-center justify-center py-3 w-full bg-red-500/10 border border-red-500/30 rounded-3xl p-5 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-3 animate-bounce">
                  {alertType === 'alarm' ? (
                    <Bell size={24} className="text-red-400 animate-spin" />
                  ) : (
                    <Mic size={24} className="text-red-400 animate-pulse" />
                  )}
                </div>
                <div className="text-lg font-black text-red-400 uppercase tracking-widest text-center">
                  Temps Écoulé !
                </div>
                <p className="text-[10px] text-slate-300 uppercase tracking-wider mt-1 text-center font-mono max-w-[220px]">
                  {alertType === 'alarm' 
                    ? "Alarme active pendant 10s..." 
                    : `Message Stoïque destiné à ${profile?.name || "Franck"}`}
                </p>
                <button
                  onClick={stopAlert}
                  className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-md transition-all border border-red-500"
                >
                  <VolumeX size={13} />
                  <span>Arrêter l'Alerte</span>
                </button>
              </div>
            ) : (
              <>
                {/* Digital countdown */}
                <div className="text-5xl font-black tracking-widest text-slate-100 flex items-center justify-center gap-1.5 animate-pulse theme-timer-countdown">
                  <span>{pad(currentDigits.h)}</span>
                  <span className="text-emerald-400 animate-bounce">:</span>
                  <span>{pad(currentDigits.m)}</span>
                  <span className="text-emerald-400 animate-bounce">:</span>
                  <span>{pad(currentDigits.s)}</span>
                </div>

                {/* Progress Bar under countdown digits */}
                <div className="w-56 bg-slate-800/60 h-1.5 rounded-full mt-6 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(timeLeft / initialDuration) * 100}%` }}
                  />
                </div>

                {timeLeft === 0 && (
                  <div className="mt-4 text-xs font-bold text-emerald-400 animate-bounce">
                    ⏱️ Session Terminée ! Reste Stoïque !
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Preset Circles (As seen in the screenshot) */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={() => applyPreset(0, 10, 0)}
          className="w-16 h-16 rounded-full bg-slate-800/40 border border-slate-800 hover:border-emerald-500/50 hover:bg-[#161922] flex items-center justify-center text-[10px] font-mono font-bold text-slate-300 shadow-sm cursor-pointer transition-all theme-timer-preset"
        >
          00:10:00
        </button>
        <button
          onClick={() => applyPreset(0, 15, 0)}
          className="w-16 h-16 rounded-full bg-slate-800/40 border border-slate-800 hover:border-emerald-500/50 hover:bg-[#161922] flex items-center justify-center text-[10px] font-mono font-bold text-slate-300 shadow-sm cursor-pointer transition-all theme-timer-preset"
        >
          00:15:00
        </button>
        <button
          onClick={() => applyPreset(0, 30, 0)}
          className="w-16 h-16 rounded-full bg-slate-800/40 border border-slate-800 hover:border-emerald-500/50 hover:bg-[#161922] flex items-center justify-center text-[10px] font-mono font-bold text-slate-300 shadow-sm cursor-pointer transition-all theme-timer-preset"
        >
          00:30:00
        </button>
      </div>

      {/* 3.5. Interactive Alarm/Voice Alert Mode Options */}
      <div className="flex flex-col items-center gap-2.5 w-full max-w-xs my-2 bg-[#12141C]/30 border border-slate-800/60 p-3 rounded-2xl">
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Type d'alerte finale
          </span>
          <button
            onClick={testCurrentAlert}
            className={`text-[9px] font-bold font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-lg border cursor-pointer transition-all ${
              isTesting
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isTesting ? "Arrêter ⏹️" : "Tester 🔊"}
          </button>
        </div>
        
        <div className="flex w-full bg-[#12141C]/80 rounded-xl p-1 border border-slate-800/80">
          <button
            onClick={() => {
              setAlertType('alarm');
              stopAlert();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
              alertType === 'alarm'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161922]'
            }`}
          >
            <Bell size={12} />
            <span>Alarme (10s)</span>
          </button>
          
          <button
            onClick={() => {
              setAlertType('voice');
              stopAlert();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
              alertType === 'voice'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161922]'
            }`}
          >
            <Mic size={12} />
            <span>Voix Stoïque 🗣️</span>
          </button>
        </div>
      </div>

      {/* 4. Controls & Start Button */}
      <div className="flex flex-col items-center gap-4 w-full max-w-xs mb-2">
        <div className="flex items-center justify-center gap-4 w-full">
          {timeLeft !== null && (
            <button
              onClick={handleReset}
              className="p-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs transition-colors shadow-sm"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={handleStartPause}
            className={`flex-1 py-3.5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-white ${
              isRunning 
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-950/20' 
                : 'bg-[#6366f1] hover:bg-[#4f46e5] shadow-indigo-950/20' /* Matches the purple/blue start button in screenshot! */
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={14} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Start</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[9px] text-slate-600 uppercase font-mono tracking-widest text-center mt-2">
          La patience et le focus sont les vertus suprêmes.
        </p>
      </div>

    </div>
  );
}
