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

  const [viewMode, setViewMode] = useState<'list' | 'bill' | 'result' | 'edit'>('list');
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
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/doctors').then(res => res.json()).then(setDoctorsList).catch(console.error);
  }, []);

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
            return updatedBill.rawOrders.find((o: any) => o.id === prevOrder.id) || null;
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
        body: JSON.stringify({ ...editPatientForm, doctorName: doctorSearchText })
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
                          {new Date(o.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
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
                    <input type="text" className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.name || ''} onChange={e => setEditPatientForm({ ...editPatientForm, name: e.target.value })} />
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedBill.patientObj?.name || '—'}</div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Age</label>
                    {isEditingPatient ? (
                      <input type="number" className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.age || ''} onChange={e => setEditPatientForm({ ...editPatientForm, age: e.target.value })} />
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedBill.patientObj?.age ? `${selectedBill.patientObj?.age} Years` : '—'}</div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Gender</label>
                    {isEditingPatient ? (
                      <select className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.gender || 'M'} onChange={e => setEditPatientForm({ ...editPatientForm, gender: e.target.value })}>
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
                    <input type="text" className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.phone || ''} onChange={e => setEditPatientForm({ ...editPatientForm, phone: e.target.value })} />
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
                    <input type="text" className="form-input" style={{ width: '100%', borderRadius: 8 }} value={editPatientForm.source || ''} onChange={e => setEditPatientForm({ ...editPatientForm, source: e.target.value })} />
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
                          setEditPatientForm({ ...editPatientForm, doctorId: '' });
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
                                setEditPatientForm({ ...editPatientForm, doctorId: doc.id });
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, margin: '-24px', background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
          {/* Diagnostic Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            padding: '12px 32px',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <button
                onClick={() => setViewMode('bill')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >
                <ArrowLeft size={16} /> Bill Orders
              </button>
              <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
              <button
                onClick={fetchBills}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                IO
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>IMAGEE OWNER</div>
            </div>
          </div>

          <div style={{ padding: '24px 32px' }}>
            {/* Patient Context Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              marginBottom: 24,
              overflow: 'hidden'
            }}>
              <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: '#f97316', color: '#fff', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Active Order</div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedOrder.orderName}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>Sample Received</span>
                </div>
              </div>

              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Bill Information</label>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>#{selectedBill.billNo}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selectedOrder.department || 'RADIOLOGY'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Patient Details</label>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{selectedBill.patient}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selectedBill.patientObj?.age}Y / {selectedBill.patientObj?.gender}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>UMR (Card)</label>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f97316' }}>{selectedBill.patientObj?.umr || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selectedBill.phone}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Referring Doctor</label>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{selectedBill.doctor?.name || 'SELF'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Source: {selectedBill.patientObj?.source || 'Direct'}</div>
                </div>
              </div>
            </div>

            {/* Diagnostic Workspace */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

              {/* Main Editor Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', background: '#f8fafc', padding: '0 16px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '12px 24px', color: '#f97316', fontSize: 13, fontWeight: 700, borderBottom: '2px solid #f97316', cursor: 'pointer' }}>Diagnostic Report</div>
                    <div style={{ padding: '12px 24px', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}>Templates</div>
                  </div>

                  <div style={{ padding: '24px' }}>
                    <style>{`
                      .ql-container { height: 450px; font-family: "Inter", system-ui, sans-serif; font-size: 15px; border: none !important; }
                      .ql-toolbar { background: #fff; border-top: none !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #f1f5f9 !important; padding: 12px !important; margin: -24px -24px 24px -24px; }
                      .ql-editor { padding: 0; line-height: 1.6; }
                      .ql-editor.ql-blank::before { left: 0; font-style: normal; color: #94a3b8; }
                    `}</style>
                    <ReactQuill
                      theme="snow"
                      value={resultInput}
                      onChange={setResultInput}
                      placeholder="Start typing diagnostic observations..."
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'align': [] }],
                          ['clean']
                        ],
                      }}
                    />
                  </div>
                </div>

                {/* Advice Section */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>Clinical Advice</label>
                  <textarea
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, resize: 'vertical', outline: 'none', transition: 'border-color 0.2s' }}
                    rows={3}
                    placeholder="Enter patient advice or follow-up instructions..."
                    value={resultAdvice}
                    onChange={e => setResultAdvice(e.target.value)}
                    onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Sidebar Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Report Metadata</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Methodology</label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
                        placeholder="e.g. Automated"
                        value={resultMethod}
                        onChange={e => setResultMethod(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Service Doctor</label>
                      <select
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
                        value={resultDoctor}
                        onChange={e => setResultDoctor(e.target.value)}
                      >
                        <option value="">Select Doctor</option>
                        {doctorsList.map(doc => (
                          <option key={doc.id} value={doc.name}>{doc.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Authorized Signature</label>
                      <select style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                        <option>Default System Signature</option>
                      </select>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Attachments</label>
                      <button style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#475569', border: '1px dashed #cbd5e1', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                        + Add Result Files
                      </button>
                    </div>
                  </div>
                </div>

                {/* Final Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    onClick={() => handleSaveResult(true)}
                    disabled={isSaving}
                    style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)', transition: 'transform 0.2s, opacity 0.2s', opacity: isSaving ? 0.7 : 1 }}
                    onMouseEnter={e => !isSaving && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => !isSaving && (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {isSaving ? 'Finalizing...' : 'Verify & Complete'}
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button
                      onClick={() => handleSaveResult(false)}
                      disabled={isSaving}
                      style={{ padding: '12px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      Save Draft
                    </button>
                    <button style={{ padding: '12px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Print
                    </button>
                  </div>
                  <button
                    style={{ width: '100%', padding: '12px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setViewMode('bill')}
                  >
                    Discard Changes
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
