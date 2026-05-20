'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Check, AlertCircle, FileText, ClipboardList, User, Phone, Calendar } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Patient {
  id: number;
  name: string;
  phone: string | null;
  umr: string;
}

interface PatientRequest {
  id: number;
  patientId: number;
  requestType: string;
  status: string;
  createdAt: string;
  patient: Patient;
}

export default function PatientRequestsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<PatientRequest[]>([]);

  // Modal & Form States
  const [isOpen, setIsOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<PatientRequest | null>(null);
  
  // Patient autocomplete states
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  const [requestType, setRequestType] = useState('Home Collection');
  const [status, setStatus] = useState('Pending');

  // UI Feedback
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle patient autocomplete search
  useEffect(() => {
    if (patientSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setSearchingPatients(true);
        const res = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Error searching patients:', err);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [patientSearch]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patient-requests?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load patient requests', 'error');
      }
    } catch (error) {
      console.error('Error fetching patient requests:', error);
      showToast('Error loading patient requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingReq(null);
    setSelectedPatient(null);
    setPatientSearch('');
    setSearchResults([]);
    setRequestType('Home Collection');
    setStatus('Pending');
    setIsOpen(true);
  };

  const handleOpenEdit = (req: PatientRequest) => {
    setEditingReq(req);
    setSelectedPatient(req.patient);
    setPatientSearch(req.patient.name);
    setSearchResults([]);
    setRequestType(req.requestType);
    setStatus(req.status);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      showToast('Please select a patient', 'error');
      return;
    }
    if (!requestType) {
      showToast('Request Type is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        patientId: selectedPatient.id,
        requestType,
        status
      };

      const url = editingReq ? `/api/patient-requests/${editingReq.id}` : '/api/patient-requests';
      const method = editingReq ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingReq ? 'Request updated successfully' : 'Request logged successfully', 'success');
        setIsOpen(false);
        fetchRequests();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save request', 'error');
      }
    } catch (error) {
      console.error('Error saving patient request:', error);
      showToast('Error saving patient request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, patientName: string) => {
    if (!confirm(`Are you sure you want to delete the request for "${patientName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/patient-requests/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Request deleted successfully', 'success');
        fetchRequests();
      } else {
        showToast('Failed to delete request', 'error');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      showToast('Error deleting request', 'error');
    }
  };

  const filteredRequests = requests.filter(req =>
    req.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.patient.umr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.requestType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (req.patient.phone && req.patient.phone.includes(searchQuery))
  );

  const getStatusStyle = (reqStatus: string) => {
    switch (reqStatus) {
      case 'Completed':
        return {
          bgColor: 'var(--success-light)',
          color: 'var(--success)',
          border: '1px solid rgba(22, 163, 74, 0.2)'
        };
      case 'Cancelled':
        return {
          bgColor: 'var(--danger-light)',
          color: 'var(--danger)',
          border: '1px solid rgba(220, 38, 38, 0.2)'
        };
      default: // Pending
        return {
          bgColor: 'var(--warning-light)',
          color: 'var(--warning)',
          border: '1px solid rgba(217, 119, 6, 0.2)'
        };
    }
  };

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
          Patient Requests
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Track and manage home collection bookings, report queries, and incoming patient service requests.
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
              placeholder="Search requests by patient, UMR..."
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
            <Plus size={16} /> Log Request
          </button>
        </div>

        {/* Card Body */}
        <div className="card-body" style={{ padding: '0px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '32px', height: '32px', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
              <p>Loading patient requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <ClipboardList size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '16px', fontWeight: '500' }}>No patient requests found</p>
              {searchQuery && <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search query.</p>}
            </div>
          ) : (
            <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>UMR</th>
                    <th>Patient Name</th>
                    <th>Phone</th>
                    <th>Request Type</th>
                    <th>Logged Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => {
                    const stStyle = getStatusStyle(req.status);
                    return (
                      <tr key={req.id}>
                        <td style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '14px' }}>{req.patient.umr}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{req.patient.name}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                          {req.patient.phone ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={13} style={{ color: 'var(--text-muted)' }} /> {req.patient.phone}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '14px' }}>{req.requestType}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            {new Date(req.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td>
                          <span className={`badge`} style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: stStyle.bgColor,
                            color: stStyle.color,
                            border: stStyle.border
                          }}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleOpenEdit(req)}
                              title="Edit Request"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleDelete(req.id, req.patient.name)}
                              title="Delete Request"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PATIENT REQUEST MODAL */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingReq ? 'Edit Patient Request' : 'Log Patient Request'}</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                
                {/* Patient Search */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label" style={{ fontWeight: '600' }}>Search & Select Patient *</label>
                  {selectedPatient ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-main)' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{selectedPatient.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          UMR: {selectedPatient.umr} | Phone: {selectedPatient.phone || 'N/A'}
                        </div>
                      </div>
                      {!editingReq && (
                        <button
                          type="button"
                          onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                          style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-input required"
                        placeholder="Type name, UMR, or phone (min 2 chars)..."
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        required
                      />
                      {searchingPatients && (
                        <div style={{ position: 'absolute', right: '12px', bottom: '12px' }}>
                          <div className="spinner" style={{ border: '2px solid var(--border)', borderTop: '2px solid var(--primary)', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        </div>
                      )}
                      
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                          {searchResults.map(p => (
                            <div
                              key={p.id}
                              onClick={() => { setSelectedPatient(p); setSearchResults([]); }}
                              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                            >
                              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                UMR: {p.umr} {p.phone ? `| Phone: ${p.phone}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {patientSearch.trim().length >= 2 && searchResults.length === 0 && !searchingPatients && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, padding: '12px 14px', marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          No matching patients found.
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Request Type */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Request Type *</label>
                  <select
                    className="form-input form-select"
                    value={requestType}
                    onChange={e => setRequestType(e.target.value)}
                  >
                    <option value="Home Collection">Home Collection</option>
                    <option value="Report Status">Report Status Query</option>
                    <option value="Other">Other Query / Service</option>
                  </select>
                </div>

                {/* Status */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Status</label>
                  <select
                    className="form-input form-select"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
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
                  <Save size={16} /> {submitting ? 'Saving...' : 'Save Request'}
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
