'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, Save, X,
  Upload, Image, FileText, Check, AlertCircle, FileCheck, Award
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Department {
  id: number;
  name: string;
  status: string;
  leftSignatureImageUrl: string | null;
  leftSignatureLabel: string | null;
  signatureImageUrl: string | null;
  signatureLabel: string | null;
  printIndividualPages: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DoctorSignature {
  id: string;
  name: string;
  title: string;
  label: string;
  signText: string | null;
  imageData: string | null;
  status: string;
  createdAt: string;
}

export default function DepartmentsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'departments' | 'signatures'>('departments');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [signatures, setSignatures] = useState<DoctorSignature[]>([]);

  // Department Modal & Form States
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptStatus, setDeptStatus] = useState('Active');
  const [printIndivPages, setPrintIndivPages] = useState(false);
  const [leftSigLabel, setLeftSigLabel] = useState('');
  const [leftSigFile, setLeftSigFile] = useState<File | null>(null);
  const [leftSigUrl, setLeftSigUrl] = useState<string | null>(null);
  const [rightSigLabel, setRightSigLabel] = useState('');
  const [rightSigFile, setRightSigFile] = useState<File | null>(null);
  const [rightSigUrl, setRightSigUrl] = useState<string | null>(null);

  // Signature Modal & Form States
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [editingSig, setEditingSig] = useState<DoctorSignature | null>(null);
  const [sigId, setSigId] = useState('');
  const [sigName, setSigName] = useState('');
  const [sigTitle, setSigTitle] = useState('');
  const [sigLabel, setSigLabel] = useState('');
  const [sigText, setSigText] = useState('');
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [sigStatus, setSigStatus] = useState('Active');

  // UI Feedback
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'departments') {
        const res = await fetch('/api/departments?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setDepartments(Array.isArray(data) ? data : []);
        } else {
          showToast('Failed to load departments', 'error');
        }
      } else {
        const res = await fetch('/api/signatures?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSignatures(Array.isArray(data) ? data : []);
        } else {
          showToast('Failed to load doctor signatures', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Department Modal Handlers
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptStatus('Active');
    setPrintIndivPages(false);
    setLeftSigLabel('');
    setLeftSigFile(null);
    setLeftSigUrl(null);
    setRightSigLabel('');
    setRightSigFile(null);
    setRightSigUrl(null);
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptStatus(dept.status);
    setPrintIndivPages(dept.printIndividualPages);
    setLeftSigLabel(dept.leftSignatureLabel || '');
    setLeftSigFile(null);
    setLeftSigUrl(dept.leftSignatureImageUrl);
    setRightSigLabel(dept.signatureLabel || '');
    setRightSigFile(null);
    setRightSigUrl(dept.signatureImageUrl);
    setIsDeptModalOpen(true);
  };

  // Signature Modal Handlers
  const handleOpenAddSig = () => {
    setEditingSig(null);
    setSigId('');
    setSigName('');
    setSigTitle('');
    setSigLabel('');
    setSigText('');
    setSigFile(null);
    setSigUrl(null);
    setSigStatus('Active');
    setIsSigModalOpen(true);
  };

  const handleOpenEditSig = (sig: DoctorSignature) => {
    setEditingSig(sig);
    setSigId(sig.id);
    setSigName(sig.name);
    setSigTitle(sig.title);
    setSigLabel(sig.label);
    setSigText(sig.signText || '');
    setSigFile(null);
    setSigUrl(sig.imageData);
    setSigStatus(sig.status);
    setIsSigModalOpen(true);
  };

  const handleUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
      return null;
    } catch (err) {
      console.error('File upload error:', err);
      return null;
    }
  };

  // Form Submit for Department
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      showToast('Department name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);

      let finalLeftSigUrl = leftSigUrl;
      let finalRightSigUrl = rightSigUrl;

      if (leftSigFile) {
        const url = await handleUpload(leftSigFile);
        if (url) finalLeftSigUrl = url;
      }

      if (rightSigFile) {
        const url = await handleUpload(rightSigFile);
        if (url) finalRightSigUrl = url;
      }

      const payload = {
        name: deptName,
        status: deptStatus,
        printIndividualPages: printIndivPages,
        leftSignatureLabel: leftSigLabel || null,
        leftSignatureImageUrl: finalLeftSigUrl || null,
        signatureLabel: rightSigLabel || null,
        signatureImageUrl: finalRightSigUrl || null
      };

      const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
      const method = editingDept ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingDept ? 'Department updated successfully' : 'Department created successfully', 'success');
        setIsDeptModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save department', 'error');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      showToast('Error saving department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Form Submit for Signature
  const handleSigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigId.trim() || !sigName.trim() || !sigTitle.trim() || !sigLabel.trim()) {
      showToast('ID, Name, Title, and Label are required', 'error');
      return;
    }

    try {
      setSubmitting(true);

      let finalSigUrl = sigUrl;

      if (sigFile) {
        const url = await handleUpload(sigFile);
        if (url) finalSigUrl = url;
      }

      const payload = {
        id: sigId,
        name: sigName,
        title: sigTitle,
        label: sigLabel,
        signText: sigText || null,
        imageData: finalSigUrl || null,
        status: sigStatus
      };

      const url = editingSig ? `/api/signatures/${editingSig.id}` : '/api/signatures';
      const method = editingSig ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingSig ? 'Signature updated successfully' : 'Signature created successfully', 'success');
        setIsSigModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save signature', 'error');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      showToast('Error saving signature', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteDept = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the department "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Department deleted successfully', 'success');
        fetchData();
      } else {
        showToast('Failed to delete department', 'error');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      showToast('Error deleting department', 'error');
    }
  };

  const handleDeleteSig = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the signature for "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/signatures/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Signature deleted successfully', 'success');
        fetchData();
      } else {
        showToast('Failed to delete signature', 'error');
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      showToast('Error deleting signature', 'error');
    }
  };

  // Search filter lists
  const filteredDepts = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSigs = signatures.filter(sig =>
    sig.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sig.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sig.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (session?.user && (session.user as any).role !== 'Owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', fontSize: 24, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to view the Department Maintenance module.</p>
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
          Department Maintenance
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configure lab departments, print layouts, and validation signatures.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => { setActiveTab('departments'); setSearchQuery(''); }}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'departments' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'departments' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'departments' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '15px',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          Departments List
        </button>
        <button
          onClick={() => { setActiveTab('signatures'); setSearchQuery(''); }}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'signatures' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'signatures' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'signatures' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '15px',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          Doctor Signatures (NoDepartment)
        </button>
      </div>

      {/* Main content card */}
      <div className="card">
        {/* Card Header with search & actions */}
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              className="form-input"
              placeholder={activeTab === 'departments' ? "Search departments..." : "Search doctor signatures..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', borderRadius: '10px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button
            className="btn btn-primary"
            onClick={activeTab === 'departments' ? handleOpenAddDept : handleOpenAddSig}
            style={{ borderRadius: '10px', fontWeight: '600' }}
          >
            <Plus size={16} /> {activeTab === 'departments' ? 'Add Department' : 'Add Doctor Signature'}
          </button>
        </div>

        {/* Card Body */}
        <div className="card-body" style={{ padding: '0px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '32px', height: '32px', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
              <p>Loading details...</p>
            </div>
          ) : activeTab === 'departments' ? (
            /* DEPARTMENTS TAB CONTENT */
            filteredDepts.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FileText size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '16px', fontWeight: '500' }}>No departments found</p>
                {searchQuery && <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search query.</p>}
              </div>
            ) : (
              <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Status</th>
                      <th>Print Setting</th>
                      <th>Left Signature</th>
                      <th>Right Signature</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepts.map(dept => (
                      <tr key={dept.id}>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{dept.name}</td>
                        <td>
                          <span className={`badge ${dept.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: dept.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: dept.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${dept.status === 'Active' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                          }}>
                            {dept.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                          {dept.printIndividualPages ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
                              <FileCheck size={14} /> Individual A4 Pages
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Continuous Flow</span>
                          )}
                        </td>
                        <td>
                          {dept.leftSignatureLabel ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {dept.leftSignatureImageUrl && <Image size={14} style={{ color: 'var(--primary)' }} />}
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>{dept.leftSignatureLabel}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                          )}
                        </td>
                        <td>
                          {dept.signatureLabel ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {dept.signatureImageUrl && <Image size={14} style={{ color: 'var(--primary)' }} />}
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>{dept.signatureLabel}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleOpenEditDept(dept)}
                              title="Edit Department"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleDeleteDept(dept.id, dept.name)}
                              title="Delete Department"
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
            )
          ) : (
            /* SIGNATURES TAB CONTENT */
            filteredSigs.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Award size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '16px', fontWeight: '500' }}>No doctor signatures found</p>
                {searchQuery && <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search query.</p>}
              </div>
            ) : (
              <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Signature ID</th>
                      <th>Doctor Name</th>
                      <th>Title / Qualification</th>
                      <th>Label / Role</th>
                      <th>Status</th>
                      <th>Signature Image</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSigs.map(sig => (
                      <tr key={sig.id}>
                        <td style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '14px' }}>{sig.id}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{sig.name}</td>
                        <td style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{sig.title}</td>
                        <td style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{sig.label}</td>
                        <td>
                          <span className={`badge ${sig.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: sig.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: sig.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${sig.status === 'Active' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                          }}>
                            {sig.status}
                          </span>
                        </td>
                        <td>
                          {sig.imageData ? (
                            <div style={{ display: 'flex', alignItems: 'center', height: '40px', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px', background: 'var(--bg-card)', width: '100px', justifyContent: 'center' }}>
                              <img src={sig.imageData} alt="Signature Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No Image Uploaded</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleOpenEditSig(sig)}
                              title="Edit Signature"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleDeleteSig(sig.id, sig.name)}
                              title="Delete Signature"
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
            )
          )}
        </div>
      </div>

      {/* DEPARTMENT MODAL */}
      {isDeptModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeptModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDept ? 'Edit Department' : 'Add New Department'}</h3>
              <button className="modal-close" onClick={() => setIsDeptModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>

                {/* Department Name */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Department Name *</label>
                  <input
                    type="text"
                    className="form-input required"
                    placeholder="e.g. BIO CHEMISTRY, RADIOLOGY, etc."
                    value={deptName}
                    onChange={e => setDeptName(e.target.value)}
                    required
                  />
                </div>

                {/* Status and Print settings row */}
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Status</label>
                    <select
                      className="form-input form-select"
                      value={deptStatus}
                      onChange={e => setDeptStatus(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="InActive">InActive</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span className="form-label" style={{ fontWeight: '600', marginBottom: '8px' }}>Print Layout Preference</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                      <input
                        type="checkbox"
                        checked={printIndivPages}
                        onChange={e => setPrintIndivPages(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      Force print on new page (A4)
                    </label>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

                {/* Signatures Section Title */}
                <div style={{ marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Report Validation Signatures
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Upload validation signature images and configure labels specifically for reports in this department.
                  </p>
                </div>

                {/* Left Signature Block */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', backgroundColor: 'var(--bg-main)' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Left Signature (e.g. Lab Technician)</h5>
                  <div className="form-group">
                    <label className="form-label">Signature Label / Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. B.Sc. DMLT / Chief Technologist"
                      value={leftSigLabel}
                      onChange={e => setLeftSigLabel(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Signature Image</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {leftSigUrl ? (
                        <div style={{ position: 'relative', width: '120px', height: '50px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={leftSigUrl} alt="Left Signature Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                          <button
                            type="button"
                            onClick={() => { setLeftSigUrl(null); setLeftSigFile(null); }}
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220, 38, 38, 0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-input)', borderRadius: '10px', padding: '10px', cursor: 'pointer', width: '120px', height: '50px', background: 'var(--bg-card)', transition: 'border var(--transition-fast)' }}>
                          <Upload size={14} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                setLeftSigFile(e.target.files[0]);
                                setLeftSigUrl(URL.createObjectURL(e.target.files[0]));
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG/JPEG formats. Max 200px width recommended.</span>
                    </div>
                  </div>
                </div>

                {/* Right Signature Block */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', backgroundColor: 'var(--bg-main)' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>Right Signature (e.g. Pathologist / Lab Incharge)</h5>
                  <div className="form-group">
                    <label className="form-label">Signature Label / Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. M.D. (Pathology) / Lab Incharge"
                      value={rightSigLabel}
                      onChange={e => setRightSigLabel(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Signature Image</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {rightSigUrl ? (
                        <div style={{ position: 'relative', width: '120px', height: '50px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={rightSigUrl} alt="Right Signature Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                          <button
                            type="button"
                            onClick={() => { setRightSigUrl(null); setRightSigFile(null); }}
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220, 38, 38, 0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-input)', borderRadius: '10px', padding: '10px', cursor: 'pointer', width: '120px', height: '50px', background: 'var(--bg-card)', transition: 'border var(--transition-fast)' }}>
                          <Upload size={14} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                setRightSigFile(e.target.files[0]);
                                setRightSigUrl(URL.createObjectURL(e.target.files[0]));
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG/JPEG formats. Max 200px width recommended.</span>
                    </div>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsDeptModalOpen(false)}
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
                  <Save size={16} /> {submitting ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR SIGNATURE MODAL */}
      {isSigModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSigModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSig ? 'Edit Doctor Signature' : 'Add Doctor Signature'}</h3>
              <button className="modal-close" onClick={() => setIsSigModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSigSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>

                {/* Signature ID */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Signature ID / Code *</label>
                  <input
                    type="text"
                    className="form-input required"
                    placeholder="e.g. DOC01 (Unique Code)"
                    value={sigId}
                    onChange={e => setSigId(e.target.value)}
                    disabled={!!editingSig}
                    required
                  />
                  {editingSig && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>ID cannot be modified after creation.</span>}
                </div>

                {/* Doctor Name & Title */}
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Doctor Name *</label>
                    <input
                      type="text"
                      className="form-input required"
                      placeholder="e.g. Dr. Ramesh Kumar"
                      value={sigName}
                      onChange={e => setSigName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Qualification / Title *</label>
                    <input
                      type="text"
                      className="form-input required"
                      placeholder="e.g. M.D. (Pathology)"
                      value={sigTitle}
                      onChange={e => setSigTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Label & Status */}
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Role / Label *</label>
                    <input
                      type="text"
                      className="form-input required"
                      placeholder="e.g. Consultant Pathologist"
                      value={sigLabel}
                      onChange={e => setSigLabel(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Status</label>
                    <select
                      className="form-input form-select"
                      value={sigStatus}
                      onChange={e => setSigStatus(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="InActive">InActive</option>
                    </select>
                  </div>
                </div>

                {/* Additional Text */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Additional Sign Text / Registration No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Reg No: 887654"
                    value={sigText}
                    onChange={e => setSigText(e.target.value)}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="form-label" style={{ fontWeight: '600' }}>Signature Image Preview</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {sigUrl ? (
                      <div style={{ position: 'relative', width: '150px', height: '60px', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={sigUrl} alt="Signature Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        <button
                          type="button"
                          onClick={() => { setSigUrl(null); setSigFile(null); }}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220, 38, 38, 0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-input)', borderRadius: '10px', padding: '10px', cursor: 'pointer', width: '150px', height: '60px', background: 'var(--bg-card)', transition: 'border var(--transition-fast)' }}>
                        <Upload size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files?.[0]) {
                              setSigFile(e.target.files[0]);
                              setSigUrl(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Upload scanned transparent signature image for reports.</span>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsSigModalOpen(false)}
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
                  <Save size={16} /> {submitting ? 'Saving...' : 'Save Signature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Styles */}
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
