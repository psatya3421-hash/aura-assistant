import { useState } from "react";
import { motion } from "motion/react";
import { Search, Info, Recycle, Trash, Leaf, AlertTriangle, CheckCircle2 } from "lucide-react";

const WASTE_DATABASE = [
  { item: "Plastic Water Bottle", category: "Recyclable", details: "Empty and crush. Keep cap on.", icon: Recycle, color: "text-blue-400" },
  { item: "Cardboard Box", category: "Recyclable", details: "Flatten completely. Remove heavy tape.", icon: Recycle, color: "text-blue-400" },
  { item: "Apple Core", category: "Compostable", details: "All fruit and veggie scraps are compostable.", icon: Leaf, color: "text-emerald-400" },
  { item: "Egg Shells", category: "Compostable", details: "Crush them to help them break down faster.", icon: Leaf, color: "text-emerald-400" },
  { item: "Coffee Grounds", category: "Compostable", details: "Can be composted with paper filters.", icon: Leaf, color: "text-emerald-400" },
  { item: "Alkaline Battery", category: "Hazardous", details: "Tape ends. Take to specialized collection site.", icon: AlertTriangle, color: "text-orange-400" },
  { item: "Broken Mirror", category: "Landfill", details: "Wrap in newspaper/tape for safety. Disposal only.", icon: Trash, color: "text-white/40" },
  { item: "Styrofoam", category: "Landfill", details: "Check local rules; most styrofoam isn't recyclable.", icon: Trash, color: "text-white/40" },
  { item: "Aluminum Soda Can", category: "Recyclable", details: "Rinse and drain. Do not flatten.", icon: Recycle, color: "text-blue-400" },
  { item: "Glass Jar", category: "Recyclable", details: "Rinse. Labels can stay. Remove lids.", icon: Recycle, color: "text-blue-400" },
  { item: "Paint Can", category: "Hazardous", details: "Do not put liquid paint in trash. Dry it out or use HAZMAT day.", icon: AlertTriangle, color: "text-orange-400" },
  { item: "Pizza Box (Greasy)", category: "Compostable", details: "If greasy, compost it. If clean, recycle it.", icon: Leaf, color: "text-emerald-400" },
];

export default function WasteGuide() {
  const [search, setSearch] = useState("");

  const filteredItems = WASTE_DATABASE.filter(item => 
    item.item.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-[2rem] p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Recycle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Waste Separation Guide</h2>
              <p className="text-sm text-white/40">Keep our planet clean, one item at a time.</p>
            </div>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search item (e.g. Battery, Plastic)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.item}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-white/5 ${item.color}`}>
                  {item.category}
                </span>
              </div>
              <h3 className="font-semibold text-white/90 mb-1">{item.item}</h3>
              <p className="text-xs text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
                {item.details}
              </p>
            </motion.div>
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center text-white/20">
              <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items found for "{search}". Try another keyword.</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 flex items-center gap-6 bg-emerald-500/5 border-emerald-500/10">
        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-emerald-500/20 items-center justify-center text-emerald-500 shrink-0">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-emerald-400">Pro Sustainability Tip</h4>
          <p className="text-sm text-white/60">
            Reducing waste starts with shopping. Choose products with minimal packaging and switch to reusable alternatives for daily items.
          </p>
        </div>
      </div>
    </div>
  );
}
