import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PrinterIcon, SparklesIcon } from '../components/Icons';

type AnalyticsTab = 'overview' | 'sports' | 'archive' | 'reports';

function MinimalBarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '85px', fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0, textAlign: 'right' }}>
              {d.label}
            </div>
            <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: '4px', height: '18px', overflow: 'hidden' }}>
              <div style={{
                width: `${(d.value / max) * 100}%`, height: '100%',
                background: 'var(--accent)',
                borderRadius: '4px', transition: 'width 0.4s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{d.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { matches, teams, players, departments, events, auditLogs, computeMedalTally, setActiveView } = useApp();
  const [tab, setTab] = useState<AnalyticsTab>('overview');

  const finished      = matches.filter(m => m.status === 'finished' && !m.isBye);
  const live          = matches.filter(m => m.status === 'live');
  const totalGoals    = finished.reduce((s, m) => s + m.scoreA + m.scoreB, 0);
  const avgScore      = finished.length ? (totalGoals / finished.length / 2).toFixed(1) : '—';
  const medalTally    = computeMedalTally();
  const archived      = events.filter(e => e.archived);

  const teamScores = teams.map(t => ({
    label: t.name,
    value: finished.filter(m => m.teamA === t.name || m.teamB === t.name).reduce((s, m) => s + (m.teamA === t.name ? m.scoreA : m.scoreB), 0),
  })).sort((a, b) => b.value - a.value).slice(0, 6);

  const deptWins = departments.map(d => {
    const deptTeams = teams.filter(t => t.department === d.id).map(t => t.name);
    const wins = finished.filter(m => deptTeams.includes(m.winner ?? '')).length;
    return { label: d.shortName, value: wins };
  }).sort((a, b) => b.value - a.value);

  const sportMatchCounts = [
    { label: 'Basketball', value: matches.filter(m => m.sport === 's1').length },
    { label: 'Volleyball',  value: matches.filter(m => m.sport === 's2').length },
    { label: 'Badminton',   value: matches.filter(m => m.sport === 's3').length },
    { label: 'Others',      value: matches.filter(m => !['s1','s2','s3'].includes(m.sport)).length },
  ].filter(d => d.value > 0);

  const printReport = () => window.print();

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">System Metrics</div>
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-desc">Tournament data analysis, scoring distributions, and printable summaries</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-primary" onClick={() => setActiveView('predictions')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SparklesIcon size={14} /> Prediction AI Engine
          </button>
          <button className="btn btn-sm btn-ghost" onClick={printReport}>
            <PrinterIcon size={14} /> Print Summary
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'sports',   label: 'Sport Metrics' },
          { id: 'archive',  label: 'Archive' },
          { id: 'reports',  label: 'Print Reports' },
        ] as { id: AnalyticsTab; label: string }[]).map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Key Stat Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            <StatCard label="Total Matches"     value={matches.length}      sub={`${live.length} active live`} />
            <StatCard label="Completed"          value={finished.length}     sub="official results" />
            <StatCard label="Teams Registered"   value={teams.length}        sub="across 6 colleges" />
            <StatCard label="Athletes"           value={players.length}      sub={`${players.filter(p=>p.medicalCleared).length} cleared`} />
            <StatCard label="Total Points"       value={totalGoals}          sub="tournament points" />
            <StatCard label="Avg Score / Match"  value={avgScore}            sub="points per side" />
          </div>

          {/* Minimal Clean Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <MinimalBarChart data={teamScores} label="Points Scored by Team" />
            </div>
            <div className="glass-card" style={{ padding: '20px' }}>
              <MinimalBarChart data={deptWins} label="Match Wins by Department" />
            </div>
          </div>

          {/* Medal Tally Preview */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px' }}>
              Department Medal Standings
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
              {medalTally.slice(0, 6).map((row, idx) => {
                const dept = departments.find(d => d.id === row.departmentId);
                return (
                  <div key={row.departmentId} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{dept?.shortName ?? row.departmentName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>#{idx + 1}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ color: '#eab308' }}>Gold: {row.gold}</span>
                      <span style={{ color: '#94a3b8' }}>Silver: {row.silver}</span>
                      <span style={{ color: '#b45309' }}>Bronze: {row.bronze}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'sports' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <MinimalBarChart data={sportMatchCounts} label="Matches per Sport Discipline" />
        </div>
      )}

      {tab === 'archive' && (
        <div>
          {archived.length === 0 ? (
            <div className="empty-state glass-card">No archived tournaments on record.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {archived.map(ev => (
                <div key={ev.id} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{ev.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ev.category} · {ev.dates}</div>
                  </div>
                  <span className="badge-chip">Archived</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              Printable Tournament Summaries
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { title: 'Official Results Report', desc: 'All completed matches and verified winners' },
                { title: 'Department Medal Tally', desc: 'Gold, silver, bronze counts' },
                { title: 'Athlete Roster List', desc: 'Registered student athletes by team' },
                { title: 'Audit Trail Export', desc: `${auditLogs.length} logged system events` },
              ].map(r => (
                <button
                  key={r.title}
                  className="btn btn-ghost"
                  onClick={printReport}
                  style={{ textAlign: 'left', padding: '14px', flexDirection: 'column', alignItems: 'flex-start', height: 'auto' }}
                >
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{r.title}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{r.desc}</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '8px', fontWeight: 600 }}>Print →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
