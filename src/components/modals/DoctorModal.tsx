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

  useEffect(() => {
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
        <div className="modal-body" style={{ maxWidth: 600, margin: '0 auto', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '16px 24px', alignItems: 'center', paddingTop: 20, width: '100%' }}>
          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Doctor Name:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input className="form-input" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Doctor Name" />
            <span style={{ color: 'var(--danger)' }}>*</span>
          </div>

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Doctor Type:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <select className="form-input form-select" value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="Referral">Referral</option>
              <option value="Service Provider">Service Provider</option>
              <option value="Both">Both</option>
            </select>
            <span style={{ color: 'var(--danger)' }}>*</span>
          </div>

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Percentage To Doctor:</label>
          <input className="form-input" type="number" value={docPercentage} onChange={e => setDocPercentage(e.target.value)} placeholder="Percentage to Doctor" />

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Address:</label>
          <input className="form-input" value={docAddress} onChange={e => setDocAddress(e.target.value)} placeholder="Address" />

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Phone Number:</label>
          <input className="form-input" value={docPhone} onChange={e => setDocPhone(e.target.value)} placeholder="Phone Number" />

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Email:</label>
          <input className="form-input" value={docEmail} onChange={e => setDocEmail(e.target.value)} placeholder="Email" />

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Department:</label>
          <select className="form-input form-select" value={docDepartment} onChange={e => setDocDepartment(e.target.value)}>
            <option value="">-- Select Department --</option>
            <option value="BIO CHEMISTRY">BIO CHEMISTRY</option>
            <option value="IMMUNOLOGY">IMMUNOLOGY</option>
            <option value="SEROLOGY">SEROLOGY</option>
            <option value="CLINICAL PATHOLOGY">CLINICAL PATHOLOGY</option>
            <option value="HEMATOLOGY">HEMATOLOGY</option>
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

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Specialization:</label>
          <input className="form-input" value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)} placeholder="Specialization" />

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Location:</label>
          <input className="form-input" value={docLocation} onChange={e => setDocLocation(e.target.value)} placeholder="Location" />

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Hospital:</label>
          <input className="form-input" value={docHospital} onChange={e => setDocHospital(e.target.value)} placeholder="Hospital" />

          <label className="form-label" style={{ marginBottom: 0, textAlign: 'right' }}>Sales Executive:</label>
          <select className="form-input form-select" value={docSalesExecutive} onChange={e => setDocSalesExecutive(e.target.value)}>
            <option value="">-- Select Sales Executive --</option>
            <option value="No Sales Executives Available" disabled>No Sales Executives Available</option>
          </select>

          <div style={{ gridColumn: '2' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginTop: 4 }}>
              <input type="checkbox" checked={docInactive} onChange={e => setDocInactive(e.target.checked)} />
              Check to Inactive
            </label>
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-outline" onClick={handleClear}>Clear</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
