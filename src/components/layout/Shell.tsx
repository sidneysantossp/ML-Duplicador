import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Topbar } from './Topbar';
import { SELLER_NAV_ITEMS, ADMIN_NAV_ITEMS, UserRole } from '../../constants';

interface ShellProps {
  children: ReactNode;
  activeNavId: string;
  onNavigate: (id: string) => void;
  userRole: UserRole;
  userEmail: string;
  userName?: string;
  onLogout?: () => void;
}

export const Shell: React.FC<ShellProps> = ({ 
  children, 
  activeNavId, 
  onNavigate, 
  userRole,
  userEmail,
  userName,
  onLogout
}) => {
  const isAdmin = userRole === 'admin' || userRole === 'ceo' || userRole === 'finance';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {isAdmin ? (
        <AdminSidebar 
          items={ADMIN_NAV_ITEMS} 
          activeId={activeNavId} 
          onNavigate={onNavigate} 
          userEmail={userEmail}
          userName={userName}
          onLogout={onLogout}
        />
      ) : (
        <Sidebar 
          items={SELLER_NAV_ITEMS} 
          activeId={activeNavId} 
          onNavigate={onNavigate} 
          userRole={userRole}
          userEmail={userEmail}
          userName={userName}
          onLogout={onLogout}
        />
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userRole={userRole} />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
