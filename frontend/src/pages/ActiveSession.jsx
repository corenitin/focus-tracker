import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, pauseSession, resumeSession, completeSession } from '../api';
import { formatDate, formatTime, CAT_ICONS, formatDuration } from '../utils';
import { formatTimer } from '../utils';

export default function ActiveSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    setSeconds((s) => s + 1);
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  // Calculate current elapsed seconds from session data
  const calcElapsed = useCallback((sess) => {
    if (sess.status === 'completed') return sess.duration;
    const now = Date.now();
    const startMs = new Date(sess.startTime).getTime();
    const totalElapsed = Math.floor((now - startMs) / 1000);
    const paused = sess.totalPausedTime || 0;
    // If currently paused, also subtract current pause time
    let currentPause = 0;
    if (sess.status === 'paused' && sess.pausedAt) {
      currentPause = Math.floor((now - new Date(sess.pausedAt).getTime()) / 1000);
    }
    return Math.max(0, totalElapsed - paused - currentPause);
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const res = await getSession(id);
      const sess = res.data.data;
      setSession(sess);
      setNotes(sess.notes || '');
      const elapsed = calcElapsed(sess);
      setSeconds(elapsed);
      if (sess.status === 'active') startTimer();
      else stopTimer();
    } catch {
      setError('Session not found.');
    } finally {
      setLoading(false);
    }
  }, [id, calcElapsed, startTimer, stopTimer]);

  useEffect(() => {
    loadSession();
    return () => stopTimer();
  }, [loadSession, stopTimer]);

  const handlePause = async () => {
    setActionLoading(true);
    try {
      const res = await pauseSession(id);
      setSession(res.data.data);
      stopTimer();
      setSeconds(res.data.data.duration);
    } catch (err) { setError('Failed to pause.'); }
    finally { setActionLoading(false); }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      const res = await resumeSession(id);
      setSession(res.data.data);
      startTimer();
    } catch (err) { setError('Failed to resume.'); }
    finally { setActionLoading(false); }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    stopTimer();
    try {
      const res = await completeSession(id, { notes });
      setSession(res.data.data);
      setSeconds(res.data.data.duration);
    } catch (err) { setError('Failed to complete session.'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="spinner" />;
  if (error && !session) return (
    <div className="empty-state">
      <div className="empty-icon">❌</div>
      <div className="empty-title">{error}</div>
      <br />
      <button className="btn btn-ghost" onClick={() => navigate('/')}>← Dashboard</button>
    </div>
  );

  const isActive = session?.status === 'active';
  const isPaused = session?.status === 'paused';
  const isCompleted = session?.status === 'completed';

  // Ring progress (60-min goal = 3600 secs, loops)
  const RING_MAX = 3600;
  const circumference = 2 * Math.PI * 110;
  const progress = Math.min(seconds % RING_MAX, RING_MAX);
  const dashOffset = circumference - (progress / RING_MAX) * circumference;

  return (
    <div className="active-session-container">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{session?.title}</h1>
        <p className="page-subtitle">
          <span className={`cat-${session?.category}`}>{CAT_ICONS[session?.category]} {session?.category}</span>
          &ensp;•&ensp; Started {formatTime(session?.startTime)}
        </p>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Timer Ring */}
      <div className="timer-ring">
        <svg className="timer-ring-svg" width="280" height="280" viewBox="0 0 280 280">
          <circle className="timer-ring-track" cx="140" cy="140" r="110" />
          <circle
            className="timer-ring-progress"
            cx="140" cy="140" r="110"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            stroke={isCompleted ? 'var(--green)' : isPaused ? 'var(--yellow)' : 'var(--accent)'}
          />
        </svg>
        <div className="timer-center">
          <div className="timer-big" style={{ color: isCompleted ? 'var(--green)' : isPaused ? 'var(--yellow)' : 'var(--text)' }}>
            {formatTimer(seconds)}
          </div>
          <div className="timer-status-text" style={{ color: isCompleted ? 'var(--green)' : isPaused ? 'var(--yellow)' : 'var(--accent)' }}>
            {isActive ? '● FOCUSING' : isPaused ? '⏸ PAUSED' : '✓ COMPLETE'}
          </div>
        </div>
      </div>

      {/* Controls */}
      {!isCompleted && (
        <div className="session-controls">
          {isActive && (
            <button className="btn btn-warning btn-lg" onClick={handlePause} disabled={actionLoading}>
              ⏸ Pause
            </button>
          )}
          {isPaused && (
            <button className="btn btn-primary btn-lg" onClick={handleResume} disabled={actionLoading}>
              ▶ Resume
            </button>
          )}
          <button className="btn btn-success btn-lg" onClick={handleComplete} disabled={actionLoading}>
            ✓ Complete Session
          </button>
        </div>
      )}

      {/* Notes */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <label className="form-label">Session Notes</label>
        <textarea
          className="form-textarea"
          placeholder="What did you accomplish? Any thoughts..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isCompleted}
          maxLength={500}
        />
      </div>

      {/* Completed Summary */}
      {isCompleted && (
        <div className="card accent-card" style={{ marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>Session Complete!</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            You focused for <strong style={{ color: 'var(--green)' }}>{formatDuration(session.duration)}</strong>
            {session.totalPausedTime > 0 && ` (paused ${formatDuration(session.totalPausedTime)})`}
          </div>
          {session.endTime && (
            <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: '4px' }}>
              {formatTime(session.startTime)} → {formatTime(session.endTime)}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← Dashboard</button>
        <button className="btn btn-ghost" onClick={() => navigate('/history')}>📋 History</button>
        {isCompleted && (
          <button className="btn btn-primary" onClick={() => navigate('/new')}>＋ New Session</button>
        )}
      </div>
    </div>
  );
}
