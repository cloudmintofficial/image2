import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useReactToPrint } from 'react-to-print';
import { Loader2, ArrowLeft, Save, Printer } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function AddOrderModal({ isOpen, onClose, onSuccess, initialData }: AddOrderModalProps) {
  const { showToast } = useToast();
  const [isSavingEntity, setIsSavingEntity] = useState(false);
  const [currentSample, setCurrentSample] = useState('Select Sample');
  const [dbSampleTypes, setDbSampleTypes] = useState<any[]>([]);
  const [dbOrderTypes, setDbOrderTypes] = useState<any[]>([]);
  const [dbBillingCategories, setDbBillingCategories] = useState<any[]>([]);

  const [orderForm, setOrderForm] = useState({
    orderName: '', hasComponents: false, testCode: '', displayOrderName: '',
    department: 'NONE', amount: '', processTime: '', machineName: '',
    sampleType: 'Select Sample', method: '', advice: '',
    workSheet: '', purpose: '', orderType: 'Internal', ipBillingCategoryType: 'Select Category',
    recurring: false, serviceDoctorRequired: false, inactive: false, uiType: 'richtext'
  });

  const [resultNotesTab, setResultNotesTab] = useState<'Page 1' | 'Page 2'>('Page 1');
  const [resultNotesPage1, setResultNotesPage1] = useState('');
  const [resultNotesPage2, setResultNotesPage2] = useState('');

  const printRef = useRef<HTMLDivElement>(null);
  const handlePreviewPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Result_Notes_Preview'
  });

  useEffect(() => {
    // Fetch Sample Types
    fetch('/api/sample-types')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDbSampleTypes(data);
      })
      .catch(err => console.error('Failed to fetch sample types:', err));

    // Fetch Order Types
    fetch('/api/order-types')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDbOrderTypes(data);
      })
      .catch(err => console.error('Failed to fetch order types:', err));

    // Fetch Billing Categories
    fetch('/api/billing-categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDbBillingCategories(data);
      })
      .catch(err => console.error('Failed to fetch billing categories:', err));

    if (isOpen && initialData) {
      // Parse resultNotes to split back into page 1 and page 2 if needed
      let page1 = initialData.resultNotes || '';
      let page2 = '';
      if (page1.includes('class="page-1"') && page1.includes('class="page-2"')) {
        const p1Match = page1.match(/<div class="page-1">([\s\S]*?)<\/div><div class="page-break"/);
        const p2Match = page1.match(/<div class="page-2">([\s\S]*?)<\/div>$/);
        if (p1Match) page1 = p1Match[1];
        if (p2Match) page2 = p2Match[1];
      }

      setOrderForm({
        orderName: initialData.testName || '',
        hasComponents: initialData.hasComponents || false,
        testCode: initialData.testCode || '',
        displayOrderName: initialData.displayOrderName || '',
        department: initialData.department || 'NONE',
        amount: initialData.price?.toString() || '',
        processTime: initialData.processTime || '',
        machineName: initialData.machineName || '',
        sampleType: initialData.sampleType || 'Select Sample',
        method: initialData.method || '',
        advice: initialData.advice || '',
        workSheet: initialData.workSheet || '',
        purpose: initialData.purpose || '',
        orderType: initialData.orderType || 'Internal',
        ipBillingCategoryType: initialData.ipBillingCategoryType || 'Select Category',
        recurring: initialData.recurring || false,
        serviceDoctorRequired: initialData.serviceDoctorRequired || false,
        inactive: initialData.status === 'InActive',
        uiType: initialData.uiType || 'richtext'
      });
      setResultNotesPage1(page1);
      setResultNotesPage2(page2);
      setResultNotesTab('Page 1');
    } else if (isOpen && !initialData) {
      handleClear();
    }
  }, [isOpen, initialData]);

  const handleClear = () => {
    setOrderForm({
      orderName: '', hasComponents: false, testCode: '', displayOrderName: '',
      department: 'NONE', amount: '', processTime: '', machineName: '',
      sampleType: 'Select Sample', method: '', advice: '',
      workSheet: '', purpose: '', orderType: 'Internal', ipBillingCategoryType: 'Select Category',
      recurring: false, serviceDoctorRequired: false, inactive: false, uiType: 'richtext'
    });
    setResultNotesPage1('');
    setResultNotesPage2('');
    setResultNotesTab('Page 1');
  };

  const handleSaveNewOrder = async () => {
    if (!orderForm.orderName.trim()) {
      showToast('Order Name is required', 'error');
      return;
    }
    try {
      setIsSavingEntity(true);
      const combinedNotes = resultNotesPage2
        ? `<div class="page-1">${resultNotesPage1}</div><div class="page-break" style="page-break-before: always;"></div><div class="page-2">${resultNotesPage2}</div>`
        : resultNotesPage1;

      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id ? `/api/tests/${initialData.id}` : '/api/tests';

      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const labId = user?.labId || 1;

      const payload = {
        ...orderForm,
        amount: orderForm.amount ? orderForm.amount : '0',
        resultNotes: combinedNotes,
        status: orderForm.inactive ? 'InActive' : 'Active',
        labId
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(initialData?.id ? 'Order updated successfully' : 'Order added successfully', 'success');
        onSuccess();
        handleClear();
      } else if (res.status === 400) {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || 'Validation error', 'error');
      } else if (res.status === 409) {
        showToast('An order with this name already exists', 'error');
      } else {
        showToast(initialData?.id ? 'Failed to update order' : 'Failed to add order', 'error');
      }
    } catch (err) {
      showToast('Error saving order', 'error');
    } finally {
      setIsSavingEntity(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="full-page-overlay" style={{ zIndex: 2000 }}>
      <div className="full-page-workspace">
        <header className="workspace-header">
          <div className="header-left">
            <button className="btn btn-ghost" onClick={onClose}>
              <ArrowLeft size={20} /> Back to Order Entry
            </button>
            <div className="header-title-group">
              <h1>{initialData?.id ? 'Edit Order' : 'Create New Order'}</h1>
              <p>Define diagnostic test parameters and reporting templates</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={handleClear}>Clear Fields</button>
            <button className="btn btn-primary" onClick={handleSaveNewOrder} disabled={isSavingEntity} style={{ minWidth: '140px' }}>
              {isSavingEntity ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSavingEntity ? 'Saving...' : (initialData?.id ? 'Update Order' : 'Create Order')}
            </button>
          </div>
        </header>

        <div className="workspace-content">
          <div className="form-container">
            {/* General Information Section */}
            <div className="form-section">
              <h2 className="section-title">General Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Order Name *</label>
                  <input
                    className="form-input"
                    value={orderForm.orderName}
                    onChange={e => setOrderForm({ ...orderForm, orderName: e.target.value })}
                    placeholder="e.g. Complete Blood Picture"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Test Code</label>
                  <input
                    className="form-input"
                    value={orderForm.testCode}
                    onChange={e => setOrderForm({ ...orderForm, testCode: e.target.value })}
                    placeholder="Unique identifier"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input form-select" value={orderForm.department} onChange={e => setOrderForm({ ...orderForm, department: e.target.value })}>
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
                    <option value="RADIOLOGY">RADIOLOGY</option>
                    <option value="2 D ECHOCARDIOGRAM">2 D ECHOCARDIOGRAM</option>
                    <option value="PACKAGE INCLUSION">PACKAGE INCLUSION</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">UI Layout Type</label>
                  <select className="form-input form-select" value={orderForm.uiType} onChange={e => setOrderForm({ ...orderForm, uiType: e.target.value })}>
                    <option value="richtext">Rich Text (Radiology/General)</option>
                    <option value="panel">Panel (Numeric Results)</option>
                    <option value="single">Single Value</option>
                    <option value="microbiology">Microbiology / Culture</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price / Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={orderForm.amount}
                    onChange={e => setOrderForm({ ...orderForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Processing Time</label>
                  <input
                    className="form-input"
                    value={orderForm.processTime}
                    onChange={e => setOrderForm({ ...orderForm, processTime: e.target.value })}
                    placeholder="e.g. 24 Hours"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Machine Name</label>
                  <input
                    className="form-input"
                    value={orderForm.machineName}
                    onChange={e => setOrderForm({ ...orderForm, machineName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Order Type</label>
                  <select className="form-input form-select" value={orderForm.orderType} onChange={e => setOrderForm({ ...orderForm, orderType: e.target.value })}>
                    {dbOrderTypes.length > 0 ? (
                      dbOrderTypes.map(ot => <option key={ot.id} value={ot.name}>{ot.name}</option>)
                    ) : (
                      <option value="Internal">Internal</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">IP Billing Category Type</label>
                  <select className="form-input form-select" value={orderForm.ipBillingCategoryType} onChange={e => setOrderForm({ ...orderForm, ipBillingCategoryType: e.target.value })}>
                    <option value="Select Category">Select Category</option>
                    {dbBillingCategories.map(bc => (
                      <option key={bc.id} value={bc.name}>{bc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sample Type</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="form-input form-select" 
                      style={{ flex: 1 }}
                      value={currentSample} 
                      onChange={e => setCurrentSample(e.target.value)}
                    >
                      <option value="Select Sample">Select Sample</option>
                      {dbSampleTypes.map(st => (
                        <option key={st.id} value={st.name}>{st.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0 16px', height: '42px', borderRadius: '10px' }}
                      onClick={async () => {
                        if (currentSample !== 'Select Sample') {
                          // If currentSample is not in dbSampleTypes, it's a new one?
                          // Wait, the dropdown only has existing ones.
                          // Let's add a simple way to add new ones.
                          const current = orderForm.sampleType === 'Select Sample' ? '' : orderForm.sampleType;
                          const samples = current ? current.split(',').map(s => s.trim()) : [];
                          if (!samples.includes(currentSample)) {
                            setOrderForm({ ...orderForm, sampleType: [...samples, currentSample].join(', ') });
                          }
                          setCurrentSample('Select Sample');
                        }
                      }}
                    >
                      Add
                    </button>
                    <button 
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0 12px', height: '42px', borderRadius: '10px', fontSize: '12px' }}
                      onClick={async () => {
                        const newName = prompt('Enter new Sample Type:');
                        if (newName && newName.trim()) {
                          try {
                            const res = await fetch('/api/sample-types', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newName.trim() })
                            });
                            if (res.ok) {
                              const newSt = await res.json();
                              setDbSampleTypes(prev => [...prev, newSt].sort((a, b) => a.name.localeCompare(b.name)));
                              setCurrentSample(newSt.name);
                              showToast('Sample type added to database', 'success');
                            } else {
                              const err = await res.json();
                              showToast(err.error || 'Failed to add', 'error');
                            }
                          } catch (e) {
                            showToast('Error adding sample type', 'error');
                          }
                        }
                      }}
                      title="Add new sample type to database"
                    >
                      New
                    </button>
                  </div>
                  {orderForm.sampleType && orderForm.sampleType !== 'Select Sample' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {orderForm.sampleType.split(',').filter(s => s.trim()).map(sample => (
                        <div key={sample} className="sample-tag">
                          {sample.trim()}
                          <span 
                            className="tag-close" 
                            onClick={() => {
                              const samples = orderForm.sampleType.split(',').map(s => s.trim()).filter(s => s !== sample.trim());
                              setOrderForm({ ...orderForm, sampleType: samples.length > 0 ? samples.join(', ') : 'Select Sample' });
                            }}
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <input
                    className="form-input"
                    value={orderForm.method}
                    onChange={e => setOrderForm({ ...orderForm, method: e.target.value })}
                    placeholder="Sample Type" 
                  />
                </div>
              </div>

              <div className="checkbox-grid">
                <label className="checkbox-item">
                  <input type="checkbox" checked={orderForm.hasComponents} onChange={e => setOrderForm({ ...orderForm, hasComponents: e.target.checked })} />
                  <span>Has Parameters/Components</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" checked={orderForm.recurring} onChange={e => setOrderForm({ ...orderForm, recurring: e.target.checked })} />
                  <span>Recurring Order</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" checked={orderForm.serviceDoctorRequired} onChange={e => setOrderForm({ ...orderForm, serviceDoctorRequired: e.target.checked })} />
                  <span>Doctor Signature Required</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" checked={orderForm.inactive} onChange={e => setOrderForm({ ...orderForm, inactive: e.target.checked })} />
                  <span style={{ color: orderForm.inactive ? 'var(--danger)' : 'inherit' }}>Mark as Inactive</span>
                </label>
              </div>
            </div>

            {/* Reporting Templates Section */}
            <div className="form-section highlight">
              <div className="section-header">
                <h2 className="section-title">Diagnostic Template</h2>
                <div className="tab-group">
                  <button className={`tab-btn ${resultNotesTab === 'Page 1' ? 'active' : ''}`} onClick={() => setResultNotesTab('Page 1')}>Page 1</button>
                  <button className={`tab-btn ${resultNotesTab === 'Page 2' ? 'active' : ''}`} onClick={() => setResultNotesTab('Page 2')}>Page 2</button>
                  <button className="btn btn-outline btn-sm" onClick={handlePreviewPrint} style={{ marginLeft: 12 }}><Printer size={14} /> Preview</button>
                </div>
              </div>

              <div className="editor-wrapper">
                {resultNotesTab === 'Page 1' ? (
                  <RichTextEditor value={resultNotesPage1} onChange={setResultNotesPage1} minHeight={350} />
                ) : (
                  <RichTextEditor value={resultNotesPage2} onChange={setResultNotesPage2} minHeight={350} />
                )}
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="form-section">
              <h2 className="section-title">Additional Clinical Information</h2>
              <div className="form-grid-single">
                <div className="form-group">
                  <label className="form-label">Advice for Patient</label>
                  <div className="editor-wrapper">
                    <RichTextEditor value={orderForm.advice} onChange={val => setOrderForm({ ...orderForm, advice: val })} minHeight={120} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Internal Worksheet Template</label>
                  <div className="editor-wrapper">
                    <RichTextEditor value={orderForm.workSheet} onChange={val => setOrderForm({ ...orderForm, workSheet: val })} minHeight={120} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Order Purpose</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={orderForm.purpose}
                    onChange={e => setOrderForm({ ...orderForm, purpose: e.target.value })}
                    placeholder="Enter clinical purpose..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Content */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} style={{ padding: '30px', color: '#000', fontFamily: '"Inter", sans-serif', fontSize: '12px', lineHeight: '1.5' }}>
          {/* Optimized Barcode Placeholder */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <div style={{ textAlign: 'right' }}>
              <img 
                src="https://bwipjs-api.metafloor.com/?bcid=code128&text=BILL0000&scale=3&rotate=N&includetext=false" 
                alt="Barcode" 
                style={{ height: '40px', maxWidth: '220px' }}
              />
            </div>
          </div>

          {/* Professional Header matching screenshot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingBottom: '15px', borderBottom: '2px solid #000', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px auto', gap: '8px' }}>
              <span style={{ color: '#555' }}>Name</span><span style={{ fontWeight: 800 }}>: PatientName</span>
              <span style={{ color: '#555' }}>Age/Gender</span><span style={{ fontWeight: 800 }}>: AGE / GENDER</span>
              <span style={{ color: '#555' }}>Ref By</span><span style={{ fontWeight: 800 }}>: Self</span>
              <span style={{ color: '#555' }}>TypedBy</span><span>: </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px auto', gap: '8px' }}>
              <span style={{ color: '#555' }}>Bill / UMR Number</span><span style={{ fontWeight: 800 }}>: BillNumber / </span>
              <span style={{ color: '#555' }}>Bill Date</span><span style={{ fontWeight: 800 }}>: Date</span>
              <span style={{ color: '#555' }}>Reporting Date</span><span style={{ fontWeight: 800 }}>: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>

          {/* QR Code Placeholder matching screenshot */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
            <div style={{ width: '80px', height: '80px', padding: '4px', border: '1px solid #ddd' }}>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=PREVIEW" 
                alt="QR Code" 
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Test Name Header with Department branding matching screenshot */}
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            {orderForm.department && orderForm.department !== 'NONE' && (
              <h2 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 4px 0', textTransform: 'uppercase', color: '#000' }}>
                {orderForm.department === 'RADIOLOGY' ? 'DEPARTMENT OF RADIOLOGY AND IMAGING SCIENCES' : `DEPARTMENT OF ${orderForm.department}`}
              </h2>
            )}
            <h1 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
              {orderForm.orderName || 'DIAGNOSTIC TEST PREVIEW'}
            </h1>
          </div>

          <div dangerouslySetInnerHTML={{ __html: resultNotesPage1 }} />
          {resultNotesPage2 && (
            <>
              <div style={{ pageBreakBefore: 'always' }} />
              <div dangerouslySetInnerHTML={{ __html: resultNotesPage2 }} />
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .full-page-overlay {
          position: fixed;
          inset: 0;
          background: #fff;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .full-page-workspace {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8fafc;
        }

        .workspace-header {
          padding: 16px 40px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .header-title-group h1 {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .header-title-group p {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .header-actions {
          display: flex;
          gap: 16px;
        }

        .workspace-content {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
        }

        .form-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding-bottom: 80px;
        }

        .form-section {
          background: #fff;
          padding: 32px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .form-section.highlight {
          border-left: 4px solid var(--primary);
        }

        .section-title {
          font-size: 14px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sample-tag {
          background: #f1f5f9;
          color: #334155;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e2e8f0;
        }

        .tag-close {
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .tag-close:hover {
          color: var(--danger);
        }

        .section-title::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .form-grid-single {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .tab-group {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          gap: 4px;
        }

        .tab-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          color: #64748b;
          background: transparent;
        }

        .tab-btn.active {
          background: #fff;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .editor-wrapper {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #fff;
        }

        @media (max-width: 1024px) {
          .form-grid { grid-template-columns: repeat(2, 1fr); }
          .checkbox-grid { grid-template-columns: repeat(2, 1fr); }
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
