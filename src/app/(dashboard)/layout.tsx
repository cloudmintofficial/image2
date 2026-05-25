'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      switch (e.key.toLowerCase()) {
        case 'o': e.preventDefault(); router.push('/order-entry'); break;
        case 'i': e.preventDefault(); router.push('/in-process'); break;
        case 'c': e.preventDefault(); router.push('/completed-bills'); break;
        case 'p': e.preventDefault(); router.push('/previous-bills'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleAction = (action: string) => {
    // Will be handled by individual pages via custom events
    window.dispatchEvent(new CustomEvent('topnav-action', { detail: action }));
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="app-layout">
      <Suspense fallback={<div className="sidebar collapsed"><div className="sidebar-brand"><span className="brand-text">Loading...</span></div></div>}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          userRole={user?.role || 'Owner'}
        />
      </Suspense>
      <div className={`main-area ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <TopNav
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setMobileOpen(!mobileOpen)}
          userName={user?.name || 'IMAGEE OWNER'}
          onAction={handleAction}
          onLogout={handleLogout}
        />
        <main className="content-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
}
