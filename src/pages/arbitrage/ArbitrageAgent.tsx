import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  ShoppingCart, 
  Calculator, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Package,
  DollarSign,
  BarChart3,
  Image as ImageIcon,
  PlusCircle,
  Clock
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Fornecedor {
  preco: number;
  vendas: number;
  avaliacao: number;
  tempo_envio: string;
}

interface ItemArbitragem {
  produto: {
    nome: string;
    categoria: string;
    concorrencia: string;
    imagem_url: string;
  };
  analise: string;
  fornecedor: {
    preco: number;
    vendas: string;
    avaliacao: string;
    envio: string;
  };
  financeiro: {
    custo_total: number;
    preco_sugerido: number;
    lucro_percentual: number;
  };
  status: 'APROVADO' | 'ARRISCADO' | 'DESCARTADO';
  anuncio: {
    titulo: string;
    descricao: string;
    palavras_chave: string[];
  };
}

export const ArbitrageAgent: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ItemArbitragem[] | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [importing, setImporting] = useState<number | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setResults(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Você é um Agente de Arbitragem Inteligente focado em e-commerce no Brasil.
        Seu objetivo é identificar 5 oportunidades de produtos lucrativos entre marketplaces (Shopee/AliExpress -> Mercado Livre).

        Execute rigorosamente as 6 etapas:
        1. PRODUTO: Identifique nome, categoria e concorrência.
        2. ANÁLISE: Gere uma análise estratégica curta (máx 2 linhas) sobre por que o produto está em alta.
        3. MATCH SHOPEE: Simule um fornecedor ideal com preço, vendas, avaliação e tempo de envio.
        4. CÁLCULO FINANCEIRO: Taxa ML 16%, Frete R$15. Calcule custo total e preço sugerido (margem mín. 20%).
        5. ANÚNCIO: Crie um título e descrição SEO para o Mercado Livre.
        6. STATUS: Classifique como APROVADO, ARRISCADO ou DESCARTADO.

        IMPORTANTE: Forneça uma URL de imagem válida do Unsplash que represente o produto. 
        Exemplo de formato: https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&q=80&w=400
        Tente ser específico com os IDs de fotos de produtos se possível, ou use a API do Unsplash Source se preferir: https://source.unsplash.com/featured/?{product_name}
        Nota: Como a source API foi descontinuada, prefira retornar uma URL direta do Unsplash que você conheça como um modelo de IA.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              produtos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    produto: {
                      type: Type.OBJECT,
                      properties: {
                        nome: { type: Type.STRING },
                        categoria: { type: Type.STRING },
                        concorrencia: { type: Type.STRING },
                        imagem_url: { type: Type.STRING }
                      }
                    },
                    analise: { type: Type.STRING },
                    fornecedor: {
                      type: Type.OBJECT,
                      properties: {
                        preco: { type: Type.NUMBER },
                        vendas: { type: Type.STRING },
                        avaliacao: { type: Type.STRING },
                        envio: { type: Type.STRING }
                      }
                    },
                    financeiro: {
                      type: Type.OBJECT,
                      properties: {
                        custo_total: { type: Type.NUMBER },
                        preco_sugerido: { type: Type.NUMBER },
                        lucro_percentual: { type: Type.NUMBER }
                      }
                    },
                    status: { type: Type.STRING },
                    anuncio: {
                      type: Type.OBJECT,
                      properties: {
                        titulo: { type: Type.STRING },
                        descricao: { type: Type.STRING },
                        palavras_chave: { 
                          type: Type.ARRAY, 
                          items: { type: Type.STRING } 
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.produtos) {
        setResults(data.produtos);
      } else {
        throw new Error("Formato de resposta inválido");
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao executar análise do Agente de Arbitragem com IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportToQueue = async (item: ItemArbitragem, index: number) => {
    if (!user) {
      alert("Você precisa estar logado para importar produtos. Por favor, faça login novamente.");
      return;
    }

    setImporting(index);
    const path = `users/${user.uid}/drafts`;
    
    try {
      console.log(`[Arbitrage] Iniciando importação para ${path}`, item);
      
      const draftsRef = collection(db, 'users', user.uid, 'drafts');
      
      // Validação profunda para evitar erros de campo obrigatório ou undefined no Firestore
      const safeTitle = (item.anuncio?.titulo || item.produto?.nome || "Produto da Arbitragem").substring(0, 200);
      const safePrice = Number(item.financeiro?.preco_sugerido) || 0;
      const safeCost = Number(item.financeiro?.custo_total) || 0;
      const safeMargin = Number(item.financeiro?.lucro_percentual) || 0;
      const safeDesc = (item.anuncio?.descricao || "").substring(0, 5000); // Descrições ML podem ser longas
      const safeImage = item.produto?.imagem_url || `https://placehold.co/400x400/f1f5f9/64748b?text=${encodeURIComponent(safeTitle)}`;
      const safeCategory = item.produto?.categoria || "Geral";

      const draftData = {
        title: safeTitle,
        price: safePrice,
        cost: safeCost,
        margin: safeMargin,
        description: safeDesc,
        imageUrl: safeImage,
        category: safeCategory,
        status: 'draft',
        created_at: new Date().toISOString(),
        server_timestamp: serverTimestamp()
      };

      console.log("[Arbitrage] Payload higienizado:", draftData);

      const docRef = await addDoc(draftsRef, draftData);
      console.log("[Arbitrage] Sucesso! Documento ID:", docRef.id);
      
      alert(`Sucesso! "${safeTitle.substring(0, 30)}..." foi enviado para a Fila de Cadastro.`);
    } catch (err: any) {
      console.error("[Arbitrage] Erro FATAL na importação:", err);
      
      let errorMsg = "Ocorreu um erro ao salvar na fila.";
      if (err.message?.includes("insufficient permissions")) {
        errorMsg = "Permissão Negada: Verifique se você tem um plano ativo ou se as regras de segurança do Firebase permitem a escrita.";
      } else if (err.code === 'unavailable' || err.message?.includes("offline")) {
        errorMsg = "Serviço Indisponível: Verifique sua conexão ou tente novamente em instantes.";
      }

      alert(`${errorMsg}\n\nDetalhe Técnico: ${err.message || "Erro de rede"}`);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Sparkles className="size-5" />
            <span className="text-sm font-black uppercase tracking-wider">Mente de Negócio Real</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Agente de <span className="text-amber-500">Arbitragem IA</span>
          </h1>
          <p className="text-slate-500 mt-2 max-w-xl">
            Identifico tendências, valido fornecedores e calculo margens reais para você escalar seu e-commerce com segurança.
          </p>
        </div>
        
        <button
          onClick={runAnalysis}
          disabled={loading}
          className={`
            px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all
            ${loading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 shadow-xl shadow-slate-200'
            }
          `}
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <RefreshCw className="size-5" />}
          {loading ? 'Analisando Mercado...' : 'Iniciar Nova Análise'}
        </button>
      </div>

      {/* Modules Explanation */}
      {!results && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { icon: Search, label: 'Descoberta', desc: 'Tendências em alta' },
            { icon: ShoppingCart, label: 'Fornecedores', desc: 'Match com Shopee' },
            { icon: Calculator, label: 'Viabilidade', desc: 'Cálculo de lucro' },
            { icon: FileText, label: 'Anúncio', desc: 'Otimização SEO' },
            { icon: BarChart3, label: 'Resultado', desc: 'Mentalidade Real' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mb-4 font-black">
                {i + 1}
              </div>
              <h3 className="font-bold text-slate-900">{item.label}</h3>
              <p className="text-[10px] text-slate-500 uppercase font-black mt-1 tracking-widest">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative">
            <Loader2 className="size-12 text-amber-500 animate-spin" />
            <Sparkles className="size-6 text-amber-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <p className="font-black text-slate-900 text-xl">Simulando buscas e calculando margens...</p>
          <div className="flex gap-2">
            {['Escaneando Shopee', 'Calculando Taxas ML', 'Gerando SEO IA'].map((step, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500">
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-6">
        <AnimatePresence>
          {results?.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                bg-white rounded-3xl border overflow-hidden transition-all
                ${item.status === 'APROVADO' ? 'border-emerald-100 shadow-sm' : item.status === 'ARRISCADO' ? 'border-amber-100 shadow-sm' : 'border-slate-100 opacity-75'}
                ${expandedIndex === index ? 'ring-2 ring-amber-400 ring-offset-4' : ''}
              `}
            >
              {/* Summary Row */}
              <div 
                className="p-6 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-center gap-6 flex-1">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex-shrink-0">
                    <img 
                      src={item.produto.imagem_url || `https://placehold.co/400x400/f1f5f9/64748b?text=${encodeURIComponent(item.produto.nome)}`} 
                      alt={item.produto.nome} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('placehold.co')) {
                          target.src = `https://placehold.co/400x400/f1f5f9/64748b?text=${encodeURIComponent(item.produto.nome)}`;
                        }
                      }}
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.produto.categoria}</span>
                    <h3 className="text-xl font-black text-slate-900 line-clamp-1">{item.produto.nome}</h3>
                    <div className="flex gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        <TrendingUp size={10} /> {item.produto.concorrencia} concorrência
                      </span>
                      {item.status === 'APROVADO' && (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                          {item.financeiro.lucro_percentual}% Margem
                        </span>
                      )}
                      {item.status === 'ARRISCADO' && (
                        <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                          Arriscado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-12 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Total</p>
                    <p className="text-lg font-bold text-slate-700">R$ {item.financeiro.custo_total.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venda Sugerida</p>
                    <p className="text-lg font-black text-amber-600">R$ {item.financeiro.preco_sugerido.toFixed(2)}</p>
                  </div>
                  <div className="text-slate-400">
                    {expandedIndex === index ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </div>

              {/* Expansion Details */}
              {expandedIndex === index && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-50 p-8 pt-4 space-y-8"
                >
                  {/* Motivations */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-500" />
                      Análise Estratégica do Agente
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.analise}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Fornecedores */}
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <ShoppingCart className="size-4" /> match Shopee (Simulado)
                      </h4>
                      <div className="space-y-2">
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group">
                          <div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="size-4 text-emerald-500" />
                              <p className="text-lg font-black text-slate-900">R$ {item.fornecedor.preco.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-3 text-[10px] font-bold text-slate-400 mt-1">
                              <span>{item.fornecedor.vendas} vendas</span>
                              <span>★ {item.fornecedor.avaliacao}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Envio</p>
                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <Clock size={10} /> {item.fornecedor.envio}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEO Ad Preview */}
                    <div className="space-y-4">
                      <h4 className="font-black text-slate-900 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <FileText className="size-4" /> Anúncio Otimizado (SEO)
                      </h4>
                      <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-xl border border-slate-800">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Título ML</p>
                          <p className="font-black text-lg text-amber-400">{item.anuncio.titulo}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 shrink-0">Descrição</p>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 italic opacity-75">
                            "{item.anuncio.descricao?.substring(0, 150)}..."
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {item.anuncio.palavras_chave.slice(0, 5).map((kw, kwi) => (
                            <span key={kwi} className="text-[9px] font-black uppercase bg-slate-800 text-slate-400 px-2 py-1 rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-slate-50 mt-4">
                    {!user && (
                      <p className="text-xs font-bold text-red-500 mr-auto flex items-center gap-1">
                        <XCircle size={14} /> Faça login para importar
                      </p>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImportToQueue(item, index);
                      }}
                      disabled={importing === index || !user}
                      className={`
                        px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all
                        ${importing === index || !user
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50' 
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95'
                        }
                      `}
                    >
                      {importing === index ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle size={18} />}
                      Importar para Fila de Cadastro
                    </button>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                      Copiar Dados SEO <ExternalLink size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
