import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../api';
import { CATEGORIES, CAT_ICONS } from '../utils';

export default function NewSession() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: 'Study', notes: '' });
  const [customCatInput, setCustomCatInput] = useState('');
  const [showCustomCat, setShowCustomCat]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Please enter a session title.'); return; }
    setLoading(true); setError('');
    try {
      const res = await createSession(form);
      navigate(`/session/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">New Session</h1>
        <p className="page-subtitle">Define your focus, then lock in.</p>
      </div>

      {error && <div className="alert alert-error"><span className="mi mi-sm">warning</span> {error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">What are you focusing on?</label>
            <input
              className="form-input"
              name="title"
              placeholder="e.g. Chapter 5 — Organic Chemistry"
              value={form.title}
              onChange={handleChange}
              autoFocus
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <div className="category-grid">
              {[...CATEGORIES, '__custom__'].map((cat) => {
                const isCustom = cat === '__custom__';
                const isActive = isCustom ? showCustomCat : form.category === cat && !showCustomCat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (isCustom) { setShowCustomCat(true); }
                      else { setShowCustomCat(false); setForm(f => ({ ...f, category: cat })); }
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius2)',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                      background: isActive ? 'var(--accent-glow2)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text2)',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.83rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span className="mi mi-sm">{isCustom ? 'add' : CAT_ICONS[cat]}</span>
                    {isCustom ? 'Custom' : cat}
                  </button>
                );
              })}
            </div>
            {showCustomCat && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  className="form-input"
                  placeholder="Enter your category name..."
                  value={customCatInput}
                  onChange={e => setCustomCatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customCatInput.trim()) {
                      setForm(f => ({ ...f, category: customCatInput.trim() }));
                      setShowCustomCat(false);
                      setCustomCatInput('');
                    }
                  }}
                  autoFocus
                />
                <button type="button" className="btn btn-primary"
                  disabled={!customCatInput.trim()}
                  onClick={() => {
                    if (customCatInput.trim()) {
                      setForm(f => ({ ...f, category: customCatInput.trim() }));
                      setShowCustomCat(false);
                      setCustomCatInput('');
                    }
                  }}>
                  <span className="mi mi-sm">check</span>
                </button>
                <button type="button" className="btn btn-ghost"
                  onClick={() => { setShowCustomCat(false); setCustomCatInput(''); }}>
                  <span className="mi mi-sm">close</span>
                </button>
              </div>
            )}
            {form.category && !CATEGORIES.includes(form.category) && !showCustomCat && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--accent-glow2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>label</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>Custom: </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>{form.category}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, category: 'Study' }))}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'Material Icons Round', fontSize: 16 }}>close</button>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-textarea"
              name="notes"
              placeholder="Goals for this session, topics to cover..."
              value={form.notes}
              onChange={handleChange}
              maxLength={500}
            />
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn btn-success btn-lg" style={{ flex: 1 }} disabled={loading}>
            <span className="mi">play_arrow</span>
            {loading ? 'Starting...' : 'Start Session'}
          </button>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
