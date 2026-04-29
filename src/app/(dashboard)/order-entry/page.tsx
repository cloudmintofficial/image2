'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Search, UserPlus, FileText, Beaker, MapPin, X, FileSignature, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '@/context/ToastContext';
import { useReactToPrint } from 'react-to-print';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

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

  const [phoneUmr, setPhoneUmr] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [source, setSource] = useState('');
  const [phone, setPhone] = useState('');
  const [doctor, setDoctor] = useState('');

  // Additional Patient Details Modal
  const [showAddlDetails, setShowAddlDetails] = useState(false);
  const [addlDetails, setAddlDetails] = useState({
    category: '', dob: '', cardNumber: '', civilId: '', hasInsurance: 'No',
    passportNumber: '', designation: '', email: '', notes: '',
    tastesAndPreferences: '', familyDetails: '', address: '', prescriptionUrl: ''
  });

  const [isUploading, setIsUploading] = useState(false);

  // Pat Orders State
  const [showPatOrders, setShowPatOrders] = useState(false);
  const [pastOrders, setPastOrders] = useState<any[]>([]);

  // Loading States
  const [isSearchingOrdersDropdown, setIsSearchingOrdersDropdown] = useState(false);
  const [isSearchingDoctorsDropdown, setIsSearchingDoctorsDropdown] = useState(false);
  const [isSearchingSourcesDropdown, setIsSearchingSourcesDropdown] = useState(false);
  const [isSearchingPatientInfo, setIsSearchingPatientInfo] = useState(false);
  const [isLoadingPatOrders, setIsLoadingPatOrders] = useState(false);
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);
  const [isSavingEntity, setIsSavingEntity] = useState(false);

  // Order fields
  const [orderSearch, setOrderSearch] = useState('');
  const orderSearchRef = useRef<HTMLInputElement>(null);
  const [orderSuggestions, setOrderSuggestions] = useState<any[]>([]);
  const [doctorSuggestions, setDoctorSuggestions] = useState<any[]>([]);
  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [paymentType, setPaymentType] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  // Add Order Modals
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    orderName: '', hasComponents: false, testCode: '', displayOrderName: '',
    department: 'NONE', amount: '', processTime: '', machineName: '',
    sampleType: 'Select Sample', method: '', advice: '',
    workSheet: '', purpose: '', orderType: 'Internal', ipBillingCategoryType: 'Select Category',
    recurring: false, serviceDoctorRequired: false, inactive: false
  });
  const [resultNotesTab, setResultNotesTab] = useState<'Page 1' | 'Page 2'>('Page 1');
  const [resultNotesPage1, setResultNotesPage1] = useState('');
  const [resultNotesPage2, setResultNotesPage2] = useState('');

  const printRef = useRef<HTMLDivElement>(null);
  const handlePreviewPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Result_Notes_Preview'
  });

  // Doctor Modals
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Referral');
  const [docPercentage, setDocPercentage] = useState('');
  const [docAddress, setDocAddress] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docDepartment, setDocDepartment] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docLocation, setDocLocation] = useState('');
  const [docHospital, setDocHospital] = useState('');
  const [docSalesExecutive, setDocSalesExecutive] = useState('');
  const [docInactive, setDocInactive] = useState(false);

  // Expense Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Reagents');

  // Discount Modals
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  // Source Management Modal
  const [showManageSources, setShowManageSources] = useState(false);
  const [allSources, setAllSources] = useState<any[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceStatus, setNewSourceStatus] = useState('Active');
  const [isSavingSource, setIsSavingSource] = useState(false);

  const [editingSourceId, setEditingSourceId] = useState<number | null>(null);
  const [editingSourceName, setEditingSourceName] = useState('');
  const [editingSourceStatus, setEditingSourceStatus] = useState('Active');
  const [isUpdatingSource, setIsUpdatingSource] = useState(false);

  useEffect(() => {
    if (showManageSources) {
      fetch('/api/sources')
        .then(res => res.json())
        .then(data => setAllSources(data))
        .catch(console.error);
    }
  }, [showManageSources]);

  // Bill Details Modal
  const [showBillDetails, setShowBillDetails] = useState(false);

  // Search panel
  const [showAdvSearch, setShowAdvSearch] = useState(false);
  const [advSearchState, setAdvSearchState] = useState({ patientName: '', umr: '', phone: '', age: '', gender: '', doctor: '', source: '' });
  const [advSearchSelectedIndex, setAdvSearchSelectedIndex] = useState(-1);
  const [advSearchResults, setAdvSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const totalBill = orders.reduce((sum, o) => sum + o.amount, 0);
  const balance = totalBill - discountAmount - paidAmount;
  const today = new Date().toLocaleDateString('en-GB');

  // Dispatch disabled actions for TopNav
  useEffect(() => {
    const disabled = [];
    // Disable Submit and Enter Results if form is incomplete
    if (!name || orders.length === 0 || isSubmittingBill) {
      disabled.push('Submit');
      disabled.push('Enter Results');
    }
    window.dispatchEvent(new CustomEvent('set-disabled-actions', { detail: disabled }));
  }, [name, orders.length, isSubmittingBill]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setAdvSearchState(prev => ({ ...prev, patientName: name || prev.patientName, phone: phone || prev.phone }));
        setShowAdvSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, phone]);

  // Autocomplete for orders
  useEffect(() => {
    const fetchTests = async () => {
      if (orderSearch.length >= 2) {
        setIsSearchingOrdersDropdown(true);
        try {
          const res = await fetch(`/api/tests?search=${encodeURIComponent(orderSearch)}`);
          if (res.ok) {
            const data = await res.json();
            setOrderSuggestions(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearchingOrdersDropdown(false);
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
        setIsSearchingDoctorsDropdown(true);
        try {
          const res = await fetch(`/api/doctors?search=${encodeURIComponent(doctor)}`);
          if (res.ok) {
            const data = await res.json();
            setDoctorSuggestions(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearchingDoctorsDropdown(false);
        }
      } else {
        setDoctorSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(timeoutId);
  }, [doctor]);

  // Autocomplete for sources
  useEffect(() => {
    const fetchSources = async () => {
      if (source.length >= 2) {
        setIsSearchingSourcesDropdown(true);
        try {
          const res = await fetch(`/api/sources?search=${encodeURIComponent(source)}`);
          if (res.ok) {
            const data = await res.json();
            setSourceSuggestions(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearchingSourcesDropdown(false);
        }
      } else {
        setSourceSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSources, 300);
    return () => clearTimeout(timeoutId);
  }, [source]);

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
    setAdvSearchSelectedIndex(-1);
    try {
      const res = await fetch(`/api/patients/advanced-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: advSearchState.patientName,
          umr: advSearchState.umr,
          phone: advSearchState.phone,
          ageRange: advSearchState.age,
          gender: advSearchState.gender,
          doctor: advSearchState.doctor,
          source: advSearchState.source
        })
      });
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

  const handleCreatePatient = async () => {
    setIsSearching(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: advSearchState.patientName || 'New Patient',
          phone: advSearchState.phone || '',
          gender: advSearchState.gender || 'M',
        })
      });
      if (res.ok) {
        const p = await res.json();
        handleSelectPatient(p);
        setShowAdvSearch(false);
        setShowAddlDetails(true);
        showToast('Patient created! Please fill out additional details.', 'success');
      }
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
    if (p.additionalDetails) {
      try {
        setAddlDetails(JSON.parse(p.additionalDetails));
      } catch (e) { }
    } else {
      setAddlDetails({
        category: '', dob: '', cardNumber: '', civilId: '', hasInsurance: 'No',
        passportNumber: '', designation: '', email: '', notes: '',
        tastesAndPreferences: '', familyDetails: '', address: '', prescriptionUrl: ''
      });
    }
    setAdvSearchResults([]);
    setShowAdvSearch(false);
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
      setIsSubmittingBill(true);
      setIsSubmittingBill(true);
      let finalPatientId = patientId;

      // Create patient if new
      if (!finalPatientId) {
        const pRes = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, age, gender, phone, source, additionalDetails: JSON.stringify(addlDetails) })
        });
        if (pRes.ok) {
          const newPatient = await pRes.json();
          finalPatientId = newPatient.id;
        } else {
          showToast('Failed to create patient', 'error');
          setIsSubmittingBill(false);
          return;
        }
      } else {
        // Update existing patient
        await fetch(`/api/patients/${finalPatientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, age, gender, phone, source, additionalDetails: JSON.stringify(addlDetails) })
        });
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
          referenceNumber,
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
      showToast('Error creating bill', 'error');
    } finally {
      setIsSubmittingBill(false);
    }
  };

  const handleClear = () => {
    setPatientId(null);
    setPhoneUmr(''); setName(''); setAge(''); setGender('M');
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
        case 'Add Order': setShowAddOrderModal(true); break;
        default: showToast(`${action} coming soon`, 'info');
      }
    };
    window.addEventListener('topnav-action', handler);
    return () => window.removeEventListener('topnav-action', handler);
  }, [name, orders, age, gender, phoneUmr, paymentType, paidAmount]);

  const handleSaveNewOrder = async () => {
    if (!orderForm.orderName.trim() || !orderForm.testCode.trim() || !orderForm.amount.trim() || !orderForm.processTime.trim()) {
      showToast('Order Name, Test Code, Amount, and Process Time are required', 'error');
      return;
    }
    try {
      setIsSavingEntity(true);
      const combinedNotes = resultNotesPage2
        ? `<div class="page-1">${resultNotesPage1}</div><div class="page-break" style="page-break-before: always;"></div><div class="page-2">${resultNotesPage2}</div>`
        : resultNotesPage1;

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm,
          resultNotes: combinedNotes,
          status: orderForm.inactive ? 'InActive' : 'Active'
        })
      });
      if (res.ok) {
        showToast('Order added successfully', 'success');
        setShowAddOrderModal(false);
        setResultNotesPage1('');
        setResultNotesPage2('');
        setResultNotesTab('Page 1');
        setOrderForm({
          orderName: '', hasComponents: false, testCode: '', displayOrderName: '',
          department: 'NONE', amount: '', processTime: '', machineName: '',
          sampleType: 'Select Sample', method: '', advice: '',
          workSheet: '', purpose: '', orderType: 'Internal', ipBillingCategoryType: 'Select Category',
          recurring: false, serviceDoctorRequired: false, inactive: false
        });
      } else {
        showToast('Failed to add order', 'error');
      }
    } catch (err) {
      showToast('Error saving order', 'error');
    } finally {
      setIsSavingEntity(false);
    }
  };

  const handleSaveDoctor = async () => {
    if (!docName.trim()) {
      showToast('Doctor name is required', 'error');
      return;
    }
    try {
      setIsSavingEntity(true);
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName,
          type: docType,
          percentage: docPercentage,
          address: docAddress,
          phone: docPhone,
          email: docEmail,
          department: docDepartment,
          specialization: docSpecialty,
          location: docLocation,
          hospital: docHospital,
          salesExecutive: docSalesExecutive,
          status: docInactive ? 'InActive' : 'Active'
        })
      });
      if (res.ok) {
        showToast('Doctor added successfully', 'success');
        setShowAddDoctor(false);
        setDocName(''); setDocType('Referral'); setDocPercentage(''); setDocAddress('');
        setDocPhone(''); setDocEmail(''); setDocDepartment(''); setDocSpecialty('');
        setDocLocation(''); setDocHospital(''); setDocSalesExecutive(''); setDocInactive(false);
        // Option to auto-select the new doctor
        setDoctor(docName);
      } else {
        showToast('Failed to add doctor', 'error');
      }
    } catch (err) {
      showToast('Error saving doctor', 'error');
    } finally {
      setIsSavingEntity(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!expDesc.trim() || !expAmount) {
      showToast('Description and Amount are required', 'error');
      return;
    }
    try {
      setIsSavingEntity(true);
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
    } finally {
      setIsSavingEntity(false);
    }
  };

  const handleUpdateSource = async () => {
    if (!editingSourceId || !editingSourceName.trim()) {
      showToast('Source name is required', 'error');
      return;
    }
    try {
      setIsUpdatingSource(true);
      const res = await fetch(`/api/sources/${editingSourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingSourceName.trim(), status: editingSourceStatus })
      });
      if (res.ok) {
        showToast('Source updated successfully', 'success');
        setEditingSourceId(null);
        // refresh sources
        const newRes = await fetch('/api/sources');
        const newData = await newRes.json();
        setAllSources(newData);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update source', 'error');
      }
    } catch (e) {
      showToast('Error updating source', 'error');
    } finally {
      setIsUpdatingSource(false);
    }
  };

  const handleSaveSource = async () => {
    if (!newSourceName.trim()) {
      showToast('Source name is required', 'error');
      return;
    }
    try {
      setIsSavingSource(true);
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSourceName.trim(), status: newSourceStatus })
      });
      if (res.ok) {
        showToast('Source added successfully', 'success');
        setNewSourceName('');
        setNewSourceStatus('Active');
        // refresh sources
        const newRes = await fetch('/api/sources');
        const newData = await newRes.json();
        setAllSources(newData);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add source', 'error');
      }
    } catch (e) {
      showToast('Error saving source', 'error');
    } finally {
      setIsSavingSource(false);
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

        {/* Main Form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Patient Info Card */}
          <div className={`card ${patientId ? 'patient-card-selected' : ''}`} style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Patient Information</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setAdvSearchState(prev => ({ ...prev, patientName: name || prev.patientName, phone: phone || prev.phone }));
                  setShowAdvSearch(true);
                }}>
                  <Search size={14} /> Search (Ctrl+K)
                </button>
                <button className="btn btn-success btn-sm" onClick={async () => {
                  let targetPatientId = patientId;

                  if (!targetPatientId) {
                    if (!name.trim() && !phone.trim()) {
                      showToast('Please select a Patient or enter Name/Phone first.', 'error');
                      return;
                    }
                    setIsLoadingPatOrders(true);
                    setIsLoadingPatOrders(true);
                    try {
                      const searchRes = await fetch(`/api/patients/advanced-search`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name.trim(), phone: phone.trim() })
                      });
                      if (searchRes.ok) {
                        const data = await searchRes.json();
                        if (data.length > 0) {
                          targetPatientId = data[0].id;
                          handleSelectPatient(data[0]); // auto-fill and set patientId
                        } else {
                          showToast('No past orders found for this Name/Phone.', 'warning');
                          setIsLoadingPatOrders(false);
                          return;
                        }
                      }
                    } catch (e) {
                      showToast('Search failed', 'error');
                      setIsLoadingPatOrders(false);
                      return;
                    }
                  }

                  if (targetPatientId) {
                    setIsLoadingPatOrders(true);
                    setIsLoadingPatOrders(true);
                    try {
                      const res = await fetch(`/api/patients/${targetPatientId}/orders`);
                      if (res.ok) {
                        const data = await res.json();
                        setPastOrders(data);
                        setShowPatOrders(true);
                      } else {
                        showToast('Failed to load patient history', 'error');
                      }
                    } finally {
                      setIsLoadingPatOrders(false);
                    }
                  }
                }} disabled={isLoadingPatOrders}>
                  {isLoadingPatOrders ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Pat Orders
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowAddlDetails(true)}>Addl. Details</button>
              </div>
            </div>
            <div className="card-body">
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className={`form-input ${!name ? 'required' : ''}`} placeholder="Patient full name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age / Gender *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" type="number" placeholder="Age" style={{ width: 80 }} value={age} onChange={e => setAge(e.target.value)} />
                    <div className="form-radio-group">
                      <label><input type="radio" name="gender" checked={gender === 'M'} onChange={() => setGender('M')} /> M</label>
                      <label><input type="radio" name="gender" checked={gender === 'F'} onChange={() => setGender('F')} /> F</label>
                    </div>
                  </div>
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Source</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" placeholder="Referral source" value={source} onChange={e => setSource(e.target.value)} style={{ paddingRight: 32 }} />
                    {isSearchingSourcesDropdown && (
                      <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  {sourceSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                      zIndex: 50, maxHeight: 250, overflowY: 'auto',
                    }}>
                      {sourceSuggestions.map((src, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setSource(src.name); setSourceSuggestions([]); }}
                          style={{
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            fontSize: 13, transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontWeight: 500 }}>{src.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-row form-row-3">
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" placeholder="Contact number" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Doctor</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" placeholder="Referring doctor" value={doctor} onChange={e => setDoctor(e.target.value)} style={{ paddingRight: 32 }} />
                    {isSearchingDoctorsDropdown && (
                      <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  {doctorSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                      zIndex: 50, maxHeight: 250, overflowY: 'auto',
                    }}>
                      {doctorSuggestions.map((doc, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setDoctor(doc.name); setDoctorSuggestions([]); }}
                          style={{
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            fontSize: 13, transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontWeight: 500 }}>{doc.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
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
                <div style={{ position: 'relative' }}>
                  <input
                    ref={orderSearchRef}
                    className="form-input"
                    placeholder="Type to search tests/procedures..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    style={{ paddingRight: 32 }}
                  />
                  {isSearchingOrdersDropdown && (
                    <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  )}
                </div>
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
              <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmittingBill}>
                {isSubmittingBill ? <Loader2 size={16} className="animate-spin" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> : null}
                {isSubmittingBill ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
            <div className="card-body">
              <div className="form-row" style={{ gridTemplateColumns: `repeat(${4 + (discountAmount > 0 ? 1 : 0) + (paymentType === 'Cheque' ? 1 : 0)}, 1fr)` }}>
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
                    <option>Cheque</option>
                  </select>
                </div>
                {paymentType === 'Cheque' && (
                  <div className="form-group">
                    <label className="form-label">Cheque Number</label>
                    <input className="form-input" placeholder="Enter cheque no." value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
                  </div>
                )}
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3>Add Doctor</h3>
              <button className="modal-close" onClick={() => setShowAddDoctor(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxWidth: 600, margin: '0 auto', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px 24px', alignItems: 'center', paddingTop: 20, width: '100%' }}>

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Doctor Name:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Doctor Name" />
                <span style={{ color: 'var(--danger)' }}>*</span>
              </div>

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Doctor Type:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <select className="form-input form-select" value={docType} onChange={e => setDocType(e.target.value)}>
                  <option value="Referral">Referral</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Both">Both</option>
                </select>
                <span style={{ color: 'var(--danger)' }}>*</span>
              </div>

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Percentage To Doctor:</label>
              <input className="form-input" type="number" value={docPercentage} onChange={e => setDocPercentage(e.target.value)} placeholder="Percentage to Doctor" />

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Address:</label>
              <input className="form-input" value={docAddress} onChange={e => setDocAddress(e.target.value)} placeholder="Address" />

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Phone Number:</label>
              <input className="form-input" value={docPhone} onChange={e => setDocPhone(e.target.value)} placeholder="Phone Number" />

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Email:</label>
              <input className="form-input" value={docEmail} onChange={e => setDocEmail(e.target.value)} placeholder="Email" />

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Department:</label>
              <select className="form-input form-select" value={docDepartment} onChange={e => setDocDepartment(e.target.value)}>
                <option value="">-- Select Department --</option>
                <option value="BIO CHEMISTRY">BIO CHEMISTRY</option>
                <option value="IMMUNOLOGY">IMMUNOLOGY</option>
                <option value="SEROLOGY">SEROLOGY</option>
                <option value="CLINICAL PATHOLOGY">CLINICAL PATHOLOGY</option>
                <option value="HEMATOLOGY">HEMATOLOGY</option>
                <option value="MICRO BIOLOGY">MICRO BIOLOGY</option>
                <option value="PATHOLOGY">PATHOLOGY</option>
                <option value="CYTOLOGY">CYTOLOGY</option>
                <option value="X-RAY">X-RAY</option>
                <option value="HISTOPATHOLOGY">HISTOPATHOLOGY</option>
                <option value="ECG">ECG</option>
                <option value="HORMONES">HORMONES</option>
                <option value="RADIOLOGY">RADIOLOGY</option>
                <option value="2 D ECHOCARDIOGRAM">2 D ECHOCARDIOGRAM</option>
                <option value="PACKAGE INCLUSION">PACKAGE INCLUSION</option>
              </select>

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Specialization:</label>
              <input className="form-input" value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)} placeholder="Specialization" />

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Location:</label>
              <input className="form-input" value={docLocation} onChange={e => setDocLocation(e.target.value)} placeholder="Location" />

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Hospital:</label>
              <input className="form-input" value={docHospital} onChange={e => setDocHospital(e.target.value)} placeholder="Hospital" />

              <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Sales Executive:</label>
              <select className="form-input form-select" value={docSalesExecutive} onChange={e => setDocSalesExecutive(e.target.value)}>
                <option value="">-- Select Sales Executive --</option>
                <option value="No Sales Executives Available" disabled>No Sales Executives Available</option>
              </select>

              <div style={{ gridColumn: '2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginTop: 4 }}>
                  <input type="checkbox" checked={docInactive} onChange={e => setDocInactive(e.target.checked)} />
                  Check to Inactive
                </label>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowAddDoctor(false)}>Cancel</button>
              <button className="btn btn-outline" onClick={() => {
                setDocName(''); setDocType('Referral'); setDocPercentage(''); setDocAddress('');
                setDocPhone(''); setDocEmail(''); setDocDepartment(''); setDocSpecialty('');
                setDocLocation(''); setDocHospital(''); setDocSalesExecutive(''); setDocInactive(false);
              }}>Clear</button>
              <button className="btn btn-primary" onClick={handleSaveDoctor} disabled={isSavingEntity}>
                {isSavingEntity ? <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} /> : null}
                {isSavingEntity ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddOrderModal && (
        <div className="modal-overlay" onClick={() => setShowAddOrderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Add Order</h3>
              <button className="modal-close" onClick={() => setShowAddOrderModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxWidth: 750, margin: '0 auto', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px 24px', alignItems: 'start', paddingTop: 20, width: '100%' }}>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Order Name:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" value={orderForm.orderName} onChange={e => setOrderForm({ ...orderForm, orderName: e.target.value })} />
                <span style={{ color: 'var(--danger)' }}>*</span>
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Has Components</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 36 }}>
                <input type="checkbox" checked={orderForm.hasComponents} onChange={e => setOrderForm({ ...orderForm, hasComponents: e.target.checked })} />
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Test Code:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" value={orderForm.testCode} onChange={e => setOrderForm({ ...orderForm, testCode: e.target.value })} />
                <span style={{ color: 'var(--danger)' }}>*</span>
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Display Order Name:</label>
              <div>
                <textarea className="form-input" style={{ width: '100%' }} rows={3} value={orderForm.displayOrderName} onChange={e => setOrderForm({ ...orderForm, displayOrderName: e.target.value })} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  If you do not want to display order name while printing reports please enter <b>"blank"</b> in <b>display order name</b> field
                </div>
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Department</label>
              <select className="form-input form-select" style={{ width: '100%' }} value={orderForm.department} onChange={e => setOrderForm({ ...orderForm, department: e.target.value })}>
                <option value="NONE">NONE</option>
                <option value="BIO CHEMISTRY">BIO CHEMISTRY</option>
                <option value="HEMATOLOGY">HEMATOLOGY</option>
                <option value="IMMUNOLOGY">IMMUNOLOGY</option>
                <option value="SEROLOGY">SEROLOGY</option>
                <option value="CLINICAL PATHOLOGY">CLINICAL PATHOLOGY</option>
                <option value="MICRO BIOLOGY">MICRO BIOLOGY</option>
                <option value="PATHOLOGY">PATHOLOGY</option>
                <option value="CYTOLOGY">CYTOLOGY</option>
                <option value="X-RAY">X-RAY</option>
                <option value="HISTOPATHOLOGY">HISTOPATHOLOGY</option>
                <option value="ECG">ECG</option>
                <option value="HORMONES">HORMONES</option>
                <option value=".">.</option>
                <option value="RADIOLOGY">RADIOLOGY</option>
                <option value="2 D ECHOCARDIOGRAM">2 D ECHOCARDIOGRAM</option>
                <option value="PACKAGE INCLUSION">PACKAGE INCLUSION</option>
              </select>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Amount:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" style={{ width: '100%' }} type="number" value={orderForm.amount} onChange={e => setOrderForm({ ...orderForm, amount: e.target.value })} />
                <span style={{ color: 'var(--danger)' }}>*</span>
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Process Time:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input className="form-input" style={{ width: '100%' }} value={orderForm.processTime} onChange={e => setOrderForm({ ...orderForm, processTime: e.target.value })} />
                <span style={{ color: 'var(--danger)' }}>*</span>
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Machine Name:</label>
              <input className="form-input" style={{ width: '100%' }} value={orderForm.machineName} onChange={e => setOrderForm({ ...orderForm, machineName: e.target.value })} />

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Sample Type:</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="form-input form-select" style={{ width: '100%' }} value={orderForm.sampleType} onChange={e => setOrderForm({ ...orderForm, sampleType: e.target.value })}>
                  <option value="Select Sample">Select Sample</option>
                  <option value="Blood">Blood</option>
                  <option value="Sputum">Sputum</option>
                  <option value="Pus">Pus</option>
                  <option value="Stool">Stool</option>
                  <option value="Urine">Urine</option>
                  <option value="Swab">Swab</option>
                  <option value="Semen">Semen</option>
                  <option value="Pap Smear">Pap Smear</option>
                  <option value="Sweat">Sweat</option>
                  <option value="Saliva">Saliva</option>
                  <option value="Urea Breath">Urea Breath</option>
                  <option value="Hair">Hair</option>
                  <option value="Fingernail Clippings">Fingernail Clippings</option>
                  <option value="Skin scrapes">Skin scrapes</option>
                  <option value="HPV">HPV</option>
                  <option value="Biopsies">Biopsies</option>
                  <option value="CerebroSpinal Fluid">CerebroSpinal Fluid</option>
                  <option value="Bone Marrow">Bone Marrow</option>
                  <option value="Chorionic Villous Sampling">Chorionic Villous Sampling</option>
                  <option value="Amniocentesis">Amniocentesis</option>
                  <option value="Noninvasive Prenatal Testing">Noninvasive Prenatal Testing</option>
                  <option value="Hydrogen and Methane Breath">Hydrogen and Methane Breath</option>
                  <option value="ANY">ANY</option>
                  <option value="CITRATED BLOOD">CITRATED BLOOD</option>
                  <option value="CITRATED PLASMA">CITRATED PLASMA</option>
                  <option value="Conducted on Patient">Conducted on Patient</option>
                  <option value="ET TUBE">ET TUBE</option>
                  <option value="Fixed Smears">Fixed Smears</option>
                  <option value="Fluoride Plasma">Fluoride Plasma</option>
                  <option value="FLUID">FLUID</option>
                  <option value="LITHIUM HEPARIN">LITHIUM HEPARIN</option>
                  <option value="Na Citrate">Na Citrate</option>
                  <option value="Na Fluoride">Na Fluoride</option>
                  <option value="Na Heparin">Na Heparin</option>
                  <option value="PLASMA NaF">PLASMA NaF</option>
                  <option value="SERUM">SERUM</option>
                  <option value="WB EDTA">WB EDTA</option>
                  <option value="Body fluids">Body fluids</option>
                  <option value="STONE">STONE</option>
                  <option value="Synovial Fluid">Synovial Fluid</option>
                  <option value="TISSUE SPECIMEN">TISSUE SPECIMEN</option>
                  <option value="URINE/SERUM">URINE/SERUM</option>
                  <option value="SERUM/WB EDTA">SERUM/WB EDTA</option>
                  <option value="sputum/body fluids">sputum/body fluids</option>
                </select>
                <button className="btn btn-primary btn-sm" style={{ background: '#e04f3d', borderColor: '#e04f3d', flexShrink: 0 }}>Add</button>
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Method:</label>
              <input className="form-input" value={orderForm.method} onChange={e => setOrderForm({ ...orderForm, method: e.target.value })} />

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Result Notes:</label>
              <div style={{ maxWidth: '100%' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: resultNotesTab === 'Page 1' ? '#c0392b' : '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px 4px 0 0', padding: '4px 16px' }}
                    onClick={() => setResultNotesTab('Page 1')}
                  >Page 1</button>
                  <button
                    className="btn btn-sm"
                    style={{ background: resultNotesTab === 'Page 2' ? '#c0392b' : '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px 4px 0 0', padding: '4px 16px', opacity: 0.8 }}
                    onClick={() => setResultNotesTab('Page 2')}
                  >Page 2</button>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px 4px 0 0', padding: '4px 16px', marginLeft: 'auto' }}
                    onClick={handlePreviewPrint}
                  >Preview</button>
                </div>
                {resultNotesTab === 'Page 1' && (
                  <RichTextEditor value={resultNotesPage1} onChange={setResultNotesPage1} />
                )}
                {resultNotesTab === 'Page 2' && (
                  <RichTextEditor value={resultNotesPage2} onChange={setResultNotesPage2} />
                )}

                {/* Hidden Print Content */}
                <div style={{ display: 'none' }}>
                  <div ref={printRef} style={{ padding: '40px', color: '#000', fontFamily: 'Arial, sans-serif' }}>
                    <div dangerouslySetInnerHTML={{ __html: resultNotesPage1 }} />
                    {resultNotesPage2 && (
                      <>
                        <div style={{ pageBreakBefore: 'always' }} />
                        <div dangerouslySetInnerHTML={{ __html: resultNotesPage2 }} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Advice:</label>
              <div style={{ maxWidth: '100%' }}>
                <RichTextEditor value={orderForm.advice} onChange={val => setOrderForm({ ...orderForm, advice: val })} />
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>WorkSheet:</label>
              <div style={{ maxWidth: '100%' }}>
                <RichTextEditor value={orderForm.workSheet} onChange={val => setOrderForm({ ...orderForm, workSheet: val })} />
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Purpose:</label>
              <textarea className="form-input" rows={3} value={orderForm.purpose} onChange={e => setOrderForm({ ...orderForm, purpose: e.target.value })} placeholder="Order Purpose" />

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Order type</label>
              <select className="form-input form-select" value={orderForm.orderType} onChange={e => setOrderForm({ ...orderForm, orderType: e.target.value })}>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>IP Billing Category Type:</label>
              <select className="form-input form-select" value={orderForm.ipBillingCategoryType} onChange={e => setOrderForm({ ...orderForm, ipBillingCategoryType: e.target.value })}>
                <option value="Select Category">Select Category</option>
                <option value="Category 1">Category 1</option>
              </select>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Recurring</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 36 }}>
                <input type="checkbox" checked={orderForm.recurring} onChange={e => setOrderForm({ ...orderForm, recurring: e.target.checked })} />
              </div>

              <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Service Doctor Required:</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 36 }}>
                <input type="checkbox" checked={orderForm.serviceDoctorRequired} onChange={e => setOrderForm({ ...orderForm, serviceDoctorRequired: e.target.checked })} />
              </div>

              <div style={{ gridColumn: '2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={orderForm.inactive} onChange={e => setOrderForm({ ...orderForm, inactive: e.target.checked })} />
                  Check to Inactive
                </label>
              </div>

            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowAddOrderModal(false)}>Cancel</button>
              <button className="btn btn-outline" onClick={() => {
                setOrderForm({
                  orderName: '', hasComponents: false, testCode: '', displayOrderName: '', department: 'NONE', amount: '', processTime: '', machineName: '', sampleType: 'Select Sample', method: '', advice: '', workSheet: '', purpose: '', orderType: 'Internal', ipBillingCategoryType: 'Select Category', recurring: false, serviceDoctorRequired: false, inactive: false
                });
                setResultNotesPage1('');
                setResultNotesPage2('');
                setResultNotesTab('Page 1');
              }}>Clear</button>
              <button className="btn btn-primary" onClick={handleSaveNewOrder} disabled={isSavingEntity}>
                {isSavingEntity ? <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} /> : null}
                {isSavingEntity ? 'Saving...' : 'Save Order'}
              </button>
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
              <button className="btn btn-primary" onClick={handleSaveExpense} disabled={isSavingEntity}>
                {isSavingEntity ? <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} /> : null}
                {isSavingEntity ? 'Saving...' : 'Save Expense'}
              </button>
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

      {/* Pat Orders Slide-in Panel */}
      {/* Pat Orders Center Modal */}
      {showPatOrders && (
        <div className="modal-overlay" onClick={() => setShowPatOrders(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Past Patient Orders</h3>
              <button className="modal-close" onClick={() => setShowPatOrders(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {pastOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No previous orders found for this patient.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pastOrders.map((order, idx) => (
                    <div key={idx} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer', border: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'} onClick={() => {
                      // One-Click Repeat Order
                      setOrders(prev => [...prev, {
                        sno: prev.length + 1,
                        name: order.orderName,
                        date: new Date().toISOString().split('T')[0],
                        amount: order.amount,
                        testId: order.testId
                      }]);
                      setShowPatOrders(false);
                      showToast(`${order.orderName} added to current bill!`, 'success');
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>{order.orderName}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                          Ordered: {new Date(order.orderDate).toLocaleDateString()} • Status: {order.status}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>₹{order.amount}</div>
                        <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 12, padding: '4px 12px' }}>Repeat</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Patient Details Modal */}
      {showAddlDetails && (
        <div className="modal-overlay" onClick={() => setShowAddlDetails(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 850 }}>
            <div className="modal-header">
              <h3>Additional Patient Details</h3>
              <button className="modal-close" onClick={() => setShowAddlDetails(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="form-row form-row-3" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Patient Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Patient Phone</label>
                  <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={addlDetails.email} onChange={e => setAddlDetails({ ...addlDetails, email: e.target.value })} />
                </div>
              </div>

              <div className="form-row form-row-4" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Gender <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="radio" checked={gender === 'M'} onChange={() => setGender('M')} /> Male</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="radio" checked={gender === 'F'} onChange={() => setGender('F')} /> Female</label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">DOB <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="date" className="form-input" value={addlDetails.dob} onChange={e => setAddlDetails({ ...addlDetails, dob: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Has Insurance</label>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="radio" checked={addlDetails.hasInsurance === 'Yes'} onChange={() => setAddlDetails({ ...addlDetails, hasInsurance: 'Yes' })} /> Yes</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="radio" checked={addlDetails.hasInsurance === 'No'} onChange={() => setAddlDetails({ ...addlDetails, hasInsurance: 'No' })} /> No</label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-input" value={addlDetails.category} onChange={e => setAddlDetails({ ...addlDetails, category: e.target.value })} />
                </div>
              </div>

              <div className="form-row form-row-3" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input className="form-input" value={addlDetails.cardNumber} onChange={e => setAddlDetails({ ...addlDetails, cardNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Civil ID</label>
                  <input className="form-input" value={addlDetails.civilId} onChange={e => setAddlDetails({ ...addlDetails, civilId: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Passport Number</label>
                  <input className="form-input" value={addlDetails.passportNumber} onChange={e => setAddlDetails({ ...addlDetails, passportNumber: e.target.value })} />
                </div>
              </div>

              <div className="form-row form-row-3" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-input" value={addlDetails.designation} onChange={e => setAddlDetails({ ...addlDetails, designation: e.target.value })} />
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Source</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input className="form-input" value={source} onChange={e => setSource(e.target.value)} style={{ width: '100%' }} />
                      {isSearchingSourcesDropdown && (
                        <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      )}
                      {sourceSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                          zIndex: 50, maxHeight: 200, overflowY: 'auto',
                        }}>
                          {sourceSuggestions.map((src, idx) => (
                            <div
                              key={idx}
                              onClick={() => { setSource(src.name); setSourceSuggestions([]); }}
                              style={{
                                padding: '10px 14px', cursor: 'pointer',
                                borderBottom: '1px solid var(--border)',
                                fontSize: 13, transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{ fontWeight: 500 }}>{src.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-outline" onClick={() => setShowManageSources(true)}>Add</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Prescription</label>
                  <div className="file-upload-wrapper" style={{ position: 'relative' }}>
                    <input type="file" className="form-input" style={{ padding: '6px' }} disabled={isUploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      showToast('Uploading prescription...', 'info');
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setAddlDetails({ ...addlDetails, prescriptionUrl: data.url });
                          showToast('Prescription uploaded', 'success');
                        } else {
                          showToast('Upload failed', 'error');
                        }
                      } catch (error) {
                        showToast('Upload error', 'error');
                      } finally {
                        setIsUploading(false);
                      }
                    }} />
                    {isUploading && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-secondary)' }} />}
                    {addlDetails.prescriptionUrl && (
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        <a href={addlDetails.prescriptionUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View Uploaded Prescription</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={addlDetails.notes} onChange={e => setAddlDetails({ ...addlDetails, notes: e.target.value })}></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Tastes and Preferences</label>
                  <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={addlDetails.tastesAndPreferences} onChange={e => setAddlDetails({ ...addlDetails, tastesAndPreferences: e.target.value })}></textarea>
                </div>
              </div>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Family Details</label>
                  <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={addlDetails.familyDetails} onChange={e => setAddlDetails({ ...addlDetails, familyDetails: e.target.value })}></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={addlDetails.address} onChange={e => setAddlDetails({ ...addlDetails, address: e.target.value })}></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowAddlDetails(false)}>Save Details</button>
              <button className="btn btn-ghost" onClick={() => setShowAddlDetails(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Advanced Search Modal */}
      {showAdvSearch && (
        <div className="modal-overlay" onClick={() => setShowAdvSearch(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }} onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setAdvSearchSelectedIndex(prev => Math.min(prev + 1, advSearchResults.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setAdvSearchSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              if (advSearchSelectedIndex >= 0 && advSearchSelectedIndex < advSearchResults.length) {
                e.preventDefault();
                handleSelectPatient(advSearchResults[advSearchSelectedIndex]);
                setShowAdvSearch(false);
              }
            }
          }} tabIndex={0}>
            <div className="modal-header">
              <h3>Advanced Patient Search</h3>
              <button className="modal-close" onClick={() => setShowAdvSearch(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="form-row form-row-4" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Patient Name</label>
                  <input autoFocus className="form-input" placeholder="Search by name" value={advSearchState.patientName} onChange={e => setAdvSearchState({ ...advSearchState, patientName: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="Search by phone" value={advSearchState.phone} onChange={e => setAdvSearchState({ ...advSearchState, phone: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} />
                </div>
                <div className="form-group">
                  <label className="form-label">UMR</label>
                  <input className="form-input" placeholder="Search by UMR" value={advSearchState.umr} onChange={e => setAdvSearchState({ ...advSearchState, umr: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} />
                </div>
              </div>

              <div className="form-row form-row-4" style={{ marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" placeholder="Age" value={advSearchState.age} onChange={e => setAdvSearchState({ ...advSearchState, age: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={advSearchState.gender} onChange={e => setAdvSearchState({ ...advSearchState, gender: e.target.value })}>
                    <option value="">Any</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Referred Doctor</label>
                  <input className="form-input" placeholder="Search by doctor" value={advSearchState.doctor} onChange={e => setAdvSearchState({ ...advSearchState, doctor: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <input className="form-input" placeholder="Search by source" value={advSearchState.source} onChange={e => setAdvSearchState({ ...advSearchState, source: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                <button className="btn btn-primary" onClick={handleAdvSearch} style={{ minWidth: 160 }} disabled={isSearching}>
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search Patients
                </button>
                <button className="btn btn-outline" onClick={() => {
                  setAdvSearchState({ patientName: '', umr: '', phone: '', age: '', gender: '', doctor: '', source: '' });
                  setAdvSearchResults([]);
                }}>Reset</button>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Search Results ({advSearchResults.length})</h4>
                  <button className="btn btn-outline btn-sm" onClick={handleCreatePatient}>
                    <UserPlus size={14} /> + Add New Patient
                  </button>
                </div>

                {advSearchResults.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    No patients found. Use the filters above or click "+ Add New Patient".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {advSearchResults.map((p, idx) => (
                      <div key={idx} onClick={() => { handleSelectPatient(p); setShowAdvSearch(false); }} onDoubleClick={() => { handleSelectPatient(p); setShowAdvSearch(false); }} className="adv-search-result-item" style={{ padding: 16, border: advSearchSelectedIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: advSearchSelectedIndex === idx ? 'var(--primary-light)' : 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{p.name} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>{p.umr}</span></div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {p.phone || 'No phone'} • {p.age ? `${p.age}y` : '--'} • {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : '--'}
                          </div>
                        </div>
                        <div>
                          <button type="button" className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleSelectPatient(p); setShowAdvSearch(false); }}>Select</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageSources && (
        <div className="modal-overlay" onClick={() => { setShowManageSources(false); setEditingSourceId(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '90%', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '12px 20px', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {!editingSourceId ? (
                  <>
                    <button className="btn btn-primary" onClick={() => {
                      const formContainer = document.getElementById('add-source-form');
                      if (formContainer) {
                        formContainer.style.display = formContainer.style.display === 'none' ? 'flex' : 'none';
                      }
                    }} style={{ background: '#e65100', color: 'white', border: 'none', borderRadius: 2 }}>Add Source Names</button>
                    <span 
                      style={{ fontWeight: 600, color: '#333', cursor: 'pointer' }} 
                      onClick={() => { setShowManageSources(false); setShowAddlDetails(true); }}
                    >
                      Back To Patient Addl Details
                    </span>
                  </>
                ) : (
                  <>
                    <button style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer', color: '#000' }} onClick={handleUpdateSource} disabled={isUpdatingSource}>
                      {isUpdatingSource ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingSourceId(null)}>Cancel</button>
                  </>
                )}
              </div>
              <button className="modal-close" onClick={() => { setShowManageSources(false); setEditingSourceId(null); }}>✕</button>
            </div>
            
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
              {!editingSourceId ? (
                <>
                  <div id="add-source-form" style={{ display: 'none', padding: 20, background: '#fff9f5', borderBottom: '1px solid #e0e0e0', gap: 12, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label">Source Name</label>
                      <input className="form-input" value={newSourceName} onChange={e => setNewSourceName(e.target.value)} placeholder="Enter new source name" />
                    </div>
                    <div className="form-group" style={{ margin: 0, width: 150 }}>
                      <label className="form-label">Status</label>
                      <select className="form-input form-select" value={newSourceStatus} onChange={e => setNewSourceStatus(e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="InActive">InActive</option>
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleSaveSource} disabled={isSavingSource} style={{ height: 38 }}>
                      {isSavingSource ? 'Saving...' : 'Save Source'}
                    </button>
                  </div>

                  <div style={{ padding: 20 }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e0e0e0', color: '#e65100', fontWeight: 600 }}>Source Name</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e0e0e0', color: '#e65100', fontWeight: 600 }}>Status</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '2px solid #e0e0e0', color: '#e65100', fontWeight: 600 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSources.map((s, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px 16px' }}>{s.name}</td>
                            <td style={{ padding: '12px 16px', color: s.status === 'InActive' ? 'red' : 'inherit' }}>{s.status}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <button className="btn btn-outline btn-sm" onClick={() => {
                                setEditingSourceId(s.id);
                                setEditingSourceName(s.name);
                                setEditingSourceStatus(s.status || 'Active');
                              }}>Edit</button>
                            </td>
                          </tr>
                        ))}
                        {allSources.length === 0 && (
                          <tr>
                            <td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#888' }}>No sources found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ padding: 20 }}>
                  <div style={{ border: '1px solid #e0e0e0', borderRadius: 4, padding: 0 }}>
                    <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #e0e0e0', fontWeight: 600, color: '#999', fontSize: 18 }}>Update Source</div>
                    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label style={{ width: 120, textAlign: 'right', fontWeight: 500, color: '#333' }}>Source Name:</label>
                        <input className="form-input" style={{ width: 250 }} value={editingSourceName} onChange={e => setEditingSourceName(e.target.value)} />
                        <span style={{ color: '#333' }}>*</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 120 }}></div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#333', fontWeight: 500 }}>
                          <input type="checkbox" style={{ width: 16, height: 16, cursor: 'pointer' }} checked={editingSourceStatus === 'InActive'} onChange={e => setEditingSourceStatus(e.target.checked ? 'InActive' : 'Active')} />
                          Check to Inactive
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
