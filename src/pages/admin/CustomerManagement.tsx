import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  ExternalLink, 
  Shield, 
  Ban,
  UserCheck,
  CreditCard,
  Zap,
  Store,
  ChevronRight,
  TrendingUp,
  Download
} from 'lucide-react';
import { Customer } from '../../types';
import { cn, formatCurrency, formatNumber } from '../../lib/utils';
import { motion } from 'motion/react';

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'Sidney Oliveira',
    email: 'sid.websp@gmail.com',
    plan: 'pro',
    status: 'active',
    mrr: 197.00,
    total_spent: 2364.00,
    stores_count: 5,
    duplications_count: 1240,
    joined_at: '2025-01-15T10:00:00Z',
    last_active: '2026-04-23T18:10:00Z'
  },
  {
    id: 'cust_2',
    name: 'Lucas Ferreira',
    email: 'lucas@importbr.com',
    plan: 'enterprise',
    status: 'active',
    mrr: 497.00,
    total_spent: 1491.00,
    stores_count: 12,
    duplications_count: 8450,
    joined_at: '2026-01-10T14:30:00Z',
    last_active: '2026-04-23T15:20:00Z'
  },
  {
    id: 'cust_3',
    name: 'Amanda Souza',
    email: 'contato@amanda.store',
    plan: 'starter',
    status: 'past_due',
    mrr: 97.00,
    total_spent: 485.00,
    stores_count: 2,
    duplications_count: 320,
    joined_at: '2025-11-20T09:15:00Z',
    last_active: '2026-04-21T11:45:00Z'
  }
];

export const CustomerManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getPlanBadge = (plan: Customer['plan']) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'pro': return 'bg-amber-100 text-amber-600 border-amber-200';
      default: return 'bg-blue-100 text-blue-600 border-blue-200';
    }
  };

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-600';
      case 'past_due': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-8 bg-slate-950 min-h-full -m-8 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">Controle de assinaturas, limites e acessos da plataforma.</p>
        </div>
        <button className="bg-amber-400 text-slate-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/10">
          <Download className="size-4" /> Exportar Relatório
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'TOTAL DE CLIENTES', value: '1.248', icon: Users, color: 'text-blue-400' },
          { label: 'ATIVOS AGORA', value: '842', icon: Zap, color: 'text-amber-400' },
          { label: 'CONVERSÃO TRIAL', value: '18.4%', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'CHURN (30D)', value: '2.1%', icon: Ban, color: 'text-red-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
              <div className="p-2 bg-slate-800 rounded-xl">
                <stat.icon className={cn("size-5", stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-900/50">
          <div className="relative flex-1 w-full md:max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por nome, email ou ID..."
              className="w-full bg-slate-950 border-slate-800 border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-4 focus:ring-amber-400/5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
               <Filter className="size-4" />
             </button>
             <div className="h-6 w-px bg-slate-800" />
             <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
               <button className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-800 text-white">Todos</button>
               <button className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300">Empresas</button>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 bg-slate-900/30 text-left">
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5 text-center">Plano / Status</th>
                <th className="px-6 py-5 text-center">Métricas de Uso</th>
                <th className="px-6 py-5 text-right">Financeiro (LTV)</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {MOCK_CUSTOMERS.map((customer) => (
                <tr key={customer.id} className="group hover:bg-slate-800/30 transition-all border-b border-slate-800/50">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 group-hover:border-amber-400/50 transition-all font-black text-slate-300 text-lg">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{customer.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail className="size-3 text-slate-600" />
                          <p className="text-xs text-slate-500 font-medium">{customer.email}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col items-center gap-2">
                       <span className={cn("text-[9px] font-black uppercase px-2 py-1 rounded shadow-sm border", getPlanBadge(customer.plan))}>
                         {customer.plan}
                       </span>
                       <div className="flex items-center gap-1.5">
                         <div className={cn("w-1.5 h-1.5 rounded-full", customer.status === 'active' ? 'bg-emerald-500' : 'bg-red-500')} />
                         <span className={cn("text-[10px] font-bold uppercase", customer.status === 'active' ? 'text-emerald-500' : 'text-red-500')}>
                           {customer.status === 'active' ? 'Regular' : 'Inadimplente'}
                         </span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col items-center gap-2 text-center">
                       <div className="flex gap-4">
                         <div className="flex flex-col items-center">
                           <p className="text-[10px] font-black text-slate-500 uppercase">Lojas</p>
                           <p className="text-xs font-bold text-white">{customer.stores_count}</p>
                         </div>
                         <div className="flex flex-col items-center">
                           <p className="text-[10px] font-black text-slate-500 uppercase">Copias</p>
                           <p className="text-xs font-bold text-white">{formatNumber(customer.duplications_count)}</p>
                         </div>
                       </div>
                       <p className="text-[9px] text-slate-600 font-medium">Último acesso: {new Date(customer.last_active).toLocaleString('pt-BR', { dateStyle: 'short' })}</p>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-black text-white">{formatCurrency(customer.total_spent)}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">MRR: {formatCurrency(customer.mrr)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-sm" title="Painel de Controle">
                        <Shield className="size-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-sm" title="Conversar">
                        <Mail className="size-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-xl text-red-400 hover:bg-red-500/10 transition-all shadow-sm" title="Suspender">
                        <Ban className="size-4" />
                      </button>
                      <div className="h-6 w-px bg-slate-800 mx-1" />
                      <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
                        <MoreVertical className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
             <span className="flex items-center gap-1.5"><ChevronRight className="size-3" /> Pág 1 de 64</span>
             <span className="w-1 h-1 bg-slate-800 rounded-full" />
             <span>Total: 1.248 Usuários</span>
           </div>
           <div className="flex gap-2">
             <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-slate-700 transition-all disabled:opacity-30" disabled>Anterior</button>
             <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:border-amber-400 transition-all">Próximo</button>
           </div>
        </div>
      </div>

      {/* Floating Audit Mode indicator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-amber-400 text-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/10 ring-4 ring-amber-400/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">MODO AUDITORIA ATIVO</p>
          </div>
          <div className="h-4 w-px bg-slate-900/20" />
          <p className="text-[10px] font-medium italic opacity-80">Rastreado por: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};
