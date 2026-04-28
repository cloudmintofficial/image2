'use client';

import React, { useState } from 'react';

const demoData = [
  { billNo: 964, date: '27-Apr-2026 11:04 AM', patient: 'MRS SRUTHI', orders: 'USG ABDOMEN AND PELVIS' },
  { billNo: 963, date: '27-Apr-2026 11:04 AM', patient: 'MR GOTTIMUKKALA ASHOK CHARY', orders: 'USG DOPPLER STUDY x2' },
  { billNo: 962, date: '27-Apr-2026 11:02 AM', patient: 'MR SHIVA TEJA', orders: 'CT KUB' },
  { billNo: 961, date: '27-Apr-2026 10:42 AM', patient: 'MRS NEERAJA', orders: 'USG ABD+PELVIS, RBS, TSH, CBP' },
  { billNo: 960, date: '27-Apr-2026 09:59 AM', patient: 'MR RAGHAVENDRA', orders: 'ECG' },
  { billNo: 959, date: '27-Apr-2026 09:56 AM', patient: 'MR KIRAN', orders: 'USG PENILE DOPPLER' },
  { billNo: 958, date: '26-Apr-2026 08:50 PM', patient: 'MR MOHAMMAD AKBAR', orders: 'X-RAY LUMBER SPINE AP/LAT' },
  { billNo: 957, date: '26-Apr-2026 08:30 PM', patient: 'MR CHAITANYA', orders: 'CT BRAIN, X-RAY WRIST' },
  { billNo: 956, date: '26-Apr-2026 02:37 PM', patient: 'MRS KRUPA', orders: 'USG ABDOMEN AND PELVIS' },
  { billNo: 955, date: '26-Apr-2026 01:53 PM', patient: 'MRS SWETHA', orders: 'USG EARLY PREGNANCY' },
];

export default function PreviousBillsPage() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Previous Bills</h1>
          <p className="page-subtitle">Historical record of all past bills</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowSearch(!showSearch)}>🔍 Search</button>
          <button className="btn btn-outline btn-sm">ShiftCollectionDetailed</button>
          <button className="btn btn-outline btn-sm">ShiftCollection</button>
          <button className="btn btn-outline btn-sm">SummaryReport</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {showSearch && (
          <div className="card" style={{ minWidth: 240 }}>
            <div className="card-header"><span className="card-title" style={{ fontSize: 14 }}>Search Filters</span></div>
            <div className="card-body">
              {['Bill No.', 'Order Name', 'Patient Name', 'UMR/Card', 'Primary Phone', 'ExternalId'].map(f => (
                <div className="form-group" key={f}><input className="form-input" placeholder={f} style={{ fontSize: 13 }} /></div>
              ))}
              <div className="form-row form-row-2">
                <div className="form-group"><input className="form-input" type="date" style={{ fontSize: 12 }} /></div>
                <div className="form-group"><input className="form-input" type="date" style={{ fontSize: 12 }} /></div>
              </div>
              <label style={{ display: 'flex', gap: 6, fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}><input type="checkbox" /> Cancelled</label>
              <button className="btn btn-primary" style={{ width: '100%' }}>Search</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Bill No</th><th>Bill Date</th><th>Patient</th><th>Orders</th></tr></thead>
                <tbody>
                  {demoData.map(row => (
                    <tr key={row.billNo}>
                      <td style={{ fontWeight: 600 }}>{row.billNo}</td>
                      <td style={{ fontSize: 13 }}>{row.date}</td>
                      <td style={{ fontWeight: 500 }}>{row.patient}</td>
                      <td style={{ fontSize: 13 }}>{row.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
