'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Check, AlertCircle, Users, Eye, EyeOff, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
  status: string;
  locationId: number | null;
  defaultScreen: string | null;
  location?: {
    id: number;
    name: string;
  } | null;
}

interface Location {
  id: number;
  name: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Modal & Form States
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Reception');
  const [defaultScreen, setDefaultScreen] = useState('Order Entry');
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState('Active');

  // UI Feedback
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        showToast('Failed to load users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setDisplayName('');
    setPassword('');
    setShowPassword(false);
    setRole('Reception');
    setDefaultScreen('Order Entry');
    setLocationId('');
    setStatus('Active');
    setIsOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setDisplayName(user.displayName);
    setPassword(''); // blank means do not update
    setShowPassword(false);
    setRole(user.role);
    setDefaultScreen(user.defaultScreen || 'Order Entry');
    setLocationId(user.locationId ? user.locationId.toString() : '');
    setStatus(user.status);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim() || !role) {
      showToast('Username, display name, and role are required', 'error');
      return;
    }
    if (!editingUser && !password.trim()) {
      showToast('Password is required for new users', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        username: username.trim(),
        displayName: displayName.trim(),
        role,
        defaultScreen,
        locationId: locationId ? parseInt(locationId) : null,
        status
      };

      if (password.trim() !== '') {
        payload.password = password.trim();
      }

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingUser ? 'User updated successfully' : 'User created successfully', 'success');
        setIsOpen(false);
        fetchUsers();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to save user', 'error');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showToast('Error saving user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, uName: string) => {
    const currentUserId = (session?.user as any)?.id;
    if (currentUserId && id.toString() === currentUserId.toString()) {
      showToast('You cannot delete yourself', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete the user "${uName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('User deleted successfully', 'success');
        fetchUsers();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Error deleting user', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (uRole: string) => {
    switch (uRole) {
      case 'Owner':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '13px', fontWeight: '600' }}>
            <ShieldAlert size={14} /> Owner
          </span>
        );
      case 'Reception':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '13px', fontWeight: '600' }}>
            <ShieldCheck size={14} /> Reception
          </span>
        );
      case 'LabEntry':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '13px', fontWeight: '600' }}>
            <Shield size={14} /> Lab Entry
          </span>
        );
      default:
        return <span style={{ fontWeight: '500' }}>{uRole}</span>;
    }
  };

  if (session?.user && (session.user as any).role !== 'Owner') {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', fontSize: 24, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to view the User Management module.</p>
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
          User Management
        </h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Manage lab technicians, reception staff, owners, locations, and default panels.
        </p>
      </div>

      {/* Main card */}
      <div className="card">
        {/* Card Header */}
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', borderRadius: '10px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleOpenAdd}
            style={{ borderRadius: '10px', fontWeight: '600' }}
          >
            <Plus size={16} /> Add User
          </button>
        </div>

        {/* Card Body */}
        <div className="card-body" style={{ padding: '0px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '32px', height: '32px', margin: '0 auto 12px auto', animation: 'spin 1s linear infinite' }} />
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '16px', fontWeight: '500' }}>No users found</p>
              {searchQuery && <p style={{ fontSize: '14px', marginTop: '4px' }}>Try adjusting your search query.</p>}
            </div>
          ) : (
            <div className="data-table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>Role</th>
                    <th>Assigned Location</th>
                    <th>Default Screen</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{u.username}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{u.displayName}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {u.location ? u.location.name : <span style={{ color: 'var(--text-muted)' }}>Global / All</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{u.defaultScreen || 'Order Entry'}</td>
                      <td>
                        <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: u.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                          color: u.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                          border: `1px solid ${u.status === 'Active' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleDelete(u.id, u.username)}
                            title="Delete User"
                            style={{ color: 'var(--danger)' }}
                            disabled={(session?.user as any)?.id?.toString() === u.id.toString()}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* USER DIALOG MODAL */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit Lab User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                
                {/* Username */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Username *</label>
                  <input
                    type="text"
                    className="form-input required"
                    placeholder="e.g. jdoe"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>

                {/* Display Name */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>Display Name *</label>
                  <input
                    type="text"
                    className="form-input required"
                    placeholder="e.g. John Doe"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: '600' }}>
                    Password {editingUser ? '(leave blank to keep unchanged)' : '*'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${!editingUser ? 'required' : ''}`}
                      placeholder={editingUser ? '••••••••' : 'Enter user password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Role & Status Row */}
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>User Role *</label>
                    <select
                      className="form-input form-select"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                    >
                      <option value="Owner">Owner (Admin)</option>
                      <option value="Reception">Reception</option>
                      <option value="LabEntry">Lab Entry (Technician)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Status</label>
                    <select
                      className="form-input form-select"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="InActive">InActive</option>
                    </select>
                  </div>
                </div>

                {/* Default Screen & Location Row */}
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Default Landing Screen</label>
                    <select
                      className="form-input form-select"
                      value={defaultScreen}
                      onChange={e => setDefaultScreen(e.target.value)}
                    >
                      <option value="Order Entry">Order Entry</option>
                      <option value="In Process">In Process</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '600' }}>Assigned Location</label>
                    <select
                      className="form-input form-select"
                      value={locationId}
                      onChange={e => setLocationId(e.target.value)}
                    >
                      <option value="">Global / All Locations</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsOpen(false)}
                  disabled={submitting}
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ borderRadius: '10px', fontWeight: '600' }}
                >
                  <Save size={16} /> {submitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
