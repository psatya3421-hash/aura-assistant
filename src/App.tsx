import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Trash2, ChefHat, LayoutDashboard, MessageSquare } from "lucide-react";
import FinancePlanner from "./components/FinancePlanner";
import WasteGuide from "./components/WasteGuide";
import AIPantryChef from "./components/AIPantryChef";
import PragChat from "./components/PragChat";

export default function App() {
  const [activeTab, setActiveTab] = useState("finance");

  const tabs = [
    { id: "finance", label: "Finance", icon: Wallet, component: FinancePlanner },
    { id: "waste", label: "Waste Guide", icon: Trash2, component: WasteGuide },
    { id: "cooking", label: "Pantry Chef", icon: ChefHat, component: AIPantryChef },
    { id: "chat", label: "Prag AI", icon: MessageSquare, component: PragChat },
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component || FinancePlanner;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-secondary/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-8 flex flex-col items-center md:flex-row md:justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center border border-white/10">
            <LayoutDashboard className="text-brand-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              Aura Assistant
            </h1>
            <p className="text-xs text-white/50 font-medium uppercase tracking-[0.2em]">
              Smart Essential Toolkit
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="mt-8 md:mt-0 flex p-1 glass rounded-2xl border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-brand-primary" : ""}`} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Areas */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full h-full"
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/5 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
          Powered by Gemini Intelligence • Aura v1.0
        </p>
      </footer>
    </div>
  );
}
