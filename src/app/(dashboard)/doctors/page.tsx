'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Users, Search } from 'lucide-react';
import DoctorModal from '@/components/modals/DoctorModal';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctors?all=true&search=${encodeURIComponent(debouncedSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [debouncedSearch]);

  const handleEdit = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedDoctor(null);
    setShowModal(true);
  };

  const filteredDoctors = doctors;
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage) || 1;
  const currentDoctors = filteredDoctors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="doctors-maintenance-container" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Referral Doctors</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Manage referral network and commissions</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      {/* Top Tabs mimicking the old version */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 24, paddingBottom: 0 }}>
        {['All Doctors', 'Sales Executives', 'Referral Companies', 'Bill Discount Approvals'].map((tab, idx) => (
          <button
            key={tab}
            style={{
              padding: '12px 4px',
              fontSize: 14,
              fontWeight: idx === 0 ? 600 : 500,
              color: idx === 0 ? 'var(--primary)' : 'var(--text-secondary)',
              border: 'none',
              background: 'none',
              borderBottom: idx === 0 ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: idx === 0 ? 'default' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Doctor Name..."
              className="form-input"
              style={{ paddingLeft: 36 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Showing {currentDoctors.length} of {filteredDoctors.length} entries
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="medfile-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left', background: '#fff' }}>Doctor Name</th>
                <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left', background: '#fff' }}>Perc.toDoc</th>
                <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left', background: '#fff' }}>Phone</th>
                <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left', background: '#fff' }}>Status</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', background: '#fff' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading doctors...</span>
                    </div>
                  </td>
                </tr>
              ) : currentDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No doctors found matching "{search}"
                  </td>
                </tr>
              ) : (
                currentDoctors.map((doc, idx) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                    <td style={{ padding: '12px 24px' }}>
                      <div 
                        style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                        onClick={() => handleEdit(doc)}
                        className="hover-underline"
                      >
                        {doc.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {doc.type} {doc.specialization ? `• ${doc.specialization}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px 24px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {doc.percentage ?? 0}%
                    </td>
                    <td style={{ padding: '12px 24px', color: 'var(--text-secondary)' }}>
                      {doc.phone || '---'}
                    </td>
                    <td style={{ padding: '12px 24px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: doc.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                        color: doc.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                        textTransform: 'uppercase'
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(doc)} style={{ color: 'var(--primary)' }}>Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: 8, background: '#f8fafc', borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, padding: '0 12px' }}>
              Page {currentPage} of {totalPages}
            </div>
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <DoctorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchDoctors}
        initialData={selectedDoctor}
      />

      <style jsx>{`
        .hover-underline:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
