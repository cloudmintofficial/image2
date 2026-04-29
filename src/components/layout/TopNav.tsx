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
        <div className="topnav-actions-list" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {actions.map((action) => {
            const isDisabled = disabledActions.includes(action);
            return (
              <button
                key={action}
                onClick={() => {
                  if (!isDisabled) onAction?.(action);
                }}
                disabled={isDisabled}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isDisabled ? 'var(--text-muted, #999)' : 'var(--text-secondary)',
                  fontSize: '15px',
                  fontWeight: isDisabled ? 400 : 500,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  padding: '4px 0',
                  transition: 'color 0.2s',
                  fontFamily: 'inherit',
                  opacity: isDisabled ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) e.currentTarget.style.color = 'var(--text-secondary)';
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
