'use client';

import React, { useState } from 'react';
import { Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const tabs = ['Lab Profile', 'Multi-Lab Management', 'User Management', 'Test Master Data', 'Preferences'];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('Lab Profile');
  
  // States for Lab Profile
  const [labProfile, setLabProfile] = useState({
    name: 'Medfile Labs',
    address: '123 Health Ave, Medical District',
    phone: '+91 9876543210',
    email: 'contact@medfilelabs.com'
  });

  if (session?.user && (session.user as any).role !== 'Owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', fontSize: 24, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to view the Settings module.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">System Settings</h1>
        <p className="page-subtitle">Configure lab profiles, manage users, and update test master data.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab ? 600 : 500,
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="card-body" style={{ padding: 24, minHeight: 400 }}>
          {activeTab === 'Lab Profile' && (
            <div style={{ maxWidth: 600 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Lab Profile Information</h3>
              <div className="form-group">
                <label className="form-label">Lab Name</label>
                <input className="form-input" value={labProfile.name} onChange={e => setLabProfile({...labProfile, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-input" rows={3} value={labProfile.address} onChange={e => setLabProfile({...labProfile, address: e.target.value})} />
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={labProfile.phone} onChange={e => setLabProfile({...labProfile, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" value={labProfile.email} onChange={e => setLabProfile({...labProfile, email: e.target.value})} />
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 16 }}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          )}

          {activeTab === 'Multi-Lab Management' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Lab Branches</h3>
                <button className="btn btn-primary btn-sm"><Plus size={16} /> Add Branch</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lab Name</th>
                    <th>Address</th>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Hospital (Main)</td>
                    <td>HYDERABAD</td>
                    <td>RAMESH</td>
                    <td>9999999999</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Hospital (Branch)</td>
                    <td>HAYATH NAGAR</td>
                    <td>—</td>
                    <td>9248924828</td>
                    <td><span className="badge badge-danger">InActive</span></td>
                    <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Hospital (Branch)</td>
                    <td>MANSURABAD</td>
                    <td>—</td>
                    <td>8297045678</td>
                    <td><span className="badge badge-danger">InActive</span></td>
                    <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'User Management' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>System Users</h3>
                <button className="btn btn-primary btn-sm"><Plus size={16} /> Add User</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>IMAGEE OWNER</td>
                    <td>Imagee owner</td>
                    <td><span className="badge badge-primary">Admin/Owner</span></td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button>
                    </td>
                  </tr>
                  <tr>
                    <td>IMAGEERAJANI</td>
                    <td>IMAGEERAJANI</td>
                    <td><span className="badge badge-secondary">Reception</span></td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                  <tr>
                    <td>imageemallesh</td>
                    <td>Imageemallesh</td>
                    <td><span className="badge badge-secondary">Lab Entry</span></td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Test Master Data' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Test & Procedure Catalog</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input className="form-input" placeholder="Search tests..." style={{ width: 250 }} />
                  <button className="btn btn-primary btn-sm"><Plus size={16} /> Add Test</button>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Category</th>
                    <th>Price (₹)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 500 }}>X-Ray LEFT ANKLE LAT</td>
                    <td>Internal</td>
                    <td>400</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>ANTI CCP</td>
                    <td>Internal</td>
                    <td>1500</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>125-Di HYDROXYCHOLECALCIFEROL(VITAMIN D3)</td>
                    <td>Internal</td>
                    <td>3200</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Preferences' && (
            <div style={{ maxWidth: 600 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>System Preferences</h3>
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <select className="form-input">
                  <option>₹ (INR)</option>
                  <option>$ (USD)</option>
                  <option>€ (EUR)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Default Report Footer Note</label>
                <textarea className="form-input" rows={3} defaultValue="* This is a computer generated report. Signature not required." />
              </div>
              <div className="form-group">
                <label className="form-label">Max Allowed Discount (%)</label>
                <input className="form-input" type="number" defaultValue="20" />
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', marginTop: 24 }}>
                <input type="checkbox" defaultChecked /> Enable SMS Alerts for Patients
              </label>
              <button className="btn btn-primary" style={{ marginTop: 24 }}>
                <Save size={16} /> Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
