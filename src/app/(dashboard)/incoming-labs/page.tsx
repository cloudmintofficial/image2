'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Check, AlertCircle, FileText, User, Phone, MapPin } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface IncomingLab {
  id: number;
  labName: string;
  labAddress: string | null;
  contactPerson: string | null;
  primaryPhone: string | null;
  status: string;
  createdAt: string;
}

export default function IncomingLabsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [labs, setLabs] = useState<IncomingLab[]>([]);

  // Modal & Form States
  const [isOpen, setIsOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<IncomingLab | null>(null);
  const [labName, setLabName] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [status, setStatus] = useState('Active');

  // UI Feedback
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/incoming-labs?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLabs(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load incoming labs', 'error');
      }
    } catch (error) {
      console.error('Error fetching incoming labs:', error);
      showToast('Error loading incoming labs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingLab(null);
    setLabName('');
    setLabAddress('');
    setContactPerson('');
    setPrimaryPhone('');
    setStatus('Active');
    setIsOpen(true);
  };

  const handleOpenEdit = (lab: IncomingLab) => {
    setEditingLab(lab);
    setLabName(lab.labName);
    setLabAddress(lab.labAddress || '');
    setContactPerson(lab.contactPerson || '');
    setPrimaryPhone(lab.primaryPhone || '');
    setStatus(lab.status);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName.trim()) {
      showToast('Referral lab name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        labName: labName.trim(),
        labAddress: labAddress.trim() || null,
        contactPerson: contactPerson.trim() || null,
        primaryPhone: primaryPhone.trim() || null,
        status
      };

      const url = editingLab ? `/api/incoming-labs/${editingLab.id}` : '/api/incoming-labs';
      const method = editingLab ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingLab ? 'Referral lab updated successfully' : 'Referral lab registered successfully', 'success');
        setIsOpen(false);
        fetchLabs();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save referral lab', 'error');
      }
    } catch (error) {
      console.error('Error saving incoming lab:', error);
      showToast('Error saving referral lab', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete referral lab "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/incoming-labs/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Referral lab deleted successfully', 'success');
        fetchLabs();
      } else {
        showToast('Failed to delete referral lab', 'error');
      }
    } catch (error) {
      console.error('Error deleting incoming lab:', error);
      showToast('Error deleting referral lab', 'error');
    }
  };

  const filteredLabs = labs.filter(lab =>
    lab.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (lab.contactPerson && lab.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (lab.primaryPhone && lab.primaryPhone.includes(searchQuery))
  );

  if (session?.user && (session.user as any).role !== 'Owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', fontSize: 24, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to view the Incoming Labs module.</p>
      </div>
    );
  }

  return (
    <div className="content-wrapper" style={{ padding: '24px' }}>
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type === 'success' ? 'toast-success' : 'btn-danger'}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>
          Incoming Labs Registry
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Manage external referral centers, outsourced test laboratories, and incoming patient partners.
        </p>
      </div>

      {/* Main card */}
      <div className="card">
        {/* Card Header */}
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search referral labs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', borderRadius: '10px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleOpenAdd}
            style={{ borderRadius: '10px', fontWeight: '600' }}
          >
            <Plus size={16} /> Register External Lab
          </button>
        </div>

        {/* Card Body */}
        <div className="card-body" style={{ padding: '0px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '32px', height: '32px', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
              <p>Loading registry...</p>
            </div>
          ) : filteredLabs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '16px', fontWeight: '500' }}>No external labs registered</p>
              {searchQuery && <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search query.</p>}
            </div>
          ) : (
            <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lab / Center Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLabs.map(lab => (
                    <tr key={lab.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{lab.labName}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {lab.contactPerson ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <User size={13} style={{ color: 'var(--text-muted)' }} /> {lab.contactPerson}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {lab.primaryPhone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} style={{ color: 'var(--text-muted)' }} /> {lab.primaryPhone}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {lab.labAddress ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} style={{ color: 'var(--text-muted)' }} /> {lab.labAddress}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${lab.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: lab.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                          color: lab.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${lab.status === 'Active' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                        }}>
                          {lab.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleOpenEdit(lab)}
                            title="Edit Referral Lab"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleDelete(lab.id, lab.labName)}
                            title="Delete Referral Lab"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* EXTERNAL LAB DIALOG MODAL */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLab ? 'Edit Referral Lab Details' : 'Register External Referral Lab'}</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                
                {/* Lab Name */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Referral Lab / Center Name *</label>
                  <input
                    type="text"
                    className="form-input required"
                    placeholder="e.g. Apex Diagnostics Lab"
                    value={labName}
                    onChange={e => setLabName(e.target.value)}
                    required
                  />
                </div>

                {/* Contact Person */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Contact Person / Doctor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. A. K. Roy"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Primary Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +91 9998887776"
                    value={primaryPhone}
                    onChange={e => setPrimaryPhone(e.target.value)}
                  />
                </div>

                {/* Address */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Lab Address</label>
                  <textarea
                    className="form-input"
                    placeholder="e.g. Sector-V, Salt Lake, Kolkata"
                    value={labAddress}
                    onChange={e => setLabAddress(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Status</label>
                  <select
                    className="form-input form-select"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="InActive">InActive</option>
                  </select>
                </div>

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsOpen(false)}
                  disabled={submitting}
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ borderRadius: '10px', fontWeight: '600' }}
                >
                  <Save size={16} /> {submitting ? 'Saving...' : 'Save Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Spin Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          box-shadow: 0 0 8px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
