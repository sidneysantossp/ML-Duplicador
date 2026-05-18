import React from 'react';
import { Zap, Activity, HardDrive, BarChart3, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { motion } from 'motion/react';

export const AIResourceManagement: React.FC = () => {
  return (
    <div className="space-y-8 bg-slate-950 min-h-full -m-8 p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos & Cotas IA</h1>
          <p className="text-slate-500 text-sm mt-1">Monitoramento de custos de processamento Gemini vs Faturamento SaaS.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custo Acumulado (Mês)</p>
              <p className="text-xl font-black text-red-400">R$ 1.402,30</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'REQUISIÇÕES IA', value: '45.2k', icon: Zap, color: 'text-amber-400' },
          { label: 'MARGEM DE IA', value: '72%', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'TOKEN AVG', value: '840t', icon: Activity, color: 'text-blue-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
              <stat.icon className={stat.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Consumo por Modelo (Custo Operacional)</h3>
        <div className="space-y-6">
          {[
            { model: 'Gemini 3.1 Pro (Heavy Tasks)', usage: 85, cost: 'R$ 840,00' },
            { model: 'Gemini 3.0 Flash (Fast Tasks)', usage: 45, cost: 'R$ 310,00' },
            { model: 'Imagen 4.0 (Image Processing)', usage: 30, cost: 'R$ 252,30' },
          ].map((m, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">{m.model}</span>
                <span className="text-amber-400">{m.cost}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${m.usage}%` }}
                   className="h-full bg-amber-400"
                 />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl flex items-center justify-between">
         <div className="flex items-center gap-4">
            <AlertCircle className="text-red-500 size-6" />
            <div>
               <p className="text-xs font-black text-red-500 uppercase tracking-widest">Alerta de Margem Baixa</p>
               <p className="text-xs text-slate-400 font-medium">O plano "Starter" está com consumo de IA acima da quota projetada. Recomenda-se ajustar o limitador.</p>
            </div>
         </div>
         <button className="bg-red-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Revisar Limites</button>
      </div>
    </div>
  );
};
