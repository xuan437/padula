import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import { predictMatch } from '../lib/predictionAi';
import { MapPinIcon, FlameIcon, TrophyIcon, SparklesIcon, XIcon, LiveIcon } from '../components/Icons';
import AIPredictionModal from '../components/AIPredictionModal';
import { PageHeader, SportFilter, Badge, EmptyState } from '../components/ui';
import type { Match } from '../types';

export default function LiveScoreboard() {
  const { matches, teams, players, events, venues } = useApp();
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [selectedAiMatch, setSelectedAiMatch] = useState<Match | null>(null);
  const [tvMode, setTvMode] = useState(false);
  const [tvIndex, setTvIndex] = useState(0);

  const validMatches = matches.filter(
    m => !m.isBye && !(isPlaceholder(m.teamA) && isPlaceholder(m.teamB))
  );

  const sportCounts: Record<string, number> = {};
  validMatches.forEach(m => {
    sportCounts[m.sport] = (sportCounts[m.sport] || 0) + 1;
  });

  const filteredMatches = selectedSport === 'ALL'
    ? validMatches
    : validMatches.filter(m => m.sport === selectedSport);

  const liveMatches = filteredMatches.filter(
    m => m.status === 'live' && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB)
  );

  const allLiveMatches = validMatches.filter(
    m => m.status === 'live' && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB)
  );

  // Auto-rotate TV scoreboard every 6 seconds
  const tvPool = allLiveMatches.length > 0 ? allLiveMatches : validMatches.slice(0, 6);
  useEffect(() => {
    if (!tvMode || tvPool.length <= 1) return;
    const t = window.setInterval(() => {
      setTvIndex(prev => (prev + 1) % tvPool.length);
    }, 6000);
    return () => window.clearInterval(t);
  }, [tvMode, tvPool.length]);

  const getMatchInfo = (m: Match) => {
    const ev = events.find(e => e.id === m.eventId || e.sport === m.sport);
    const venueName = m.venue || ev?.venue || 'Main Arena Court 1';
    const venueObj = venues.find(v => v.name.toLowerCase() === venueName.toLowerCase());
    const format = m.format || ev?.format || (m.round.toLowerCase().includes('round robin') ? 'round_robin' : 'single_elimination');
    const formatLabel = format === 'round_robin' ? 'Round Robin' : 'Single Elimination';
    let dateStr = m.scheduledDate || ev?.startDate || 'Nov 12, 2026';
    let timeStr = m.scheduledTime || ev?.startTime || '09:00 AM';
    if (m.scheduledTime && m.scheduledTime.includes('T')) {
      const d = new Date(m.scheduledTime);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
        timeStr = d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      }
    }
    return {
      venueName,
      venueLocation: venueObj?.location || 'Asian College Dumaguete',
      format,
      formatLabel,
      dateStr,
      timeStr,
    };
  };

  // Fullscreen TV Broadcast Mode
  if (tvMode && tvPool.length > 0) {
    const currentTvMatch = tvPool[tvIndex % tvPool.length];
    const tvInfo = getMatchInfo(currentTvMatch);
    const isFinished = currentTvMatch.status === 'finished';

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 20000,
          background: 'radial-gradient(circle at top, #131f3a 0%, #050914 75%)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 48px',
        }}
      >
        {/* TV Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="padula-athletic-text" style={{ fontSize: 24, color: '#ef4444' }}>
              PADULA 2026 TV BROADCAST
            </span>
            <Badge tone={currentTvMatch.status === 'live' ? 'live' : currentTvMatch.status === 'finished' ? 'success' : 'warning'} pulse={currentTvMatch.status === 'live'}>
              {currentTvMatch.status === 'live' ? 'LIVE ON AIR' : currentTvMatch.status.toUpperCase()}
            </Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              Match {(tvIndex % tvPool.length) + 1} of {tvPool.length} (Auto-Rotating)
            </span>
            <button
              type="button"
              onClick={() => setTvMode(false)}
              className="btn btn-outline btn-sm"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <XIcon size={14} /> Exit TV Mode
            </button>
          </div>
        </div>

        {/* TV Center Arena Display */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: '#cbd5e1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {getSportName(currentTvMatch.sport)} · {currentTvMatch.round} · {tvInfo.venueName}
          </div>

          <div className="tv-arena-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 14, color: currentTvMatch.winner === currentTvMatch.teamA ? '#34d399' : '#ffffff' }}>
                {currentTvMatch.teamA}
              </div>
              <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, color: '#ef4444', fontFamily: 'var(--font-display)' }}>
                {currentTvMatch.scoreA}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#94a3b8', padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                VS
              </span>
              {currentTvMatch.periodScores && currentTvMatch.periodScores.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {currentTvMatch.periodScores.map(ps => (
                    <div key={ps.label} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', fontSize: 12, textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontWeight: 700 }}>{ps.label}</div>
                      <div style={{ fontWeight: 800, color: '#f8fafc' }}>{ps.scoreA}–{ps.scoreB}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 14, color: currentTvMatch.winner === currentTvMatch.teamB ? '#34d399' : '#ffffff' }}>
                {currentTvMatch.teamB}
              </div>
              <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, color: '#3b82f6', fontFamily: 'var(--font-display)' }}>
                {currentTvMatch.scoreB}
              </div>
            </div>
          </div>

          {isFinished && currentTvMatch.winner && (
            <div
              style={{
                padding: '14px 32px',
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(16,185,129,0.22), rgba(59,130,246,0.22))',
                border: '2px solid #34d399',
                fontSize: 22,
                fontWeight: 900,
                color: '#6ee7b7',
                letterSpacing: '0.05em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <TrophyIcon size={24} color="#6ee7b7" />
              <span>OFFICIAL WINNER: {currentTvMatch.winner.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* TV Bottom Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#94a3b8' }}>
          <span>Asian College Dumaguete · Padula Sports Analytics</span>
          <span>Scorer: {currentTvMatch.scorekeeper || 'Official Scorer'} · Referee: {currentTvMatch.referee || 'Assigned Referee'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="Competition"
        title="Live Scoreboard"
        description="Real-time court and arena scores with period breakdowns, venue assignments, and live win probability."
        badge={
          allLiveMatches.length > 0 ? (
            <Badge tone="live" pulse>
              LIVE ON AIR ({allLiveMatches.length})
            </Badge>
          ) : (
            <Badge tone="neutral">No live matches</Badge>
          )
        }
        actions={
          <button
            type="button"
            onClick={() => setTvMode(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <LiveIcon size={14} /> Launch TV Scoreboard
          </button>
        }
      />

      {/* Unified SportFilter */}
      <SportFilter
        value={selectedSport}
        onChange={setSelectedSport}
        counts={sportCounts}
      />

      {/* Featured Live Matches Hero Cards */}
      {liveMatches.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-dot" style={{ background: 'var(--color-live)' }} /> Live Action Now
            </h2>
            <span className="badge-chip">
              <FlameIcon size={14} color="var(--color-live)" /> {liveMatches.length} Active {liveMatches.length === 1 ? 'Court' : 'Courts'}
            </span>
          </div>

          <div className="scoreboard-hero-grid">
            {liveMatches.map(m => {
              const pred = predictMatch(m.teamA, m.teamB, m.sport, matches, teams, players, m);
              const info = getMatchInfo(m);
              return (
                <div key={m.id} className="scoreboard-card glass-card">
                  <div className="sb-header-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="sport-icon-chip">{getSportIcon(m.sport, 16, 'var(--accent)')}</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{getSportName(m.sport)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.round}</span>
                      <Badge tone="neutral">{info.formatLabel}</Badge>
                    </div>
                    <Badge tone="live" pulse>LIVE</Badge>
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

                  {m.periodScores && m.periodScores.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {m.periodScores.map(ps => (
                        <span
                          key={ps.label}
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {ps.label}: <strong style={{ color: 'var(--text-primary)' }}>{ps.scoreA}–{ps.scoreB}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {pred && (
                    <div
                      onClick={() => setSelectedAiMatch(m)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <SparklesIcon size={13} color="var(--accent)" /> Win Estimate: <strong style={{ color: 'var(--text-primary)' }}>{pred.predictedWinner}</strong> ({pred.predictedWinnerProb}%)
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                          Factors ↗
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 5, background: 'rgba(59, 130, 246, 0.35)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${pred.winProbA}%`, background: 'var(--accent)' }} />
                        <div style={{ width: `${pred.winProbB}%`, background: '#3b82f6' }} />
                      </div>
                    </div>
                  )}

                  <div className="sb-footer-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPinIcon size={13} color="var(--accent)" /> {info.venueName} · {info.dateStr} · {info.timeStr}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Scorer: {m.scorekeeper || 'Official Scorer'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Responsive Match Schedule & Results */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TrophyIcon size={17} color="var(--accent)" />
          <span>All Matches ({filteredMatches.length})</span>
        </h2>

        {filteredMatches.length === 0 ? (
          <EmptyState
            title="No matches found for this filter"
            description="Try selecting All Sports or seed demo tournament data from the top bar."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filteredMatches.map(m => {
              const teamAName = isPlaceholder(m.teamA) ? 'TBD' : m.teamA;
              const teamBName = isPlaceholder(m.teamB) ? 'TBD' : m.teamB;
              const info = getMatchInfo(m);
              const tone = m.status === 'live' ? 'live' : m.status === 'finished' ? 'success' : 'warning';
              return (
                <div
                  key={m.id}
                  className="glass-card"
                  style={{
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {getSportIcon(m.sport, 15, 'var(--accent)')}
                      <strong style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{getSportName(m.sport)}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{m.round}</span>
                    </div>
                    <Badge tone={tone} pulse={m.status === 'live'}>
                      {m.status === 'live' ? 'LIVE' : m.status === 'finished' ? 'COMPLETED' : 'UPCOMING'}
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontWeight: m.winner === m.teamA ? 800 : 600, color: m.winner === m.teamA ? 'var(--color-success)' : 'var(--text-primary)', fontSize: 13.5 }}>
                      {teamAName}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: m.status === 'live' ? 'var(--color-live)' : 'var(--text-primary)', padding: '2px 10px' }}>
                      {m.status === 'scheduled' ? 'VS' : `${m.scoreA} – ${m.scoreB}`}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: m.winner === m.teamB ? 800 : 600, color: m.winner === m.teamB ? 'var(--color-success)' : 'var(--text-primary)', fontSize: 13.5 }}>
                      {teamBName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <MapPinIcon size={12} color="var(--accent)" /> {info.venueName}
                    </span>
                    <span>{info.dateStr} · {info.timeStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedAiMatch && (
        <AIPredictionModal
          match={selectedAiMatch}
          onClose={() => setSelectedAiMatch(null)}
        />
      )}
    </div>
  );
}
