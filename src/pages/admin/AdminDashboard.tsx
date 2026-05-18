import React from 'react';
import { 
  Users, 
  BarChart3, 
  Clock, 
  AlertCircle,
  Database,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Zap,
  Layout
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';

const growthData = [
  { day: '01', mrr: 12400 },
  { day: '05', mrr: 15600 },
  { day: '10', mrr: 14200 },
  { day: '15', mrr: 19800 },
  { day: '20', mrr: 21500 },
  { day: '25', mrr: 24200 },
  { day: '30', mrr: 28400 },
];

const AdminStat = ({ label, value, trend, icon: Icon, color }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group hover:border-slate-700 transition-all shadow-lg">
    <div className="flex items-start justify-between">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</span>
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
      </div>
      <div className={cn("p-2.5 rounded-xl bg-opacity-10", color)}>
        <Icon className={cn("size-5", color.replace('bg-', 'text-'))} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold", 
        trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      )}>
        {trend}
      </div>
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">vs mês passado</span>
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8 bg-slate-950 min-h-full -m-8 p-8">
      {/* Admin Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Console de Gestão SaaS</h1>
          <p className="text-slate-400 text-sm mt-1">Visão completa da infraestrutura, faturamento e saúde da plataforma.</p>
        </div>
        <div className="bg-amber-400 px-4 py-2 rounded-xl text-slate-900 text-xs font-bold uppercase tracking-widest cursor-default shadow-lg shadow-amber-400/20">
          Modo Administrador
        </div>
      </div>

      {/* Admin KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStat 
          label="MRR (RECEITA RECORRENTE)" 
          value={formatCurrency(28400)} 
          trend="+12.4%" 
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <AdminStat 
          label="NOVOS CLIENTES (MÊS)" 
          value="42" 
          trend="+8.1%" 
          icon={Users}
          color="bg-blue-500"
        />
        <AdminStat 
          label="CHURN RATE" 
          value="2.4%" 
          trend="-0.5%" 
          icon={TrendingDown}
          color="bg-red-500"
        />
        <AdminStat 
          label="CUSTO DE IA (ONTEM)" 
          value={formatCurrency(142.50)} 
          trend="+5.2%" 
          icon={Zap}
          color="bg-amber-500"
        />
      </div>

      {/* System Health & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs">CRESCIMENTO DE RECEITA (MRR)</h3>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">ÚLTIMOS 30 DIAS</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}
                />
                <Line type="monotone" dataKey="mrr" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrastructure Monitor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-xl">
          <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-6 text-center lg:text-left">INFRAESTRUTURA & FILAS</h3>
          <div className="space-y-6 flex-1">
            {[
              { label: 'STATUS DOS WORKERS', status: 'Online', color: 'text-emerald-400', icon: Database },
              { label: 'JOBS EM FILA', value: '1.2k', status: 'Normal', color: 'text-emerald-400', icon: Layout },
              { label: 'TAXA DE ERRO API', value: '0.45%', status: 'Normal', color: 'text-blue-400', icon: AlertCircle },
              { label: 'TIMEOUTS ML', value: '12', status: 'Atenção', color: 'text-amber-400', icon: ShieldCheck },
            ].map((infra, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
                  <infra.icon className="size-4 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{infra.label}</p>
                  <div className="flex items-baseline gap-2">
                    {infra.value && <span className="text-sm font-bold text-white">{infra.value}</span>}
                    <span className={cn("text-[10px] font-bold uppercase", infra.color)}>{infra.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl bg-slate-800 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700 shadow-inner">
            LOGS DO SISTEMA EM TEMPO REAL
          </button>
        </div>
      </div>

      {/* Critical Incidents List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white uppercase tracking-wider text-xs">INCIDENTES DE SEGURANÇA & BILHETAGEM</h3>
          <ShieldCheck className="size-4 text-amber-500" />
        </div>
        <div className="space-y-3">
          {[
            { tag: 'BILLING', text: '5 clientes entraram em inadimplência na última hora', severity: 'low' },
            { tag: 'AUTH', text: 'Tentativa de brute force bloqueada no IP 182.20.10.4', severity: 'high' },
            { tag: 'API', text: 'Alteração nos esquemas de atributos do Mercado Livre detectada', severity: 'medium' }
          ].map((inc, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800 group hover:border-slate-700 transition-colors">
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded shadow-sm", 
                inc.severity === 'high' ? "bg-red-500/20 text-red-400" : 
                inc.severity === 'medium' ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
              )}>
                {inc.tag}
              </span>
              <span className="text-xs font-medium text-slate-300">{inc.text}</span>
              <span className="ml-auto text-[9px] font-bold text-slate-600 uppercase">AGORA</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
