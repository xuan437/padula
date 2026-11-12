import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon } from '../lib/sports';
import {
  ClipboardIcon,
  FlameIcon,
  CheckIcon,
  CalendarIcon,
  MapPinIcon,
  ShieldIcon,
  BracketsIcon,
  MedalIcon,
  ClockIcon,
} from '../components/Icons';
import type { Match } from '../types';

export default function ScorerDashboard() {
  const { matches, officials, currentUser, setActiveView } = useApp();

  // Find official record for current scorer
  const myOfficial = useMemo(() => {
    return officials.find(
      o =>
        o.role === 'scorekeeper' &&
        (o.name.toLowerCase() === currentUser?.name?.toLowerCase() ||
          o.contact?.toLowerCase() === currentUser?.email?.toLowerCase())
    );
  }, [officials, currentUser]);

  // Demo / Official Scorekeeper can view and score every available match across all sports
  const myMatches = useMemo(() => {
    return matches;
  }, [matches]);

  const liveMatches = myMatches.filter(m => m.status === 'live');
  const scheduledMatches = myMatches.filter(m => m.status === 'scheduled');
  const completedMatches = myMatches.filter(m => m.status === 'finished');

  // Currently focused match (live first, then next scheduled)
  const currentFocusMatch: Match | undefined = liveMatches[0] || scheduledMatches[0];

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Asian College Padula Athletics · Officiating Hub</div>
          <h1 className="page-title">Scorer Dashboard</h1>
          <p className="page-desc">Overview of your assigned sports, match assignments, duty schedule, and officiating status</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => setActiveView('scorekeeper')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
          >
            <ClipboardIcon size={16} /> Open Scoring Desk
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setActiveView('bracket')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <BracketsIcon size={16} /> Brackets & Schedule
          </button>
        </div>
      </div>

      {/* ── Duty & Official Identity Hero Card ── */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(220,38,38,0.14) 0%, rgba(15,23,42,0.85) 100%)',
          border: '1px solid rgba(220,38,38,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent) 0%, #991b1b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 900,
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
              flexShrink: 0,
            }}
          >
            {currentUser?.avatarInitials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SC')}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentUser?.name || 'Official Scorer'}
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10b981',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <span className="live-dot" style={{ background: '#10b981' }} /> Active On-Duty
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <ShieldIcon size={14} color="var(--accent)" />
                {myOfficial?.role ? 'Certified Official Scorer' : 'Scorekeeper Panel'}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {getSportIcon(myOfficial?.sport || 's1', 14, 'var(--accent)')}
                Assigned Sport: <strong style={{ color: 'var(--text-primary)' }}>{myOfficial?.sport || 'All Sports'}</strong>
              </span>
              {myOfficial?.licenseId && (
                <>
                  <span>•</span>
                  <span>License #{myOfficial.licenseId}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setActiveView('scorekeeper')}
            style={{
              padding: '10px 18px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
            }}
          >
            <FlameIcon size={16} /> Go to Scoring Desk
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Assigned Matches</span>
            <ClipboardIcon size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }}>{myMatches.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across {myOfficial?.sport || 'Padula 2026'} disciplines
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>Active Live Now</span>
            <FlameIcon size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#ef4444' }}>{liveMatches.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {liveMatches.length > 0 ? 'Requires immediate scoring' : 'No active game in progress'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Upcoming / Scheduled</span>
            <ClockIcon size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }}>{scheduledMatches.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Ready to be started
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Finalized & Locked</span>
            <CheckIcon size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981' }}>{completedMatches.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Official records verified
          </div>
        </div>
      </div>

      {/* ── Currently Active / Next Up Duty Focus ── */}
      {currentFocusMatch && (
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            border: currentFocusMatch.status === 'live' ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)',
            background: currentFocusMatch.status === 'live' ? 'rgba(239,68,68,0.06)' : 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: currentFocusMatch.status === 'live' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                  color: currentFocusMatch.status === 'live' ? '#ef4444' : '#3b82f6',
                }}
              >
                {currentFocusMatch.status === 'live' ? '● CURRENT LIVE MATCH' : 'NEXT SCHEDULED MATCH'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {getSportName(currentFocusMatch.sport)} — {currentFocusMatch.round}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPinIcon size={13} /> {currentFocusMatch.venue}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '16px',
              background: 'var(--bg-elevated)',
              borderRadius: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ textAlign: 'center', minWidth: '140px' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{currentFocusMatch.teamA}</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', marginTop: '4px' }}>
                {currentFocusMatch.scoreA}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>VS</div>
              <span className={`status-badge ${currentFocusMatch.status}`} style={{ marginTop: '6px', display: 'inline-block' }}>
                {currentFocusMatch.status.toUpperCase()}
              </span>
            </div>

            <div style={{ textAlign: 'center', minWidth: '140px' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{currentFocusMatch.teamB}</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)', marginTop: '4px' }}>
                {currentFocusMatch.scoreB}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setActiveView('scorekeeper')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <ClipboardIcon size={16} /> Enter Score in Scoring Desk →
            </button>
          </div>
        </div>
      )}

      {/* ── My Assigned Matches Schedule ── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            <CalendarIcon size={18} color="var(--accent)" />
            <span>My Duty Schedule ({myMatches.length} Matches)</span>
          </h2>

          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setActiveView('scorekeeper')}
            style={{ fontSize: '12px', color: 'var(--accent)' }}
          >
            View All in Scoring Desk →
          </button>
        </div>

        {myMatches.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No matches currently assigned.
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase' }}>Sport & Round</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase' }}>Matchup</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase' }}>Score</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase' }}>Venue</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '11.5px', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myMatches.map(m => {
                    const isFin = m.status === 'finished';
                    const isLiv = m.status === 'live';
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getSportIcon(m.sport, 16, 'var(--accent)')}
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{getSportName(m.sport)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.round}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 600, color: m.winner === m.teamA ? 'var(--accent)' : 'inherit' }}>{m.teamA}</span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>vs</span>
                          <span style={{ fontWeight: 600, color: m.winner === m.teamB ? 'var(--accent)' : 'inherit' }}>{m.teamB}</span>
                        </td>

                        <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: '14px' }}>
                          {isFin || isLiv ? `${m.scoreA} – ${m.scoreB}` : '—'}
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPinIcon size={12} /> {m.venue}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span className={`status-badge ${m.status}`}>
                            {isLiv && <span className="live-dot" />}
                            {m.status.toUpperCase()}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            className={`btn btn-xs ${isLiv ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setActiveView('scorekeeper')}
                            style={{ fontWeight: 700 }}
                          >
                            {isLiv ? 'Record Score' : isFin ? 'View Desk' : 'Start Scoring'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Quick Navigation & Guidelines ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        <div
          className="glass-card"
          style={{ padding: '18px', cursor: 'pointer' }}
          onClick={() => setActiveView('scorekeeper')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ClipboardIcon size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Live Scoring Desk</h3>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Access point increments, foul tracking, volleyball set breakdowns, and lock official match results.
          </p>
        </div>

        <div
          className="glass-card"
          style={{ padding: '18px', cursor: 'pointer' }}
          onClick={() => setActiveView('bracket')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <BracketsIcon size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Brackets & Match Tree</h3>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Track tournament advancement and 16-team single elimination trees across all 9 sports.
          </p>
        </div>

        <div
          className="glass-card"
          style={{ padding: '18px', cursor: 'pointer' }}
          onClick={() => setActiveView('scorers')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <MedalIcon size={20} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Top Scorers Leaderboard</h3>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Review athlete individual statistics, goal leaders, and department scoring records.
          </p>
        </div>
      </div>
    </div>
  );
}
