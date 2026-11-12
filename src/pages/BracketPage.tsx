import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPinIcon, TrophyIcon } from '../components/Icons';
import TournamentTreeBracket from '../components/TournamentTreeBracket';
import { isPlaceholder, getRoundName } from '../lib/bracket';

type AppState = ReturnType<typeof useApp>;
type BracketMatch = AppState['matches'][number];
type Venue = AppState['venues'][number];

function ConflictWarning({ warning }: { warning: string }) {
  return (
    <div style={{
      background: 'var(--badge-warn-bg)', border: '1px solid var(--badge-warn-border)',
      borderRadius: '6px', padding: '6px 10px', marginTop: '8px',
      fontSize: '12px', color: 'var(--badge-warn-text)', fontWeight: 500,
    }}>
      ⚠️ {warning}
    </div>
  );
}

function BracketMatchCard({ match, onAssignVenue, venues, onOpenScoringDesk }: {
  match: BracketMatch;
  onAssignVenue: (matchId: string, venue: string) => void;
  venues: Venue[];
  onOpenScoringDesk?: (matchId: string) => void;
}) {
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isTBD = isPlaceholder(match.teamA) || isPlaceholder(match.teamB);

  return (
    <div className="glass-card" style={{ padding: '14px 16px', opacity: isTBD ? 0.7 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {match.round}
        </span>
        <span className={`status-badge ${match.status}`}>
          {isLive && <span className="live-dot" />}
          {match.status.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: match.winner === match.teamA ? 700 : 500,
            fontSize: '13px',
            color: match.winner === match.teamA ? 'var(--accent)' : 'inherit',
          }}>
            {match.teamA || 'TBD'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
          <span>{match.scoreA}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>–</span>
          <span>{match.scoreB}</span>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{
            fontWeight: match.winner === match.teamB ? 700 : 500,
            fontSize: '13px',
            color: match.winner === match.teamB ? 'var(--accent)' : 'inherit',
          }}>
            {match.teamB || 'TBD'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPinIcon size={12} /> {match.venue || 'No venue yet'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Scorer: {match.scorekeeper || 'Unassigned'}
        </div>
      </div>

      {!isFinished && !isTBD && (
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
            value={match.venue ?? ''}
            disabled={isLive}
            onChange={e => onAssignVenue(match.id, e.target.value)}
          >
            <option value="" disabled>Select venue…</option>
            {venues.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
          </select>
          {onOpenScoringDesk && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}
              onClick={() => onOpenScoringDesk(match.id)}
            >
              Scoring Desk ↗
            </button>
          )}
        </div>
      )}

      {match.conflictWarning && <ConflictWarning warning={match.conflictWarning} />}
    </div>
  );
}

export default function BracketPage() {
  const {
    events, matches, venues, teams,
    assignMatchOfficials, startMatch, generateBracket, computeStandings,
    setActiveView, currentUser,
  } = useApp();

  const [selectedEventId, setSelectedEventId] = useState<string>(() => events[0]?.id || '');
  const [bracketStyle, setBracketStyle] = useState<'symmetrical' | 'column'>('symmetrical');
  const [tab, setTab] = useState<'bracket' | 'standings' | 'schedule'>('bracket');
  const [venueError, setVenueError] = useState('');

  const event = events.find(e => e.id === selectedEventId) || events[0];
  const eventMatches: BracketMatch[] = useMemo(() => {
    if (!event) return matches;
    return matches.filter(m => m.eventId === event.id || (!m.eventId && m.sport === event.sport));
  }, [matches, event]);
  const hasMatches = eventMatches.length > 0;

  const liveMatchesCount = matches.filter(m => m.status === 'live').length;
  const finishedMatchesCount = matches.filter(m => m.status === 'finished').length;

  const activeTeams = teams.filter(t => t.isActive !== false);
  const canGenerate = !!event && activeTeams.length >= 2;

  const roundGroups = useMemo(() => {
    return eventMatches.reduce<Record<number, BracketMatch[]>>((acc, m) => {
      const rn = m.roundNumber ?? 1;
      (acc[rn] ??= []).push(m);
      return acc;
    }, {});
  }, [eventMatches]);

  const totalRounds = Math.max(0, ...Object.keys(roundGroups).map(Number));

  const standings = useMemo(
    () => (event ? computeStandings(event.sport) : []),
    [event, computeStandings, matches],
  );

  const conflicts = eventMatches.filter(m => m.conflictWarning);

  const handleVenueAssign = (matchId: string, venue: string) => {
    const target = matches.find(m => m.id === matchId);
    if (!target) return;

    // Only compare when the match actually has a scheduled time
    const clash = target.scheduledTime
      ? matches.find(m =>
        m.id !== matchId &&
        m.venue === venue &&
        m.scheduledTime === target.scheduledTime &&
        m.status !== 'finished')
      : undefined;

    if (clash) {
      setVenueError(`Venue conflict: "${venue}" is already used by ${clash.teamA} vs ${clash.teamB} at the same time.`);
      return;
    }

    setVenueError('');
    // NOTE: assumes assignMatchOfficials accepts a venue field.
    // If your context has a separate assignMatchVenue(), call that instead.
    assignMatchOfficials(matchId, { venue });
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    generateBracket(event.id, activeTeams.map(t => t.id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Tournament Generation</div>
          <h1 className="page-title">Brackets & Scheduling</h1>
          <p className="page-desc">Single-elimination tree, automated pairings, and conflict warnings</p>
        </div>
        <div className="stats-row">
          <div className="mini-stat glass-card">
            <span className="mini-val">{eventMatches.length}</span>
            <span className="mini-lbl">Matches</span>
          </div>
          <div className="mini-stat glass-card">
            <span className="mini-val" style={{ color: conflicts.length ? 'var(--badge-warn-text)' : 'inherit' }}>
              {conflicts.length}
            </span>
            <span className="mini-lbl">Conflicts</span>
          </div>
        </div>
      </div>

      {/* Live Scoring Desk Sync Status Banner */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          marginBottom: '16px',
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ position: 'relative', display: 'flex', height: '12px', width: '12px' }}>
            {liveMatchesCount > 0 && (
              <span style={{
                position: 'absolute',
                display: 'inline-flex',
                height: '100%',
                width: '100%',
                borderRadius: '50%',
                background: '#ef4444',
                opacity: 0.75,
                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
              }} />
            )}
            <span style={{
              position: 'relative',
              display: 'inline-flex',
              borderRadius: '50%',
              height: '12px',
              width: '12px',
              background: liveMatchesCount > 0 ? '#ef4444' : '#10b981',
            }} />
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              ⚡ Scoring Desk Live Sync Active
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {liveMatchesCount > 0 ? `${liveMatchesCount} match(es) currently LIVE on court` : 'All courts idle / scheduled'} • {finishedMatchesCount} finalized match(es)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {events.length > 1 && (
            <select
              className="form-input"
              style={{ fontSize: '12px', padding: '6px 10px', height: 'auto' }}
              value={event?.id || ''}
              onChange={e => setSelectedEventId(e.target.value)}
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.sport})
                </option>
              ))}
            </select>
          )}

          {(currentUser?.role === 'director' || currentUser?.role === 'coordinator' || currentUser?.role === 'scorer') && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setActiveView('scorekeeper')}
            >
              Open Scoring Desk ↗
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs & view switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['bracket', 'schedule', 'standings'] as const).map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
              {t === 'bracket' ? 'Bracket View' : t === 'schedule' ? 'Matches' : 'Standings'}
            </button>
          ))}
        </div>

        {tab === 'bracket' && hasMatches && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={`btn btn-sm ${bracketStyle === 'symmetrical' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setBracketStyle('symmetrical')}>
              Symmetrical Tree
            </button>
            <button className={`btn btn-sm ${bracketStyle === 'column' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setBracketStyle('column')}>
              Columns
            </button>
          </div>
        )}
      </div>

      {venueError && (
        <div style={{ marginBottom: 16 }}>
          <ConflictWarning warning={venueError} />
        </div>
      )}

      {/* Empty state */}
      {!hasMatches && tab !== 'standings' && (
        <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center', marginBottom: 24, border: '1.5px dashed var(--border)', borderRadius: 14 }}>
          <TrophyIcon size={40} color="var(--accent)" />
          <h3 style={{ fontSize: '18px', margin: '12px 0 6px', color: 'var(--text-primary)' }}>No Bracket Yet</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 18px', lineHeight: 1.5 }}>
            {canGenerate
              ? `Generate a single-elimination bracket from ${activeTeams.length} registered teams.`
              : 'Register at least 2 active teams before generating a bracket.'}
          </p>
          <button type="button" className="btn btn-primary" disabled={!canGenerate} onClick={handleGenerate}>
            ⚡ Generate Tournament Bracket
          </button>
        </div>
      )}

      {/* Bracket tab */}
      {tab === 'bracket' && hasMatches && (
        bracketStyle === 'symmetrical' ? (
          <TournamentTreeBracket initialSportId={event.sport} showSportSelector={true} />
        ) : (
          <div style={{ display: 'flex', gap: '18px', overflowX: 'auto', paddingBottom: '12px' }}>
            {Object.entries(roundGroups)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([roundNum, roundMatches]) => (
                <div key={roundNum} style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 0' }}>
                    {roundMatches[0]?.round || getRoundName(Number(roundNum), totalRounds)}
                  </div>
                  {roundMatches.map(m => (
                    <BracketMatchCard
                      key={m.id}
                      match={m}
                      onAssignVenue={handleVenueAssign}
                      venues={venues}
                      onOpenScoringDesk={() => setActiveView('scorekeeper')}
                    />
                  ))}
                </div>
              ))}
          </div>
        )
      )}

      {/* Schedule tab */}
      {tab === 'schedule' && hasMatches && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-header" style={{ gridTemplateColumns: '1fr 2fr 100px 140px 100px' }}>
            <span>Round</span><span>Matchup</span><span>Score</span><span>Venue</span><span>Status</span>
          </div>
          {eventMatches.map(m => {
            const notReady = isPlaceholder(m.teamA) || isPlaceholder(m.teamB);
            return (
              <div key={m.id} className="table-row" style={{ gridTemplateColumns: '1fr 2fr 100px 140px 100px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.round}</span>
                <span style={{ fontWeight: 600 }}>
                  {m.teamA || 'TBD'} <span style={{ color: 'var(--text-muted)' }}>vs</span> {m.teamB || 'TBD'}
                </span>
                <span style={{ fontWeight: 700 }}>{m.scoreA}–{m.scoreB}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.venue || '—'}</span>
                <span>
                  {m.status === 'scheduled' ? (
                    <button
                      className="btn btn-sm btn-ghost"
                      disabled={notReady}
                      title={notReady ? 'Waiting for previous round' : undefined}
                      onClick={() => startMatch(m.id)}
                    >
                      Start
                    </button>
                  ) : (
                    <span className={`status-badge ${m.status}`}>{m.status.toUpperCase()}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Standings tab */}
      {tab === 'standings' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-header" style={{ gridTemplateColumns: '40px 2fr 60px 60px 60px 80px 80px' }}>
            <span>#</span><span>Team</span><span>P</span><span>W</span><span>L</span><span>PF</span><span>Win%</span>
          </div>
          {standings.length === 0 && (
            <div style={{ padding: 20, fontSize: 13, color: 'var(--text-secondary)' }}>No results yet.</div>
          )}
          {standings.map((row, idx) => (
            <div key={row.teamId} className="table-row" style={{ gridTemplateColumns: '40px 2fr 60px 60px 60px 80px 80px' }}>
              <span style={{ fontWeight: 700, color: idx === 0 ? 'var(--accent)' : 'inherit' }}>{idx + 1}</span>
              <span>
                <strong>{row.teamName}</strong>{' '}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({row.department})</span>
              </span>
              <span>{row.played}</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{row.won}</span>
              <span style={{ color: '#ef4444' }}>{row.lost}</span>
              <span>{row.pointsFor}</span>
              <span style={{ fontWeight: 600 }}>{(row.winPct * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}