import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function OAuthSuccess() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    const err   = params.get('error');

    if (err) {
      setError('Sign-in failed. Please try again.');
      setTimeout(() => navigate('/login'), 2500);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Small delay so AuthContext can pick up the token
      setTimeout(() => navigate('/'), 300);
    } else {
      navigate('/login');
    }
  }, [params, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', flexDirection: 'column', gap: 16,
    }}>
      {error ? (
        <>
          <div style={{ fontSize: 48 }}>❌</div>
          <p style={{ color: 'var(--red)', fontSize: '1rem', fontWeight: 600 }}>{error}</p>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Redirecting to login...</p>
        </>
      ) : (
        <>
          <div className="spinner" />
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Signing you in...</p>
        </>
      )}
    </div>
  );
}
