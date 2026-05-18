import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  X, 
  Check, 
  RefreshCcw, 
  Sparkles, 
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
  ArrowRight
} from 'lucide-react';
import { optimizeProductContent, AIOptimizationResult } from '../../services/geminiService';
import { MLService } from '../../services/mlService';
import { Product } from '../../types';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface BatchOptimizationItem {
  product: Product;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: AIOptimizationResult;
  error?: string;
  applied: boolean;
}

interface AIBatchOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onApplyAll: (optimizations: { productId: string; title: string; description: string }[]) => void;
  accessToken?: string;
}

export const AIBatchOptimizerModal: React.FC<AIBatchOptimizerModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedProducts,
  onApplyAll,
  accessToken
}) => {
  const [items, setItems] = useState<BatchOptimizationItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (isOpen && items.length === 0) {
      setItems(selectedProducts.map(p => ({
        product: p,
        status: 'pending',
        applied: true
      })));
    } else if (!isOpen) {
      setItems([]);
      setCurrentProgress(0);
    }
  }, [isOpen, selectedProducts]);

  const startBatchOptimization = async () => {
    if (!accessToken) {
      alert("Token de acesso não encontrado. Reconecte sua conta.");
      return;
    }

    setIsProcessing(true);
    const newItems = [...items];
    
    for (let i = 0; i < newItems.length; i++) {
      if (newItems[i].status === 'completed') continue;
      
      newItems[i].status = 'processing';
      setItems([...newItems]);
      
      try {
        // Fetch real description if not present
        let description = newItems[i].product.description_text;
        if (!description) {
          try {
            const descData = await MLService.getItemDescription(newItems[i].product.item_id, accessToken);
            description = descData.plain_text || descData.text || "";
          } catch (e) {
            console.warn("Failed to fetch description for product", newItems[i].product.id);
            description = "Descrição original do Mercado Livre.";
          }
        }

        const result = await optimizeProductContent(
          newItems[i].product.title, 
          description || "Descrição original do Mercado Livre."
        );
        newItems[i].status = 'completed';
        newItems[i].result = result;
      } catch (error: any) {
        console.error("Batch Optimization Error:", error);
        newItems[i].status = 'error';
        
        // Extract a readable error message
        let errorMsg = 'Falha na otimização IA';
        if (error.response?.data?.error?.message) {
          errorMsg = `API Error: ${error.response.data.error.message}`;
        } else if (error.message) {
          errorMsg = error.message;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
        
        newItems[i].error = errorMsg;
      }
      
      setCurrentProgress(Math.round(((i + 1) / newItems.length) * 100));
      setItems([...newItems]);
      
      // Small delay to prevent hitting rate limits too fast
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsProcessing(false);
  };

  const handleToggleApply = (index: number) => {
    const newItems = [...items];
    newItems[index].applied = !newItems[index].applied;
    setItems(newItems);
  };

  const handleFinish = () => {
    const optimizations = items
      .filter(item => item.status === 'completed' && item.applied && item.result)
      .map(item => ({
        productId: item.product.id,
        title: item.result!.titles[0],
        description: item.result!.description
      }));
    
    onApplyAll(optimizations);
    onClose();
  };

  if (!isOpen) return null;

  const completedCount = items.filter(i => i.status === 'completed').length;
  const isFinished = items.length > 0 && items.every(i => i.status === 'completed' || i.status === 'error');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20">
              <Zap className="size-6 text-slate-900 fill-slate-900" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Otimização IA em Lote</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Processando {selectedProducts.length} anúncios selecionados
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="size-5 text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        {(isProcessing || isFinished) && (
          <div className="h-1 w-full bg-slate-100 relative overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress}%` }}
              className="absolute top-0 left-0 h-full bg-amber-400"
            />
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Sidebar / Stats */}
          <div className="w-full lg:w-72 bg-slate-50 border-r border-slate-100 p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo do Processo</h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Selecionados</p>
                  <p className="text-lg font-black text-slate-900">{items.length}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Processados</p>
                  <p className="text-lg font-black text-amber-500">{completedCount}</p>
                </div>
                {items.some(i => i.status === 'error') && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 shadow-sm">
                    <p className="text-[8px] font-bold text-red-400 uppercase">Erros</p>
                    <p className="text-lg font-black text-red-500">
                      {items.filter(i => i.status === 'error').length}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!isProcessing && !isFinished && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-4 text-amber-500 mt-0.5" />
                  <p className="text-[10px] text-amber-800 font-medium">
                    Clique em Iniciar para que o Gemini analise cada título e descrição buscando as melhores palavras-chave.
                  </p>
                </div>
              </div>
            )}

            {isFinished && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500 mt-0.5" />
                  <p className="text-[10px] text-emerald-800 font-medium">
                    Otimização concluída! Revise as sugestões ao lado e confirme a aplicação.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                <Search className="size-12 opacity-20" />
                <p className="text-sm font-medium">Nenhum produto selecionado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div 
                    key={item.product.id}
                    className={cn(
                      "bg-white border rounded-2xl p-4 transition-all duration-300",
                      item.status === 'processing' ? "border-amber-400 ring-2 ring-amber-400/10 shadow-lg" : "border-slate-100",
                      item.status === 'completed' && !item.applied && "opacity-60 saturate-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                        <img src={item.product.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-widest">
                            SKU: {item.product.sku}
                          </span>
                          {item.status === 'completed' && (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                              <Check className="size-2.5" /> Otimizado
                            </span>
                          )}
                          {item.status === 'processing' && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                              <Loader2 className="size-2.5 animate-spin" /> Processando...
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1 truncate">
                          {item.product.title}
                        </p>
                        
                        {item.status === 'completed' && item.result && (
                          <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-2">
                              <ArrowRight className="size-3 text-amber-500 mt-1 flex-shrink-0" />
                              <p className="text-xs font-black text-amber-600 leading-tight">
                                {item.result.titles[0]}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.result.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[8px] font-bold text-slate-400 bg-white px-1.5 py-0.5 border border-slate-100 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.status === 'error' && (
                          <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="size-3" /> {item.error}
                          </p>
                        )}
                      </div>

                      {item.status === 'completed' && (
                        <button 
                          onClick={() => handleToggleApply(idx)}
                          className={cn(
                            "size-10 rounded-xl flex items-center justify-center transition-all",
                            item.applied ? "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20" : "bg-slate-100 text-slate-400"
                          )}
                        >
                          <Check className={cn("size-5", item.applied ? "stroke-[3px]" : "stroke-[2px]")} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
          >
            Cancelar
          </button>
          
          <div className="flex items-center gap-3">
             {!isFinished && !isProcessing && (
               <button 
                 onClick={startBatchOptimization}
                 className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-10 py-3 rounded-xl text-xs font-extra-bold flex items-center gap-3 border-b-4 border-amber-600 active:translate-y-1 active:border-b-0 shadow-lg shadow-amber-400/20 transition-all font-sans uppercase tracking-[0.1em]"
               >
                 <Sparkles className="size-4" />
                 Iniciar Otimização
               </button>
             )}
             
             {isProcessing && (
               <div className="bg-slate-100 text-slate-400 px-10 py-3 rounded-xl text-xs font-extra-bold flex items-center gap-3 border-b-4 border-slate-200">
                 <Loader2 className="size-4 animate-spin" />
                 {currentProgress}% Concluído...
               </div>
             )}

             {isFinished && (
               <button 
                 onClick={handleFinish}
                 className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-3 rounded-xl text-xs font-extra-bold flex items-center gap-3 border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0 shadow-lg shadow-emerald-500/20 transition-all font-sans uppercase tracking-[0.1em]"
               >
                 Confirmar e Aplicar ({items.filter(i => i.applied && i.status === 'completed').length})
                 <ChevronRight className="size-4" />
               </button>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
