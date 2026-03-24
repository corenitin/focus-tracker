import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoDot} />
          FocusTracker
        </div>
        <h2 style={styles.title}>Create account</h2>
        <p style={styles.subtitle}>Start tracking your focus sessions</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type="password"
              name="confirm"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-success btn-full"
            style={{ marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? '⏳ Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'var(--bg)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '40px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 800,
    fontSize: '1.2rem',
    marginBottom: '32px',
    color: 'var(--text)',
  },
  logoDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 12px var(--accent)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    marginBottom: '6px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text2)',
    fontSize: '0.9rem',
    marginBottom: '28px',
  },
  switchText: {
    textAlign: 'center',
    marginTop: '24px',
    color: 'var(--text2)',
    fontSize: '0.875rem',
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
