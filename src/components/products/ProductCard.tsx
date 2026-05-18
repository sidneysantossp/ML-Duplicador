import React from 'react';
import { 
  Copy, 
  ExternalLink, 
  MoreVertical, 
  MessageSquare, 
  HelpCircle, 
  History,
  Activity,
  Edit2,
  Pause,
  Play,
  Zap,
  Box,
  Truck,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Product } from '../../types';
import { cn, formatCurrency, formatNumber } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect?: () => void;
  onDuplicate: (id: string) => void;
  onEdit: (id: string) => void;
  onAIOptimize: (product: Product) => void;
  onStatusChange?: (status: 'active' | 'paused') => void;
  onDelete?: () => void;
  onNavigate: (id: string, items?: any[]) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  isSelected, 
  onSelect, 
  onDuplicate, 
  onEdit, 
  onAIOptimize,
  onStatusChange,
  onDelete,
  onNavigate
}) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
      case 'paused': return 'bg-orange-500 shadow-[0_0_8px_#f59e0b]';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className={cn(
      "bg-white border rounded-xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group",
      isSelected ? "border-amber-400 ring-2 ring-amber-400/10" : "border-slate-200"
    )}>
      <div className="flex flex-col md:flex-row p-4 gap-6">
        {/* Left: Checkbox and Image */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 transition-all cursor-pointer" 
            />
            {product.id.length < 5 ? (
              <span className="text-[8px] font-black bg-red-500 text-white px-1 rounded">MOCK</span>
            ) : (
              <span className="text-[8px] font-black bg-emerald-500 text-white px-1 rounded">REAL</span>
            )}
          </div>
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
            <img 
              src={product.thumbnail} 
              alt={product.title} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            {product.is_full && (
              <div className="absolute bottom-1 right-1 bg-amber-400 text-slate-900 font-black text-[8px] px-1 rounded flex items-center gap-0.5 shadow-sm uppercase tracking-tighter">
                <Truck className="size-2" /> FULL
              </div>
            )}
          </div>
        </div>

        {/* Center: Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 italic">#{product.sku}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{product.item_id}</span>
            {product.is_catalog && (
              <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">Catálogo</span>
            )}
            {product.variations_count > 0 && (
              <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full border border-purple-100 uppercase tracking-tighter">{product.variations_count} Variações</span>
            )}
          </div>

          <h3 
            onClick={() => onNavigate('product_details', [product])}
            className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-amber-600 transition-colors cursor-pointer"
          >
            {product.title}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 font-sans">Preço</p>
              <p className="text-sm font-black text-slate-900">{formatCurrency(product.price)}</p>
              <p className="text-[9px] font-medium text-slate-400 truncate">{product.listing_type_id === 'gold_pro' ? 'Premium (16,5%)' : 'Clássico (11,5%)'}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 font-sans">Líquido ML</p>
              <p className="text-sm font-black text-emerald-600">{formatCurrency(product.financials.net_profit)}</p>
              <p className="text-[9px] font-medium text-slate-400">Taxa: {formatCurrency(product.financials.sale_fee)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 font-sans">Visitas/Mês</p>
              <p className="text-sm font-black text-slate-900">{formatNumber(product.metrics.visits)}</p>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-blue-500" />
                <span className="text-[9px] font-medium text-slate-500">{product.metrics.conversion_rate}% Conv.</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 font-sans">Qualidade</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-black",
                  product.metrics.health_score > 80 ? "text-emerald-500" : "text-orange-500"
                )}>
                  {product.metrics.health_score}%
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={cn("w-1 h-3 rounded-full", i <= Math.ceil(product.metrics.health_score / 20) ? "bg-emerald-400" : "bg-slate-100")} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-row md:flex-col gap-2 justify-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
          <div className="hidden md:flex flex-col gap-1 items-end mb-auto text-right">
             <div className="flex items-center gap-1.5">
               <span className="text-[10px] font-bold uppercase text-slate-500">{product.status === 'active' ? 'Ativo' : 'Pausado'}</span>
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", getStatusStyle(product.status))} />
             </div>
             <p className="text-[9px] text-slate-400 font-medium">Expira em: Duração ilimitada</p>
          </div>

          <div className="flex md:flex-col gap-2 w-full">
            <button 
              onClick={() => onEdit(product.id)}
              className="flex-1 md:w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all border-b-2 active:translate-y-0.5 active:border-b-0 font-sans"
            >
              <Edit2 className="size-3" /> Modificar
            </button>
            <button 
              onClick={() => onStatusChange?.(product.status === 'active' ? 'paused' : 'active')}
              className={cn(
                "flex-1 md:w-full font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 border border-b-2 transition-all active:translate-y-0.5 active:border-b-0 font-sans",
                product.status === 'active' 
                  ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" 
                  : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
              )}
            >
              {product.status === 'active' ? <Pause className="size-3" /> : <Play className="size-3" />}
              {product.status === 'active' ? 'Pausar' : 'Ativar'}
            </button>
            <button 
              onClick={() => onDuplicate(product.id)}
              className="flex-1 md:w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 border-amber-500 border-b-2 shadow-lg shadow-amber-400/20 transition-all active:translate-y-0.5 active:border-b-0 font-sans"
            >
              <Copy className="size-3" /> Duplicar
            </button>
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex-1 md:w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 border-red-200 border-b-2 transition-all active:translate-y-0.5 active:border-b-0 font-sans"
                title="Excluir Anúncio"
              >
                <Trash2 className="size-3" /> Excluir
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:mt-2">
            <div className="flex gap-1">
              <button 
                onClick={() => onNavigate('product_details', [product])}
                className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-slate-600 transition-colors" 
                title="Ver detalhes"
              >
                <ExternalLink className="size-3.5" />
              </button>
              <button 
                onClick={() => onNavigate('messages', [product])}
                className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-slate-600 transition-colors" 
                title="Mensagens"
              >
                <MessageSquare className="size-3.5" />
              </button>
              <button 
                onClick={() => onNavigate('questions', [product])}
                className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-slate-600 transition-colors" 
                title="Perguntas"
              >
                <HelpCircle className="size-3.5" />
              </button>
              <button 
                onClick={() => onNavigate('history', [product])}
                className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-slate-600 transition-colors" 
                title="Histórico"
              >
                <History className="size-3.5" />
              </button>
              <button 
                onClick={() => onAIOptimize(product)}
                className="p-1.5 hover:bg-amber-50 rounded-md text-amber-500 hover:text-amber-600 transition-colors" 
                title="Otimizar IA"
              >
                <Sparkles className="size-3.5" />
              </button>
            </div>
            <button 
              onClick={() => alert(`Status: Real Data from Mercado Livre\nID: ${product.item_id}\nSKU: ${product.sku}\nVisitas: ${product.metrics.visits}`)}
              className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400"
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
