import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName, getSportIcon } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import { getPlayerTotalFouls, getPlayerRosterStatus } from '../lib/fouls';
import PublicMatchPlayersFoulsPanel from '../components/PublicMatchPlayersFoulsPanel';
import {
  TrophyIcon,
  UsersIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
  RefreshIcon,
  PlusIcon,
  ClipboardIcon,
  SettingsIcon,
  ShieldIcon,
  AlertTriangleIcon,
  TrashIcon,
} from '../components/Icons';
import type { TournamentFormat, SeedingMode } from '../types';

const GAME_STYLE_OPTIONS: { id: TournamentFormat; label: string; shortLabel: string; desc: string }[] = [
  { id: 'single_elimination', label: 'Single Elimination (Knockout)', shortLabel: 'Single Elimination', desc: 'Win to advance; one loss eliminates the team.' },
  { id: 'double_elimination', label: 'Double Elimination (Winners & Losers)', shortLabel: 'Double Elimination', desc: 'Winners & Losers brackets leading to Grand Final.' },
  { id: 'round_robin', label: 'Round Robin (All vs All)', shortLabel: 'Round Robin', desc: 'Every participating team plays every other team.' },
  { id: 'point_system', label: 'Point System (Standings)', shortLabel: 'Point System', desc: 'Teams ranked by Win / Draw / Loss points.' },
  { id: 'combined_rr_elim', label: 'Combined: Round Robin → Elimination', shortLabel: 'Round Robin + Elim', desc: 'Group stage first, then Top N advance to knockout.' },
  { id: 'combined_pts_elim', label: 'Combined: Point System → Elimination', shortLabel: 'Points + Elim', desc: 'Points stage first, then Top N advance to knockout.' },
];

type ElimTab = 'matchups' | 'players' | 'standings' | 'setup';

