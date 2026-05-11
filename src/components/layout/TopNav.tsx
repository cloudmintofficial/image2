'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

// Context-sensitive top navigation actions per module
const moduleActions: Record<string, string[]> = {
  '/order-entry': ['Submit', 'Clear', 'Enter Results', 'Discount', 'Bill Details', 'Add Doctor', 'Add Order', 'Add Expense'],
  '/in-process': ['Non Financial Report', 'Non Financial Status Report', 'Online Request Sample Status', 'WorkSheet'],
  '/previous-bills': ['ShiftCollectionDetailed', 'ShiftCollection', 'SummaryReport'],
  '/work-sheet': ['Get Report', 'Clear'],
  '/non-financial': ['Get Report', 'Clear'],
  '/non-financial-status': ['Get Report', 'Clear'],
  '/online-request-sample-status': ['Get Report', 'Clear'],
  '/order-maintenance': ['Add Order', 'Service Group', 'Lab Profiles', 'Lab Default Font', 'Print Price List', 'Price List Excel'],
  '/add-order': ['Save Order', 'Clear', 'Cancel', 'Order Templates'],
};

interface TopNavProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
  userName?: string;
  onAction?: (action: string) => void;
  onLogout?: () => void;
}

export default function TopNav({ sidebarCollapsed, onMenuClick, userName = 'IMAGEE OWNER', onAction, onLogout }: TopNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const actions = moduleActions[pathname || ''] || [];
  const [disabledActions, setDisabledActions] = React.useState<string[]>([]);

  React.useEffect(() => {
    const handleSetDisabled = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setDisabledActions(e.detail);
      }
    };
    window.addEventListener('set-disabled-actions', handleSetDisabled);
    return () => window.removeEventListener('set-disabled-actions', handleSetDisabled);
  }, []);

  return (
    <header className={`topnav ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="topnav-actions">
        {/* Hamburger for mobile */}
        <button
          className="btn btn-ghost btn-icon hamburger-btn"
          onClick={onMenuClick}
          style={{ marginRight: 8 }}
        >
          <Menu size={20} />
        </button>
        <style>{`
          .hamburger-btn { display: none; }
          @media (max-width: 767px) {
            .hamburger-btn { display: flex; }
          }
          @media (max-width: 767px) {
            .topnav-actions-list { display: none !important; }
          }
        `}</style>

        {/* Context-sensitive action buttons */}
        <div className="topnav-actions-list" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {actions.map((action) => {
            const isDisabled = disabledActions.includes(action);
            const isPrimary = action === 'Submit' || action === 'Get Report' || action === 'WorkSheet';
            return (
              <button
                key={action}
                className={isPrimary ? 'btn btn-primary' : 'btn btn-ghost'}
                onClick={() => {
                  if (!isDisabled) onAction?.(action);
                }}
                disabled={isDisabled}
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '6px 16px',
                  borderRadius: '8px',
                  boxShadow: isPrimary ? '0 4px 12px rgba(249,115,22,0.2)' : 'none',
                  opacity: isDisabled ? 0.6 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                {action}
              </button>
            );
          })}
        </div>
      </div>

      <div className="topnav-right">
        {/* Theme toggle */}
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User info */}
        <div className="topnav-user">
          <User size={14} />
          <span>Hi! {userName}</span>
        </div>

        {/* Logout */}
        <button className="btn btn-ghost btn-icon" onClick={onLogout} title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
