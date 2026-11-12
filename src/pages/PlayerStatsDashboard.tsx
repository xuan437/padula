import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CheckIcon } from '../components/Icons';
import type { Player } from '../types';

/* ─────────────────────────────────────────────────────────────────────────────
   PLAYER STATISTICS DASHBOARD
   Dark sports-analytics style modeled after professional football/esports apps.
   Shows: Profile card, performance chart, career history, season goals gauge,
          matchday log table, top scorers leaderboard.
───────────────────────────────────────────────────────────────────────────── */

// ── Token colours (Adapts cleanly to Light & Dark modes via CSS variables) ──
const C = {
  bg:        'var(--bg-app)',
  card:      'var(--bg-card)',
  cardBorder:'var(--border)',
  accent:    'var(--accent)',
  accentDim: 'var(--accent-light)',
  blue:      '#1e3a8a',
  green:     '#10b981',
  red:       '#dc2626',
  textP:     'var(--text-primary)',
  textS:     'var(--text-secondary)',
  textM:     'var(--text-muted)',
  border:    'var(--border)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: C.card,
  border: `1px solid ${C.cardBorder}`,
  borderRadius: '14px',
  padding: '20px',
  ...extra,
});

const label = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: C.textM,
  marginBottom: '4px',
  ...extra,
});

