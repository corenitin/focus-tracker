import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      // Pass email to next page via sessionStorage
      sessionStorage.setItem('resetEmail', email);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-dot" />
          FocusTracker
        </div>

        {!sent ? (
          <>
            <h2 className="auth-title">Forgot Password?</h2>
            <p className="auth-subtitle">
              Enter your email and we'll send you a 6-digit reset code.
            </p>

            {error && (
              <div className="alert alert-error">
                <span className="mi mi-sm">warning</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                <span className="mi mi-sm">{loading ? 'hourglass_empty' : 'send'}</span>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        ) : (
          /* ── Success State ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <h2 className="auth-title" style={{ fontSize: '1.3rem' }}>Check your inbox!</h2>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 24 }}>
              We sent a 6-digit code to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
              Check your inbox (and spam folder) and enter the code on the next page.
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate('/verify-otp')}
            >
              <span className="mi mi-sm">arrow_forward</span>
              Enter the Code
            </button>
            <button
              className="btn btn-ghost btn-full"
              style={{ marginTop: 10 }}
              onClick={() => { setSent(false); setEmail(''); }}
            >
              Use a different email
            </button>
          </div>
        )}

        <p className="auth-switch" style={{ marginTop: 20 }}>
          Remember your password?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
