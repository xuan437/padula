import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon } from '../lib/sports';
import { MapPinIcon, FlameIcon, TrophyIcon } from '../components/Icons';

export default function LiveScoreboard() {
  const { matches } = useApp();
  const liveMatches = matches.filter(m => m.status === 'live');
  const allMatches = matches;

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Asian College Padula branding */}
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Asian College Padula Athletics</div>
          <h1 className="page-title">Live Scoreboard</h1>
          <p className="page-desc">Instant real-time court and arena scores with live broadcast updates</p>
        </div>
        <div className="header-badge live-pulse" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="live-dot" />
          <span style={{ fontWeight: 800, letterSpacing: '0.05em' }}>LIVE ON AIR</span>
        </div>
      </div>

      {/* Featured Live Matches Hero Cards */}
      {liveMatches.length > 0 && (
        <section>
          <div className="section-title-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="live-dot" /> Live Action Now
            </h2>
            <span className="badge-chip">
              <FlameIcon size={14} color="#ff3355" /> {liveMatches.length} Active Courts
            </span>
          </div>

          <div className="scoreboard-hero-grid">
            {liveMatches.map(m => (
              <div key={m.id} className="scoreboard-card glass-card">
                <div className="sb-header-row">
                  <div className="sb-sport" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="sport-icon-chip">{getSportIcon(m.sport, 16, 'var(--accent)')}</span>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{getSportName(m.sport)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.round}</span>
                  </div>
                  <div className="live-indicator">
                    <span className="live-dot" /> LIVE
                  </div>
                </div>

                <div className="sb-teams-row">
                  <div className="sb-team-col">
                    <div className="sb-team-name">{m.teamA}</div>
                    <div className="sb-team-score">{m.scoreA}</div>
                  </div>
                  <div className="sb-vs-col">
                    <span className="vs-badge">VS</span>
                  </div>
                  <div className="sb-team-col right">
                    <div className="sb-team-score">{m.scoreB}</div>
                    <div className="sb-team-name">{m.teamB}</div>
                  </div>
                </div>

                <div className="sb-footer-row">
                  <span className="sb-venue">
                    <MapPinIcon size={14} color="var(--text-muted)" /> {m.venue}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Scorer: {m.scorekeeper || 'Certified Official'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Scheduled & Finished Matches (Clean Real Table) */}
      <section>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <TrophyIcon size={18} color="var(--accent)" />
          <span>Tournament Schedule & Results</span>
        </h2>

        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 2.2fr 110px 140px 1.5fr 110px',
            padding: '12px 18px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            minWidth: '780px',
            alignItems: 'center',
          }}>
            <span>Sport</span>
            <span>Teams</span>
            <span style={{ textAlign: 'center' }}>Score</span>
            <span>Round</span>
            <span>Venue</span>
            <span style={{ textAlign: 'right' }}>Status</span>
          </div>

          <div style={{ minWidth: '780px' }}>
            {allMatches.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 2.2fr 110px 140px 1.5fr 110px',
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-light)',
                  alignItems: 'center',
                  fontSize: '13px',
                  transition: 'background var(--transition)',
                }}
                className="scoreboard-table-row"
              >
                {/* Sport */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getSportIcon(m.sport, 16, 'var(--accent)')}
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {getSportName(m.sport)}
                  </strong>
                </div>

                {/* Teams */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontWeight: m.winner === m.teamA ? 800 : 600,
                    color: m.winner === m.teamA ? 'var(--accent)' : 'var(--text-primary)',
                  }}>
                    {m.teamA}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700 }}>vs</span>
                  <span style={{
                    fontWeight: m.winner === m.teamB ? 800 : 600,
                    color: m.winner === m.teamB ? 'var(--accent)' : 'var(--text-primary)',
                  }}>
                    {m.teamB}
                  </span>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>
                  {m.status !== 'scheduled' ? (
                    <span style={{ color: m.status === 'live' ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {m.scoreA} – {m.scoreB}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>–</span>
                  )}
                </div>

                {/* Round */}
                <div style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  {m.round}
                </div>

                {/* Venue */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  <MapPinIcon size={12} color="var(--text-muted)" />
                  <span>{m.venue}</span>
                </div>

                {/* Status */}
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge ${m.status}`} style={{ fontSize: '10.5px', padding: '3px 8px' }}>
                    {m.status === 'live' && <span className="live-dot" />}
                    {m.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
