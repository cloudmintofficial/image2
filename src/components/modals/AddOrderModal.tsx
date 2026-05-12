import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useReactToPrint } from 'react-to-print';
import { Loader2 } from 'lucide-react';
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>{initialData?.id ? 'Update Order' : 'Add Order'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
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

          <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>UI Type:</label>
          <select className="form-input form-select" value={orderForm.uiType} onChange={e => setOrderForm({ ...orderForm, uiType: e.target.value })}>
            <option value="richtext">Rich Text (Radiology/General)</option>
            <option value="panel">Panel (Numeric Results)</option>
            <option value="single">Single Value</option>
            <option value="microbiology">Microbiology / Culture</option>
            <option value="immunology">Immunology / Serology</option>
          </select>

          <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Test Code:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input className="form-input" style={{ width: '100%' }} value={orderForm.testCode} onChange={e => setOrderForm({ ...orderForm, testCode: e.target.value })} />
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
          </div>

          <label className="form-label" style={{ textAlign: 'right', marginTop: 8 }}>Process Time:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input className="form-input" style={{ width: '100%' }} value={orderForm.processTime} onChange={e => setOrderForm({ ...orderForm, processTime: e.target.value })} />
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
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-outline" onClick={handleClear}>Clear</button>
          <button className="btn btn-primary" onClick={handleSaveNewOrder} disabled={isSavingEntity}>
            {isSavingEntity ? <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} /> : null}
            {isSavingEntity ? 'Saving...' : (initialData?.id ? 'Update Order' : 'Save Order')}
          </button>
        </div>
      </div>
    </div>
  );
}
