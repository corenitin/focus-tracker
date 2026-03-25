import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createSession, completeSession } from '../api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

function formatSecs(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function hmsToSecs(h, m, s) {
  return (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
}

const PRESETS = [
  { label: 'Classic Pomodoro', focusH:0, focusM:25, focusS:0, shortH:0, shortM:5,  shortS:0, longH:0, longM:15, longS:0, rounds:4 },
  { label: 'Deep Work',        focusH:0, focusM:50, focusS:0, shortH:0, shortM:10, shortS:0, longH:0, longM:20, longS:0, rounds:4 },
  { label: 'Short Burst',      focusH:0, focusM:15, focusS:0, shortH:0, shortM:3,  shortS:0, longH:0, longM:10, longS:0, rounds:6 },
  { label: '2 Hour Block',     focusH:2, focusM:0,  focusS:0, shortH:0, shortM:15, shortS:0, longH:0, longM:30, longS:0, rounds:2 },
];

const CUSTOM_DEFAULT = { focusH:0, focusM:25, focusS:0, shortH:0, shortM:5, shortS:0, longH:0, longM:15, longS:0, rounds:4 };

const PHASES = {
  idle:       { label: 'Ready',       color: 'var(--text2)',  icon: 'timer' },
  focus:      { label: 'Focus Time',  color: 'var(--accent)', icon: 'psychology' },
  shortBreak: { label: 'Short Break', color: 'var(--green)',  icon: 'coffee' },
  longBreak:  { label: 'Long Break',  color: '#c084fc',       icon: 'self_improvement' },
  done:       { label: 'All Done!',   color: 'var(--yellow)', icon: 'emoji_events' },
};

const CATEGORIES = ['Study','Work','Reading','Coding','Exercise','Meditation','Other'];

// ─── Single field spinner ─────────────────────────────────────────────────────
function SpinField({ value, max, label, onChange, disabled }) {
  const inc = () => onChange(value >= max ? 0 : value + 1);
  const dec = () => onChange(value <= 0 ? max : value - 1);
  const onType = (e) => {
    const v = parseInt(e.target.value);
    if (!isNaN(v)) onChange(Math.max(0, Math.min(max, v)));
  };

  return (
    <div className="pomo-spin-field">
      <button
        className="pomo-spin-btn"
        disabled={disabled}
        onClick={inc}
        type="button"
      >
        <span className="mi" style={{ fontSize: 16 }}>expand_less</span>
      </button>
      <input
        className="pomo-spin-input"
        type="number"
        min={0}
        max={max}
        value={value}
        disabled={disabled}
        onChange={onType}
        onFocus={e => e.target.select()}
      />
      <button
        className="pomo-spin-btn"
        disabled={disabled}
        onClick={dec}
        type="button"
      >
        <span className="mi" style={{ fontSize: 16 }}>expand_more</span>
      </button>
      <div className="pomo-spin-label">{label}</div>
    </div>
  );
}

// ─── Time input row (H : M : S) ───────────────────────────────────────────────
function TimeInput({ h, m, s, maxH = 23, disabled, onChange }) {
  const set = (field, val) => onChange({ h, m, s, [field]: val });
  return (
    <div className="pomo-time-row">
      <SpinField value={h} max={maxH} label="HR"  disabled={disabled} onChange={v => set('h', v)} />
      <div className="pomo-colon">:</div>
      <SpinField value={m} max={59}   label="MIN" disabled={disabled} onChange={v => set('m', v)} />
      <div className="pomo-colon">:</div>
      <SpinField value={s} max={59}   label="SEC" disabled={disabled} onChange={v => set('s', v)} />
    </div>
  );
}

// ─── Config row ───────────────────────────────────────────────────────────────
function ConfigRow({ icon, iconColor, title, subtitle, children }) {
  return (
    <div className="pomo-config-row">
      <div className="pomo-config-left">
        <span className="mi mi-sm" style={{ color: iconColor }}>{icon}</span>
        <div>
          <div className="pomo-config-title">{title}</div>
          {subtitle && <div className="pomo-config-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="pomo-config-right">{children}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PomodoroTimer() {
  const [presetIdx, setPresetIdx]  = useState(0);
  const [custom, setCustom]        = useState({ ...CUSTOM_DEFAULT });
  const [phase, setPhase]          = useState('idle');
  const [round, setRound]          = useState(1);
  const [secondsLeft, setSecsLeft] = useState(hmsToSecs(0,25,0));
  const [running, setRunning]      = useState(false);
  const [sessionId, setSessionId]  = useState(null);
  const [sessionTitle, setTitle]   = useState('Focus Session');
  const [sessionCat, setCat]       = useState('Study');
  const [customCatInput, setCustomCatInput] = useState('');
  const [showCustomCat, setShowCustomCat]   = useState(false);
  const [completedRounds, setDone] = useState(0);
  const [totalFocusSecs, setTotal] = useState(0);
  const [activeTab, setTab]        = useState('presets');
  const [notifEnabled, setNotif]   = useState(false);
  const intervalRef = useRef(null);

  const cfg = activeTab === 'custom' ? custom : PRESETS[presetIdx];
  const focusSecs = hmsToSecs(cfg.focusH, cfg.focusM, cfg.focusS);
  const shortSecs = hmsToSecs(cfg.shortH, cfg.shortM, cfg.shortS);
  const longSecs  = hmsToSecs(cfg.longH,  cfg.longM,  cfg.longS);
  const totalRounds = parseInt(cfg.rounds) || 1;
  const isValid = focusSecs >= 1;

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') setNotif(true);
  }, []);

  const requestNotif = async () => {
    if ('Notification' in window) {
      const p = await Notification.requestPermission();
      setNotif(p === 'granted');
    }
  };

  const notify = useCallback((title, body) => {
    if (notifEnabled && 'Notification' in window) new Notification(title, { body });
  }, [notifEnabled]);

  const playBeep = useCallback((freq = 880) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const goToPhase = useCallback((nextPhase, nextRound, focusDone, focusElapsed = 0) => {
    stopTimer();
    setPhase(nextPhase);
    setRound(nextRound);
    if (nextPhase === 'focus')      setSecsLeft(hmsToSecs(cfg.focusH, cfg.focusM, cfg.focusS));
    if (nextPhase === 'shortBreak') setSecsLeft(hmsToSecs(cfg.shortH, cfg.shortM, cfg.shortS));
    if (nextPhase === 'longBreak')  setSecsLeft(hmsToSecs(cfg.longH,  cfg.longM,  cfg.longS));
    if (nextPhase === 'done')       setSecsLeft(0);
    if (focusDone) { setDone(d => d + 1); setTotal(t => t + focusElapsed); }
  }, [cfg, stopTimer]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { clearInterval(intervalRef.current); playBeep(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, playBeep]);

  // Use a ref to track running state inside the transition effect
  const runningRef = useRef(false);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    // Only transition when timer actually counted down while running
    if (secondsLeft !== 0 || phase === 'idle' || phase === 'done') return;
    if (!runningRef.current) return; // ← FIX: don't transition when paused
    const currFocusSecs = hmsToSecs(cfg.focusH, cfg.focusM, cfg.focusS);
    if (phase === 'focus') {
      const isLast = round >= totalRounds;
      if (isLast) { notify('🎉 All done!', 'Amazing work!'); goToPhase('done', round, true, currFocusSecs); }
      else {
        const useLong = round % 4 === 0;
        notify('✅ Focus done!', useLong ? 'Long break time!' : 'Short break time!');
        goToPhase(useLong ? 'longBreak' : 'shortBreak', round, true, currFocusSecs);
      }
    } else if (phase === 'shortBreak' || phase === 'longBreak') {
      notify('⏱ Break over!', 'Back to focus!');
      playBeep(660);
      goToPhase('focus', round + 1, false);
      setRunning(true);
    }
  }, [secondsLeft, phase, round, totalRounds, cfg, goToPhase, notify, playBeep]);

  useEffect(() => {
    if (phase === 'idle') setSecsLeft(hmsToSecs(cfg.focusH, cfg.focusM, cfg.focusS));
  }, [cfg, phase]);

  const handleStart = async () => {
    if (!isValid) return;
    if (phase === 'idle' || phase === 'done') {
      try {
        const res = await createSession({ title: sessionTitle, category: sessionCat, notes: `Timer: ${formatSecs(focusSecs)} × ${totalRounds} rounds` });
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
      try { await completeSession(sessionId, { notes: `Completed: ${completedRounds}/${totalRounds} rounds` }); } catch {}
    }
    setSessionId(null); setPhase('idle'); setRound(1);
    setSecsLeft(focusSecs); setDone(0); setTotal(0);
  };

  // Complete session early (when paused or mid-session)
  const handleComplete = async () => {
    stopTimer();
    const elapsed = totalFocusSecs + (phase === 'focus' ? focusSecs - secondsLeft : 0);
    if (sessionId) {
      try { await completeSession(sessionId, { notes: `Completed early: ${completedRounds}/${totalRounds} rounds` }); } catch {}
    }
    setTotal(elapsed);
    setPhase('done');
    setSecsLeft(0);
    setSessionId(null);
  };

  const handleSkip = () => {
    const elapsed = phase === 'focus' ? focusSecs - secondsLeft : 0;
    if (phase === 'focus') {
      const isLast = round >= totalRounds;
      if (isLast) goToPhase('done', round, true, elapsed);
      else goToPhase(round % 4 === 0 ? 'longBreak' : 'shortBreak', round, true, elapsed);
    } else if (phase === 'shortBreak' || phase === 'longBreak') {
      goToPhase('focus', round + 1, false);
      setRunning(true);
    }
  };

  const phaseInfo = PHASES[phase];
  const totalSecs = phase === 'focus' ? focusSecs : phase === 'shortBreak' ? shortSecs : longSecs;
  const pct = (phase === 'idle' || phase === 'done' || totalSecs === 0)
    ? 0
    : ((totalSecs - secondsLeft) / totalSecs) * 100;
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <>
      {/* Inject responsive styles */}
      <style>{pomoCss}</style>

      <div className="pomo-page">
        <div className="page-header">
          <h1 className="page-title">Focus Timer</h1>
          <p className="page-subtitle">Custom sessions with structured breaks. Set hours, minutes and seconds.</p>
        </div>

        <div className="pomo-layout">

          {/* ── LEFT: Config panel ── */}
          <div className="pomo-config-panel">

            {/* Mode tabs */}
            <div className="pomo-tabs">
              {[
                { id: 'presets', icon: 'tune',  label: 'Presets'      },
                { id: 'custom',  icon: 'edit',  label: 'Custom Timer' },
              ].map(t => (
                <button key={t.id} type="button"
                  disabled={phase !== 'idle'}
                  onClick={() => setTab(t.id)}
                  className={`pomo-tab ${activeTab === t.id ? 'active' : ''} ${phase !== 'idle' ? 'disabled' : ''}`}
                >
                  <span className="mi mi-sm">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Presets ── */}
            {activeTab === 'presets' && (
              <div className="card pomo-card">
                <div className="pomo-card-title">
                  <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>tune</span>
                  Choose a Preset
                </div>
                <div className="pomo-presets-grid">
                  {PRESETS.map((p, i) => (
                    <button key={i} type="button"
                      disabled={phase !== 'idle'}
                      onClick={() => setPresetIdx(i)}
                      className={`pomo-preset-card ${presetIdx === i ? 'active' : ''} ${phase !== 'idle' ? 'disabled' : ''}`}
                    >
                      <div className="pomo-preset-name">{p.label}</div>
                      <div className="pomo-preset-time">
                        {formatSecs(hmsToSecs(p.focusH, p.focusM, p.focusS))} focus
                      </div>
                      <div className="pomo-preset-detail">
                        {p.rounds} rounds · {formatSecs(hmsToSecs(p.shortH, p.shortM, p.shortS))} break
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Custom timer ── */}
            {activeTab === 'custom' && (
              <div className="card pomo-card">
                <div className="pomo-card-title">
                  <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>edit</span>
                  Set Your Own Timer
                </div>
                <p className="pomo-hint">
                  Use arrows or type directly. Supports hours, minutes and seconds.
                </p>

                <ConfigRow icon="psychology" iconColor="var(--accent)" title="Focus Duration">
                  <TimeInput
                    h={custom.focusH} m={custom.focusM} s={custom.focusS}
                    maxH={23} disabled={phase !== 'idle'}
                    onChange={v => setCustom(c => ({ ...c, focusH:v.h, focusM:v.m, focusS:v.s }))}
                  />
                  {focusSecs < 1 && (
                    <div className="pomo-error">⚠ Set at least 1 second</div>
                  )}
                </ConfigRow>

                <div className="pomo-divider" />

                <ConfigRow icon="coffee" iconColor="var(--green)" title="Short Break" subtitle="After each round">
                  <TimeInput
                    h={custom.shortH} m={custom.shortM} s={custom.shortS}
                    maxH={2} disabled={phase !== 'idle'}
                    onChange={v => setCustom(c => ({ ...c, shortH:v.h, shortM:v.m, shortS:v.s }))}
                  />
                </ConfigRow>

                <div className="pomo-divider" />

                <ConfigRow icon="self_improvement" iconColor="#c084fc" title="Long Break" subtitle="Every 4 rounds">
                  <TimeInput
                    h={custom.longH} m={custom.longM} s={custom.longS}
                    maxH={2} disabled={phase !== 'idle'}
                    onChange={v => setCustom(c => ({ ...c, longH:v.h, longM:v.m, longS:v.s }))}
                  />
                </ConfigRow>

                <div className="pomo-divider" />

                {/* Rounds */}
                <ConfigRow icon="repeat" iconColor="var(--yellow)" title="Number of Rounds">
                  <div className="pomo-rounds-row">
                    <button type="button" className="pomo-round-btn"
                      disabled={phase !== 'idle' || custom.rounds <= 1}
                      onClick={() => setCustom(c => ({ ...c, rounds: Math.max(1, c.rounds - 1) }))}>
                      <span className="mi mi-sm">remove</span>
                    </button>
                    <input
                      type="number" min={1} max={20}
                      className="pomo-rounds-input"
                      value={custom.rounds}
                      disabled={phase !== 'idle'}
                      onChange={e => setCustom(c => ({ ...c, rounds: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) }))}
                    />
                    <button type="button" className="pomo-round-btn"
                      disabled={phase !== 'idle' || custom.rounds >= 20}
                      onClick={() => setCustom(c => ({ ...c, rounds: Math.min(20, c.rounds + 1) }))}>
                      <span className="mi mi-sm">add</span>
                    </button>
                    <span className="pomo-rounds-label">rounds</span>
                  </div>
                </ConfigRow>

                {/* Summary */}
                {isValid && (
                  <div className="pomo-summary">
                    <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>info</span>
                    Total focus: <strong style={{ color: 'var(--accent)' }}>
                      {formatSecs(focusSecs * custom.rounds)}
                    </strong>
                    {shortSecs > 0 && (
                      <> + <strong style={{ color: 'var(--green)' }}>
                        {formatSecs((custom.rounds - 1) * shortSecs)} breaks
                      </strong></>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Session info */}
            <div className="card pomo-card">
              <div className="pomo-card-title">
                <span className="mi mi-sm" style={{ color: 'var(--text2)' }}>label</span>
                Session Info
              </div>
              <div className="pomo-session-grid">
                <div>
                  <label className="form-label">Title</label>
                  <input className="form-input" value={sessionTitle}
                    disabled={phase !== 'idle'} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-select" value={showCustomCat ? '__custom__' : sessionCat}
                    disabled={phase !== 'idle'}
                    onChange={e => {
                      if (e.target.value === '__custom__') { setShowCustomCat(true); }
                      else { setShowCustomCat(false); setCat(e.target.value); }
                    }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__custom__">+ Add Custom...</option>
                  </select>
                  {showCustomCat && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <input
                        className="form-input"
                        placeholder="Enter category name"
                        value={customCatInput}
                        disabled={phase !== 'idle'}
                        onChange={e => setCustomCatInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && customCatInput.trim()) {
                            setCat(customCatInput.trim());
                            setShowCustomCat(false);
                            setCustomCatInput('');
                          }
                        }}
                        style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                      />
                      <button type="button" className="btn btn-primary btn-sm"
                        disabled={!customCatInput.trim() || phase !== 'idle'}
                        onClick={() => {
                          if (customCatInput.trim()) {
                            setCat(customCatInput.trim());
                            setShowCustomCat(false);
                            setCustomCatInput('');
                          }
                        }}>
                        <span className="mi mi-sm">check</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification */}
              <button type="button" onClick={requestNotif} className={`pomo-notif-btn ${notifEnabled ? 'on' : ''}`}>
                <span className="mi mi-sm">{notifEnabled ? 'notifications_active' : 'notifications'}</span>
                {notifEnabled ? 'Notifications ON' : 'Enable Notifications'}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Timer ── */}
          <div className="pomo-timer-panel">

            {/* Ring */}
            <div className="pomo-ring-wrap">
              <svg className="pomo-ring-svg" viewBox="0 0 280 280">
                <circle fill="none" stroke="var(--border)" strokeWidth={6} cx={140} cy={140} r={110} />
                {pct > 0 && (
                  <circle fill="none" stroke={phaseInfo.color} strokeWidth={6} strokeLinecap="round"
                    cx={140} cy={140} r={110}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s', transform: 'rotate(-90deg)', transformOrigin: '140px 140px' }}
                  />
                )}
              </svg>
              <div className="pomo-ring-center">
                <span className="mi pomo-phase-icon" style={{ color: phaseInfo.color }}>{phaseInfo.icon}</span>
                <div className="pomo-timer-digits" style={{ color: phase === 'idle' ? 'var(--text2)' : phaseInfo.color }}>
                  {formatSecs(secondsLeft)}
                </div>
                <div className="pomo-phase-label" style={{ color: phaseInfo.color }}>
                  {phaseInfo.label}
                </div>
                {phase !== 'idle' && phase !== 'done' && (
                  <div className="pomo-round-info">
                    Round {Math.min(round, totalRounds)} / {totalRounds}
                  </div>
                )}
              </div>
            </div>

            {/* Round dots */}
            {totalRounds <= 20 && (
              <div className="pomo-dots">
                {Array.from({ length: totalRounds }).map((_, i) => (
                  <div key={i} className="pomo-dot" style={{
                    background: i < completedRounds
                      ? 'var(--green)'
                      : i === round - 1 && phase === 'focus'
                      ? 'var(--accent)'
                      : 'var(--border)',
                    boxShadow: i < completedRounds ? '0 0 6px var(--green)' : 'none',
                  }} />
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="pomo-controls">
              {phase !== 'done' && (
                <button type="button"
                  className={`btn btn-lg pomo-main-btn ${phase === 'idle' ? 'btn-success' : running ? 'btn-warning' : 'btn-primary'}`}
                  onClick={handleStart}
                  disabled={!isValid}
                >
                  <span className="mi">{phase === 'idle' ? 'play_arrow' : running ? 'pause' : 'play_arrow'}</span>
                  {phase === 'idle' ? 'Start' : running ? 'Pause' : 'Resume'}
                </button>
              )}
              {phase !== 'idle' && phase !== 'done' && (
                <button type="button" className="btn btn-ghost btn-lg" onClick={handleSkip}>
                  <span className="mi">skip_next</span> Skip
                </button>
              )}
              {/* Complete early — shown when paused or active (not idle/done) */}
              {phase !== 'idle' && phase !== 'done' && !running && (
                <button type="button" className="btn btn-success btn-lg" onClick={handleComplete}>
                  <span className="mi">check_circle</span> Complete
                </button>
              )}
              {phase !== 'idle' && (
                <button type="button" className="btn btn-danger btn-lg" onClick={handleReset}>
                  <span className="mi">restart_alt</span>
                  {phase === 'done' ? 'New Session' : 'Reset'}
                </button>
              )}
            </div>

            {/* Progress summary */}
            {(totalFocusSecs > 0 || phase === 'done') && (
              <div className="card accent-card pomo-progress">
                <div className="pomo-card-title">
                  <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>summarize</span>
                  Session Progress
                </div>
                <div className="pomo-progress-grid">
                  {[
                    { label: 'Focus Time',  value: formatSecs(totalFocusSecs),       icon: 'timer',        color: 'var(--accent)' },
                    { label: 'Rounds Done', value: `${completedRounds}/${totalRounds}`, icon: 'check_circle', color: 'var(--green)' },
                    { label: 'Rounds Left', value: Math.max(0, totalRounds - completedRounds), icon: 'pending', color: 'var(--text2)' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <span className="mi" style={{ color: s.color, fontSize: 26 }}>{s.icon}</span>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {phase === 'done' && (
                  <div className="pomo-done-banner">
                    <span className="mi mi-sm">celebration</span>
                    Great work! Session saved to your history.
                  </div>
                )}
              </div>
            )}

            {/* Tip */}
            <p className="pomo-tip">
              <span className="mi mi-sm" style={{ verticalAlign: 'middle', marginRight: 4 }}>lightbulb</span>
              Tip: Research shows 52 min focus + 17 min break is the optimal deep work cycle.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Component-scoped CSS ─────────────────────────────────────────────────────
const pomoCss = `
/* ── Page layout ── */
.pomo-page { max-width: 1000px; margin: 0 auto; }

.pomo-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

/* ── Tabs ── */
.pomo-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  background: var(--bg2);
  border-radius: 12px;
  padding: 4px;
  border: 1px solid var(--border);
  width: 100%;
}
.pomo-tab {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 12px;
  border-radius: 9px; border: none;
  background: transparent;
  color: var(--text2);
  font-family: Poppins,sans-serif;
  font-weight: 600; font-size: 0.83rem;
  cursor: pointer; transition: all 0.2s;
}
.pomo-tab.active { background: var(--accent); color: #000; }
[data-theme="light"] .pomo-tab.active { color: #fff; }
.pomo-tab.disabled { cursor: not-allowed; opacity: 0.5; }
.pomo-tab.disabled.active { opacity: 1; }

/* ── Cards ── */
.pomo-card { margin-bottom: 16px; padding: 20px; }
.pomo-card-title {
  display: flex; align-items: center; gap: 8px;
  font-weight: 700; font-size: 0.9rem; color: var(--text);
  margin-bottom: 14px;
}
.pomo-hint { font-size: 0.8rem; color: var(--text2); margin-bottom: 16px; line-height: 1.5; }

/* ── Presets grid ── */
.pomo-presets-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.pomo-preset-card {
  padding: 14px 12px; border-radius: 12px; cursor: pointer;
  border: 2px solid var(--border);
  background: var(--bg2);
  text-align: left; transition: all 0.2s;
  width: 100%;
}
.pomo-preset-card.active { border-color: var(--accent); background: var(--accent-glow2); }
.pomo-preset-card.disabled { cursor: not-allowed; opacity: 0.6; }
.pomo-preset-name { font-weight: 700; font-size: 0.82rem; color: var(--text); margin-bottom: 5px; }
.pomo-preset-card.active .pomo-preset-name { color: var(--accent); }
.pomo-preset-time { font-family: JetBrains Mono,monospace; font-size: 0.75rem; color: var(--text2); }
.pomo-preset-detail { font-size: 0.7rem; color: var(--text3); margin-top: 3px; }

/* ── Config rows ── */
.pomo-config-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.pomo-config-left {
  display: flex; align-items: flex-start; gap: 8px; padding-top: 4px;
  flex-shrink: 0; min-width: 120px;
}
.pomo-config-title { font-weight: 600; font-size: 0.875rem; color: var(--text); }
.pomo-config-sub { font-size: 0.7rem; color: var(--text3); margin-top: 2px; }
.pomo-config-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.pomo-divider { height: 1px; background: var(--border); margin: 14px 0; }
.pomo-error { color: var(--red); font-size: 0.75rem; }

/* ── Time input (H:M:S row) ── */
.pomo-time-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.pomo-colon {
  font-weight: 700; font-size: 1.3rem; color: var(--text3);
  padding-bottom: 18px; line-height: 1; user-select: none;
}

/* ── Spin field ── */
.pomo-spin-field {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.pomo-spin-btn {
  width: 36px; height: 26px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg2); color: var(--text2);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  font-family: Material Icons Round;
  padding: 0;
}
.pomo-spin-btn:hover:not(:disabled) { background: var(--card2); color: var(--text); border-color: var(--border2); }
.pomo-spin-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pomo-spin-input {
  width: 56px;
  text-align: center;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text);
  font-family: JetBrains Mono,monospace;
  font-weight: 700;
  font-size: 1.5rem;
  padding: 6px 4px;
  outline: none;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
}
.pomo-spin-input::-webkit-outer-spin-button,
.pomo-spin-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.pomo-spin-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
.pomo-spin-input:disabled { opacity: 0.4; cursor: not-allowed; }
.pomo-spin-label { font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text3); margin-top: 2px; }

/* ── Rounds ── */
.pomo-rounds-row { display: flex; align-items: center; gap: 10px; }
.pomo-round-btn {
  width: 36px; height: 36px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--bg2);
  color: var(--text2); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.pomo-round-btn:hover:not(:disabled) { background: var(--card2); color: var(--text); }
.pomo-round-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pomo-rounds-input {
  width: 56px; text-align: center;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 9px; color: var(--text);
  font-family: JetBrains Mono,monospace;
  font-weight: 700; font-size: 1.4rem;
  padding: 6px 4px; outline: none;
  -moz-appearance: textfield;
}
.pomo-rounds-input::-webkit-outer-spin-button,
.pomo-rounds-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.pomo-rounds-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
.pomo-rounds-input:disabled { opacity: 0.4; cursor: not-allowed; }
.pomo-rounds-label { font-size: 0.82rem; color: var(--text2); font-weight: 500; }

/* ── Summary pill ── */
.pomo-summary {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 0.8rem; color: var(--text2);
  background: var(--accent-glow2); border: 1px solid var(--border);
  border-radius: 10px; padding: 10px 14px; margin-top: 14px;
}

/* ── Session grid ── */
.pomo-session-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;
}

/* ── Notification button ── */
.pomo-notif-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px; border-radius: 99px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text2);
  font-family: Poppins,sans-serif; font-weight: 600; font-size: 0.8rem;
  cursor: pointer; transition: all 0.2s; width: 100%; justify-content: center;
}
.pomo-notif-btn.on { background: var(--green-glow); color: var(--green); border-color: rgba(0,230,118,0.3); }
.pomo-notif-btn:hover:not(.on) { background: var(--card2); color: var(--text); }

/* ── Timer panel ── */
.pomo-timer-panel { display: flex; flex-direction: column; align-items: center; gap: 0; }

/* Ring */
.pomo-ring-wrap {
  position: relative; width: 260px; height: 260px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px; flex-shrink: 0;
}
.pomo-ring-svg {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
}
.pomo-ring-center {
  position: relative; z-index: 1; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.pomo-phase-icon { font-size: 28px; margin-bottom: 2px; }
.pomo-timer-digits {
  font-family: JetBrains Mono,monospace;
  font-size: 3rem; font-weight: 300;
  letter-spacing: -0.02em; line-height: 1;
  transition: color 0.4s;
}
.pomo-phase-label {
  font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.12em; margin-top: 6px;
}
.pomo-round-info { font-size: 0.68rem; color: var(--text3); margin-top: 3px; }

/* Dots */
.pomo-dots {
  display: flex; gap: 6px; justify-content: center;
  flex-wrap: wrap; max-width: 260px; margin-bottom: 20px;
}
.pomo-dot {
  width: 10px; height: 10px; border-radius: 50%;
  transition: all 0.3s; flex-shrink: 0;
}

/* Controls */
.pomo-controls {
  display: flex; gap: 10px; justify-content: center;
  flex-wrap: wrap; margin-bottom: 20px; width: 100%;
}
.pomo-main-btn { min-width: 130px; }

/* Progress */
.pomo-progress { width: 100%; margin-bottom: 16px; padding: 18px 20px; }
.pomo-progress-grid {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 12px;
}
.pomo-done-banner {
  margin-top: 14px; padding: 10px 14px;
  background: var(--green-glow); border-radius: 10px;
  text-align: center; color: var(--green); font-weight: 600; font-size: 0.875rem;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}

/* Tip */
.pomo-tip {
  text-align: center; color: var(--text3); font-size: 0.76rem;
  line-height: 1.6; padding: 0 8px; width: 100%;
}

/* ── Tablet ≤ 900px: stack layout ── */
@media (max-width: 900px) {
  .pomo-layout { grid-template-columns: 1fr; }
  .pomo-timer-panel { order: -1; }
  .pomo-ring-wrap { width: 220px; height: 220px; }
  .pomo-timer-digits { font-size: 2.6rem; }
}

/* ── Mobile ≤ 600px ── */
@media (max-width: 600px) {
  .pomo-presets-grid { grid-template-columns: 1fr 1fr; }
  .pomo-session-grid { grid-template-columns: 1fr; }
  .pomo-ring-wrap { width: 200px; height: 200px; }
  .pomo-timer-digits { font-size: 2.3rem; }
  .pomo-phase-icon { font-size: 22px; }
  .pomo-config-row { flex-direction: column; gap: 10px; }
  .pomo-config-right { align-items: flex-start; }
  .pomo-controls .btn-lg { padding: 11px 18px; font-size: 0.875rem; }
  .pomo-spin-input { width: 50px; font-size: 1.3rem; }
  .pomo-spin-btn { width: 32px; }
}

/* ── Very small ≤ 380px ── */
@media (max-width: 380px) {
  .pomo-presets-grid { grid-template-columns: 1fr; }
  .pomo-ring-wrap { width: 180px; height: 180px; }
  .pomo-timer-digits { font-size: 2rem; }
  .pomo-tabs { flex-direction: column; }
  .pomo-controls { flex-direction: column; align-items: stretch; }
  .pomo-controls .btn { width: 100%; }
  .pomo-progress-grid { grid-template-columns: repeat(3,1fr); gap: 8px; }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .pomo-spin-btn { min-height: 40px; width: 40px; }
  .pomo-round-btn { min-height: 44px; min-width: 44px; }
  .pomo-tab { min-height: 44px; }
}
`;
