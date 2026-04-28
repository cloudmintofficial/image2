'use client';

import React, { useState } from 'react';

const reportTypes = [
  'Bill Reports', 'Collection Reports', 'Shift Collection', 'Doctor Reports',
  'Order Smry Report', 'OP Smry Report', 'Card Reports', 'Inventory Reports', 'Doctor Wise Smry'
];

export default function ReportsPage() {
  const [active, setActive] = useState('Bill Reports');
  return (
    <div>
      <div className="page-header"><h1 className="page-title">Reports</h1><p className="page-subtitle">Generate and view lab reports</p></div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div className="card" style={{ minWidth: 220 }}>
          <div className="card-header"><span className="card-title" style={{ fontSize: 14 }}>MEDFILE</span></div>
          <div style={{ padding: 8 }}>
            {reportTypes.map(r => (
              <button key={r} className={`nav-item ${active === r ? 'active' : ''}`}
                style={{ background: active === r ? 'var(--primary-light)' : 'transparent', color: active === r ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: active === r ? 600 : 400 }}
                onClick={() => setActive(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
            <h3>{active}</h3><p>Report generation interface coming soon</p>
          </div></div>
        </div>
      </div>
    </div>
  );
}
