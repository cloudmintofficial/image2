'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Plus, Edit, Trash2, Printer, Layout, Type } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function OrderComponentsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params.id;
  const templateId = searchParams.get('templateId');
  const { showToast } = useToast();

  const [test, setTest] = useState<any>(null);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [showOrderFontModal, setShowOrderFontModal] = useState(false);
  const [fontForm, setFontForm] = useState({
    fontFamily: '', patientDetailsFont: '', departmentNameFont: '', orderNameFont: '',
    resultHeadingFont: '', subHeadingFont: '', componentNameFont: '', methodFont: '',
    resultNotesFont: '', leftSignatureFont: '', rightSignatureFont: '',
    spaceBeforeLineFont: '', spaceAfterLineFont: ''
  });
  const [isSavingFont, setIsSavingFont] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleString());
  }, []);

  const [compForm, setCompForm] = useState({
    componentName: '', subHeading: '', machineCode: '', specimenCode: '',
    unit: '', normalRange: '', fromRange: '', toRange: '',
    method: '', defaultValue: '', calculations: '', status: 'Active'
  });

  const fetchDetails = async () => {
    try {
      setLoading(true);
      // Fetch test master details
      const resTest = await fetch(`/api/tests/${testId}`);
      if (resTest.ok) {
        const dataTest = await resTest.json();
        setTest(dataTest);
      } else {
        showToast('Failed to fetch test details', 'error');
      }

      // Fetch components filtered by templateId
      const url = templateId 
        ? `/api/tests/${testId}/components?templateId=${templateId}`
        : `/api/tests/${testId}/components`;
      const resComp = await fetch(url);
      if (resComp.ok) {
        const dataComp = await resComp.json();
        setComponents(dataComp || []);
      }

      // Fetch active template info if templateId exists
      if (templateId) {
        const resTemplates = await fetch(`/api/tests/${testId}/templates`);
        if (resTemplates.ok) {
          const templates = await resTemplates.json();
          const found = templates.find((t: any) => t.id === parseInt(templateId));
          if (found) setCurrentTemplate(found);
        }
      } else {
        setCurrentTemplate(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) fetchDetails();
  }, [testId, templateId]);

  useEffect(() => {
    const searchTests = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/components/search?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeout = setTimeout(searchTests, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, testId]);

  const handleCopyTemplate = async (componentId: number) => {
    try {
      setIsCopying(true);
      const res = await fetch(`/api/tests/${testId}/link-component`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentId,
          templateId: templateId ? parseInt(templateId) : null
        })
      });
      if (res.ok) {
        showToast('Component linked successfully', 'success');
        setShowAddTemplateModal(false);
        fetchDetails();
      } else {
        showToast('Failed to link component', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error linking component', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const handleSaveComponent = async () => {
    if (!compForm.componentName) {
      showToast('Component Name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const url = editingComponent 
        ? `/api/tests/${testId}/components/${editingComponent.id}`
        : `/api/tests/${testId}/components`;
      const method = editingComponent ? 'PUT' : 'POST';

      const payload = {
        ...compForm,
        templateId: templateId ? parseInt(templateId) : null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Component ${editingComponent ? 'updated' : 'added'} successfully`, 'success');
        setShowAddComponentModal(false);
        setEditingComponent(null);
        setCompForm({
          componentName: '', subHeading: '', machineCode: '', specimenCode: '',
          unit: '', normalRange: '', fromRange: '', toRange: '',
          method: '', defaultValue: '', calculations: '', status: 'Active'
        });
        fetchDetails();
      } else {
        showToast('Failed to save component', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving component', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComponent = (comp: any) => {
    setEditingComponent(comp);
    setCompForm({
      componentName: comp.componentName || '',
      subHeading: comp.subHeading || '',
      machineCode: comp.machineCode || '',
      specimenCode: comp.specimenCode || '',
      unit: comp.unit || '',
      normalRange: comp.normalRange || '',
      fromRange: comp.fromRange || '',
      toRange: comp.toRange || '',
      method: comp.method || '',
      defaultValue: comp.defaultValue || '',
      calculations: comp.calculations || '',
      status: comp.status || 'Active'
    });
    setShowAddComponentModal(true);
  };

  const handleDeleteComponent = async (compId: number) => {
    if (!confirm('Are you sure you want to delete this component?')) return;
    try {
      const res = await fetch(`/api/tests/${testId}/components/${compId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Component deleted successfully', 'success');
        fetchDetails();
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || 'Failed to delete component', 'error');
        fetchDetails();
      }
    } catch (err) {
      showToast('Error deleting component', 'error');
    }
  };

  const handleOpenFontModal = async () => {
    try {
      const res = await fetch(`/api/tests/${testId}/font`);
      if (res.ok) {
        const data = await res.json();
        setFontForm({
          fontFamily: data.fontFamily || '',
          patientDetailsFont: data.patientDetailsFont || '',
          departmentNameFont: data.departmentNameFont || '',
          orderNameFont: data.orderNameFont || '',
          resultHeadingFont: data.resultHeadingFont || '',
          subHeadingFont: data.subHeadingFont || '',
          componentNameFont: data.componentNameFont || '',
          methodFont: data.methodFont || '',
          resultNotesFont: data.resultNotesFont || '',
          leftSignatureFont: data.leftSignatureFont || '',
          rightSignatureFont: data.rightSignatureFont || '',
          spaceBeforeLineFont: data.spaceBeforeLineFont || '',
          spaceAfterLineFont: data.spaceAfterLineFont || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
    setShowOrderFontModal(true);
  };

  const handleSaveFont = async () => {
    try {
      setIsSavingFont(true);
      const res = await fetch(`/api/tests/${testId}/font`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fontForm)
      });
      if (res.ok) {
        showToast('Order font settings saved', 'success');
        setShowOrderFontModal(false);
      } else {
        showToast('Failed to save font settings', 'error');
      }
    } catch (err) {
      showToast('Error saving font settings', 'error');
    } finally {
      setIsSavingFont(false);
    }
  };

  const handlePrintPreview = () => {
    window.print();
  };

  return (
    <div className="order-components-container" style={{ padding: '24px' }}>
      {/* Header / Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Order Details for <span style={{ color: 'var(--primary)' }}>{test?.testName || '...'}</span>
            {currentTemplate && (
              <span style={{ fontSize: '18px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                ({currentTemplate.templateName})
              </span>
            )}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage diagnostic parameters and reference ranges {currentTemplate ? `for template ${currentTemplate.templateName}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => router.push('/order-maintenance')}>
            <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back to Orders
          </button>
          <button 
            className="btn btn-primary" 
            style={{ backgroundColor: '#e25838', border: 'none' }}
            onClick={() => {
              setEditingComponent(null);
              setCompForm({
                componentName: '', subHeading: '', machineCode: '', specimenCode: '',
                unit: '', normalRange: '', fromRange: '', toRange: '',
                method: '', defaultValue: '', calculations: '', status: 'Active'
              });
              setShowAddComponentModal(true);
            }}
          >
            <Plus size={18} style={{ marginRight: '8px' }} /> Add Order Details
          </button>
        </div>
      </div>

      {/* Sub Top Nav mimicking the old version */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          onClick={handleOpenFontModal}
        >
          <Type size={16} style={{ marginRight: '6px' }} /> Order Font
        </button>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          onClick={() => router.push(`/order-maintenance/${testId}/templates`)}
        >
          <Layout size={16} style={{ marginRight: '6px' }} /> Templates
        </button>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          onClick={() => setShowAddTemplateModal(true)}
        >
          <Plus size={16} style={{ marginRight: '6px' }} /> Add Components Of Existing Order
        </button>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          onClick={handlePrintPreview}
        >
          <Printer size={16} style={{ marginRight: '6px' }} /> Print Preview
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="medfile-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fff', borderBottom: '2px solid var(--border)' }}>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Sub Heading</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Component</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Range</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Units</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px 24px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto' }} />
                  <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading components...</p>
                </td>
              </tr>
            ) : components.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No components defined for this test.
                </td>
              </tr>
            ) : (
              components.map((comp, idx) => (
                <tr key={comp.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                  <td style={{ padding: '12px 24px' }}>{comp.subHeading || '---'}</td>
                  <td style={{ padding: '12px 24px', fontWeight: '600' }}>{comp.componentName}</td>
                  <td style={{ padding: '12px 24px', fontSize: '13px', maxWidth: '300px' }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{comp.normalRange || '---'}</div>
                  </td>
                  <td style={{ padding: '12px 24px' }}>{comp.unit || '---'}</td>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      background: comp.status && comp.status.toLowerCase().includes('inactive') ? 'var(--danger-light)' : 'var(--success-light)',
                      color: comp.status && comp.status.toLowerCase().includes('inactive') ? 'var(--danger)' : 'var(--success)',
                      textTransform: 'uppercase'
                    }}>
                      {comp.status && comp.status.toLowerCase().includes('inactive') ? 'INACTIVE' : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" style={{ color: '#e25838', backgroundColor: '#fff', border: '1px solid #e25838' }}>Values</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }} onClick={() => handleEditComponent(comp)}><Edit size={16} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteComponent(comp.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Add Template Modal */}
      {showAddTemplateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '12px', width: '650px', maxWidth: '90%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Link Existing Diagnostic Component</h2>
              <button className="btn btn-ghost" onClick={() => setShowAddTemplateModal(false)}>✕</button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Search for an individual component to add into <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{test?.testName}</span>
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search Component Name (e.g. Haemoglobin)..."
                  className="form-input"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {isSearching && (
                  <div style={{ position: 'absolute', right: '12px', top: '12px' }}>
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchTerm.length < 2 ? 'Type at least 2 characters to search existing components...' : 'No components found matching your search.'}
                </div>
              ) : (
                searchResults.map((result: any) => (
                  <div 
                    key={result.id} 
                    style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => handleCopyTemplate(result.id)}
                    className="hover-bg"
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{result.componentName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Source Test: <span style={{ fontWeight: '500' }}>{result.testName}</span> ({result.department})
                      </div>
                      {(result.normalRange || result.unit) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Range: {result.normalRange || '-'} {result.unit || ''}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ backgroundColor: '#e25838', border: 'none', padding: '6px 12px' }} disabled={isCopying}>
                      {isCopying ? 'Linking...' : 'Link Component'}
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowAddTemplateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Component Modal */}
      {showAddComponentModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '12px', width: '800px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            {/* Header / Actions */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" style={{ backgroundColor: '#e25838', border: 'none' }} onClick={handleSaveComponent}>Save Details</button>
                <button className="btn btn-outline" onClick={() => setCompForm({
                  componentName: '', subHeading: '', machineCode: '', specimenCode: '',
                  unit: '', normalRange: '', fromRange: '', toRange: '',
                  method: '', defaultValue: '', calculations: '', status: 'Active'
                })}>Clear</button>
                <button className="btn btn-outline" onClick={() => setShowAddComponentModal(false)}>Cancel</button>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowAddComponentModal(false)}>✕</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-secondary)' }}>
                {editingComponent ? 'Update' : 'Add'} Order Details for <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>{test?.testName}</span>
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Sub Heading:</label>
                  <input type="text" className="form-input" value={compForm.subHeading} onChange={e => setCompForm({...compForm, subHeading: e.target.value})} placeholder="Sub Heading" />
                </div>
                <div className="form-group">
                  <label className="form-label">Component Name: <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="text" className="form-input" value={compForm.componentName} onChange={e => setCompForm({...compForm, componentName: e.target.value})} placeholder="Component Name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Machine Code:</label>
                  <input type="text" className="form-input" value={compForm.machineCode} onChange={e => setCompForm({...compForm, machineCode: e.target.value})} placeholder="Machine Code" />
                </div>
                <div className="form-group">
                  <label className="form-label">Specimen Code:</label>
                  <input type="text" className="form-input" value={compForm.specimenCode} onChange={e => setCompForm({...compForm, specimenCode: e.target.value})} placeholder="Specimen Code" />
                </div>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Range:</label>
                  <textarea className="form-input" style={{ height: '80px' }} value={compForm.normalRange} onChange={e => setCompForm({...compForm, normalRange: e.target.value})} placeholder="Textual Reference Range"></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">From Range (Numeric):</label>
                  <input type="text" className="form-input" value={compForm.fromRange} onChange={e => setCompForm({...compForm, fromRange: e.target.value})} placeholder="e.g. 13.0" />
                </div>
                <div className="form-group">
                  <label className="form-label">To Range (Numeric):</label>
                  <input type="text" className="form-input" value={compForm.toRange} onChange={e => setCompForm({...compForm, toRange: e.target.value})} placeholder="e.g. 45.0" />
                </div>

                <div className="form-group">
                  <label className="form-label">Units:</label>
                  <input type="text" className="form-input" value={compForm.unit} onChange={e => setCompForm({...compForm, unit: e.target.value})} placeholder="Units" />
                </div>
                <div className="form-group">
                  <label className="form-label">Method:</label>
                  <input type="text" className="form-input" value={compForm.method} onChange={e => setCompForm({...compForm, method: e.target.value})} placeholder="Method" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Default Value:</label>
                  <input type="text" className="form-input" value={compForm.defaultValue} onChange={e => setCompForm({...compForm, defaultValue: e.target.value})} placeholder="Default Value" />
                </div>
                <div className="form-group">
                  <label className="form-label">Calculations:</label>
                  <input type="text" className="form-input" value={compForm.calculations} onChange={e => setCompForm({...compForm, calculations: e.target.value})} placeholder="e.g. Rbc = ((Haemoglobin*4)/3)" />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Example: Rbc = ((Haemoglobin*4)/3)</p>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                  <input 
                    type="checkbox" 
                    id="compStatus" 
                    checked={compForm.status === 'InActive'} 
                    onChange={e => setCompForm({...compForm, status: e.target.checked ? 'InActive' : 'Active'})} 
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="compStatus" className="form-label" style={{ marginBottom: 0 }}>Check to Inactive</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Font Modal */}
      {showOrderFontModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', width: '850px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)', border: '1px solid var(--border)' }}>
            {/* Top Action Bar */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
              <button 
                onClick={handleSaveFont} 
                disabled={isSavingFont}
                style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px 8px' }}
              >
                {isSavingFont ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setShowOrderFontModal(false)}
                style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Inner Content Area */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: 'var(--bg-card)' }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '24px', background: 'var(--bg-card)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  Add Default Font
                </h2>

                <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px', marginLeft: '40px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 200px', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>FontFamily</label>
                    <select 
                      value={fontForm.fontFamily} 
                      onChange={e => setFontForm({...fontForm, fontFamily: e.target.value})}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%' }}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>

                  {[
                    { label: 'PatientDetailsFont', key: 'patientDetailsFont' },
                    { label: 'DepartmentNameFont', key: 'departmentNameFont' },
                    { label: 'OrderNameFont', key: 'orderNameFont' },
                    { label: 'ResultHeadingFont', key: 'resultHeadingFont' },
                    { label: 'SubHeadingFont', key: 'subHeadingFont' },
                    { label: 'ComponentNameFont', key: 'componentNameFont' },
                    { label: 'MethodFont', key: 'methodFont' },
                    { label: 'ResultNotesFont', key: 'resultNotesFont' },
                    { label: 'LeftSignatureFont', key: 'leftSignatureFont' },
                    { label: 'RightSignatureFont', key: 'rightSignatureFont' },
                    { label: 'SpaceBeforeLineFont', key: 'spaceBeforeLineFont' },
                    { label: 'SpaceAfterLineFont', key: 'spaceAfterLineFont' },
                  ].map((field) => (
                    <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '180px 200px', alignItems: 'center' }}>
                      <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{field.label}</label>
                      <input 
                        type="text" 
                        value={(fontForm as any)[field.key]} 
                        onChange={e => setFontForm({...fontForm, [field.key]: e.target.value})}
                        style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Section (Visible only when printing) */}
      <div className="print-preview-section" style={{ display: 'none' }}>
        <style type="text/css" media="print">
          {`
            @page { size: auto; margin: 15mm 20mm; }
            body { margin: 0; padding: 0; background: #fff; color: #000; }
            nav, header, aside, .sidebar { display: none !important; }
            .order-components-container > *:not(.print-preview-section) { display: none !important; }
            .print-preview-section { display: block !important; width: 100%; font-family: 'Helvetica', 'Arial', sans-serif; }
            .print-header { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 25px; }
            .print-meta { display: flex; justify-content: space-between; font-size: 11px; line-height: 1.6; margin-bottom: 15px; padding: 0 10px; }
            .print-meta-col { flex: 1; }
            .print-meta-row { display: flex; }
            .print-meta-label { width: 130px; font-weight: normal; }
            .print-meta-value { font-weight: bold; }
            .print-divider { border-top: 1px solid #000; margin: 15px 10px 20px 10px; }
            .print-dept { text-align: center; font-size: 12px; font-weight: bold; text-decoration: underline; margin-bottom: 10px; text-transform: uppercase; }
            .print-title { text-align: center; font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 25px; }
            .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; padding: 0 10px; }
            .print-table th { text-align: left; padding-bottom: 15px; text-decoration: underline; font-weight: bold; font-size: 11px; }
            .print-table td { vertical-align: top; padding-bottom: 12px; }
            .print-inv-col { width: 40%; }
            .print-res-col { width: 15%; }
            .print-unit-col { width: 15%; }
            .print-ref-col { width: 30%; white-space: pre-line; line-height: 1.4; }
          `}
        </style>
        
        <div className="print-header">
          <span>{currentDate}</span>
          <span style={{ fontWeight: 'bold' }}>OrderDetails</span>
          <span>1 page</span>
        </div>

        <div className="print-meta">
          <div className="print-meta-col">
            <div className="print-meta-row"><span className="print-meta-label">Name</span><span>: <span className="print-meta-value">PatientName</span></span></div>
            <div className="print-meta-row"><span className="print-meta-label">Age/Gender</span><span>: <span className="print-meta-value">AGE/GENDER</span></span></div>
            <div className="print-meta-row"><span className="print-meta-label">Sample Type</span><span>: <span className="print-meta-value">--</span></span></div>
            <div className="print-meta-row"><span className="print-meta-label">Reff By</span><span>: <span className="print-meta-value">Self</span></span></div>
          </div>
          <div className="print-meta-col" style={{ paddingLeft: '20px' }}>
            <div className="print-meta-row"><span className="print-meta-label">Bill / UMR Number</span><span>: <span className="print-meta-value">BillNumber / </span></span></div>
            <div className="print-meta-row"><span className="print-meta-label">Bill Date</span><span>: <span className="print-meta-value">Date</span></span></div>
            <div className="print-meta-row"><span className="print-meta-label">Sample Collection</span><span>: <span className="print-meta-value">Sample Collected date</span></span></div>
            <div className="print-meta-row"><span className="print-meta-label">Reporting Date</span><span>: <span className="print-meta-value">12-May-2026 03:13 PM</span></span></div>
          </div>
        </div>

        <div className="print-divider"></div>

        {test?.department && test.department !== 'NONE' && (
          <div className="print-dept">{test.department}</div>
        )}

        <div className="print-title">
          {test?.testName || 'INVESTIGATION'}
        </div>

        <div style={{ padding: '0 10px' }}>
          <table className="print-table">
            <thead>
              <tr>
                <th className="print-inv-col">INVESTIGATION</th>
                <th className="print-res-col">RESULT</th>
                <th className="print-unit-col">UNITS</th>
                <th className="print-ref-col">NORMAL RANGE</th>
              </tr>
            </thead>
            <tbody>
              {components
                .filter(c => !c.status || !c.status.toLowerCase().includes('inactive'))
                .map((comp, idx) => (
                <React.Fragment key={idx}>
                  {comp.subHeading && (
                    <tr>
                      <td colSpan={4} style={{ fontWeight: 'bold', textDecoration: 'underline', paddingTop: '10px', paddingBottom: '8px' }}>
                        {comp.subHeading}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="print-inv-col">
                      <div style={{ fontWeight: 'bold' }}>{comp.componentName}</div>
                      {comp.method && (
                        <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '2px', color: '#333' }}>
                          (Method : {comp.method})
                        </div>
                      )}
                    </td>
                    <td className="print-res-col">Value</td>
                    <td className="print-unit-col">{comp.unit || ''}</td>
                    <td className="print-ref-col">{comp.normalRange || ''}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
