import React from 'react';

interface SingleValueTemplateProps {
  testTemplate: any;
  singleResult: string;
  setSingleResult: (val: string) => void;
  selectedBill: any;
}

export default function SingleValueTemplate({ testTemplate, singleResult, setSingleResult, selectedBill }: SingleValueTemplateProps) {
  if (testTemplate?.uiType !== 'single') return null;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', background: 'linear-gradient(to right, #dcfce7, #fff)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>🔢 Single Value Entry</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '25%' }}>Component</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '20%' }}>Results</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '10%' }}>Abnormal</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '25%' }}>Range</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '10%' }}>Units</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{testTemplate.components?.[0]?.name || testTemplate.testName}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <input
                  type={testTemplate.components?.[0]?.fieldType === 'number' ? 'number' : 'text'}
                  style={{ width: '100%', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontWeight: 700, textAlign: 'center', outline: 'none', background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  value={singleResult || ''}
                  onChange={e => setSingleResult(e.target.value)}
                  onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={false} // Assuming single values might not have the abnormal toggle implemented yet, keeping UI consistent
                  readOnly
                  style={{ width: 16, height: 16, cursor: 'not-allowed', opacity: 0.5 }}
                  title="Not available for single values currently"
                />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <div style={{ width: '100%', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#475569', background: '#f8fafc', fontWeight: 500 }}>
                  {(() => {
                    const comp = testTemplate.components?.[0];
                    if (!comp) return '-';
                    const gender = selectedBill?.patientObj?.gender;
                    if (gender === 'M' && comp.minMale != null && comp.maxMale != null) return `${comp.minMale} - ${comp.maxMale}`;
                    if (gender === 'F' && comp.minFemale != null && comp.maxFemale != null) return `${comp.minFemale} - ${comp.maxFemale}`;
                    return comp.normalRange || '-';
                  })()}
                </div>
              </td>
              <td style={{ padding: '6px 8px' }}>
                <div style={{ width: '100%', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#475569', background: '#f8fafc', fontWeight: 500, textAlign: 'center' }}>
                  {testTemplate.components?.[0]?.unit || '-'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