// ── Mini info box (DATE OF BIRTH, POSITION, etc.) ────────────────────────────
function InfoBox({ title, value, flag }: { title: string; value: string; flag?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${C.border}`,
      borderRadius: '10px',
      padding: '10px 14px',
    }}>
      <div style={label()}>{title}</div>
      <div style={{ fontSize: '13.5px', fontWeight: 700, color: C.textP, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {value} {flag && <span>{flag}</span>}
      </div>
    </div>
  );
}

// ── SVG Performance Line Chart ────────────────────────────────────────────────
function PerformanceChart({ currentPts }: { currentPts: number }) {
  const pts = [8, 15, currentPts];
  const max = Math.max(...pts, 50);
  const W = 260; const H = 110;
  const xs = [30, 130, W - 10];
  const ys = pts.map(p => H - 10 - ((p / max) * (H - 20)));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const area = `${path} L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`;
  const peakIdx = ys.indexOf(Math.min(...ys));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={0} y1={H * f} x2={W} y2={H * f} stroke={C.border} strokeWidth={1} />
      ))}
      {/* Area fill */}
      <path d={area} fill="url(#chartFill)" />
      {/* Line */}
      <path d={path} fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinejoin="round" />
      {/* Dots */}
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={i === xs.length-1 ? 7 : 5}
          fill={C.accent} stroke="#0a0d16" strokeWidth={2} />
      ))}
      {/* Peak form callout */}
      {peakIdx >= 0 && (
        <g>
          <rect x={xs[peakIdx] - 38} y={ys[peakIdx] - 28} width={76} height={22} rx={6}
            fill="rgba(249,115,22,0.9)" />
          <text x={xs[peakIdx]} y={ys[peakIdx] - 13} textAnchor="middle"
            fill="#fff" fontSize={10} fontWeight={700}>Peak form</text>
        </g>
      )}
      {/* X-axis labels */}
      {['Pre-Season', 'Intramurals QF', 'Current Semis'].map((lbl, i) => (
        <text key={i} x={xs[i]} y={H + 14} textAnchor="middle"
          fill={C.textM} fontSize={9}>{lbl}</text>
      ))}
    </svg>
  );
}

// ── SVG Donut/Gauge for season points ────────────────────────────────────────
function SeasonGauge({ total, intramurals, exhibition }: { total: number; intramurals: number; exhibition: number }) {
  const r = 48; const cx = 70; const cy = 70;
  const circ = 2 * Math.PI * r;
  const fraction = Math.min(total / 60, 1); // 60 is a rough max
  const dash = circ * fraction;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} />
          {/* Value arc */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth={12}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`} />
          {/* Inner text */}
          <text x={cx} y={cy - 6} textAnchor="middle" fill={C.textP} fontSize={28} fontWeight={900}>{total}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill={C.textM} fontSize={10} fontWeight={600}>TOTAL POINTS</text>
        </svg>
      </div>
      <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: C.textP }}>{intramurals}</div>
          <div style={{ fontSize: '11px', color: C.textM }}>Intramurals</div>
        </div>
        <div style={{ width: '1px', background: C.border }} />
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: C.textP }}>{exhibition}</div>
          <div style={{ fontSize: '11px', color: C.textM }}>Exhibition</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PlayerStatsDashboard({ playerId }: { playerId?: string }) {
  const { players, departments, teams, setActiveView, currentUser } = useApp();
  const isPlayer = currentUser?.role === 'player';

  const defaultPlayer = players.find(p => p.id === 'p1') || players[0];
  const [selectedId, setSelectedId] = useState(playerId || defaultPlayer?.id || '');
  const activePlayer: Player | undefined = players.find(p => p.id === selectedId) || defaultPlayer;

  if (!activePlayer) {
    return (
      <div style={{ color: C.textP, padding: '40px', textAlign: 'center' }}>
        No player data found.
        <button onClick={() => setActiveView('player')} style={{ marginLeft: '16px', color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
      </div>
    );
  }

  const dept = departments.find(d => d.id === activePlayer.department);
  const team = teams.find(t => t.id === activePlayer.teamId);

  const currentSeasonGoals = activePlayer.currentSeasonGoals ?? activePlayer.intGoals ?? 0;
  const intramuralsGoals   = activePlayer.intGoals ?? 0;
  const exhibitionGoals    = Math.max(0, currentSeasonGoals - intramuralsGoals);

  const careerHistory = activePlayer.careerHistory || [];
  const matchStats = activePlayer.matchStats || [];

  const topScorers = useMemo(() => {
    return players
      .filter(p => p.sport === activePlayer.sport)
      .map(p => {
        const pDept = departments.find(d => d.id === p.department);
        return {
          name: p.name,
          dept: pDept?.shortName || pDept?.name || 'Padula',
          pts: p.currentSeasonGoals ?? p.intGoals ?? 0,
        };
      })
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 6)
      .map((p, idx) => ({ rank: idx + 1, ...p }));
  }, [players, departments, activePlayer.sport]);

  const initials = activePlayer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isMe = (name: string) => name === activePlayer.name;

  const resultColor = (r: string) =>
    r.startsWith('W') ? C.green : r.startsWith('L') ? C.red : '#fbbf24';

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'inherit', color: C.textP }}>

      {/* ── Top navigation bar — hidden for players ─────────────────────────── */}
      {!isPlayer && (
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setActiveView('player')}
            style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Padula Athletics
          </button>
          <span style={{ fontSize: '12px', color: C.textM }}>
            Athletes Database › <span style={{ color: C.textS }}>{dept?.shortName || 'BAA'}</span> ›{' '}
            <span style={{ color: C.textP, fontWeight: 600 }}>{activePlayer.name}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.textM, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Switch Athlete:</span>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{ background: 'var(--bg-surface)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 12px', fontSize: '12.5px', color: C.textP, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {players.map(p => (
              <option key={p.id} value={p.id}>
                #{p.jerseyNumber} {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1280px', margin: '0 auto' }}>

        {/* ── PROFILE CARD ─────────────────────────────────────────────────── */}
        <div style={card({ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start', padding: '24px' })}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.accent}, #dc2626)`,
              border: '3px solid rgba(249,115,22,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: 900, color: '#fff',
            }}>
              {initials}
            </div>
            <div style={{
              position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
              background: C.accent, color: '#fff', fontSize: '11px', fontWeight: 900,
              padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap',
            }}>
              #{activePlayer.jerseyNumber}
            </div>
          </div>

          {/* Name & details */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: C.textM, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
              {dept?.name || 'Business Administration & Accountancy (BAA)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '34px', fontWeight: 900, margin: 0, color: C.textP, letterSpacing: '-0.01em' }}>
                {activePlayer.name}
              </h1>
              {activePlayer.medicalCleared && (
                <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: C.green, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CheckIcon size={11} color={C.green} /> ELIGIBLE
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: C.accent, fontWeight: 700, marginTop: '4px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activePlayer.position || 'Athlete'}
            </div>
            <div style={{ fontSize: '12.5px', color: C.textS, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>Student ID: <strong style={{ color: C.textP }}>{activePlayer.studentId}</strong></span>
              <span>GWA: <strong style={{ color: C.textP }}>1.76</strong></span>
              {team && <span>Team: <strong style={{ color: C.textP }}>{team.name}</strong></span>}
            </div>
          </div>

          {/* Info boxes grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flexShrink: 0, minWidth: '260px' }}>
            <InfoBox title="Date of Birth"   value={activePlayer.dateOfBirth || '2003-07-15'} />
            <InfoBox title="Position"        value={activePlayer.position    || 'Small Forward'} />
            <InfoBox title="Matches Played"  value={String(matchStats.length)} />
            <InfoBox title="Hometown"        value={activePlayer.placeOfBirth || 'Dumaguete, PH'} />
            <InfoBox title="Sports Director" value="Mr. John Eric Samane" />
            <InfoBox title="Season Points"   value={String(currentSeasonGoals)} />
          </div>
        </div>

        {/* ── ROW: Performance chart | Career history | Season gauge ───────── */}
        <div style={{ display: 'grid', gridTemplateColumns: isPlayer ? '1fr 1fr' : '1fr 1fr 1fr', gap: '16px' }}>

          {/* Performance & Scoring Index — hidden for players */}
          {!isPlayer && (
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={label()}>Performance & Scoring Index</div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.accent }}>
                Current: {currentSeasonGoals} pts
              </span>
            </div>
            <PerformanceChart currentPts={currentSeasonGoals} />
          </div>
          )}

          {/* Collegiate Career History */}
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={label({ marginBottom: 0 })}>Collegiate Career History</div>
              <div style={{ fontSize: '11px', color: C.textM, display: 'flex', gap: '10px' }}>
                <span>App</span><span>Goals</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {careerHistory.length === 0 ? (
                <div style={{ padding: '24px 10px', textAlign: 'center', color: C.textM, fontSize: '12px' }}>
                  No prior collegiate seasons on file.
                </div>
              ) : (
                careerHistory.map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: i === 0 ? C.accentDim : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === 0 ? 'rgba(249,115,22,0.3)' : C.border}`,
                    borderRadius: '10px', padding: '10px 14px',
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', color: C.textM, fontWeight: 600 }}>{row.season}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: C.textP }}>{row.team}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '18px', fontSize: '14px', fontWeight: 700 }}>
                      <span style={{ color: C.textS }}>{row.matches}</span>
                      <span style={{ color: C.accent }}>{row.goals}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Points in Current Season */}
          <div style={card({ display: 'flex', flexDirection: 'column', alignItems: 'center' })}>
            <div style={{ ...label(), marginBottom: '16px', textAlign: 'center', width: '100%' }}>Points in Current Season</div>
            <SeasonGauge total={currentSeasonGoals} intramurals={intramuralsGoals} exhibition={exhibitionGoals} />
          </div>

        </div>

        {/* ── ROW: Matchday log | Top scorers leaderboard ──────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px' }}>

          {/* Matchday Performance Logs */}
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.textP }}>Matchday Performance Logs</div>
              <span style={{ fontSize: '11px', color: C.textM }}>Last {matchStats.length} Matches</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    {['Matchday','Venue','For','Against','Result','Pts','Ast','Reb','Mins'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Matchday' ? 'left' : 'center', color: C.textM, fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${C.border}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matchStats.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '24px 8px', textAlign: 'center', color: C.textM }}>
                        No official matches recorded yet for this athlete.
                      </td>
                    </tr>
                  ) : (
                    matchStats.map((m: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '10px 8px', fontWeight: 700, color: C.accent }}>{m.matchday}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: m.venue === 'H' ? C.green : C.blue, fontWeight: 700, fontSize: '11px' }}>{m.venue}</td>
                        <td style={{ padding: '10px 8px', color: C.textS, textAlign: 'center' }}>{m.opponent || 'Padula'}</td>
                        <td style={{ padding: '10px 8px', color: C.textS, textAlign: 'center' }}>{m.against || m.opponent}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: resultColor(m.result) }}>{m.result}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: C.textP }}>{m.points}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: C.textS }}>{m.assists}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: C.textS }}>{m.rebounds}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: C.textM }}>{m.mins || m.minutes + "'"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Scorers Leaderboard */}
          <div style={card()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: C.textP }}>Top Scorers Leaderboard</div>
              <span style={{ fontSize: '11px', color: C.accent, fontWeight: 600 }}>Intramurals 2026</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {topScorers.length === 0 ? (
                <div style={{ padding: '24px 10px', textAlign: 'center', color: C.textM, fontSize: '12px' }}>
                  No tournament scorers recorded yet.
                </div>
              ) : (
                topScorers.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '10px',
                    background: isMe(s.name) ? C.accentDim : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isMe(s.name) ? 'rgba(249,115,22,0.35)' : C.border}`,
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.textM, minWidth: '18px' }}>{s.rank}.</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: isMe(s.name) ? 800 : 600, color: isMe(s.name) ? C.textP : C.textS }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '10px', color: C.textM }}>{s.dept}</div>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: C.accent }}>{s.pts}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
