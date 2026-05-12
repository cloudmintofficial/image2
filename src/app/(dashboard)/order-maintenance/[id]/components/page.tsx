'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Plus, Edit, Trash2, Printer, Layout, Type } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function OrderComponentsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id;
  const { showToast } = useToast();

  const [test, setTest] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [compForm, setCompForm] = useState({
    componentName: '', subHeading: '', machineCode: '', specimenCode: '',
    unit: '', normalRange: '', fromRange: '', toRange: '',
    method: '', defaultValue: '', calculations: '', status: 'Active'
  });

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tests/${testId}`);
      if (res.ok) {
        const data = await res.json();
        setTest(data);
        setComponents(data.components || []);
      } else {
        showToast('Failed to fetch test details', 'error');
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
  }, [testId]);

  useEffect(() => {
    const searchTests = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/tests?search=${encodeURIComponent(searchTerm)}&all=true`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.filter((t: any) => t.id !== parseInt(testId as string)));
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

  const handleCopyTemplate = async (sourceId: number) => {
    try {
      setIsCopying(true);
      const res = await fetch(`/api/tests/${testId}/copy-template?sourceId=${sourceId}`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast('Components copied successfully', 'success');
        setShowAddTemplateModal(false);
        fetchDetails();
      } else {
        showToast('Failed to copy components', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error copying components', 'error');
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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compForm)
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
        showToast('Component deleted', 'success');
        fetchDetails();
      }
    } catch (err) {
      showToast('Error deleting component', 'error');
    }
  };


  return (
    <div className="order-components-container" style={{ padding: '24px' }}>
      {/* Header / Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Order Details for <span style={{ color: 'var(--primary)' }}>{test?.testName || '...'}</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage diagnostic parameters and reference ranges
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
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <Type size={16} style={{ marginRight: '6px' }} /> Order Font
        </button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <Layout size={16} style={{ marginRight: '6px' }} /> Templates
        </button>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          onClick={() => setShowAddTemplateModal(true)}
        >
          <Plus size={16} style={{ marginRight: '6px' }} /> Add Components Of Existing Order
        </button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
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
                      background: comp.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                      color: comp.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                      textTransform: 'uppercase'
                    }}>
                      {comp.status || 'Active'}
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
          <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '12px', width: '600px', maxWidth: '90%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Add templates from existing orders</h2>
              <button className="btn btn-ghost" onClick={() => setShowAddTemplateModal(false)}>✕</button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Search for an order to copy its components to <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{test?.testName}</span>
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search Order Name..."
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

            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchTerm.length < 2 ? 'Type at least 2 characters to search...' : 'No orders found matching your search.'}
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
                      <div style={{ fontWeight: '600' }}>{result.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{result.category} | {result.department}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ backgroundColor: '#e25838', border: 'none' }} disabled={isCopying}>
                      {isCopying ? 'Copying...' : 'Copy Template'}
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
    </div>
  );
}
