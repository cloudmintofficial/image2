'use client';

import React from 'react';

interface InProcessBill {
  billNo: number;
  date: string;
  patient: string;
  phone: string;
  ageGender: string;
  orders: string;
  status: string;
  rawOrders: any[];
}

export default function InProcessPage() {
  const [data, setData] = React.useState<InProcessBill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedBill, setSelectedBill] = React.useState<InProcessBill | null>(null);
  const [resultInput, setResultInput] = React.useState<{ [key: number]: string }>({});

  const fetchBills = () => {
    fetch('/api/bills/in-process')
      .then(res => res.json())
      .then(bills => {
        if (Array.isArray(bills)) {
          const formatted = bills.map((b: any) => {
            const hasEntered = b.orders.some((o: any) => o.resultStatus === 'Entered');
            return {
              billNo: b.billNumber,
              date: new Date(b.billDate).toLocaleDateString('en-GB'),
              patient: b.patient.name,
              phone: b.patient.phone || '-',
              ageGender: `${b.patient.age || '-'}/ ${b.patient.gender}`,
              orders: b.orders.map((o: any) => o.orderName).join(', '),
              status: hasEntered ? 'entered' : 'pending',
              rawOrders: b.orders
            };
          });
          setData(formatted);
          if (selectedBill) {
             const updated = formatted.find((f: any) => f.billNo === selectedBill.billNo);
             setSelectedBill(updated || null);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchBills();
  }, []);

  const handleSaveResult = async (orderId: number) => {
    const val = resultInput[orderId];
    if (!val) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultData: val, resultStatus: 'Entered' })
      });
      if (res.ok) {
        alert('Result saved!');
        fetchBills(); // Refresh to see status changes (could remove bill from list if completed)
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save result');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">In Process</h1>
        <p className="page-subtitle">Track active lab orders being processed</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Active Orders {loading ? '(Loading...)' : `(${data.length})`}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm">Non Financial Report</button>
            <button className="btn btn-outline btn-sm">WorkSheet</button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="data-table-container desktop-table">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Bill Number</th>
                <th>Bill Date</th>
                <th>Patient Name</th>
                <th>Phone</th>
                <th>Age/Gender</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.billNo} className={row.status === 'pending' ? 'row-pending' : ''}>
                  <td><button className="btn btn-success btn-sm" onClick={() => setSelectedBill(row)}>Orders List</button></td>
                  <td style={{ fontWeight: 600 }}>{row.billNo}</td>
                  <td>{row.date}</td>
                  <td style={{ fontWeight: 500 }}>{row.patient}</td>
                  <td>{row.phone}</td>
                  <td>{row.ageGender}</td>
                  <td style={{ maxWidth: 300, fontSize: 13 }}>{row.orders}</td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No active orders in process.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-cards" style={{ padding: 16, display: 'none' }}>
          {data.map(row => (
            <div key={row.billNo} className="card" style={{ marginBottom: 12, border: `2px solid ${row.status === 'pending' ? 'var(--success)' : 'var(--border)'}` }}>
              <div className="card-body" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>#{row.billNo}</span>
                  <span className={`badge ${row.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                    {row.status === 'pending' ? 'Pending' : 'Entered'}
                  </span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{row.patient}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{row.ageGender} · {row.phone}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{row.orders}</div>
                <button className="btn btn-success btn-sm" style={{ width: '100%' }} onClick={() => setSelectedBill(row)}>View Orders</button>
              </div>
            </div>
          ))}
          {data.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              No active orders in process.
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

      {selectedBill && (
        <div className="modal-overlay" onClick={() => setSelectedBill(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>Orders List — #{selectedBill.billNo}</h3>
              <button className="modal-close" onClick={() => setSelectedBill(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16, display: 'flex', gap: 16, fontSize: 14 }}>
                <div><strong>Patient:</strong> {selectedBill.patient}</div>
                <div><strong>Age/Gender:</strong> {selectedBill.ageGender}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selectedBill.rawOrders.map(order => (
                  <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontWeight: 600 }}>{order.orderName}</span>
                      <span className={`badge ${order.resultStatus === 'Pending' ? 'badge-warning' : 'badge-success'}`}>
                        {order.resultStatus}
                      </span>
                    </div>
                    
                    {order.resultStatus === 'Pending' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea 
                          className="form-input" 
                          rows={3} 
                          placeholder="Enter test result values or narrative here..."
                          value={resultInput[order.id] || ''}
                          onChange={e => setResultInput(prev => ({ ...prev, [order.id]: e.target.value }))}
                        />
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ alignSelf: 'flex-end' }}
                          onClick={() => handleSaveResult(order.id)}
                        >
                          Save Result
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: 'var(--surface-hover)', padding: 12, borderRadius: 6, fontSize: 14 }}>
                        {order.resultData || 'No result data provided.'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedBill(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
