import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Key, 
  Bell, 
  Store, 
  Globe, 
  User, 
  CreditCard,
  Copy, 
  Lock, 
  Plus, 
  LogOut,
  Zap,
  Check,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, customerData, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'stores' | 'security' | 'plan'>('profile');
  
  // Platform Settings State
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [platformConfig, setPlatformConfig] = useState({
    ml_app_id: '',
    ml_app_secret: '',
    ml_redirect_url: window.location.origin
  });

  // Profile State
  const [profileName, setProfileName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (customerData) {
      setProfileName(customerData.name);
    }
  }, [customerData]);

  // Load Platform Config
  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const docRef = doc(db, 'config', 'platform');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPlatformConfig({
            ml_app_id: data.ml_app_id || '',
            ml_app_secret: data.ml_app_secret || '',
            ml_redirect_url: data.ml_redirect_url || window.location.origin
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    console.log("Salvando perfil...");
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileName,
        updated_at: new Date().toISOString()
      });
      alert("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      alert(`Erro ao salvar perfil: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePlatformConfig = async () => {
    if (!isAdmin) {
      alert("Apenas administradores podem salvar estas configurações.");
      return;
    }
    setSavingConfig(true);
    console.log("Salvando configurações da plataforma:", platformConfig);
    try {
      const docRef = doc(db, 'config', 'platform');
      await setDoc(docRef, {
        ...platformConfig,
        updated_at: new Date().toISOString()
      }, { merge: true });
      alert("Configurações da plataforma salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      alert(`Erro ao salvar configurações: ${error.message || 'Acesso negado'}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'stores', label: 'Minhas Lojas', icon: Store },
    { id: 'security', label: 'Configuração & API', icon: Shield },
    { id: 'plan', label: 'Assinatura', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center lg:text-left">Configurações do Sistema</h1>
        <p className="text-slate-500 text-sm font-medium text-center lg:text-left">Gerencie sua conta, as integrações do Mercado Livre e suas preferências.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20" 
                  : "text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200"
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all font-sans"
            >
              <LogOut className="size-4" />
              Sair da Conta
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {activeTab === 'profile' && (
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 relative group overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="size-8 text-slate-400" />
                    )}
                    <button className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold">Alterar</button>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{customerData?.name || 'Carregando...'}</h3>
                    <p className="text-sm text-slate-500">{customerData?.email}</p>
                    <span className="inline-flex items-center gap-1.5 mt-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-amber-200">Plano {customerData?.plan?.toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-sans">Nome Completo</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-sans">E-mail</label>
                    <input type="email" defaultValue={customerData?.email} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all disabled:opacity-50" disabled />
                  </div>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all border-b-4 border-slate-700 active:translate-y-1 active:border-b-0 shadow-lg flex items-center gap-2"
                >
                  {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Salvar Alterações
                </button>
              </div>
            )}

            {activeTab === 'stores' && (
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Contas Mercado Livre</h3>
                  <button className="bg-amber-400 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500 transition-all border-b-4 border-amber-600 active:translate-y-1 active:border-b-0 shadow-lg shadow-amber-400/20">
                    <Plus className="size-3.5" /> Vincular Nova Conta
                  </button>
                </div>

                {customerData?.ml_credentials ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-all">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-white border-slate-200">
                           <Store className="size-5 text-slate-400" />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-slate-900">ID Mercado Livre: {customerData.ml_credentials.user_id}</p>
                           <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Conta Principal</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-6">
                         <div className="text-right">
                           <p className="text-[10px] font-black uppercase text-emerald-500">Conectado</p>
                           <p className="text-[9px] text-slate-400 font-medium whitespace-nowrap">Expira em: {new Date(customerData.ml_credentials.expires_at).toLocaleDateString()}</p>
                         </div>
                         <button className="p-2 hover:bg-white rounded-lg text-slate-400 transition-all border border-transparent hover:border-slate-200 shadow-sm">
                           <RefreshCw className="size-4" />
                         </button>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-medium">Nenhuma conta vinculada ainda.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  {/* Mercado Livre App Integration Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest font-sans">
                         <Zap className="size-4 text-amber-500" /> Integração Mercado Livre
                       </h3>
                       {!isAdmin && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded">SOMENTE ADMIN</span>}
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                       <p className="text-xs font-bold text-amber-800">Instruções de Configuração</p>
                       <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                         Para que a duplicação funcione, você deve criar um aplicativo no <a href="https://developers.mercadolibre.com.br/dev-center" target="_blank" rel="noreferrer" className="underline font-bold">Mercado Livre Dev Center</a> e inserir as credenciais abaixo. 
                         Certifique-se de adicionar a <strong>URL de Retorno</strong> na configuração do seu app no ML.
                       </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-sans">App ID / Client ID</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 8234567890123456"
                          value={platformConfig.ml_app_id} 
                          onChange={(e) => setPlatformConfig({...platformConfig, ml_app_id: e.target.value})}
                          disabled={!isAdmin && !!platformConfig.ml_app_id}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all font-mono" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-sans">Client Secret</label>
                        <div className="relative">
                          <input 
                            type="password" 
                            placeholder="Sua Secret Key"
                            value={platformConfig.ml_app_secret} 
                            onChange={(e) => setPlatformConfig({...platformConfig, ml_app_secret: e.target.value})}
                            disabled={!isAdmin && !!platformConfig.ml_app_secret}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all font-mono" 
                          />
                          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-sans">URL de Retorno (Redirect URL)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={platformConfig.ml_redirect_url} 
                            onChange={(e) => setPlatformConfig({...platformConfig, ml_redirect_url: e.target.value})}
                            placeholder="https://sua-app.com"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-mono outline-none focus:bg-white focus:ring-4 focus:ring-amber-400/10 transition-all text-slate-700" 
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(platformConfig.ml_redirect_url);
                              alert("URL copiada!");
                            }}
                            type="button"
                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <Copy className="size-4 text-slate-400" />
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium">Copie e cole este valor no campo "Redirect URL" no painel do Mercado Livre.</p>
                      </div>
                    </div>

                    <button 
                      onClick={handleSavePlatformConfig}
                      disabled={savingConfig || (!isAdmin && !!platformConfig.ml_app_id)}
                      className="w-full bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all border-b-4 border-slate-700 active:translate-y-1 active:border-b-0 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 font-sans"
                    >
                      {savingConfig ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      {!isAdmin && !!platformConfig.ml_app_id ? 'Somente Leitura' : 'Salvar Configurações da Plataforma'}
                    </button>
                  </div>

                  <div className="pt-8 border-t border-slate-100 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-widest text-[11px] font-sans">
                       <Key className="size-4 text-amber-500" /> API Access Keys (Externo)
                    </h3>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                       <code className="text-xs text-slate-400 font-mono tracking-wider">pk_live_{customerData?.id?.slice(0, 8)}**************************</code>
                       <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"><Copy className="size-4" /></button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">Utilize esta chave para integrar sua conta ML Duplicator PRO com sistemas ERP externos.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="p-8 space-y-8">
                <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap className="size-32 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div>
                      <span className="bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Plano Atual</span>
                      <h3 className="text-3xl font-black text-white tracking-tighter mt-3 uppercase tracking-widest">ML DUPLICATOR {customerData?.plan?.toUpperCase()}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Próxima Cobrança</p>
                         <p className="text-sm font-bold text-white mt-1">15 de Maio, 2026</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor do Ciclo</p>
                         <p className="text-sm font-bold text-white mt-1">R$ {customerData?.plan === 'pro' ? '197,00' : '0,00'}/mês</p>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                       <button className="bg-white text-slate-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl font-sans">Alterar Plano</button>
                       <button className="px-6 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2 hover:bg-white/10 transition-all border border-white/20 font-sans">Cancelar Assinatura</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest font-sans">O que está incluído no seu plano:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Contas Mercado Livre Ilimitadas',
                      'Otimização de SEO via Gemini 3.1 Pro',
                      'Duplicação Massiva Ultra-High Speed',
                      'Exportação AliExpress Integrada',
                      'Suporte Prioritário 24/7',
                      'Remoção de Logotipos via IA'
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600 font-sans">
                        <Check className="size-3.5 text-emerald-500" /> {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Note */}
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <Globe className="size-4 text-slate-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">Servidor: AWS us-east-1 (Latência: 12ms)</p>
            </div>
            <button className="text-[10px] font-bold text-amber-600 hover:underline font-sans">Ver Status do Sistema</button>
          </div>
        </div>
      </div>
    </div>
  );
};

