'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, RefreshCw, Edit, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function InProcessPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'list' | 'bill' | 'result'>('list');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchDate, setDispatchDate] = useState('');
  const [dispatchTime, setDispatchTime] = useState('');
  
  const [resultInput, setResultInput] = useState('');
  const [resultMethod, setResultMethod] = useState('');
  const [resultDoctor, setResultDoctor] = useState('');
  const [resultAdvice, setResultAdvice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState<any>({});
  
  const [doctorSearchText, setDoctorSearchText] = useState('');
  const [doctorSuggestions, setDoctorSuggestions] = useState<any[]>([]);
  const [isSearchingDoctor, setIsSearchingDoctor] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    try {
      // Add cache: 'no-store' to prevent browser/Next.js caching of the API response
      const res = await fetch('/api/bills/in-process?t=' + Date.now(), { cache: 'no-store' });
      const bills = await res.json();
      if (Array.isArray(bills)) {
        const formatted = bills.map((b: any) => {
          const isCompleted = b.orders.length > 0 && b.orders.every((o: any) => o.resultStatus === 'Completed' || o.resultStatus === 'Verified');
          return {
            id: b.id,
            billNo: b.billNumber,
            date: new Date(b.billDate).toLocaleDateString('en-GB'),
            patient: b.patient.name,
            phone: b.patient.phone || '-',
            ageGender: `${b.patient.age || '-'}/ ${b.patient.gender}`,
            orders: b.orders.map((o: any) => o.orderName).join(', '),
            rawOrders: b.orders,
            patientObj: b.patient,
            doctor: b.doctor,
            isCompleted
          };
        });
        
        setData(formatted);
        
        // Use functional state updates to avoid stale closures
        setSelectedBill((prevBill: any) => {
          if (!prevBill) return null;
          const updated = formatted.find(f => f.billNo === prevBill.billNo);
          return updated || null;
        });

        setSelectedOrder((prevOrder: any) => {
          if (!prevOrder) return null;
          const updatedBill = formatted.find(f => f.id === prevOrder.billId);
          if (updatedBill) {
            return updatedBill.rawOrders.find((o:any) => o.id === prevOrder.id) || null;
          }
          return null;
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();

    const now = new Date();
    setDispatchDate(now.toISOString().split('T')[0]);
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    setDispatchTime(`${hours}:${now.getMinutes().toString().padStart(2, '0')}${ampm}`);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (doctorSearchText.length >= 2) {
        setIsSearchingDoctor(true);
        try {
          const res = await fetch(`/api/doctors?search=${encodeURIComponent(doctorSearchText)}`);
          if (res.ok) {
            const data = await res.json();
            setDoctorSuggestions(data);
          }
        } catch (e) {
        } finally {
          setIsSearchingDoctor(false);
        }
      } else {
        setDoctorSuggestions([]);
      }
    };
    const timeoutId = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(timeoutId);
  }, [doctorSearchText]);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail === 'Non Financial Report') {
        router.push('/non-financial');
      } else if (e.detail === 'Non Financial Status Report') {
        router.push('/non-financial-status');
      } else if (e.detail === 'Online Request Sample Status') {
        router.push('/online-request-sample-status');
      } else if (e.detail === 'WorkSheet') {
        router.push('/work-sheet');
      } else {
        alert(`${e.detail} coming soon`);
      }
    };
    window.addEventListener('topnav-action', handler);
    return () => window.removeEventListener('topnav-action', handler);
  }, [router]);

  const handleSaveResult = async (markComplete: boolean) => {
    if (!selectedOrder) return;
    setIsSaving(true);
    const newStatus = markComplete ? 'Completed' : 'Entered';
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resultData: resultInput, 
          resultStatus: newStatus,
          resultMethod,
          resultDoctor,
          resultAdvice
        })
      });
      if (res.ok) {
        await fetchBills();
        if (markComplete) {
          setViewMode('bill');
        } else {
          alert('Saved as draft.');
        }
      }
    } catch (e) {
      alert('Failed to save result');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedBill) return;
    try {
      const res = await fetch(`/api/bills/${selectedBill.id}/dispatch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchDate, dispatchTime })
      });
      if (res.ok) {
        setShowDispatchModal(false);
        setViewMode('list');
        fetchBills(); 
      } else {
        alert('Failed to dispatch bill');
      }
    } catch (e) {
      alert('Network error while dispatching');
    }
  };

  const handleUpdatePatientDetails = async () => {
    if (!selectedBill) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bills/${selectedBill.id}/patient-details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPatientForm)
      });
      if (res.ok) {
        await fetchBills();
        setIsEditingPatient(false);
      } else {
        alert('Failed to update patient details');
      }
    } catch (e) {
      alert('Error saving patient details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {viewMode !== 'list' && <style>{`.topnav-actions-list { display: none !important; }`}</style>}
      
      {viewMode === 'list' && (
        <>
          <div className="page-header">
            <h1 className="page-title">In Process</h1>
            <p className="page-subtitle">Track active lab orders being processed</p>
          </div>
          <div className="card">
            <div className="card-header" style={{ padding: 12 }}>
              <span style={{ fontWeight: 600 }}>Active Orders</span>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}></th>
                    <th>Bill Number</th>
                    <th>Bill Date</th>
                    <th>Patient Name</th>
                    <th>Phone Number</th>
                    <th>Age/Gender</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.billNo}>
                      <td>
                        <button 
                          className={`btn btn-sm ${row.isCompleted ? 'btn-success' : 'btn-danger'}`} 
                          style={{ padding: '4px 12px', background: row.isCompleted ? '#27ae60' : '#e74c3c', color: '#fff', border: 'none' }}
                          onClick={() => { setSelectedBill(row); setViewMode('bill'); }}
                        >
                          Orders List
                        </button>
                      </td>
                      <td style={{ color: row.isCompleted ? '#27ae60' : 'inherit', fontWeight: row.isCompleted ? 600 : 'normal' }}>{row.billNo}</td>
                      <td style={{ color: row.isCompleted ? '#27ae60' : 'inherit', fontWeight: row.isCompleted ? 600 : 'normal' }}>{row.date}</td>
                      <td style={{ color: row.isCompleted ? '#27ae60' : 'inherit', fontWeight: row.isCompleted ? 600 : 'normal' }}>{row.patient}</td>
                      <td style={{ color: row.isCompleted ? '#27ae60' : 'inherit', fontWeight: row.isCompleted ? 600 : 'normal' }}>{row.phone}</td>
                      <td style={{ color: row.isCompleted ? '#27ae60' : 'inherit', fontWeight: row.isCompleted ? 600 : 'normal' }}>{row.ageGender}</td>
                      <td style={{ color: row.isCompleted ? '#27ae60' : 'inherit', fontWeight: row.isCompleted ? 600 : 'normal' }}>{row.orders}</td>
                    </tr>
                  ))}
                  {data.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>No orders found</td>
                    </tr>
                  )}
                  {loading && data.length === 0 && (
                     <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}><Loader2 className="animate-spin" /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewMode === 'bill' && selectedBill && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Local Top Nav for Bill Orders */}
          <div style={{ display: 'flex', gap: 12, background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewMode('list')}><ArrowLeft size={14} /> Back To Bills</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewMode('edit')}><Edit size={14} /> Edit Patient Details</button>
            <button className="btn btn-ghost btn-sm" disabled={!selectedBill.isCompleted} onClick={() => setShowDispatchModal(true)}>
              <Send size={14} /> Dispatch
            </button>
            <button className="btn btn-ghost btn-sm" onClick={fetchBills}><RefreshCw size={14} /> Refresh Bill</button>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid var(--border-color)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, rgba(249,115,22,0.05), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                  {selectedBill.patient?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedBill.patient}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>{selectedBill.patientObj?.gender === 'M' ? 'Male' : selectedBill.patientObj?.gender === 'F' ? 'Female' : selectedBill.patientObj?.gender || '—'}</span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }}></span>
                    <span>{selectedBill.patientObj?.age ? `${selectedBill.patientObj?.age} Years` : '—'}</span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }}></span>
                    <span>{selectedBill.phone || '—'}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bill Number</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>#{selectedBill.billNo}</div>
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
               <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>UMR Number</span>
                  <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: '#f97316' }}>{selectedBill.patientObj?.umr || '—'}</div>
               </div>
               <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Assigned Doctor</span>
                  <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedBill.doctor?.name || 'No Doctor Assigned'}</div>
               </div>
               <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Source</span>
                  <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedBill.patientObj?.source || '—'}</div>
               </div>
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', marginTop: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Group Number</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Orders</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date Taken</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sample Type</th>
                  </tr>
                </thead>
              <tbody>
                {selectedBill.rawOrders.map((o: any, idx: number) => {
                  const isCompleted = o.resultStatus === 'Completed' || o.resultStatus === 'Verified';
                  return (
                    <tr key={o.id}>
                      <td style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '12px 16px' }}>
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '6px 16px', background: isCompleted ? '#22c55e' : '#f97316', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12, boxShadow: isCompleted ? '0 4px 12px rgba(34,197,94,0.2)' : '0 4px 12px rgba(249,115,22,0.2)' }}
                          onClick={() => {
                            setSelectedOrder(o);
                            setResultInput(o.resultData || '');
                            setResultMethod(o.resultMethod || '');
                            setResultDoctor(o.resultDoctor || 'Select Service Doctor');
                            setResultAdvice(o.resultAdvice || '');
                            setViewMode('result');
                          }}
                        >
                          {isCompleted ? 'View Result' : 'Result Entry'}
                        </button>
                        <span style={{ border: '1px solid var(--border-color)', background: '#f8fafc', padding: '2px 8px', borderRadius: 6, fontWeight: 500, color: 'var(--text-secondary)' }}>{idx + 1}</span>
                      </td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{o.orderName}</td>
                      <td style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f1f5f9', padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {new Date(o.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit', hour12: true })}
                        <button style={{ padding: '4px 10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#cbd5e1'} onMouseLeave={e => e.currentTarget.style.background = '#e2e8f0'}>Edit Dates</button>
                      </td>
                      <td style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 16px', color: 'var(--text-secondary)' }}>--</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </div>

          {showDispatchModal && (
            <div className="modal-overlay">
              <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-header" style={{ background: '#d35400', color: '#fff' }}>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: 16 }}>Bill Payment</h3>
                  <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowDispatchModal(false)}>✕</button>
                </div>
                <div className="modal-body" style={{ padding: 32, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Bill Date:</strong>
                  <input type="date" className="form-input" style={{ width: 140 }} value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} />
                  <input type="text" className="form-input" style={{ width: 100 }} value={dispatchTime} onChange={e => setDispatchTime(e.target.value)} />
                </div>
                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                  <button className="btn" style={{ background: '#d35400', color: '#fff' }} onClick={handleDispatch}>Submit</button>
                  <button className="btn btn-outline" onClick={() => setShowDispatchModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'edit' && selectedBill && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', gap: 12, background: 'var(--bg-card)', padding: '16px 24px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewMode('bill')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, transition: 'all 0.2s' }}>
              <ArrowLeft size={16} /> 
              <span style={{ fontWeight: 600 }}>Back to Bill Orders</span>
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
            {/* Header Area */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(249,115,22,0.05), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                  {selectedBill.patientObj?.name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Patient Details</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Review and update demographic information</p>
                </div>
              </div>
              
              {!isEditingPatient ? (
                <button 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 24px', borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(249,115,22,0.2)' }}
                  onClick={() => {
                    setEditPatientForm({
                      name: selectedBill.patientObj?.name || '',
                      age: selectedBill.patientObj?.age || '',
                      gender: selectedBill.patientObj?.gender || 'M',
                      source: selectedBill.patientObj?.source || '',
                      phone: selectedBill.patientObj?.phone || '',
                      doctorId: selectedBill.doctor?.id || ''
                    });
                    setDoctorSearchText(selectedBill.doctor?.name || '');
                    setIsEditingPatient(true);
                  }}
                >
                  <Edit size={16} /> Edit Details
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    className="btn btn-ghost"
                    style={{ padding: '8px 24px', borderRadius: 8, fontWeight: 600 }}
                    onClick={() => setIsEditingPatient(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    style={{ padding: '8px 24px', borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(249,115,22,0.2)' }}
                    onClick={handleUpdatePatientDetails}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
              
              {/* Personal Info Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Full Name</label>
                  {isEditingPatient ? (
                    <input type="text" className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.name || ''} onChange={e => setEditPatientForm({...editPatientForm, name: e.target.value})} />
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedBill.patientObj?.name || '—'}</div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Age</label>
                    {isEditingPatient ? (
                      <input type="number" className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.age || ''} onChange={e => setEditPatientForm({...editPatientForm, age: e.target.value})} />
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedBill.patientObj?.age ? `${selectedBill.patientObj?.age} Years` : '—'}</div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Gender</label>
                    {isEditingPatient ? (
                      <select className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.gender || 'M'} onChange={e => setEditPatientForm({...editPatientForm, gender: e.target.value})}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedBill.patientObj?.gender === 'M' ? 'Male' : selectedBill.patientObj?.gender === 'F' ? 'Female' : selectedBill.patientObj?.gender || '—'}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Phone Number</label>
                  {isEditingPatient ? (
                    <input type="text" className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.phone || ''} onChange={e => setEditPatientForm({...editPatientForm, phone: e.target.value})} />
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedBill.patientObj?.phone || '—'}</div>
                  )}
                </div>
              </div>

              {/* Reference Info Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>UMR Number</label>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '8px 12px', borderRadius: 8, display: 'inline-block' }}>
                    {selectedBill.patientObj?.umr}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Source</label>
                  {isEditingPatient ? (
                    <input type="text" className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.source || ''} onChange={e => setEditPatientForm({...editPatientForm, source: e.target.value})} />
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedBill.patientObj?.source || '—'}</div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Assigned Doctor</label>
                  {isEditingPatient ? (
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        className="form-input"
                        style={{ width: '100%', borderRadius: 8 }}
                        placeholder="Search Doctor..."
                        value={doctorSearchText}
                        onChange={e => {
                          setDoctorSearchText(e.target.value);
                          setEditPatientForm({...editPatientForm, doctorId: ''});
                        }}
                      />
                      {isSearchingDoctor && (
                        <div style={{ position: 'absolute', right: 12, top: 12 }}><Loader2 size={16} className="animate-spin text-gray-400" /></div>
                      )}
                      {doctorSuggestions.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 8, zIndex: 50, maxHeight: 200, overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginTop: 4 }}>
                          {doctorSuggestions.map((doc, idx) => (
                            <div 
                              key={idx} 
                              style={{ padding: '10px 16px', fontSize: 14, cursor: 'pointer', borderBottom: idx < doctorSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                              onClick={() => { 
                                setDoctorSearchText(doc.name); 
                                setEditPatientForm({...editPatientForm, doctorId: doc.id});
                                setDoctorSuggestions([]); 
                              }}
                            >
                              <div style={{ fontWeight: 500, color: '#0f172a' }}>{doc.name}</div>
                              {doc.specialization && <div style={{ fontSize: 12, color: '#64748b' }}>{doc.specialization}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontWeight: 600, fontSize: 14 }}>
                        D
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedBill.doctor?.name || 'No Doctor Assigned'}</div>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {viewMode === 'result' && selectedOrder && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, margin: '-24px', minHeight: 'calc(100vh - 64px)' }}>
          {/* Top Navbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 24px', borderBottom: '1px solid #e2e8f0', borderTop: '4px solid #ea580c' }}>
            <div style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 700 }}>
              <button style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', padding: 0 }} onClick={() => setViewMode('bill')}>Bill Orders</button>
              <button style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'not-allowed', padding: 0 }}>Edit Order</button>
              <button style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', padding: 0 }} onClick={fetchBills}>Refresh Order</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Hi! <span style={{ textTransform: 'uppercase' }}>IMAGEE OWNER</span>
            </div>
          </div>

          <div style={{ padding: '16px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              
              {/* Context Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: '1px solid #cbd5e1', fontSize: 12, fontWeight: 500, fontFamily: 'sans-serif' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div><strong style={{ color: '#0f172a' }}>Bill No:</strong> <span style={{ color: '#475569' }}>{selectedBill.billNo}+</span></div>
                  <div><strong style={{ color: '#0f172a' }}>Department:</strong> <span style={{ color: '#475569' }}>{selectedOrder.department || 'RADIOLOGY'}</span></div>
                  <div><strong style={{ color: '#0f172a' }}>Order Name:</strong> <span style={{ color: '#475569' }}>{selectedOrder.orderName}</span></div>
                  <div><strong style={{ color: '#0f172a' }}>Status:</strong> <span style={{ color: '#16a34a' }}>Sample Received</span></div>
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong style={{ color: '#0f172a' }}>UMR(Card) :</strong> <span style={{ color: '#475569' }}>{selectedBill.patientObj?.umr || '—'}()</span></div>
                  <div><strong style={{ color: '#0f172a' }}>Patient Name:</strong> <span style={{ color: '#475569' }}>{selectedBill.patient}</span></div>
                  <div><strong style={{ color: '#0f172a' }}>Phone Number:</strong> <span style={{ color: '#475569' }}>{selectedBill.phone}</span></div>
                  <div><strong style={{ color: '#0f172a' }}>Gender:</strong> <span style={{ color: '#475569' }}>{selectedBill.patientObj?.gender}</span></div>
                  <div><strong style={{ color: '#0f172a' }}>Age:</strong> <span style={{ color: '#475569' }}>{selectedBill.patientObj?.age}Y</span></div>
                  <div><strong style={{ color: '#0f172a' }}>Reff.Doctor:</strong> <span style={{ color: '#475569' }}>{selectedBill.patientObj?.referredBy || '—'}</span></div>
                </div>
              </div>

              {/* Form Area */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Editor Container */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: -1, position: 'relative', zIndex: 10 }}>
                    <div style={{ padding: '4px 24px', background: '#d35400', color: '#ffffff', fontSize: 12, fontWeight: 500, border: '1px solid #c2410c', borderBottom: 'none', cursor: 'pointer' }}>Page 1</div>
                    <div style={{ padding: '4px 24px', background: '#fbeee6', color: '#d35400', fontSize: 12, fontWeight: 500, border: '1px solid #f5cba7', borderBottom: 'none', cursor: 'pointer' }}>Page 2</div>
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', background: '#ffffff' }}>
                    <style>{`
                      .ql-container { height: 350px; font-family: "Times New Roman", serif; font-size: 14px; border: none !important; }
                      .ql-toolbar { background: #fafafa; border-top: 1px solid #cbd5e1 !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #cbd5e1 !important; padding: 8px !important; }
                      .ql-editor { padding: 16px; }
                    `}</style>
                    <ReactQuill 
                      theme="snow" 
                      value={resultInput} 
                      onChange={setResultInput}
                      placeholder="Enter result details here..."
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'color': [] }, { 'background': [] }],
                          ['clean']
                        ],
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Left Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '50%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 500, width: '120px' }}>Method:</div>
                      <input type="text" style={{ width: '250px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 12, outline: 'none' }} value={resultMethod} onChange={e => setResultMethod(e.target.value)} />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 500, width: '120px' }}>Service Doctor:</div>
                      <select style={{ width: '250px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 12, outline: 'none', background: '#fff' }} value={resultDoctor} onChange={e => setResultDoctor(e.target.value)}>
                        <option value="">Select Service Doctor</option>
                        {doctorsList.map(doc => (
                          <option key={doc.id} value={doc.name}>{doc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 500, width: '120px', marginTop: 4 }}>ADVICE:</div>
                      <textarea style={{ width: '250px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 12, resize: 'vertical', outline: 'none' }} rows={3} value={resultAdvice} onChange={e => setResultAdvice(e.target.value)}></textarea>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 500, width: '120px' }}>Select Signature:</div>
                      <select style={{ width: '250px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 2, fontSize: 12, outline: 'none', background: '#fff' }}>
                        <option>Default</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-end', paddingTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ color: '#0f172a', fontSize: 12, fontWeight: 500 }}>Upload Result File:</span>
                      <button style={{ padding: '6px 12px', background: '#d35400', color: '#ffffff', border: 'none', borderRadius: 2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add Attachments</button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ padding: '6px 16px', background: '#d35400', color: '#ffffff', border: 'none', borderRadius: 2, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', opacity: isSaving ? 0.7 : 1 }} onClick={() => handleSaveResult(false)} disabled={isSaving}>
                      Save
                    </button>
                    <button style={{ padding: '6px 16px', background: '#d35400', color: '#ffffff', border: 'none', borderRadius: 2, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', opacity: isSaving ? 0.7 : 1 }} onClick={() => handleSaveResult(true)} disabled={isSaving}>
                      SaveAndComplete
                    </button>
                    <button style={{ padding: '6px 16px', background: '#d35400', color: '#ffffff', border: 'none', borderRadius: 2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Print</button>
                    <button style={{ padding: '6px 16px', background: '#d35400', color: '#ffffff', border: 'none', borderRadius: 2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Next</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
