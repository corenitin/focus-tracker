import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSessions, deleteSession } from '../api';
import { formatDuration, formatDate, formatTime, CAT_ICONS, CATEGORIES } from '../utils';

const STATUS_FILTERS = ['all', 'completed', 'active', 'paused'];

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleting, setDeleting] = useState(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const res = await getSessions(params);
      setSessions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => { setPage(1); }, [statusFilter, categoryFilter]);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session? This cannot be undone.')) return;
    setDeleting(id);
    try { await deleteSession(id); setSessions((prev) => prev.filter((s) => s._id !== id)); }
    catch { alert('Failed to delete session.'); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Session History</h1>
        <p className="page-subtitle">Every minute you've invested in yourself.</p>
      </div>

      <div className="filters">
        {STATUS_FILTERS.map((f) => (
          <button key={f} className={`filter-chip ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
            {f === 'all' ? 'All Status' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />
        <button className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat} className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`} onClick={() => setCategoryFilter(cat)}>
            <span className={`mi mi-sm cat-${cat}`}>{CAT_ICONS[cat]}</span> {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><span className="mi mi-xl">folder_open</span></div>
          <div className="empty-title">No sessions found</div>
          <div className="empty-desc">Try a different filter or start a new session.</div>
          <br />
          <Link to="/new" className="btn btn-primary" style={{ marginTop: '8px' }}>
            <span className="mi mi-sm">add</span> Start a Session
          </Link>
        </div>
      ) : (
        <>
          <div className="sessions-list">
            {sessions.map((s) => (
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
                    <span className="session-meta-item">
                      <span className="mi mi-sm">schedule</span>
                      {formatTime(s.startTime)}
                    </span>
                    {s.endTime && (
                      <span className="session-meta-item">
                        <span className="mi mi-sm">arrow_forward</span>
                        {formatTime(s.endTime)}
                      </span>
                    )}
                    {s.notes && (
                      <span className="session-meta-item">
                        <span className="mi mi-sm">notes</span> Note
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div className="session-duration">{formatDuration(s.duration)}</div>
                  <span className={`badge badge-${s.status}`}>
                    <span className="badge-dot" />{s.status}
                  </span>
                  {s.status !== 'completed' && (
                    <Link to={`/session/${s._id}`} className="btn btn-ghost btn-sm">
                      <span className="mi mi-sm">play_arrow</span>
                    </Link>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)} disabled={deleting === s._id}>
                    <span className="mi mi-sm">{deleting === s._id ? 'hourglass_empty' : 'delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <span className="mi mi-sm">chevron_left</span> Prev
              </button>
              <span style={{ color: 'var(--text2)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>
                {page} / {pagination.pages}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>
                Next <span className="mi mi-sm">chevron_right</span>
              </button>
            </div>
          )}
          <div style={{ marginTop: '12px', color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center' }}>
            {pagination.total} session{pagination.total !== 1 ? 's' : ''} total
          </div>
        </>
      )}
    </div>
  );
}
