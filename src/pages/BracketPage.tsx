import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  MapPinIcon,
  TrophyIcon,
  CalendarIcon,
  AlertTriangleIcon,
  RefreshIcon,
  PlusIcon,
  ClockIcon,
  LayersIcon,
  BracketsIcon,
  TrashIcon,
  CheckIcon,
} from '../components/Icons';
import TournamentTreeBracket from '../components/TournamentTreeBracket';
import { isPlaceholder, getRoundName } from '../lib/bracket';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';

type AppState = ReturnType<typeof useApp>;
type BracketMatch = AppState['matches'][number];
type Venue = AppState['venues'][number];

function ConflictWarning({ warning }: { warning: string }) {
  return (
    <div style={{
      background: 'var(--badge-warn-bg)', border: '1px solid var(--badge-warn-border)',
      borderRadius: '6px', padding: '6px 10px', marginTop: '8px',
      fontSize: '12px', color: 'var(--badge-warn-text)', fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <AlertTriangleIcon size={13} color="var(--badge-warn-text)" />
      <span>{warning}</span>
    </div>
  );
}

function BracketMatchCard({ match, matchNum, isNextUp, onAssignVenue, venues, onOpenScoringDesk }: {
  match: BracketMatch;
  matchNum: number;
  isNextUp?: boolean;
  onAssignVenue: (matchId: string, venue: string) => void;
  venues: Venue[];
  onOpenScoringDesk?: (matchId: string) => void;
}) {
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isTBD = isPlaceholder(match.teamA) || isPlaceholder(match.teamB);

  return (
    <div
      className="glass-card"
      style={{
        padding: '14px 16px',
        opacity: isTBD ? 0.7 : 1,
        border: isLive
          ? '1.5px solid #ef4444'
          : isNextUp
            ? '1.5px solid #0ea5e9'
            : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10.5px',
            fontWeight: 900,
            padding: '2px 7px',
            borderRadius: '999px',
            background: isLive
              ? '#dc2626'
              : isNextUp
                ? '#0ea5e9'
                : 'rgba(220, 38, 38, 0.14)',
            color: isLive || isNextUp ? '#ffffff' : 'var(--accent)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            letterSpacing: '0.03em',
          }}>
            Match #{matchNum}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {match.round}
          </span>
          {isNextUp && !isLive && (
            <span style={{
              fontSize: '9.5px',
              fontWeight: 800,
              color: '#0ea5e9',
              background: 'rgba(14, 165, 233, 0.14)',
              padding: '2.5px 7px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              letterSpacing: '0.03em',
            }}>
              ▶ PLAY NEXT
            </span>
          )}
        </div>
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

      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPinIcon size={12} /> {match.venue || 'Main Arena Court 1'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Scorer: {match.scorekeeper || 'Demo Scorekeeper'}
        </div>
      </div>

      {match.scheduledTime && (
        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <CalendarIcon size={11} color="var(--text-muted)" />
            {new Date(match.scheduledTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <ClockIcon size={11} color="var(--text-muted)" />
            {new Date(match.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

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
    assignMatchOfficials, startMatch, createEvent, generateBracket, deleteBracket, computeStandings,
    setActiveView, currentUser,
  } = useApp();

  const [selectedEventId, setSelectedEventId] = useState<string>(() => events[0]?.id || '');
  const [selectedSportId, setSelectedSportId] = useState<string>(() => {
    if (events[0]?.sport) return events[0].sport;
    if (matches[0]?.sport) return matches[0].sport;
    if (teams[0]?.sport) return teams[0].sport;
    return 's1';
  });
  const [bracketStyle, setBracketStyle] = useState<'symmetrical' | 'column'>('symmetrical');
  const [selectedFormat, setSelectedFormat] = useState<'single_elimination' | 'round_robin'>('single_elimination');
  const [selectedVenue, setSelectedVenue] = useState<string>(() => venues[0]?.name || 'Main Arena Court 1');
  const [tab, setTab] = useState<'bracket' | 'standings' | 'schedule'>('bracket');
  const [venueError, setVenueError] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'sport' | 'format' | 'venue' | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.sync-control-pill')) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const event = useMemo(() => {
    return events.find(e => e.id === selectedEventId && e.sport === selectedSportId)
      || events.find(e => e.sport === selectedSportId && !e.archived)
      || events.find(e => e.id === selectedEventId)
      || events[0];
  }, [events, selectedEventId, selectedSportId]);

  const currentSport = selectedSportId || event?.sport || 's1';
  const sportName = getSportName(currentSport);
  const sportNameLower = sportName.toLowerCase();

  const eventMatches: BracketMatch[] = useMemo(() => {
    const filtered = matches.filter(m =>
      m.sport === currentSport ||
      getSportName(m.sport).toLowerCase() === sportNameLower ||
      (event && event.sport === currentSport && m.eventId === event.id)
    );
    return [...filtered].sort(
      (a, b) => (a.matchNumber ?? 999) - (b.matchNumber ?? 999) || (a.roundNumber ?? 1) - (b.roundNumber ?? 1) || (a.slot ?? 1) - (b.slot ?? 1)
    );
  }, [matches, event, currentSport, sportNameLower]);
  const hasMatches = eventMatches.length > 0;

  // Map each match ID to its sequential Match # (1, 2, 3...) and identify the next match to play
  const matchSeqMap = useMemo(() => {
    const map: Record<string, number> = {};
    eventMatches.forEach((m, idx) => {
      map[m.id] = m.matchNumber || (idx + 1);
    });
    return map;
  }, [eventMatches]);

  const nextUpMatchId = useMemo(() => {
    const ready = eventMatches.find(
      m => m.status === 'scheduled' && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB)
    );
    if (ready) return ready.id;
    return eventMatches.find(m => m.status === 'scheduled')?.id;
  }, [eventMatches]);

  const liveMatchesCount = matches.filter(m => m.status === 'live').length;
  const finishedMatchesCount = matches.filter(m => m.status === 'finished').length;

  const activeTeams = useMemo(() => {
    return teams.filter(
      t => t.isActive !== false && (t.sport === currentSport || getSportName(t.sport).toLowerCase() === sportNameLower)
    );
  }, [teams, currentSport, sportNameLower]);

  const isAdmin = currentUser?.role === 'director' || currentUser?.role === 'coordinator';
  const canGenerate = isAdmin;

  const roundGroups = useMemo(() => {
    const getStageOrder = (m: BracketMatch): number => {
      const r = (m.round || '').toLowerCase();
      if (r.includes('16') || r.includes('r16')) return 1;
      if (r.includes('quarter') || r.includes('qf')) return 2;
      if (r.includes('semi') || r.includes('sf')) return 3;
      if (r.includes('final') || r.includes('championship') || r.includes('gold')) return 4;
      return m.roundNumber ?? 1;
    };
    return eventMatches.reduce<Record<number, BracketMatch[]>>((acc, m) => {
      const rn = getStageOrder(m);
      (acc[rn] ??= []).push(m);
      return acc;
    }, {});
  }, [eventMatches]);

  const totalRounds = Math.max(0, ...Object.keys(roundGroups).map(Number));

  const standings = useMemo(
    () => computeStandings(currentSport),
    [currentSport, computeStandings, matches],
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
    assignMatchOfficials(matchId, { venue });
  };

  const handleGenerate = (forceRegenerate = false) => {
    if (!canGenerate) return;
    const formatLabel = selectedFormat === 'round_robin' ? 'Round Robin' : 'Single Elimination';
    if (forceRegenerate) {
      const ok = window.confirm(
        `Rebuild the ${sportName} ${formatLabel} schedule at ${selectedVenue || 'Main Arena Court 1'} using ${activeTeams.length} active teams? Existing ${sportName} matches will be replaced.`
      );
      if (!ok) return;
    }
    let targetEvent = events.find(e => e.sport === currentSport && !e.archived);
    let targetEventId = targetEvent?.id;
    if (!targetEventId) {
      targetEventId = createEvent({
        name: `Asian College Padula 2026 — ${sportName}`,
        sport: currentSport,
        division: 'div1',
        format: selectedFormat,
        category: `${sportName} Championship`,
        dates: 'Nov 10 (08:00 AM) – Nov 18 (05:00 PM), 2026',
        startDate: '2026-11-10',
        endDate: '2026-11-18',
        startTime: '08:00',
        endTime: '17:00',
        venue: selectedVenue || venues[0]?.name || 'Main Arena Court 1',
        status: 'ongoing',
      });
      setSelectedEventId(targetEventId);
    } else {
      generateBracket(targetEventId, activeTeams.map(t => t.id), forceRegenerate, selectedFormat);
    }
  };

  const isRoundRobinEvent = event?.format === 'round_robin' || eventMatches.some(m => m.format === 'round_robin');

  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
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

      {/* Live Scoring Desk Sync & Competition Control Deck */}
      <div className="sync-deck-card">
        {/* Header: Live status & Quick actions */}
        <div className="sync-deck-header">
          <div className="sync-deck-status-wrap">
            <div className={`sync-deck-pulse-dot ${liveMatchesCount > 0 ? 'is-live' : 'is-idle'}`}>
              <span className="pulse-ping" />
              <span className="pulse-core" />
            </div>
            <div className="sync-deck-info">
              <div className="sync-deck-title">
                <BracketsIcon size={15} className="sync-deck-zap" color="var(--accent)" />
                <span>Tournament Bracket Live Sync</span>
                <span className={`sync-deck-badge ${liveMatchesCount > 0 ? 'badge-live' : 'badge-idle'}`}>
                  {liveMatchesCount > 0 ? 'Live on Court' : 'Active'}
                </span>
              </div>
              <div className="sync-deck-subtitle">
                {liveMatchesCount > 0 ? (
                  <strong style={{ color: '#ef4444' }}>{liveMatchesCount} match(es) currently LIVE on court</strong>
                ) : (
                  <span>All courts idle / scheduled</span>
                )}
                <span className="sync-deck-divider">•</span>
                <span>{finishedMatchesCount} finalized match(es)</span>
              </div>
            </div>
          </div>

          <div className="sync-deck-actions">
            {isAdmin && hasMatches && canGenerate && (
              <button
                type="button"
                className="btn btn-sm btn-ghost sync-action-btn"
                onClick={() => handleGenerate(true)}
                title="Rebuild bracket/schedule rounds from registered teams"
              >
                <RefreshIcon size={13} />
                <span>Rebuild ({selectedFormat === 'round_robin' ? 'Round Robin' : 'Single Elim'})</span>
              </button>
            )}

            {isAdmin && hasMatches && (
              <button
                type="button"
                className="btn btn-sm btn-ghost sync-action-btn"
                onClick={() => {
                  const confirmMsg = `Are you sure you want to delete the tournament bracket for ${sportName}? All ${eventMatches.length} scheduled matches will be permanently deleted and the bracket will be reset.`;
                  if (window.confirm(confirmMsg)) {
                    deleteBracket(selectedEventId || currentSport);
                  }
                }}
                title={`Delete ${sportName} tournament bracket and clear all scheduled matches`}
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <TrashIcon size={13} color="#ef4444" />
                <span>Delete Bracket</span>
              </button>
            )}

            {currentUser?.role === 'scorer' && (
              <button
                type="button"
                className="btn btn-sm btn-primary sync-action-btn"
                onClick={() => setActiveView('scorekeeper')}
              >
                Open Scoring Desk ↗
              </button>
            )}
          </div>
        </div>

        {/* Competition Scope Selectors Toolbar */}
        <div className="sync-deck-controls-grid">
          {/* Sport Selector */}
          <div
            className={`sync-control-pill ${activeDropdown === 'sport' ? 'is-open' : ''}`}
            onClick={() => setActiveDropdown(prev => (prev === 'sport' ? null : 'sport'))}
            title="Click to select sport"
          >
            <div className="sync-control-icon">
              <TrophyIcon size={14} color="var(--accent)" />
            </div>
            <div className="sync-control-body">
              <span className="sync-control-label">Sport / Event</span>
              <div className="sync-control-value">
                <span>{SPORTS_CATALOG.find(s => s.id === currentSport)?.name || sportName}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  ({activeTeams.length} teams)
                </span>
              </div>
            </div>
            <div className="sync-control-chevron">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </div>

            {activeDropdown === 'sport' && (
              <div className="sync-control-dropdown-menu" onClick={e => e.stopPropagation()}>
                {SPORTS_CATALOG.map(s => {
                  const teamCount = teams.filter(t => t.isActive !== false && (t.sport === s.id || t.sport.toLowerCase() === s.name.toLowerCase())).length;
                  const isSelected = s.id === currentSport;
                  return (
                    <div
                      key={s.id}
                      className={`sync-control-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedSportId(s.id);
                        const matchingEv = events.find(ev => ev.sport === s.id && !ev.archived);
                        if (matchingEv) {
                          setSelectedEventId(matchingEv.id);
                          if (matchingEv.format) setSelectedFormat(matchingEv.format);
                          if (matchingEv.venue) setSelectedVenue(matchingEv.venue);
                        }
                        setActiveDropdown(null);
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {s.icon?.(isSelected ? 'var(--accent)' : 'var(--text-muted)', 14)}
                        <span>{s.name}</span>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>
                          {teamCount} teams
                        </span>
                        {isSelected && <CheckIcon size={13} color="var(--accent)" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Format Selector */}
          {isAdmin && (
            <div
              className={`sync-control-pill ${activeDropdown === 'format' ? 'is-open' : ''}`}
              onClick={() => setActiveDropdown(prev => (prev === 'format' ? null : 'format'))}
              title="Click to select tournament format"
            >
              <div className="sync-control-icon">
                <LayersIcon size={14} color="#3b82f6" />
              </div>
              <div className="sync-control-body">
                <span className="sync-control-label">Tournament Format</span>
                <div className="sync-control-value">
                  <span>{selectedFormat === 'round_robin' ? 'Round Robin (All vs All)' : 'Single Elimination (Knockout)'}</span>
                </div>
              </div>
              <div className="sync-control-chevron">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>

              {activeDropdown === 'format' && (
                <div className="sync-control-dropdown-menu" onClick={e => e.stopPropagation()}>
                  {[
                    { id: 'single_elimination', label: 'Single Elimination (Knockout)', desc: 'Standard knockout tournament tree bracket' },
                    { id: 'round_robin', label: 'Round Robin (All vs All)', desc: 'Every team plays all other teams in the group' },
                  ].map(f => {
                    const isSelected = selectedFormat === f.id;
                    return (
                      <div
                        key={f.id}
                        className={`sync-control-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedFormat(f.id as 'single_elimination' | 'round_robin');
                          setActiveDropdown(null);
                        }}
                      >
                        <div>
                          <div>{f.label}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>{f.desc}</div>
                        </div>
                        {isSelected && <CheckIcon size={13} color="var(--accent)" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Venue Selector */}
          {isAdmin && (
            <div
              className={`sync-control-pill ${activeDropdown === 'venue' ? 'is-open' : ''}`}
              onClick={() => setActiveDropdown(prev => (prev === 'venue' ? null : 'venue'))}
              title="Click to select venue / court"
            >
              <div className="sync-control-icon">
                <MapPinIcon size={14} color="#10b981" />
              </div>
              <div className="sync-control-body">
                <span className="sync-control-label">Event Place (Venue)</span>
                <div className="sync-control-value">
                  <span>{selectedVenue || venues[0]?.name || 'Main Arena Court 1'}</span>
                </div>
              </div>
              <div className="sync-control-chevron">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>

              {activeDropdown === 'venue' && (
                <div className="sync-control-dropdown-menu" onClick={e => e.stopPropagation()}>
                  {venues.map(v => {
                    const isSelected = (selectedVenue || venues[0]?.name) === v.name;
                    return (
                      <div
                        key={v.id}
                        className={`sync-control-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedVenue(v.name);
                          setActiveDropdown(null);
                        }}
                      >
                        <div>
                          <div>{v.name}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 400 }}>{v.location}</div>
                        </div>
                        {isSelected && <CheckIcon size={13} color="var(--accent)" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
          <h3 style={{ fontSize: '18px', margin: '12px 0 6px', color: 'var(--text-primary)' }}>No {sportName} Event / Bracket Yet</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 18px', lineHeight: 1.5 }}>
            {activeTeams.length > 0
              ? `Create the ${sportName} event and automatically generate its single-elimination bracket with ${activeTeams.length} registered team${activeTeams.length === 1 ? '' : 's'}.`
              : `Create the ${sportName} event and automatically generate its bracket structure (teams registered later will be placed into Round 1 automatically).`}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAdmin && (
              <button type="button" className="btn btn-primary" onClick={() => handleGenerate(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <PlusIcon size={14} /> Create {sportName} Event &amp; Bracket
              </button>
            )}
            {isAdmin && (
              <button type="button" className="btn btn-ghost" onClick={() => setActiveView('registration')}>
                Register {sportName} Teams →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bracket tab */}
      {tab === 'bracket' && (
        bracketStyle === 'symmetrical' && !isRoundRobinEvent ? (
          <TournamentTreeBracket
            initialSportId={currentSport}
            showSportSelector={true}
            onSportChange={sp => {
              setSelectedSportId(sp);
              const matchingEv = events.find(ev => ev.sport === sp && !ev.archived);
              if (matchingEv) setSelectedEventId(matchingEv.id);
            }}
          />
        ) : hasMatches ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRoundRobinEvent && (
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderLeft: '4px solid #38bdf8' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshIcon size={14} color="#38bdf8" />
                  <span>{sportName} Round Robin Tournament — Every team plays every other team</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MapPinIcon size={12} color="var(--text-muted)" /> Venue: <strong>{event?.venue || selectedVenue}</strong>
                  </span>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CalendarIcon size={12} color="var(--text-muted)" /> {event?.startDate || '2026-11-10'} – {event?.endDate || '2026-11-18'}
                  </span>
                </span>
              </div>
            )}
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
                        matchNum={matchSeqMap[m.id] || m.matchNumber || 1}
                        isNextUp={m.id === nextUpMatchId}
                        onAssignVenue={handleVenueAssign}
                        venues={venues}
                        onOpenScoringDesk={currentUser?.role === 'scorer' ? () => setActiveView('scorekeeper') : undefined}
                      />
                    ))}
                  </div>
                ))}
            </div>
          </div>
        ) : null
      )}

      {/* Schedule tab */}
      {tab === 'schedule' && hasMatches && (
        <div className="glass-card" style={{ overflowX: 'auto', padding: '12px' }}>
          <div style={{ minWidth: '720px' }}>
            <div className="table-header" style={{ gridTemplateColumns: '110px 1fr 1.8fr 90px 150px 150px 100px' }}>
              <span>Match #</span><span>Round &amp; Format</span><span>Matchup</span><span>Score</span><span>Date &amp; Time</span><span>Event Place</span><span>Status</span>
            </div>
            {eventMatches.map((m, idx) => {
              const notReady = isPlaceholder(m.teamA) || isPlaceholder(m.teamB);
              const mNum = matchSeqMap[m.id] || m.matchNumber || (idx + 1);
              const isNext = m.id === nextUpMatchId;
              return (
                <div
                  key={m.id}
                  className="table-row"
                  style={{
                    gridTemplateColumns: '110px 1fr 1.8fr 90px 150px 150px 100px',
                    background: isNext ? 'rgba(14, 165, 233, 0.08)' : undefined,
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: m.status === 'live' ? '#dc2626' : isNext ? '#0ea5e9' : 'rgba(220, 38, 38, 0.14)',
                      color: m.status === 'live' || isNext ? '#fff' : 'var(--accent)',
                    }}>
                      Match #{mNum}
                    </span>
                    {isNext && m.status === 'scheduled' && (
                      <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#0ea5e9' }}>
                        ▶ PLAY FIRST
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {m.round}
                    <div style={{ fontSize: '10px', color: m.format === 'round_robin' ? '#38bdf8' : '#f59e0b', fontWeight: 700 }}>
                      {m.format === 'round_robin' ? 'Round Robin' : 'Single Elim'}
                    </div>
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {m.teamA || 'TBD'} <span style={{ color: 'var(--text-muted)' }}>vs</span> {m.teamB || 'TBD'}
                  </span>
                  <span style={{ fontWeight: 700 }}>{m.scoreA}–{m.scoreB}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {m.scheduledTime ? new Date(m.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.venue || 'Main Arena Court 1'}</span>
                  <span>
                    {m.status === 'scheduled' && currentUser?.role === 'scorer' ? (
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
        </div>
      )}

      {/* Standings tab */}
      {tab === 'standings' && (
        <div className="glass-card" style={{ overflowX: 'auto', padding: '12px' }}>
          <div style={{ minWidth: '540px' }}>
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
        </div>
      )}
    </div>
  );
}