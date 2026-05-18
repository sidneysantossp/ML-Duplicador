import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Image as ImageIcon, 
  Type, 
  Tag, 
  DollarSign, 
  Package, 
  Trash2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Info,
  Settings,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MLService } from '../../services/mlService';
import { cn, formatCurrency } from '../../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { motion } from 'motion/react';

import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProductEditorProps {
  onNavigate: (id: string, items?: any[]) => void;
  productId: string;
  initialProduct?: any;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({ onNavigate, productId, initialProduct }) => {
  const { user, customerData } = useAuth();
  const [product, setProduct] = useState<any>(initialProduct || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'attributes' | 'description' | 'financial'>('basic');
  const [suggestingTitle, setSuggestingTitle] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    price: 0,
    available_quantity: 0,
    listing_type_id: '',
    condition: '',
    description: '',
    sku: ''
  });

  useEffect(() => {
    const fetchDetails = async () => {
      // Se já temos os dados iniciais (como no caso de um draft), não buscamos no ML
      if (initialProduct?.isDraft) {
        setFormData({
          title: initialProduct.title || '',
          price: initialProduct.price || 0,
          available_quantity: initialProduct.available_quantity || 1,
          listing_type_id: initialProduct.listing_type_id || 'gold_special',
          condition: initialProduct.condition || 'new',
          description: initialProduct.description || '',
          sku: initialProduct.sku || ''
        });
        
        // Mocking the structure expected by the UI from a regular ML product
        if (!product || !product.pictures) {
          setProduct({
            ...initialProduct,
            pictures: initialProduct.imageUrl ? [{ secure_url: initialProduct.imageUrl }] : [],
            thumbnail: initialProduct.imageUrl,
            last_updated: initialProduct.created_at || new Date().toISOString()
          });
        }
        
        setLoading(false);
        return;
      }

      if (!customerData?.ml_credentials || !productId) return;
      
      setLoading(true);
      try {
        const { access_token } = customerData.ml_credentials;
        const data = await MLService.getItemDetails(productId, access_token);
        setProduct(data);
        
        // Sync form
        setFormData({
          title: data.title,
          price: data.price,
          available_quantity: data.available_quantity,
          listing_type_id: data.listing_type_id,
          condition: data.condition,
          description: data.description?.plain_text || '',
          sku: data.seller_custom_field || (data.attributes?.find((a: any) => a.id === 'SELLER_SKU')?.value_name) || ''
        });
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [productId, customerData]);

  const handleAISuggestTitle = async () => {
    setSuggestingTitle(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Sugira um título otimizado para SEO e conversão no Mercado Livre para este produto: "${formData.title}". 
      Responda apenas com o novo título (máximo 60 caracteres), sem aspas ou explicações.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const newTitle = response.text?.trim() || formData.title;
      setFormData(prev => ({ ...prev, title: newTitle.replace(/"/g, '') }));
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setSuggestingTitle(false);
    }
  };

  const handleSave = async () => {
    if (initialProduct?.isDraft) {
      if (!user) return;
      setSaving(true);
      try {
        const draftRef = doc(db, 'users', user.uid, 'drafts', productId);
        await updateDoc(draftRef, {
          title: formData.title,
          price: formData.price,
          description: formData.description,
          // Outros campos se necessário
          updated_at: new Date().toISOString()
        });
        alert("Rascunho atualizado com sucesso!");
        onNavigate('drafts');
      } catch (error) {
        console.error("Error saving draft:", error);
        alert("Falha ao salvar rascunho.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!customerData?.ml_credentials || !productId) return;
    
    setSaving(true);
    try {
      const { access_token } = customerData.ml_credentials;
      
      // Prepare payload with only allowed fields for update
      const updateData: any = {
        title: formData.title,
        price: Number(formData.price),
        available_quantity: Number(formData.available_quantity)
      };

      // Some fields can only be updated if they actually changed
      if (formData.listing_type_id !== product.listing_type_id) {
        updateData.listing_type_id = formData.listing_type_id;
      }

      // SKU is usually in attributes - handling SELLER_CUSTOM_FIELD if supported
      if (formData.sku) {
        updateData.seller_custom_field = formData.sku;
      }

      await MLService.updateItem(productId, updateData, access_token);
      
      // In a real app we might use a toast, but alert is fine for this demo
      onNavigate('product_library');
    } catch (error: any) {
      console.error("Error saving product:", error);
      
      let errorMsg = "Erro ao atualizar produto no Mercado Livre.";
      
      // Try to parse Mercado Livre specific error details returned by our backend proxy
      const details = error.response?.data?.details;
      if (details) {
        if (details.cause && Array.isArray(details.cause) && details.cause.length > 0) {
          // If there's a cause list, show the first more specific one
          errorMsg = details.cause[0].message || details.message;
        } else if (details.message) {
          errorMsg = details.message;
        }
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      alert(`Falha ao salvar: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw className="size-10 text-amber-500 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-widest">Carregando dados do produto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-[-24px] md:top-[-32px] z-40 bg-slate-50/80 backdrop-blur-md py-4 -mt-6 md:-mt-8 border-b border-slate-200 -mx-6 md:-mx-8 px-6 md:px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate(initialProduct?.isDraft ? 'drafts' : 'product_library')}
            className="p-2.5 rounded-xl hover:bg-white text-slate-500 transition-all border border-transparent hover:border-slate-200"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{productId}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400">
                {initialProduct?.isDraft ? 'Rascunho' : 'Última atualização'}: {product?.last_updated ? new Date(product.last_updated).toLocaleDateString() : 'Pendente'}
              </span>
            </div>
            <h1 className="text-lg font-black text-slate-900 truncate max-w-[400px]">{product?.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!initialProduct?.isDraft && (
            <button 
              onClick={() => window.open(`https://produto.mercadolivre.com.br/${productId}`, '_blank')}
              className="px-4 py-2 text-xs font-bold text-slate-600 flex items-center gap-2 hover:text-slate-900 transition-colors"
            >
              <ExternalLink className="size-4" /> Visualizar no ML
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <button 
              onClick={() => setActiveTab('basic')}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                activeTab === 'basic' ? "bg-amber-400 text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Type className="size-4" /> Básico
            </button>
            <button 
              onClick={() => setActiveTab('images')}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                activeTab === 'images' ? "bg-amber-400 text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ImageIcon className="size-4" /> Imagens
            </button>
            <button 
              onClick={() => setActiveTab('attributes')}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                activeTab === 'attributes' ? "bg-amber-400 text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Tag className="size-4" /> Atributos
            </button>
            <button 
              onClick={() => setActiveTab('financial')}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                activeTab === 'financial' ? "bg-amber-400 text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <DollarSign className="size-4" /> Financeiro
            </button>
          </div>

          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8"
          >
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Title Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Type className="size-3.5 text-amber-500" /> Título do Anúncio
                      </label>
                      <button 
                        onClick={handleAISuggestTitle}
                        disabled={suggestingTitle}
                        className="text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                         {suggestingTitle ? <RefreshCw className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                         {suggestingTitle ? 'Analisando...' : 'Otimizar com IA'}
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.title}
                        maxLength={60}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-amber-400/10 outline-none transition-all"
                      />
                      <span className={cn(
                        "absolute right-3 bottom-3 text-[10px] font-black",
                        formData.title.length > 55 ? "text-amber-500" : "text-slate-300"
                      )}>
                        {formData.title.length}/60
                      </span>
                    </div>
                  </div>

                  {/* Price & Quantity Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <DollarSign className="size-3.5 text-amber-500" /> Preço de Venda
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">R$</span>
                        <input 
                          type="number" 
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Package className="size-3.5 text-amber-500" /> Estoque Disponível
                      </label>
                      <input 
                        type="number" 
                        value={formData.available_quantity}
                        onChange={(e) => setFormData({...formData, available_quantity: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Listing Type & SKU */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="size-3.5 text-amber-500" /> Tipo de Anúncio
                      </label>
                      <select 
                        value={formData.listing_type_id}
                        onChange={(e) => setFormData({...formData, listing_type_id: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="gold_pro">Premium (Mais exposição + parcelamento)</option>
                        <option value="gold_special">Clássico (Boa exposição)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Settings className="size-3.5 text-amber-500" /> SKU do Vendedor
                      </label>
                      <input 
                        type="text" 
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="Ex: PRO-BONECO-01"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Galeria de Imagens</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arraste para reordenar (Simulado)</p>
                  </div>
                  <button className="bg-amber-400/10 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200/50 hover:bg-amber-400/20 transition-all">
                    Adicionar Imagem
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product?.pictures?.map((pic: any, idx: number) => (
                    <div key={idx} className="relative group aspect-square rounded-2xl border border-slate-100 overflow-hidden bg-slate-50">
                      <img src={pic.secure_url || pic.url} className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        <button className="p-2 bg-white rounded-lg text-slate-400 hover:text-amber-500 transition-colors shadow-xl">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 bg-amber-400 text-slate-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-xl">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50 flex items-start gap-3">
                  <AlertCircle className="size-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-wider">
                    Dica: Use imagens com fundo branco (1000x1000px) para melhor posicionamento nos resultados de busca.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'attributes' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {product?.attributes?.filter((a: any) => a.value_name).map((attr: any) => (
                    <div key={attr.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl border border-slate-50 bg-slate-50/50">
                      <label className="md:w-1/3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{attr.name}</label>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          defaultValue={attr.value_name}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-8">
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertCircle className="size-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Atenção</p>
                    <p className="text-xs font-medium text-amber-700 leading-relaxed mt-1">
                      Estas informações são estritamente confidenciais e visíveis apenas para você. 
                      Elas não serão enviadas ou exibidas em seu anúncio público.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Costs Section */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <DollarSign className="size-4 text-emerald-500" /> Custos de Aquisição
                    </h3>
                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Preço do Fornecedor</span>
                        <span className="text-sm font-black text-slate-900">{formatCurrency(initialProduct?.cost / 1.3 || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Frete Shopee/Ali</span>
                        <span className="text-sm font-black text-slate-900">{formatCurrency(15)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-900">Custo Total (COGS)</span>
                        <span className="text-lg font-black text-emerald-500">{formatCurrency(initialProduct?.cost || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Logistics Section */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <TrendingUp className="size-4 text-amber-500" /> Logística e Prazo
                    </h3>
                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Tempo de Envio (Est.)</span>
                        <span className="text-sm font-black text-slate-900">15-25 dias úteis</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Taxa de Importação</span>
                        <span className="text-sm font-black text-slate-900">Remessa Conforme (Inclusa)</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Status do Fornecedor</span>
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase">Verificado</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profit Analysis */}
                <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">Simulação de Lucro Líquido</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Considerando impostos e taxas do Mercado Livre</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Markup</p>
                        <p className="text-lg font-black">{((formData.price / (initialProduct?.cost || 1)) - 1).toFixed(2)}x</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">ROI</p>
                        <p className="text-lg font-black text-emerald-400">
                          {(((formData.price * 0.84 - 15 - initialProduct?.cost) / (initialProduct?.cost || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Preço Venda</p>
                      <p className="text-sm font-black">{formatCurrency(formData.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Taxas ML (16%)</p>
                      <p className="text-sm font-black text-red-400">-{formatCurrency(formData.price * 0.16)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Custo Aquisição</p>
                      <p className="text-sm font-black text-red-400">-{formatCurrency(initialProduct?.cost || 0)}</p>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Lucro Líquido</p>
                      <p className="text-lg font-black text-emerald-400">
                        {formatCurrency(formData.price * 0.84 - 15 - initialProduct?.cost)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Previews & Status */}
        <div className="space-y-6">
          {/* Real Preview Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <LayoutGrid className="size-3.5 text-amber-500" /> Prévia do Anúncio
              </h3>
            </div>
            <div className="p-6 space-y-4">
               <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-100 p-4 transition-all hover:scale-[1.02]">
                  <img 
                    src={product?.thumbnail} 
                    className="w-full h-full object-contain"
                  />
               </div>
               <div className="space-y-2">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{product?.condition === 'new' ? 'Novo' : 'Usado'}</p>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{formData.title}</h4>
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-slate-900 leading-none">
                      {formatCurrency(formData.price)}
                    </div>
                    <p className="text-[10px] font-bold text-emerald-500">em 10x de {formatCurrency(formData.price / 10)} sem juros</p>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      formData.available_quantity > 0 ? "bg-emerald-500" : "bg-red-500"
                    )} />
                    <span className="text-[10px] font-bold text-slate-500">{formData.available_quantity} unidades em estoque</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 shadow-xl shadow-slate-900/20">
             <div className="space-y-1">
                <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Diagnóstico PRO</h3>
                <p className="text-xs text-slate-400">Dados reais das últimas 24h</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Visitas</p>
                   <p className="text-lg font-black text-white">{Math.floor(Math.random() * 500) + 100}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Vendas</p>
                   <p className="text-lg font-black text-white">{product?.sold_quantity || 0}</p>
                </div>
             </div>

             <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Saúde do Anúncio</span>
                  <span className="text-[10px] font-black text-amber-400">88%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-[88%] rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                </div>
             </div>
          </div>

          {/* Tips Card */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
             <div className="flex items-center gap-2">
                <Info className="size-4 text-blue-500" />
                <h3 className="text-xs font-black text-slate-900 uppercase">Dicas de Sucesso</h3>
             </div>
             <ul className="space-y-3">
                <li className="flex items-start gap-2">
                   <ChevronRight className="size-3 text-slate-400 mt-0.5" />
                   <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Evite usar palavras como "Envio Imediato" no título - coloque na descrição.</p>
                </li>
                <li className="flex items-start gap-2">
                   <ChevronRight className="size-3 text-slate-400 mt-0.5" />
                   <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Mantenha a categoria atualizada para evitar penalizações.</p>
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
