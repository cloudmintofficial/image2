import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface RichTextTemplateProps {
  testTemplate: any;
  richTextTab: 'report' | 'templates';
  setRichTextTab: (tab: 'report' | 'templates') => void;
  resultInput: string;
  setResultInput: (val: string) => void;
}

export default function RichTextTemplate({ testTemplate, richTextTab, setRichTextTab, resultInput, setResultInput }: RichTextTemplateProps) {
  if (testTemplate && testTemplate.uiType !== 'richtext') return null;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', gap: 8 }}>
        <div
          onClick={() => setRichTextTab('report')}
          style={{ padding: '6px 16px', background: richTextTab === 'report' ? '#e67e22' : '#bdc3c7', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>
          Page 1
        </div>
        <div
          style={{ padding: '6px 16px', background: '#bdc3c7', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>
          Page 2
        </div>
        <div
          onClick={() => setRichTextTab('templates')}
          style={{ padding: '6px 16px', background: richTextTab === 'templates' ? '#34495e' : '#bdc3c7', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}>
          Templates
        </div>
      </div>
      <div style={{ padding: '24px', minHeight: 450 }}>
        {richTextTab === 'report' ? (
          <>
            <style>{`
        .ql-container { height: 450px; font-family: "Inter", system-ui, sans-serif; font-size: 15px; border: none !important; }
        .ql-toolbar { background: #fff; border-top: none !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #f1f5f9 !important; padding: 12px !important; margin: -24px -24px 24px -24px; }
        .ql-editor { padding: 0; line-height: 1.6; }
        .ql-editor.ql-blank::before { left: 0; font-style: normal; color: #94a3b8; }
      `}</style>
            <ReactQuill
              theme="snow"
              value={resultInput}
              onChange={setResultInput}
              placeholder="Start typing diagnostic observations..."
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                  [{ 'color': [] }, { 'background': [] }],
                  [{ 'align': [] }],
                  ['clean']
                ],
              }}
            />
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: '#475569' }}>Available Templates</h4>

            {testTemplate?.resultTemplate ? (
              <div
                style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                onClick={() => {
                  if (confirm('Applying this template will overwrite your current report. Continue?')) {
                    setResultInput(testTemplate.resultTemplate);
                    setRichTextTab('report');
                  }
                }}
              >
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Default Master Template</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Standard template defined for {testTemplate.testName}</div>
              </div>
            ) : null}

            <div
              style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              onClick={() => {
                if (confirm('Applying this template will overwrite your current report. Continue?')) {
                  setResultInput('<h3>NORMAL STUDY</h3><p>The study reveals no significant abnormality.</p><p><b>IMPRESSION:</b> Normal Study.</p>');
                  setRichTextTab('report');
                }
              }}
            >
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Normal Study (Generic)</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>A simple "Normal Study" layout.</div>
            </div>

            {!testTemplate?.resultTemplate && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                No specific template is assigned to this test in the master database.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
