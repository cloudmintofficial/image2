'use client';

import React, { useState, useEffect } from 'react';

interface PreviousBill {
  id: number;
  billNo: number;
  date: string;
  patient: string;
  patientDetails: string;
  orders: string;
  status: string;
}

export default function PreviousBillsPage() {
  const [showSearch, setShowSearch] = useState(false);
  const [bills, setBills] = useState<PreviousBill[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter state
  const [filters, setFilters] = useState({
    billNo: '',
    orderName: '',
    patientName: '',
    umr: '',
    phone: '',
    fromDate: '',
    toDate: '',
    cancelled: false
  });

  const fetchBills = async () => {
    try {
      setLoading(true);
      // Build query string
      const params = new URLSearchParams();
      if (filters.billNo) params.append('billNo', filters.billNo);
      if (filters.orderName) params.append('orderName', filters.orderName);
      if (filters.patientName) params.append('patientName', filters.patientName);
      if (filters.umr) params.append('umr', filters.umr);
      if (filters.phone) params.append('phone', filters.phone);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.cancelled) params.append('cancelled', 'true');

      const res = await fetch(`/api/bills/previous?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch bills');
      
      const data = await res.json();
      setBills(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []); // Initial load

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchBills();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Previous Bills</h1>
          <p className="page-subtitle">Historical record of all past bills</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            className={`btn ${showSearch ? 'btn-primary' : 'btn-outline'} btn-sm`} 
            onClick={() => setShowSearch(!showSearch)}
          >
            🔍 Search
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => alert('Coming soon')}>ShiftCollectionDetailed</button>
          <button className="btn btn-outline btn-sm" onClick={() => alert('Coming soon')}>ShiftCollection</button>
          <button className="btn btn-outline btn-sm" onClick={() => alert('Coming soon')}>SummaryReport</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {showSearch && (
          <div className="card" style={{ minWidth: 240, height: 'fit-content' }}>
            <div className="card-header"><span className="card-title" style={{ fontSize: 14 }}>Search Filters</span></div>
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <input className="form-input" name="billNo" value={filters.billNo} onChange={handleFilterChange} placeholder="Bill No." style={{ fontSize: 13 }} />
                </div>
                <div className="form-group">
                  <input className="form-input" name="orderName" value={filters.orderName} onChange={handleFilterChange} placeholder="Order Name" style={{ fontSize: 13 }} />
                </div>
                <div className="form-group">
                  <input className="form-input" name="patientName" value={filters.patientName} onChange={handleFilterChange} placeholder="Patient Name" style={{ fontSize: 13 }} />
                </div>
                <div className="form-group">
                  <input className="form-input" name="umr" value={filters.umr} onChange={handleFilterChange} placeholder="UMR/Card" style={{ fontSize: 13 }} />
                </div>
                <div className="form-group">
                  <input className="form-input" name="phone" value={filters.phone} onChange={handleFilterChange} placeholder="Primary Phone" style={{ fontSize: 13 }} />
                </div>
                
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <input className="form-input" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} type="date" style={{ fontSize: 12 }} />
                  </div>
                  <div className="form-group">
                    <input className="form-input" name="toDate" value={filters.toDate} onChange={handleFilterChange} type="date" style={{ fontSize: 12 }} />
                  </div>
                </div>
                
                <label style={{ display: 'flex', gap: 6, fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" name="cancelled" checked={filters.cancelled} onChange={handleFilterChange} /> Cancelled
                </label>
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Search</button>
              </form>
            </div>
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bill No</th>
                    <th>Bill Date</th>
                    <th>Patient</th>
                    <th>Orders</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center p-4">Loading bills...</td></tr>
                  ) : bills.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-4">No bills found</td></tr>
                  ) : (
                    bills.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 600 }}>{row.billNo}</td>
                        <td style={{ fontSize: 13 }}>{formatDate(row.date)}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{row.patient}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.patientDetails}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>{row.orders}</td>
                        <td>
                          {row.status === 'Cancelled' ? (
                            <span className="badge badge-danger">Cancelled</span>
                          ) : (
                            <span className="badge badge-info">{row.status}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
