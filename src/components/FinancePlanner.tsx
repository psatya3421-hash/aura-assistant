import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DollarSign, IndianRupee, Percent, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function FinancePlanner() {
  const [salary, setSalary] = useState<number>(0);
  const [percentages, setPercentages] = useState({
    needs: 50,
    wants: 30,
    savings: 20
  });
  const [proTip, setProTip] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const calculateBudget = () => {
    const total = salary || 0;
    
    // Auto-adjust logic for low salary
    let effectiveNeeds = percentages.needs;
    let effectiveWants = percentages.wants;
    let effectiveSavings = percentages.savings;

    if (total > 0 && total < 30000) {
      effectiveNeeds = Math.max(60, percentages.needs);
      effectiveWants = Math.min(25, percentages.wants);
      effectiveSavings = 100 - effectiveNeeds - effectiveWants;
    }

    // Sub-category distribution (as % of their parent category)
    const needsSplit = { food: 0.35, rent: 0.40, bills: 0.10, transport: 0.15 };
    const wantsSplit = { ent: 0.40, dining: 0.40, subs: 0.20 };
    const savingsSplit = { emergency: 0.50, invest: 0.50 };

    const needsAmount = (total * effectiveNeeds) / 100;
    const wantsAmount = (total * effectiveWants) / 100;
    const savingsAmount = (total * effectiveSavings) / 100;

    return {
      total: { needs: needsAmount, wants: wantsAmount, savings: savingsAmount },
      details: [
        { label: "Food & Groceries", amount: needsAmount * needsSplit.food, cat: "Needs" },
        { label: "Rent & Maintenance", amount: needsAmount * needsSplit.rent, cat: "Needs" },
        { label: "EB Bills (Electricity)", amount: needsAmount * needsSplit.bills, cat: "Needs" },
        { label: "Transport", amount: needsAmount * needsSplit.transport, cat: "Needs" },
        { label: "Entertainment", amount: wantsAmount * wantsSplit.ent, cat: "Wants" },
        { label: "Dining Out", amount: wantsAmount * wantsSplit.dining, cat: "Wants" },
        { label: "Subscriptions", amount: wantsAmount * wantsSplit.subs, cat: "Wants" },
        { label: "Emergency Fund", amount: savingsAmount * savingsSplit.emergency, cat: "Savings" },
        { label: "Investments / Debt", amount: savingsAmount * savingsSplit.invest, cat: "Savings" },
      ],
      effectiveNeeds,
      effectiveWants,
      effectiveSavings
    };
  };

  const budget = calculateBudget();

  const getProTip = async () => {
    if (salary <= 0) return;
    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have a monthly salary of ₹${salary} Indian Rupees. My budget split is ${budget.effectiveNeeds}% needs, ${budget.effectiveWants}% wants, and ${budget.effectiveSavings}% savings. 
        Detailed sub-categories: Food: ₹${budget.details[0].amount}, Bills: ₹${budget.details[2].amount}, Entertainment: ₹${budget.details[4].amount}.
        Provide one short, punchy pro-tip for saving money in the Indian economic context. Keep it under 20 words.`,
      });
      setProTip(response.text || "Save consistently even in small amounts.");
    } catch (e) {
      setProTip("Track every expense to find hidden leaks in your budget.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (salary > 0) getProTip();
    }, 1000);
    return () => clearTimeout(timer);
  }, [salary, percentages]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input & Sliders */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-[2rem] p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                <IndianRupee className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold">Monthly Income</h2>
            </div>
            
            <div className="relative">
              <input
                type="number"
                value={salary || ""}
                onChange={(e) => setSalary(Number(e.target.value))}
                placeholder="Ex: 50000"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-white/10"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold tracking-widest pt-1">INR</div>
            </div>

            <div className="space-y-6 pt-4">
              {(["needs", "wants", "savings"] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    <span>{key}</span>
                    <span className="text-brand-primary">{percentages[key]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={percentages[key]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const otherKeys = (["needs", "wants", "savings"] as const).filter(k => k !== key);
                      const remaining = 100 - val;
                      const ratio = percentages[otherKeys[0]] / (percentages[otherKeys[0]] + percentages[otherKeys[1]] || 1);
                      setPercentages({
                        ...percentages,
                        [key]: val,
                        [otherKeys[0]]: Math.round(remaining * ratio),
                        [otherKeys[1]]: 100 - val - Math.round(remaining * ratio)
                      });
                    }}
                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          <div className="glass-card rounded-[2rem] p-6 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-white/40">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Aura Insight
            </h2>
            <div className="min-h-[60px] flex items-center">
              {isLoading ? (
                <div className="flex gap-1.5">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                </div>
              ) : salary > 0 ? (
                <p className="text-sm text-white/80 italic leading-relaxed">"{proTip}"</p>
              ) : (
                <p className="text-[10px] text-white/20 uppercase tracking-widest">Enter income for tips</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Detailed Table */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-brand-secondary" />
                Spending Blueprint
              </h2>
              <div className="px-4 py-1.5 glass rounded-full text-[10px] font-bold uppercase tracking-widest text-white/40 border-white/10">
                Monthly Breakdown
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.01]">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white/20 border-b border-white/5">Category</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white/20 border-b border-white/5">Type</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white/20 border-b border-white/5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {budget.details.map((item, idx) => (
                    <motion.tr 
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-5 text-sm font-medium text-white/80 group-hover:text-white transition-colors">{item.label}</td>
                      <td className="px-8 py-5">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter ${
                          item.cat === "Needs" ? "bg-brand-primary/10 text-brand-primary" : 
                          item.cat === "Wants" ? "bg-brand-secondary/10 text-brand-secondary" : 
                          "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {item.cat}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-mono text-sm group-hover:text-brand-primary transition-colors">
                        {Math.round(item.amount).toLocaleString('en-IN')}
                      </td>
                    </motion.tr>
                  ))}
                  <tr className="bg-white/[0.03] font-bold">
                    <td colSpan={2} className="px-8 py-6 text-sm text-white/40 uppercase tracking-widest">Estimated Total Allocated</td>
                    <td className="px-8 py-6 text-right text-xl text-white">₹{(salary || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
