'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

const tabs = ['Lab Profile', 'Locations', 'Departments', 'Incoming Labs', 'Test Master Data', 'Preferences'];

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'Lab Profile');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/settings?tab=${tab}`);
  };
  
  // Data states
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [incomingLabs, setIncomingLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // States for Lab Profile
  const [labProfile, setLabProfile] = useState({
    name: 'Medfile Labs',
    address: '123 Health Ave, Medical District',
    phone: '+91 9876543210',
    email: 'contact@medfilelabs.com'
  });

  React.useEffect(() => {
    if (activeTab === 'Locations') {
      fetch('/api/locations').then(r=>r.json()).then(d => setLocations(Array.isArray(d) ? d : []));
    }
    if (activeTab === 'Departments') {
      fetch('/api/departments').then(r=>r.json()).then(d => setDepartments(Array.isArray(d) ? d : []));
    }
    if (activeTab === 'Incoming Labs') {
      fetch('/api/incoming-labs').then(r=>r.json()).then(d => setIncomingLabs(Array.isArray(d) ? d : []));
    }
  }, [activeTab]);

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
              onClick={() => handleTabChange(tab)}
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

          {activeTab === 'Locations' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Lab Branches / Locations</h3>
                <button className="btn btn-primary btn-sm"><Plus size={16} /> Add Location</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Location Name</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc: any) => (
                    <tr key={loc.id}>
                      <td style={{ fontWeight: 500 }}>{loc.name}</td>
                      <td>{loc.address || '—'}</td>
                      <td>{loc.phone || '—'}</td>
                      <td>{loc.status ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">InActive</span>}</td>
                      <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                    </tr>
                  ))}
                  {locations.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>No locations found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Departments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Lab Departments</h3>
                <button className="btn btn-primary btn-sm"><Plus size={16} /> Add Department</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept: any) => (
                    <tr key={dept.id}>
                      <td style={{ fontWeight: 500 }}>{dept.name}</td>
                      <td>{dept.status ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">InActive</span>}</td>
                      <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                    </tr>
                  ))}
                  {departments.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center' }}>No departments found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Incoming Labs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Incoming Labs / Referrals</h3>
                <button className="btn btn-primary btn-sm"><Plus size={16} /> Add Lab</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lab Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingLabs.map((lab: any) => (
                    <tr key={lab.id}>
                      <td style={{ fontWeight: 500 }}>{lab.labName}</td>
                      <td>{lab.contactPerson || '—'}</td>
                      <td>{lab.primaryPhone || '—'}</td>
                      <td>{lab.status ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">InActive</span>}</td>
                      <td><button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button></td>
                    </tr>
                  ))}
                  {incomingLabs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>No incoming labs found</td></tr>}
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
