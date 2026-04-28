'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/context/ToastContext';
import { Search, UserPlus, FileText, X, Plus } from 'lucide-react';



interface OrderItem {
  sno: number;
  name: string;
  date: string;
  amount: number;
}

export default function OrderEntryPage() {
  const { showToast } = useToast();

  // Patient fields
  const [patientId, setPatientId] = useState<number | null>(null);
  
  const generateUMR = () => {
    return 'UMR' + Math.floor(1000000 + Math.random() * 9000000).toString();
  };
  
  const [phoneUmr, setPhoneUmr] = useState(generateUMR());
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [source, setSource] = useState('');
  const [phone, setPhone] = useState('');
  const [doctor, setDoctor] = useState('');

  // Order fields
  const [orderSearch, setOrderSearch] = useState('');
  const orderSearchRef = useRef<HTMLInputElement>(null);
  const [orderSuggestions, setOrderSuggestions] = useState<any[]>([]);
  const [doctorSuggestions, setDoctorSuggestions] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [paymentType, setPaymentType] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState(0);

  // Doctor Modals
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [docName, setDocName] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docHospital, setDocHospital] = useState('');

  // Expense Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Reagents');

  // Discount Modals
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  // Bill Details Modal
  const [showBillDetails, setShowBillDetails] = useState(false);

  // Search panel
  const [showAdvSearch, setShowAdvSearch] = useState(false);
  const [advSearchState, setAdvSearchState] = useState({ billNo: '', patientName: '', umr: '', phone: '' });
  const [advSearchResults, setAdvSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const totalBill = orders.reduce((sum, o) => sum + o.amount, 0);
  const balance = totalBill - discountAmount - paidAmount;
  const today = new Date().toLocaleDateString('en-GB');

  // Autocomplete for orders
  useEffect(() => {
    const fetchTests = async () => {
      if (orderSearch.length >= 2) {
        try {
          const res = await fetch(`/api/tests?search=${encodeURIComponent(orderSearch)}`);
          if (res.ok) {
            const data = await res.json();
            setOrderSuggestions(data);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setOrderSuggestions([]);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchTests, 300);
    return () => clearTimeout(timeoutId);
  }, [orderSearch]);

  // Autocomplete for doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      if (doctor.length >= 2) {
        try {
          const res = await fetch(`/api/doctors?search=${encodeURIComponent(doctor)}`);
          if (res.ok) {
            const data = await res.json();
            setDoctorSuggestions(data);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setDoctorSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(timeoutId);
  }, [doctor]);

  const addOrder = (test: any) => {
    setOrders(prev => [
      ...prev,
      { sno: prev.length + 1, name: test.name, date: today, amount: test.price }
    ]);
    setOrderSearch('');
    setOrderSuggestions([]);
  };

  const removeOrder = (sno: number) => {
    setOrders(prev => prev.filter(o => o.sno !== sno).map((o, i) => ({ ...o, sno: i + 1 })));
  };

  const handleAdvSearch = async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (advSearchState.billNo) params.append('billNo', advSearchState.billNo);
      if (advSearchState.patientName) params.append('patientName', advSearchState.patientName);
      if (advSearchState.umr) params.append('umr', advSearchState.umr);
      if (advSearchState.phone) params.append('phone', advSearchState.phone);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAdvSearchResults(data);
      } else {
        showToast('Search failed', 'error');
      }
    } catch (e) {
      showToast('Error searching', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (p: any) => {
    setPatientId(p.id);
    setName(p.name);
    setAge(p.age?.toString() || '');
    setGender(p.gender || 'M');
    setPhone(p.phone || '');
    setPhoneUmr(p.umr || '');
    setSource(p.source || '');
    setAdvSearchResults([]);
    setShowAdvSearch(false);
    showToast('Patient loaded', 'success');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('Patient name is required', 'error');
      return;
    }
    if (orders.length === 0) {
      showToast('Please add at least one order', 'error');
      return;
    }

    try {
      showToast('Processing order...', 'info');
      let finalPatientId = patientId;

      // Create patient if new
      if (!finalPatientId) {
        const pRes = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, age, gender, phone, source })
        });
        if (pRes.ok) {
          const newPatient = await pRes.json();
          finalPatientId = newPatient.id;
        } else {
          showToast('Failed to create patient', 'error');
          return;
        }
      }

      // Create bill
      const userRaw = localStorage.getItem('medfile-user');
      const user = userRaw ? JSON.parse(userRaw) : { id: 1, labId: 1 };

      const billRes = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: finalPatientId,
          totalBill,
          discount: discountAmount,
          discountReason,
          paidAmount,
          balance,
          paymentType,
          orders,
          createdBy: user.id || 1,
          labId: user.labId || 1
        })
      });

      if (billRes.ok) {
        const bill = await billRes.json();
        showToast(`Bill #${bill.billNumber} created successfully!`, 'success');
        handleClear();
      } else {
        showToast('Failed to create bill', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred during submission', 'error');
    }
  };

  const handleClear = () => {
    setPatientId(null);
    setPhoneUmr(generateUMR()); setName(''); setAge(''); setGender('M');
    setSource(''); setPhone(''); setDoctor('');
    setOrders([]); setOrderSearch(''); setPaidAmount(0);
    setDiscountAmount(0); setDiscountReason('');
  };

  // Listen for top nav actions
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail;
      switch (action) {
        case 'Submit': handleSubmit(); break;
        case 'Clear': handleClear(); break;
        case 'Enter Results': window.location.href = '/in-process'; break;
        case 'Add Doctor': setShowAddDoctor(true); break;
        case 'Add Expense': setShowAddExpense(true); break;
        case 'Discount': setShowDiscount(true); break;
        case 'Bill Details': setShowBillDetails(true); break;
        case 'Add Order':
          if (orderSearchRef.current) {
            orderSearchRef.current.focus();
          }
          break;
        default: showToast(`${action} coming soon`, 'info');
      }
    };
    window.addEventListener('topnav-action', handler);
    return () => window.removeEventListener('topnav-action', handler);
  }, [name, orders, age, gender, phoneUmr, paymentType, paidAmount]);

  const handleSaveDoctor = async () => {
    if (!docName.trim()) {
      showToast('Doctor name is required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: docName, phone: docPhone, specialization: docSpecialty, hospital: docHospital })
      });
      if (res.ok) {
        showToast('Doctor added successfully', 'success');
        setShowAddDoctor(false);
        setDocName(''); setDocPhone(''); setDocSpecialty(''); setDocHospital('');
        // Option to auto-select the new doctor
        setDoctor(docName);
      } else {
        showToast('Failed to add doctor', 'error');
      }
    } catch (err) {
      showToast('Error saving doctor', 'error');
    }
  };

  const handleSaveExpense = async () => {
    if (!expDesc.trim() || !expAmount) {
      showToast('Description and Amount are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: expDesc, amount: parseFloat(expAmount), category: expCategory })
      });
      if (res.ok) {
        showToast('Expense added successfully', 'success');
        setShowAddExpense(false);
        setExpDesc(''); setExpAmount(''); setExpCategory('Reagents');
      } else {
        showToast('Failed to add expense', 'error');
      }
    } catch (err) {
      showToast('Error saving expense', 'error');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Order Entry</h1>
          <p className="page-subtitle">Register patients and create lab orders</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAdvSearch(!showAdvSearch)}>
            <Search size={14} /> Advance Search
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleClear}>Clear</button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (name.trim()) showToast('Patient added', 'success');
            else showToast('Enter patient name first', 'error');
          }}>
            <UserPlus size={14} /> Add
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Advance Search Panel */}
        {showAdvSearch && (
          <div className="card" style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
            <div className="card-header">
              <span className="card-title" style={{ fontSize: 14 }}>Advanced Search</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAdvSearch(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <input className="form-input" placeholder="Bill No." style={{ fontSize: 13 }} value={advSearchState.billNo} onChange={e => setAdvSearchState({ ...advSearchState, billNo: e.target.value })} />
              </div>
              <div className="form-group">
                <input className="form-input" placeholder="Patient Name" style={{ fontSize: 13 }} value={advSearchState.patientName} onChange={e => setAdvSearchState({ ...advSearchState, patientName: e.target.value })} />
              </div>
              <div className="form-group">
                <input className="form-input" placeholder="UMR/Card" style={{ fontSize: 13 }} value={advSearchState.umr} onChange={e => setAdvSearchState({ ...advSearchState, umr: e.target.value })} />
              </div>
              <div className="form-group">
                <input className="form-input" placeholder="Primary Phone" style={{ fontSize: 13 }} value={advSearchState.phone} onChange={e => setAdvSearchState({ ...advSearchState, phone: e.target.value })} />
              </div>

              <button className="btn btn-primary w-full" style={{ width: '100%' }} onClick={handleAdvSearch} disabled={isSearching}>
                <Search size={14} /> {isSearching ? 'Searching...' : 'Search'}
              </button>

              {advSearchResults.length > 0 && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Results</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                    {advSearchResults.map((p, idx) => (
                      <div key={idx} onClick={() => handleSelectPatient(p)} style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'var(--bg-card)' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.phone || 'No phone'} | {p.age ? `${p.age}y` : ''} {p.gender}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Patient Info Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Patient Information</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={async () => {
                  if (!phoneUmr) {
                    showToast('Enter Phone/UMR first', 'warning');
                    return;
                  }
                  showToast('Searching patient...', 'info');
                  const res = await fetch(`/api/patients?search=${encodeURIComponent(phoneUmr)}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                      const p = data[0];
                      setPatientId(p.id);
                      setName(p.name);
                      setAge(p.age?.toString() || '');
                      setGender(p.gender as 'M' | 'F' || 'M');
                      setPhone(p.phone || '');
                      setSource(p.source || '');
                      showToast('Patient found', 'success');
                    } else {
                      showToast('No patient found. Creating new.', 'info');
                      setPatientId(null);
                    }
                  }
                }}>
                  <Search size={14} /> Search
                </button>
                <button className="btn btn-success btn-sm">
                  <FileText size={14} /> Pat Orders
                </button>
                <button className="btn btn-outline btn-sm">Addl. Details</button>
              </div>
            </div>
            <div className="card-body">
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">Phone / UMR</label>
                  <input className="form-input" placeholder="Phone or UMR number" value={phoneUmr} onChange={e => setPhoneUmr(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className={`form-input ${!name ? 'required' : ''}`} placeholder="Patient full name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age / Gender</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" type="number" placeholder="Age" style={{ width: 80 }} value={age} onChange={e => setAge(e.target.value)} />
                    <div className="form-radio-group">
                      <label><input type="radio" name="gender" checked={gender === 'M'} onChange={() => setGender('M')} /> M</label>
                      <label><input type="radio" name="gender" checked={gender === 'F'} onChange={() => setGender('F')} /> F</label>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <input className="form-input" placeholder="Referral source" value={source} onChange={e => setSource(e.target.value)} />
                </div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="Contact number" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor</label>
                  <input className="form-input" placeholder="Referring doctor" list="doctor-list" value={doctor} onChange={e => setDoctor(e.target.value)} />
                  <datalist id="doctor-list">
                    {doctorSuggestions.map((doc, idx) => (
                      <option key={idx} value={doc.name} />
                    ))}
                  </datalist>
                </div>
                <div />
              </div>
            </div>
          </div>

          {/* Order Section */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Orders</span>
            </div>
            <div className="card-body">
              {/* Order search */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Order Name</label>
                <input
                  ref={orderSearchRef}
                  className="form-input"
                  placeholder="Type to search tests/procedures..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                />
                {orderSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                    zIndex: 50, maxHeight: 250, overflowY: 'auto',
                  }}>
                    {orderSuggestions.map((test, i) => (
                      <div
                        key={i}
                        onClick={() => addOrder(test)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: 13, transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>{test.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{test.category}</div>
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{test.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Table */}
              <div className="data-table-container" style={{ marginTop: 12 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Order Name</th>
                      <th>Order Date</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                          No orders added yet. Search and select tests above.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.sno}>
                          <td>{order.sno}</td>
                          <td style={{ fontWeight: 500 }}>{order.name}</td>
                          <td>{order.date}</td>
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{order.amount}</td>
                          <td>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeOrder(order.sno)}>
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Billing Section */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Billing Summary</span>
              <button className="btn btn-primary" onClick={handleSubmit}>Submit Order</button>
            </div>
            <div className="card-body">
              <div className="form-row form-row-4" style={{ gridTemplateColumns: discountAmount > 0 ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label className="form-label">Total Bill</label>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>₹{totalBill}</div>
                </div>
                {discountAmount > 0 && (
                  <div className="form-group">
                    <label className="form-label">Discount</label>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger)' }}>-₹{discountAmount}</div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Payment Type</label>
                  <select className="form-input form-select" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                    <option>Cash</option>
                    <option>Card</option>
                    <option>UPI</option>
                    <option>Online</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Paid Amount</label>
                  <input className="form-input" type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance</label>
                  <div style={{ fontSize: 24, fontWeight: 700, color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    ₹{balance}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddDoctor && (
        <div className="modal-overlay" onClick={() => setShowAddDoctor(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Add New Doctor</h3>
              <button className="modal-close" onClick={() => setShowAddDoctor(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Doctor Name *</label>
                <input className="form-input" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Dr. First Last" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={docPhone} onChange={e => setDocPhone(e.target.value)} placeholder="10-digit number" />
              </div>
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input className="form-input" value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)} placeholder="e.g. Cardiologist" />
              </div>
              <div className="form-group">
                <label className="form-label">Hospital / Clinic</label>
                <input className="form-input" value={docHospital} onChange={e => setDocHospital(e.target.value)} placeholder="Hospital Name" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSaveDoctor}>Save Doctor</button>
              <button className="btn btn-ghost" onClick={() => setShowAddDoctor(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Add Expense</h3>
              <button className="modal-close" onClick={() => setShowAddExpense(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                  <option>Reagents</option>
                  <option>Maintenance</option>
                  <option>Stationary</option>
                  <option>Miscellaneous</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="What was this for?" />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input className="form-input" type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSaveExpense}>Save Expense</button>
              <button className="btn btn-ghost" onClick={() => setShowAddExpense(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDiscount && (
        <div className="modal-overlay" onClick={() => setShowDiscount(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Apply Discount</h3>
              <button className="modal-close" onClick={() => setShowDiscount(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Current Total:</span>
                <span style={{ fontWeight: 700, marginLeft: 8, fontSize: 18 }}>₹{totalBill.toFixed(2)}</span>
              </div>
              <div className="form-group">
                <label className="form-label">Discount Amount (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reason For Discount *</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={discountReason}
                  onChange={e => setDiscountReason(e.target.value)}
                  placeholder="Staff reference, Camp offer, etc."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <span style={{ fontWeight: 600 }}>New Net Payable:</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{(totalBill - discountAmount).toFixed(2)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                if (discountAmount > 0 && !discountReason.trim()) {
                  showToast('Please provide a reason for the discount', 'error');
                  return;
                }
                setShowDiscount(false);
              }}>Apply Discount</button>
              <button className="btn btn-ghost" onClick={() => {
                setDiscountAmount(0);
                setDiscountReason('');
                setShowDiscount(false);
              }}>Clear</button>
            </div>
          </div>
        </div>
      )}
      {showBillDetails && (
        <div className="modal-overlay" onClick={() => setShowBillDetails(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Bill Details Preview</h3>
              <button className="modal-close" onClick={() => setShowBillDetails(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <strong>Patient:</strong> {name || 'Not provided'} {phone ? `| ${phone}` : ''}
              </div>
              <table className="data-table" style={{ width: '100%', marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>{o.name}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>₹{o.amount}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: '8px', color: 'var(--text-muted)' }}>No orders</td></tr>
                  )}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span>Subtotal:</span> <strong>₹{totalBill.toFixed(2)}</strong>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: 'var(--danger)' }}>
                  <span>Discount:</span> <strong>-₹{discountAmount.toFixed(2)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: '1.1em' }}>
                <span>Total Payable:</span> <strong style={{ color: 'var(--primary)' }}>₹{(totalBill - discountAmount).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>Paid:</span> <strong>₹{paidAmount.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>Balance:</span> <strong style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{balance.toFixed(2)}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowBillDetails(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
