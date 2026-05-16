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
  const [billsStats, setBillsStats] = useState<any>(null);
  const [ordersStats, setOrdersStats] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashRes, billsRes, ordersRes, catRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/dashboard/bills-status'),
          fetch('/api/dashboard/orders-status'),
          fetch('/api/dashboard/billing-category')
        ]);
        
        if (dashRes.ok) setStats(await dashRes.json());
        if (billsRes.ok) setBillsStats(await billsRes.json());
        if (ordersRes.ok) setOrdersStats(await ordersRes.json());
        if (catRes.ok) setCategoryStats(await catRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Bill Status Overview</h3>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card blue"><div className="metric-label">Total Bills</div><div className="metric-value">{loading ? '...' : billsStats?.total || 0}</div></div>
            <div className="metric-card orange"><div className="metric-label">Pending</div><div className="metric-value">{loading ? '...' : billsStats?.pending || 0}</div></div>
            <div className="metric-card green"><div className="metric-label">Completed</div><div className="metric-value">{loading ? '...' : billsStats?.completed || 0}</div></div>
          </div>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card teal"><div className="metric-label">Saved</div><div className="metric-value">{loading ? '...' : billsStats?.saved || 0}</div></div>
            <div className="metric-card purple"><div className="metric-label">Dispatched</div><div className="metric-value">{loading ? '...' : billsStats?.dispatched || 0}</div></div>
            <div className="metric-card red"><div className="metric-label">Cancelled</div><div className="metric-value">{loading ? '...' : billsStats?.cancelled || 0}</div></div>
          </div>
        </div>
      )}

      {activeTab === 'Orders' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Order Status Overview</h3>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card blue"><div className="metric-label">Total Orders</div><div className="metric-value">{loading ? '...' : ordersStats?.total || 0}</div></div>
            <div className="metric-card orange"><div className="metric-label">Pending</div><div className="metric-value">{loading ? '...' : ordersStats?.pending || 0}</div></div>
            <div className="metric-card green"><div className="metric-label">Completed</div><div className="metric-value">{loading ? '...' : ordersStats?.completed || 0}</div></div>
          </div>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card teal"><div className="metric-label">Authorized</div><div className="metric-value">{loading ? '...' : ordersStats?.authorized || 0}</div></div>
            <div className="metric-card purple"><div className="metric-label">Dispatched</div><div className="metric-value">{loading ? '...' : ordersStats?.dispatched || 0}</div></div>
            <div className="metric-card red"><div className="metric-label">Cancelled</div><div className="metric-value">{loading ? '...' : ordersStats?.cancelled || 0}</div></div>
          </div>
        </div>
      )}

      {activeTab === 'Billing Category' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Category Breakdown</h3>
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Billed Amount</th>
                    <th>Paid Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center' }}>Loading...</td></tr>
                  ) : categoryStats.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center' }}>No data found</td></tr>
                  ) : categoryStats.map((cat, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{cat.category}</td>
                      <td>₹{cat.billed.toLocaleString()}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 500 }}>₹{cat.paid.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
