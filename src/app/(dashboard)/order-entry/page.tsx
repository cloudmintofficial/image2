'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Search, UserPlus, FileText, Beaker, MapPin, X, FileSignature, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '@/context/ToastContext';
import { useReactToPrint } from 'react-to-print';
import AddOrderModal from '@/components/modals/AddOrderModal';
import PastOrdersModal from '@/components/modals/PastOrdersModal';

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
  const [patientStatus, setPatientStatus] = useState<string | null>(null);
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

  // Selection skip flags
  const doctorSelected = useRef(false);
  const sourceSelected = useRef(false);
  const orderSelected = useRef(false);

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

  const totalBill = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const numericDiscount = Math.min(totalBill, typeof discountAmount === 'string' ? parseFloat(discountAmount) || 0 : Number(discountAmount) || 0);
  const numericPaid = Math.min(totalBill - numericDiscount, typeof paidAmount === 'string' ? parseFloat(paidAmount) || 0 : Number(paidAmount) || 0);
  const balance = Math.max(0, totalBill - numericDiscount - numericPaid);
  const today = new Date().toLocaleDateString('en-GB');

  // Dispatch disabled actions for TopNav
  useEffect(() => {
    const disabled = [];
    // Disable Submit and Enter Results if form is incomplete
    if (!name || !phone || orders.length === 0 || isSubmittingBill) {
      disabled.push('Submit');
    }
    window.dispatchEvent(new CustomEvent('set-disabled-actions', { detail: disabled }));
  }, [name, phone, orders.length, isSubmittingBill]);



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
      if (orderSelected.current) {
        orderSelected.current = false;
        setOrderSuggestions([]);
        return;
      }
      if (orderSearch.length >= 1) {
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
      if (doctorSelected.current) {
        doctorSelected.current = false;
        setDoctorSuggestions([]);
        return;
      }
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
      if (sourceSelected.current) {
        sourceSelected.current = false;
        setSourceSuggestions([]);
        return;
      }
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

  // Real-time patient lookup by phone to prevent duplicates
  useEffect(() => {
    const lookupPatient = async () => {
      if (phone.length < 10) {
        setPatientStatus(null);
        return;
      }
      
      if (!patientId) {
        setPatientStatus('Checking...');
        try {
          const res = await fetch(`/api/patients/advanced-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone.trim() })
          });
          if (res.ok) {
            const results = await res.json();
            const matches = results.filter((r: any) => r.phone === phone.trim());
            if (matches.length > 0) {
              setPatientStatus(`${matches.length} Profile${matches.length > 1 ? 's' : ''}`);
              showToast(`${matches.length} patient(s) found with this number.`, 'info');
            } else {
              setPatientStatus('New Patient');
            }
          } else {
            setPatientStatus(null);
          }
        } catch (e) {
          setPatientStatus(null);
        }
      } else {
        setPatientStatus('Profile Selected');
      }
    };
    const tid = setTimeout(lookupPatient, 800);
    return () => clearTimeout(tid);
  }, [phone, patientId]);

  const addOrder = (test: any) => {
    // Prevent duplicate orders
    const exists = orders.find(o => o.name.toLowerCase() === (test.displayOrderName || test.name).toLowerCase());
    if (exists) {
      showToast(`"${test.name}" is already added`, 'warning');
      setOrderSearch('');
      setOrderSuggestions([]);
      return;
    }

    const displayName = (test.displayOrderName && test.displayOrderName.trim().toLowerCase() !== 'blank')
      ? test.displayOrderName
      : test.name;

    setOrders(prev => [
      ...prev,
      { sno: prev.length + 1, name: displayName, date: today, amount: test.price || 0 }
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
    // If phone is missing, don't call the API yet. Instead, populate the main form 
    // and let the user complete the registration there.
    if (!advSearchState.phone || !advSearchState.phone.trim()) {
      setName(advSearchState.patientName || '');
      setAge(advSearchState.age || '');
      setGender(advSearchState.gender as any || 'M');
      setPhone(advSearchState.phone || '');
      setSource(advSearchState.source || '');
      setDoctor(advSearchState.doctor || '');
      setPatientId(null);
      setShowAdvSearch(false);
      showToast('Patient details populated. Please enter phone number to continue.', 'info');
      return;
    }

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

  const handleRepeatOrder = (order: any) => {
    // Prevent duplicate orders
    const exists = orders.find(o => o.name.toLowerCase() === order.orderName.toLowerCase());
    if (exists) {
      showToast('This test is already in the current bill', 'warning');
      return;
    }

    setOrders(prev => [...prev, {
      sno: prev.length + 1,
      name: order.orderName,
      date: new Date().toISOString().split('T')[0],
      amount: Number(order.amount) || 0,
      testId: order.testId || null
    }]);
    setShowPatOrders(false);
    showToast(`${order.orderName} added to current bill!`, 'success');
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

  const handleDOBChange = (val: string) => {
    setAddlDetails(prev => ({ ...prev, dob: val }));
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
    if (!phone || !phone.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!age || age.toString().trim() === '') {
      showToast('Patient age is required', 'error');
      return;
    }
    const parsedAge = parseInt(age.toString());
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      showToast('Please enter a valid age between 0 and 120', 'error');
      return;
    }
    if (phone.trim().length !== 10) {
      showToast('Mobile number must be exactly 10 digits.', 'error');
      return;
    }

    try {
      setIsSubmittingBill(true);

      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      const trimmedDoctor = doctor.trim();
      const trimmedSource = source.trim();

      if (totalBill <= 0) {
        showToast('Total bill amount must be greater than zero', 'error');
        setIsSubmittingBill(false);
        return;
      }

      let finalPatientId = patientId;

      // Create patient if new
      if (!finalPatientId) {
        // Let user know if they are creating a duplicate, but don't block them
        const dupRes = await fetch(`/api/patients/advanced-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: trimmedPhone })
        });
        if (dupRes.ok) {
          const dupData = await dupRes.json();
          if (dupData.length > 0) {
            showToast(`Note: ${dupData.length} other patient(s) found with this number. Creating a new profile.`, 'info');
          }
        }

        const pRes = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            age: age.toString(),
            gender,
            phone: trimmedPhone,
            source: trimmedSource,
            additionalDetails: addlDetails
          })
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
          body: JSON.stringify({
            name: trimmedName,
            age: age.toString(),
            gender,
            phone: trimmedPhone,
            source: trimmedSource,
            additionalDetails: addlDetails
          })
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
          totalBill: parseFloat(totalBill.toString()),
          discount: parseFloat(discountAmount.toString()),
          discountReason: discountReason.trim(),
          paidAmount: parseFloat(paidAmount.toString()),
          balance: parseFloat(balance.toString()),
          paymentType,
          referenceNumber: referenceNumber.trim(),
          orders: orders.map(o => ({ ...o, amount: parseFloat(o.amount.toString()) })),
          createdBy: parseInt(user.id?.toString() || '1'),
          labId: parseInt(user.labId?.toString() || '1'),
          doctorName: trimmedDoctor
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
    if (orders.length > 0) {
      if (!confirm('You have unsaved orders. Are you sure you want to clear the form?')) {
        return;
      }
    }
    setPatientId(null);
    setPhoneUmr(''); setName(''); setAge(''); setGender('M');
    setSource(''); setPhone(''); setDoctor('');
    setOrders([]); setOrderSearch(''); setPaidAmount(0);
    setDiscountAmount(0); setDiscountReason('');
    setPaymentType('Cash'); setReferenceNumber('');
    setPatientStatus(null);
  };

  // Listen for top nav actions
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail;
      switch (action) {
        case 'Submit': handleSubmit(); break;
        case 'Clear': handleClear(); break;
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

  // handleSaveNewOrder and associated state moved to AddOrderModal component

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
            if (!name.trim() || !phone.trim()) showToast('Patient name and phone number are required', 'error');
            else showToast('Patient added', 'success');
          }}>
            <UserPlus size={14} /> Add
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>

        {/* Main Form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Patient Info Card */}
          <div className={`card ${patientId ? 'patient-card-selected' : ''}`} style={{ marginBottom: 20, overflow: 'visible', position: 'relative', zIndex: 10 }}>
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
                    if (!name.trim() || !phone.trim()) {
                      showToast('Patient name and phone number are required', 'error');
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
                  {isLoadingPatOrders ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Past Orders
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowAddlDetails(true)}>Addl. Details</button>
              </div>
            </div>
            <div className="card-body" style={{ padding: '24px 28px' }}>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px 32px' }}>
                {/* Row 1: Primary Info */}
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className={`form-input ${!name ? 'required' : ''}`} placeholder="Patient full name" value={name} onChange={e => setName(e.target.value)} style={{ height: 40 }} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Phone *</span>
                    {patientStatus && (
                      <span style={{ 
                        fontSize: 9, 
                        padding: '2px 8px', 
                        borderRadius: 12, 
                        background: patientStatus?.includes('Profile') ? 'var(--success-bg)' : patientStatus === 'New Patient' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)',
                        color: patientStatus?.includes('Profile') ? 'var(--success)' : patientStatus === 'New Patient' ? '#3b82f6' : 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: `1px solid ${patientStatus === 'Existing' ? 'rgba(34, 197, 94, 0.2)' : patientStatus === 'New' ? 'rgba(59, 130, 246, 0.2)' : 'var(--border)'}`
                      }}>
                        {patientStatus}
                      </span>
                    )}
                  </label>
                  <input 
                    className="form-input" 
                    placeholder="Contact number" 
                    value={phone} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setPhone(val);
                    }} 
                    style={{ height: 40 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Age / Gender *</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input 
                      className="form-input" 
                      type="number" 
                      placeholder="Age" 
                      style={{ width: 85, height: 40 }} 
                      value={age} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 120)) {
                          setAge(val);
                        }
                      }}
                      onBlur={e => {
                        if (e.target.value) {
                          setAge(parseInt(e.target.value).toString());
                        }
                      }}
                    />
                    <div className="form-radio-group" style={{ height: 40, display: 'flex', alignItems: 'center', flex: 1, padding: '0 4px' }}>
                      <label style={{ marginRight: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><input type="radio" name="gender" checked={gender === 'M'} onChange={() => setGender('M')} /> M</label>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><input type="radio" name="gender" checked={gender === 'F'} onChange={() => setGender('F')} /> F</label>
                    </div>
                  </div>
                </div>

                {/* Row 2: Secondary Info */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Source</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      placeholder="Referral source"
                      value={source}
                      onChange={e => setSource(e.target.value)}
                      onFocus={() => { setDoctorSuggestions([]); setOrderSuggestions([]); }}
                      style={{ paddingRight: 32, height: 40 }}
                    />
                    {isSearchingSourcesDropdown && (
                      <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  {sourceSuggestions.length > 0 && (
                    <div className="suggestion-dropdown">
                      {sourceSuggestions.map((src, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            sourceSelected.current = true;
                            setSource(src.name);
                            setSourceSuggestions([]);
                          }}
                        >
                          <div className="name">{src.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Doctor</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      placeholder="Referring doctor"
                      value={doctor}
                      onChange={e => setDoctor(e.target.value)}
                      onFocus={() => { setSourceSuggestions([]); setOrderSuggestions([]); }}
                      style={{ paddingRight: 32, height: 40 }}
                    />
                    {isSearchingDoctorsDropdown && (
                      <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  {doctorSuggestions.length > 0 && (
                    <div className="suggestion-dropdown">
                      {doctorSuggestions.map((doc, idx) => (
                        <div
                          key={idx}
                          className="suggestion-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            doctorSelected.current = true;
                            setDoctor(doc.name);
                            setDoctorSuggestions([]);
                          }}
                        >
                          <div className="name">{doc.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Section */}
          <div className="card" style={{ marginBottom: 20, overflow: 'visible', position: 'relative', zIndex: 9 }}>
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
                    onFocus={() => { setDoctorSuggestions([]); setSourceSuggestions([]); }}
                    style={{ paddingRight: 32 }}
                  />
                  {isSearchingOrdersDropdown && (
                    <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  )}
                </div>
                {orderSuggestions.length > 0 && (
                  <div className="suggestion-dropdown">
                    {orderSuggestions.map((test, i) => (
                      <div
                        key={i}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          orderSelected.current = true;
                          addOrder(test);
                        }}
                      >
                        <div className="name">{test.name}</div>
                        <div className="sub">{test.category}</div>
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
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>₹{Number(totalBill).toFixed(2)}</div>
                </div>
                {discountAmount > 0 && (
                  <div className="form-group">
                    <label className="form-label">Discount</label>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger)' }}>-₹{Number(discountAmount).toFixed(2)}</div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Paid Amount</label>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ padding: '0 8px', height: 20, fontSize: 10, textTransform: 'uppercase' }}
                      onClick={() => setPaidAmount(Math.max(0, totalBill - numericDiscount))}
                    >
                      Pay Full
                    </button>
                  </div>
                  <input
                    className="form-input"
                    type="text"
                    inputMode="decimal"
                    value={paidAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={e => {
                      let val = e.target.value.replace(/[^0-9.]/g, '');
                      if (val.startsWith('0') && val.length > 1 && val[1] !== '.') {
                        val = val.replace(/^0+/, '');
                      }
                      
                      const netTotal = Math.max(0, totalBill - numericDiscount);
                      const numVal = parseFloat(val) || 0;
                      
                      if (numVal > netTotal) {
                        setPaidAmount(netTotal);
                      } else if (val === '') {
                        setPaidAmount(0);
                      } else {
                        setPaidAmount(val as any);
                      }
                    }}
                    onBlur={() => {
                      const netTotal = Math.max(0, totalBill - numericDiscount);
                      const current = Math.max(0, Number(paidAmount) || 0);
                      setPaidAmount(current > netTotal ? netTotal : current);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance</label>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: Math.abs(balance) > 0.01 ? 'var(--danger)' : 'var(--success)',
                    transition: 'color 0.3s ease'
                  }}>
                    ₹{balance.toFixed(2)}
                  </div>
                  {balance > 0.01 && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', marginTop: 4, textTransform: 'uppercase' }}>
                      ⚠️ Payment Pending
                    </div>
                  )}
                  {balance < -0.01 && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2196f3', marginTop: 4, textTransform: 'uppercase' }}>
                      ℹ️ Advance Received
                    </div>
                  )}
                  {Math.abs(balance) <= 0.01 && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', marginTop: 4, textTransform: 'uppercase' }}>
                      ✅ Fully Paid
                    </div>
                  )}
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
              <input 
                className="form-input" 
                value={docPhone} 
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setDocPhone(val);
                }} 
                placeholder="10 digit phone number" 
              />

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

      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        onSuccess={() => {
          // If we want to refresh order suggestions or do anything else
          setShowAddOrderModal(false);
        }}
      />

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
                  type="text"
                  inputMode="decimal"
                  value={discountAmount || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9.]/g, '');
                    if (val.startsWith('0') && val.length > 1 && val[1] !== '.') {
                      val = val.replace(/^0+/, '');
                    }
                    if (val === '') setDiscountAmount(0);
                    else setDiscountAmount(val as any);
                  }}
                  onBlur={() => setDiscountAmount(Number(discountAmount) || 0)}
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
      <PastOrdersModal
        isOpen={showPatOrders}
        onClose={() => setShowPatOrders(false)}
        pastOrders={pastOrders}
        patientInfo={{ name, phone }}
        onRepeatOrder={handleRepeatOrder}
      />

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
                  <label className="form-label">Patient Phone *</label>
                  <input 
                    className="form-input" 
                    value={phone} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setPhone(val);
                    }} 
                  />
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
                  <label className="form-label">DOB</label>
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
                              onMouseDown={(e) => {
                                e.preventDefault();
                                sourceSelected.current = true;
                                setSource(src.name);
                                setSourceSuggestions([]);
                              }}
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
              <button className="btn btn-primary" onClick={() => {
                if (!name.trim()) return showToast('Patient Name is required', 'warning');
                if (!phone.trim()) return showToast('Phone Number is required', 'warning');
                if (phone.trim().length !== 10) return showToast('Phone Number must be exactly 10 digits', 'warning');
                if (!addlDetails.dob) return showToast('Date of Birth is required', 'warning');
                setShowAddlDetails(false);
              }}>Save Details</button>
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
                  <input 
                    className="form-input" 
                    placeholder="Search by phone" 
                    value={advSearchState.phone} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setAdvSearchState({ ...advSearchState, phone: val });
                    }} 
                    onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} 
                  />
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
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {!editingSourceId ? (
                  <>
                    <button className="btn btn-primary" onClick={() => {
                      const formContainer = document.getElementById('add-source-form');
                      if (formContainer) {
                        formContainer.style.display = formContainer.style.display === 'none' ? 'flex' : 'none';
                      }
                    }}>Add Source Names</button>
                    <span
                      style={{ fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => { setShowManageSources(false); setShowAddlDetails(true); }}
                    >
                      Back To Patient Addl Details
                    </span>
                  </>
                ) : (
                  <>
                    <button className="btn btn-ghost" onClick={handleUpdateSource} disabled={isUpdatingSource}>
                      {isUpdatingSource ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setEditingSourceId(null)}>Cancel</button>
                  </>
                )}
              </div>
              <button className="modal-close" onClick={() => { setShowManageSources(false); setEditingSourceId(null); }}>✕</button>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
              {!editingSourceId ? (
                <>
                  <div id="add-source-form" style={{ display: 'none', padding: 20, background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)', gap: 12, alignItems: 'flex-end' }}>
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
                          <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid var(--border)', color: 'var(--primary)', fontWeight: 600 }}>Source Name</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid var(--border)', color: 'var(--primary)', fontWeight: 600 }}>Status</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '2px solid var(--border)', color: 'var(--primary)', fontWeight: 600 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSources.map((s, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 16px' }}>{s.name}</td>
                            <td style={{ padding: '12px 16px', color: s.status === 'InActive' ? 'var(--danger)' : 'inherit' }}>{s.status}</td>
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
                            <td colSpan={3} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No sources found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ padding: 20 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: 0 }}>
                    <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 18 }}>Update Source</div>
                    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label style={{ width: 120, textAlign: 'right', fontWeight: 500, color: 'var(--text-primary)' }}>Source Name:</label>
                        <input className="form-input" style={{ width: 250 }} value={editingSourceName} onChange={e => setEditingSourceName(e.target.value)} />
                        <span style={{ color: 'var(--text-primary)' }}>*</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 120 }}></div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
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
      <style jsx>{`
        .order-entry-container {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card {
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .patient-card-selected {
          border-color: var(--primary);
          background: #fff;
          box-shadow: 0 0 0 1px var(--primary), 0 10px 20px -5px rgba(232, 117, 26, 0.1);
        }

        .card-header {
          padding: 18px 24px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
        }

        .card-title {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .form-row {
          gap: 24px;
        }

        .form-group {
          margin-bottom: 0;
        }

        .form-label {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
        }

        .suggestion-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 100;
          max-height: 300px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .suggestion-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: #f8fafc;
          padding-left: 20px;
        }

        .suggestion-item .name {
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
        }

        .suggestion-item .sub {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .btn-sm {
          padding: 8px 16px;
          border-radius: 10px;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
