import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AITitleSuggester: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const suggestTitles = async () => {
    if (!productName.trim()) return;
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Gere 5 sugestões de títulos otimizados para conversão no Mercado Livre para o seguinte produto: "${productName}".
      Os títulos devem ser profissionais, diretos, incluir palavras-chave relevantes e ter no máximo 60 caracteres.
      Retorne apenas a lista de títulos, um por linha, sem numeração ou texto adicional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || '';
      const lines = text.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
      setSuggestions(lines);
    } catch (error) {
      console.error("Erro ao sugerir títulos:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-amber-50 rounded-lg">
          <Sparkles className="size-4 text-amber-500" />
        </div>
        <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Sugestão de Títulos AI</h3>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produto / Descrição Base</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Teclado Mecânico RGB Switch Blue"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white outline-none focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
            <button
              onClick={suggestTitles}
              disabled={loading || !productName.trim()}
              className="bg-slate-900 text-white px-4 py-2 px-6 rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
              {loading ? 'Gerando...' : 'Sugerir'}
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Títulos Recomendados</p>
            <div className="space-y-2">
              {suggestions.map((title, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
                >
                  <span className="text-sm font-medium text-slate-700">{title}</span>
                  <button 
                    onClick={() => copyToClipboard(title, idx)}
                    className="p-1.5 hover:bg-white rounded-md text-slate-400 hover:text-amber-600 transition-all"
                  >
                    {copiedIndex === idx ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestions.length === 0 && !loading && (
          <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
             <p className="text-xs text-slate-400 font-medium italic">Insira o nome do produto acima para gerar títulos que vendem.</p>
          </div>
        )}
      </div>
    </div>
  );
};
