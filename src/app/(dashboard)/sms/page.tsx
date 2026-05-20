'use client';

import React, { useState, useEffect } from 'react';
import { Send, Search, Check, AlertCircle, MessageSquare, Phone, Calendar, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface SMSLog {
  id: number;
  phone: string;
  message: string;
  status: string;
  sentAt: string;
}

const TEMPLATES = [
  {
    id: 'report_ready',
    name: 'Report Ready Alert',
    text: 'Dear Patient, your report is now ready. Download it here: http://localhost:3000/reports/download'
  },
  {
    id: 'booking_confirmed',
    name: 'Booking Confirmation',
    text: 'Dear Patient, your laboratory booking is confirmed. Thank you for choosing Medfile Labs.'
  },
  {
    id: 'collection_scheduled',
    name: 'Home Collection Scheduled',
    text: 'Dear Patient, our technician has been scheduled to collect your sample at your address. Contact: +91 98765 43210.'
  },
  {
    id: 'custom',
    name: '[Custom Message]',
    text: ''
  }
];

export default function SMSPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<SMSLog[]>([]);

  // Form States
  const [phone, setPhone] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('report_ready');
  const [message, setMessage] = useState(TEMPLATES[0].text);

  // UI Feedback
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sms?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load SMS logs', 'error');
      }
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      showToast('Error loading SMS logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setMessage(tmpl.text);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!message.trim()) {
      showToast('SMS message content is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        phone: phone.trim(),
        message: message.trim()
      };

      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('SMS sent (simulated) successfully', 'success');
        setPhone('');
        // Reset message to selected template
        const tmpl = TEMPLATES.find(t => t.id === selectedTemplate);
        setMessage(tmpl ? tmpl.text : '');
        fetchLogs();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to send SMS', 'error');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      showToast('Error sending SMS', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.phone.includes(searchQuery) ||
    log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (session?.user && (session.user as any).role !== 'Owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', fontSize: 24, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to view the SMS module.</p>
      </div>
    );
  }

  return (
    <div className="content-wrapper" style={{ padding: '24px' }}>
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type === 'success' ? 'toast-success' : 'btn-danger'}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>
          SMS Notification logs & Simulator
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Simulate text alerts to patients, check delivery logs, and audit templates.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Simulator Column */}
        <div style={{ flex: '1 1 350px', maxWidth: '450px' }}>
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Trigger Simulated SMS</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Phone */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Patient Phone *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input required"
                      placeholder="e.g. +91 9988776655"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      style={{ paddingLeft: '38px' }}
                    />
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                {/* Templates */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Choose Template</label>
                  <select
                    className="form-input form-select"
                    value={selectedTemplate}
                    onChange={e => handleTemplateChange(e.target.value)}
                  >
                    {TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Message Body */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Message Body *</label>
                  <textarea
                    className="form-input required"
                    placeholder="Enter custom SMS text message..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={5}
                    required
                    style={{ resize: 'vertical', fontSize: '14px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Characters: {message.length} | Segments: {Math.ceil(message.length / 160)} (160 chars per SMS segment)
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ width: '100%', justifyContent: 'center', fontWeight: '600', padding: '12px' }}
                >
                  <Send size={16} /> {submitting ? 'Sending Alert...' : 'Send SMS'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Logs Column */}
        <div style={{ flex: '2 1 600px' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div style={{ position: 'relative', width: '250px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search SMS logs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px', borderRadius: '10px' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              <button
                className="btn btn-outline"
                onClick={fetchLogs}
                style={{ borderRadius: '10px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Refresh Logs"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div className="card-body" style={{ padding: '0px' }}>
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '32px', height: '32px', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
                  <p>Loading log history...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>No SMS logs found</p>
                  {searchQuery && <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search query.</p>}
                </div>
              ) : (
                <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '150px' }}>Phone Number</th>
                        <th>Message Content</th>
                        <th style={{ width: '100px' }}>Status</th>
                        <th style={{ width: '180px' }}>Sent Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{log.phone}</td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px', wordBreak: 'break-word' }}>{log.message}</td>
                          <td>
                            <span className="badge badge-success" style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: 'var(--success-light)',
                              color: 'var(--success)',
                              border: '1px solid rgba(22, 163, 74, 0.2)'
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                              {new Date(log.sentAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Spin Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          box-shadow: 0 0 8px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
