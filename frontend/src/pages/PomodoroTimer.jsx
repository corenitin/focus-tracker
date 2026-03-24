import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createSession, completeSession } from '../api';

const PRESETS = [
  { label: 'Classic Pomodoro', focus: 25, short: 5,  long: 15, rounds: 4 },
  { label: 'Deep Work',        focus: 50, short: 10, long: 20, rounds: 4 },
  { label: 'Short Burst',      focus: 15, short: 3,  long: 10, rounds: 6 },
  { label: 'Custom',           focus: 25, short: 5,  long: 15, rounds: 4 },
];

const PHASES = {
  idle:       { label: 'Ready',       color: 'var(--text2)',  icon: 'timer' },
  focus:      { label: 'Focus Time',  color: 'var(--accent)', icon: 'psychology' },
  shortBreak: { label: 'Short Break', color: 'var(--green)',  icon: 'coffee' },
  longBreak:  { label: 'Long Break',  color: '#c084fc',       icon: 'self_improvement' },
  done:       { label: 'All Done!',   color: 'var(--yellow)', icon: 'emoji_events' },
};

function pad(n) { return String(n).padStart(2, '0'); }
function formatSecs(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

export default function PomodoroTimer() {
  const [presetIdx, setPresetIdx]   = useState(0);
  const [custom, setCustom]         = useState({ focus: 25, short: 5, long: 15, rounds: 4 });
  const [phase, setPhase]           = useState('idle');
  const [round, setRound]           = useState(1);
  const [secondsLeft, setSecsLeft]  = useState(25 * 60);
  const [running, setRunning]       = useState(false);
  const [sessionId, setSessionId]   = useState(null);
  const [sessionTitle, setTitle]    = useState('Focus Session');
  const [sessionCategory, setCat]   = useState('Study');
  const [completedRounds, setDone]  = useState(0);
  const [totalFocusSecs, setTotal]  = useState(0);
  const [showSettings, setSettings] = useState(false);
  const [notifEnabled, setNotif]    = useState(false);
  const intervalRef = useRef(null);
  const audioRef    = useRef(null);

  const cfg = presetIdx === 3 ? custom : PRESETS[presetIdx];
  const totalRounds = cfg.rounds;

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') setNotif(true);
  }, []);

  const requestNotif = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotif(perm === 'granted');
    }
  };

  const notify = useCallback((title, body) => {
    if (notifEnabled && 'Notification' in window) {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, [notifEnabled]);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const goToPhase = useCallback((nextPhase, nextRound, focusDone) => {
    stopTimer();
    setPhase(nextPhase);
    setRound(nextRound);
    if (nextPhase === 'focus')      setSecsLeft(cfg.focus * 60);
    if (nextPhase === 'shortBreak') setSecsLeft(cfg.short * 60);
    if (nextPhase === 'longBreak')  setSecsLeft(cfg.long  * 60);
    if (nextPhase === 'done')       setSecsLeft(0);
    if (focusDone) setDone(d => d + 1);
  }, [cfg, stopTimer]);

  // Tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          playBeep();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, playBeep]);

  // Phase transition when timer hits 0
  useEffect(() => {
    if (secondsLeft !== 0 || phase === 'idle' || phase === 'done') return;
    if (!running && phase !== 'focus' && phase !== 'shortBreak' && phase !== 'longBreak') return;

    if (phase === 'focus') {
      setTotal(t => t + cfg.focus * 60);
      const isLastRound = round >= totalRounds;
      if (isLastRound) {
        notify('🎉 All rounds complete!', `You focused for ${cfg.focus * totalRounds} minutes!`);
        goToPhase('done', round, true);
      } else {
        const isLongBreak = round % 4 === 0;
        notify('✅ Focus done!', isLongBreak ? `Time for a long break (${cfg.long} min)` : `Short break time! (${cfg.short} min)`);
        goToPhase(isLongBreak ? 'longBreak' : 'shortBreak', round, true);
      }
    } else if (phase === 'shortBreak' || phase === 'longBreak') {
      notify('⏱ Break over!', 'Time to focus again!');
      goToPhase('focus', round + 1, false);
      setRunning(true);
    }
  }, [secondsLeft, phase, round, totalRounds, cfg, goToPhase, notify, running]);

  const handleStart = async () => {
    if (phase === 'idle' || phase === 'done') {
      // Create a backend session
      try {
        const res = await createSession({ title: sessionTitle, category: sessionCategory, notes: `Pomodoro: ${cfg.focus}min focus × ${totalRounds} rounds` });
        setSessionId(res.data.data._id);
      } catch {}
      setDone(0); setTotal(0); setRound(1);
      goToPhase('focus', 1, false);
      setRunning(true);
    } else {
      setRunning(r => !r);
    }
  };

  const handleReset = async () => {
    stopTimer();
    if (sessionId && totalFocusSecs > 0) {
      try { await completeSession(sessionId, { notes: `Pomodoro completed: ${completedRounds}/${totalRounds} rounds` }); } catch {}
    }
    setSessionId(null); setPhase('idle'); setRound(1);
    setSecsLeft(cfg.focus * 60); setDone(0); setTotal(0);
  };

  const handleSkip = () => {
    if (phase === 'focus') {
      setTotal(t => t + (cfg.focus * 60 - secondsLeft));
      const isLastRound = round >= totalRounds;
      if (isLastRound) goToPhase('done', round, true);
      else goToPhase(round % 4 === 0 ? 'longBreak' : 'shortBreak', round, true);
    } else if (phase === 'shortBreak' || phase === 'longBreak') {
      goToPhase('focus', round + 1, false);
      setRunning(true);
    }
  };

  // Sync timer when preset changes
  useEffect(() => {
    if (phase === 'idle') setSecsLeft(cfg.focus * 60);
  }, [cfg, phase]);

  const phaseInfo = PHASES[phase];
  const totalSecs = phase === 'focus' ? cfg.focus * 60 : phase === 'shortBreak' ? cfg.short * 60 : cfg.long * 60;
  const pct = phase === 'idle' || phase === 'done' ? 0 : ((totalSecs - secondsLeft) / totalSecs) * 100;
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference - (pct / 100) * circumference;

  const CATEGORIES = ['Study','Work','Reading','Coding','Exercise','Meditation','Other'];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Focus Timer</h1>
        <p className="page-subtitle">Structured focus sessions with timed breaks.</p>
      </div>

      {/* ── Preset Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {PRESETS.map((p, i) => (
          <button key={i} disabled={phase !== 'idle'} onClick={() => { setPresetIdx(i); }}
            style={{
              padding: '8px 16px', borderRadius: 99, border: '1px solid var(--border)',
              background: presetIdx === i ? 'var(--accent)' : 'transparent',
              color: presetIdx === i ? '#000' : 'var(--text2)',
              fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: '0.8rem',
              cursor: phase !== 'idle' ? 'not-allowed' : 'pointer', opacity: phase !== 'idle' ? 0.6 : 1,
              transition: 'all 0.2s',
            }}>{p.label}</button>
        ))}
        <button onClick={() => setSettings(s => !s)} style={{
          padding: '8px 12px', borderRadius: 99, border: '1px solid var(--border)',
          background: showSettings ? 'var(--card2)' : 'transparent',
          color: 'var(--text2)', fontFamily: 'Material Icons Round', fontSize: 18, cursor: 'pointer',
        }}>settings</button>
      </div>

      {/* ── Custom Settings Panel ── */}
      {(presetIdx === 3 || showSettings) && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mi mi-sm">tune</span> Timer Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
            {[
              { label: 'Focus (min)', key: 'focus', min: 5, max: 120 },
              { label: 'Short Break (min)', key: 'short', min: 1, max: 30 },
              { label: 'Long Break (min)', key: 'long', min: 5, max: 60 },
              { label: 'Rounds', key: 'rounds', min: 1, max: 12 },
            ].map(({ label, key, min, max }) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <input type="number" min={min} max={max}
                  className="form-input"
                  disabled={phase !== 'idle'}
                  value={presetIdx === 3 ? custom[key] : cfg[key]}
                  onChange={e => {
                    if (presetIdx !== 3) { setPresetIdx(3); }
                    setCustom(c => ({ ...c, [key]: parseInt(e.target.value) || min }));
                  }}
                />
              </div>
            ))}
          </div>

          {/* Session info */}
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label">Session Title</label>
              <input className="form-input" value={sessionTitle} onChange={e => setTitle(e.target.value)} disabled={phase !== 'idle'} />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="form-select" value={sessionCategory} onChange={e => setCat(e.target.value)} disabled={phase !== 'idle'}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Notification toggle */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={requestNotif} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: notifEnabled ? 'var(--green-glow)' : 'transparent',
              color: notifEnabled ? 'var(--green)' : 'var(--text2)',
              fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            }}>
              <span className="mi mi-sm">{notifEnabled ? 'notifications_active' : 'notifications'}</span>
              {notifEnabled ? 'Notifications ON' : 'Enable Notifications'}
            </button>
          </div>
        </div>
      )}

      {/* ── Timer Ring ── */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }} width={280} height={280} viewBox="0 0 280 280">
            <circle fill="none" stroke="var(--border)" strokeWidth={6} cx={140} cy={140} r={110} />
            <circle fill="none" stroke={phaseInfo.color} strokeWidth={6} strokeLinecap="round"
              cx={140} cy={140} r={110}
              strokeDasharray={circumference}
              strokeDashoffset={phase === 'idle' || phase === 'done' ? circumference : dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s' }}
            />
          </svg>
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            {/* Phase icon */}
            <div style={{ marginBottom: 4 }}>
              <span className="mi" style={{ fontSize: 28, color: phaseInfo.color }}>{phaseInfo.icon}</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '3.5rem', fontWeight: 300, letterSpacing: '-0.02em', color: phase === 'idle' ? 'var(--text2)' : phaseInfo.color, lineHeight: 1 }}>
              {formatSecs(secondsLeft)}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 8, color: phaseInfo.color }}>
              {phaseInfo.label}
            </div>
            {phase !== 'idle' && phase !== 'done' && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>
                Round {Math.min(round, totalRounds)} of {totalRounds}
              </div>
            )}
          </div>
        </div>

        {/* Round indicators */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: i < completedRounds ? 'var(--green)' : i === round - 1 && phase === 'focus' ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
              boxShadow: i < completedRounds ? '0 0 6px var(--green)' : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
        {phase !== 'done' && (
          <button className={`btn btn-lg ${phase === 'idle' ? 'btn-success' : running ? 'btn-warning' : 'btn-primary'}`}
            onClick={handleStart} style={{ minWidth: 140 }}>
            <span className="mi">{phase === 'idle' ? 'play_arrow' : running ? 'pause' : 'play_arrow'}</span>
            {phase === 'idle' ? 'Start' : running ? 'Pause' : 'Resume'}
          </button>
        )}
        {phase !== 'idle' && phase !== 'done' && (
          <button className="btn btn-ghost btn-lg" onClick={handleSkip}>
            <span className="mi">skip_next</span> Skip
          </button>
        )}
        {phase !== 'idle' && (
          <button className="btn btn-danger btn-lg" onClick={handleReset}>
            <span className="mi">restart_alt</span>
            {phase === 'done' ? 'New Session' : 'Reset'}
          </button>
        )}
      </div>

      {/* ── Session Summary ── */}
      {(totalFocusSecs > 0 || phase === 'done') && (
        <div className="card accent-card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>summarize</span>
            Session Progress
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 16 }}>
            {[
              { label: 'Focus Time', value: `${Math.floor(totalFocusSecs/60)}m`, icon: 'timer', color: 'var(--accent)' },
              { label: 'Rounds Done', value: `${completedRounds}/${totalRounds}`, icon: 'check_circle', color: 'var(--green)' },
              { label: 'Break Time', value: `${completedRounds > 0 ? (completedRounds - (completedRounds % 4 === 0 && completedRounds > 0 ? 1 : 0)) * cfg.short + Math.floor(completedRounds / 4) * cfg.long : 0}m`, icon: 'coffee', color: '#c084fc' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <span className="mi" style={{ color: s.color, fontSize: 28 }}>{s.icon}</span>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: '1.5rem', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {phase === 'done' && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--green-glow)', borderRadius: 10, textAlign: 'center', color: 'var(--green)', fontWeight: 600, fontSize: '0.9rem' }}>
              <span className="mi mi-sm">celebration</span> Great work! Session saved to your history.
            </div>
          )}
        </div>
      )}

      {/* ── Tip ── */}
      <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.8rem', padding: '0 24px' }}>
        <span className="mi mi-sm" style={{ verticalAlign: 'middle' }}>lightbulb</span>
        {' '}Tip: The Pomodoro Technique was developed by Francesco Cirillo in the late 1980s. Short breaks refresh your brain between focus intervals.
      </div>
    </div>
  );
}
