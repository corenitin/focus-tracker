import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
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
          <Link to="/new" className="nav-cta">
            ＋ <span>New Session</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
