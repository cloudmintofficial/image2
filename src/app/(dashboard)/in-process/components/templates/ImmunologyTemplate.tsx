import React from 'react';

interface ImmunologyTemplateProps {
  testTemplate: any;
  immunoResult: string;
  setImmunoResult: (val: string) => void;
  immunoMethod: string;
  setImmunoMethod: (val: string) => void;
  immunoTiter: string;
  setImmunoTiter: (val: string) => void;
}

export default function ImmunologyTemplate({ testTemplate, immunoResult, setImmunoResult, immunoMethod, setImmunoMethod, immunoTiter, setImmunoTiter }: ImmunologyTemplateProps) {
  if (testTemplate?.uiType !== 'immunology') return null;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>🧠 Immunology / Serology Result</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Result</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Positive', 'Negative', 'Equivocal'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setImmunoResult(opt)}
                style={{
                  flex: 1, padding: '14px 8px', borderRadius: 10, border: '2px solid',
                  borderColor: immunoResult === opt ? (opt === 'Positive' ? '#dc2626' : opt === 'Negative' ? '#16a34a' : '#f97316') : '#e2e8f0',
                  background: immunoResult === opt ? (opt === 'Positive' ? '#fef2f2' : opt === 'Negative' ? '#f0fdf4' : '#fff7ed') : '#fff',
                  color: immunoResult === opt ? (opt === 'Positive' ? '#dc2626' : opt === 'Negative' ? '#16a34a' : '#f97316') : '#94a3b8',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {opt === 'Positive' ? '🔴' : opt === 'Negative' ? '🟢' : '🟡'} {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Method</label>
          <select style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }} value={immunoMethod} onChange={e => setImmunoMethod(e.target.value)}>
            <option value="">Select Method</option>
            <option>ELISA</option>
            <option>Rapid ICT</option>
            <option>Chemiluminescence</option>
            <option>Agglutination</option>
            <option>PCR</option>
            <option>Western Blot</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Titer / Value</label>
          <input type="text" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} value={immunoTiter || ''} onChange={e => setImmunoTiter(e.target.value)} placeholder="e.g. 1:320 or 4.5 S/CO" onFocus={e => e.currentTarget.style.borderColor = '#f97316'} onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
        </div>
      </div>
    </div>
  );
}
