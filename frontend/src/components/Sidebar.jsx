import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  { to: '/',          icon: 'dashboard',  label: 'Dashboard',   end: true },
  { to: '/analytics', icon: 'insights',   label: 'Analytics' },
  { to: '/history',   icon: 'history',    label: 'History' },
  { to: '/pomodoro',  icon: 'timer',      label: 'Focus Timer' },
  { to: '/new',       icon: 'add_circle', label: 'New Session', highlight: true },
];

// Reusable inner content — used by both desktop sidebar and mobile drawer
function SidebarContent({ onClose, user, theme, toggleTheme, handleLogout }) {
  return (
    <div className="sidebar-inner">
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section-label">Menu</div>
        {NAV_LINKS.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${l.highlight ? 'highlight' : ''}`
            }>
            <span className="mi sidebar-link-icon">{l.icon}</span>
            <span className="sidebar-link-label">{l.label}</span>
            {l.highlight && <span className="sidebar-link-badge">+</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <div className="sidebar-bottom">
        <button className="sidebar-theme-btn" onClick={toggleTheme}>
          <span className="mi sidebar-link-icon">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          <span className="sidebar-link-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
          <button className="sidebar-logout-btn"
            onClick={() => { handleLogout(); if (onClose) onClose(); }}
            title="Logout">
            <span className="mi" style={{ fontSize: 18 }}>logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const close = () => setMobileOpen(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        {/* Brand shown only on desktop sidebar */}
        <div className="sidebar-brand">
          <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
            <span className="brand-dot" />
            <span className="sidebar-logo-text">FocusTracker</span>
          </Link>
        </div>
        <SidebarContent onClose={null} user={user} theme={theme} toggleTheme={toggleTheme} handleLogout={handleLogout} />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="mobile-topbar">
        <button className="mobile-hamburger" onClick={() => setMobileOpen(true)}>
          <span className="mi">menu</span>
        </button>
        {/* Single logo in topbar */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="brand-dot" style={{ width: 8, height: 8 }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>FocusTracker</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </button>
          <Link to="/new" className="nav-cta" style={{ padding: '7px 12px' }}>
            <span className="mi" style={{ fontSize: 18 }}>add</span>
          </Link>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && <div className="mobile-overlay" onClick={close} />}

      {/* ── Mobile drawer — NO SidebarContent header duplication ── */}
      <aside className={`sidebar mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        {/* Drawer header with brand + close */}
        <div className="drawer-header">
          <div className="sidebar-logo">
            <span className="brand-dot" />
            <span className="sidebar-logo-text">FocusTracker</span>
          </div>
          <button className="drawer-close" onClick={close}>
            <span className="mi">close</span>
          </button>
        </div>
        <SidebarContent onClose={close} user={user} theme={theme} toggleTheme={toggleTheme} handleLogout={handleLogout} />
      </aside>
    </>
  );
}
