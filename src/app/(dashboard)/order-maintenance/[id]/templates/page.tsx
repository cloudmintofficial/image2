'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function OrderDetailTemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id;
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<any[]>([]);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    templateName: '',
    status: 'Active',
    fromAge: '',
    toAge: '',
    fromAgeDays: '',
    toAgeDays: '',
    gender: 'Both'
  });

  useEffect(() => {
    fetchTemplates();
  }, [testId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Fetch test details for context
      const resTest = await fetch(`/api/tests/${testId}`);
      if (resTest.ok) {
        setTest(await resTest.json());
      }

      const res = await fetch(`/api/tests/${testId}/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.templateName) {
      showToast('Template Name is required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`/api/tests/${testId}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast('Template added successfully', 'success');
        setShowAddModal(false);
        setForm({
          templateName: '', status: 'Active', fromAge: '', toAge: '', fromAgeDays: '', toAgeDays: '', gender: 'Both'
        });
        fetchTemplates();
      } else {
        showToast('Failed to add template', 'error');
      }
    } catch (err) {
      showToast('Error saving template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="order-templates-container" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Order Detail Templates for <span style={{ color: 'var(--primary)' }}>{test?.testName || '...'}</span>
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configure granular sub-templates based on age bounds and gender distributions
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <button 
          className="btn btn-outline btn-sm" 
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} style={{ marginRight: '6px' }} /> Add Order Detail Templates
        </button>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => router.push(`/order-maintenance/${testId}/components`)}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back To Order Details
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="medfile-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fff', borderBottom: '2px solid var(--border)' }}>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Template Name</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Status</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>From Age</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>To Age</th>
              <th style={{ padding: '12px 24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center' }}>Loading templates...</td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No templates found.
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 24px' }}>{template.templateName}</td>
                  <td style={{ padding: '12px 24px' }}>{template.status}</td>
                  <td style={{ padding: '12px 24px' }}>{template.fromAge || '-'}</td>
                  <td style={{ padding: '12px 24px' }}>{template.toAge || '-'}</td>
                  <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ backgroundColor: '#e25838', border: 'none' }}
                      onClick={() => router.push(`/order-maintenance/${testId}/components?templateId=${template.id}`)}
                    >
                      Template Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '8px', width: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Add Template</h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="form-label">Template Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={form.templateName} 
                  onChange={e => setForm({...form, templateName: e.target.value})} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">From Age (Years)</label>
                  <input type="number" className="form-input" value={form.fromAge} onChange={e => setForm({...form, fromAge: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">To Age (Years)</label>
                  <input type="number" className="form-input" value={form.toAge} onChange={e => setForm({...form, toAge: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">From Age (Days)</label>
                  <input type="number" className="form-input" value={form.fromAgeDays} onChange={e => setForm({...form, fromAgeDays: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">To Age (Days)</label>
                  <input type="number" className="form-input" value={form.toAgeDays} onChange={e => setForm({...form, toAgeDays: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="Both">Both</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="InActive">InActive</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
