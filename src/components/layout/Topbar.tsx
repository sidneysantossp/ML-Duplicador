import React from 'react';
import { 
  Bell, 
  Search, 
  Plus, 
  Calendar,
  ChevronDown,
  Globe,
  Settings,
  HelpCircle
} from 'lucide-react';

interface TopbarProps {
  userRole: string;
}

export const Topbar: React.FC<TopbarProps> = ({ userRole }) => {
  return (
    <header className="h-16 bg-white flex items-center justify-between px-6 border-b border-slate-200 z-40 sticky top-0">
      {/* Left Area: Context / Search */}
      <div className="flex items-center gap-8 flex-1">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 leading-tight">ML Intelligence & Ops</h2>
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="size-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">23 Jan 2026</span>
          </div>
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por SKU, ID ou Nome..."
            className="w-full bg-slate-100 border-slate-200 border rounded-xl py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all outline-none"
            id="global-search"
          />
        </div>
      </div>

      {/* Right Area: Actions / Notifications */}
      <div className="flex items-center gap-4">
        {/* Environment Badge */}
        <div className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 tracking-widest uppercase flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Produção
        </div>

        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative group">
          <Bell className="size-5 text-slate-600 group-hover:text-slate-900" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2" />

        <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95">
          <Plus className="size-4" />
          NOVA DUPLICAÇÃO
        </button>
      </div>
    </header>
  );
};
