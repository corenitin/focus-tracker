import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getOverallStats, getDailyStats, getSessions } from '../api';
import { formatDuration, formatDate, formatTime, CAT_ICONS } from '../utils';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function MiniBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...(data || []).map((d) => d.totalDuration), 1);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="chart">
      <div className="chart-bars">
        {data.map((day) => (
          <div className="chart-bar-wrap" key={day.date}>
            <div className="chart-bar-bg">
              <div
                className={`chart-bar-fill ${day.date === today ? 'today' : ''}`}
                style={{ height: `${(day.totalDuration / max) * 100}%` }}
                title={`${day.label}: ${formatDuration(day.totalDuration)}`}
              />
            </div>
            <div className="chart-label">{day.label.split(',')[0].split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, dailyRes, recentRes] = await Promise.all([
        getOverallStats(),
        getDailyStats(7),
        getSessions({ limit: 5 }),
      ]);
      setStats(statsRes.data.data);
      setDaily(dailyRes.data.data);
      setRecent(recentRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading || !stats) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text2)', marginTop: '16px', fontSize: '0.9rem' }}>
        Connecting to server...
      </p>
      <p style={{ color: 'var(--text3)', marginTop: '8px', fontSize: '0.8rem' }}>
        First load may take 30–60 seconds
      </p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Track your focus. Own your time.</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon="⏱️" value={formatDuration(stats?.today?.duration || 0)} label="Today's Focus" color="var(--green)" />
        <StatCard icon="📅" value={formatDuration(stats?.thisWeek?.duration || 0)} label="This Week" color="var(--accent)" />
        <StatCard icon="✅" value={stats?.totalSessions || 0} label="Total Sessions" color="var(--yellow)" />
        <StatCard icon="⚡" value={formatDuration(stats?.avgDuration || 0)} label="Avg Session" color="var(--orange)" />
      </div>

      {/* Charts + Category */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>
            7-Day Focus
          </h3>
          <MiniBarChart data={daily} />
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)' }}>
            By Category
          </h3>
          {stats?.byCategory && stats.byCategory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.byCategory.slice(0, 5).map((cat) => {
                const maxTime = stats?.byCategory?.[0]?.total || 1;
                return (
                  <div key={cat._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {CAT_ICONS[cat._id]} {cat._id}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDuration(cat.total)}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(cat.total / maxTime) * 100}%`, background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>No sessions yet.</p>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Recent Sessions</h2>
        <Link to="/history" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div className="empty-title">No sessions yet</div>
          <div className="empty-desc">Start your first focus session to see it here.</div>
          <br />
          <Link to="/new" className="btn btn-primary">Start a Session</Link>
        </div>
      ) : (
        <div className="sessions-list">
          {recent.map((s) => (
            <div className="session-card" key={s._id}>
              <div className="session-card-left">
                <div className="session-title">{s.title}</div>
                <div className="session-meta">
                  <span className={`session-meta-item cat-${s.category}`}>
                    {CAT_ICONS[s.category]} {s.category}
                  </span>
                  <span className="session-meta-item">📅 {formatDate(s.createdAt)}</span>
                  {s.endTime && <span className="session-meta-item">🕐 {formatTime(s.startTime)}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="session-duration">{formatDuration(s.duration)}</div>
                <span className={`badge badge-${s.status}`}>
                  <span className="badge-dot" />
                  {s.status}
                </span>
                {s.status !== 'completed' && (
                  <Link to={`/session/${s._id}`} className="btn btn-ghost btn-sm">Resume</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
