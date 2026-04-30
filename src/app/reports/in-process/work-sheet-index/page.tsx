'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, X, ClipboardList, User } from 'lucide-react';

function WorkSheetContent() {
  const searchParams = useSearchParams();
  const fromDate = searchParams.get('fromDate') || '';
  const toDate = searchParams.get('toDate') || '';
  const fromBill = searchParams.get('fromBill') || '';
  const toBill = searchParams.get('toBill') || '';

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('IMAGEE OWNER');

  useEffect(() => {
    const userRaw = localStorage.getItem('medfile-user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.name) setUserName(user.name);
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    fetch('/api/bills/in-process')
      .then(res => res.json())
      .then(bills => {
        if (Array.isArray(bills)) {
          // Parse dates for filtering
          // fromDate/toDate format is DD-Mon-YYYY
          const parseDateStr = (dStr: string) => {
            if (!dStr) return null;
            const parts = dStr.split('-');
            if (parts.length !== 3) return null;
            const months: Record<string, number> = { 'Jan':0, 'Feb':1, 'Mar':2, 'Apr':3, 'May':4, 'Jun':5, 'Jul':6, 'Aug':7, 'Sep':8, 'Oct':9, 'Nov':10, 'Dec':11 };
            return new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
          };

          const fDate = parseDateStr(fromDate);
          const tDate = parseDateStr(toDate);

          // We'll filter the bills based on fromBill and toBill logic (lexicographical or numeric if possible)
          // For simplicity in UI, we just apply the bills if they exist
          let filtered = bills;
          if (fDate && tDate) {
            // Set tDate to end of day
            tDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(b => {
              const bd = new Date(b.billDate);
              return bd >= fDate && bd <= tDate;
            });
          }
          if (fromBill && toBill) {
            filtered = filtered.filter(b => b.billNumber >= fromBill && b.billNumber <= toBill);
          } else if (fromBill) {
            filtered = filtered.filter(b => b.billNumber >= fromBill);
          } else if (toBill) {
            filtered = filtered.filter(b => b.billNumber <= toBill);
          }

          // Format into individual orders for the worksheet
          const worksheetItems: any[] = [];
          filtered.forEach(b => {
            const dateObj = new Date(b.billDate);
            const shortDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth()+1).toString().padStart(2, '0')}-${dateObj.getFullYear().toString().slice(-2)}`;
            b.orders.forEach((o: any) => {
              worksheetItems.push({
                id: `${b.id}-${o.id}`,
                billNo: b.billNumber,
                patientName: b.patient.name,
                dateStr: shortDate,
                testName: o.orderName
              });
            });
          });

          setData(worksheetItems);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [fromDate, toDate, fromBill, toBill]);

  const handlePrint = () => {
    window.print();
  };

  const handleExit = () => {
    window.close();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', color: '#64748b' }}>
        <div className="loader"></div>
        <style>{`.loader { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="modern-report-wrapper">
      <div className="modern-report-container">
        
        {/* Header Section */}
        <div className="report-header no-print">
          <div className="report-brand">
            <div className="brand-icon"><ClipboardList size={20} /></div>
            <div>
              <h1 className="brand-title">Work Sheet</h1>
              <p className="brand-subtitle">
                WorkSheets Between the dates {fromDate} and {toDate}
              </p>
            </div>
          </div>

          <div className="report-actions">
            <button onClick={handleExit} className="modern-btn btn-secondary">
              <X size={16} /> <span>Close</span>
            </button>
            <button onClick={handlePrint} className="modern-btn btn-primary">
              <Printer size={16} /> <span>Print Work Sheet</span>
            </button>
          </div>
        </div>

        {/* User Badge */}
        <div className="user-badge-section no-print">
          <div className="user-badge">
            <User size={14} className="user-icon" />
            <span>Generated by <strong>{userName}</strong></span>
          </div>
        </div>

        {/* Print Only Header */}
        <div className="print-only-header print-only" style={{ textAlign: 'center', marginBottom: 24, borderBottom: 'none' }}>
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Work Sheet</h2>
          <p>WorkSheets Between the dates {fromDate} and {toDate}</p>
        </div>

        {/* Worksheet Content */}
        <div className="worksheet-card">
          <div className="worksheet-list">
            {data.map((item) => (
              <div key={item.id} className="worksheet-item">
                <div className="item-header">
                  <span className="item-bill">{item.billNo}</span>
                  <span className="item-separator">/</span>
                  <span className="item-patient">{item.patientName}</span>
                  <span className="item-separator">/</span>
                  <span className="item-date">{item.dateStr}</span>
                </div>
                <div className="item-test">{item.testName}</div>
              </div>
            ))}
            
            {data.length === 0 && (
              <div className="empty-state">
                <ClipboardList size={32} />
                <p>No worksheet items found for this range.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        .modern-report-wrapper {
          min-height: 100vh;
          background: #f1f5f9;
          font-family: 'Inter', sans-serif;
          padding: 40px 20px;
          color: #334155;
        }

        .modern-report-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        /* Header */
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          background: #ffffff;
          padding: 20px 24px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }

        .report-brand {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .brand-icon {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .brand-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .brand-subtitle {
          margin: 4px 0 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        /* Buttons */
        .report-actions {
          display: flex;
          gap: 12px;
        }

        .modern-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-secondary:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4);
        }

        /* User Badge */
        .user-badge-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
        }

        .user-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #e0f2fe;
          color: #0369a1;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid #bae6fd;
        }

        .user-icon {
          opacity: 0.8;
        }

        /* Worksheet Items */
        .worksheet-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          border: 1px solid #f1f5f9;
          padding: 32px;
        }

        .worksheet-list {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .worksheet-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 24px;
          border-bottom: 1px dashed #e2e8f0;
        }

        .worksheet-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .item-header {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
        }

        .item-bill {
          color: #0369a1;
        }

        .item-patient {
          color: #0f172a;
        }

        .item-date {
          color: #64748b;
          font-weight: 600;
        }

        .item-separator {
          color: #cbd5e1;
        }

        .item-test {
          font-size: 15px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
        }

        /* Empty State */
        .empty-state {
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          gap: 12px;
        }

        .empty-state p {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
        }

        .print-only {
          display: none;
        }

        /* Print Styles */
        @media print {
          @page { margin: 15mm; }
          
          .no-print { display: none !important; }
          .print-only { display: block !important; }

          .modern-report-wrapper {
            background: transparent !important;
            padding: 0 !important;
            color: #0f172a !important;
          }

          .print-only-header {
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
          }

          .print-only-header h2 {
            margin: 0 0 8px 0;
            font-size: 24px;
            color: #0f172a;
          }

          .print-only-header p {
            margin: 0;
            font-size: 14px;
            color: #64748b;
          }

          .worksheet-card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            padding: 24px !important;
          }

          .item-bill {
            color: #0369a1 !important;
          }
          
          .item-patient {
            color: #0f172a !important;
          }
          
          .item-date, .item-separator {
            color: #64748b !important;
          }
          
          .item-test {
            color: #334155 !important;
          }

          .worksheet-item {
            border-bottom: 1px dashed #cbd5e1 !important;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

export default function WorkSheetIndexPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkSheetContent />
    </Suspense>
  );
}
