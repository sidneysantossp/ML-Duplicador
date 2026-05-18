/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shell } from './components/layout/Shell';
import { SellerDashboard } from './pages/dashboard/SellerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CustomerManagement } from './pages/admin/CustomerManagement';
import { PlanManagement } from './pages/admin/PlanManagement';
import { PlatformHealth } from './pages/admin/PlatformHealth';
import { AIResourceManagement } from './pages/admin/AIResourceManagement';
import { AdminSettings } from './pages/admin/AdminSettings';
import { ProductLibrary } from './pages/products/ProductLibrary';
import { DuplicationHistory } from './pages/duplication/DuplicationHistory';
import { DuplicationWizard } from './pages/duplication/DuplicationWizard';
import { ProductEditor } from './pages/products/ProductEditor';
import { AutomationPanel } from './pages/duplication/AutomationPanel';
import { ArbitrageAgent } from './pages/arbitrage/ArbitrageAgent';
import { DraftQueue } from './pages/products/DraftQueue';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderDetailsPage } from './pages/orders/OrderDetailsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { UserRole } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';

function MainApp() {
  const { user, loading, logout, customerData, isAdmin } = useAuth();
  const [activeNavId, setActiveNavId] = useState('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('seller_pro');
  const [userEmail, setUserEmail] = useState('vendedor@mercadolivre.com.br');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const handleNavigate = (id: string, items?: any[]) => {
    if (items) {
      setSelectedItems(items);
    }
    setActiveNavId(id);
  };

  // Sync user role and email with authenticated user
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || '');
      
      // Auto-switch to admin role if authorized in Firestore
      if (isAdmin) {
        setUserRole('admin');
        setActiveNavId('backoffice');
      } else {
        setUserRole('seller_pro');
        setActiveNavId('dashboard');
      }
    }
  }, [user, isAdmin]);

  // Detect ML Auth Callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Se estivermos em um popup, avisamos a janela principal e fechamos
      if (window.opener) {
        window.opener.postMessage({ type: 'ML_AUTH_SUCCESS', code }, '*');
        window.close();
        return;
      }

      // Fallback para quando não é popup (ou se o redimensionamento falhou)
      window.history.replaceState({}, document.title, window.location.pathname);
      alert("Conexão com Mercado Livre iniciada! O código de autorização foi recebido.");
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="size-16 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    if (userRole === 'admin') {
      switch (activeNavId) {
        case 'manage_plans':
          return <PlanManagement />;
        case 'backoffice':
          return <CustomerManagement />;
        case 'platform_resources':
        case 'consumption':
          return <AIResourceManagement />;
        case 'platform_health':
          return <PlatformHealth />;
        case 'admin_settings':
          return <AdminSettings />;
        case 'finance':
        case 'ceo':
        case 'admin_dashboard':
          return <AdminDashboard />;
        default:
          return <AdminDashboard />;
      }
    }
    
    switch (activeNavId) {
      case 'dashboard':
        return <SellerDashboard />;
      case 'orders':
        return <OrdersPage onNavigate={handleNavigate} />;
      case 'order_details':
        return <OrderDetailsPage orderId={selectedItems[0]} onBack={() => setActiveNavId('orders')} />;
      case 'products':
      case 'product_library':
        return <ProductLibrary onNavigate={handleNavigate} />;
      case 'history':
        return <DuplicationHistory />;
      case 'automations':
        return <AutomationPanel />;
      case 'arbitrage':
        return <ArbitrageAgent />;
      case 'drafts':
        return <DraftQueue onNavigate={handleNavigate} />;
      case 'duplication_wizard':
        return <DuplicationWizard onNavigate={handleNavigate} selectedProducts={selectedItems} />;
      case 'product_editor':
      case 'product_details':
        return (
          <ProductEditor 
            onNavigate={handleNavigate} 
            productId={selectedItems[0]?.id || selectedItems[0]} 
            initialProduct={selectedItems[0]?.id ? selectedItems[0] : null}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-400">Módulo em Desenvolvimento</h2>
            <p className="text-gray-500 max-w-sm">
              O módulo <span className="font-bold text-orange-500 uppercase">{activeNavId}</span> está sendo implementado conforme o checklist da Bíblia Técnica.
            </p>
            <button 
              onClick={() => setActiveNavId('dashboard')}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-orange-500/20"
            >
              Voltar ao Resumo
            </button>
          </div>
        );
    }
  };

  const toggleRole = () => {
    const newRole: UserRole = userRole === 'admin' ? 'seller_pro' : 'admin';
    setUserRole(newRole);
    setActiveNavId(newRole === 'admin' ? 'backoffice' : 'dashboard');
    if (!user) {
      setUserEmail(newRole === 'admin' ? 'admin@mlduplicator.pro' : 'vendedor@mercadolivre.com.br');
    }
  };

  return (
    <div className="relative">
      <Shell 
        activeNavId={activeNavId} 
        onNavigate={handleNavigate} 
        userRole={userRole}
        userEmail={userEmail}
        onLogout={logout}
        userName={user.displayName || 'Usuário'}
      >
        {renderContent()}
      </Shell>

      {/* Demo Floating Switcher */}
      <button 
        onClick={toggleRole}
        className="fixed bottom-6 right-6 z-[100] bg-black text-white px-4 py-3 rounded-full text-[10px] font-black tracking-widest uppercase shadow-2xl border-2 border-white/20 hover:scale-105 transition-all"
      >
        Alternar para {userRole === 'admin' ? 'Vendedor' : 'Admin'}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
