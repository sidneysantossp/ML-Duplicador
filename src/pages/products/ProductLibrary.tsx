import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  RefreshCw, 
  Download, 
  Plus, 
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Trash2,
  Settings,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Product, ProductFilter } from '../../types';
import { ProductCard } from '../../components/products/ProductCard';
import { AIOptimizerModal } from '../../components/ai/AIOptimizerModal';
import { AIBatchOptimizerModal } from '../../components/ai/AIBatchOptimizerModal';
import { useAuth } from '../../contexts/AuthContext';
import { MLService } from '../../services/mlService';
import { cn } from '../../lib/utils';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    item_id: 'MLB3704770859',
    sku: 'BONECO-ROBLOX-01',
    title: 'Bonecos Roblox Articulado Brinquedo Infantil Mini Personagens Colecionáveis',
    thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_960555-MLB48161556050_112021-O.webp',
    price: 150.00,
    currency_id: 'BRL',
    status: 'active',
    listing_type_id: 'gold_pro',
    shipping_type: 'me2',
    is_catalog: false,
    is_full: true,
    variations_count: 4,
    metrics: {
      visits: 1401,
      sold_quantity: 39,
      conversion_rate: 2.38,
      health_score: 95,
      risk_score: 2,
    },
    financials: {
      sale_fee: 24.75,
      shipping_cost: 20.50,
      net_profit: 100.55,
    },
    updated_at: '2026-01-23T10:00:00Z',
  },
  {
    id: '2',
    item_id: 'MLB4716749608',
    sku: 'LEGO-NINJA-02',
    title: 'Bonecos De Montar Tipo Lego Roblox Ninja Humanoides 8 Pikach',
    thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_608102-MLU72688081604_112023-O.webp',
    price: 129.90,
    currency_id: 'BRL',
    status: 'active',
    listing_type_id: 'gold_pro',
    shipping_type: 'me2',
    is_catalog: true,
    is_full: false,
    variations_count: 0,
    metrics: {
      visits: 2634,
      sold_quantity: 48,
      conversion_rate: 2.42,
      health_score: 88,
      risk_score: 5,
    },
    financials: {
      sale_fee: 21.43,
      shipping_cost: 15.00,
      net_profit: 83.77,
    },
    updated_at: '2026-01-23T11:30:00Z',
  },
  {
    id: '3',
    item_id: 'MLB2847291044',
    sku: 'MOTO-CONTROLE-01',
    title: 'Moto Controle Remoto Alta Velocidade Acrobacia Recarregável',
    thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_983151-MLB50181556050_112021-O.webp',
    price: 89.90,
    currency_id: 'BRL',
    status: 'paused',
    listing_type_id: 'gold_special',
    shipping_type: 'fulfillment',
    is_catalog: false,
    is_full: true,
    variations_count: 2,
    metrics: {
      visits: 850,
      sold_quantity: 12,
      conversion_rate: 1.41,
      health_score: 72,
      risk_score: 10,
    },
    financials: {
      sale_fee: 10.34,
      shipping_cost: 0,
      net_profit: 79.56,
    },
    updated_at: '2026-01-22T15:20:00Z',
  }
];

interface ProductLibraryProps {
  onNavigate: (id: string, items?: any[]) => void;
}

