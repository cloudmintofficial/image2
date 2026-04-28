'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Search, Monitor, Settings, CheckCircle, Printer,
  BarChart3, Users, FileText, ClipboardList, ChevronLeft, ChevronRight
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  adminOnly?: boolean;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { icon: <Home size={20} />, label: 'Home', path: '/order-entry' },
  { icon: <Search size={20} />, label: 'Search', path: '/order-entry?search=true' },
  { icon: <Monitor size={20} />, label: 'Order Entry', path: '/order-entry', shortcut: 'Alt+O' },
  { icon: <Settings size={20} />, label: 'In Process', path: '/in-process', shortcut: 'Alt+I' },
  { icon: <CheckCircle size={20} />, label: 'Completed Bills', path: '/completed-bills', shortcut: 'Alt+C' },
  { icon: <Printer size={20} />, label: 'Previous Bills', path: '/previous-bills', shortcut: 'Alt+P' },
  { icon: <BarChart3 size={20} />, label: 'Dashboard', path: '/dashboard', adminOnly: true },
  { icon: <FileText size={20} />, label: 'Reports', path: '/reports', adminOnly: true },
  { icon: <Users size={20} />, label: 'User Management', path: '/users', adminOnly: true },
  { icon: <ClipboardList size={20} />, label: 'Settings', path: '/settings', adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  userRole?: string;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, userRole = 'Owner' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && userRole !== 'Owner') return false;
    return true;
  });

  const handleNavigate = (path: string) => {
    router.push(path);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onMobileClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 199,
            display: 'none',
          }}
        />
      )}
      <style>{`
        @media (max-width: 767px) {
          .sidebar-overlay { display: block !important; }
        }
      `}</style>

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon"><FileText size={18} /></div>
          <span className="brand-text">Medfile Labs</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {filteredItems.map((item, index) => {
            const isActive = pathname === item.path || 
              (item.path !== '/' && pathname?.startsWith(item.path));
            return (
              <button
                key={index}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={onToggle}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <span className="nav-icon">
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </span>
            <span className="nav-label">Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
