const fs = require('fs');
const file = 'src/app/(dashboard)/order-entry/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix advSearchState
content = content.replace(
  "const [advSearchState, setAdvSearchState] = useState({ billNo: '', patientName: '', umr: '', phone: '' });",
  "const [advSearchState, setAdvSearchState] = useState({ patientName: '', umr: '', phone: '', age: '', gender: '', doctor: '', source: '' });\n  const [advSearchSelectedIndex, setAdvSearchSelectedIndex] = useState(-1);"
);

// 2. Add Ctrl+K Listener
content = content.replace(
  "const today = new Date().toLocaleDateString('en-GB');",
  "const today = new Date().toLocaleDateString('en-GB');\n\n  useEffect(() => {\n    const handleKeyDown = (e: KeyboardEvent) => {\n      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {\n        e.preventDefault();\n        setShowAdvSearch(true);\n      }\n    };\n    window.addEventListener('keydown', handleKeyDown);\n    return () => window.removeEventListener('keydown', handleKeyDown);\n  }, []);"
);

// 3. Fix handleAdvSearch and add handleCreatePatient
content = content.replace(
  /const handleAdvSearch = async \(\) => \{[\s\S]*?showToast\('Search failed', 'error'\);\n      \}\n    \} finally \{\n      setIsSearching\(false\);\n    \}\n  \};/,
  `const handleAdvSearch = async () => {
    setIsSearching(true);
    setAdvSearchSelectedIndex(-1);
    try {
      const res = await fetch(\`/api/patients/advanced-search\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: advSearchState.patientName,
          umr: advSearchState.umr,
          phone: advSearchState.phone,
          ageRange: advSearchState.age,
          gender: advSearchState.gender,
          doctor: advSearchState.doctor,
          source: advSearchState.source
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAdvSearchResults(data);
      } else {
        showToast('Search failed', 'error');
      }
    } catch (e) {
      showToast('Error searching', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreatePatient = async () => {
    setIsSearching(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: advSearchState.patientName || 'New Patient', 
          phone: advSearchState.phone || '',
          gender: advSearchState.gender || 'M',
        })
      });
      if (res.ok) {
        const p = await res.json();
        handleSelectPatient(p);
        setShowAdvSearch(false);
        setShowAddlDetails(true);
        showToast('Patient created! Please fill out additional details.', 'success');
      }
    } finally {
      setIsSearching(false);
    }
  };`
);

// 4. Delete the "Advance Search Panel" and the messy inputs.
const uiStartStr = `<div style={{ display: 'flex', gap: 24 }}>`;
const orderSectionStr = `{/* Order Section */}`;
const cleanUI = `<div style={{ display: 'flex', gap: 24 }}>
        {/* Main Form */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Patient Info Card */}
          <div className={\`card \${patientId ? 'patient-card-selected slide-in-right glow-highlight' : ''}\`} style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Patient Information</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {patientId && (
                  <button className="btn btn-success btn-sm" onClick={async () => {
                    setIsLoadingPatOrders(true);
                    showToast('Loading history...', 'info');
                    try {
                      const res = await fetch(\`/api/patients/\${patientId}/orders\`);
                      if (res.ok) {
                        const data = await res.json();
                        setPastOrders(data);
                        setShowPatOrders(true);
                      } else {
                        showToast('Failed to load patient history', 'error');
                      }
                    } finally {
                      setIsLoadingPatOrders(false);
                    }
                  }} disabled={isLoadingPatOrders}>
                    {isLoadingPatOrders ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Pat Orders
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {!patientId ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                  <div style={{ padding: 16, background: 'rgba(234,88,12,0.1)', borderRadius: '50%', color: 'var(--primary)', marginBottom: 16 }}>
                    <Search size={32} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: 'var(--text-primary)' }}>No Patient Selected</h3>
                  <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', textAlign: 'center' }}>Search for an existing patient or create a new one to start an order.</p>
                  <button className="btn btn-primary" onClick={() => setShowAdvSearch(true)} style={{ padding: '10px 24px', fontSize: 15 }}>
                    <Search size={16} /> Search / Select Patient (Ctrl + K)
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 24, padding: 20, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'var(--primary-gradient)' }}></div>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Patient Name</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>UMR / Phone</div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{phoneUmr} {phoneUmr && phone ? '•' : ''} {phone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Age / Gender</div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{age ? \`\${age} Yrs\` : '--'} • {gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : '--'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Source</div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{source || '--'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowAdvSearch(true)}>Change Patient</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowAddlDetails(true)}>Edit Details</button>
                  </div>
                </div>
              )}

              {patientId && (
                <div className="form-row form-row-1" style={{ marginTop: 24 }}>
                  <div className="form-group">
                    <label className="form-label">Referring Doctor</label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-input" placeholder="Referring doctor" list="doctor-list" value={doctor} onChange={e => setDoctor(e.target.value)} style={{ paddingRight: 32 }} />
                      {isSearchingDoctorsDropdown && (
                        <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <datalist id="doctor-list">
                      {doctorSuggestions.map((doc, idx) => (
                        <option key={idx} value={doc.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}
            </div>
          </div>

          `;

