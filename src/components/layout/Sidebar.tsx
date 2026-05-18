import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  User,
  ShieldCheck,
  LayoutDashboard,
  Zap,
  Package,
  History
} from 'lucide-react';
import { NavItem, UserRole } from '../../constants';

interface SidebarProps {
  items: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  userRole: UserRole;
  userEmail: string;
  userName?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  activeId, 
  onNavigate, 
  userRole,
  userEmail,
  userName,
  onLogout
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="h-screen bg-slate-900 text-slate-400 flex flex-col border-r border-slate-800 relative z-50 pt-4"
    >
      {/* Branding */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-400/10">
          <Zap className="text-slate-900 fill-slate-900 size-6" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col"
          >
            <span className="font-bold text-lg tracking-tight leading-none text-white">ML DUPLICATOR</span>
            <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">PRO v2.4.0</span>
          </motion.div>
        )}
      </div>

      {/* Instance Selector */}
      {!isCollapsed && (
        <div className="px-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">CONTA ATIVA</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              <span className="text-sm font-medium truncate text-slate-200">QBLOXXKIDS</span>
              <ChevronRight className="size-3 text-slate-600 ml-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
              ${activeId === item.id ? 'bg-amber-400 text-slate-900 font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
            `}
            id={`nav-item-${item.id}`}
          >
            <item.icon className={`size-5 flex-shrink-0 ${activeId === item.id ? 'text-slate-900' : 'group-hover:text-amber-400 transition-colors'}`} />
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
            {!isCollapsed && item.badge && (
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md ${activeId === item.id ? 'bg-slate-900/10' : 'bg-amber-400/20 text-amber-400'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors group">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-amber-400/30 transition-all overflow-hidden">
            <User className="size-5 text-slate-500 group-hover:text-amber-400" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold truncate text-slate-100">{userName || userEmail.split('@')[0]}</p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-2.5 text-amber-400" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{userRole.replace('_', ' ')}</p>
              </div>
            </motion.div>
          )}
          {!isCollapsed && onLogout && (
            <button 
              onClick={onLogout}
              className="p-1 hover:bg-red-500/10 rounded-lg group/logout transition-colors"
              title="Sair"
            >
              <LogOut className="size-4 text-slate-600 group-hover/logout:text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-[#141518] border border-white/10 rounded-full p-1 text-gray-400 hover:text-white transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
};
