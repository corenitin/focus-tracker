import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || '/api';

export default function ResetPassword() {
  const navigate      = useNavigate();
  const { login: authLogin } = useAuth();
  const email         = sessionStorage.getItem('resetEmail') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass]   = useState({ password: false, confirm: false });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Password strength checker
  const strength = (() => {
    const p = form.password;
    if (!p) return { level: 0, label: '', color: 'var(--border)' };
    let score = 0;
    if (p.length >= 6)  score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: 1, label: 'Weak',   color: 'var(--red)' };
    if (score <= 3) return { level: 2, label: 'Fair',   color: 'var(--yellow)' };
    if (score <= 4) return { level: 3, label: 'Good',   color: 'var(--accent)' };
    return              { level: 4, label: 'Strong', color: 'var(--green)' };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/reset-password`, {
        email,
        password: form.password,
        confirmPassword: form.confirm,
      });
      // Auto-login with returned token
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        sessionStorage.removeItem('resetEmail');
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeBtn = ({ field }) => (
    <button
      type="button"
      onClick={() => setShowPass(s => ({ ...s, [field]: !s[field] }))}
      style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
        fontFamily: 'Material Icons Round', fontSize: 20, display: 'flex', alignItems: 'center',
      }}
    >
      {showPass[field] ? 'visibility_off' : 'visibility'}
    </button>
  );

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 className="auth-title">Password Reset!</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Your password has been updated successfully. Signing you in...
          </p>
          <div className="spinner" style={{ margin: '24px auto 0' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-dot" />
          FocusTracker
        </div>

        <h2 className="auth-title">Set New Password</h2>
        <p className="auth-subtitle">
          Choose a strong password for your account.
        </p>

        {error && (
          <div className="alert alert-error">
            <span className="mi mi-sm">warning</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPass.password ? 'text' : 'password'}
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoFocus
                style={{ paddingRight: 44 }}
              />
              <EyeBtn field="password" />
            </div>
            {/* Strength bar */}
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength.level ? strength.color : 'var(--border)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600 }}>
                  {strength.label}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPass.confirm ? 'text' : 'password'}
                name="confirm"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={handleChange}
                required
                style={{ paddingRight: 44 }}
              />
              <EyeBtn field="confirm" />
            </div>
            {form.confirm && form.password !== form.confirm && (
              <div style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: 5 }}>
                ⚠ Passwords don't match
              </div>
            )}
            {form.confirm && form.password === form.confirm && form.confirm.length >= 6 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: 5 }}>
                ✓ Passwords match
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-success btn-full"
            disabled={loading || form.password !== form.confirm || form.password.length < 6}
          >
            <span className="mi mi-sm">{loading ? 'hourglass_empty' : 'lock_reset'}</span>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-switch" style={{ marginTop: 16 }}>
          <Link to="/login" className="auth-link" style={{ color: 'var(--text2)' }}>
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
