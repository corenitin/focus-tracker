import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-dot" />
          FocusTracker
        </Link>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>📊</span><span>Dashboard</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span>📋</span><span>History</span>
          </NavLink>
          <Link to="/new" className="nav-cta">＋ <span>New Session</span></Link>
          <span style={{ marginLeft: '8px', color: 'var(--text3)', fontSize: '0.82rem', fontWeight: 600 }}>
            👤 {user?.name}
          </span>
          <button onClick={logout} className="btn btn-ghost btn-sm" style={{ marginLeft: '4px' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
