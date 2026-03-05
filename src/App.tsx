/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, 
  User, 
  Target, 
  Briefcase, 
  Dumbbell, 
  Heart, 
  Code, 
  Send, 
  Loader2, 
  AlertCircle,
  Info,
  History,
  Volume2,
  Copy,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Trash2,
  Wind,
  X
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { PERSONAS, COACH_PROMPT_TEMPLATE, QUICK_TEMPLATES } from './prompts';

type PersonaKey = keyof typeof PERSONAS;

interface HistoryItem {
  id: string;
  timestamp: number;
  goal: string;
  persona: PersonaKey;
  advice: string;
}

export default function App() {
  // State for inputs
  const [goal, setGoal] = useState("");
  const [situation, setSituation] = useState("");
  const [constraints, setConstraints] = useState("");
  
  // State for settings
  const [persona, setPersona] = useState<PersonaKey>("Career Coach");
  const [responseLength, setResponseLength] = useState("Medium");
  const [tone, setTone] = useState("Balanced");
  const [challengeLevel, setChallengeLevel] = useState("Balanced");
  const [language, setLanguage] = useState("English");
  const [temperature, setTemperature] = useState(0.4);
  
  // State for app logic
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('coach_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('coach_history', JSON.stringify(history));
  }, [history]);

  const handleAskCoach = async () => {
    if (!goal || !situation) {
      setError("Please provide at least a goal and a description of your situation.");
      return;
    }

    setError("");
    setIsLoading(true);
    setResponse("");

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key missing.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const personaDescription = PERSONAS[persona];
      const prompt = COACH_PROMPT_TEMPLATE
        .replace("{persona_description}", personaDescription)
        .replace("{goal}", goal)
        .replace("{situation}", situation)
        .replace("{constraints}", constraints || "None")
        .replace("{length}", responseLength)
        .replace("{tone}", tone)
        .replace("{challenge_level}", challengeLevel)
        .replace("{language}", language);

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: temperature,
        },
      });

      const adviceText = result.text || "No response received.";
      setResponse(adviceText);

      // Add to history
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        goal: goal,
        persona: persona,
        advice: adviceText
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));

    } catch (err: any) {
      console.error("Error calling Gemini API:", err);
      setError(err.message || "An error occurred while calling the Gemini API.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async () => {
    if (!response || isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: response }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: persona === "Mindfulness Guide" ? 'Kore' : 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBlob = await fetch(`data:audio/wav;base64,${base64Audio}`).then(r => r.blob());
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };
        }
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsSpeaking(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setGoal(template.goal);
    setSituation(template.situation);
    setConstraints(template.constraints);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const getPersonaIcon = (p: PersonaKey) => {
    switch (p) {
      case "Career Coach": return <Briefcase className="w-5 h-5" />;
      case "Fitness Coach": return <Dumbbell className="w-5 h-5" />;
      case "Life Coach": return <Heart className="w-5 h-5" />;
      case "Technical Mentor": return <Code className="w-5 h-5" />;
      case "Mindfulness Guide": return <Wind className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-sans selection:bg-red-500/30">
      <audio ref={audioRef} className="hidden" />
      
      {/* Navigation Rail */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight uppercase">Coach.AI</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-full transition-all ${showHistory ? 'bg-white/10 text-red-400' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-all ${showSettings ? 'bg-white/10 text-red-400' : 'hover:bg-white/5 text-gray-400'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-20 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Input Area */}
        <div className="lg:col-span-7 space-y-12">
          <header className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold tracking-tighter leading-none"
            >
              CRAFT YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">NEXT MOVE.</span>
            </motion.h1>
            <p className="text-gray-500 text-lg max-w-md">
              A premium AI coaching experience designed to help you navigate life's complexities with precision.
            </p>
          </header>

          <section className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUICK_TEMPLATES.map((t, i) => (
                <motion.button
                  key={t.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => applyTemplate(t)}
                  className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-red-400 transition-colors">Template</span>
                    <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-semibold text-white">{t.title}</h4>
                </motion.button>
              ))}
            </div>

            <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/5 backdrop-blur-sm">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">The Objective</label>
                <input 
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What are you trying to achieve?"
                  className="w-full bg-transparent border-b border-white/10 py-3 text-xl focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">The Context</label>
                <textarea 
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="Describe your current situation..."
                  rows={3}
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-700 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">The Constraints</label>
                <textarea 
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Any limitations or specific preferences?"
                  rows={2}
                  className="w-full bg-transparent border-b border-white/10 py-3 text-lg focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-700 resize-none"
                />
              </div>

              <button 
                onClick={handleAskCoach}
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    GENERATE ADVICE
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Output Area */}
        <div className="lg:col-span-5 relative">
          <AnimatePresence mode="wait">
            {!response && !isLoading ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-12 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-medium text-gray-400">Ready to assist.</h3>
                <p className="text-gray-600 text-sm">Fill in the details on the left to receive personalized coaching advice.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="response"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="sticky top-24 space-y-6"
              >
                <div className="bg-gradient-to-b from-white/10 to-transparent p-[1px] rounded-3xl">
                  <div className="bg-[#0A0A0A] rounded-[23px] p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-red-500">
                        {getPersonaIcon(persona)}
                        <span className="text-xs font-bold uppercase tracking-widest">{persona}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleTTS}
                          disabled={isSpeaking}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                          title="Read Aloud"
                        >
                          <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-red-500' : ''}`} />
                        </button>
                        <button 
                          onClick={copyToClipboard}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                          title="Copy to Clipboard"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="prose prose-invert prose-red max-w-none text-gray-300 leading-relaxed">
                      <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* History Sidebar Overlay */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0A0A0A] border-l border-white/10 z-[70] p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight">HISTORY</h2>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-gray-600">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No history yet.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setResponse(item.advice);
                        setGoal(item.goal);
                        setPersona(item.persona);
                        setShowHistory(false);
                      }}
                      className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group relative"
                    >
                      <div className="flex items-center gap-2 text-red-500 mb-2">
                        {getPersonaIcon(item.persona)}
                        <span className="text-[10px] font-bold uppercase tracking-widest">{item.persona}</span>
                        <span className="text-[10px] text-gray-600 ml-auto">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-medium text-white line-clamp-1 mb-1">{item.goal}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{item.advice}</p>
                      
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="absolute top-4 right-4 p-2 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl z-[70] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight">CONFIGURATION</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Coach Persona</label>
                    <select 
                      value={persona}
                      onChange={(e) => setPersona(e.target.value as PersonaKey)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                    >
                      {Object.keys(PERSONAS).map((p) => (
                        <option key={p} value={p} className="bg-[#0A0A0A]">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Language</label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                    >
                      {["English", "Spanish", "French", "German", "Hindi"].map((lang) => (
                        <option key={lang} value={lang} className="bg-[#0A0A0A]">{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Response Length</label>
                  <div className="flex gap-2">
                    {["Short", "Medium", "Long"].map((len) => (
                      <button
                        key={len}
                        onClick={() => setResponseLength(len)}
                        className={`flex-1 py-2 rounded-lg border transition-all text-xs font-bold ${responseLength === len ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                      >
                        {len.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Tone</label>
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                    >
                      {["Balanced", "Professional", "Encouraging", "Direct", "Empathetic"].map((t) => (
                        <option key={t} value={t} className="bg-[#0A0A0A]">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Challenge</label>
                    <select 
                      value={challengeLevel}
                      onChange={(e) => setChallengeLevel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500"
                    >
                      {["Low", "Balanced", "High"].map((cl) => (
                        <option key={cl} value={cl} className="bg-[#0A0A0A]">{cl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Creativity</label>
                    <span className="text-xs text-red-500 font-mono">{temperature.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
