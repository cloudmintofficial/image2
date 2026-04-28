'use client';

import React from 'react';

const users = [
  { id: 1, username: 'Imagee owner', displayName: 'IMAGEE OWNER', role: 'Owner', status: 'Active' },
  { id: 2, username: 'IMAGEERAJANI', displayName: 'IMAGEERAJANI', role: 'Reception', status: 'Active' },
  { id: 3, username: 'Imageemallesh', displayName: 'imageemallesh', role: 'LabEntry', status: 'Active' },
];

export default function UsersPage() {
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">User Management</h1><p className="page-subtitle">Manage users and roles</p></div>
        <button className="btn btn-primary">+ Add User</button>
      </div>
      <div className="card">
        <div className="data-table-container">
          <table className="data-table">
            <thead><tr><th>Username</th><th>Display Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.username}</td>
                  <td>{u.displayName}</td>
                  <td><span className={`badge ${u.role === 'Owner' ? 'badge-info' : u.role === 'Reception' ? 'badge-success' : 'badge-warning'}`}>{u.role}</span></td>
                  <td><span className="badge badge-success">{u.status}</span></td>
                  <td><button className="btn btn-outline btn-sm">Edit</button> <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>Deactivate</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
