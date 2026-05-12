'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Plus, Edit, Trash2, Printer, Layout, Type } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function OrderComponentsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id;
  const { showToast } = useToast();

  const [test, setTest] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tests/${testId}`);
      if (res.ok) {
        const data = await res.json();
        setTest(data);
        setComponents(data.components || []);
      } else {
        showToast('Failed to fetch test details', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) fetchDetails();
  }, [testId]);

  return (
    <div className="order-components-container" style={{ padding: '24px' }}>
      {/* Header / Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Order Details for <span style={{ color: 'var(--primary)' }}>{test?.testName || '...'}</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage diagnostic parameters and reference ranges
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => router.push('/order-maintenance')}>
            <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back to Orders
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: '#e25838', border: 'none' }}>
            <Plus size={18} style={{ marginRight: '8px' }} /> Add Order Details
          </button>
        </div>
      </div>

      {/* Sub Top Nav mimicking the old version */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <Type size={16} style={{ marginRight: '6px' }} /> Order Font
        </button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <Layout size={16} style={{ marginRight: '6px' }} /> Templates
        </button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Add Components Of Existing Order
        </button>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <Printer size={16} style={{ marginRight: '6px' }} /> Print Preview
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="medfile-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fff', borderBottom: '2px solid var(--border)' }}>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Sub Heading</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Component</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Range</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Units</th>
              <th style={{ color: 'var(--primary)', padding: '12px 24px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px 24px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto' }} />
                  <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading components...</p>
                </td>
              </tr>
            ) : components.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No components defined for this test.
                </td>
              </tr>
            ) : (
              components.map((comp, idx) => (
                <tr key={comp.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                  <td style={{ padding: '12px 24px' }}>{comp.subHeading || '---'}</td>
                  <td style={{ padding: '12px 24px', fontWeight: '600' }}>{comp.componentName}</td>
                  <td style={{ padding: '12px 24px', fontSize: '13px', maxWidth: '300px' }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{comp.normalRange || '---'}</div>
                  </td>
                  <td style={{ padding: '12px 24px' }}>{comp.unit || '---'}</td>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: '700',
                      background: comp.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                      color: comp.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                      textTransform: 'uppercase'
                    }}>
                      {comp.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" style={{ color: '#e25838', backgroundColor: '#fff', border: '1px solid #e25838' }}>Values</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)' }}><Edit size={16} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
