import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(initialSeconds = 0, running = false) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const pause = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const reset = useCallback((val = 0) => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSeconds(val);
  }, []);

  useEffect(() => {
    if (running) start();
    else pause();
    return () => clearInterval(intervalRef.current);
  }, [running, start, pause]);

  const format = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ]
      .filter(Boolean)
      .join(':');
  };

  return { seconds, formatted: format(seconds), start, pause, reset, setSeconds };
}
