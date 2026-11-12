import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarIcon,
  TrophyIcon,
  LiveIcon,
  MapPinIcon,
  ClockIcon,
  SearchIcon,
  TrashIcon,
  CheckIcon,
} from '../components/Icons';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';

export default function SchedulePage() {
  const {
    matches,
    deleteMatch,
    currentUser,
    setActiveView,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'scheduled' | 'finished'>('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'time-asc' | 'time-desc' | 'sport'>('time-asc');

  const canManage = currentUser?.role === 'director' || currentUser?.role === 'coordinator';

  // Extract unique venues
  const venues = useMemo(() => {
    const set = new Set<string>();
    matches.forEach(m => {
      if (m.venue && m.venue.trim()) set.add(m.venue.trim());
    });
    return Array.from(set).sort();
  }, [matches]);

  // Summary Metrics
  const totalMatches = matches.length;
  const liveMatchesCount = matches.filter(m => m.status === 'live').length;
  const scheduledMatchesCount = matches.filter(m => m.status === 'scheduled').length;
  const finishedMatchesCount = matches.filter(m => m.status === 'finished').length;

  // Filtered and Sorted matches
  const filteredMatches = useMemo(() => {
    return matches
      .filter(m => {
        if (sportFilter !== 'all' && m.sport.toLowerCase() !== sportFilter.toLowerCase()) {
          return false;
        }
        if (statusFilter !== 'all' && m.status !== statusFilter) {
          return false;
        }
        if (venueFilter !== 'all' && m.venue !== venueFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTeamA = (m.teamA || '').toLowerCase().includes(q);
          const matchTeamB = (m.teamB || '').toLowerCase().includes(q);
          const matchRound = (m.round || '').toLowerCase().includes(q);
          const matchVenue = (m.venue || '').toLowerCase().includes(q);
          const matchScorer = (m.scorekeeper || '').toLowerCase().includes(q);
          return matchTeamA || matchTeamB || matchRound || matchVenue || matchScorer;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'time-asc') {
          return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
        }
        if (sortBy === 'time-desc') {
          return (b.scheduledTime || '').localeCompare(a.scheduledTime || '');
        }
        if (sortBy === 'sport') {
          return a.sport.localeCompare(b.sport);
        }
        return 0;
      });
  }, [matches, sportFilter, statusFilter, venueFilter, searchQuery, sortBy]);

  const handleDeleteMatch = (matchId: string, teamA: string, teamB: string) => {
    if (window.confirm(`Are you sure you want to remove match: "${teamA} vs ${teamB}"? This will delete its schedule and scores.`)) {
      deleteMatch(matchId);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Master Tournament Schedule
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Schedule &amp; Match Results
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Official tournament fixtures, court locations, real-time score tracking, and match logs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            onClick={() => setActiveView('bracket')}
          >
            <TrophyIcon size={15} /> View Brackets
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            onClick={() => setActiveView('live')}
          >
            <LiveIcon size={15} /> Live Scoreboard
            {liveMatchesCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: 10,
                marginLeft: 2,
              }}>
                {liveMatchesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Summary Stats Cards ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {/* Total Matches */}
        <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Fixtures
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {totalMatches}
            </div>
          </div>
        </div>

        {/* Live Now */}
        <div
          className="glass-card"
          onClick={() => setStatusFilter('live')}
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            border: liveMatchesCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
          }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <LiveIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              {liveMatchesCount > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.2s infinite' }} />}
              Live In Progress
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {liveMatchesCount}
            </div>
          </div>
        </div>

        {/* Scheduled */}
        <div
          className="glass-card"
          onClick={() => setStatusFilter('scheduled')}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ClockIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Upcoming / Queued
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {scheduledMatchesCount}
            </div>
          </div>
        </div>

        {/* Finalized */}
        <div
          className="glass-card"
          onClick={() => setStatusFilter('finished')}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CheckIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Finalized Results
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {finishedMatchesCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Control Bar ──────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              placeholder="Search team, round, venue, or scorer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: 38, fontSize: '13px' }}
            />
          </div>

          {/* Sport Filter */}
          <select
            className="form-input"
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
            style={{ width: '160px', fontSize: '13px' }}
          >
            <option value="all">All Sports ({matches.length})</option>
            {SPORTS_CATALOG.map(s => {
              const count = matches.filter(m => m.sport.toLowerCase() === s.id.toLowerCase() || m.sport.toLowerCase() === s.name.toLowerCase()).length;
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Status Filter */}
          <select
            className="form-input"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{ width: '150px', fontSize: '13px' }}
          >
            <option value="all">All Statuses</option>
            <option value="live">🔴 Live Now</option>
            <option value="scheduled">🟡 Scheduled</option>
            <option value="finished">🟢 Finalized</option>
          </select>

          {/* Venue Filter */}
          {venues.length > 0 && (
            <select
              className="form-input"
              value={venueFilter}
              onChange={e => setVenueFilter(e.target.value)}
              style={{ width: '170px', fontSize: '13px' }}
            >
              <option value="all">All Venues</option>
              {venues.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            className="form-input"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{ width: '140px', fontSize: '13px' }}
          >
            <option value="time-asc">Time (Earliest)</option>
            <option value="time-desc">Time (Latest)</option>
            <option value="sport">By Sport</option>
          </select>
        </div>

        {/* Filter stats pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredMatches.length}</strong> of {totalMatches} fixtures
          </span>
          {(searchQuery || sportFilter !== 'all' || statusFilter !== 'all' || venueFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setSportFilter('all');
                setStatusFilter('all');
                setVenueFilter('all');
              }}
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Master Match Fixtures Table ───────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {filteredMatches.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CalendarIcon size={42} color="var(--text-muted)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '12px', marginBottom: '6px' }}>
              No matches found
            </h3>
            <p style={{ fontSize: '13px', margin: 0, maxWidth: '400px', marginInline: 'auto' }}>
              No fixtures match your current filters. Adjust your filters or generate matches from the Brackets page.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sport
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Teams &amp; Matchup
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Score
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Round
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Venue &amp; Court
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Time
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map(m => {
                  const sportDef = SPORTS_CATALOG.find(
                    s => s.id === m.sport || s.name.toLowerCase() === m.sport.toLowerCase()
                  );
                  const isLive = m.status === 'live';
                  const isFinished = m.status === 'finished';
                  const hasScores = isLive || isFinished;

                  // Highlighting winner if finished
                  const teamAWon = isFinished && (m.scoreA ?? 0) > (m.scoreB ?? 0);
                  const teamBWon = isFinished && (m.scoreB ?? 0) > (m.scoreA ?? 0);

                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isLive ? 'rgba(239, 68, 68, 0.04)' : undefined,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = isLive
                          ? 'rgba(239, 68, 68, 0.08)'
                          : 'var(--bg-elevated)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = isLive
                          ? 'rgba(239, 68, 68, 0.04)'
                          : 'transparent';
                      }}
                    >
                      {/* Sport */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {sportDef?.icon?.('var(--accent)', 16)}
                          <span>{sportDef?.name || getSportName(m.sport)}</span>
                        </span>
                      </td>

                      {/* Teams & Matchup */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px' }}>
                            <span style={{ color: teamAWon ? '#10b981' : undefined }}>{m.teamA}</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 400, fontSize: '12px' }}>vs</span>
                            <span style={{ color: teamBWon ? '#10b981' : undefined }}>{m.teamB}</span>
                          </div>
                          {m.scorekeeper && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Official Scorer: {m.scorekeeper}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Score */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {hasScores ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            background: isLive ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)',
                            color: isLive ? '#ef4444' : 'var(--text-primary)',
                            borderRadius: '6px',
                            fontWeight: 900,
                            fontSize: '14px',
                            fontVariantNumeric: 'tabular-nums',
                            border: isLive ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                          }}>
                            {m.scoreA ?? 0} – {m.scoreB ?? 0}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>–</span>
                        )}
                      </td>

                      {/* Round */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                        }}>
                          {m.round || 'Round 1'}
                        </span>
                      </td>

                      {/* Venue */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '12px' }}>
                          <MapPinIcon size={13} color="var(--text-muted)" />
                          <span>{m.venue || 'Main Arena'}</span>
                        </span>
                      </td>

                      {/* Time */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <ClockIcon size={12} color="var(--text-muted)" />
                          <span>{m.scheduledTime || 'TBD'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          className={`status-badge ${m.status}`}
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontWeight: 800,
                          }}
                        >
                          {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.2s infinite' }} />}
                          {m.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {isLive ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => setActiveView('live')}
                              style={{ fontSize: '11px', padding: '3px 8px' }}
                              title="Watch Live Scoreboard"
                            >
                              Live Desk
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setActiveView('scorekeeper')}
                              style={{ fontSize: '11px', padding: '3px 8px' }}
                              title="Scorer Desk"
                            >
                              Scorer Desk
                            </button>
                          )}

                          {canManage && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteMatch(m.id, m.teamA, m.teamB)}
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                color: '#ef4444',
                                borderColor: 'rgba(239,68,68,0.28)',
                              }}
                              title="Delete this match fixture"
                            >
                              <TrashIcon size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

