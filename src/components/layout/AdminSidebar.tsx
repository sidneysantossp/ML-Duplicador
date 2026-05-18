import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  ShieldAlert,
  Server,
  Zap,
  LayoutDashboard,
  Shield,
  Activity,
  CreditCard,
  Users,
  Database,
  LineChart,
  HardDrive,
  Terminal,
  Settings
} from 'lucide-react';
import { NavItem, UserRole } from '../../constants';

interface AdminSidebarProps {
  items: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  userEmail: string;
  userName?: string;
  onLogout?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  items, 
  activeId, 
  onNavigate, 
  userEmail,
  userName,
  onLogout
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-slate-950 text-slate-400 flex flex-col border-r border-slate-800/60 relative z-50 overflow-hidden"
    >
      {/* Admin Branding */}
      <div className="p-6 mb-4 flex items-center gap-3 bg-slate-900/40 border-b border-slate-800/50">
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-700 shadow-2xl">
          <ShieldAlert className="text-amber-500 size-6" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <span className="font-black text-sm tracking-widest text-white uppercase">CONSOLE CENTRAL</span>
            <span className="text-[9px] text-amber-500 font-black tracking-[0.2em] uppercase">v2.4.0 ADMIN</span>
          </motion.div>
        )}
      </div>

      {/* System Health Quick Look */}
      {!isCollapsed && (
        <div className="px-6 mb-6">
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Infra Status</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                   <span className="text-[8px] font-bold text-slate-600 uppercase">Load</span>
                   <span className="text-xs font-black text-slate-300">14%</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] font-bold text-slate-600 uppercase">Uptime</span>
                   <span className="text-xs font-black text-slate-300">99.9%</span>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Nav Groups / Items */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar pt-2">
        <div>
          {!isCollapsed && (
            <p className="px-4 mb-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Gestão Operacional</p>
          )}
          <div className="space-y-1">
            {items.slice(0, 3).map((item) => (
              <SidebarItem 
                key={item.id} 
                item={item} 
                isActive={activeId === item.id} 
                isCollapsed={isCollapsed} 
                onClick={() => onNavigate(item.id)} 
              />
            ))}
          </div>
        </div>

        <div>
          {!isCollapsed && (
            <p className="px-4 mb-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Inteligência & SaaS</p>
          )}
          <div className="space-y-1">
            {items.slice(3, 7).map((item) => (
              <SidebarItem 
                key={item.id} 
                item={item} 
                isActive={activeId === item.id} 
                isCollapsed={isCollapsed} 
                onClick={() => onNavigate(item.id)} 
              />
            ))}
          </div>
        </div>

        <div>
          {!isCollapsed && (
            <p className="px-4 mb-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Infra & Logs</p>
          )}
          <div className="space-y-1">
            {items.slice(7).map((item) => (
              <SidebarItem 
                key={item.id} 
                item={item} 
                isActive={activeId === item.id} 
                isCollapsed={isCollapsed} 
                onClick={() => onNavigate(item.id)} 
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Admin Footer */}
      <div className="p-6 bg-slate-900/40 border-t border-slate-800/50">
        <div className="flex items-center gap-3 p-2 rounded-xl border border-transparent group">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
            <span className="text-xs font-black text-amber-500 uppercase">SYS</span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <p className="text-xs font-black truncate text-white uppercase tracking-tight">{userName || userEmail.split('@')[0]}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Root Admin</p>
              </div>
            </motion.div>
          )}
          {!isCollapsed && onLogout && (
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-slate-800 border border-slate-700 rounded-full p-1.5 text-slate-500 hover:text-white transition-all shadow-xl z-50 hover:scale-110"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
};

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, isCollapsed, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative",
        isActive 
          ? "bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/10" 
          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
      )}
    >
      <item.icon className={cn(
        "size-5 flex-shrink-0 transition-transform duration-300",
        isActive ? "text-slate-950" : "group-hover:text-amber-500 group-hover:scale-110"
      )} />
      {!isCollapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-bold whitespace-nowrap uppercase tracking-wider"
        >
          {item.label}
        </motion.span>
      )}
      {isActive && !isCollapsed && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute right-3 w-1.5 h-1.5 bg-slate-950 rounded-full"
        />
      )}
    </button>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
