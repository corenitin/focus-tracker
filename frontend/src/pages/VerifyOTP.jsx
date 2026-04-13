import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const email    = sessionStorage.getItem('resetEmail') || '';
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Redirect if no email in session
  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  // Countdown timer after resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index, value) => {
    // Allow only digits
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) { setError('Please enter all 6 digits.'); return; }
    setError(''); setLoading(true);
    try {
      await axios.post(`${API}/auth/verify-otp`, { email, otp: otpString });
      navigate('/reset-password');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code. Try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true); setError(''); setResent(false);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setResent(true);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-dot" />
          FocusTracker
        </div>

        <h2 className="auth-title">Enter Reset Code</h2>
        <p className="auth-subtitle">
          We sent a 6-digit code to{' '}
          <strong style={{ color: 'var(--text)' }}>{email}</strong>
        </p>

        {error && (
          <div className="alert alert-error">
            <span className="mi mi-sm">warning</span> {error}
          </div>
        )}

        {resent && (
          <div className="alert alert-success">
            <span className="mi mi-sm">check_circle</span> New code sent! Check your inbox.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* OTP digit boxes */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                autoFocus={index === 0}
                style={{
                  width: 48, height: 58,
                  textAlign: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  background: 'var(--bg2)',
                  border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 12,
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: digit ? '0 0 0 3px var(--accent-glow)' : 'none',
                  caretColor: 'transparent',
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || otp.join('').length !== 6}
          >
            <span className="mi mi-sm">{loading ? 'hourglass_empty' : 'verified'}</span>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {/* Resend section */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          {countdown > 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
              Resend code in <strong style={{ color: 'var(--text2)' }}>{countdown}s</strong>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent)', fontSize: '0.875rem',
                fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                textDecoration: 'underline',
              }}
            >
              {resending ? 'Sending...' : "Didn't get it? Resend code"}
            </button>
          )}
        </div>

        <p className="auth-switch" style={{ marginTop: 16 }}>
          <Link to="/forgot-password" className="auth-link" style={{ color: 'var(--text2)' }}>
            ← Use a different email
          </Link>
        </p>
      </div>
    </div>
  );
}
