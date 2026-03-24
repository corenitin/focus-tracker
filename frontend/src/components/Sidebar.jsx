import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  { to: '/',          icon: 'dashboard',        label: 'Dashboard',    end: true },
  { to: '/analytics', icon: 'insights',         label: 'Analytics' },
  { to: '/history',   icon: 'history',          label: 'History' },
  { to: '/pomodoro',  icon: 'timer',            label: 'Focus Timer' },
  { to: '/new',       icon: 'add_circle',       label: 'New Session',  highlight: true },
];

export default function Sidebar() {
  const { user, logout }    = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate             = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = ({ onClose }) => (
    <div className="sidebar-inner">
      {/* Brand */}
      <div className="sidebar-brand">
        <Link to="/" className="sidebar-logo" onClick={onClose}>
          <span className="brand-dot" />
          <span className="sidebar-logo-text">FocusTracker</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section-label">Menu</div>
        {NAV_LINKS.map(l => (
          <NavLink
            key={l.to} to={l.to} end={l.end}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${l.highlight ? 'highlight' : ''}`
            }
          >
            <span className="mi sidebar-link-icon">{l.icon}</span>
            <span className="sidebar-link-label">{l.label}</span>
            {l.highlight && <span className="sidebar-link-badge">+</span>}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom section */}
      <div className="sidebar-bottom">
        {/* Theme toggle */}
        <button className="sidebar-theme-btn" onClick={toggleTheme}>
          <span className="mi sidebar-link-icon">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
          <span className="sidebar-link-label">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={() => { handleLogout(); if (onClose) onClose(); }} title="Logout">
            <span className="mi" style={{ fontSize: 18 }}>logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        <SidebarContent onClose={null} />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="mobile-topbar">
        <button className="mobile-hamburger" onClick={() => setMobileOpen(true)}>
          <span className="mi">menu</span>
        </button>
        <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
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

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Mobile drawer ── */}
      <aside className={`sidebar mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="sidebar-logo">
            <span className="brand-dot" />
            <span className="sidebar-logo-text">FocusTracker</span>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'Material Icons Round', fontSize: 22, display: 'flex', alignItems: 'center' }}>
            close
          </button>
        </div>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
