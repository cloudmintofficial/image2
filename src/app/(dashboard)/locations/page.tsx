'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Check, AlertCircle, MapPin, Phone } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Location {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
}

export default function LocationsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);

  // Modal & Form States
  const [isOpen, setIsOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');

  // UI Feedback
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/locations?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load locations', 'error');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      showToast('Error loading locations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingLoc(null);
    setName('');
    setAddress('');
    setPhone('');
    setStatus('Active');
    setIsOpen(true);
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLoc(loc);
    setName(loc.name);
    setAddress(loc.address || '');
    setPhone(loc.phone || '');
    setStatus(loc.status);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Location name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        status
      };

      const url = editingLoc ? `/api/locations/${editingLoc.id}` : '/api/locations';
      const method = editingLoc ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingLoc ? 'Location updated successfully' : 'Location created successfully', 'success');
        setIsOpen(false);
        fetchLocations();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save location', 'error');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      showToast('Error saving location', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the location "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Location deleted successfully', 'success');
        fetchLocations();
      } else {
        showToast('Failed to delete location', 'error');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      showToast('Error deleting location', 'error');
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (session?.user && (session.user as any).role !== 'Owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', fontSize: 24, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to view the Locations module.</p>
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
          Locations Maintenance
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configure lab locations and branch centers for multi-location reporting.
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
              placeholder="Search locations..."
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
            <Plus size={16} /> Add Location
          </button>
        </div>

        {/* Card Body */}
        <div className="card-body" style={{ padding: '0px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '32px', height: '32px', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
              <p>Loading locations...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MapPin size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '16px', fontWeight: '500' }}>No locations found</p>
              {searchQuery && <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search filter.</p>}
            </div>
          ) : (
            <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Location Name</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map(loc => (
                    <tr key={loc.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{loc.name}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{loc.address || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {loc.phone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} style={{ color: 'var(--text-muted)' }} /> {loc.phone}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${loc.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: loc.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                          color: loc.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${loc.status === 'Active' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                        }}>
                          {loc.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleOpenEdit(loc)}
                            title="Edit Location"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleDelete(loc.id, loc.name)}
                            title="Delete Location"
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

      {/* LOCATION DIALOG MODAL */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLoc ? 'Edit Location' : 'Add New Location'}</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                
                {/* Name */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Location Name *</label>
                  <input
                    type="text"
                    className="form-input required"
                    placeholder="e.g. Hyderabad Branch, Main Lab, etc."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                {/* Address */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Address</label>
                  <textarea
                    className="form-input"
                    placeholder="e.g. Ground Floor, Jubilee Hills, Hyderabad"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
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
                  <Save size={16} /> {submitting ? 'Saving...' : 'Save Location'}
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
