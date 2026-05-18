import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Link as LinkIcon, 
  Globe, 
  Zap, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Bell,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    ml_app_id: '',
    ml_app_secret: '',
    ml_redirect_url: '',
    ml_notification_url: '',
    platform_name: 'ML DUPLICATOR PRO',
    ai_enabled: true,
    maintenance_mode: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'config', 'platform'));
        const currentOrigin = window.location.origin;
        
        const defaultSettings = {
          ml_app_id: '',
          ml_app_secret: '',
          ml_redirect_url: `${currentOrigin}/auth/callback`,
          ml_notification_url: `${currentOrigin}/api/webhooks/mercadolivre`,
          platform_name: 'ML DUPLICATOR PRO',
          ai_enabled: true,
          maintenance_mode: false,
        };

        if (settingsDoc.exists()) {
          setSettings({ ...defaultSettings, ...settingsDoc.data() });
        } else {
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Limpar espaços acidentais nas chaves
      const cleanedSettings = {
        ...settings,
        ml_app_id: settings.ml_app_id.trim(),
        ml_app_secret: settings.ml_app_secret.trim(),
        ml_redirect_url: settings.ml_redirect_url.trim(),
        ml_notification_url: settings.ml_notification_url.trim(),
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'config', 'platform'), cleanedSettings, { merge: true });
      
      setSettings(cleanedSettings);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Houve um erro ao salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="size-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações Globais</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie chaves de API, integrações e comportamentos fundamentais da plataforma.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-900/10"
        >
          {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mercado Livre API Config */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-400 rounded-lg text-slate-900">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-none">Integração Mercado Livre</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1.5">API de Aplicativo (Dev ML)</p>
                </div>
              </div>
              <a 
                href="https://developers.mercadolivre.com.br/devcenter" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-bold text-amber-600 hover:underline"
              >
                PLATAFORMA DEV ML
              </a>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">App ID (Client ID)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="size-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      value={settings.ml_app_id}
                      onChange={(e) => setSettings({...settings, ml_app_id: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono text-slate-900"
                      placeholder="Ex: 843920584729"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Client Secret</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="size-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input 
                      type={showSecret ? "text" : "password"} 
                      value={settings.ml_app_secret}
                      onChange={(e) => setSettings({...settings, ml_app_secret: e.target.value})}
                      className="block w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono text-slate-900"
                      placeholder="••••••••••••••••"
                    />
                    <button 
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Estes dados são obtidos ao criar um novo aplicativo no <span className="font-bold underline italic">Mercado Livre Dev Center</span>. 
                    Certifique-se de que o aplicativo tenha os <span className="font-bold uppercase tracking-tighter">Read & Write Scopes</span> habilitados.
                  </p>
                  <p className="text-[10px] text-amber-700 bg-amber-100/50 p-2 rounded border border-amber-200">
                    <span className="font-bold">Dica:</span> Se receber o erro <span className="italic">"não é um problema de URL de retorno"</span>, verifique se o <span className="font-bold underline">APP ID</span> está correto (é um número) e se o aplicativo está com status <span className="font-bold uppercase text-emerald-700">Ativo</span> no Dev Center.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <Globe className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-none">Mercado Livre: Redirect & Webhooks</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1.5">Configurações de Comunicação</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-tighter">Obrigatório para OAuth</span>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Redirect URL (Retorno de Login)</label>
                  <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">OAuth Callback</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="size-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      value={settings.ml_redirect_url}
                      onChange={(e) => setSettings({...settings, ml_redirect_url: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Ex: https://dominio.com/auth/callback"
                    />
                  </div>
                  <button 
                    onClick={() => copyToClipboard(settings.ml_redirect_url, 'redirect')}
                    className={cn(
                      "px-4 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-xs shrink-0",
                      copiedField === 'redirect' 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {copiedField === 'redirect' ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                    {copiedField === 'redirect' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">
                  Esta URL deve ser inserida exatamente igual no campo "Redirect URI" do aplicativo no Mercado Livre.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notification URL (Webhooks)</label>
                  <span className="text-[9px] font-black text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded uppercase">Topic Tracking</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Bell className="size-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      value={settings.ml_notification_url}
                      onChange={(e) => setSettings({...settings, ml_notification_url: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      placeholder="Ex: https://dominio.com/api/notifications"
                    />
                  </div>
                  <button 
                    onClick={() => copyToClipboard(settings.ml_notification_url, 'notify')}
                    className={cn(
                      "px-4 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-xs shrink-0",
                      copiedField === 'notify' 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {copiedField === 'notify' ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                    {copiedField === 'notify' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">
                  URL para recepção de notificações de vendas e alterações em anúncios.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <section className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white">
            <h3 className="font-bold uppercase tracking-wider text-xs mb-6 flex items-center gap-2">
              <Activity className="size-4 text-amber-400" />
              Controle de Plataforma
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Motor de IA (Gemini)</p>
                  <p className="text-[10px] text-slate-400">Ativa otimização automática de anúncios.</p>
                </div>
                <button 
                  onClick={() => setSettings({...settings, ai_enabled: !settings.ai_enabled})}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    settings.ai_enabled ? "bg-amber-400" : "bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "size-4 bg-white rounded-full absolute top-1 transition-transform",
                    settings.ai_enabled ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-red-400">Modo Manutenção</p>
                  <p className="text-[10px] text-slate-400">Bloqueia acesso de todos os vendedores.</p>
                </div>
                <button 
                  onClick={() => setSettings({...settings, maintenance_mode: !settings.maintenance_mode})}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    settings.maintenance_mode ? "bg-red-500" : "bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "size-4 bg-white rounded-full absolute top-1 transition-transform",
                    settings.maintenance_mode ? "left-6" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-6">Informações Gerais</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome da Plataforma</label>
                <input 
                  type="text" 
                  value={settings.platform_name}
                  onChange={(e) => setSettings({...settings, platform_name: e.target.value})}
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[200] font-bold text-sm"
          >
            <CheckCircle2 className="size-5" />
            Configurações salvas com sucesso!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
