'use client';

import React, { useState } from 'react';

const tabs = ['Financial', 'Bills', 'Orders', 'Billing Category'];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('Financial');
  const [stats, setStats] = useState({
    users: 0,
    bills: 0,
    cancelledBills: 0,
    refundedBills: 0,
    totalBilled: 0,
    totalCancelled: 0,
    totalRefunded: 0
  });

  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStats(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Financial analytics and billing overview</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/order-entry'}>
          ← Back to Order Entry
        </button>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Financial' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Billing Overview</h3>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card blue">
              <div className="metric-label">No of Logged In Users</div>
              <div className="metric-value">{loading ? <div className="skeleton skeleton-text" style={{ width: 40, height: 28 }} /> : stats.users}</div>
            </div>
          </div>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card green"><div className="metric-label">No of Bills</div><div className="metric-value">{loading ? <div className="skeleton skeleton-text" style={{ width: 40, height: 28 }} /> : stats.bills}</div></div>
            <div className="metric-card orange"><div className="metric-label">Total Amount Billed</div><div className="metric-value">{loading ? <div className="skeleton skeleton-text" style={{ width: 80, height: 28 }} /> : `₹${stats.totalBilled.toLocaleString()}`}</div></div>
          </div>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card red"><div className="metric-label">No of Cancelled Bills</div><div className="metric-value">{loading ? <div className="skeleton skeleton-text" style={{ width: 40, height: 28 }} /> : stats.cancelledBills}</div></div>
            <div className="metric-card purple"><div className="metric-label">Total Amount Cancelled</div><div className="metric-value">{loading ? <div className="skeleton skeleton-text" style={{ width: 80, height: 28 }} /> : `₹${stats.totalCancelled.toLocaleString()}`}</div></div>
          </div>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card teal"><div className="metric-label">No of Refunded Bills</div><div className="metric-value">{loading ? <div className="skeleton skeleton-text" style={{ width: 40, height: 28 }} /> : stats.refundedBills}</div></div>
            <div className="metric-card rose"><div className="metric-label">Total Amount Refunded</div><div className="metric-value">{loading ? <div className="skeleton skeleton-text" style={{ width: 80, height: 28 }} /> : `₹${stats.totalRefunded.toLocaleString()}`}</div></div>
          </div>
        </div>
      )}

      {activeTab === 'Bills' && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3>Bill Analytics</h3><p>Charts and bill count analytics coming soon</p>
        </div></div>
      )}

      {activeTab === 'Orders' && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <h3>Order Statistics</h3><p>Order-level analytics coming soon</p>
        </div></div>
      )}

      {activeTab === 'Billing Category' && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏷️</div>
          <h3>Category Breakdown</h3><p>Revenue by test category coming soon</p>
        </div></div>
      )}
    </div>
  );
}
