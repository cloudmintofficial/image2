'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError('Invalid username or password');
    } else {
      router.push('/order-entry');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--primary-gradient)',
          padding: '32px 32px 28px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            backdropFilter: 'blur(10px)',
          }}>
            <FileText size={32} color="white" />
          </div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0 }}>Medfile Labs</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>
            Laboratory Information Management System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ padding: 32 }}>
          {error && (
            <div style={{
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              marginBottom: 20,
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

          {/* Demo credentials hint */}
          <div style={{
            marginTop: 24,
            padding: 14,
            background: 'var(--info-light)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}>
            <strong style={{ color: 'var(--info)' }}>Demo Credentials:</strong><br />
            Admin: Imagee owner / gagan1112<br />
            Reception: IMAGEERAJANI / 123456<br />
            Lab: Imageemallesh / 2016143
          </div>
        </form>
      </div>
    </div>
  );
}
