import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Shield, Zap, Globe, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-amber-400 rounded-2xl mb-4 shadow-lg shadow-amber-400/20">
            <Shield className="text-black size-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight italic">
            ML DUPLICATOR <span className="text-amber-400">PRO</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Acesse sua central de inteligência e automação.</p>
        </div>

        <div className="space-y-4 mb-10">
          {[
            { icon: Zap, text: 'Duplicação Inteligente em Massa', color: 'text-amber-400' },
            { icon: Globe, text: 'Múltiplas Contas Sincronizadas', color: 'text-blue-400' },
            { icon: BarChart3, text: 'Relatórios de Performance Real', color: 'text-emerald-400' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
              <div className={`p-1 rounded-lg bg-slate-800 ${item.color}`}>
                <item.icon size={16} />
              </div>
              {item.text}
            </div>
          ))}
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-100 text-black font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <div className="size-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
              <span>Entrar com Google</span>
            </>
          )}
        </button>

        <p className="text-center text-slate-600 text-[10px] uppercase font-black tracking-widest mt-8">
          Ambiente de Produção v1.0 • Seguro & Criptografado
        </p>
      </motion.div>
    </div>
  );
};
