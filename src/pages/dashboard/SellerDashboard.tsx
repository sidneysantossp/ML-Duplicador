import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  ShoppingCart, 
  CreditCard, 
  Package, 
  TrendingUp, 
  Zap,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Info,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MLService } from '../../services/mlService';
import { AITitleSuggester } from '../../components/ai/AITitleSuggester';
import { cn, formatCurrency, formatNumber } from '../../lib/utils';

const orderData = [
  { day: '02', current: 12, previous: 8 },
  { day: '04', current: 15, previous: 12 },
  { day: '06', current: 18, previous: 20 },
  { day: '08', current: 14, previous: 16 },
  { day: '10', current: 25, previous: 14 },
  { day: '12', current: 32, previous: 18 },
  { day: '14', current: 14, previous: 16 },
  { day: '16', current: 28, previous: 15 },
  { day: '18', current: 22, previous: 19 },
  { day: '20', current: 30, previous: 25 },
];

const revenueData = [
  { month: 'Jan', value: 1200 },
  { month: 'Feb', value: 1800 },
  { month: 'Mar', value: 1500 },
  { month: 'Apr', value: 2400 },
  { month: 'May', value: 3842.50 },
];

const StatCard = ({ icon: Icon, label, value, subtext, color }: any) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity", color)} />
    <div className="flex items-start justify-between">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</span>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <div className={cn("p-2.5 rounded-lg", color.replace('bg-', 'bg-opacity-10 bg-'))}>
        <Icon className={cn("size-5", color.replace('bg-', 'text-'))} />
      </div>
    </div>
    <div className="flex items-center gap-1.5 mt-auto">
      <span className="text-[11px] font-medium text-slate-400">{subtext}</span>
      <ChevronRight className="size-3 text-slate-300 ml-auto group-hover:text-amber-500 transition-colors" />
    </div>
  </div>
);

