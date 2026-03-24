import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getOverallStats, getDailyStats, getSessions } from '../api';
import { formatDuration, formatDate, formatTime, CAT_ICONS } from '../utils';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-icon">
        <span className="mi mi-lg">{icon}</span>
      </div>
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
      <p style={{ color: 'var(--text2)', marginTop: '16px', fontSize: '0.9rem' }}>Loading your stats...</p>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Track your focus. Own your time.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="today"        value={formatDuration(stats?.today?.duration || 0)}    label="Today's Focus"  color="var(--green)" />
        <StatCard icon="date_range"   value={formatDuration(stats?.thisWeek?.duration || 0)} label="This Week"      color="var(--accent)" />
        <StatCard icon="check_circle" value={stats?.totalSessions || 0}                      label="Total Sessions" color="var(--yellow)" />
        <StatCard icon="bolt"         value={formatDuration(stats?.avgDuration || 0)}         label="Avg Session"    color="var(--orange)" />
      </div>

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text2)' }}>
            7-Day Focus
          </h3>
          <MiniBarChart data={daily} />
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text2)' }}>
            By Category
          </h3>
          {stats?.byCategory && stats.byCategory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.byCategory.slice(0, 5).map((cat) => {
                const maxTime = stats?.byCategory?.[0]?.total || 1;
                return (
                  <div key={cat._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`mi mi-sm cat-${cat._id}`}>{CAT_ICONS[cat._id]}</span>
                        {cat._id}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDuration(cat.total)}
                      </span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(cat.total / maxTime) * 100}%`, background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Recent Sessions</h2>
        <Link to="/history" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          View all <span className="mi mi-sm">arrow_forward</span>
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><span className="mi mi-xl">track_changes</span></div>
          <div className="empty-title">No sessions yet</div>
          <div className="empty-desc">Start your first focus session to see it here.</div>
          <br />
          <Link to="/new" className="btn btn-primary" style={{ marginTop: '8px' }}>
            <span className="mi mi-sm">add</span> Start a Session
          </Link>
        </div>
      ) : (
        <div className="sessions-list">
          {recent.map((s) => (
            <div className="session-card" key={s._id}>
              <div className="session-card-left">
                <div className="session-title">{s.title}</div>
                <div className="session-meta">
                  <span className={`session-meta-item cat-${s.category}`}>
                    <span className={`mi mi-sm cat-${s.category}`}>{CAT_ICONS[s.category]}</span>
                    {s.category}
                  </span>
                  <span className="session-meta-item">
                    <span className="mi mi-sm">calendar_today</span>
                    {formatDate(s.createdAt)}
                  </span>
                  {s.endTime && (
                    <span className="session-meta-item">
                      <span className="mi mi-sm">schedule</span>
                      {formatTime(s.startTime)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="session-duration">{formatDuration(s.duration)}</div>
                <span className={`badge badge-${s.status}`}>
                  <span className="badge-dot" />{s.status}
                </span>
                {s.status !== 'completed' && (
                  <Link to={`/session/${s._id}`} className="btn btn-ghost btn-sm">
                    <span className="mi mi-sm">play_arrow</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
