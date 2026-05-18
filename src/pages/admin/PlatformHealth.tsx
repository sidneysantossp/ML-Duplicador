import React from 'react';
import { ShieldCheck, Server, Globe, Database, Activity, AlertTriangle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const PlatformHealth: React.FC = () => {
  const systems = [
    { name: 'Mercado Livre API (BR)', status: 'operational', lat: '45ms', uptime: '99.98%' },
    { name: 'Gemini 1.5/3.1 (Google AI)', status: 'operational', lat: '120ms', uptime: '99.95%' },
    { name: 'Duplication Worker Cluster', status: 'operational', lat: '12ms', uptime: '100%' },
    { name: 'Authentication Service', status: 'operational', lat: '18ms', uptime: '99.99%' },
    { name: 'Database (Firestore)', status: 'operational', lat: '8ms', uptime: '100%' },
    { name: 'Image Processing (IA)', status: 'degraded', lat: '450ms', uptime: '98.4%', issue: 'Latency High in US-East-1' },
  ];

  return (
    <div className="space-y-8 bg-slate-950 min-h-full -m-8 p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saúde da Plataforma</h1>
          <p className="text-slate-500 text-sm mt-1">Status em tempo real da infraestrutura e integrações externas.</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Todos Sistemas OK</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Systems List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Status dos Serviços</h3>
            <span className="text-[9px] font-bold text-slate-500">Última checagem: Just now</span>
          </div>
          <div className="divide-y divide-slate-800">
            {systems.map((s, i) => (
              <div key={i} className="p-5 flex items-center justify-between group hover:bg-slate-800/30 transition-all">
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center border",
                     s.status === 'operational' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-amber-500/5 border-amber-500/20 text-amber-500"
                   )}>
                     <Server className="size-5" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white">{s.name}</p>
                     {s.issue && <p className="text-[10px] text-amber-500 font-medium">{s.issue}</p>}
                   </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-600 uppercase">Uptime</p>
                      <p className="text-xs font-bold text-slate-300">{s.uptime}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-600 uppercase">Latência</p>
                      <p className="text-xs font-bold text-slate-300">{s.lat}</p>
                   </div>
                   <div className={cn(
                     "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                     s.status === 'operational' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                   )}>
                     {s.status}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Metrics & Incidents */}
        <div className="space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-4 -right-4 opacity-5">
                 <Activity className="size-40 text-blue-500" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Métricas de Tráfego</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <p className="text-3xl font-black text-white">42.8k</p>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Requisições/Hora</p>
                 </div>
                 <div>
                    <p className="text-3xl font-black text-amber-500">1.2s</p>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Tempo de Resposta Médio</p>
                 </div>
              </div>
              <div className="mt-8 h-24 flex items-end gap-1 px-2">
                 {[40, 60, 45, 80, 55, 90, 70, 85, 30, 50, 40, 60, 45, 80, 55, 90, 70, 85, 30, 50].map((h, i) => (
                   <motion.div 
                     key={i}
                     initial={{ height: 0 }}
                     animate={{ height: `${h}%` }}
                     transition={{ delay: i * 0.05 }}
                     className="flex-1 bg-blue-500/40 hover:bg-blue-500 transition-colors rounded-t-sm" 
                   />
                 ))}
              </div>
           </div>

           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Incidentes Recentes</h3>
              <div className="space-y-4">
                 {[
                   { type: 'Info', msg: 'Ajuste de cache realizado no servidor de imagens.', time: '2h atrás' },
                   { type: 'Warning', msg: 'Instabilidade temporária na API do ML (Region South-1).', time: '5h atrás' },
                   { type: 'Critical', msg: 'Tentativa de Brute Force bloqueada - IP: 187.xx.xxx.xx', time: '1d atrás' }
                 ].map((inc, i) => (
                   <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 border-l-4 border-l-slate-700">
                      <div className={cn(
                        "p-2 rounded-lg",
                        inc.type === 'Critical' ? 'bg-red-500/10 text-red-500' : inc.type === 'Warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-400/10 text-blue-400'
                      )}>
                         <AlertTriangle className="size-3.5" />
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{inc.type}</p>
                            <span className="text-[8px] font-bold text-slate-600">{inc.time}</span>
                         </div>
                         <p className="text-xs text-slate-300 font-medium">{inc.msg}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
