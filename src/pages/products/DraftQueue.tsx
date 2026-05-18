import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Search, 
  RefreshCw, 
  Zap, 
  Trash2, 
  CheckCircle2, 
  ChevronRight,
  Package,
  Edit3
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { AIOptimizerModal } from '../../components/ai/AIOptimizerModal';

interface DraftProduct {
  id: string;
  title: string;
  price: number;
  cost: number;
  margin: number;
  description: string;
  imageUrl: string;
  category: string;
  status: 'draft' | 'optimized' | 'published';
  created_at: string;
}

interface DraftQueueProps {
  onNavigate: (id: string, items?: any[]) => void;
}

export const DraftQueue: React.FC<DraftQueueProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;

    const draftsRef = collection(db, 'users', user.uid, 'drafts');
    const q = query(draftsRef, orderBy('server_timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DraftProduct[];
      setDrafts(docs);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar fila:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Remover este item da fila?")) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'drafts', id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Falha ao remover item.");
    }
  };

  const handleOptimize = (id: string) => {
    setOptimizingId(id);
  };

  const handleApplyOptimization = async (title: string, description: string) => {
    if (!user || !optimizingId) return;

    try {
      await updateDoc(doc(db, 'users', user.uid, 'drafts', optimizingId), {
        title,
        description,
        status: 'optimized'
      });
      setOptimizingId(null);
      alert("Otimização aplicada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Falha ao salvar otimização.");
    }
  };

  const filteredDrafts = drafts.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.category.toLowerCase().includes(search.toLowerCase())
  );

  const selectedDraft = optimizingId ? drafts.find(d => d.id === optimizingId) : null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <HardDrive className="size-8 text-amber-500" />
            Fila de Cadastro
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Produtos aguardando otimização e publicação no Mercado Livre.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar na fila..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-400/10 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="size-8 text-amber-500 animate-spin" />
            <p className="text-slate-500 font-bold">Carregando sua fila...</p>
          </div>
        ) : filteredDrafts.length > 0 ? (
          <AnimatePresence>
            {filteredDrafts.map((draft, idx) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-slate-100 p-4 hover:shadow-lg transition-all group"
              >
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Image */}
                  <div className="size-20 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                    <img 
                      src={draft.imageUrl || `https://placehold.co/400x400/f1f5f9/64748b?text=${encodeURIComponent(draft.title)}`} 
                      alt={draft.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { 
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('placehold.co')) {
                          target.src = `https://placehold.co/400x400/f1f5f9/64748b?text=${encodeURIComponent(draft.title)}`;
                        }
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        {draft.category}
                      </span>
                      {draft.status === 'optimized' && (
                        <span className="px-2 py-0.5 bg-emerald-500 rounded text-[9px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={10} /> Otimizado
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-slate-900 text-lg truncate">{draft.title}</h3>
                    <div className="flex gap-4 mt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                        Custo: <span className="text-slate-700">R$ {draft.cost.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                        Venda: <span className="text-amber-600">R$ {draft.price.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                        Lucro: <span className="text-emerald-500">{draft.margin}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onNavigate('product_editor', [{ ...draft, isDraft: true }])}
                      className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors shadow-sm"
                      title="Editar Detalhes"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button 
                      onClick={() => handleOptimize(draft.id)}
                      className="p-3 bg-amber-400 text-slate-900 rounded-2xl hover:bg-amber-500 transition-colors shadow-sm"
                      title="Otimizar com IA"
                    >
                      <Zap className="size-4 fill-slate-900" />
                    </button>
                    <button 
                      onClick={() => alert("Publicação no Mercado Livre selecionada para este item (Integração em andamento)")}
                      className="px-4 py-2 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      Publicar <ChevronRight size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(draft.id)}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-full shadow-sm">
              <Package className="size-8 text-slate-300" />
            </div>
            <div>
              <p className="text-slate-900 font-black text-xl">Sua fila está vazia</p>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                Importe produtos usando o Agente de Arbitragem para começar a vender.
              </p>
            </div>
          </div>
        )}
      </div>

      <AIOptimizerModal 
        isOpen={!!optimizingId}
        onClose={() => setOptimizingId(null)}
        productTitle={selectedDraft?.title || ''}
        productDescription={selectedDraft?.description || ''}
        onApply={handleApplyOptimization}
      />
    </div>
  );
};