export const ProductLibrary: React.FC<ProductLibraryProps> = ({ onNavigate }) => {
  const { customerData, refreshMLToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<'all' | 'active' | 'paused'>('all');
  const [counts, setCounts] = useState({ all: 0, active: 0, paused: 0 });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<ProductFilter>({
    search: '',
    status: 'all',
    listing_type: 'all',
    shipping: 'all'
  });

  const [refreshAttempted, setRefreshAttempted] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);

  const fetchRealProducts = async (
    statusOverride?: string, 
    newPage?: number, 
    query?: string,
    credsOverride?: any
  ): Promise<any> => {
    const credentials = credsOverride || customerData?.ml_credentials;
    if (!credentials) return;
    
    setLoading(true);
    setAuthError(null);
    try {
      const { access_token, user_id } = credentials;
      const statusToFetch = statusOverride || currentTab;
      const targetPage = newPage !== undefined ? newPage : page;
      const targetQuery = query !== undefined ? query : filters.search;
      
      const searchData = await MLService.getProducts(
        access_token, 
        user_id, 
        statusToFetch, 
        targetQuery, 
        targetPage * pageSize, 
        pageSize
      );
      
      const itemIds = searchData.results || [];
      console.log(`[Sync] Found ${itemIds.length} item IDs in search results.`);
      const total = searchData.paging?.total || 0;

      // Update counts for the tabs
      if (statusToFetch === 'all') {
         setCounts(prev => ({ ...prev, all: total }));
      } else if (statusToFetch === 'active') {
         setCounts(prev => ({ ...prev, active: total }));
      } else if (statusToFetch === 'paused') {
         setCounts(prev => ({ ...prev, paused: total }));
      }

      // If we don't have all counts, fetch them once
      if (counts.all === 0 || counts.active === 0 || counts.paused === 0) {
        const [allRes, activeRes, pausedRes] = await Promise.all([
          MLService.getProducts(access_token, user_id, 'all', '', 0, 1),
          MLService.getProducts(access_token, user_id, 'active', '', 0, 1),
          MLService.getProducts(access_token, user_id, 'paused', '', 0, 1)
        ]);
        setCounts({
          all: allRes.paging?.total || 0,
          active: activeRes.paging?.total || 0,
          paused: pausedRes.paging?.total || 0
        });
      }
      
      // Fetch details using Multiget API
      const batchResults = itemIds.length > 0 
        ? await MLService.getItems(itemIds, access_token) 
        : [];
      
      const results = batchResults
        .filter((r: any) => r.code === 200)
        .map((r: any) => r.body);
      
      console.log(`[Sync] Successfully fetched details for ${results.length} out of ${itemIds.length} items.`);
      
      if (itemIds.length > 0 && results.length === 0) {
        setAuthError("Não foi possível carregar os detalhes dos anúncios. Verifique suas permissões do Mercado Livre.");
      }
      
      const converted = results
        .filter(r => r !== null)
        .map(item => ({
          id: item.id,
          item_id: item.id,
          sku: item.seller_custom_field || (item.attributes?.find((a: any) => a.id === 'SELLER_SKU')?.value_name) || item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          price: item.price,
          currency_id: item.currency_id,
          status: item.status as any,
          listing_type_id: item.listing_type_id as any,
          shipping_type: item.shipping?.mode as any,
          is_catalog: item.catalog_listing || false,
          is_full: item.shipping?.tags?.includes('fulfillment') || false,
          variations_count: item.variations?.length || 0,
          metrics: {
            visits: Math.floor(Math.random() * 1000) + 50, // Needs individual metrics API
            sold_quantity: item.sold_quantity || 0,
            conversion_rate: Number((Math.random() * 5).toFixed(2)),
            health_score: Math.floor(Math.random() * 30) + 70,
            risk_score: 1,
          },
          financials: {
            sale_fee: item.price * 0.165, // Estimated
            shipping_cost: 0,
            net_profit: item.price * 0.7, // Simplified estimate
            },
          updated_at: item.last_updated,
        }));

      setProducts(converted);
      setRefreshAttempted(false);
    } catch (error: any) {
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data;
      console.error(`Error fetching real products (Status: ${status}):`, details || error.message);
      
      if (status === 403) {
        setAuthError("Erro 403: Acesso negado. Certifique-se que seu App do Mercado Livre tem as permissões 'read' e 'write' ativas.");
      } else if (status === 401) {
        setAuthError("Erro 401: Sessão expirada. Tentando renovar...");
      } else {
        setAuthError(`Erro ao buscar produtos: ${error.message}`);
      }

      if ((status === 401 || status === 403) && !refreshAttempted) {
        console.log("Token expired or forbidden, attempting refresh...");
        setRefreshAttempted(true);
        await refreshMLToken();
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRealProducts();
  }, [customerData?.ml_credentials]);

  const handleTabChange = (tab: 'all' | 'active' | 'paused') => {
    setCurrentTab(tab);
    setPage(0);
    fetchRealProducts(tab, 0);
  };

  const handleSearchChange = (val: string) => {
    setFilters(prev => ({ ...prev, search: val }));
    setPage(0);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Real-time search with a simple check to avoid too many requests
    if (val.length === 0 || val.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchRealProducts(undefined, 0, val);
      }, 500);
    }
  };

  const searchTimeoutRef = React.useRef<any>(null);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRealProducts(undefined, newPage);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchPause = async () => {
    if (!customerData?.ml_credentials || selectedIds.length === 0) return;
    
    if (!confirm(`Deseja pausar ${selectedIds.length} anúncios?`)) return;

    setLoading(true);
    try {
      const { access_token } = customerData.ml_credentials;
      await Promise.all(selectedIds.map(id => 
        MLService.updateItem(id, { status: 'paused' }, access_token)
      ));
      alert("Anúncios pausados com sucesso!");
      fetchRealProducts();
      setSelectedIds([]);
    } catch (error) {
      console.error("Erro ao pausar em lote:", error);
      alert("Houve um erro em algumas atualizações.");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchActivate = async () => {
    if (!customerData?.ml_credentials || selectedIds.length === 0) return;
    
    setLoading(true);
    try {
      const { access_token } = customerData.ml_credentials;
      await Promise.all(selectedIds.map(id => 
        MLService.updateItem(id, { status: 'active' }, access_token)
      ));
      alert("Anúncios ativados com sucesso!");
      fetchRealProducts();
      setSelectedIds([]);
    } catch (error) {
      console.error("Erro ao ativar em lote:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPriceChange = async () => {
    const percentage = prompt("Aumentar/Diminuir preço em % (+10 para aumentar 10%, -5 para diminuir 5%)");
    if (!percentage || !customerData?.ml_credentials) return;

    const factor = 1 + (parseFloat(percentage) / 100);
    setLoading(true);
    try {
      const { access_token } = customerData.ml_credentials;
      const selectedProducts = products.filter(p => selectedIds.includes(p.id));
      
      await Promise.all(selectedProducts.map(p => 
        MLService.updateItem(p.id, { price: Number((p.price * factor).toFixed(2)) }, access_token)
      ));
      
      alert("Preços atualizados com sucesso!");
      fetchRealProducts();
      setSelectedIds([]);
    } catch (error) {
      console.error("Erro ao mudar preços:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!customerData?.ml_credentials || selectedIds.length === 0) return;
    
    if (!confirm(`Deseja EXCLUIR (fechar/finalizar) ${selectedIds.length} anúncios? Esta ação não pode ser desfeita.`)) return;
    
    alert(`Iniciando exclusão de ${selectedIds.length} itens. Por favor, aguarde...`);
    setLoading(true);
    try {
      const { access_token } = customerData.ml_credentials;
      
      const results = await Promise.allSettled(selectedIds.map(async (id) => {
        try {
          // Status transition: active -> paused -> closed -> deleted
          await MLService.updateItem(id, { status: 'closed' }, access_token);
          try {
            await MLService.updateItem(id, { status: 'deleted' }, access_token);
          } catch (e) {
            console.log(`Item ${id} closed but not deleted.`);
          }
          return id;
        } catch (e: any) {
          try {
            await MLService.updateItem(id, { status: 'deleted' }, access_token);
            return id;
          } catch (delErr) {
            throw e;
          }
        }
      }));
      
      const successes = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value);
      const failures = results.filter(r => r.status === 'rejected').length;

      // Update local state to remove successes
      if (successes.length > 0) {
        setProducts(prev => prev.filter(p => !successes.includes(p.id)));
      }

      if (failures === 0) {
        alert(`${successes.length} anúncios excluídos/finalizados com sucesso!`);
      } else {
        alert(`${successes.length} sucessos e ${failures} falhas. Nota: Itens com vendas não podem ser excluídos, apenas finalizados.`);
      }
      
      // Still fetch to be sure
      fetchRealProducts();
      setSelectedIds([]);
    } catch (error) {
      console.error("Erro ao excluir em lote:", error);
      alert("Erro ao processar exclusões.");
    } finally {
      setLoading(false);
    }
  };

  const [optimizingProduct, setOptimizingProduct] = useState<Product | null>(null);
  const [batchOptimizingProducts, setBatchOptimizingProducts] = useState<Product[] | null>(null);

  const handleSingleDelete = async (product: Product) => {
    if (!customerData?.ml_credentials) return;
    if (!confirm(`Deseja EXCLUIR o anúncio: "${product.title}"? Esta ação é definitiva.`)) return;
    
    setLoading(true);
    try {
      const { access_token } = customerData.ml_credentials;
      console.log(`[Delete] Attempting to close/delete item ${product.id}`);
      
      let closed = false;
      try {
        // Try close
        await MLService.updateItem(product.id, { status: 'closed' }, access_token);
        closed = true;
        console.log(`[Delete] Item ${product.id} closed.`);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message;
        console.warn(`[Delete] Could not close item ${product.id}:`, errorMsg);
        // If it was already closed, we can still try to delete
        if (errorMsg?.includes('already closed') || e.response?.status === 400) {
          closed = true;
        }
      }

      if (closed) {
        try {
          await MLService.updateItem(product.id, { status: 'deleted' }, access_token);
          console.log(`[Delete] Item ${product.id} deleted.`);
          alert("Anúncio excluído com sucesso!");
        } catch (e: any) {
          console.warn(`[Delete] Item ${product.id} could not be deleted (likely has sales):`, e.response?.data?.message || e.message);
          alert("O anúncio foi FINALIZADO (closed), mas não pôde ser excluído totalmente porque possui vendas ou registros históricos.");
        }
      } else {
        throw new Error("Não foi possível fechar o anúncio.");
      }

      setProducts(prev => prev.filter(p => p.id !== product.id));
      // fetchRealProducts(); // No need to fetch if we already filtered
    } catch (error: any) {
      console.error("Erro ao excluir anúncio:", error);
      alert("Falha ao excluir anúncio no Mercado Livre: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyOptimization = (title: string, description: string) => {
    if (!optimizingProduct) return;
    
    // Update local state temporarily
    setProducts(prev => prev.map(p => 
      p.id === optimizingProduct.id 
        ? { ...p, title, description_text: description } // Assuming we have some way to track this
        : p
    ));
    
    setOptimizingProduct(null);
    alert('Otimização IA aplicada temporariamente. Clique em Sincronizar para reverter ou Duplicar para usar.');
  };

  const handleApplyBatchOptimization = (optimizations: { productId: string; title: string; description: string }[]) => {
    // Update local state with optimizations
    setProducts(prev => prev.map(p => {
      const opt = optimizations.find(o => o.productId === p.id);
      if (opt) {
        return { ...p, title: opt.title, description_text: opt.description };
      }
      return p;
    }));
    
    // Auto-navigate to duplication wizard with the optimized products
    const optimizedProducts = products
      .filter(p => optimizations.some(o => o.productId === p.id))
      .map(p => {
        const opt = optimizations.find(o => o.productId === p.id);
        return { ...p, title: opt?.title || p.title };
      });

    if (confirm(`Deseja ir para o Assistente de Duplicação com os ${optimizations.length} anúncios otimizados?`)) {
      onNavigate('duplication_wizard', optimizedProducts);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ListIcon className="size-6 text-amber-500" />
            Biblioteca de Anúncios
          </h1>
          <p className="text-slate-500 text-sm font-medium">Gerencie e publique seu catálogo de forma automatizada.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchRealProducts}
            disabled={loading}
            className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all border-b-4 border-slate-700 active:translate-y-1 active:border-b-0 disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> {loading ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
          <button 
            onClick={() => onNavigate('duplication_wizard')}
            className="bg-amber-400 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-extra-bold flex items-center gap-2 hover:bg-amber-500 transition-all border-b-4 border-amber-600 active:translate-y-1 active:border-b-0"
          >
            <Plus className="size-4" /> Novo Anúncio
          </button>
        </div>
      </div>
      
      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
           <AlertCircle className="size-5" />
           <p className="text-sm font-bold">{authError}</p>
           <button 
             onClick={() => fetchRealProducts()}
             className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-black transition-colors"
           >
             TENTAR NOVAMENTE
           </button>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[-24px] md:top-[-32px] z-30">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar por título, SKU, ID do item ou categoria..."
              className="w-full bg-slate-50 border-slate-200 border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all outline-none font-bold text-slate-700"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Filter Group */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 font-sans">
              <button 
                onClick={() => handleTabChange('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  currentTab === 'all' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Todos ({counts.all})
              </button>
              <button 
                onClick={() => handleTabChange('active')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  currentTab === 'active' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Ativos ({counts.active})
              </button>
              <button 
                onClick={() => handleTabChange('paused')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  currentTab === 'paused' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Pausados ({counts.paused})
              </button>
            </div>

            <div className="relative group">
              <button className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-all font-sans">
                <Filter className="size-3" /> Filtros Avançados
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipo de Anúncio</label>
                    <select 
                      value={filters.listing_type}
                      onChange={(e) => setFilters({...filters, listing_type: e.target.value as any})}
                      className="w-full text-[10px] p-1.5 bg-slate-50 border border-slate-100 rounded-lg outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="gold_pro">Premium</option>
                      <option value="gold_special">Clássico</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Envio</label>
                    <select 
                      value={filters.shipping}
                      onChange={(e) => setFilters({...filters, shipping: e.target.value as any})}
                      className="w-full text-[10px] p-1.5 bg-slate-50 border border-slate-100 rounded-lg outline-none"
                    >
                      <option value="all">Todos</option>
                      <option value="me2">Mercado Envios</option>
                      <option value="fulfillment">FULL</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-100 mx-1" />

            <button 
              onClick={() => alert("Exportando catálogo selecionado para CSV...")}
              className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
              title="Exportar CSV"
            >
              <Download className="size-4" />
            </button>
            
            <button 
              onClick={() => onNavigate('settings')}
              className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
              title="Configurações"
            >
              <Settings className="size-4" />
            </button>
          </div>
        </div>

        {/* Mass Action Bar (Shown when items selected - Mocked always for demo) */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedIds.length > 0 && selectedIds.length === products.length}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 transition-all cursor-pointer" 
              />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 font-sans">Selecionar Tudo</span>
            </label>
            
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 p-1 rounded-lg border border-amber-100 animate-in fade-in slide-in-from-left-2 duration-300">
                <button 
                  onClick={handleBatchPause}
                  className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-amber-700 hover:bg-amber-100 transition-colors font-sans"
                >
                  Pausar Lote
                </button>
                <button 
                  onClick={handleBatchActivate}
                  className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-amber-700 hover:bg-amber-100 transition-colors font-sans"
                >
                  Ativar Lote
                </button>
                <button 
                  onClick={handleBatchPriceChange}
                  className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-amber-700 hover:bg-amber-100 transition-colors font-sans"
                >
                  Mudar Preço
                </button>
                <button 
                  onClick={() => setBatchOptimizingProducts(products.filter(p => selectedIds.includes(p.id)))}
                  className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm font-sans flex items-center gap-1.5"
                >
                  <Zap className="size-3 fill-white" /> Otimizar IA
                </button>
                <button 
                  onClick={() => onNavigate('duplication_wizard', products.filter(p => selectedIds.includes(p.id)))}
                  className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-amber-700 hover:bg-amber-100 transition-colors bg-white shadow-sm border border-amber-200/50 font-sans"
                >
                  Duplicar Lote
                </button>
                <button 
                  onClick={handleBatchDelete}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white bg-red-600 hover:bg-red-700 transition-all font-sans flex items-center gap-2 shadow-lg shadow-red-500/20"
                  title="Excluir Lote"
                >
                  <Trash2 className="size-4 animate-pulse" /> Excluir Lote
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
            <span className="flex items-center gap-1"><ArrowUpDown className="size-3" /> Ordenar por: Recentes</span>
            <span>Exibindo 1-{products.length} de {counts[currentTab]}</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-slate-100 rounded bg-white border border-slate-200"><ListIcon className="size-3" /></button>
              <button className="p-1 hover:bg-slate-100 rounded text-slate-300 opacity-50"><LayoutGrid className="size-3" /></button>
            </div>
          </div>
        </div>
      </div>

          {/* Main Listing */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="size-8 text-amber-500 animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse">Buscando seus anúncios reais...</p>
          </div>
        ) : products.length > 0 ? (
          products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isSelected={selectedIds.includes(product.id)}
              onSelect={() => handleSelectProduct(product.id)}
              onDuplicate={(id) => onNavigate('duplication_wizard', [product])}
              onEdit={(id) => onNavigate('product_editor', [product])}
              onAIOptimize={setOptimizingProduct}
              onDelete={() => handleSingleDelete(product)}
              onNavigate={onNavigate}
              onStatusChange={async (newStatus) => {
                if (!customerData?.ml_credentials) return;
                setLoading(true);
                try {
                  await MLService.updateItem(product.id, { status: newStatus }, customerData.ml_credentials.access_token);
                  fetchRealProducts();
                } catch (error) {
                  console.error("Erro ao mudar status:", error);
                } finally {
                  setLoading(false);
                }
              }}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center space-y-4">
             <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="size-8 text-slate-300" />
             </div>
             <p className="text-slate-500 font-medium">Nenhum anúncio encontrado. Conecte sua conta ou verifique os filtros.</p>
          </div>
        )}

        {/* Pagination Section */}
        {!loading && counts[currentTab] > pageSize && (
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 mt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, counts[currentTab])} de {counts[currentTab]}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.ceil(counts[currentTab] / pageSize) }).map((_, i) => {
                  // Only show first, last, and pages around current
                  if (i === 0 || i === Math.ceil(counts[currentTab] / pageSize) - 1 || Math.abs(i - page) <= 1) {
                    return (
                      <button 
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                          page === i ? "bg-amber-400 text-slate-900" : "hover:bg-slate-50 text-slate-500"
                        )}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                  if (i === 1 || i === Math.ceil(counts[currentTab] / pageSize) - 2) {
                    return <span key={i} className="text-slate-300">...</span>;
                  }
                  return null;
                })}
              </div>
              <button 
                onClick={() => handlePageChange(page + 1)}
                disabled={(page + 1) * pageSize >= counts[currentTab]}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* AI Optimizer Modal */}
        <AIOptimizerModal 
          isOpen={!!optimizingProduct}
          onClose={() => setOptimizingProduct(null)}
          productTitle={optimizingProduct?.title || ''}
          productDescription="Descrição original do Mercado Livre (simulada)."
          onApply={handleApplyOptimization}
        />

        {/* AI Batch Optimizer Modal */}
        <AIBatchOptimizerModal 
          isOpen={!!batchOptimizingProducts}
          onClose={() => setBatchOptimizingProducts(null)}
          selectedProducts={batchOptimizingProducts || []}
          onApplyAll={handleApplyBatchOptimization}
          accessToken={customerData?.ml_credentials?.access_token}
        />
      </div>

      {/* Floating Info (Optional Design Element) */}
      <div className="fixed bottom-24 right-10 z-20">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-800 backdrop-blur-sm bg-slate-900/90 max-w-[320px]">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce shadow-lg shadow-amber-400/20">
            <Zap className="size-5 text-slate-900 fill-slate-900" />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5 whitespace-nowrap">IA INSIGHT DISPONÍVEL</p>
            <p className="text-[11px] text-slate-300 leading-snug">Você tem <span className="text-white font-bold">14 anúncios</span> com títulos que podem ser otimizados agora.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
