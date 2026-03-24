import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-dot" />
          FocusTracker
        </Link>

        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="mi mi-sm">dashboard</span>
            <span className="nav-label">Dashboard</span>
          </NavLink>

          <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="mi mi-sm">history</span>
            <span className="nav-label">History</span>
          </NavLink>

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

          <button onClick={logout} className="btn btn-ghost btn-sm" style={{ marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="mi mi-sm">logout</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
