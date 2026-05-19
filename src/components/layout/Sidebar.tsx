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
  path?: string;
  adminOnly?: boolean;
  shortcut?: string;
  subItems?: { label: string; path: string; icon?: React.ReactNode }[];
}

const navItems: NavItem[] = [
  { icon: <Monitor size={20} />, label: 'Order Entry', path: '/order-entry', shortcut: 'Alt+O' },
  { icon: <Settings size={20} />, label: 'In Process', path: '/in-process', shortcut: 'Alt+I' },
  { icon: <CheckCircle size={20} />, label: 'Completed Bills', path: '/completed-bills', shortcut: 'Alt+C' },
  { icon: <Printer size={20} />, label: 'Previous Bills', path: '/previous-bills', shortcut: 'Alt+P' },
  { icon: <BarChart3 size={20} />, label: 'Dashboard', path: '/dashboard', adminOnly: true },
  {
    icon: <ClipboardList size={20} />,
    label: 'Options',
    adminOnly: true,
    subItems: [
      { label: 'Order Maintenance', path: '/order-maintenance' },
      { label: 'Department Maintenance', path: '/settings' },
      { label: 'Doctors', path: '/doctors' },
      { label: 'Locations', path: '/locations' },
      { label: 'Lab Users', path: '/users' },
      { label: 'Patient Requests', path: '/patient-requests' },
      { label: 'SMS', path: '/sms' },
      { label: 'Incoming Labs', path: '/incoming-labs' },
    ]
  },
  { icon: <FileText size={20} />, label: 'Reports', path: '/reports', adminOnly: true },
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
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

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
            const hasSubItems = !!item.subItems;
            const isSubmenuOpen = openSubmenu === item.label;
            const isActive = item.path ? (pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path))) : false;
            const anySubItemActive = item.subItems?.some(si => pathname === si.path);

            return (
              <div key={index} className="nav-item-container">
                <button
                  className={`nav-item ${(isActive || (hasSubItems && anySubItemActive)) ? 'active' : ''}`}
                  onClick={() => {
                    if (hasSubItems) {
                      setOpenSubmenu(isSubmenuOpen ? null : item.label);
                    } else if (item.path) {
                      handleNavigate(item.path);
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {hasSubItems && !collapsed && (
                    <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
                      {isSubmenuOpen ? <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={14} />}
                    </span>
                  )}
                </button>

                {hasSubItems && isSubmenuOpen && !collapsed && (
                  <div className="submenu">
                    {item.subItems?.map((subItem, idx) => (
                      <button
                        key={idx}
                        className={`submenu-item ${pathname === subItem.path ? 'active' : ''}`}
                        onClick={() => handleNavigate(subItem.path)}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
