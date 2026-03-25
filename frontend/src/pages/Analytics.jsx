import React, { useEffect, useState, useCallback } from 'react';
import { getDailyStats, getMonthlyStats, getYearlyStats, getHeatmap, getOverallStats } from '../api';
import { formatDuration, CAT_ICONS } from '../utils';

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, valueKey = 'totalDuration', labelKey = 'label', color = 'var(--accent)', height = 180, today }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, paddingTop: 8 }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        const isToday = today && d.date === today;
        const shortLabel = d[labelKey]?.split(',')[0]?.split(' ')?.[0] || d[labelKey];
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
            <div style={{ flex: 1, width: '100%', background: 'var(--bg2)', borderRadius: '4px 4px 0 0', position: 'relative', overflow: 'hidden', minWidth: 6 }}>
              {pct > 0 && (
                <div title={`${d[labelKey]}: ${formatDuration(d[valueKey])}`} style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: isToday ? 'var(--green)' : color,
                  borderRadius: '4px 4px 0 0',
                  height: `${pct}%`,
                  transition: 'height 0.6s ease',
                  opacity: isToday ? 1 : 0.8,
                }} />
              )}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
              {shortLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const COLORS = ['var(--accent)', 'var(--green)', '#c084fc', 'var(--orange)', 'var(--yellow)', '#7c6af7', 'var(--text2)'];
  const total = data.reduce((a, b) => a + b.total, 0) || 1;
  let cumAngle = 0;

  const slices = data.map((d, i) => {
    const pct = d.total / total;
    const startAngle = cumAngle;
    cumAngle += pct * 360;
    return { ...d, pct, startAngle, endAngle: cumAngle, color: COLORS[i % COLORS.length] };
  });

  const polarToXY = (angle, r) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) };
  };

  const describePath = (s) => {
    if (s.pct >= 0.999) return `M100,100 m0,-70 a70,70 0 1,1 0,140 a70,70 0 1,1 0,-140`;
    const large = s.endAngle - s.startAngle > 180 ? 1 : 0;
    const start = polarToXY(s.startAngle, 70);
    const end   = polarToXY(s.endAngle, 70);
    return `M100,100 L${start.x},${start.y} A70,70 0 ${large},1 ${end.x},${end.y} Z`;
  };

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', overflow: 'hidden', minWidth: 0 }}>
      <svg width={200} height={200} viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
        {slices.length > 0 ? slices.map((s, i) => (
          <path key={i} d={describePath(s)} fill={s.color} opacity={0.85}>
            <title>{s._id}: {formatDuration(s.total)}</title>
          </path>
        )) : (
          <circle cx={100} cy={100} r={70} fill="var(--border)" />
        )}
        <circle cx={100} cy={100} r={44} fill="var(--card)" />
        <text x={100} y={96} textAnchor="middle" fill="var(--text)" fontSize={12} fontFamily="JetBrains Mono" fontWeight={700}>
          {formatDuration(total)}
        </text>
        <text x={100} y={112} textAnchor="middle" fill="var(--text2)" fontSize={9} fontFamily="Poppins">
          TOTAL
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span className={`mi mi-sm cat-${s._id}`} style={{ fontSize: 14 }}>{CAT_ICONS[s._id]}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text2)', flex: 1 }}>{s._id}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text)', fontFamily: 'JetBrains Mono,monospace', fontWeight: 600 }}>
              {Math.round(s.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Heatmap ───────────────────────────────────────────────────────────────────
function Heatmap({ data }) {
  const weeks = [];
  const today = new Date();
  const start = new Date(today); start.setDate(start.getDate() - 363);
  // Align to Sunday
  start.setDate(start.getDate() - start.getDay());

  let current = new Date(start);
  while (current <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0];
      const entry = data[dateStr];
      week.push({ date: dateStr, duration: entry?.totalDuration || 0, count: entry?.sessionCount || 0, day: new Date(current) });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const maxDuration = Math.max(...Object.values(data).map(d => d.totalDuration), 1);

  const getColor = (duration) => {
    if (!duration) return 'var(--border)';
    const intensity = duration / maxDuration;
    if (intensity < 0.25) return 'rgba(0,212,255,0.25)';
    if (intensity < 0.5)  return 'rgba(0,212,255,0.5)';
    if (intensity < 0.75) return 'rgba(0,212,255,0.75)';
    return 'var(--accent)';
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days   = ['S','M','T','W','T','F','S'];

  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%', maxWidth: '100%' }}>
      <div style={{ display: 'inline-flex', gap: 2 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>
          <div style={{ height: 14 }} />
          {days.map((d, i) => (
            <div key={i} style={{ height: 12, fontSize: '0.6rem', color: 'var(--text3)', lineHeight: '12px', width: 14, textAlign: 'right' }}>
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>
        {/* Weeks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
            {weeks.map((week, wi) => {
              const firstDay = week[0].day;
              const show = firstDay.getDate() <= 7 ? months[firstDay.getMonth()] : '';
              return <div key={wi} style={{ width: 12, fontSize: '0.58rem', color: 'var(--text3)', overflow: 'hidden', whiteSpace: 'nowrap' }}>{show}</div>;
            })}
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.date ? `${day.date}: ${formatDuration(day.duration)} (${day.count} sessions)` : ''}
                    style={{
                      width: 12, height: 12,
                      borderRadius: 2,
                      background: day.day > today ? 'transparent' : getColor(day.duration),
                      border: day.date === today.toISOString().split('T')[0] ? '1px solid var(--accent)' : 'none',
                      cursor: day.duration ? 'pointer' : 'default',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.7rem', color: 'var(--text3)' }}>
        <span>Less</span>
        {['var(--border)', 'rgba(0,212,255,0.25)', 'rgba(0,212,255,0.5)', 'rgba(0,212,255,0.75)', 'var(--accent)'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Streak Card ───────────────────────────────────────────────────────────────
function StreakCard({ current, longest }) {
  const flames = Math.min(current, 7);
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <div style={sCard('#ff6b35')}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text2)', marginBottom: 6 }}>Current Streak</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '2.8rem', fontWeight: 700, color: 'var(--orange)', lineHeight: 1 }}>{current}</span>
          <span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>days</span>
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} style={{ fontSize: i < flames ? '1.2rem' : '0.9rem', opacity: i < flames ? 1 : 0.2 }}>🔥</span>
          ))}
        </div>
      </div>
      <div style={sCard('#ffd23f')}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text2)', marginBottom: 6 }}>Longest Streak</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '2.8rem', fontWeight: 700, color: 'var(--yellow)', lineHeight: 1 }}>{longest}</span>
          <span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>days</span>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontSize: '0.8rem' }}>
          <span className="mi mi-sm" style={{ color: 'var(--yellow)' }}>emoji_events</span>
          Personal best
        </div>
      </div>
    </div>
  );
}
const sCard = (c) => ({
  flex: '1 1 160px', background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '20px 24px', position: 'relative', overflow: 'hidden',
  borderTop: `3px solid ${c}`,
});

// ─── Tab Button ────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#000' : 'var(--text2)',
      fontFamily: 'Poppins,sans-serif', fontWeight: 600, fontSize: '0.82rem',
      transition: 'all 0.2s',
    }}>{label}</button>
  );
}

// ─── Main Analytics Page ───────────────────────────────────────────────────────
export default function Analytics() {
  const [overall, setOverall]   = useState(null);
  const [daily7,  setDaily7]    = useState([]);
  const [daily30, setDaily30]   = useState([]);
  const [monthly, setMonthly]   = useState([]);
  const [yearly,  setYearly]    = useState([]);
  const [heatmap, setHeatmap]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [chartTab, setChartTab] = useState('week');
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    try {
      const [oRes, d7Res, d30Res, mRes, yRes, hRes] = await Promise.all([
        getOverallStats(), getDailyStats(7), getDailyStats(30),
        getMonthlyStats(12), getYearlyStats(), getHeatmap(),
      ]);
      setOverall(oRes.data.data);
      setDaily7(d7Res.data.data);
      setDaily30(d30Res.data.data);
      setMonthly(mRes.data.data);
      setYearly(yRes.data.data);
      setHeatmap(hRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text2)', marginTop: 16, fontSize: '0.9rem' }}>Crunching your data...</p>
    </div>
  );

  const chartData = chartTab === 'week' ? daily7 : chartTab === 'month' ? daily30 : chartTab === 'months' ? monthly : yearly;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Deep insights into your focus habits.</p>
      </div>

      {/* ── Top stat row ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        {[
          { icon: 'today',        label: "Today",       value: formatDuration(overall?.today?.duration || 0),     color: 'var(--green)' },
          { icon: 'date_range',   label: "This Week",   value: formatDuration(overall?.thisWeek?.duration || 0),  color: 'var(--accent)' },
          { icon: 'calendar_month',label:"This Month",  value: formatDuration(overall?.thisMonth?.duration || 0), color: '#c084fc' },
          { icon: 'check_circle', label: "All Sessions",value: overall?.totalSessions || 0,                       color: 'var(--yellow)' },
          { icon: 'bolt',         label: "Avg Session", value: formatDuration(overall?.avgDuration || 0),         color: 'var(--orange)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-icon"><span className="mi mi-lg">{s.icon}</span></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Streaks ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={sectionTitle}>
          <span className="mi mi-sm" style={{ color: 'var(--orange)' }}>local_fire_department</span>
          Streaks
        </h2>
        <StreakCard current={overall?.currentStreak || 0} longest={overall?.longestStreak || 0} />
      </div>

      {/* ── Focus chart ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mi mi-sm" style={{ color: 'var(--accent)' }}>bar_chart</span>
            Focus Over Time
          </h2>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', padding: 4, borderRadius: 10 }}>
            <Tab label="7 Days"  active={chartTab==='week'}   onClick={() => setChartTab('week')} />
            <Tab label="30 Days" active={chartTab==='month'}  onClick={() => setChartTab('month')} />
            <Tab label="12 Mo"   active={chartTab==='months'} onClick={() => setChartTab('months')} />
            <Tab label="Yearly"  active={chartTab==='year'}   onClick={() => setChartTab('year')} />
          </div>
        </div>
        <BarChart data={chartData} height={200} today={today} />
        {/* Summary row */}
        <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
            Total: <strong style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono,monospace' }}>
              {formatDuration(chartData.reduce((a, d) => a + d.totalDuration, 0))}
            </strong>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
            Sessions: <strong style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono,monospace' }}>
              {chartData.reduce((a, d) => a + d.sessionCount, 0)}
            </strong>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
            Active days: <strong style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono,monospace' }}>
              {chartData.filter(d => d.totalDuration > 0).length}
            </strong>
          </div>
        </div>
      </div>

      {/* ── Category Donut + Heatmap ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h2 style={{ ...sectionTitle, marginBottom: 20 }}>
            <span className="mi mi-sm" style={{ color: '#c084fc' }}>donut_large</span>
            By Category
          </h2>
          <DonutChart data={overall?.byCategory || []} />
        </div>

        <div className="card">
          <h2 style={{ ...sectionTitle, marginBottom: 20 }}>
            <span className="mi mi-sm" style={{ color: 'var(--green)' }}>grid_on</span>
            Activity Heatmap
            <span style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>last 52 weeks</span>
          </h2>
          <Heatmap data={heatmap} />
        </div>
      </div>

      {/* ── Monthly breakdown table ── */}
      <div className="card">
        <h2 style={{ ...sectionTitle, marginBottom: 20 }}>
          <span className="mi mi-sm" style={{ color: 'var(--yellow)' }}>table_chart</span>
          Monthly Breakdown
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Month', 'Sessions', 'Focus Time', 'Daily Avg', 'Best Day'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...monthly].reverse().map((m, i) => {
                const daysInMonth = new Date(m.date.split('-')[0], m.date.split('-')[1], 0).getDate();
                const dailyAvg = m.sessionCount > 0 ? Math.floor(m.totalDuration / daysInMonth) : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 12px', color: 'var(--text)', fontWeight: 600 }}>{m.label}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--text2)', fontFamily: 'JetBrains Mono,monospace' }}>{m.sessionCount}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{formatDuration(m.totalDuration)}</td>
                    <td style={{ padding: '12px 12px', color: 'var(--text2)', fontFamily: 'JetBrains Mono,monospace' }}>{formatDuration(dailyAvg)}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', maxWidth: 80 }}>
                          <div style={{ height: '100%', width: `${Math.min((m.totalDuration / (monthly.reduce((a,x) => Math.max(a,x.totalDuration),1))) * 100, 100)}%`, background: 'var(--accent)', borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {monthly.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>No data yet. Start focusing!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const sectionTitle = {
  fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)',
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
};
