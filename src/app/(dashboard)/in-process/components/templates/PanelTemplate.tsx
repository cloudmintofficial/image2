import React from 'react';

interface PanelTemplateProps {
  testTemplate: any;
  panelResults: Record<string, any>;
  updatePanelField: (name: string, field: string, value: any) => void;
  resultMethod: string;
  selectedBill?: any;
}

export default function PanelTemplate({ testTemplate, panelResults, updatePanelField, resultMethod, selectedBill }: PanelTemplateProps) {
  if (testTemplate?.uiType !== 'panel' || !testTemplate.components || testTemplate.components.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Panel Test Entry</h3>
        <span style={{ fontSize: 12, color: '#64748b' }}>{testTemplate.components.length} parameters</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#dc2626', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', width: 250 }}>Component</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#dc2626', fontSize: 11, textTransform: 'uppercase', width: 150 }}>Results</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#dc2626', fontSize: 11, textTransform: 'uppercase', width: 80 }}>Abnormal</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#dc2626', fontSize: 11, textTransform: 'uppercase', width: 350 }}>Range</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#dc2626', fontSize: 11, textTransform: 'uppercase', width: 120 }}>Units</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#dc2626', fontSize: 11, textTransform: 'uppercase', width: 350 }}>Method</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let lastHeading = '';
              return testTemplate.components.map((comp: any, idx: number) => {
                const showHeading = comp.subHeading && comp.subHeading !== lastHeading;
                if (showHeading) lastHeading = comp.subHeading;

                const resObj = panelResults[comp.name] || {};
                const val = resObj.value || '';
                const manualAbnormal = resObj.abnormal ?? false;

                const isAbnormal = manualAbnormal;

                let calculatedRange = comp.normalRange ?? '—';
                if (selectedBill?.patientObj?.gender === 'M' && comp.minMale != null && comp.maxMale != null) {
                  calculatedRange = `${comp.minMale} - ${comp.maxMale}`;
                } else if (selectedBill?.patientObj?.gender === 'F' && comp.minFemale != null && comp.maxFemale != null) {
                  calculatedRange = `${comp.minFemale} - ${comp.maxFemale}`;
                }

                const currentRange = resObj.range ?? calculatedRange;
                const currentUnit = resObj.unit ?? comp.unit ?? '—';
                const currentMethod = resObj.method ?? comp.method ?? resultMethod ?? '—';

                const currentRangeStr = String(currentRange || '');
                const rangeLines = currentRangeStr.split('\n').length;
                const textareaRows = Math.max(3, rangeLines);

                return (
                  <React.Fragment key={idx}>
                    {showHeading && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={6} style={{ padding: '8px 16px', fontWeight: 800, color: '#0f172a', textDecoration: 'underline', fontSize: 12, textTransform: 'uppercase' }}>
                          {comp.subHeading}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1px solid #f1f5f9', background: isAbnormal ? '#fef2f2' : 'transparent' }}>
                      <td style={{ paddingTop: 10, paddingBottom: 10, paddingRight: 16, fontWeight: 600, color: '#0f172a', paddingLeft: comp.subHeading ? 32 : 16 }}>{comp.name}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <input
                          type={comp.fieldType === 'number' ? 'number' : 'text'}
                          style={{ width: '100%', padding: '6px 12px', border: `1px solid ${isAbnormal ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, fontSize: 13, fontWeight: 700, textAlign: 'center', outline: 'none', background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                          value={val}
                          onChange={e => updatePanelField(comp.name, 'value', e.target.value)}
                          onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.1)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = isAbnormal ? '#dc2626' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isAbnormal}
                          onChange={e => updatePanelField(comp.name, 'abnormal', e.target.checked)}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#f97316' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <textarea
                          rows={textareaRows}
                          style={{ width: '100%', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#fff', fontWeight: 500, resize: 'vertical', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                          value={currentRange}
                          onChange={e => updatePanelField(comp.name, 'range', e.target.value)}
                          onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.1)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          style={{ width: '100%', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#fff', fontWeight: 500, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                          value={currentUnit}
                          onChange={e => updatePanelField(comp.name, 'unit', e.target.value)}
                          onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.1)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          style={{ width: '100%', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#fff', fontWeight: 500, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                          value={currentMethod}
                          onChange={e => updatePanelField(comp.name, 'method', e.target.value)}
                          onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.1)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