export const SellerDashboard: React.FC = () => {
  const { user, customerData, refreshMLToken } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [realStats, setRealStats] = useState({
    orders_count: 0,
    revenue: 0,
    products_count: 0,
    messages_count: 0
  });

  const [refreshAttempted, setRefreshAttempted] = React.useState(false);
  const [authError, setAuthError] = React.useState(false);

  // Fetch real data on mount if ML is connected
  React.useEffect(() => {
    const fetchRealData = async () => {
      if (!customerData?.ml_credentials) {
        setLoadingRealData(false);
        return;
      }
      
      setLoadingRealData(true);
      try {
        const { access_token, user_id } = customerData.ml_credentials;
        console.log(`Buscando dados para o Seller ID: ${user_id}`);
        
        // Fetch real data sequentially or catch individual failures
        let productData = null;
        let orderDataRes = null;

        try {
          productData = await MLService.getProducts(access_token, user_id);
        } catch (e) {
          console.error("Erro ao buscar produtos:", e);
        }

        try {
          orderDataRes = await MLService.getOrders(user_id, access_token);
        } catch (e: any) {
          const statusCode = e?.response?.status || 500;
          const errorPayload = e?.response?.data;
          const isHtml = typeof errorPayload === 'string' && errorPayload.includes('<html>');
          console.error(`[Dashboard] Erro ao buscar pedidos (${statusCode}):`, isHtml ? "[HTML 403 Forbidden - Likely WAF Block]" : errorPayload || e.message);
          
          if (statusCode === 403 || statusCode === 401) {
            setAuthError(true);
          }
        }

        setRealStats({
          orders_count: orderDataRes?.paging?.total || 0,
          revenue: (orderDataRes?.results || []).reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0),
          products_count: productData?.paging?.total || 0,
          messages_count: 0
        });
        
        // If we got products, the token is definitely NOT dead globally
        if (productData) {
          setRefreshAttempted(false);
          setAuthError(false);
        } else if (!productData && !orderDataRes) {
          // If EVERYTHING failed, then we likely have an auth issue
          setAuthError(true);
        }
      } catch (error: any) {
        const status = error.response?.status;
        const details = error.response?.data?.details || error.response?.data;
        console.error(`Erro ao buscar dados reais (Status: ${status}):`, details || error.message);
        
        if ((status === 401 || status === 403) && !refreshAttempted) {
          console.log("Token expirado ou proibido, tentando um único refresh...");
          setRefreshAttempted(true);
          const result = await refreshMLToken();
          if (!result) setAuthError(true);
        } else if ((status === 401 || status === 403) && refreshAttempted) {
          console.error("403 persistente após refresh. Verifique as permissões do aplicativo no Mercado Livre.");
          setAuthError(true);
        }
      } finally {
        setLoadingRealData(false);
      }
    };

    fetchRealData();
  }, [customerData?.ml_credentials?.access_token]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const settingsDoc = await getDoc(doc(db, 'config', 'platform'));
      
      if (!settingsDoc.exists()) {
        alert("Configurações do Mercado Livre não encontradas. Contate o administrador.");
        return;
      }
      
      const data = settingsDoc.data();
      const appId = (data.ml_app_id || '').trim();
      const redirectUri = (data.ml_redirect_url || '').trim();
      
      if (!appId || !redirectUri) {
        alert("Credenciais do Mercado Livre não configuradas. Contate o administrador.");
        return;
      }

      // Mercado Livre OAuth URL (Brazil)
      // Usando template literal limpo para evitar espaços invisíveis
      const baseUrl = "https://auth.mercadolivre.com.br/authorization";
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: appId,
        redirect_uri: redirectUri,
        scope: 'offline_access read write'
      });
      
      const authUrl = `${baseUrl}?${params.toString()}`;
      
      // Abrir em popup para evitar bloqueios de iframe (X-Frame-Options)
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        authUrl, 
        'ML_Auth', 
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
      );

      if (!authWindow) {
        alert("O seu navegador bloqueou o popup. Por favor, permita popups para este site para completar a sincronização.");
      }
    } catch (error) {
      console.error("Erro ao iniciar sincronização:", error);
      alert("Erro ao iniciar sincronização. Verifique sua conexão e tente novamente.");
    } finally {
      setSyncing(false);
    }
  };

  React.useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validar origem básica (opcional, mas recomendado)
      if (event.data?.type === 'ML_AUTH_SUCCESS' && user) {
        const code = event.data.code;
        setSyncing(true);
        
        try {
          console.log("Iniciando troca de código por token...");
          // 1. Get platform credentials
          const settingsDoc = await getDoc(doc(db, 'config', 'platform'));
          if (!settingsDoc.exists()) {
            console.error("Configuração 'config/platform' não encontrada no Firestore.");
            throw new Error("Configurações não encontradas");
          }
          
          const settings = settingsDoc.data();
          console.log("Configurações lidas com sucesso. App ID:", settings.ml_app_id);
          
          // 2. Exchange code for token via Backend
          const tokenData = await MLService.exchangeCode(
            code,
            settings.ml_app_id,
            settings.ml_app_secret,
            settings.ml_redirect_url
          );
          
          console.log("Token recebido do backend. User ID:", tokenData.user_id);

          // 3. Save tokens to User profile in Firestore
          const userRef = doc(db, 'users', user.uid);
          console.log("Salvando no Firestore:", userRef.path);
          
          await updateDoc(userRef, {
            ml_credentials: {
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              user_id: tokenData.user_id,
              expires_at: Date.now() + (tokenData.expires_in * 1000)
            }
          });

          console.log("Sucesso ao salvar credenciais.");
          alert("Mercado Livre conectado com sucesso! Seus dados reais serão exibidos em breve.");
          // Recarregar dados se necessário
          window.location.reload();
        } catch (error) {
          console.error("Erro ao processar token:", error);
          alert("Erro ao finalizar conexão com Mercado Livre.");
        } finally {
          setSyncing(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel Operacional</h1>
          <p className="text-slate-500 text-sm mt-1">Bem-vindo de volta, aqui está o que está acontecendo com sua operação hoje.</p>
        </div>
        {!customerData?.ml_credentials ? (
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-6 py-3 rounded-xl shadow-lg shadow-amber-400/20 transition-all font-black text-xs uppercase tracking-widest active:scale-95 group blink-border"
            id="sync-ml-account-btn"
          >
            {syncing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Zap className="size-4 fill-slate-900 group-hover:animate-pulse" />
            )}
            <span>{syncing ? 'Iniciando...' : 'Conectar Conta Mercado Livre'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
             <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Conta Conectada (ID: {customerData.ml_credentials.user_id})</span>
             <button 
               onClick={handleSync}
               disabled={syncing}
               className="ml-2 p-1 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50"
               title="Sincronizar novamente"
             >
               {syncing ? (
                 <Loader2 className="size-3 text-emerald-600 animate-spin" />
               ) : (
                 <RefreshCw className="size-3 text-emerald-600" />
               )}
             </button>
          </div>
        )}
      </div>

      {authError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">Erro de Permissão (403)</p>
              <p className="text-xs text-red-600 font-medium tracking-tight">O Mercado Livre recusou o acesso aos pedidos. Certifique-se de que seu aplicativo no ML Dev Center possui a permissão de "Orders" ativa e que a conta foi autorizada com os escopos necessários.</p>
            </div>
          </div>
          <button 
            onClick={handleSync}
            className="px-6 py-2.5 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20"
          >
            Reconectar
          </button>
        </div>
      )}

      {!customerData?.ml_credentials && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-6">
           <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
              <Zap className="size-10 text-slate-300" />
           </div>
           <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Integração Necessária</h2>
              <p className="text-slate-500 text-sm">Conecte sua conta do Mercado Livre para visualizar estatísticas reais, gerenciar anúncios e usar o sistema de duplicação inteligente.</p>
           </div>
           <button 
             onClick={handleSync}
             className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
           >
             Conectar agora via OAuth 2.0
           </button>
        </div>
      )}

      {customerData?.ml_credentials && (
        <>
          {/* Quick Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={ShoppingCart} 
          label="PEDIDOS (TOTAL)" 
          value={loadingRealData ? "..." : formatNumber(realStats.orders_count)} 
          subtext="Total na conta conectada"
          color="bg-purple-500"
        />
        <StatCard 
          icon={CreditCard} 
          label="FATURAMENTO ESTIMADO" 
          value={loadingRealData ? "..." : formatCurrency(realStats.revenue)} 
          subtext="Baseado no histórico recente"
          color="bg-emerald-500"
        />
        <StatCard 
          icon={Package} 
          label="ANÚNCIOS ATIVOS" 
          value={loadingRealData ? "..." : formatNumber(realStats.products_count)} 
          subtext="Total de itens listados"
          color="bg-blue-500"
        />
        <StatCard 
          icon={TrendingUp} 
          label="CONVERSÃO MÉDIA" 
          value="8.4%" 
          subtext="+1.2% do período anterior"
          color="bg-amber-500"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Orders Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">QUANTIDADE DE PEDIDOS</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">ATUAL: 28</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-50">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">PASSADO: 16</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }}
                  labelStyle={{ fontWeight: 700, marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="current" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" />
                <Area type="monotone" dataKey="previous" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Revenue Chart & Plan Usage */}
        <div className="flex flex-col gap-6">
          <AITitleSuggester />
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-6">PAGAMENTOS RECEBIDOS NO MÊS</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL NO PERÍODO</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(3842.50)}</span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="size-16 text-amber-400" />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">USO DO PLANO (STARTER)</h3>
              <span className="text-[10px] font-bold text-amber-400">0 / 30</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative z-10">
              <div className="h-full bg-amber-400 rounded-full w-[10%]" />
            </div>
            <p className="text-[11px] text-slate-400 mt-3 relative z-10">Utilizado <span className="font-bold text-white">0.0%</span> do limite mensal.</p>
          </div>
        </div>
      </div>

      {/* Bottom Area: Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications / Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">ALERTAS OPERACIONAIS</h3>
            <button className="text-[10px] font-bold text-amber-500 hover:underline">VER TODOS</button>
          </div>
          <div className="space-y-4">
            {[
              { id: 1, type: 'warning', text: 'Token do Mercado Livre expira em 3 dias', time: '10 min atrás' },
              { id: 2, type: 'info', text: '5 novos anúncios prontos para duplicação', time: '1 hora atrás' },
              { id: 3, type: 'error', text: 'Falha na sincronização da conta QBLOXX', time: '2 horas atrás' }
            ].map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group cursor-pointer transition-colors hover:bg-white hover:border-slate-200">
                <div className={cn(
                  "p-2 rounded-lg",
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                  alert.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                )}>
                  {alert.type === 'warning' ? <Clock className="size-4" /> : 
                   alert.type === 'error' ? <AlertCircle className="size-4" /> : <Info className="size-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">{alert.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">{alert.time}</p>
                </div>
                <ChevronRight className="size-4 text-slate-300 group-hover:text-slate-500 ml-auto self-center" />
              </div>
            ))}
          </div>
        </div>

        {/* Plan & Revenue Summary Mini Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">RESUMO DE NEGOCIAÇÕES</h3>
            <button className="text-[10px] font-bold text-emerald-500 hover:underline">VER ANALYTICS</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">
                <th className="pb-3">CANAL</th>
                <th className="pb-3 text-right">QUANTIDADE</th>
                <th className="pb-3 text-right">CONVERSÃO</th>
                <th className="pb-3 text-right">VALOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: 'Mercado Livre', qty: 24, conv: '12.4%', value: 842.20 },
                { name: 'AliExpress', qty: 12, conv: '8.1%', value: 420.50 },
                { name: 'Manual', qty: 2, conv: '100%', value: 154.00 }
              ].map((row, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-xs font-bold text-slate-600">{row.name}</td>
                  <td className="py-4 text-xs font-bold text-right text-slate-700">{row.qty}</td>
                  <td className="py-4 text-xs font-bold text-right">
                    <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded text-[10px]">{row.conv}</span>
                  </td>
                  <td className="py-4 text-xs font-bold text-right text-slate-700">{formatCurrency(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
