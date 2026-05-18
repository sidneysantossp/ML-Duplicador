import { 
  LayoutDashboard, 
  Package, 
  Copy, 
  MessageSquare, 
  HelpCircle, 
  Settings, 
  ChevronRight,
  Database,
  BarChart3,
  CreditCard,
  Users,
  ShieldCheck,
  Zap,
  Globe,
  Bell,
  Search,
  ShoppingCart,
  Clock,
  AlertCircle,
  Activity,
  Terminal,
  LineChart,
  HardDrive,
  Sparkles
} from 'lucide-react';

export type UserRole = 'visitor' | 'seller_starter' | 'seller_pro' | 'seller_enterprise' | 'operator' | 'finance' | 'admin' | 'ceo';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  role: UserRole[];
  badge?: string | number;
}

export const SELLER_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Resumo', icon: LayoutDashboard, path: '/app/dashboard', role: ['seller_starter', 'seller_pro', 'seller_enterprise'] },
  { id: 'analytics', label: 'Análises e Gráficos', icon: BarChart3, path: '/app/analytics', role: ['seller_pro', 'seller_enterprise'] },
  { id: 'orders', label: 'Pedidos', icon: ShoppingCart, path: '/app/orders', role: ['seller_starter', 'seller_pro', 'seller_enterprise'] },
  { id: 'payments', label: 'MercadoPago', icon: CreditCard, path: '/app/payments', role: ['seller_starter', 'seller_pro', 'seller_enterprise'] },
  { id: 'products', label: 'Produtos e Anúncios', icon: Package, path: '/app/products', role: ['seller_starter', 'seller_pro', 'seller_enterprise'] },
  { id: 'drafts', label: 'Fila de Cadastro', icon: HardDrive, path: '/app/drafts', role: ['seller_pro', 'seller_enterprise'] },
  { id: 'history', label: 'Histórico de Duplicação', icon: Clock, path: '/app/duplication/history', role: ['seller_starter', 'seller_pro', 'seller_enterprise'] },
  { id: 'questions', label: 'Perguntas', icon: MessageSquare, path: '/app/questions', role: ['seller_starter', 'seller_pro', 'seller_enterprise'], badge: 3 },
  { id: 'messages', label: 'Mensagens', icon: Bell, path: '/app/messages', role: ['seller_starter', 'seller_pro', 'seller_enterprise'] },
  { id: 'automations', label: 'Automações', icon: Zap, path: '/app/automations', role: ['seller_pro', 'seller_enterprise'] },
  { id: 'arbitrage', label: 'Agente de Arbitragem', icon: Sparkles, path: '/app/arbitrage', role: ['seller_pro', 'seller_enterprise'] },
  { id: 'import', label: 'Importar AliExpress', icon: Globe, path: '/app/import/aliexpress', role: ['seller_pro', 'seller_enterprise'] },
  { id: 'billing', label: 'Billing', icon: CreditCard, path: '/app/billing', role: ['seller_starter', 'seller_pro', 'seller_enterprise'] },
  { id: 'settings', label: 'Configurações', icon: Settings, path: '/app/settings', role: ['seller_starter', 'seller_pro', 'seller_enterprise'] },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'admin_dashboard', label: 'Monitor Geral', icon: Activity, path: '/admin', role: ['admin'] },
  { id: 'manage_plans', label: 'Gestão de Planos', icon: CreditCard, path: '/admin/plans', role: ['admin'] },
  { id: 'backoffice', label: 'Gestão de Usuários', icon: Users, path: '/admin/users', role: ['admin'] },
  { id: 'platform_resources', label: 'Recursos & Cotas IA', icon: Zap, path: '/admin/resources', role: ['admin'] },
  { id: 'admin_tools', label: 'Ferramentas & Scripts', icon: Terminal, path: '/admin/tools', role: ['admin'] },
  { id: 'finance', label: 'Financeiro SaaS', icon: Database, path: '/admin/finance', role: ['admin', 'finance'] },
  { id: 'ceo', label: 'Analytics de Crescimento', icon: LineChart, path: '/admin/growth', role: ['admin', 'ceo'] },
  { id: 'consumption', label: 'Consumo de Dados', icon: HardDrive, path: '/admin/consumption', role: ['admin'] },
  { id: 'platform_health', label: 'Saúde do Sistema', icon: ShieldCheck, path: '/admin/health', role: ['admin'] },
  { id: 'admin_settings', label: 'Configurações Globais', icon: Settings, path: '/admin/settings', role: ['admin'] },
];
