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
                  <td style={{ padding: '8px 12px' }}>
                    {test.name}
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
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#e25838', border: 'none' }}
                      onClick={() => fetchTestDetails(test.id)}
                      disabled={loadingDetails && selectedTestId === test.id}
                    >
                      {loadingDetails && selectedTestId === test.id ? 'Loading...' : 'Details'}
                    </button>
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
