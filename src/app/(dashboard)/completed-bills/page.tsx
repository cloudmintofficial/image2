'use client';

import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PrintableBill } from '@/components/PrintableBill';

interface CompletedBill {
  billNo: number;
  date: string;
  patient: string;
  age: number | string;
  gender: string;
  phone: string;
  orders: string;
  balance: number;
  rawBill: any;
}

export default function CompletedBillsPage() {
  const [data, setData] = useState<CompletedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, discount: 0, discountReason: '', paymentMethod: 'Cash', isPercentage: false });
  const [printBillData, setPrintBillData] = useState<any>(null);

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bill-${printBillData?.billNo || 'Invoice'}`,
    onAfterPrint: () => setPrintBillData(null),
  });

  // Automatically trigger print when printBillData is set
  React.useEffect(() => {
    if (printBillData && printRef.current) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [printBillData, handlePrint]);

  const fetchCompletedBills = () => {
    setLoading(true);
    fetch('/api/bills/completed')
      .then(res => res.json())
      .then(bills => {
        if (Array.isArray(bills)) {
          const formatted = bills.map((b: any) => ({
            id: b.id, // need the id for api calls
            billNo: b.billNumber,
            date: new Date(b.billDate).toLocaleDateString('en-GB'),
            patient: b.patient.name,
            age: b.patient.age || '-',
            gender: b.patient.gender || 'M',
            phone: b.patient.phone || '-',
            orders: b.orders.map((o: any) => o.orderName).join(', '),
            balance: b.balance,
            rawBill: b
          }));
          setData(formatted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchCompletedBills();
  }, []);

  const handlePaymentSubmit = async () => {
    const selectedBill = data.find(d => d.billNo === showPayment);
    if (!selectedBill) return;

    let discountAmount = paymentForm.discount;
    if (paymentForm.isPercentage) {
      discountAmount = (selectedBill.balance * paymentForm.discount) / 100;
    }

    try {
      const res = await fetch(`/api/bills/${selectedBill.rawBill.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentAmount: paymentForm.amount,
          discount: discountAmount,
          discountReason: paymentForm.discountReason,
          paymentMethod: paymentForm.paymentMethod
        })
      });

      if (!res.ok) throw new Error('Payment failed');

      setShowPayment(null);
      setPaymentForm({ amount: 0, discount: 0, discountReason: '', paymentMethod: 'Cash', isPercentage: false });
      fetchCompletedBills();
      alert('Payment successful!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const selectedBill = data.find(d => d.billNo === showPayment);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Completed Bills</h1>
        <p className="page-subtitle">View and manage finalized orders</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Bills {loading ? '(Loading...)' : `(${data.length})`}</span>
        </div>

        <div className="data-table-container desktop-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Actions</th>
                <th>Bill Number</th>
                <th>Bill Date</th>
                <th>Patient Details</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.billNo}>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => row.balance > 0 ? setShowPayment(row.billNo) : null}
                      >
                        {row.balance > 0 ? 'Bill Payment' : 'Bill Details'}
                      </button>
                      <button className="btn btn-info btn-sm" onClick={() => setPrintBillData(row.rawBill)}>Print Bill</button>
                      <button className="btn btn-success btn-sm" onClick={() => window.open(`/in-process?bill=${row.billNo}`, '_blank')}>Orders List</button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.billNo}</td>
                  <td>{row.date}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.patient}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {row.age}/ {row.gender} · {row.phone}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{row.orders}</td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No completed bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-cards" style={{ padding: 16, display: 'none' }}>
          {data.map(row => (
            <div key={row.billNo} className="card" style={{ marginBottom: 12 }}>
              <div className="card-body" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>#{row.billNo}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.date}</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{row.patient}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{row.age}/{row.gender} · {row.phone}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{row.orders}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }}>{row.balance > 0 ? 'Payment' : 'Details'}</button>
                  <button className="btn btn-info btn-sm" style={{ flex: 1 }} onClick={() => setPrintBillData(row.rawBill)}>Print</button>
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => window.open(`/in-process?bill=${row.billNo}`, '_blank')}>Orders</button>
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No completed bills found.
            </div>
          )}
        </div>

        <style>{`
          @media (max-width: 767px) {
            .desktop-table { display: none !important; }
            .mobile-cards { display: block !important; }
          }
        `}</style>
      </div>

      {/* Bill Payment Modal */}
      {showPayment && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPayment(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bill Payment — #{selectedBill.billNo}</h3>
              <button className="modal-close" onClick={() => setShowPayment(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Billed Amount:</span>
                <span style={{ fontWeight: 700, marginLeft: 8, fontSize: 18 }}>₹{selectedBill.rawBill.totalBill}</span>
              </div>
              <div className="form-group">
                <label className="form-label">Overall Discount</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="form-input" type="number" min={0} value={paymentForm.discount} onChange={e => setPaymentForm({...paymentForm, discount: parseFloat(e.target.value) || 0})} style={{ width: 120 }} />
                  <label style={{ fontSize: 13, display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input type="checkbox" checked={paymentForm.isPercentage} onChange={e => setPaymentForm({...paymentForm, isPercentage: e.target.checked})} /> %
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason For Discount</label>
                <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={paymentForm.discountReason} onChange={e => setPaymentForm({...paymentForm, discountReason: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Paid till now:</span>
                <span style={{ fontWeight: 600 }}>₹{selectedBill.rawBill.paidAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Balance:</span>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{selectedBill.balance}</span>
              </div>
              <div className="form-group">
                <label className="form-label">Amount paid now</label>
                <input className="form-input" type="number" min={0} max={selectedBill.balance} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-input form-select" value={paymentForm.paymentMethod} onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}>
                  <option>Cash</option><option>Card</option><option>UPI</option><option>Online</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handlePaymentSubmit}>Submit</button>
              <button className="btn btn-outline" onClick={() => setPaymentForm({...paymentForm, amount: 0, discount: 0})}>Clear</button>
              <button className="btn btn-ghost" onClick={() => setShowPayment(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable component */}
      <div style={{ display: 'none' }}>
        <PrintableBill ref={printRef} bill={printBillData} />
      </div>
    </div>
  );
}
