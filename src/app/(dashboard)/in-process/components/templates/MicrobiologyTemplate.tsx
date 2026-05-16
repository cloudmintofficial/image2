import React from 'react';

interface MicrobiologyTemplateProps {
  testTemplate: any;
  microOrganism: string;
  setMicroOrganism: (val: string) => void;
  microGrowth: string;
  setMicroGrowth: (val: string) => void;
  microColonyCount: string;
  setMicroColonyCount: (val: string) => void;
  microSensitivity: Record<string, string>;
  setMicroSensitivity: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function MicrobiologyTemplate({ testTemplate, microOrganism, setMicroOrganism, microGrowth, setMicroGrowth, microColonyCount, setMicroColonyCount, microSensitivity, setMicroSensitivity }: MicrobiologyTemplateProps) {
  if (testTemplate?.uiType !== 'microbiology') return null;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', background: 'linear-gradient(to right, #fef3c7, #fff)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>🦠 Microbiology / Culture Result</h3>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Row 1: Organism + Growth */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Organism Isolated</label>
            <input type="text" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} value={microOrganism} onChange={e => setMicroOrganism(e.target.value)} placeholder="e.g. E. coli, No Growth" onFocus={e => e.currentTarget.style.borderColor = '#f97316'} onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Growth</label>
            <select style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }} value={microGrowth} onChange={e => setMicroGrowth(e.target.value)}>
              <option>No Growth</option>
              <option>Scanty Growth</option>
              <option>Moderate Growth</option>
              <option>Heavy Growth</option>
              <option>Mixed Flora</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Colony Count (CFU/mL)</label>
            <input type="text" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} value={microColonyCount} onChange={e => setMicroColonyCount(e.target.value)} placeholder="e.g. >1,00,000" onFocus={e => e.currentTarget.style.borderColor = '#f97316'} onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
          </div>
        </div>
        {/* Antibiotic Sensitivity Table */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Antibiotic Sensitivity</label>
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>Antibiotic</th>
                  {['Sensitive', 'Intermediate', 'Resistant'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', width: 120 }}>{h[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Amoxicillin', 'Ampicillin', 'Ciprofloxacin', 'Cotrimoxazole', 'Gentamicin', 'Nitrofurantoin', 'Norfloxacin', 'Ceftriaxone', 'Imipenem', 'Piperacillin'].map((drug, i) => (
                  <tr key={drug} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: '#0f172a' }}>{drug}</td>
                    {['Sensitive', 'Intermediate', 'Resistant'].map(opt => (
                      <td key={opt} style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={`drug-${drug}`}
                          checked={microSensitivity[drug] === opt}
                          onChange={() => setMicroSensitivity(prev => ({ ...prev, [drug]: opt }))}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: opt === 'Sensitive' ? '#16a34a' : opt === 'Resistant' ? '#dc2626' : '#f97316' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
