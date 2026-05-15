'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';

interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
  status: string;
  labId: number;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    displayName: '',
    role: 'Reception',
    status: 'Active',
    labId: 1 // Default to 1 for now, ideally selected or taken from session
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      displayName: '',
      role: 'Reception',
      status: 'Active',
      labId: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Empty password means don't change
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      labId: user.labId
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const payload: any = { ...formData };
      if (editingUser && !payload.password) {
        delete payload.password; // Don't update password if empty
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save user');
      }

      showToast(`User successfully ${editingUser ? 'updated' : 'added'}!`, 'success');
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      showToast(error.message, 'error');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to deactivate user');
      
      showToast('User deactivated successfully', 'success');
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      showToast(error.message, 'error');
    }
  };

  if ((session?.user as any)?.role !== 'Owner') {
    return <div className="p-8 text-center text-red-500">Access Denied. Only Owners can manage users.</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage users and roles</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>+ Add User</button>
      </div>

      <div className="card">
        <div className="data-table-container">
          {loading ? (
            <div className="p-8 text-center">Loading users...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Display Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center">No users found</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className={u.status === 'InActive' ? 'opacity-60' : ''}>
                      <td style={{ fontWeight: 500 }}>{u.username}</td>
                      <td>{u.displayName}</td>
                      <td>
                        <span className={`badge ${u.role === 'Owner' ? 'badge-info' : u.role === 'Reception' ? 'badge-success' : 'badge-warning'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm mr-2" onClick={() => handleOpenEdit(u)}>Edit</button>
                        {u.status === 'Active' && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDeactivate(u.id)}
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      disabled={!!editingUser} // Don't allow changing username
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      required={!editingUser}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Display Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      value={formData.displayName}
                      onChange={e => setFormData({...formData, displayName: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">Role *</label>
                      <select 
                        className="form-input"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option value="Owner">Owner</option>
                        <option value="Reception">Reception</option>
                        <option value="LabEntry">LabEntry</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label">Status *</label>
                      <select 
                        className="form-input"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="Active">Active</option>
                        <option value="InActive">InActive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
