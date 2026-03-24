import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenu] = useState(false);

  const links = [
    { to: '/',          icon: 'dashboard',     label: 'Dashboard',  end: true },
    { to: '/analytics', icon: 'insights',      label: 'Analytics' },
    { to: '/history',   icon: 'history',       label: 'History' },
    { to: '/pomodoro',  icon: 'timer',         label: 'Focus Timer' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-dot" />
          FocusTracker
        </Link>

        {/* Desktop links */}
        <div className="navbar-links" style={{ display: 'flex' }}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="mi mi-sm">{l.icon}</span>
              <span className="nav-label">{l.label}</span>
            </NavLink>
          ))}

          <Link to="/new" className="nav-cta">
            <span className="mi mi-sm">add</span>
            <span className="nav-label">New Session</span>
          </Link>

          <div className="nav-user">
            <span className="mi mi-sm">person</span>
            {user?.name}
          </div>

          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </button>

          <button onClick={logout} className="btn btn-ghost btn-sm" style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className="mi mi-sm">logout</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={() => setMenu(m => !m)}
          style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'Material Icons Round', fontSize: 22 }}>
          {menuOpen ? 'close' : 'menu'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          background: 'var(--navbar-bg)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)', padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              onClick={() => setMenu(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start' }}>
              <span className="mi mi-sm">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
          <Link to="/new" className="nav-cta" onClick={() => setMenu(false)}
            style={{ justifyContent: 'flex-start', marginLeft: 0, marginTop: 4 }}>
            <span className="mi mi-sm">add</span> New Session
          </Link>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button className="theme-toggle" onClick={toggleTheme} style={{ flex: 0 }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </button>
            <button onClick={() => { logout(); setMenu(false); }}
              className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className="mi mi-sm">logout</span> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
