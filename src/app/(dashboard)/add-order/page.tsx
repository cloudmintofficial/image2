'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AddOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderid');

  const [formData, setFormData] = useState({
    orderName: '',
    hasComponents: false,
    testCode: '',
    displayOrderName: '',
    department: 'NONE',
    amount: '',
    processTime: '',
    machineName: '',
    sampleType: 'Select Sample',
    method: '',
    status: 'Active',
    resultTemplate: '', // For the rich text editor
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Page 1');

  useEffect(() => {
    if (orderId) {
      setLoading(true);
      fetch(`/api/tests/${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setFormData({
              orderName: data.testName || '',
              hasComponents: data.hasComponents || false,
              testCode: data.testCode || '',
              displayOrderName: data.displayOrderName || '',
              department: data.department || 'NONE',
              amount: data.price ? data.price.toString() : '',
              processTime: data.processTime || '',
              machineName: data.machineName || '',
              sampleType: data.sampleType || 'Select Sample',
              method: data.method || '',
              status: data.status || 'Active',
              resultTemplate: data.resultTemplate || '',
            });
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  const handleSave = async () => {
    if (!formData.orderName.trim()) {
      alert('Order Name is required');
      return;
    }

    try {
      const url = orderId ? `/api/tests/${orderId}` : '/api/tests';
      const method = orderId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0
        })
      });

      if (res.ok) {
        alert(`Order successfully ${orderId ? 'updated' : 'created'}!`);
        router.push('/order-maintenance');
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === 'Save Order') {
        handleSave();
      } else if (action === 'Cancel') {
        router.push('/order-maintenance');
      } else if (action === 'Clear') {
        if (!orderId) {
          setFormData({
            orderName: '', hasComponents: false, testCode: '', displayOrderName: '',
            department: 'NONE', amount: '', processTime: '', machineName: '',
            sampleType: 'Select Sample', method: '', status: 'Active', resultTemplate: ''
          });
        } else {
          alert('Clear only applies to new orders.');
        }
      } else {
        alert(`${action} coming soon!`);
      }
    };
    window.addEventListener('topnav-action', handler);
    return () => window.removeEventListener('topnav-action', handler);
  }, [formData, orderId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  if (loading) return (
    <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <div style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Loading Order Data...</div>
    </div>
  );

  return (
    <div className="add-order-container" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '20px', color: 'var(--primary)', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          {orderId ? 'Update Order' : 'Add Order'}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
          
          {/* Order Name */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Order Name:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input name="orderName" value={formData.orderName} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '300px' }} />
            <span style={{ color: 'red' }}>*</span>
          </div>

          {/* Has Components */}
          <label style={{ fontWeight: 500 }}>Has Components</label>
          <input type="checkbox" name="hasComponents" checked={formData.hasComponents} onChange={handleChange} style={{ width: '16px', height: '16px' }} />

          {/* Test Code */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Test Code:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input name="testCode" placeholder="Test Code" value={formData.testCode} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '300px' }} />
            <span style={{ color: 'red' }}>*</span>
          </div>

          {/* Display Order Name */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Display Order Name:</label>
          <div>
            <textarea name="displayOrderName" placeholder="Display Order Name" value={formData.displayOrderName} onChange={handleChange} className="form-input" rows={3} style={{ width: '100%', maxWidth: '400px', resize: 'vertical' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>If you do not want to display order name while printing reports please enter <strong>"blank"</strong> in display order name field</p>
          </div>

          {/* Department */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Department</label>
          <select name="department" value={formData.department} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '300px' }}>
            <option value="NONE">NONE</option>
            <option value="BIOCHEMISTRY">BIOCHEMISTRY</option>
            <option value="MICROBIOLOGY">MICROBIOLOGY</option>
            <option value="PATHOLOGY">PATHOLOGY</option>
            <option value="HAEMATOLOGY">HAEMATOLOGY</option>
          </select>

          {/* Amount */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Amount:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '200px' }} />
            <span style={{ color: 'red' }}>*</span>
          </div>

          {/* Process Time */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Process Time:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input name="processTime" placeholder="Process Time" value={formData.processTime} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '300px' }} />
            <span style={{ color: 'red' }}>*</span>
          </div>

          {/* Machine Name */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Machine Name:</label>
          <input name="machineName" placeholder="MachineName" value={formData.machineName} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '300px' }} />

          {/* Sample Type */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Sample Type:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select name="sampleType" value={formData.sampleType} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '250px' }}>
              <option value="Select Sample">Select Sample</option>
              <option value="Blood">Blood</option>
              <option value="Urine">Urine</option>
              <option value="Serum">Serum</option>
            </select>
            <button className="btn btn-primary" style={{ backgroundColor: '#dc2626', border: 'none', padding: '6px 16px', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
          </div>

          {/* Method */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Method:</label>
          <input name="method" placeholder="Method" value={formData.method} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '300px' }} />

          {/* Status */}
          <label style={{ fontWeight: 500, marginTop: '8px' }}>Status:</label>
          <select name="status" value={formData.status} onChange={handleChange} className="form-input" style={{ width: '100%', maxWidth: '200px' }}>
            <option value="Active">Active</option>
            <option value="InActive">InActive</option>
          </select>
          
        </div>

        {/* Rich Text Editor Mockup */}
        <div style={{ marginTop: '32px', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: '#f5f5f5' }}>
            {['Page 1', 'Page 2', 'Preview'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  padding: '8px 24px', 
                  border: 'none', 
                  backgroundColor: activeTab === tab ? '#d9534f' : '#f5f5f5', 
                  color: activeTab === tab ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 500,
                  borderRight: '1px solid #ddd'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div style={{ padding: '8px', borderBottom: '1px solid #ddd', backgroundColor: '#fafafa', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'white', border: '1px solid #ccc', borderRadius: '2px' }}>
              <button style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', borderRight: '1px solid #ccc' }}><b>B</b></button>
              <button style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', borderRight: '1px solid #ccc' }}><i>I</i></button>
              <button style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}><u>U</u></button>
            </div>
            <select style={{ border: '1px solid #ccc', background: 'white', padding: '4px' }} defaultValue="Times New Roman">
              <option>Times New Roman</option>
              <option>Arial</option>
            </select>
          </div>
          
          <textarea 
            name="resultTemplate"
            value={formData.resultTemplate}
            onChange={handleChange}
            style={{ width: '100%', height: '200px', border: 'none', padding: '16px', outline: 'none', resize: 'none' }} 
            placeholder="Enter result template..."
          />
        </div>
      </div>
    </div>
  );
}

export default function AddOrderPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Loading form...</div>
      </div>
    }>
      <AddOrderForm />
    </Suspense>
  );
}
