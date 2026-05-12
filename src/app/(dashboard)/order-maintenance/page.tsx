'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Loader2 } from 'lucide-react';
import AddOrderModal from '@/components/modals/AddOrderModal';

export default function OrderMaintenancePage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedTestDetails, setSelectedTestDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);

  // Lab Default Font global modal state
  const [showLabFontModal, setShowLabFontModal] = useState(false);
  const [labFontForm, setLabFontForm] = useState({
    fontFamily: 'Arial',
    patientDetailsFont: '10',
    departmentNameFont: '10',
    orderNameFont: '10',
    resultHeadingFont: '10',
    subHeadingFont: '10',
    componentNameFont: '10',
    methodFont: '10',
    resultNotesFont: '10',
    leftSignatureFont: '10',
    rightSignatureFont: '10',
    spaceBeforeLineFont: '',
    spaceAfterLineFont: ''
  });
  const [isSavingLabFont, setIsSavingLabFont] = useState(false);

  const fetchLabFont = async () => {
    try {
      const res = await fetch('/api/lab/default-font');
      if (res.ok) {
        const data = await res.json();
        setLabFontForm({
          fontFamily: data.fontFamily || 'Arial',
          patientDetailsFont: data.patientDetailsFont || '10',
          departmentNameFont: data.departmentNameFont || '10',
          orderNameFont: data.orderNameFont || '10',
          resultHeadingFont: data.resultHeadingFont || '10',
          subHeadingFont: data.subHeadingFont || '10',
          componentNameFont: data.componentNameFont || '10',
          methodFont: data.methodFont || '10',
          resultNotesFont: data.resultNotesFont || '10',
          leftSignatureFont: data.leftSignatureFont || '10',
          rightSignatureFont: data.rightSignatureFont || '10',
          spaceBeforeLineFont: data.spaceBeforeLineFont || '',
          spaceAfterLineFont: data.spaceAfterLineFont || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveLabFont = async () => {
    try {
      setIsSavingLabFont(true);
      const res = await fetch('/api/lab/default-font', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labFontForm)
      });
      if (res.ok) {
        alert('Lab Default Font saved successfully');
        setShowLabFontModal(false);
      } else {
        alert('Failed to save Lab Default Font');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving Lab Default Font');
    } finally {
      setIsSavingLabFont(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchTestDetails = async (id: number) => {
    setSelectedTestId(id);
    setLoadingDetails(true);
    setSelectedTestDetails(null);
    try {
      const res = await fetch(`/api/tests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTestDetails(data);
        setShowAddOrderModal(true);
      } else {
        alert('Failed to fetch details');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedTestId(null);
    setSelectedTestDetails(null);
  };

  // Close modal on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (selectedTestId) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedTestId]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tests?all=true');
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch (err) {
      console.error('Failed to fetch tests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const router = useRouter();

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === 'Add Order') {
        setSelectedTestDetails(null);
        setShowAddOrderModal(true);
      } else if (action === 'Lab Default Font') {
        fetchLabFont();
        setShowLabFontModal(true);
      } else {
        alert(`${action} coming soon!`);
      }
    };
    window.addEventListener('topnav-action', handler);
    return () => window.removeEventListener('topnav-action', handler);
  }, [router]);

  const filteredTests = tests.filter(t => 
    (t.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (t.displayOrderName || '').toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage) || 1;
  const currentTests = filteredTests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="order-maintenance-container">
      <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <input
          type="text"
          placeholder="Search by Order Name..."
          className="form-input"
          style={{ maxWidth: '300px' }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Showing {currentTests.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredTests.length)} of {filteredTests.length} entries
        </div>
      </div>

      <div className="table-container" style={{ padding: '24px', overflowX: 'auto', height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Loading orders...</span>
          </div>
        ) : filteredTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No orders found matching "{search}"</div>
        ) : (
          <table className="medfile-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ color: 'var(--primary)', padding: '12px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', textAlign: 'left', width: '50%' }}>Order Name</th>
                <th style={{ color: 'var(--primary)', padding: '12px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', textAlign: 'left', width: '15%' }}>Order Amount</th>
                <th style={{ color: 'var(--primary)', padding: '12px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', textAlign: 'left', width: '15%' }}>Order Type</th>
                <th style={{ color: 'var(--primary)', padding: '12px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', textAlign: 'left', width: '10%' }}>Status</th>
                <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', textAlign: 'right', width: '10%' }}></th>
              </tr>
            </thead>
            <tbody>
              {currentTests.map((test, index) => (
                <tr key={test.id} style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <td 
                    style={{ padding: '8px 12px', cursor: 'pointer' }}
                    onClick={() => fetchTestDetails(test.id)}
                    className="hover-underline"
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{test.name}</div>
                    {test.displayOrderName && test.displayOrderName.trim().toLowerCase() !== 'blank' && test.displayOrderName !== test.name && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Display: {test.displayOrderName}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }}>{test.price}</td>
                  <td style={{ padding: '8px 12px' }}>{test.orderType}</td>
                  <td style={{ padding: '8px 12px', color: test.status === 'InActive' ? '#dc2626' : 'inherit' }}>{test.status}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    {test.hasComponents && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#e25838', border: 'none' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/order-maintenance/${test.id}/components`);
                        }}
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => {
          setShowAddOrderModal(false);
          closeModal();
        }}
        onSuccess={() => {
          setShowAddOrderModal(false);
          closeModal();
          fetchTests();
        }}
        initialData={selectedTestDetails}
      />

      {/* Global Lab Default Font Modal */}
      {showLabFontModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '8px', width: '850px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            {/* Top Action Bar */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
              <button 
                onClick={handleSaveLabFont} 
                disabled={isSavingLabFont}
                style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '15px', color: '#000', cursor: 'pointer', padding: 0 }}
              >
                {isSavingLabFont ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setShowLabFontModal(false)}
                style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '18px', color: '#000', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            {/* Inner Content Area */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#fff' }}>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '20px', background: '#fff' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#d1d5db', marginBottom: '24px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                  Add Default Font
                </h2>

                <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '14px', marginLeft: '40px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 200px', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', color: '#000' }}>FontFamily</label>
                    <select 
                      value={labFontForm.fontFamily} 
                      onChange={e => setLabFontForm({...labFontForm, fontFamily: e.target.value})}
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px', background: '#fff', width: '100%' }}
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
                      <label style={{ fontSize: '13px', color: '#000' }}>{field.label}</label>
                      <input 
                        type="text" 
                        value={(labFontForm as any)[field.key]} 
                        onChange={e => setLabFontForm({...labFontForm, [field.key]: e.target.value})}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .order-maintenance-container {
          background: var(--bg-card);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          height: calc(100vh - 80px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .medfile-table th {
          font-weight: 600;
        }
        .medfile-table td {
          font-size: 14px;
        }
        .medfile-table tr:hover {
          background-color: var(--bg-secondary) !important;
        }
      `}</style>
    </div>
  );
}
