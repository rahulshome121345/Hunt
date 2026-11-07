import DashboardLayout from "@/components/DashboardLayout";
import { Zap, Database } from "lucide-react";

export const dynamic = "force-static";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto pt-12 pb-24">
        
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-playfair text-white mb-4 tracking-wide">Settings</h1>
          <p className="text-white/60 text-lg">
            Configure your AI engine and tweak extraction parameters.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          
          {/* Engine Settings */}
          <section className="glass-premium p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <Zap className="text-amber-500" size={20} />
              <h2 className="text-xl font-bold text-white tracking-wider">ENGINE CONFIGURATION</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium mb-1">Auto-Scrape Frequency</div>
                  <div className="text-white/50 text-xs">How often the engine runs in the background.</div>
                </div>
                <select className="bg-black/50 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500">
                  <option>Manual Only</option>
                  <option>Every 6 Hours</option>
                  <option>Every 12 Hours</option>
                  <option>Daily</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium mb-1">Strict Validation Mode</div>
                  <div className="text-white/50 text-xs">Only extract ideas with high buying intent signals.</div>
                </div>
                <div className="w-12 h-6 rounded-full bg-amber-500 flex items-center px-1 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white transform translate-x-6 transition-transform" />
                </div>
              </div>
            </div>
          </section>



          {/* Data Management */}
          <section className="glass-premium p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <Database className="text-amber-500" size={20} />
              <h2 className="text-xl font-bold text-white tracking-wider">DATA MANAGEMENT</h2>
            </div>
            
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <div>
                <div className="text-white font-bold mb-1 text-sm">Purge All Raw Data</div>
                <div className="text-white/50 text-xs">Deletes all unprocessed posts. Does not affect saved Incubator ideas.</div>
              </div>
              <button className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                Purge Data
              </button>
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}
