import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  Settings, 
  Copy, 
  CheckCircle2, 
  Search,
  RefreshCw,
  Plus,
  Layout,
  Calculator,
  Image as ImageIcon,
  Type,
  FileText,
  Rocket,
  Sparkles,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { MLService } from '../../services/mlService';
import { GoogleGenAI } from "@google/genai";
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type Step = 'select' | 'configure' | 'review' | 'processing';

interface DuplicationWizardProps {
  onNavigate: (id: string, items?: any[]) => void;
  selectedProducts?: any[];
}

export const DuplicationWizard: React.FC<DuplicationWizardProps> = ({ onNavigate, selectedProducts = [] }) => {
  const { customerData, refreshMLToken } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedItems, setSelectedItems] = useState(selectedProducts.map(p => ({
    ...p,
    quantity: 1,
    editedTitle: p.title,
    editedPrice: p.price
  })));
  const [finalCopies, setFinalCopies] = useState<any[]>([]);
  const [processingItems, setProcessingItems] = useState<string[]>([]);
  const [results, setResults] = useState<{id: string, success: boolean, newItemId?: string, error?: string}[]>([]);
  const [me, setMe] = useState<any>(null);
  const [config, setConfig] = useState({
    pricePercentage: 5,
    removeLogos: true,
    flipImages: false,
    globalQuantity: 1
  });

  const [importId, setImportId] = useState('');
  const [importing, setImporting] = useState(false);
  const [suggestingIndex, setSuggestingIndex] = useState<number | null>(null);

  const handleImportRemote = async (): Promise<any> => {
    if (!importId || !customerData?.ml_credentials) return;
    setImporting(true);
    try {
      const { access_token } = customerData.ml_credentials;
      const data = await MLService.getItemDetails(importId, access_token);
      const newItem = {
        id: data.id,
        item_id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        price: data.price,
        quantity: 1,
        editedTitle: data.title,
        editedPrice: Number((data.price * (1 + config.pricePercentage / 100)).toFixed(2))
      };
      setSelectedItems(prev => [...prev, newItem]);
      setImportId('');
    } catch (e: any) {
      console.error("Import error:", e.response?.data || e.message);
      if (e.response?.status === 401 || e.response?.status === 403) {
        console.log("Token expired during import, attempting refresh...");
        const newCreds = await refreshMLToken();
        if (newCreds) {
          // One manual retry for user convenience on manual action
          try {
            const data = await MLService.getItemDetails(importId, newCreds.access_token);
            const newItem = {
              id: data.id,
              item_id: data.id,
              title: data.title,
              thumbnail: data.thumbnail,
              price: data.price,
              quantity: 1,
              editedTitle: data.title,
              editedPrice: Number((data.price * (1 + config.pricePercentage / 100)).toFixed(2))
            };
            setSelectedItems(prev => [...prev, newItem]);
            setImportId('');
            return;
          } catch (retryError) {
            console.error("Retry import failed:", retryError);
          }
        }
      }
      alert("Item não encontrado ou erro na API do Mercado Livre.");
    } finally {
      setImporting(false);
    }
  };

  const handleAISuggestTitle = async (idx: number) => {
    const item = finalCopies[idx];
    if (!item) return;

    setSuggestingIndex(idx);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Gere uma VARIAÇÃO ÚNICA E CRIATIVA do título deste produto (Variação Aleatória #${Math.floor(Math.random() * 1000)}). 
      Título original: "${item.title}". 
      Instruções: Use sinônimos, mude a ordem das palavras, mas mantenha as palavras-chave principais. 
      Importante: O título DEVE ser diferente do original e de outras variações.
      Responda apenas com o novo título otimizado (máximo 60 caracteres), sem aspas ou explicações.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const newTitle = response.text?.trim() || item.editedTitle;
      const newItems = [...finalCopies];
      newItems[idx].editedTitle = newTitle.replace(/"/g, '').substring(0, 60);
      setFinalCopies(newItems);
    } catch (error: any) {
      console.error("Erro na sugestão de IA:", error);
      if (error.message?.includes("RESOURCE_EXHAUSTED")) {
        alert("Limite de IA esgotado para este minuto. Aguarde um momento e tente novamente.");
      } else {
        alert("Erro ao gerar sugestão de IA. Tente manualmente.");
      }
    } finally {
      setSuggestingIndex(null);
    }
  };

  const handleAIMassOptimize = async () => {
    // Optimization for all copies
    setSuggestingIndex(-1); // Special value for mass optimization
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const newCopies = [...finalCopies];
      
      // We'll process them in small batches or one by one for simplicity here
      for (let i = 0; i < newCopies.length; i++) {
        const item = newCopies[i];
        const prompt = `Gere uma VARIAÇÃO ÚNICA E CRIATIVA do título deste produto (Variação #${i + 1}). 
        Título original: "${item.title}". 
        Responda apenas com o novo título (máximo 60 caracteres), sem aspas.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });

        const newTitle = response.text?.trim() || item.editedTitle;
        newCopies[i].editedTitle = newTitle.replace(/"/g, '').substring(0, 60);
      }
      
      setFinalCopies(newCopies);
    } catch (error: any) {
      console.error("Mass AI Error:", error);
      if (error.message?.includes("RESOURCE_EXHAUSTED")) {
        alert("O limite de processamento de IA foi atingido. Tente novamente em alguns segundos ou otimize individualmente.");
      }
    } finally {
      setSuggestingIndex(null);
    }
  };

  // Fetch real account info
  const fetchMe = async () => {
    if (!customerData?.ml_credentials) return;
    try {
      const data = await MLService.getMe(customerData.ml_credentials.access_token);
      setMe(data);
    } catch (e: any) {
      console.error("fetchMe error:", e.response?.data || e.message);
      if (e.response?.status === 401 || e.response?.status === 403) {
        console.log("Token expired in fetchMe, refreshing...");
        await refreshMLToken();
      }
    }
  };

  useEffect(() => {
    fetchMe();
  }, [customerData?.ml_credentials?.access_token]);

  // Atualiza itens quando os produtos selecionados carregam
  useEffect(() => {
    if (selectedProducts.length > 0) {
      setSelectedItems(selectedProducts.map(p => ({
        ...p,
        quantity: 1,
        editedTitle: p.title,
        editedPrice: Number((p.price * (1 + config.pricePercentage / 100)).toFixed(2))
      })));
    }
  }, [selectedProducts]);

  // Sync edited prices when percentage changes
  const handlePricePercentageChange = (val: number) => {
    setConfig(prev => ({ ...prev, pricePercentage: val }));
    setSelectedItems(prev => prev.map(item => ({
      ...item,
      editedPrice: Number((item.price * (1 + val / 100)).toFixed(2))
    })));
  };

  const handleStartDuplication = async () => {
    if (!customerData?.ml_credentials || !me) return;
    
    setCurrentStep('processing');
    const { access_token } = customerData.ml_credentials;
    const userId = customerData.id;
    
    // Processamento real via API
    for (let i = 0; i < finalCopies.length; i++) {
      const item = finalCopies[i];
      const uniqueId = `${item.originalId}-${i}-${Math.random().toString(36).substr(2, 5)}`;
      setProcessingItems(prev => [...prev, uniqueId]);
      
      try {
        const result = await MLService.duplicateItem(item.originalId, access_token, {
          title: item.editedTitle,
          price: Number(Number(item.editedPrice).toFixed(2))
        });
        
        setResults(prev => [...prev, { id: uniqueId, success: true, newItemId: result.id, title: item.editedTitle }]);
        
        // Save to Firestore
        await addDoc(collection(db, 'users', userId, 'jobs'), {
          source_item_id: item.originalId,
          source_title: item.title,
          target_account: me.nickname || 'Sua Conta ML',
          status: 'completed',
          progress: 100,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          new_item_id: result.id,
          server_timestamp: serverTimestamp()
        });
      } catch (e: any) {
        console.error("Error duplicating item:", e.response?.data || e.message);
        
        // Prioritize the user-friendly 'message' field from our server
        const errorMsg = e.response?.data?.message || 
                         e.response?.data?.details?.cause?.[0]?.message || 
                         e.response?.data?.details?.message || 
                         e.response?.data?.error || 
                         "Erro desconhecido";
        
        setResults(prev => [...prev, { id: uniqueId, success: false, error: errorMsg, title: item.editedTitle }]);
        
        // Save failure to Firestore
        await addDoc(collection(db, 'users', userId, 'jobs'), {
          source_item_id: item.originalId,
          source_title: item.title,
          target_account: me.nickname || 'Sua Conta ML',
          status: 'failed',
          progress: 100,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error: errorMsg,
          server_timestamp: serverTimestamp()
        });
      }
    }
  };

  const steps = [
    { id: 'select', label: 'Seleção', icon: Search },
    { id: 'configure', label: 'Ajustes', icon: Settings },
    { id: 'review', label: 'Revisão', icon: Layout },
    { id: 'processing', label: 'Disparo', icon: Rocket },
  ];

  const getStepIndex = (s: Step) => steps.findIndex(step => step.id === s);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Zap className="size-6 text-amber-500 fill-amber-500" />
            Motor de Duplicação PRO
          </h1>
          <p className="text-slate-500 text-sm font-medium">Fluxo otimizado para escala massiva de anúncios.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
           <motion.div 
             className="h-full bg-amber-400"
             initial={{ width: '0%' }}
             animate={{ width: `${(getStepIndex(currentStep) / (steps.length - 1)) * 100}%` }}
           />
        </div>
        {steps.map((step, i) => {
          const isActive = step.id === currentStep;
          const isDone = getStepIndex(currentStep) > i;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 relative z-10 px-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2",
                isActive ? "bg-amber-400 border-amber-500 text-slate-900 shadow-lg shadow-amber-400/20" : 
                isDone ? "bg-emerald-500 border-emerald-600 text-white" : "bg-white border-slate-100 text-slate-300"
              )}>
                {isDone ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isActive ? "text-slate-900" : "text-slate-400"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait">
          {currentStep === 'select' && (
            <motion.div 
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Anúncios Selecionados</h2>
                  <p className="text-sm text-slate-500">Você escolheu {selectedItems.length} anúncio(s) para iniciar o processo.</p>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Importar Ad de terceiros colando o ID (ex: MLB3704770859)..."
                      value={importId}
                      onChange={(e) => setImportId(e.target.value)}
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-white outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleImportRemote}
                    disabled={importing || !importId}
                    className="bg-slate-900 text-white px-6 rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    {importing ? <RefreshCw className="size-3 animate-spin" /> : <Plus className="size-4" />}
                    Importar Item
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 group">
                    <img src={item.thumbnail} alt="" className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex-shrink-0 object-cover" />
                    <div className="flex flex-col flex-1 overflow-hidden">
                       <span className="text-sm font-bold text-slate-700 truncate">{item.title}</span>
                       <span className="text-[10px] text-slate-400 font-bold">{item.item_id}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedItems(prev => prev.filter(p => p.id !== item.id))}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => onNavigate('products')}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all font-sans"
                >
                  + Adicionar mais itens da biblioteca
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'configure' && (
            <motion.div 
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Global Overrides */}
                <div className="space-y-6">
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Calculator className="size-4 text-amber-500" />
                    Regras de Escopo
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Ajuste Percentual de Preço</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={config.pricePercentage}
                          onChange={(e) => handlePricePercentageChange(parseFloat(e.target.value) || 0)}
                          className="flex-1 bg-slate-50 border-slate-200 border rounded-lg px-3 py-2 text-sm focus:bg-white outline-none font-bold" 
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 p-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm">
                      <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                        <Copy className="size-3" />
                        Quantidade de Cópias (Global)
                      </label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          min="1"
                          max="50"
                          value={config.globalQuantity}
                          onChange={(e) => {
                             const val = parseInt(e.target.value) || 1;
                             setConfig(prev => ({ ...prev, globalQuantity: val }));
                             setSelectedItems(prev => prev.map(item => ({ ...item, quantity: val })));
                          }}
                          className="w-24 bg-white border-amber-200 border-2 rounded-xl px-4 py-3 text-lg font-black text-slate-900 focus:border-amber-500 outline-none transition-all shadow-inner" 
                        />
                        <div className="flex-1">
                          <p className="text-[10px] text-amber-600 font-bold leading-tight">Cada item selecionado será multiplicado por {config.globalQuantity}.</p>
                          <p className="text-[9px] text-amber-400 font-medium">Recomendado: até 10 para evitar suspensão.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Rules */}
                <div className="space-y-6">
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="size-4 text-amber-500" />
                    Otimização de Mídia
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={config.removeLogos} 
                        onChange={() => setConfig(prev => ({ ...prev, removeLogos: !prev.removeLogos }))} 
                      />
                      <div className={cn(
                        "w-5 h-5 rounded border transition-colors flex items-center justify-center",
                        config.removeLogos ? "bg-amber-400 border-amber-500" : "border-slate-300"
                      )}>
                        {config.removeLogos && <div className="w-2 h-2 bg-slate-900 rounded-sm" />}
                      </div>
                      <span className="text-xs font-bold text-slate-600">Remover logotipos via IA</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={config.flipImages} 
                        onChange={() => setConfig(prev => ({ ...prev, flipImages: !prev.flipImages }))} 
                      />
                      <div className={cn(
                        "w-5 h-5 rounded border transition-colors flex items-center justify-center",
                        config.flipImages ? "bg-amber-400 border-amber-500" : "border-slate-300"
                      )}>
                        {config.flipImages && <div className="w-2 h-2 bg-slate-900 rounded-sm" />}
                      </div>
                      <span className="text-xs font-bold text-slate-600">Inverter imagens horizontalmente</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Destination Account */}
              <div className="pt-8 border-t border-slate-100">
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Type className="size-4 text-amber-500" />
                  Conta de Destino
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-black">
                      {me?.nickname?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">{me?.nickname || 'Sua Conta ML'}</p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Ativa para Receber</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'review' && (
             <motion.div 
               key="review"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="p-8 space-y-6"
             >
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-xl font-bold text-slate-900 tracking-tight">Revisão Final</h2>
                   <p className="text-sm text-slate-500">Ajuste os detalhes de cada anúncio antes de disparar.</p>
                 </div>
                 <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                   {finalCopies.length} Itens
                 </div>
               </div>

               {finalCopies.length > 1 && (
                 <button 
                   onClick={handleAIMassOptimize}
                   disabled={suggestingIndex !== null}
                   className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                 >
                   {suggestingIndex === -1 ? <RefreshCw className="size-3 animate-spin" /> : <Sparkles className="size-3 text-amber-400" />}
                   {suggestingIndex === -1 ? 'Processando variações únicas...' : 'Gerar Títulos Diferentes para Todas as Cópias'}
                 </button>
               )}

               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {finalCopies.map((item, idx) => (
                   <div key={item.copyId} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                      <div className="flex gap-4">
                        <div className="relative">
                           <img src={item.thumbnail} className="w-16 h-16 rounded-xl bg-white border border-slate-200 object-cover" />
                           <div className="absolute -top-2 -left-2 bg-slate-900 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                             {idx + 1}
                           </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="space-y-1">
                             <div className="flex items-center justify-between">
                               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Título do Anúncio (Cópia)</label>
                               <button 
                                 onClick={() => handleAISuggestTitle(idx)}
                                 disabled={suggestingIndex !== null}
                                 className="flex items-center gap-1 text-[9px] font-bold text-amber-500 hover:text-amber-600 transition-colors uppercase tracking-widest disabled:opacity-50"
                               >
                                 {suggestingIndex === idx ? (
                                   <Loader2 className="size-2.5 animate-spin" />
                                 ) : (
                                   <Sparkles className="size-2.5" />
                                 )}
                                 {suggestingIndex === idx ? 'Aguarde...' : 'Variação IA'}
                               </button>
                             </div>
                             <input 
                               value={item.editedTitle}
                               maxLength={60}
                               onChange={(e) => {
                                 const newItems = [...finalCopies];
                                 newItems[idx].editedTitle = e.target.value;
                                 setFinalCopies(newItems);
                               }}
                               className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-400"
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Preço Final (Variação)</label>
                               <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={Number(item.editedPrice).toFixed(2)}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      const newItems = [...finalCopies];
                                      newItems[idx].editedPrice = !isNaN(val) ? val : 0;
                                      setFinalCopies(newItems);
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-400"
                                  />
                               </div>
                             </div>
                             <div className="space-y-1">
                               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estoque</label>
                               <input 
                                 type="number"
                                 defaultValue="1"
                                 className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-400 outline-none cursor-not-allowed"
                                 disabled
                               />
                             </div>
                          </div>
                       </div>
                     </div>
                  </div>
                 ))}
               </div>
             </motion.div>
          )}
          
          {currentStep === 'processing' && (
             <motion.div 
               key="processing"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               className="p-8 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]"
             >
               <div className="relative">
                 <div className="w-24 h-24 bg-amber-400/10 rounded-full flex items-center justify-center animate-pulse">
                   <Rocket className="size-10 text-amber-500" />
                 </div>
                 <div className="absolute inset-0 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
               </div>
               <div className="space-y-2">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">DISPARANDO CÓPIAS...</h2>
                 <p className="text-sm text-slate-500 font-medium font-sans">Sincronizando com as APIs do Mercado Livre.</p>
               </div>
               
               <div className="w-full max-w-sm space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span>PROGRESSO: {results.length} DE {finalCopies.length}</span>
                     <span>{finalCopies.length > 0 ? Math.round((results.length / finalCopies.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                     <motion.div 
                       className="h-full bg-amber-400"
                       initial={{ width: 0 }}
                       animate={{ width: `${finalCopies.length > 0 ? (results.length / finalCopies.length) * 100 : 0}%` }}
                     />
                  </div>
                  {results.length === finalCopies.length && finalCopies.length > 0 && (
                    <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in zoom-in-95 duration-500 w-full">
                       <div className="flex items-center justify-center gap-2 text-slate-900 border-b border-slate-200 pb-4 mb-4">
                          <CheckCircle2 className="size-5 text-emerald-500" />
                          <span className="font-black text-sm uppercase tracking-tight">Processamento Finalizado</span>
                       </div>

                       <div className="space-y-2 max-h-40 overflow-y-auto px-2">
                          {results.map((res: any, i) => {
                            return (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className={cn("size-2 rounded-full", res.success ? "bg-emerald-500" : "bg-red-500")} />
                                  <span className="text-[10px] font-bold text-slate-600 truncate">{res.title}</span>
                                </div>
                                {!res.success && (
                                  <span className="text-[9px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded uppercase">{res.error}</span>
                                )}
                                {res.success && (
                                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase">Sucesso</span>
                                )}
                              </div>
                            );
                          })}
                       </div>

                       <div className="grid grid-cols-2 gap-2 pt-4">
                          <button 
                            onClick={() => onNavigate('history')}
                            className="bg-white text-slate-900 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 shadow-sm"
                          >
                            Ver Histórico
                          </button>
                          <button 
                            onClick={() => {
                              setCurrentStep('select');
                              setResults([]);
                              setProcessingItems([]);
                            }}
                            className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-sm"
                          >
                            Nova Duplicação
                          </button>
                       </div>
                    </div>
                  )}
               </div>

               {results.length < selectedItems.length && (
                 <button 
                   onClick={() => onNavigate('history')}
                   className="text-xs font-bold text-slate-400 hover:text-slate-600 underline font-sans"
                 >
                   CANCELAR OPERAÇÃO
                 </button>
               )}
             </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        {currentStep !== 'processing' && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button 
              onClick={() => {
                if (currentStep === 'configure') setCurrentStep('select');
                if (currentStep === 'review') setCurrentStep('configure');
              }}
              disabled={currentStep === 'select'}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-0 transition-all font-sans"
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
            <button 
              onClick={() => {
                if (currentStep === 'select') {
                  if (selectedItems.length === 0) {
                    alert("Selecione ao menos um item.");
                    return;
                  }
                  setCurrentStep('configure');
                }
                else if (currentStep === 'configure') {
                   // Expand items based on quantity
                   const copies: any[] = [];
                   selectedItems.forEach(item => {
                     for (let i = 0; i < item.quantity; i++) {
                       copies.push({
                         copyId: `${item.id}-${i}`,
                         originalId: item.item_id,
                         title: item.title,
                         thumbnail: item.thumbnail,
                         editedTitle: item.editedTitle,
                         editedPrice: item.editedPrice
                       });
                     }
                   });
                   setFinalCopies(copies);
                   setCurrentStep('review');
                }
                else if (currentStep === 'review') handleStartDuplication();
              }}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-8 py-3 rounded-xl text-xs font-extra-bold flex items-center gap-3 border-b-4 border-amber-600 active:translate-y-1 active:border-b-0 shadow-lg shadow-amber-400/20 transition-all font-sans"
            >
              {currentStep === 'review' ? 'CONFIRMAR DISPARO' : 'PRÓXIMO PASSO'}
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4">
        <span className="flex items-center gap-1.5 font-sans"><Copy className="size-3" /> Anti-Replica Guard Ativado</span>
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <span className="flex items-center gap-1.5 font-sans"><Zap className="size-3" /> IA Optimization v2.1</span>
      </div>
    </div>
  );
};
