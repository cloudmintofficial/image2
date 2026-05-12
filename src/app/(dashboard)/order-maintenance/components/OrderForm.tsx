'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useReactToPrint } from 'react-to-print';
import { Loader2, ArrowLeft, Save, Trash2, Printer } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

interface OrderFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function OrderForm({ initialData, isEdit = false }: OrderFormProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isSavingEntity, setIsSavingEntity] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

    if (initialData) {
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
        orderName: initialData.testName || initialData.name || '',
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
    }
  }, [initialData]);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all fields?')) {
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
    }
  };

  const handleSave = async () => {
    if (!orderForm.orderName.trim()) {
      showToast('Order Name is required', 'error');
      return;
    }
    try {
      setIsSavingEntity(true);
      const combinedNotes = resultNotesPage2
        ? `<div class="page-1">${resultNotesPage1}</div><div class="page-break" style="page-break-before: always;"></div><div class="page-2">${resultNotesPage2}</div>`
        : resultNotesPage1;

      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/tests/${initialData.id}` : '/api/tests';

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
        showToast(isEdit ? 'Order updated successfully' : 'Order added successfully', 'success');
        router.push('/order-maintenance');
        router.refresh();
      } else if (res.status === 400) {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || 'Validation error', 'error');
      } else if (res.status === 409) {
        showToast('An order with this name already exists', 'error');
      } else {
        showToast(isEdit ? 'Failed to update order' : 'Failed to add order', 'error');
      }
    } catch (err) {
      showToast('Error saving order', 'error');
    } finally {
      setIsSavingEntity(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    
    if (!confirm(`Are you sure you want to permanently delete "${orderForm.orderName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/tests/${initialData.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Order deleted successfully', 'success');
        router.push('/order-maintenance');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete order', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting order', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="order-form-workspace">
      {/* Action Header */}
      <div className="workspace-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => router.push('/order-maintenance')} title="Go Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="workspace-title">{isEdit ? 'Update Order' : 'Add Order'}</h1>
            <p className="workspace-subtitle">Configure diagnostic test parameters and reporting templates</p>
          </div>
        </div>
        <div className="header-actions">
          {isEdit && (
            <button 
              className="btn btn-outline" 
              onClick={handleDelete} 
              disabled={isDeleting || isSavingEntity}
              style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', gap: '8px' }}
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isDeleting ? 'Deleting...' : 'Delete Order'}
            </button>
          )}
          <button className="btn btn-outline" onClick={handleClear} style={{ gap: '8px' }}>
            <Trash2 size={16} /> Clear
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSavingEntity || isDeleting} style={{ minWidth: '140px' }}>
            {isSavingEntity ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSavingEntity ? 'Saving...' : (isEdit ? 'Update Order' : 'Save Order')}
          </button>
        </div>
      </div>

      <div className="workspace-content">
        <div className="form-container-card">
          {/* Main Info Section */}
          <div className="form-section">
            <h2 className="section-title-main">General Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Order Name <span className="required">*</span></label>
                <input 
                  className="form-input" 
                  value={orderForm.orderName} 
                  onChange={e => setOrderForm({ ...orderForm, orderName: e.target.value })} 
                  placeholder="e.g. COMPLETE BLOOD PICTURE"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Test Code</label>
                <input 
                  className="form-input" 
                  value={orderForm.testCode} 
                  onChange={e => setOrderForm({ ...orderForm, testCode: e.target.value })} 
                  placeholder="e.g. CBP001"
                />
              </div>

              <div className="form-group">
                <label className="form-label">UI Type</label>
                <select 
                  className="form-select" 
                  value={orderForm.uiType} 
                  onChange={e => setOrderForm({ ...orderForm, uiType: e.target.value })}
                >
                  <option value="richtext">Rich Text (Radiology/General)</option>
                  <option value="panel">Panel (Numeric Results)</option>
                  <option value="single">Single Value</option>
                  <option value="microbiology">Microbiology / Culture</option>
                  <option value="immunology">Immunology / Serology</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className="form-select" 
                  value={orderForm.department} 
                  onChange={e => setOrderForm({ ...orderForm, department: e.target.value })}
                >
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
                <label className="form-label">Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}>₹</span>
                  <input 
                    className="form-input" 
                    style={{ paddingLeft: '28px' }}
                    type="number" 
                    value={orderForm.amount} 
                    onChange={e => setOrderForm({ ...orderForm, amount: e.target.value })} 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Process Time</label>
                <input 
                  className="form-input" 
                  value={orderForm.processTime} 
                  onChange={e => setOrderForm({ ...orderForm, processTime: e.target.value })} 
                  placeholder="e.g. 2 Hours"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Display Order Name</label>
                <input 
                  className="form-input" 
                  value={orderForm.displayOrderName} 
                  onChange={e => setOrderForm({ ...orderForm, displayOrderName: e.target.value })} 
                  placeholder="Name as it appears on reports (leave empty for default)"
                />
                <p className="form-hint">Enter "blank" to hide the name on printed reports.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Sample Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    className="form-select" 
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
                    onClick={() => {
                      if (currentSample !== 'Select Sample') {
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
                      <div key={sample} className="sample-tag-maintenance">
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

              <div className="form-group">
                <label className="form-label">Machine Name</label>
                <input 
                  className="form-input" 
                  value={orderForm.machineName} 
                  onChange={e => setOrderForm({ ...orderForm, machineName: e.target.value })} 
                  placeholder="e.g. Sysmex XN-1000"
                />
              </div>

                <div className="form-group">
                  <label className="form-label">Order Type</label>
                  <select 
                    className="form-select" 
                    value={orderForm.orderType} 
                    onChange={e => setOrderForm({ ...orderForm, orderType: e.target.value })}
                  >
                    {dbOrderTypes.length > 0 ? (
                      dbOrderTypes.map(ot => <option key={ot.id} value={ot.name}>{ot.name}</option>)
                    ) : (
                      <option value="Internal">Internal</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">IP Billing Category Type</label>
                  <select 
                    className="form-select" 
                    value={orderForm.ipBillingCategoryType} 
                    onChange={e => setOrderForm({ ...orderForm, ipBillingCategoryType: e.target.value })}
                  >
                    <option value="Select Category">Select Category</option>
                    {dbBillingCategories.map(bc => (
                      <option key={bc.id} value={bc.name}>{bc.name}</option>
                    ))}
                  </select>
                </div>

              <div className="form-group" style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '32px', padding: '16px', background: 'var(--bg-main)', borderRadius: '12px', marginTop: '8px' }}>
                <label className="checkbox-container">
                  <input type="checkbox" checked={orderForm.hasComponents} onChange={e => setOrderForm({ ...orderForm, hasComponents: e.target.checked })} />
                  <span className="checkbox-label">Has Components</span>
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={orderForm.recurring} onChange={e => setOrderForm({ ...orderForm, recurring: e.target.checked })} />
                  <span className="checkbox-label">Recurring</span>
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={orderForm.serviceDoctorRequired} onChange={e => setOrderForm({ ...orderForm, serviceDoctorRequired: e.target.checked })} />
                  <span className="checkbox-label">Service Doctor Required</span>
                </label>
                <label className="checkbox-container">
                  <input type="checkbox" checked={orderForm.inactive} onChange={e => setOrderForm({ ...orderForm, inactive: e.target.checked })} />
                  <span className="checkbox-label" style={{ color: orderForm.inactive ? 'var(--danger)' : 'inherit' }}>Mark as Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Template Section */}
          <div className="form-section no-border">
            <div className="section-header">
              <h2 className="section-title-main">Reporting Template</h2>
              <div className="section-actions">
                <div className="tab-group">
                  <button className={`tab-btn ${resultNotesTab === 'Page 1' ? 'active' : ''}`} onClick={() => setResultNotesTab('Page 1')}>Page 1</button>
                  <button className={`tab-btn ${resultNotesTab === 'Page 2' ? 'active' : ''}`} onClick={() => setResultNotesTab('Page 2')}>Page 2</button>
                </div>
                <button className="btn btn-outline btn-sm" onClick={handlePreviewPrint}>
                  <Printer size={14} /> Preview Template
                </button>
              </div>
            </div>
            <div className="editor-wrapper">
              {resultNotesTab === 'Page 1' && (
                <RichTextEditor value={resultNotesPage1} onChange={setResultNotesPage1} minHeight={350} />
              )}
              {resultNotesTab === 'Page 2' && (
                <RichTextEditor value={resultNotesPage2} onChange={setResultNotesPage2} minHeight={350} />
              )}
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="form-section">
            <h2 className="section-title-main">Additional Clinical Info</h2>
            <div className="form-grid-single">
              <div className="form-group">
                <label className="form-label">Advice</label>
                <div className="editor-wrapper">
                  <RichTextEditor value={orderForm.advice} onChange={val => setOrderForm({ ...orderForm, advice: val })} minHeight={120} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">WorkSheet Instructions</label>
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
                  placeholder="Enter the clinical purpose or background for this diagnostic order..." 
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>


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

      <style jsx>{`
        .order-form-workspace {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 64px);
          background: #f8fafc;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background: #fff;
          border-bottom: 1px solid var(--border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .btn-back {
          background: #f1f5f9;
          border: 1px solid var(--border);
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-back:hover {
          background: #fff;
          color: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .workspace-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.025em;
        }

        .sample-tag-maintenance {
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

        .workspace-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 2px 0 0 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .workspace-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .form-container-card {
          max-width: 1100px;
          margin: 0 auto 60px;
          background: #fff;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .form-section {
          padding: 40px;
          border-bottom: 1px solid #f1f5f9;
        }

        .form-section.no-border {
          border-bottom: none;
        }

        .section-title-main {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .section-title-main::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px 32px;
        }

        .form-grid-single {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.025em;
        }

        .required {
          color: #ef4444;
          margin-left: 2px;
        }

        .form-input, .form-select {
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 14px;
          background: #fff;
          color: #1e293b;
          transition: all 0.2s;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(232, 117, 26, 0.1);
        }

        .form-hint {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }

        .editor-section {
          margin-top: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-actions {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .tab-group {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 14px;
        }

        .tab-btn {
          padding: 10px 24px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: #fff;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-primary {
          background: var(--primary-gradient);
          color: #fff;
          border: none;
          box-shadow: 0 4px 12px rgba(232, 117, 26, 0.2);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(232, 117, 26, 0.3);
        }

        .btn-outline {
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
        }

        .btn-outline:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .btn-sm {
          padding: 8px 18px;
          font-size: 12.5px;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .editor-wrapper {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #fff;
          transition: border-color 0.2s;
        }

        .editor-wrapper:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(232, 117, 26, 0.05);
        }

        @media (max-width: 1024px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
