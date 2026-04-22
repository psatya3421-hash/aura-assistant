import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, ShoppingBasket, Sparkles, Wand2, Clock, Volume2, Mic, MicOff, Loader2, StopCircle } from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Constants for Speech Recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function AIPantryChef() {
  const [ingredients, setIngredients] = useState("");
  const [recipe, setRecipe] = useState<{ title: string; steps: string[]; time: string; diff: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
      setIngredients(prev => prev + (prev ? ", " : "") + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const generateRecipe = async () => {
    if (!ingredients.trim()) return;
    setIsLoading(true);
    setRecipe(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have these ingredients: ${ingredients}. 
        Please create a simple, easy-to-follow recipe.
        Respond ONLY with a JSON object in this format: 
        { "title": "Recipe Name", "steps": ["step 1", "step 2", ...], "time": "e.g. 20 mins", "diff": "Easy/Medium" }`,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      setRecipe(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const speakRecipe = async () => {
    if (!recipe || isSpeaking) return;
    setTtsLoading(true);
    try {
      const textToSpeak = `The recipe is ${recipe.title}. It takes ${recipe.time} and is ${recipe.diff} difficulty. Instructions: ${recipe.steps.join(". ")}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: textToSpeak }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Convert base64 to buffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Gemini TTS returns raw PCM 16-bit 24kHz
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const audioCtx = audioContextRef.current;
        const arrayBuffer = bytes.buffer;
        const int16Buffer = new Int16Array(arrayBuffer);
        const float32Buffer = new Float32Array(int16Buffer.length);
        
        for (let i = 0; i < int16Buffer.length; i++) {
          float32Buffer[i] = int16Buffer[i] / 32768; // Normalize to [-1, 1]
        }
        
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
      setTtsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-32 h-32 bg-brand-secondary/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/20 flex items-center justify-center text-brand-secondary">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">AI Pantry Chef</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Smart Recipe Engine</p>
            </div>
          </div>

          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-3 rounded-xl transition-all duration-300 border ${
              isListening 
                ? "bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="What's in your kitchen? (e.g. Eggs, Paneer, Rice)"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 transition-all placeholder:text-white/10 text-lg leading-relaxed"
          />
          
          <button
            onClick={generateRecipe}
            disabled={isLoading || !ingredients.trim()}
            className="w-full bg-brand-secondary hover:bg-brand-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(236,72,153,0.3)] transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Wand2 className="w-6 h-6" />
                <span className="text-lg">Generate Recipe</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {recipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2rem] p-8 space-y-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  {recipe.title}
                </h3>
                <div className="flex gap-4 text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] items-center">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {recipe.time}</span>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="text-brand-secondary">{recipe.diff}</span>
                </div>
              </div>
              
              <button 
                onClick={speakRecipe}
                disabled={ttsLoading || isSpeaking}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-500 font-bold text-sm ${
                  isSpeaking 
                    ? "bg-brand-secondary/20 border-brand-secondary text-brand-secondary animate-pulse" 
                    : "glass border-white/10 text-white/40 hover:text-white hover:border-white/20"
                }`}
              >
                {ttsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSpeaking ? (
                  <>
                    <StopCircle className="w-4 h-4" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Read Aloud
                  </>
                )}
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-[2px] w-8 bg-brand-secondary rounded-full" />
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">Step-by-Step Guide</h4>
              </div>
              
              <div className="grid gap-6">
                {recipe.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-sm font-black text-brand-secondary group-hover:scale-110 group-hover:bg-brand-secondary/10 transition-all duration-500 border border-white/5">
                        {idx + 1}
                      </div>
                      {idx < recipe.steps.length - 1 && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-brand-secondary/40 to-transparent" />
                      )}
                    </div>
                    <p className="text-white/70 leading-relaxed pt-2 group-hover:text-white transition-colors text-lg italic">
                      "{step}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBasket className="w-5 h-5 text-brand-secondary/40" />
                <p className="text-[10px] text-white/20 uppercase font-bold tracking-[0.2em]">Pantry Optimized • Gemini AI</p>
              </div>
              <div className="p-2 glass rounded-lg">
                <Sparkles className="w-4 h-4 text-brand-secondary/40" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