export default function EliminationRoundPage() {
  const {
    currentUser,
    events,
    matches,
    teams,
    players,
    officials,
    registeredUsers,
    departments,
    venues,
    settings,
    createEvent,
    generateBracket,
    deleteBracket,
    advanceGroupToElimination,
    assignMatchOfficials,
    computeStandings,
    togglePlayerRosterStatus,
    setActiveView,
  } = useApp();

  const scorekeepersList = useMemo(() => {
    const list = [...officials.filter(o => o.role === 'scorekeeper')];
    registeredUsers
      .filter(u => u.role === 'scorer')
      .forEach(u => {
        const exists = list.some(
          o =>
            o.name.toLowerCase() === u.name.toLowerCase() ||
            (u.email && o.contact?.toLowerCase() === u.email.toLowerCase())
        );
        if (!exists) {
          list.push({
            id: `u-${u.id}`,
            name: u.name,
            role: 'scorekeeper',
            sport: u.assignedSport || 'General',
            contact: u.email,
          });
        }
      });
    return list;
  }, [officials, registeredUsers]);

  const elimSettings = useMemo(() => {
    const raw = settings?.sportsCompetition?.eliminationRound;
    return {
      enabled: raw?.enabled ?? true,
      defaultGameStyle: (raw?.defaultGameStyle || 'single_elimination') as TournamentFormat,
      allowDirectorAndCoordinatorTeamSelect: raw?.allowDirectorAndCoordinatorTeamSelect ?? true,
      autoIncludeAddedTeams: raw?.autoIncludeAddedTeams ?? true,
      requireMedicalClearance: raw?.requireMedicalClearance ?? false,
      allowScorerScoringAndLineups: raw?.allowScorerScoringAndLineups ?? true,
      showInPublicView: raw?.showInPublicView ?? true,
      showPlayerListInPublicView: raw?.showPlayerListInPublicView ?? true,
      defaultBestOf: (raw?.defaultBestOf === 2 || raw?.defaultBestOf === 3 ? raw.defaultBestOf : 1) as 1 | 2 | 3,
      defaultSeedingMode: (raw?.defaultSeedingMode ?? 'seeded') as SeedingMode,
      advancingTeamsCount: raw?.advancingTeamsCount ?? 4,
    };
  }, [settings]);

  const isDirector = currentUser?.role === 'director';
  const isCoordinator = currentUser?.role === 'coordinator';
  const isScorer = currentUser?.role === 'scorer';
  const canManage = isDirector || isCoordinator;
  const canSelectTeams = canManage && elimSettings.allowDirectorAndCoordinatorTeamSelect;
  const canToggleLineup = canManage || (isScorer && elimSettings.allowScorerScoringAndLineups);

  const [selectedSportId, setSelectedSportId] = useState<string>(() => {
    if (events[0]?.sport) return events[0].sport;
    if (teams[0]?.sport) return teams[0].sport;
    return 's1';
  });

  const currentSportName = getSportName(selectedSportId);
  const currentSportLower = currentSportName.toLowerCase();

  const matchingEvent = useMemo(
    () => events.find(e => e.sport === selectedSportId && !e.archived),
    [events, selectedSportId]
  );

  const [gameStyle, setGameStyle] = useState<TournamentFormat>(
    () => matchingEvent?.format || elimSettings.defaultGameStyle
  );
  const [seedingMode, setSeedingMode] = useState<SeedingMode>(
    () => matchingEvent?.seedingMode || elimSettings.defaultSeedingMode
  );
  const [selectedVenue, setSelectedVenue] = useState<string>(
    () => matchingEvent?.venue || venues[0]?.name || 'Main Arena Court 1'
  );
  const [startDate, setStartDate] = useState<string>(
    () => matchingEvent?.startDate || '2026-11-10'
  );
  const [startTime, setStartTime] = useState<string>(
    () => matchingEvent?.startTime || '08:00'
  );
  const [activeTab, setActiveTab] = useState<ElimTab>(canManage ? 'setup' : 'matchups');
  const [notice, setNotice] = useState<string | null>(null);

  // Active teams added by Director or Coordinator for the selected sport
  const sportTeams = useMemo(() => {
    return teams.filter(
      t =>
        t.isActive !== false &&
        (t.sport === selectedSportId || getSportName(t.sport).toLowerCase() === currentSportLower)
    );
  }, [teams, selectedSportId, currentSportLower]);

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(() => sportTeams.map(t => t.id));

  // Sync team selection & event defaults when switching sport
  useEffect(() => {
    if (elimSettings.autoIncludeAddedTeams) {
      setSelectedTeamIds(sportTeams.map(t => t.id));
    } else {
      setSelectedTeamIds(prev => prev.filter(id => sportTeams.some(t => t.id === id)));
    }
  }, [selectedSportId, sportTeams.length, elimSettings.autoIncludeAddedTeams]);

  useEffect(() => {
    if (matchingEvent?.format) setGameStyle(matchingEvent.format);
    else setGameStyle(elimSettings.defaultGameStyle);
    if (matchingEvent?.venue) setSelectedVenue(matchingEvent.venue);
  }, [matchingEvent?.id, matchingEvent?.format, matchingEvent?.venue, elimSettings.defaultGameStyle]);

  const sportMatches = useMemo(() => {
    return matches
      .filter(
        m =>
          m.sport === selectedSportId ||
          getSportName(m.sport).toLowerCase() === currentSportLower ||
          (matchingEvent && m.eventId === matchingEvent.id)
      )
      .sort((a, b) => (a.matchNumber ?? 999) - (b.matchNumber ?? 999) || (a.roundNumber ?? 1) - (b.roundNumber ?? 1));
  }, [matches, selectedSportId, currentSportLower, matchingEvent]);

  const standings = useMemo(
    () => computeStandings(selectedSportId),
    [selectedSportId, computeStandings, matches]
  );

  // Teams participating in the current Elimination Round (from generated matches or selected checkboxes)
  const participatingTeams = useMemo(() => {
    const matchTeamNames = new Set<string>();
    sportMatches.forEach(m => {
      if (!isPlaceholder(m.teamA)) matchTeamNames.add(m.teamA.toLowerCase());
      if (!isPlaceholder(m.teamB)) matchTeamNames.add(m.teamB.toLowerCase());
    });
    if (matchTeamNames.size > 0) {
      return sportTeams.filter(t => matchTeamNames.has(t.name.toLowerCase()));
    }
    return sportTeams.filter(t => selectedTeamIds.includes(t.id));
  }, [sportTeams, sportMatches, selectedTeamIds]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4500);
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleLaunchEliminationRound = () => {
    if (!canManage) return;
    if (selectedTeamIds.length < 2) {
      showNotice('Please select at least 2 participating teams to generate the Elimination Round.');
      return;
    }

    const styleMeta = GAME_STYLE_OPTIONS.find(g => g.id === gameStyle);
    if (sportMatches.length > 0) {
      const ok = window.confirm(
        `Rebuild ${currentSportName} Elimination Round (${styleMeta?.shortLabel || gameStyle}) with ${selectedTeamIds.length} participating teams? Existing matches for ${currentSportName} will be replaced.`
      );
      if (!ok) return;
    }

    if (!matchingEvent) {
      createEvent({
        name: `Asian College Padula 2026 — ${currentSportName} Elimination Round`,
        sport: selectedSportId,
        division: 'div1',
        format: gameStyle,
        seedingMode,
        advancingTeamsCount: elimSettings.advancingTeamsCount,
        category: `${currentSportName} Elimination Round`,
        dates: `${startDate} (${startTime})`,
        startDate,
        endDate: '2026-11-20',
        startTime,
        endTime: '17:00',
        venue: selectedVenue,
        status: 'ongoing',
      });
      // Also ensure selected team subset is applied if fewer than all teams were picked
      setTimeout(() => {
        const latestEvent = events.find(e => e.sport === selectedSportId && !e.archived);
        if (latestEvent) {
          generateBracket(latestEvent.id, selectedTeamIds, true, gameStyle);
        }
      }, 50);
    } else {
      generateBracket(matchingEvent.id, selectedTeamIds, true, gameStyle);
    }

    showNotice(
      `Launched ${currentSportName} Elimination Round (${styleMeta?.shortLabel || gameStyle}) with ${selectedTeamIds.length} teams!`
    );
    setActiveTab('matchups');
  };

  if (!elimSettings.enabled) {
    return (
      <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 640, margin: '40px auto' }}>
        <AlertTriangleIcon size={40} color="#f59e0b" />
        <h2 style={{ margin: '12px 0 8px', fontSize: 20, fontWeight: 800 }}>Elimination Round Module Disabled</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 18 }}>
          The Sports Director has currently disabled the Elimination Round module in Settings.
        </p>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setActiveView('settings')}>
            <SettingsIcon size={14} /> Enable in Settings →
          </button>
        )}
      </div>
    );
  }

  const activeStyleMeta = GAME_STYLE_OPTIONS.find(g => g.id === (matchingEvent?.format || gameStyle));
  const isCombinedFormat =
    (matchingEvent?.format || gameStyle) === 'combined_rr_elim' ||
    (matchingEvent?.format || gameStyle) === 'combined_pts_elim';
  const hasElimStage = sportMatches.some(m => m.stage === 'elimination');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {/* ── Page Header ── */}
      <div className="glass-card" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <TrophyIcon size={14} color="var(--accent)" />
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Elimination Round &amp; Game Style Desk
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-sports)', fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', margin: 0 }}>
            {currentSportName} — Elimination Round
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage participating teams added by Directors &amp; Coordinators, choose game style (Single Elimination, Round Robin, Double Elimination, etc.), inspect player lists, and score live.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            padding: '5px 12px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 800,
            background: 'rgba(2, 132, 199, 0.14)',
            color: 'var(--accent)',
            border: '1px solid rgba(2, 132, 199, 0.3)',
          }}>
            {activeStyleMeta?.shortLabel || 'Single Elimination'}
          </span>
          {canManage && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setActiveView('settings')}>
              <SettingsIcon size={13} /> Elimination Settings
            </button>
          )}
          {(isScorer || canManage) && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setActiveView('scorekeeper')}>
              <ClipboardIcon size={13} /> Open Scorer Desk ↗
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#10b981',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <CheckIcon size={16} color="#10b981" />
          <span>{notice}</span>
        </div>
      )}

      {/* ── Sport Selector Bar ── */}
      <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {SPORTS_CATALOG.map(s => {
            const active = s.id === selectedSportId;
            const count = teams.filter(t => t.isActive !== false && (t.sport === s.id || getSportName(t.sport).toLowerCase() === s.name.toLowerCase())).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSportId(s.id)}
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {getSportIcon(s.id, 13, active ? '#fff' : 'var(--accent)')}
                <span>{s.name}</span>
                <span style={{ opacity: 0.75, fontSize: 10.5 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sub-Tabs ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {canManage && (
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'setup' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('setup')}
          >
            Team Selection &amp; Game Style
          </button>
        )}
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'matchups' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('matchups')}
        >
          Games &amp; Winners ({sportMatches.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'players' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('players')}
        >
          Participating Player List ({participatingTeams.length} Teams)
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'standings' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('standings')}
        >
          Standings ({standings.length})
        </button>
      </div>

      {/* ── TAB 1: SETUP & TEAM SELECTION (Director & Coordinator) ── */}
      {activeTab === 'setup' && canManage && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {/* Left: Game Style & Schedule Controls */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Game Style &amp; Round Rules</h3>

            <div>
              <label className="form-label">Game Style / Format</label>
              <select
                className="form-input"
                value={gameStyle}
                onChange={e => setGameStyle(e.target.value as TournamentFormat)}
                style={{ fontWeight: 700 }}
              >
                {GAME_STYLE_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                {GAME_STYLE_OPTIONS.find(o => o.id === gameStyle)?.desc}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="form-label">Seeding Mode</label>
                <select
                  className="form-input"
                  value={seedingMode}
                  onChange={e => setSeedingMode(e.target.value as SeedingMode)}
                >
                  <option value="seeded">Seeded Auto-Bracket</option>
                  <option value="random">Random Draw</option>
                  <option value="manual">Manual Placement</option>
                </select>
              </div>
              <div>
                <label className="form-label">Venue / Court</label>
                <select
                  className="form-input"
                  value={selectedVenue}
                  onChange={e => setSelectedVenue(e.target.value)}
                >
                  {venues.map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Start Time</label>
                <input type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleLaunchEliminationRound}
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {sportMatches.length > 0 ? <RefreshIcon size={14} /> : <PlusIcon size={14} />}
                <span>
                  {sportMatches.length > 0 ? 'Rebuild Elimination Round' : 'Launch Elimination Round'}
                </span>
              </button>

              {sportMatches.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    if (window.confirm(`Delete all ${currentSportName} Elimination Round matches?`)) {
                      deleteBracket(matchingEvent?.id || selectedSportId);
                      showNotice(`Deleted ${currentSportName} Elimination Round matches.`);
                    }
                  }}
                  style={{ color: '#38bdf8' }}
                >
                  <TrashIcon size={13} /> Clear Bracket
                </button>
              )}
            </div>
          </div>

          {/* Right: Participating Teams Added by Director & Coordinator */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  Participating Teams ({selectedTeamIds.length}/{sportTeams.length})
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Teams registered by Sports Director &amp; Coordinators for {currentSportName}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {canSelectTeams && (
                  <>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setSelectedTeamIds(sportTeams.map(t => t.id))}>
                      Select All
                    </button>
                    <button type="button" className="btn btn-xs btn-ghost" onClick={() => setSelectedTeamIds([])}>
                      Clear
                    </button>
                  </>
                )}
                <button type="button" className="btn btn-xs btn-primary" onClick={() => setActiveView('registration')}>
                  + Add Team
                </button>
              </div>
            </div>

            {sportTeams.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 10 }}>
                No teams registered for {currentSportName} yet. Click <strong>+ Add Team</strong> to register teams.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                {sportTeams.map(team => {
                  const isChecked = selectedTeamIds.includes(team.id);
                  const dept = departments.find(d => d.id === team.department);
                  const teamPlayerCount = players.filter(
                    p => p.teamId === team.id || (team.players || []).includes(p.id)
                  ).length;

                  return (
                    <label
                      key={team.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: isChecked ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-elevated)',
                        border: isChecked ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                        cursor: canSelectTeams ? 'pointer' : 'default',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!canSelectTeams}
                        onChange={() => toggleTeam(team.id)}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {team.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {dept?.shortName || team.department} · {teamPlayerCount} player{teamPlayerCount === 1 ? '' : 's'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: BRACKET & MATCHUPS ── */}
      {activeTab === 'matchups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {isCombinedFormat && !hasElimStage && canManage && sportMatches.length > 0 && (
            <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Group / Points stage active — ready to advance Top {elimSettings.advancingTeamsCount} teams to Knockout Elimination?
              </span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  const res = advanceGroupToElimination(matchingEvent?.id || selectedSportId);
                  if (res.message) showNotice(res.message);
                }}
              >
                Advance Top Teams →
              </button>
            </div>
          )}

          {sportMatches.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <TrophyIcon size={36} color="var(--accent)" />
              <h3 style={{ margin: '10px 0 6px', color: 'var(--text-primary)' }}>No {currentSportName} Elimination Matches Yet</h3>
              <p style={{ fontSize: 13, maxWidth: 440, margin: '0 auto 14px' }}>
                {canManage
                  ? 'Select participating teams and your preferred Game Style in the Setup tab to generate matchups.'
                  : 'Waiting for the Sports Director or Coordinator to launch the Elimination Round.'}
              </p>
              {canManage && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab('setup')}>
                  Configure &amp; Launch →
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14 }}>
              {sportMatches.map((m, idx) => {
                const isLive = m.status === 'live';
                const seriesLabel = `Best of ${m.bestOf || elimSettings.defaultBestOf}`;
                return (
                  <div key={m.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, border: isLive ? '1.5px solid #38bdf8' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>
                        Game #{m.matchNumber || idx + 1} · {m.round} · {seriesLabel}
                      </span>
                      <span className={`status-badge ${m.status}`}>
                        {isLive && <span className="live-dot" />}
                        {m.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)' }}>
                      <span style={{ flex: 1, fontWeight: m.winner === m.teamA ? 800 : 600, color: m.winner === m.teamA ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {m.teamA || 'TBD'}
                      </span>
                      <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {m.scoreA} – {m.scoreB}
                      </span>
                      <span style={{ flex: 1, textAlign: 'right', fontWeight: m.winner === m.teamB ? 800 : 600, color: m.winner === m.teamB ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {m.teamB || 'TBD'}
                      </span>
                    </div>

                    {m.winner && !isPlaceholder(m.winner) && (
                      <div style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: 12,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        <TrophyIcon size={13} color="#10b981" />
                        <span>Winner: {m.winner}</span>
                      </div>
                    )}

                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPinIcon size={12} /> {m.venue || 'Main Arena'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ClockIcon size={12} /> {m.scheduledTime ? new Date(m.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                      </span>
                    </div>

                    {canManage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          SCORER:
                        </label>
                        <select
                          className="form-input"
                          value={m.scorekeeper || ''}
                          onChange={e => assignMatchOfficials(m.id, { scorekeeper: e.target.value })}
                          style={{ flex: 1, padding: '5px 8px', fontSize: 12, fontWeight: 600 }}
                        >
                          <option value="">Assign Scorekeeper…</option>
                          {scorekeepersList.map(sk => (
                            <option key={sk.id} value={sk.name}>
                              {sk.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <PublicMatchPlayersFoulsPanel match={m} />
                      {(isScorer || canManage) && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB) && (
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => setActiveView('scorekeeper')}
                        >
                          Score Match ↗
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PARTICIPATING TEAMS & PLAYER LIST ── */}
      {activeTab === 'players' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {participatingTeams.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              No participating teams found for {currentSportName}.
            </div>
          ) : (
            participatingTeams.map(team => {
              const teamPlayers = players.filter(
                p => p.teamId === team.id || (team.players || []).includes(p.id)
              );
              const dept = departments.find(d => d.id === team.department);

              return (
                <div key={team.id} className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: team.color || 'var(--accent)' }} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{team.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {dept?.name || team.department} · {teamPlayers.length} athlete{teamPlayers.length === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>
                    <UsersIcon size={16} color="var(--accent)" />
                  </div>

                  {teamPlayers.length === 0 ? (
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '12px 0' }}>
                      No players assigned to {team.name} yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {teamPlayers.map(p => {
                        const status = getPlayerRosterStatus(p);
                        const fouls = getPlayerTotalFouls(p);
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: 'var(--bg-elevated)',
                              border: `1px solid ${status === 'in_play' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                                  #{String(p.jerseyNumber || '0').padStart(2, '0')}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</span>
                                {p.position && (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({p.position})</span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ color: status === 'in_play' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                                  {status === 'in_play' ? '● In Play' : '○ Reserved'}
                                </span>
                                <span>·</span>
                                <span>Fouls: <strong>{fouls}</strong></span>
                                {elimSettings.requireMedicalClearance && (
                                  <>
                                    <span>·</span>
                                    <span style={{ color: p.medicalCleared ? '#10b981' : '#ef4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      <ShieldIcon size={10} /> {p.medicalCleared ? 'Med Cleared' : 'Med Pending'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {canToggleLineup && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => togglePlayerRosterStatus(p.id, status === 'in_play' ? 'reserved' : 'in_play')}
                                style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}
                              >
                                {status === 'in_play' ? 'Move to Reserved' : 'Put In Play'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 4: STANDINGS ── */}
      {activeTab === 'standings' && (
        <div className="glass-card" style={{ overflowX: 'auto', padding: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Rank</th>
                <th style={{ padding: '10px 12px' }}>Team</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Played</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Won</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Lost</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Points</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>PF</th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No standings recorded yet for {currentSportName}.
                  </td>
                </tr>
              ) : (
                standings.map((row, idx) => (
                  <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: idx === 0 ? 'var(--accent)' : 'var(--text-muted)' }}>#{idx + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{row.teamName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{row.played}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{row.won}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{row.lost}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--accent)' }}>{row.points ?? row.won * 2}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{row.pointsFor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
