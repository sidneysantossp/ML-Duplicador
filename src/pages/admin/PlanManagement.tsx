import React from 'react';
import { CreditCard, Plus, Check, Edit2, Trash2, Zap } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

const MOCK_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    limit: '200 cópias/mês',
    features: ['1 Conta ML', 'IA Otimização Básica', 'Suporte E-mail'],
    active_users: 842,
    conversion: '12%'
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 197,
    limit: '2.000 cópias/mês',
    features: ['5 Contas ML', 'Gemini 3.1 Pro Turbo', 'Remoção de Logos IA', 'Suporte Prioritário'],
    active_users: 356,
    conversion: '45%'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 497,
    limit: 'Ilimitado',
    features: ['Contas Ilimitadas', 'API Access', 'Account Manager', 'Custom ML Logic'],
    active_users: 50,
    conversion: '100% (Manual)'
  }
];

export const PlanManagement: React.FC = () => {
  return (
    <div className="space-y-8 bg-slate-950 min-h-full -m-8 p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Planos</h1>
          <p className="text-slate-500 text-sm mt-1">Configure as ofertas, preços e limites do seu SaaS.</p>
        </div>
        <button className="bg-amber-400 text-slate-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 transition-all border-b-4 border-amber-600 active:translate-y-1 active:border-b-0">
          <Plus className="size-4" /> Criar Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {MOCK_PLANS.map((plan) => (
          <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Zap className="size-24 text-amber-400 fill-amber-400" />
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-black uppercase tracking-widest text-white mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-400">{formatCurrency(plan.price)}</span>
                <span className="text-slate-500 text-xs font-bold">/mês</span>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
               <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-slate-800/50 p-2 rounded-lg">
                  <span className="text-amber-500">Limite:</span> {plan.limit}
               </div>
               <div className="space-y-2">
                 {plan.features.map((f, i) => (
                   <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                     <Check className="size-3 text-emerald-500" /> {f}
                   </div>
                 ))}
               </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between mb-6">
               <div className="text-center">
                 <p className="text-[10px] font-black text-slate-600 uppercase">Usuários</p>
                 <p className="text-sm font-bold text-white">{plan.active_users}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] font-black text-slate-600 uppercase">Conversão</p>
                 <p className="text-sm font-bold text-emerald-400">{plan.conversion}</p>
               </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                <Edit2 className="size-3" /> Editar
              </button>
              <button className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
