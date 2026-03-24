import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../api';
import { CATEGORIES, CAT_ICONS } from '../utils';

export default function NewSession() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: 'Study', notes: '' });
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
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius2)',
                    border: `1px solid ${form.category === cat ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.category === cat ? 'var(--accent-glow2)' : 'transparent',
                    color: form.category === cat ? 'var(--accent)' : 'var(--text2)',
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
                  <span className="mi mi-sm">{CAT_ICONS[cat]}</span> {cat}
                </button>
              ))}
            </div>
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
