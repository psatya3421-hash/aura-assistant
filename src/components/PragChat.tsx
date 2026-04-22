import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Mic, MicOff, Volume2, StopCircle } from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Constants for Speech Recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

export default function PragChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hello! I'm Prag AI, your intelligent assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsLoadingId, setTtsLoadingId] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const startListening = () => {
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: messages.concat(userMessage).map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are Prag AI, a sharp, helpful, and polite AI personal assistant created by P.S.Pragadeesh. You are integrated into the Aura Assistant app. If anyone asks who created you, you must state that you were created by P.S.Pragadeesh. Provide concise and highly accurate answers."
        }
      });

      const botMessage: Message = {
        role: "bot",
        text: response.text || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Oops! Something went wrong. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = async (text: string, id: number) => {
    if (isSpeaking) return;
    setTtsLoadingId(id);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Different voice for general assistant
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioCtx = audioContextRef.current;
        const int16Buffer = new Int16Array(bytes.buffer);
        const float32Buffer = new Float32Array(int16Buffer.length);
        for (let i = 0; i < int16Buffer.length; i++) float32Buffer[i] = int16Buffer[i] / 32768;
        
        const audioBuffer = audioCtx.createBuffer(1, float32Buffer.length, 24000);
        audioBuffer.getChannelData(0).set(float32Buffer);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        setIsSpeaking(true);
        source.start();
      }
    } catch (e) {
      console.error("TTS Error:", e);
    } finally {
      setTtsLoadingId(null);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "bot",
      text: "Chat cleared. What's on your mind?",
      timestamp: new Date()
    }]);
  };

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col gap-4">
      <div className="glass-card flex-1 rounded-[2rem] flex flex-col overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-bg-dark/40 to-transparent pointer-events-none z-10" />
        
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-brand-primary border border-white/10">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Prag AI</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Core</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={clearChat}
            className="p-2.5 glass rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] group ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                  m.role === "bot" ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" : "bg-white/5 border-white/10 text-white/40"
                }`}>
                  {m.role === "bot" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="space-y-2">
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "bot" ? "glass-card border-white/5 text-white/80" : "bg-brand-primary/10 border border-brand-primary/20 text-white"
                  }`}>
                    {m.text}
                  </div>
                  {m.role === "bot" && (
                    <button 
                      onClick={() => speakMessage(m.text, idx)}
                      disabled={ttsLoadingId !== null || isSpeaking}
                      className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest transition-all ${
                        ttsLoadingId === idx || isSpeaking ? "text-brand-primary animate-pulse" : "text-white/20 hover:text-white/40"
                      }`}
                    >
                      {ttsLoadingId === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : isSpeaking ? <StopCircle className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {isSpeaking ? "Speaking..." : "Read Aloud"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex gap-1.5 p-3 glass rounded-2xl border border-white/5">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white/[0.02] border-t border-white/5 relative z-20">
          <div className="flex gap-2">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-4 rounded-2xl transition-all duration-300 border shrink-0 ${
                isListening ? "bg-red-500/20 border-red-500/50 text-red-500 animate-pulse" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type or use mic..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/80 disabled:opacity-30 transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 justify-center opacity-30">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-white">Prag Core 3.1 Pro Integrated</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {["How to save 10k in a month?", "Recycle milk cartons?", "Quick dinner idea", "50/30/20 rule"].map((q) => (
          <button key={q} onClick={() => setInput(q)} className="whitespace-nowrap px-4 py-2 rounded-xl glass border-white/5 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-brand-primary transition-all">{q}</button>
        ))}
      </div>
    </div>
  );
}

