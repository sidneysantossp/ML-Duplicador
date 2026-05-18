import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Zap
} from 'lucide-react';
import { DuplicationJob } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export const DuplicationHistory: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<DuplicationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'failed'>('all');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'jobs'),
      orderBy('server_timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DuplicationJob[];
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.source_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.source_item_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return matchesSearch && (job.status === 'pending' || job.status === 'processing');
    if (filter === 'failed') return matchesSearch && job.status === 'failed';
    return matchesSearch;
  });

  const stats = {
    today: jobs.filter(j => {
      const today = new Date();
      const jobDate = new Date(j.created_at);
      return jobDate.toDateString() === today.toDateString() && j.status === 'completed';
    }).length,
    processing: jobs.filter(j => j.status === 'processing').length,
    efficiency: jobs.length > 0 ? (jobs.filter(j => j.status === 'completed').length / jobs.length * 100).toFixed(1) : '100'
  };

  const getStatusConfig = (status: DuplicationJob['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Concluído' };
      case 'processing':
        return { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Processando', pulse: true };
      case 'failed':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Falha' };
      default:
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Aguardando' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <History className="size-6 text-amber-500" />
            Histórico de Duplicação
          </h1>
          <p className="text-slate-500 text-sm font-medium">Monitore suas tarefas de duplicação massiva em tempo real.</p>
        </div>
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          <button 
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === 'all' ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === 'pending' ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            Em Fila
          </button>
          <button 
            onClick={() => setFilter('failed')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === 'failed' ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            Erros
          </button>
        </div>
      </div>
 
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="size-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DUPLICADOS HOJE</p>
            <p className="text-xl font-black text-slate-900">{stats.today}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Loader2 className={cn("size-5 text-blue-500", stats.processing > 0 && "animate-spin")} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EM PROCESSAMENTO</p>
            <p className="text-xl font-black text-slate-900">{stats.processing}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Zap className="size-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EFICIÊNCIA IA</p>
            <p className="text-xl font-black text-slate-900">{stats.efficiency}%</p>
          </div>
        </div>
      </div>
 
      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar histórico..."
              className="w-full bg-white border-slate-200 border rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-4 focus:ring-amber-400/10 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
 
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="size-8 text-amber-500 animate-spin" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando histórico...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <History className="size-12 text-slate-200" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum registro encontrado</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 text-left">
                  <th className="px-6 py-4">Tarefa / Origem</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Destino</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredJobs.map((job) => {
                  const config = getStatusConfig(job.status);
                  return (
                    <tr key={job.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 max-w-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.source_item_id}</span>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{job.source_title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400">Iniciado em: {new Date(job.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <config.icon className={cn("size-3.5", config.color, config.pulse && "animate-spin")} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", config.color)}>
                              {config.label}
                            </span>
                          </div>
                          {job.status === 'processing' && (
                            <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${job.progress}%` }}
                                className="h-full bg-blue-500 rounded-full"
                              />
                            </div>
                          )}
                          {job.status === 'failed' && job.error && (
                            <p className="text-[9px] font-bold text-red-400 max-w-[180px] italic">"{job.error}"</p>
                          )}
                          {job.status === 'completed' && job.new_item_id && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-emerald-500">Novo: {job.new_item_id}</span>
                              <ExternalLink className="size-2.5 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                           <div className="w-4 h-4 bg-amber-400 rounded-sm" />
                           <span className="text-[11px] font-bold text-slate-600">{job.target_account}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                            <MoreVertical className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Processado por: ML Duplicator Engine v4.0 (Nvidia H100 Optimized)</span>
           <button className="text-[10px] font-bold text-amber-500 hover:underline uppercase tracking-widest">Limpar Histórico</button>
        </div>
      </div>
    </div>
  );
};