const startIndex = content.indexOf(uiStartStr);
const endIndex = content.indexOf(orderSectionStr);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + cleanUI + content.substring(endIndex);
}

// 5. Inject Advanced Search Modal
const modalCode = `
      {/* Advanced Search Modal */}
      {showAdvSearch && (
        <div className="modal-overlay" onClick={() => setShowAdvSearch(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }} onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setAdvSearchSelectedIndex(prev => Math.min(prev + 1, advSearchResults.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setAdvSearchSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
              if (advSearchSelectedIndex >= 0 && advSearchSelectedIndex < advSearchResults.length) {
                e.preventDefault();
                handleSelectPatient(advSearchResults[advSearchSelectedIndex]);
                setShowAdvSearch(false);
              }
            }
          }} tabIndex={0}>
            <div className="modal-header">
              <h3>Advanced Patient Search</h3>
              <button className="modal-close" onClick={() => setShowAdvSearch(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="form-row form-row-4" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input autoFocus className="form-input" placeholder="Search by phone" value={advSearchState.phone} onChange={e => setAdvSearchState({...advSearchState, phone: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} />
                </div>
                <div className="form-group">
                  <label className="form-label">UMR</label>
                  <input className="form-input" placeholder="Search by UMR" value={advSearchState.umr} onChange={e => setAdvSearchState({...advSearchState, umr: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Patient Name</label>
                  <input className="form-input" placeholder="Search by name" value={advSearchState.patientName} onChange={e => setAdvSearchState({...advSearchState, patientName: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} />
                </div>
              </div>

              <div className="form-row form-row-4" style={{ marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" placeholder="Age" value={advSearchState.age} onChange={e => setAdvSearchState({...advSearchState, age: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAdvSearch()} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={advSearchState.gender} onChange={e => setAdvSearchState({...advSearchState, gender: e.target.value})}>
                    <option value="">Any</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Referred Doctor</label>
                  <input className="form-input" placeholder="Search by doctor" value={advSearchState.doctor} onChange={e => setAdvSearchState({...advSearchState, doctor: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <input className="form-input" placeholder="Search by source" value={advSearchState.source} onChange={e => setAdvSearchState({...advSearchState, source: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
                <button className="btn btn-primary" onClick={handleAdvSearch} style={{ minWidth: 160 }} disabled={isSearching}>
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search Patients
                </button>
                <button className="btn btn-outline" onClick={() => {
                  setAdvSearchState({ patientName: '', umr: '', phone: '', age: '', gender: '', doctor: '', source: '' });
                  setAdvSearchResults([]);
                }}>Reset</button>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Search Results ({advSearchResults.length})</h4>
                  <button className="btn btn-outline btn-sm" onClick={handleCreatePatient}>
                    <UserPlus size={14} /> + Add New Patient
                  </button>
                </div>

                {advSearchResults.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    No patients found. Use the filters above or click "+ Add New Patient".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {advSearchResults.map((p, idx) => (
                      <div key={idx} onClick={() => { handleSelectPatient(p); setShowAdvSearch(false); }} onDoubleClick={() => { handleSelectPatient(p); setShowAdvSearch(false); }} className="adv-search-result-item" style={{ padding: 16, border: advSearchSelectedIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: advSearchSelectedIndex === idx ? 'var(--primary-light)' : 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{p.name} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>{p.umr}</span></div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {p.phone || 'No phone'} • {p.age ? \`\${p.age}y\` : '--'} • {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : '--'}
                          </div>
                        </div>
                        <div>
                          <button className="btn btn-ghost btn-sm">Select</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace("    </div>\n  );\n}", modalCode + "\n    </div>\n  );\n}");

// 6. Delete old top search buttons
content = content.replace(
  /<div style=\{\{ display: 'flex', gap: 8 \}\}>\n\s*<button className="btn btn-outline btn-sm" onClick=\{\(\) => setShowAdvSearch\(!showAdvSearch\)\}>\n\s*<Search size=\{14\} \/> Advance Search\n\s*<\/button>\n\s*<button className="btn btn-outline btn-sm" onClick=\{handleClear\}>Clear<\/button>\n\s*<button className="btn btn-primary btn-sm"[\s\S]*?<\/button>\n\s*<\/div>/g,
  `<div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={handleClear}>Clear Form</button>
        </div>`
);

fs.writeFileSync(file, content);
