import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  ExternalLink, 
  Package, 
  User, 
  ChevronRight,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MLService } from '../../services/mlService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface Order {
  id: number;
  status: string;
  date_created: string;
  total_amount: number;
  currency_id: string;
  buyer: {
    nickname: string;
    first_name?: string;
    last_name?: string;
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
    };
    quantity: number;
    unit_price: number;
  }>;
}

interface OrdersPageProps {
  onNavigate?: (id: string, items?: any[]) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const { customerData, refreshMLToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'paid' | 'cancelled'>('all');
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [refreshAttempted, setRefreshAttempted] = useState(false);

  const fetchOrders = async (isManual: boolean = false): Promise<any> => {
    if (!customerData?.ml_credentials) {
      setLoading(false);
      return;
    }

    if (isManual) setLoading(true);
    setAuthError(false);
    try {
      const { access_token, user_id } = customerData.ml_credentials;
      const data = await MLService.getOrders(user_id, access_token);
      setOrders(data.results || []);
      setRefreshAttempted(false);
      if (isManual) {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (error: any) {
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data;
      console.error(`Error fetching orders (Status: ${status}):`, details || error.message);
      
      const { user_id } = customerData.ml_credentials;
      if ((status === 401 || status === 403) && !refreshAttempted) {
        console.log("Token expired or forbidden, attempting refresh...");
        setRefreshAttempted(true);
        const refreshed = await refreshMLToken();
        if (refreshed) {
           // Retry once with new token
           const { access_token: newTask } = customerData.ml_credentials;
           try {
             const retryData = await MLService.getOrders(user_id, newTask);
             setOrders(retryData.results || []);
           } catch {
             setAuthError(true);
           }
        } else {
          setAuthError(true);
        }
      } else if (status === 403) {
        setAuthError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [customerData?.ml_credentials?.access_token]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) || 
      order.buyer.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some(item => item.item.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'paid') return matchesSearch && order.status === 'paid';
    if (activeFilter === 'cancelled') return matchesSearch && order.status === 'cancelled';
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="size-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Pago</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="size-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Cancelado</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="size-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">{status}</span>
          </div>
        );
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-500">
            <ShoppingCart className="size-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operations</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Vendas e Pedidos</h1>
          <p className="text-slate-500 text-sm font-medium">Gerencie suas vendas do Mercado Livre em tempo real.</p>
        </div>
        
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          {(['all', 'paid', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeFilter === f 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagos' : 'Cancelados'}
            </button>
          ))}
        </div>

        <button 
          onClick={() => fetchOrders(true)}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Sincronizar Pedidos
        </button>
      </div>

      {syncSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3"
        >
          <CheckCircle2 className="size-5 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest">Sincronização concluída com sucesso!</p>
        </motion.div>
      )}

      {authError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-800">Acesso Restrito (403)</p>
              <p className="text-xs text-red-600">Sua conta do Mercado Livre recusou o acesso aos pedidos. Certifique-se de que "Orders" está habilitado no seu App do Mercado Livre e que as permissões foram aceitas corretamente.</p>
            </div>
          </div>
          <button 
            onClick={() => fetchOrders()}
            className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID, Comprador ou Produto..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-white hover:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 transition-all">
              <Calendar className="size-3.5" /> Últimos 30 dias
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="size-8 text-amber-500 animate-spin" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <ShoppingCart className="size-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 text-left">
                  <th className="px-6 py-4">ID Pedido / Data</th>
                  <th className="px-6 py-4">Comprador</th>
                  <th className="px-6 py-4">Produtos</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode='popLayout'>
                  {filteredOrders.map((order) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={order.id} 
                      onClick={() => onNavigate?.('order_details', [order.id.toString()])}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{order.id}</span>
                          <span className="text-xs font-bold text-slate-700">
                            {new Date(order.date_created).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 group-hover:border-amber-400/30 transition-all">
                            <User className="size-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 tracking-tight">{order.buyer.nickname}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Premium User</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {order.order_items.map((item, idx) => (
                            <div key={idx} className="flex flex-col">
                              <p className="text-sm font-bold text-slate-700 line-clamp-1 max-w-xs">{item.item.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">Qtd: {item.quantity}</span>
                                <span className="text-[10px] text-slate-400 font-medium">SKU: {item.item.id}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 tracking-tight">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.currency_id }).format(order.total_amount)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liquid Amount</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          {getStatusBadge(order.status)}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Exibindo {filteredOrders.length} de {orders.length} pedidos
          </p>
          <div className="flex items-center gap-2">
            <button disabled className="p-1 px-3 rounded border border-slate-200 text-[10px] font-bold text-slate-400 opacity-50">Anterior</button>
            <button disabled className="p-1 px-3 rounded border border-slate-200 text-[10px] font-bold text-slate-400 opacity-50">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
};
