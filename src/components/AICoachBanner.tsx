import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, X, MessageSquare, Flame } from 'lucide-react';
import { ChatMessage } from '../types';

interface AICoachBannerProps {
  userName: string;
  currentTimeStr: string;
  completedTasks: string[];
  pendingTasks: string[];
  streak: number;
  currentDateStr: string;
  textScale: number;
}

export default function AICoachBanner({
  userName,
  currentTimeStr,
  completedTasks,
  pendingTasks,
  streak,
  currentDateStr,
  textScale,
}: AICoachBannerProps) {
  const [bannerMessage, setBannerMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chatbot banner based on current French time
  useEffect(() => {
    const timeParts = currentTimeStr.split(':');
    if (timeParts.length < 2) return;
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const totalMinutes = hour * 60 + minute;

    let msg = '';
    if (totalMinutes >= 4 * 60 + 30 && totalMinutes < 4 * 60 + 35) {
      msg = `🌅 Bonjour ${userName} ! Il est 04h30, l'heure de ton réveil d'élite ("Early Waking"). Pas d'excuses !`;
    } else if (totalMinutes >= 4 * 60 + 35 && totalMinutes < 5 * 60) {
      msg = `🙏 ${userName}, c'est l'heure de la Prière. Un moment de connexion et de gratitude profonde.`;
    } else if (totalMinutes >= 5 * 60 && totalMinutes < 5 * 60 + 5) {
      msg = `🧘 ${userName}, c'est l'heure de la Méditation. Respire profondément et aligne ton esprit.`;
    } else if (totalMinutes >= 5 * 60 + 5 && totalMinutes < 5 * 60 + 30) {
      msg = `🏋️ ${userName}, c'est l'heure du Sport ! Forge ton corps, repousse tes limites physiques !`;
    } else if (totalMinutes >= 5 * 60 + 30 && totalMinutes < 5 * 60 + 40) {
      msg = `❄️ ${userName}, c'est l'heure de la Douche froide ! Ton épreuve quotidienne de pure discipline.`;
    } else if (totalMinutes >= 5 * 60 + 40 && totalMinutes < 6 * 60 + 40) {
      msg = `📚 ${userName}, c'est l'heure de ta Formation. Travaille sur tes compétences, construis ton futur.`;
    } else if (totalMinutes >= 20 * 60 && totalMinutes < 20 * 60 + 30) {
      msg = `🛁 ${userName}, c'est l'heure de ton Bain / Douche. Libère les tensions de la journée.`;
    } else if (totalMinutes >= 20 * 60 + 30 && totalMinutes < 21 * 60 + 40) {
      msg = `💻 ${userName}, c'est l'heure de ta Formation du soir. Reste concentré sur tes objectifs de croissance.`;
    } else if (totalMinutes >= 22 * 60 && totalMinutes < 22 * 60 + 30) {
      msg = `📖 ${userName}, c'est l'heure de la Lecture. Enrichis ton esprit avec de nouvelles idées.`;
    } else if (totalMinutes >= 22 * 60 + 30 && totalMinutes < 23 * 60 + 30) {
      msg = `✍️ ${userName}, c'est l'heure de ton Journal & Réflexion. Note tes victoires et exprime ta gratitude.`;
    } else {
      msg = `✨ "La discipline est le pont entre les objectifs et l'accomplissement." Reste fort, ${userName} !`;
    }
    setBannerMessage(msg);
  }, [currentTimeStr, userName]);

  // Initial welcome message from AI
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `Bonjour Franck ! Je suis ton coach de discipline IA d'élite. 

Il est actuellement ${currentTimeStr}. Tu es sur une série de ${streak} jours consécutifs actifs 🔥 !
${completedTasks.length > 0 ? `Tu as déjà accompli : ${completedTasks.join(', ')}. Excellent !` : "Tu n'as pas encore validé de tâches aujourd'hui. C'est le moment de commencer !"}

De quoi as-tu besoin aujourd'hui ? Demande-moi des encouragements, une citation motivante, ou discutions de tes tâches du jour.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [isChatOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userContext: {
            name: userName,
            time: currentTimeStr,
            date: currentDateStr,
            completedTasks,
            pendingTasks,
            streak,
          },
        }),
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + '_err',
            sender: 'ai',
            text: `Désolé Franck, j'ai rencontré un problème : ${data.error}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + '_ai',
            sender: 'ai',
            text: data.text,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (e: any) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + '_err',
          sender: 'ai',
          text: `Erreur de connexion avec le serveur IA : ${e.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <>
      {/* Banner below navigation tab */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="w-full bg-[#12141C] text-slate-200 px-4 py-2.5 flex items-center gap-2.5 text-left border-b border-slate-800/60 cursor-pointer hover:bg-[#161922] transition-all theme-coach-banner"
        style={{ fontSize: `${textScale * 0.75}rem` }}
      >
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-emerald-500 text-white rounded-lg shadow-sm theme-coach-avatar">
          <span className="text-[12px]">🤖</span>
        </div>
        <div className="flex-1 font-medium leading-tight text-slate-300 theme-coach-text">
          {bannerMessage.includes(userName) && userName ? (
            <>
              {bannerMessage.split(userName)[0]}
              <span className="text-emerald-400 font-bold user-name-highlight">{userName}</span>
              {bannerMessage.split(userName)[1]}
            </>
          ) : (
            bannerMessage
          )}
        </div>
        <div className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 font-bold tracking-wider uppercase border border-emerald-500/20 animate-pulse theme-coach-badge">
          IA Coach
        </div>
      </button>

      {/* Floating AI Coach Panel */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0A0B0E] border border-slate-800/80 w-full sm:max-w-md h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Chat Header */}
            <div className="bg-[#12141C] text-white px-4 py-4 flex items-center justify-between border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-950/40">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-slate-100 font-serif">AI Coach de Discipline</h3>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    <Sparkles size={10} />
                    <span>Propulsé par Gemini</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#0A0B0E] flex flex-col gap-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-[#12141C] text-slate-200 border border-slate-800 rounded-bl-none whitespace-pre-wrap'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="self-start flex items-center gap-1.5 bg-[#12141C] border border-slate-800 px-3.5 py-2.5 rounded-2xl rounded-bl-none shadow-xs">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 bg-[#12141C] border-t border-slate-800/80 flex gap-2">
              <input
                type="text"
                placeholder="Discute avec ton coach ou demande une citation..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#0A0B0E] border border-slate-800 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-[#0A0B0E] transition-all text-slate-200 placeholder-slate-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
