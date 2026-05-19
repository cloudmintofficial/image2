'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function DoctorModal({ isOpen, onClose, onSuccess, initialData }: DoctorModalProps) {
  const { showToast } = useToast();
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Referral');
  const [docPercentage, setDocPercentage] = useState('');
  const [docAddress, setDocAddress] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docDepartment, setDocDepartment] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docLocation, setDocLocation] = useState('');
  const [docHospital, setDocHospital] = useState('');
  const [docSalesExecutive, setDocSalesExecutive] = useState('');
  const [docInactive, setDocInactive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Departments
    fetch('/api/departments?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDbDepartments(data);
      })
      .catch(err => console.error('Failed to fetch departments:', err));

    if (isOpen && initialData) {
      setDocName(initialData.name || '');
      setDocType(initialData.type || 'Referral');
      setDocPercentage(initialData.percentage?.toString() || '');
      setDocAddress(initialData.address || '');
      setDocPhone(initialData.phone || '');
      setDocEmail(initialData.email || '');
      setDocDepartment(initialData.department || '');
      setDocSpecialty(initialData.specialization || '');
      setDocLocation(initialData.location || '');
      setDocHospital(initialData.hospital || '');
      setDocSalesExecutive(initialData.salesExecutive || '');
      setDocInactive(initialData.status === 'InActive');
    } else if (isOpen && !initialData) {
      handleClear();
    }
  }, [isOpen, initialData]);

  const handleClear = () => {
    setDocName('');
    setDocType('Referral');
    setDocPercentage('');
    setDocAddress('');
    setDocPhone('');
    setDocEmail('');
    setDocDepartment('');
    setDocSpecialty('');
    setDocLocation('');
    setDocHospital('');
    setDocSalesExecutive('');
    setDocInactive(false);
  };

  const handleSave = async () => {
    if (!docName.trim()) {
      showToast('Doctor Name is required', 'error');
      return;
    }

    if (!docType) {
      showToast('Doctor Type is required', 'error');
      return;
    }

    if (docPercentage !== '') {
      const p = parseFloat(docPercentage);
      if (isNaN(p) || p < 0 || p > 100) {
        showToast('Percentage must be between 0 and 100', 'error');
        return;
      }
    }

    if (docPhone && !/^[0-9+-\s()]*$/.test(docPhone)) {
      showToast('Invalid phone number format', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: docName,
        type: docType,
        percentage: docPercentage,
        address: docAddress,
        phone: docPhone,
        email: docEmail,
        department: docDepartment,
        specialization: docSpecialty,
        location: docLocation,
        hospital: docHospital,
        salesExecutive: docSalesExecutive,
        status: docInactive ? 'InActive' : 'Active'
      };

      const url = initialData ? `/api/doctors/${initialData.id}` : '/api/doctors';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Doctor ${initialData ? 'updated' : 'added'} successfully`, 'success');
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save doctor', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="modal-header">
          <h3>{initialData ? 'Update Doctor' : 'Add Doctor'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="doc-form-grid">
            <label className="form-label">Doctor Name <span className="required">*</span></label>
            <input className="form-input" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Full Name" />

            <label className="form-label">Doctor Type <span className="required">*</span></label>
            <select className="form-input form-select" value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="Referral">Referral</option>
              <option value="Service Provider">Service Provider</option>
              <option value="Both">Both</option>
            </select>

            <label className="form-label">Comm. Percentage</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type="number" value={docPercentage} onChange={e => setDocPercentage(e.target.value)} placeholder="0.00" />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}>%</span>
            </div>

            <label className="form-label">Phone Number</label>
            <input className="form-input" value={docPhone} onChange={e => setDocPhone(e.target.value)} placeholder="Contact number" />

            <label className="form-label">Email Address</label>
            <input className="form-input" value={docEmail} onChange={e => setDocEmail(e.target.value)} placeholder="doctor@example.com" />

            <label className="form-label">Department</label>
            <select className="form-input form-select" value={docDepartment} onChange={e => setDocDepartment(e.target.value)}>
              <option value="">-- Select Department --</option>
              {dbDepartments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
              {docDepartment && !dbDepartments.some(d => d.name === docDepartment) && (
                <option value={docDepartment}>{docDepartment}</option>
              )}
            </select>

            <label className="form-label">Specialization</label>
            <input className="form-input" value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)} placeholder="e.g. Cardiologist" />

            <label className="form-label">Hospital</label>
            <input className="form-input" value={docHospital} onChange={e => setDocHospital(e.target.value)} placeholder="Hospital name" />

            <label className="form-label">Location</label>
            <input className="form-input" value={docLocation} onChange={e => setDocLocation(e.target.value)} placeholder="City/Region" />

            <label className="form-label">Clinic Address</label>
            <textarea className="form-input" rows={2} value={docAddress} onChange={e => setDocAddress(e.target.value)} placeholder="Full clinic address" style={{ resize: 'vertical' }} />

            <label className="form-label">Sales Executive</label>
            <select className="form-input form-select" value={docSalesExecutive} onChange={e => setDocSalesExecutive(e.target.value)}>
              <option value="">-- Select Executive --</option>
              <option value="No Sales Executives Available" disabled>No Sales Executives Available</option>
            </select>

            <div />
            <div style={{ paddingTop: '8px' }}>
              <label className="checkbox-container">
                <input type="checkbox" checked={docInactive} onChange={e => setDocInactive(e.target.checked)} />
                <span className="checkbox-label" style={{ color: docInactive ? 'var(--danger)' : 'inherit' }}>Mark as Inactive</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ minWidth: '120px' }}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Doctor'}
          </button>
        </div>

        <style jsx>{`
          .doc-form-grid {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: 20px 24px;
            align-items: center;
          }
          .required {
            color: var(--danger);
            margin-left: 2px;
          }
          .checkbox-container {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 8px;
            transition: background 0.2s;
            background: #f8fafc;
            width: fit-content;
          }
          .checkbox-container:hover {
            background: #f1f5f9;
          }
          .checkbox-label {
            font-size: 13px;
            font-weight: 600;
            color: #334155;
          }
          @media (max-width: 600px) {
            .doc-form-grid {
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .doc-form-grid label {
              text-align: left;
              margin-bottom: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
