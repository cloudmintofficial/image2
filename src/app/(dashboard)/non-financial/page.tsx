'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, ArrowRight } from 'lucide-react';

export default function NonFinancialConfigPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Set default dates to today
  useEffect(() => {
    const today = new Date();
    const formatted = today.toISOString().split('T')[0];
    setFromDate(formatted);
    setToDate(formatted);
  }, []);

  useEffect(() => {
    const handleAction = (e: any) => {
      if (e.detail === 'Clear') {
        const today = new Date().toISOString().split('T')[0];
        setFromDate(today);
        setToDate(today);
      } else if (e.detail === 'Get Report') {
        
        // Convert YYYY-MM-DD to DD-Mon-YYYY safely
        const formatDateForReport = (dateStr: string) => {
          if (!dateStr) return '';
          const [year, month, day] = dateStr.split('-');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${day}-${months[parseInt(month) - 1]}-${year}`;
        };

        const query = new URLSearchParams({
          fromDate: formatDateForReport(fromDate),
          toDate: formatDateForReport(toDate)
        }).toString();
        window.open(`/reports/in-process/non-financial?${query}`, '_blank');
      }
    };

    window.addEventListener('topnav-action', handleAction);
    return () => window.removeEventListener('topnav-action', handleAction);
  }, [fromDate, toDate]);

  return (
    <div className="worksheet-container">
      <div className="worksheet-header">
        <h1 className="worksheet-title">Non-Financial Report Configuration</h1>
        <p className="worksheet-subtitle">Select date range to generate the non-financial report</p>
      </div>

      <div className="worksheet-card">
        <div className="card-top-accent" style={{ background: 'linear-gradient(90deg, #3b82f6, #2563eb)' }}></div>
        <div className="card-inner">
          <div className="card-heading">
            <div className="heading-icon" style={{ background: '#eff6ff', color: '#3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}>
              <FileText size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2>Filter Parameters</h2>
              <p>Define the scope of the report</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-section">
              <div className="section-label">Date Range</div>
              <div className="input-row">
                <div className="input-group">
                  <label>From Date</label>
                  <div className="input-wrapper">
                    <Calendar className="input-icon" size={16} />
                    <input 
                      type="date" 
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="input-separator">
                  <ArrowRight size={16} />
                </div>

                <div className="input-group">
                  <label>To Date</label>
                  <div className="input-wrapper">
                    <Calendar className="input-icon" size={16} />
                    <input 
                      type="date" 
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="action-hint">
            <div className="hint-indicator"></div>
            <p>Click <strong>Get Report</strong> in the top navigation bar when you are ready to generate.</p>
          </div>
        </div>
      </div>

      <style>{`
        .worksheet-container { padding: 40px; max-width: 900px; margin: 0 auto; animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .worksheet-header { margin-bottom: 32px; text-align: center; }
        .worksheet-title { font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px 0; letter-spacing: -0.5px; }
        .worksheet-subtitle { font-size: 15px; color: var(--text-secondary); margin: 0; }
        .worksheet-card { background: var(--bg-card, #ffffff); border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; position: relative; border: 1px solid var(--border-color, #f1f5f9); }
        .card-top-accent { height: 6px; width: 100%; }
        .card-inner { padding: 40px; }
        .card-heading { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .heading-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .card-heading h2 { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: var(--text-primary); }
        .card-heading p { margin: 0; font-size: 13px; color: var(--text-muted, #64748b); font-weight: 500; }
        .form-grid { display: flex; flex-direction: column; gap: 32px; }
        .form-section { display: flex; flex-direction: column; gap: 16px; }
        .section-label { font-size: 14px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 12px; }
        .input-row { display: flex; align-items: center; gap: 20px; }
        .input-separator { color: #cbd5e1; padding-top: 24px; }
        .input-group { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; }
        .input-wrapper input { width: 100%; padding: 12px 14px 12px 40px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-weight: 500; color: var(--text-primary); background: #f8fafc; transition: all 0.2s ease; font-family: inherit; }
        .input-wrapper input:focus { outline: none; border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .action-hint { margin-top: 40px; padding: 16px 20px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; gap: 12px; border: 1px solid #e2e8f0; }
        .hint-indicator { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
        .action-hint p { margin: 0; font-size: 14px; color: #475569; }
        .action-hint strong { color: #0f172a; }
      `}</style>
    </div>
  );
}
