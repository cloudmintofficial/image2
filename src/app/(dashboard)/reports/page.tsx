'use client';

import React, { useState, useEffect } from 'react';

const reportTypes = [
  'Summary Report', 'Shift Collection', 'Bill Reports', 'Collection Reports', 'Doctor Reports',
  'Order Smry Report', 'OP Smry Report', 'Card Reports', 'Inventory Reports', 'Doctor Wise Smry'
];

export default function ReportsPage() {
  const [active, setActive] = useState('Summary Report');
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setData(null); // Clear stale data to prevent mapping errors across different tab shapes
    try {
      let endpoint = '';
      if (active === 'Shift Collection') endpoint = '/api/reports/shift-collection';
      else if (active === 'Summary Report') endpoint = '/api/reports/summary-report';
      
      if (!endpoint) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${endpoint}?fromDate=${fromDate}&toDate=${toDate}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setData({ error: 'Failed to fetch report' });
      }
    } catch (err) {
      console.error(err);
      setData({ error: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [active, fromDate, toDate]);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Reports</h1><p className="page-subtitle">Generate and view lab reports</p></div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div className="card" style={{ minWidth: 220, height: 'fit-content' }}>
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
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>From Date</label>
                <input type="date" className="form-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>To Date</label>
                <input type="date" className="form-input" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <button className="btn btn-primary" style={{ alignSelf: 'flex-end', height: 42 }} onClick={fetchReport}>Generate</button>
            </div>
          </div>

          <div className="card">
            {loading ? (
              <div className="card-body" style={{ textAlign: 'center', padding: 60 }}>Loading report data...</div>
            ) : !data || data.error ? (
              <div className="card-body" style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
                <h3>{active}</h3><p>{data?.error || 'Report generation interface coming soon'}</p>
              </div>
            ) : active === 'Summary Report' ? (
              <div className="card-body p-6">
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Summary Report</h3>
                <div className="metric-grid">
                  <div className="metric-card blue"><div className="metric-label">Total Bills</div><div className="metric-value">{data.billCount}</div></div>
                  <div className="metric-card orange"><div className="metric-label">Total Billed</div><div className="metric-value">₹{data.totalBilled.toLocaleString()}</div></div>
                  <div className="metric-card red"><div className="metric-label">Total Discount</div><div className="metric-value">₹{data.totalDiscount.toLocaleString()}</div></div>
                  <div className="metric-card green"><div className="metric-label">Net Amount</div><div className="metric-value">₹{data.netAmount.toLocaleString()}</div></div>
                  <div className="metric-card teal"><div className="metric-label">Total Paid</div><div className="metric-value">₹{data.totalPaid.toLocaleString()}</div></div>
                  <div className="metric-card purple"><div className="metric-label">Total Balance</div><div className="metric-value">₹{data.totalBalance.toLocaleString()}</div></div>
                </div>
              </div>
            ) : active === 'Shift Collection' ? (
              <div className="card-body p-6">
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Shift Collection Summary</h3>
                <div className="data-table-container mb-6">
                  <table className="data-table">
                    <thead><tr><th>User</th><th>Total Collected</th><th>Cash</th><th>Card</th><th>UPI</th><th>Online</th></tr></thead>
                    <tbody>
                      {data?.summary?.map((s: any) => (
                        <tr key={s.user}>
                          <td style={{ fontWeight: 600 }}>{s.user}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{s.total.toLocaleString()}</td>
                          <td>₹{(s.methods['Cash'] || 0).toLocaleString()}</td>
                          <td>₹{(s.methods['Card'] || 0).toLocaleString()}</td>
                          <td>₹{(s.methods['UPI'] || 0).toLocaleString()}</td>
                          <td>₹{(s.methods['Online'] || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {(!data?.summary || data.summary.length === 0) && <tr><td colSpan={6} className="text-center">No collections found</td></tr>}
                    </tbody>
                  </table>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Detailed Collection</h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Bill No</th><th>Patient</th><th>Method</th><th>Amount</th><th>Collected By</th></tr></thead>
                    <tbody>
                      {data?.detailed?.map((d: any) => (
                        <tr key={d.id}>
                          <td style={{ fontSize: 13 }}>{new Date(d.date).toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{d.billNo}</td>
                          <td>{d.patient}</td>
                          <td><span className="badge badge-info">{d.method}</span></td>
                          <td style={{ fontWeight: 600 }}>₹{d.amount.toLocaleString()}</td>
                          <td>{d.receivedBy}</td>
                        </tr>
                      ))}
                      {(!data?.detailed || data.detailed.length === 0) && <tr><td colSpan={6} className="text-center">No collections found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
