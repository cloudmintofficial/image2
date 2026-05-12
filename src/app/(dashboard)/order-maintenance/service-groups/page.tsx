'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function ServiceGroupsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [serviceGroups, setServiceGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    groupName: '',
    amount: '',
    status: 'Active',
    testIds: [] as number[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/service-groups');
      if (res.ok) {
        setServiceGroups(await res.json());
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!form.groupName || !form.amount) {
      showToast('Name and Amount are required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/service-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        showToast('Service Group saved successfully', 'success');
        setShowAddModal(false);
        setForm({ groupName: '', amount: '', status: 'Active', testIds: [] });
        fetchData();
      } else {
        showToast('Failed to save service group', 'error');
      }
    } catch (err) {
      showToast('Error saving group', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="service-groups-container" style={{ padding: '24px' }}>
      {/* Header Area */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Service Groups
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage diagnostic panels and grouped service packages
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add Service Group
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => router.push('/order-maintenance')}
            style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>
      </div>

      {/* High-Fidelity Classic Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <table className="medfile-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e25838' }}>
              <th style={{ color: '#e25838', padding: '16px 24px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>ServiceGroup Name</th>
              <th style={{ color: '#e25838', padding: '16px 24px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>Amount</th>
              <th style={{ color: '#e25838', padding: '16px 24px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>Orders</th>
              <th style={{ padding: '16px 24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
            ) : serviceGroups.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  There are no items to display
                </td>
              </tr>
            ) : (
              serviceGroups.map((group) => (
                <tr key={group.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-primary)' }}>{group.name}</td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-primary)' }}>{parseFloat(group.amount).toFixed(2)}</td>
                  <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{group.orders}</td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Service Group Modal - Classic Theme */}
      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', width: '850px', maxWidth: '95%', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Top Classic Action Bar */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '32px', alignItems: 'center', background: '#fff', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="classic-action-link"
                style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '14px', color: '#000', cursor: 'pointer', padding: 0 }}
              >
                {isSaving ? 'Saving...' : 'Save Details'}
              </button>
              <button
                onClick={() => setForm({ groupName: '', amount: '', status: 'Active', testIds: [] })}
                className="classic-action-link"
                style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '14px', color: '#000', cursor: 'pointer', padding: 0 }}
              >
                Clear
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="classic-action-link"
                style={{ background: 'none', border: 'none', fontWeight: 'bold', fontSize: '14px', color: '#000', cursor: 'pointer', padding: 0 }}
              >
                Cancel
              </button>
              <div style={{ marginLeft: 'auto', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>
                Hi! IMAGEE OWNER
              </div>
            </div>

            {/* Inner Workspace */}
            <div style={{ padding: '30px', background: '#f8f9fa', flex: 1 }}>
              <div style={{ border: '1px solid #ced4da', borderRadius: '4px', padding: '40px 20px', background: '#fff' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', textAlign: 'right', paddingRight: '24px' }}>
                      ServiceGroupName :
                    </label>
                    <input 
                      type="text" 
                      className="form-input-classic" 
                      placeholder="Enter group name" 
                      value={form.groupName}
                      onChange={e => setForm({...form, groupName: e.target.value})}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', textAlign: 'right', paddingRight: '24px' }}>
                      Amount :
                    </label>
                    <input 
                      type="number" 
                      className="form-input-classic" 
                      placeholder="0.00" 
                      style={{ width: '150px' }} 
                      value={form.amount}
                      onChange={e => setForm({...form, amount: e.target.value})}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'flex-start' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', textAlign: 'right', paddingRight: '24px', paddingTop: '8px' }}>
                      Orders :
                    </label>
                    <div style={{ border: '1px solid #ced4da', borderRadius: '2px', padding: '12px', minHeight: '100px', background: '#fff' }}>
                      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Select orders to group (Logic implementation in progress)...</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-input-classic {
          padding: 6px 10px;
          border-radius: 2px;
          border: 1px solid #767676;
          font-size: 13px;
          background: #fff;
          color: #000;
          outline: none;
          width: 100%;
        }
        .classic-action-link:hover {
          text-decoration: underline;
        }
        .table-row-hover:hover {
          background-color: var(--bg-secondary);
        }
        .medfile-table th {
          border-bottom: 2px solid #e25838;
        }
      `}</style>
    </div>
  );
}
