'use client';

import React from 'react';

interface PastOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastOrders: any[];
  patientInfo: { name: string; phone: string; umr?: string };
  onRepeatOrder: (order: any) => void;
}

export default function PastOrdersModal({ 
  isOpen, 
  onClose, 
  pastOrders = [], 
  patientInfo = { name: '', phone: '', umr: '' }, 
  onRepeatOrder 
}: PastOrdersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header" style={{ background: 'var(--primary)', color: 'white' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: 0, color: 'white', fontWeight: 600 }}>Past Patient Orders</h3>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
              For: <strong style={{ color: 'white' }}>{patientInfo?.name || 'Unknown Patient'}</strong> ({patientInfo?.phone || 'N/A'}) {patientInfo?.umr && `• UMR: ${patientInfo.umr}`}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ color: 'white' }}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {pastOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>
              No previous orders found for this patient.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pastOrders.map((order, idx) => (
                <div 
                  key={idx} 
                  className="card" 
                  style={{ 
                    padding: 16, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    transition: 'all 0.2s', 
                    cursor: 'pointer', 
                    border: '1px solid var(--border)' 
                  }} 
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'} 
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'} 
                  onClick={() => onRepeatOrder(order)}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15 }}>{order.orderName}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Ordered: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Unknown Date'} • Status: {order.status || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>₹{Number(order.amount).toFixed(2)}</div>
                    <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: 12, padding: '4px 12px' }}>Repeat</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
