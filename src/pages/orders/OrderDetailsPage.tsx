import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  MapPin, 
  MessageSquare, 
  Printer, 
  ExternalLink, 
  Loader2,
  Send,
  User,
  ShoppingBag,
  CreditCard,
  Target,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MLService } from '../../services/mlService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface OrderDetailsPageProps {
  orderId: string;
  onBack: () => void;
}

export const OrderDetailsPage: React.FC<OrderDetailsPageProps> = ({ orderId, onBack }) => {
  const { customerData, refreshMLToken } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [labelLoading, setLabelLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [authError, setAuthError] = useState(false);

  const fetchData = async (): Promise<any> => {
    if (!customerData?.ml_credentials || !orderId) return;
    
    setLoading(true);
    setAuthError(false);
    try {
      const { access_token, user_id } = customerData.ml_credentials;
      
      // Fetch Order Details
      let orderData;
      try {
        orderData = await MLService.getOrderDetails(orderId, access_token);
        setOrder(orderData);
      } catch (e: any) {
        if (e?.response?.status === 403 || e?.response?.status === 401) {
           console.log("Order access forbidden, trying refresh...");
           const refreshed = await refreshMLToken();
           if (refreshed) {
             orderData = await MLService.getOrderDetails(orderId, refreshed.access_token);
             setOrder(orderData);
           } else {
             setAuthError(true);
             throw e;
           }
        } else {
          throw e;
        }
      }
      
      // Fetch Shipment Details if available
      if (orderData?.shipping?.id) {
        try {
          const shipData = await MLService.getShipmentDetails(orderData.shipping.id, access_token);
          setShipment(shipData);
        } catch (e) {
          console.error("Error fetching shipment:", e);
        }
      }
      
      // Fetch Messages
      try {
        const msgData = await MLService.getMessages(orderId, access_token, user_id);
        setMessages(msgData.results || []);
      } catch (e) {
        console.error("Error fetching messages:", e);
      }
      
    } catch (error: any) {
      const status = error.response?.status;
      const details = error.response?.data?.details || error.response?.data;
      console.error(`Error fetching order details (Status: ${status}):`, details || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerData?.ml_credentials?.access_token, orderId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !customerData?.ml_credentials || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { access_token, user_id } = customerData.ml_credentials;
      const buyerId = order.buyer.id;
      
      await MLService.sendMessage(orderId, access_token, user_id, buyerId, newMessage);
      
      // Update messages locally
      const newMsg = {
        from: { user_id: user_id, name: 'Você' },
        text: newMessage,
        date_created: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Erro ao enviar mensagem. Verifique se o chat está disponível para este pedido.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!shipment?.id || !customerData?.ml_credentials) return;
    
    setLabelLoading(true);
    try {
      const { access_token } = customerData.ml_credentials;
      const labelData = await MLService.getShipmentLabel(shipment.id, access_token);
      
      if (labelData.url) {
        window.open(labelData.url, '_blank');
      } else {
        alert("Etiqueta não disponível no momento.");
      }
    } catch (error) {
      console.error("Error getting label:", error);
      alert("Erro ao buscar etiqueta.");
    } finally {
      setLabelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 text-amber-500 animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando Dados do Pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Pedido não encontrado</h2>
        <button onClick={onBack} className="text-amber-500 font-bold hover:underline">Voltar para a lista</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:text-amber-500 transition-all shadow-sm group"
          >
            <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Management</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase">MELI #{orderId}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Detalhes do Pedido</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrintLabel}
            disabled={!shipment || labelLoading}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {labelLoading ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            IMPRIMIR ETIQUETA
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border-2 border-slate-900 rounded-xl text-xs font-black text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
            <Target className="size-4" />
            MARCAR COMO ENTREGUE
          </button>
        </div>
      </div>

      {authError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-800">Acesso Restrito (403)</p>
              <p className="text-xs text-red-600">Sua conta do Mercado Livre recusou o acesso aos detalhes do pedido. Certifique-se de que "Orders" está habilitado no seu App do Mercado Livre e que as permissões foram aceitas corretamente.</p>
            </div>
          </div>
          <button 
            onClick={() => fetchData()} 
            className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all font-bold"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Infos */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Order Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-600">Resumo da Venda</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">STATUS: {order.status.toUpperCase()}</span>
            </div>
            <div className="p-6 space-y-6">
              {order.order_items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="size-20 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0">
                    <Package className="size-8 text-slate-300" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-slate-900 leading-tight">{item.item.title}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>SKU: {item.item.id}</span>
                      <span>Qtd: {item.quantity}</span>
                    </div>
                    <p className="text-lg font-black text-amber-500 mt-2">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.currency_id }).format(item.unit_price)}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Líquido</p>
                  <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.currency_id }).format(order.total_amount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(order.date_created).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frete</p>
                  <p className="text-sm font-bold text-emerald-500 uppercase">Grátis</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buyer Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="size-4 text-blue-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-600">Comprador</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 font-black text-lg shadow-inner">
                  {order.buyer.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-900 tracking-tight">{order.buyer.nickname}</p>
                  <p className="text-xs font-bold text-slate-500">{order.buyer.first_name} {order.buyer.last_name}</p>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ID do Usuário</span>
                  <span className="font-bold text-slate-600">{order.buyer.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Reputação</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded font-black uppercase text-[8px]">Comprador Freqüente</span>
                </div>
              </div>
            </div>

            {/* Shipment Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="size-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-600">Logística e Entrega</span>
              </div>
              {shipment ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-black uppercase">
                      {shipment.status === 'shipped' ? 'Em Trânsito' : shipment.status === 'delivered' ? 'Entregue' : shipment.status}
                    </div>
                    <span className="text-xs font-bold text-slate-500">ML129384756BR</span>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="size-4 text-slate-300 shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {shipment.receiver_address?.street_name}, {shipment.receiver_address?.street_number}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">
                        {shipment.receiver_address?.city.name}, {shipment.receiver_address?.state.name}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400 font-bold">Aguardando dados de despacho...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className="flex flex-col h-[700px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">Chat com Cliente</span>
            </div>
            <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="size-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="size-8 text-slate-200" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma mensagem ainda.<br />Inicie a conversa abaixo.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.from.user_id === customerData?.ml_credentials?.user_id;
                return (
                  <div key={idx} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                      isMe 
                        ? "bg-slate-900 text-white rounded-tr-none" 
                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase mt-1 px-1">
                      {isMe ? 'VOCÊ' : order.buyer.nickname} • {new Date(msg.date_created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Digite sua mensagem aqui..."
                className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sendingMessage}
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {sendingMessage ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 text-center">
              Pressione ENTER para enviar sua mensagem
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
