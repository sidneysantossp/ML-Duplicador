import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MLService } from '../../services/mlService';
import { optimizeProductContent } from '../../services/geminiService';
import axios from 'axios';

interface AutomationTask {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  count: number;
  progress: number;
  currentStep: string;
  logs: Array<{ time: string; msg: string; type: 'info' | 'success' | 'error' | 'ai' }>;
  config: {
    priceVar: number;
    optimize: boolean;
    frequency: string;
  };
}

export const AutomationPanel: React.FC = () => {
  const { customerData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [task, setTask] = useState<AutomationTask>({
    id: 'daily-duplication',
    status: 'idle',
    count: 20,
    progress: 0,
    currentStep: 'Pronto para iniciar',
    logs: [],
    config: {
      priceVar: 0.01,
      optimize: true,
      frequency: 'daily'
    }
  });

  const [isScheduled, setIsScheduled] = useState(false);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'ai' = 'info') => {
    setTask(prev => ({
      ...prev,
      logs: [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev.logs].slice(0, 50)
    }));
  };

  const updateConfig = (key: keyof typeof task.config, value: any) => {
    setTask(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };

  const updateCount = (val: number) => {
    setTask(prev => ({
      ...prev,
      count: val
    }));
  };

  const handleRunNow = async () => {
    if (!customerData?.ml_credentials) {
      alert("Conecte sua conta do Mercado Livre primeiro.");
      return;
    }

    setSyncing(true);
    setTask(prev => ({ 
      ...prev, 
      status: 'running', 
      progress: 0, 
      currentStep: 'Iniciando automação...',
      logs: [] 
    }));

    addLog("Iniciando processo de duplicação em massa...", "info");

    try {
      // 1. Fetch top products to duplicate
      const { access_token, user_id } = customerData.ml_credentials;
      
      setTask(prev => ({ ...prev, currentStep: 'Buscando anúncios no ML...' }));
      addLog("Buscando seus anúncios mais populares no Mercado Livre...", "info");
      
      const response = await MLService.getProducts(access_token, Number(user_id), 'active', undefined, 0, Math.min(task.count, 50));
      const items = response.results.map((id: string) => ({ id }));

      if (items.length === 0) {
        throw new Error("Nenhum anúncio ativo encontrado para duplicar.");
      }

      addLog(`Encontrados ${items.length} anúncios ativos para processar.`, "success");

      // 2. Process each item
      for (let i = 0; i < items.length; i++) {
        const itemId = items[i].id;
        const progress = Math.round(((i + 1) / items.length) * 100);
        
        setTask(prev => ({ 
          ...prev, 
          progress, 
          currentStep: `Processando item ${i + 1} de ${items.length}` 
        }));

        addLog(`[${i+1}/${items.length}] Analisando item ${itemId}...`, "info");
        
        // 2.1 Get details
        let itemDetails;
        try {
          itemDetails = await MLService.getItemDetails(itemId, access_token);
        } catch (err) {
          addLog(`Erro ao obter detalhes do item ${itemId}. Pulando...`, "error");
          continue;
        }
        
        let mods: any = {
          price: itemDetails.price + task.config.priceVar
        };

        // 2.2 AI SEO Optimization
        if (task.config.optimize) {
          try {
            addLog(`Solicitando inteligência artificial para otimização SEO...`, "ai");
            const aiResult = await optimizeProductContent(
              itemDetails.title,
              itemDetails.description?.plain_text || "",
              itemDetails.category_id
            );
            mods.title = aiResult.titles[0];
            mods.description = aiResult.description;
            addLog(`IA gerou novo título e descrição única com sucesso.`, "success");
          } catch (aiErr) {
            addLog(`Aviso: IA falhou para o item ${itemId}. Usando dados originais.`, "error");
            console.error("AI Error for item", itemId, aiErr);
          }
        }

        // 2.3 Duplicate
        try {
          addLog(`Enviando novo anúncio para duplicação no Mercado Livre...`, "info");
          await axios.post('/api/ml/duplicate', {
            itemId,
            accessToken: access_token,
            mods
          });
          addLog(`Sucesso! Item ${itemId} duplicado e otimizado.`, "success");
        } catch (dupErr: any) {
          const errorData = dupErr.response?.data;
          let errMsg = errorData?.message || errorData?.error || dupErr.message;
          
          if (errorData?.cause && Array.isArray(errorData.cause) && errorData.cause.length > 0) {
            const causes = errorData.cause.map((c: any) => c.message).join(", ");
            errMsg = `${errMsg} (${causes})`;
          }
          
          addLog(`Falha ao duplicar item ${itemId}: ${errMsg}`, "error");
          console.error(`Duplication error for ${itemId}:`, errorData);
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
      }

      setTask(prev => ({ 
        ...prev, 
        status: 'completed', 
        progress: 100,
        currentStep: 'Finalizado com sucesso',
        lastRun: new Date().toLocaleString() 
      }));
      addLog("Automação finalizada! Verifique seu painel do Mercado Livre.", "success");
    } catch (error: any) {
      console.error("Automation error:", error);
      setTask(prev => ({ ...prev, status: 'failed', currentStep: 'Erro na execução' }));
      addLog(`Erro crítico na automação: ${error.message}`, "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Zap className="size-8 text-amber-500 fill-amber-500" />
            Central de Automação IA
          </h1>
          <p className="text-slate-500 mt-1">Gerencie suas rotinas de duplicação e otimização SEO em massa.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-emerald-100">
            <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
            Sistema Ativo
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Task Card */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap className="size-48" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="size-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <Sparkles className="size-7 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Duplicação Diária Inteligente</h2>
                    <span className="text-sm text-slate-400">Escala orgânica com AI SEO</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleRunNow}
                    disabled={syncing}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {syncing ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4 fill-white" />
                    )}
                    {syncing ? 'Processando...' : 'Rodar Agora'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-t border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Diária</span>
                  <p className="text-2xl font-bold text-slate-900">{task.count} Itens</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variação Preço</span>
                  <p className="text-2xl font-bold text-emerald-600">+R$ {task.config.priceVar.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA SEO</span>
                  <p className="text-2xl font-bold text-amber-500">Ativado</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso</span>
                  <p className="text-2xl font-bold text-slate-900">{task.progress}%</p>
                </div>
              </div>

              {syncing && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">{task.currentStep}</span>
                    <span className="text-slate-500">{task.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="size-4" />
                    Histórico de Execução (Logs)
                  </h3>
                  <div className="text-[10px] font-black p-1 bg-slate-100 rounded px-2 uppercase text-slate-500">Tempo Real</div>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-4 h-64 overflow-y-auto border border-slate-100 font-mono text-xs space-y-2">
                  {task.logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 italic">
                      Nenhuma atividade registrada ainda...
                    </div>
                  ) : (
                    task.logs.map((log, i) => (
                      <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                        <span className="text-slate-400 flex-shrink-0">[{log.time}]</span>
                        <span className={`
                          ${log.type === 'error' ? 'text-red-500' : ''}
                          ${log.type === 'success' ? 'text-emerald-600' : ''}
                          ${log.type === 'ai' ? 'text-amber-600' : ''}
                          ${log.type === 'info' ? 'text-slate-600' : ''}
                        `}>
                          {log.msg}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="size-4" />
                  Última execução: <span className="font-semibold text-slate-700">{task.lastRun || 'Nunca'}</span>
                </div>
                <button className="text-amber-600 font-bold hover:underline flex items-center gap-1">
                  Ver Relatório Completo <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center gap-3 mb-4 text-emerald-700">
                <TrendingUp className="size-5" />
                <h3 className="font-bold">Efeito Estimado</h3>
              </div>
              <p className="text-sm text-emerald-600 leading-relaxed">
                Esta automação gerará aproximadamente <strong>600 novos anúncios por mês</strong>, todos com títulos e descrições únicas via IA.
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4 text-slate-700">
                <Settings className="size-5" />
                <h3 className="font-bold">Configurações Rápidas</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Processar produtos mais vendidos</span>
                  <div className="size-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Limpar descrições de links</span>
                  <div className="size-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 blur-[80px] -mr-16 -mt-16 opacity-20" />
            
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Settings className="size-5 text-amber-400" />
              Parâmetros Diários
            </h3>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Produtos p/ Dia</label>
                <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <span className="text-xl font-bold">{task.count}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateCount(Math.max(1, task.count - 1))}
                      className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    >
                      <Pause size={12} className="rotate-90" />
                    </button>
                    <button 
                      onClick={() => updateCount(Math.min(50, task.count + 1))}
                      className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    >
                      <Play size={12} className="-rotate-90" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Variação de Preço (Centavos)</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => updateConfig('priceVar', task.config.priceVar - 0.01)}
                    className="flex-1 bg-slate-800 p-3 rounded-xl border border-slate-700 font-bold hover:border-amber-400 transition-colors"
                  >
                    -0.01
                  </button>
                  <button 
                    onClick={() => updateConfig('priceVar', task.config.priceVar + 0.01)}
                    className="flex-1 bg-amber-400 text-slate-900 p-3 rounded-xl border border-amber-500 font-bold hover:opacity-90 transition-colors"
                  >
                    +0.01
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">SEO AI Optimization</p>
                    <p className="text-[10px] text-slate-500">Títulos e descrições únicas</p>
                  </div>
                  <button 
                    onClick={() => updateConfig('optimize', !task.config.optimize)}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${task.config.optimize ? 'bg-amber-400' : 'bg-slate-700'}`}
                  >
                    <motion.div 
                      layout
                      className={`size-4 bg-white rounded-full ${task.config.optimize ? 'ml-auto' : ''}`} 
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Agendamento Automático</p>
                    <p className="text-[10px] text-slate-500">Rodar todos os dias às 03:00</p>
                  </div>
                  <button 
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${isScheduled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <motion.div 
                      layout
                      className={`size-4 bg-white rounded-full ${isScheduled ? 'ml-auto' : ''}`} 
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold mb-4">Destaques da Rodada</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-1 animate-pulse" />
                    <div className="h-3 bg-slate-50 rounded w-1/2 animate-pulse" />
                  </div>
                  <CheckCircle className="size-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
