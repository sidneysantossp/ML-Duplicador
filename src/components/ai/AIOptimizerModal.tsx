import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  X, 
  Check, 
  RefreshCcw, 
  Sparkles, 
  ChevronRight,
  Lightbulb,
  Copy,
  Layout
} from 'lucide-react';
import { optimizeProductContent, AIOptimizationResult } from '../../services/geminiService';
import { cn } from '../../lib/utils';

interface AIOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productDescription: string;
  onApply: (title: string, description: string) => void;
}

export const AIOptimizerModal: React.FC<AIOptimizerModalProps> = ({ 
  isOpen, 
  onClose, 
  productTitle, 
  productDescription,
  onApply 
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIOptimizationResult | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('');

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const data = await optimizeProductContent(productTitle, productDescription);
      setResult(data);
      setSelectedTitle(data.titles[0]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !result) {
      handleOptimize();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/20">
              <Zap className="size-5 text-slate-900 fill-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Otimizador IA de Conversão</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Gemini 3.1 Pro Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="size-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCcw className="size-12 text-amber-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Analisando Mercado Livre...</p>
                <p className="text-xs text-slate-400 mt-1">O Gemini está extraindo as melhores palavras-chave para este anúncio.</p>
              </div>
            </div>
          ) : result ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Titles Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="size-4 text-amber-500" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Sugestões de Título (SEO)</h3>
                </div>
                <div className="space-y-3">
                  {result.titles.map((t, i) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedTitle(t)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border-2 transition-all group relative",
                        selectedTitle === t ? "border-amber-400 bg-amber-50/30" : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-colors",
                          selectedTitle === t ? "bg-amber-400 text-slate-900" : "bg-slate-100 text-slate-300"
                        )}>
                          {selectedTitle === t ? <Check className="size-3" /> : <span className="text-[10px] font-bold">{i+1}</span>}
                        </div>
                        <p className="text-sm font-bold text-slate-800 flex-1 leading-snug">{t}</p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase">{t.length} chars</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                  <Lightbulb className="size-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Por que isso vende mais?</p>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">{result.justification}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-4">
                  {result.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="size-4 text-blue-500" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Descrição Persuasiva</h3>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 h-[380px] overflow-y-auto custom-scrollbar relative">
                  <div className="prose prose-slate prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                      {result.description}
                    </pre>
                  </div>
                  <button className="absolute top-4 right-4 p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-amber-500 transition-colors shadow-sm">
                    <Copy className="size-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 italic font-medium text-center">
                  💡 Nossa IA formatou a descrição para ser compatível com dispositivos móveis e desktop.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleOptimize}
              disabled={loading}
              className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className="size-3.5" /> Gerar novas opções
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all">
              Descartar
            </button>
            <button 
              onClick={() => onApply(selectedTitle, result?.description || '')}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-3 rounded-xl text-xs font-extra-bold flex items-center gap-3 border-b-4 border-amber-600 active:translate-y-1 active:border-b-0 shadow-lg shadow-amber-400/20 transition-all"
            >
              Aplicar Otimização
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
