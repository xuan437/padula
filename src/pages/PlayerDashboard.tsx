import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon } from '../lib/sports';
import {
  getSportFoulRules,
  getPlayerTotalFouls,
  getPlayerFoulBreakdown,
  getPlayerRosterStatus,
} from '../lib/fouls';
import { SportFilter } from '../components/ui';
import {
  UsersIcon,
  SearchIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
} from '../components/Icons';
import type { Player, PlayerRosterStatus } from '../types';

export default function PlayerDashboard() {
  const {
    currentUser,
    players,
    teams,
    departments,
    setActiveView,
    updatePlayer,
    removePlayer,
    recordPlayerFoul,
    togglePlayerRosterStatus,
    officials,
  } = useApp();

  // Role permissions
  const isDirector = currentUser?.role === 'director';
  const isCoordinator = currentUser?.role === 'coordinator';
  const canManage = isDirector || isCoordinator;
  const isScorer = currentUser?.role === 'scorer';
  const canEditLineupAndFouls = canManage || isScorer;
  const isGuest = !currentUser || currentUser?.role === 'guest';

  // Find official assigned sport if current user is scorer
  const myOfficial = useMemo(() => {
    if (!isScorer) return null;
    return officials.find(o =>
      o.role === 'scorekeeper' && (
        o.name.toLowerCase() === currentUser?.name.toLowerCase() ||
        o.contact?.toLowerCase() === currentUser?.email?.toLowerCase()
      )
    );
  }, [isScorer, officials, currentUser]);

  // Tab & Filter States
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'cleared' | 'pending'>('all');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'in_play' | 'reserved'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'team' | 'jersey' | 'points' | 'fouls'>('name');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Modal States
  const [activeProfilePlayer, setActiveProfilePlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    teamId: '',
    jerseyNumber: '',
    position: '',
    medicalCleared: true,
    rosterStatus: 'in_play' as PlayerRosterStatus,
  });

  // Always read live player state for the profile modal so foul/lineup changes reflect immediately
  const liveProfilePlayer = useMemo(
    () => (activeProfilePlayer ? players.find(p => p.id === activeProfilePlayer.id) || activeProfilePlayer : null),
    [activeProfilePlayer, players]
  );

  const sportCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of players) {
      acc[p.sport] = (acc[p.sport] || 0) + 1;
    }
    return acc;
  }, [players]);

  const rosterSummary = useMemo(() => {
    const inPlayCount = players.filter(p => getPlayerRosterStatus(p) === 'in_play').length;
    const reservedCount = players.filter(p => getPlayerRosterStatus(p) === 'reserved').length;
    const totalFouls = players.reduce((sum, p) => sum + getPlayerTotalFouls(p), 0);
    return { inPlayCount, reservedCount, totalFouls };
  }, [players]);

  // Filtered & Sorted Players
  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => {
        // Scorer restriction: view only for assigned sport
        if (isScorer && myOfficial?.sport && myOfficial.sport !== 'All Sports') {
          const officialSportName = myOfficial.sport.toLowerCase();
          const playerSportName = getSportName(p.sport).toLowerCase();
          if (playerSportName !== officialSportName && p.sport.toLowerCase() !== officialSportName) {
            return false;
          }
        }

        // Sport filter
        if (selectedSport !== 'all' && p.sport !== selectedSport) return false;

        // Team filter
        if (selectedTeam !== 'all' && p.teamId !== selectedTeam) return false;

        // Department filter
        if (selectedDept !== 'all' && p.department !== selectedDept) return false;

        // Lineup Status filter (In Play vs Reserved)
        if (rosterStatusFilter !== 'all' && getPlayerRosterStatus(p) !== rosterStatusFilter) return false;

        // Eligibility filter
        if (eligibilityFilter === 'cleared' && !p.medicalCleared) return false;
        if (eligibilityFilter === 'pending' && p.medicalCleared) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchId = !isGuest && p.studentId.toLowerCase().includes(q);
          const matchJersey = p.jerseyNumber.toLowerCase().includes(q);
          const matchPos = (p.position || '').toLowerCase().includes(q);
          return matchName || matchId || matchJersey || matchPos;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'jersey') return Number(a.jerseyNumber || 0) - Number(b.jerseyNumber || 0);
        if (sortBy === 'points') {
          const ptsA = a.currentSeasonGoals ?? a.intGoals ?? 0;
          const ptsB = b.currentSeasonGoals ?? b.intGoals ?? 0;
          return ptsB - ptsA;
        }
        if (sortBy === 'fouls') {
          return getPlayerTotalFouls(b) - getPlayerTotalFouls(a);
        }
        if (sortBy === 'team') {
          const teamA = teams.find(t => t.id === a.teamId)?.name || '';
          const teamB = teams.find(t => t.id === b.teamId)?.name || '';
          return teamA.localeCompare(teamB);
        }
        return 0;
      });
  }, [players, selectedSport, selectedTeam, selectedDept, rosterStatusFilter, eligibilityFilter, searchQuery, sortBy, isScorer, myOfficial, isGuest, teams]);

  const handleOpenEdit = (p: Player) => {
    setEditingPlayer(p);
    setEditForm({
      teamId: p.teamId || '',
      jerseyNumber: p.jerseyNumber,
      position: p.position || '',
      medicalCleared: p.medicalCleared,
      rosterStatus: getPlayerRosterStatus(p),
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    updatePlayer(editingPlayer.id, {
      teamId: editForm.teamId,
      jerseyNumber: editForm.jerseyNumber,
      position: editForm.position,
      medicalCleared: editForm.medicalCleared,
      rosterStatus: editForm.rosterStatus,
    });
    setEditingPlayer(null);
  };

  const handleConfirmRemove = () => {
    if (!playerToRemove) return;
    removePlayer(playerToRemove.id);
    if (activeProfilePlayer?.id === playerToRemove.id) {
      setActiveProfilePlayer(null);
    }
    setPlayerToRemove(null);
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Asian College Padula Athletics</div>
          <h1 className="page-title">Players</h1>
          <p className="page-desc">Comprehensive roster, eligibility verification, and individual athlete profiles</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            <UsersIcon size={15} color="var(--accent)" />
            <span>{players.length} Registered</span>
          </div>


          {canManage && (
            <button
              className="btn btn-primary"
              onClick={() => setActiveView('registration')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <PlusIcon size={16} /> Add Player
            </button>
          )}
        </div>
      </div>

      {/* ── Sport Filter Tabs ── */}
      <div className="glass-card" style={{ padding: '12px 16px' }}>
        <SportFilter
          value={selectedSport}
          onChange={setSelectedSport}
          counts={sportCounts}
          allLabel="All Sports"
        />
      </div>

      {/* ── Players In Play vs Reserved & Game Fouls Summary Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <button
          type="button"
          className="glass-card"
          onClick={() => setRosterStatusFilter(prev => (prev === 'in_play' ? 'all' : 'in_play'))}
          style={{
            padding: '14px 18px',
            textAlign: 'left',
            cursor: 'pointer',
            border: rosterStatusFilter === 'in_play' ? '1.5px solid #10b981' : '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ● Players In Play (On Court)
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Active starters currently in play
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>
            {rosterSummary.inPlayCount}
          </div>
        </button>

        <button
          type="button"
          className="glass-card"
          onClick={() => setRosterStatusFilter(prev => (prev === 'reserved' ? 'all' : 'reserved'))}
          style={{
            padding: '14px 18px',
            textAlign: 'left',
            cursor: 'pointer',
            border: rosterStatusFilter === 'reserved' ? '1.5px solid #f59e0b' : '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ◐ Reserved Players (Bench)
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Substitutes &amp; reserve rotation
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b' }}>
            {rosterSummary.reservedCount}
          </div>
        </button>

        <div
          className="glass-card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Recorded Game Fouls
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Personal, technical, cards &amp; faults
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent)' }}>
            {rosterSummary.totalFouls}
          </div>
        </div>
      </div>


      {/* ── Search & Filter Controls ── */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: '2 1 240px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <SearchIcon size={14} />
          </div>

          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13px' }}
          />
        </div>


        {/* Team filter */}
        <div style={{ flex: '1 1 150px' }}>
          <select
            className="form-input"
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            style={{ fontSize: '12.5px' }}
          >
            <option value="all">All Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>


        {/* College / Department filter */}
        <div style={{ flex: '1 1 150px' }}>
          <select
            className="form-input"
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            style={{ fontSize: '12.5px' }}
          >
            <option value="all">All Colleges</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.shortName} — {d.name}</option>
            ))}
          </select>
        </div>


        {/* Lineup Role filter (In Play vs Reserved) */}
        <div style={{ flex: '1 1 155px' }}>
          <select
            className="form-input"
            value={rosterStatusFilter}
            onChange={e => setRosterStatusFilter(e.target.value as 'all' | 'in_play' | 'reserved')}
            style={{ fontSize: '12.5px' }}
          >
            <option value="all">All Lineup Status</option>
            <option value="in_play">● In Play (Active)</option>
            <option value="reserved">◐ Reserved (Bench)</option>
          </select>
        </div>

        {/* Eligibility filter */}
        {!isGuest && (
          <div style={{ flex: '1 1 140px' }}>
            <select
              className="form-input"
              value={eligibilityFilter}
              onChange={e => setEligibilityFilter(e.target.value as any)}
              style={{ fontSize: '12.5px' }}
            >
              <option value="all">All Eligibility</option>
              <option value="cleared">Cleared / Eligible</option>
              <option value="pending">Pending Clearance</option>
            </select>
          </div>

        )}

        {/* Sort by */}
        <div style={{ flex: '1 1 140px' }}>
          <select
            className="form-input"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{ fontSize: '12.5px' }}
          >
            <option value="name">Sort by Name</option>
            <option value="team">Sort by Team</option>
            <option value="jersey">Sort by Jersey #</option>
            <option value="points">Sort by Points</option>
            <option value="fouls">Sort by Fouls</option>
          </select>
        </div>


        {/* View Mode Toggle */}
        <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('table')}
            style={{ borderRadius: 0, padding: '6px 12px', fontSize: '12px' }}
          >
            Table
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('cards')}
            style={{ borderRadius: 0, padding: '6px 12px', fontSize: '12px' }}
          >
            Cards
          </button>
        </div>

      </div>


      {/* ── Content Area: Empty State or Player Display ── */}
      {filteredPlayers.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UsersIcon size={40} color="var(--text-muted)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '14px 0 6px', color: 'var(--text-primary)' }}>
            No players registered yet
          </h3>
          <p style={{ fontSize: '13px', margin: '0 0 16px' }}>
            {players.length === 0
              ? 'Get started by registering student athletes into the athletic roster.'
              : 'No players match your selected filters. Try clearing your search.'}
          </p>
          {canManage && (
            <button
              className="btn btn-primary"
              onClick={() => setActiveView('registration')}
            >
              <PlusIcon size={15} /> Add Player
            </button>
          )}
        </div>

      ) : viewMode === 'table' ? (
        /* ── TABLE VIEW ── */
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: canManage
              ? '70px 1.9fr 1.3fr 1.1fr 1fr 75px 115px 90px 70px 85px 65px 130px'
              : '70px 1.9fr 1.3fr 1.1fr 1fr 75px 115px 90px 70px 85px 65px',
            padding: '12px 16px',
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            minWidth: '1100px',
            alignItems: 'center',
          }}>
            <span style={{ textAlign: 'center' }}>Jersey #</span>
            <span>Name</span>
            <span>Team</span>
            <span>Sport</span>
            <span>Position</span>
            <span style={{ textAlign: 'center' }}>College</span>
            <span style={{ textAlign: 'center' }}>Lineup Role</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'center' }}>Points</span>
            <span style={{ textAlign: 'center' }}>Fouls</span>
            <span style={{ textAlign: 'center' }}>Matches</span>
            {canManage && <span style={{ textAlign: 'right' }}>Actions</span>}
          </div>


          <div style={{ minWidth: '1100px' }}>
            {filteredPlayers.map(p => {
              const team = teams.find(t => t.id === p.teamId);
              const dept = departments.find(d => d.id === p.department || d.shortName?.toUpperCase() === p.department?.toUpperCase() || d.name?.toLowerCase() === p.department?.toLowerCase());
              const points = p.currentSeasonGoals ?? p.intGoals ?? 0;
              const matches = p.intMatches ?? p.matchStats?.length ?? 0;
              const totalFouls = getPlayerTotalFouls(p);
              const breakdown = getPlayerFoulBreakdown(p);
              const activeFoulSummary = Object.entries(breakdown)
                .filter(([, count]) => count > 0)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ');
              const rosterRole = getPlayerRosterStatus(p);

              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: canManage
                      ? '70px 1.9fr 1.3fr 1.1fr 1fr 75px 115px 90px 70px 85px 65px 130px'
                      : '70px 1.9fr 1.3fr 1.1fr 1fr 75px 115px 90px 70px 85px 65px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    alignItems: 'center',
                    fontSize: '13px',
                    transition: 'background var(--transition)',
                  }}
                  className="player-table-row"
                >
                  {/* Jersey */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      background: 'var(--bg-elevated)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      display: 'inline-block',
                    }}>
                      #{p.jerseyNumber}
                    </span>
                  </div>


                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {p.name[0]}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveProfilePlayer(p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left',
                        }}
                      >
                        {p.name}
                      </button>
                      {!isGuest && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ID: {p.studentId}
                        </div>

                      )}
                    </div>

                  </div>


                  {/* Team */}
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {team?.name || 'Unassigned'}
                  </div>


                  {/* Sport */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    {getSportIcon(p.sport, 14, 'var(--accent)')}
                    <span>{getSportName(p.sport)}</span>
                  </div>


                  {/* Position */}
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                    {p.position || 'Athlete'}
                  </div>


                  {/* College */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: `${dept?.color || '#3b82f6'}18`,
                      color: dept?.color || 'var(--accent)',
                      display: 'inline-block',
                    }}>
                      {dept?.shortName || 'ATH'}
                    </span>
                  </div>

                  {/* Lineup Role (In Play vs Reserved) */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      disabled={!canEditLineupAndFouls}
                      onClick={() => canEditLineupAndFouls && togglePlayerRosterStatus(p.id)}
                      title={
                        canEditLineupAndFouls
                          ? `Click to switch ${p.name} to ${rosterRole === 'in_play' ? 'Reserved (Bench)' : 'In Play (Active)'}`
                          : rosterRole === 'in_play'
                          ? 'In Play (Active Lineup)'
                          : 'Reserved (Bench)'
                      }
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '999px',
                        cursor: canEditLineupAndFouls ? 'pointer' : 'default',
                        background: rosterRole === 'in_play' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                        color: rosterRole === 'in_play' ? '#10b981' : '#f59e0b',
                        border: rosterRole === 'in_play' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rosterRole === 'in_play' ? '● In Play' : '◐ Reserved'}
                    </button>
                  </div>


                  {/* Status */}
                  <div style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${p.medicalCleared ? 'live' : 'scheduled'}`} style={{ fontSize: '10.5px', padding: '2px 8px', display: 'inline-block' }}>
                      {p.medicalCleared ? 'Eligible' : 'Pending'}
                    </span>
                  </div>


                  {/* Points */}
                  <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent)' }}>
                    {points}
                  </div>

                  {/* Fouls */}
                  <div
                    style={{ textAlign: 'center' }}
                    title={activeFoulSummary || 'No fouls recorded'}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveProfilePlayer(p)}
                      style={{
                        background: totalFouls > 0 ? 'rgba(245, 158, 11, 0.14)' : 'var(--bg-elevated)',
                        color: totalFouls > 0 ? '#f59e0b' : 'var(--text-muted)',
                        border: totalFouls > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-light)',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {totalFouls} {totalFouls === 1 ? 'Foul' : 'Fouls'}
                    </button>
                  </div>


                  {/* Matches */}
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {matches}
                  </div>


                  {/* Actions (Director/Coordinator only) */}
                  {canManage && (
                    <div style={{ textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleOpenEdit(p)}
                        style={{ fontSize: '11.5px', padding: '4px 8px' }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setPlayerToRemove(p)}
                        style={{ fontSize: '11.5px', padding: '4px 8px', color: '#38bdf8' }}
                      >
                        Remove
                      </button>
                    </div>

                  )}
                </div>

              );
            })}
          </div>

        </div>

      ) : (
        /* ── CARD VIEW ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '16px',
        }}>
          {filteredPlayers.map(p => {
            const team = teams.find(t => t.id === p.teamId);
            const dept = departments.find(d => d.id === p.department || d.shortName?.toUpperCase() === p.department?.toUpperCase() || d.name?.toLowerCase() === p.department?.toLowerCase());
            const deptColor = dept?.color || '#0f2d5c';
            const points = p.currentSeasonGoals ?? p.intGoals ?? 0;
            const matchesCount = p.intMatches ?? p.matchStats?.length ?? 0;
            const totalFouls = getPlayerTotalFouls(p);
            const rosterRole = getPlayerRosterStatus(p);
            const initials = p.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

            return (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  padding: 0,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = deptColor;
                  e.currentTarget.style.boxShadow = `0 10px 24px -6px ${deptColor}30`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = '';
                }}
                onClick={() => setActiveProfilePlayer(p)}
              >
                {/* Top Department Color Accent Strip */}
                <div style={{ height: '4px', width: '100%', background: deptColor }} />

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {/* Top Badges Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        background: '#0f2d5c',
                        color: '#ffffff',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                      }}>
                        #{p.jerseyNumber || '00'}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: `${deptColor}1a`,
                        color: deptColor,
                        border: `1px solid ${deptColor}40`,
                      }}>
                        {dept?.shortName || 'ATH'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <button
                        type="button"
                        disabled={!canEditLineupAndFouls}
                        onClick={e => {
                          e.stopPropagation();
                          if (canEditLineupAndFouls) togglePlayerRosterStatus(p.id);
                        }}
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          cursor: canEditLineupAndFouls ? 'pointer' : 'default',
                          background: rosterRole === 'in_play' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                          color: rosterRole === 'in_play' ? '#10b981' : '#f59e0b',
                          border: rosterRole === 'in_play' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                        }}
                      >
                        {rosterRole === 'in_play' ? '● In Play' : '◐ Reserved'}
                      </button>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: p.medicalCleared ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                        color: p.medicalCleared ? '#10b981' : '#f59e0b',
                        border: p.medicalCleared ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      }}>
                        {p.medicalCleared ? '✓ Eligible' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Athlete Identity */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${deptColor}28 0%, var(--bg-elevated) 100%)`,
                      border: `1.5px solid ${deptColor}80`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                      letterSpacing: '0.02em',
                    }}>
                      {initials}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {p.name}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '1px' }}>
                        {p.position || 'Athlete'} · {getSportName(p.sport)}
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: deptColor,
                          fontWeight: 700,
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={dept ? `${dept.shortName} — ${dept.name}` : p.department}
                      >
                        {dept ? `${dept.shortName} · ${dept.name}` : (p.department || 'Department Unassigned')}
                      </div>
                    </div>
                  </div>

                  {/* Mini Stat Strip */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr',
                    gap: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    marginTop: 'auto',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Team</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {team?.name || 'Unassigned'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '6px' }}>
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Games</div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>{matchesCount}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '6px' }}>
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pts</div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--accent)' }}>{points}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '6px' }}>
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fouls</div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: totalFouls > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>{totalFouls}</div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-light)',
                    fontSize: '11px',
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>ID: {p.studentId}</span>
                    {canManage ? (
                      <div
                        style={{ display: 'flex', gap: '6px' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleOpenEdit(p)}
                          style={{ fontSize: '11px', padding: '3px 9px' }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => setPlayerToRemove(p)}
                          style={{ fontSize: '11px', padding: '3px 9px', color: '#38bdf8' }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>View Profile ↗</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      )}

      {/* ── PLAYER PROFILE MODAL / DRAWER ── */}
      {liveProfilePlayer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative',
            background: 'var(--bg-card)',
          }}>
            <button
              type="button"
              onClick={() => setActiveProfilePlayer(null)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XIcon size={18} />
            </button>

            {/* Profile Header */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '24px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {liveProfilePlayer.name[0]}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {liveProfilePlayer.name}
                  </h2>
                  <button
                    type="button"
                    disabled={!canEditLineupAndFouls}
                    onClick={() => canEditLineupAndFouls && togglePlayerRosterStatus(liveProfilePlayer.id)}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 9px',
                      borderRadius: '999px',
                      cursor: canEditLineupAndFouls ? 'pointer' : 'default',
                      background: getPlayerRosterStatus(liveProfilePlayer) === 'in_play' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                      color: getPlayerRosterStatus(liveProfilePlayer) === 'in_play' ? '#10b981' : '#f59e0b',
                      border: getPlayerRosterStatus(liveProfilePlayer) === 'in_play' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    {getPlayerRosterStatus(liveProfilePlayer) === 'in_play' ? '● IN PLAY (Active Lineup)' : '◐ RESERVED (Bench)'}
                  </button>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>#{liveProfilePlayer.jerseyNumber}</span>
                  <span>·</span>
                  <span>{liveProfilePlayer.position || 'Athlete'}</span>
                  <span>·</span>
                  <span>{getSportName(liveProfilePlayer.sport)}</span>
                </div>
              </div>
            </div>

            {/* Eligibility & Details Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Eligibility Status</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: liveProfilePlayer.medicalCleared ? '#10b981' : '#f59e0b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {liveProfilePlayer.medicalCleared ? <><CheckIcon size={12} color="#10b981" /> Medically Cleared</> : 'Pending Physical Exam'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team Affiliation</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {teams.find(t => t.id === liveProfilePlayer.teamId)?.name || 'Unassigned'}
                </div>
              </div>

              {!isGuest && (
                <>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student ID</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {liveProfilePlayer.studentId}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic GWA</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {liveProfilePlayer.gwa?.toFixed(2) || '1.75'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* All Game Fouls & Discipline Breakdown */}
            {(() => {
              const rules = getSportFoulRules(liveProfilePlayer.sport);
              const breakdown = getPlayerFoulBreakdown(liveProfilePlayer);
              const totalFouls = getPlayerTotalFouls(liveProfilePlayer);
              return (
                <div style={{ marginBottom: '18px', background: 'var(--bg-elevated)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        All Game Fouls &amp; Violations ({getSportName(liveProfilePlayer.sport)})
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Complete breakdown of all fouls recorded for this athlete
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: totalFouls > 0 ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-surface)',
                        color: totalFouls > 0 ? '#f59e0b' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Total: {totalFouls} Foul{totalFouls === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' }}>
                    {rules.types.map(ft => {
                      const count = breakdown[ft.id] || 0;
                      return (
                        <div
                          key={ft.id}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: 'var(--bg-surface)',
                            border: count > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ft.label}>
                              {ft.shortLabel}
                            </div>
                            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                              {ft.category.toUpperCase()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {canEditLineupAndFouls && (
                              <button
                                type="button"
                                className="btn btn-xs btn-ghost"
                                disabled={count === 0}
                                onClick={() => recordPlayerFoul(liveProfilePlayer.id, ft.id, -1)}
                                style={{ padding: '1px 5px', fontSize: '11px' }}
                              >
                                −
                              </button>
                            )}
                            <span style={{ fontSize: '13px', fontWeight: 800, color: count > 0 ? '#f59e0b' : 'var(--text-muted)', minWidth: '16px', textAlign: 'center' }}>
                              {count}
                            </span>
                            {canEditLineupAndFouls && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => recordPlayerFoul(liveProfilePlayer.id, ft.id, 1)}
                                style={{ padding: '1px 5px', fontSize: '11px' }}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Match Stats History */}
            {liveProfilePlayer.matchStats && liveProfilePlayer.matchStats.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Recent Match Results &amp; Performance
                </h4>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', overflow: 'hidden' }}>
                  {liveProfilePlayer.matchStats.map((ms, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      fontSize: '12px',
                      borderBottom: idx < (liveProfilePlayer.matchStats?.length || 0) - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>{ms.matchday}</span> vs <span>{ms.opponent}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '6px' }}>({ms.venue})</span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700 }}>{ms.result}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{ms.points} pts</span>
                        <span style={{ color: (ms.fouls || 0) > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 700 }}>
                          {ms.fouls || 0} fouls
                        </span>
                      </div>

                    </div>

                  ))}
                </div>

              </div>

            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setActiveProfilePlayer(null)}
              >
                Close
              </button>
              {canManage && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleOpenEdit(liveProfilePlayer);
                    setActiveProfilePlayer(null);
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>

          </div>

        </div>

      )}

      {/* ── EDIT PLAYER MODAL (Director/Coordinator only) ── */}
      {editingPlayer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            background: 'var(--bg-card)',
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              Edit Athlete: {editingPlayer.name}
            </h3>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Assigned Team
                </label>
                <select
                  className="form-input"
                  value={editForm.teamId}
                  onChange={e => setEditForm(prev => ({ ...prev, teamId: e.target.value }))}
                >
                  <option value="">No Team Assigned</option>
                  {teams.filter(t => t.sport === editingPlayer.sport).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>


              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Jersey #
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.jerseyNumber}
                    onChange={e => setEditForm(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Position
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.position}
                    onChange={e => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>

              </div>


              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Lineup Role (In Play vs Reserved)
                </label>
                <select
                  className="form-input"
                  value={editForm.rosterStatus}
                  onChange={e => setEditForm(prev => ({ ...prev, rosterStatus: e.target.value as PlayerRosterStatus }))}
                >
                  <option value="in_play">● In Play (Active / Starter On Court)</option>
                  <option value="reserved">◐ Reserved (Bench / Substitute)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Medical Clearance
                </label>
                <select
                  className="form-input"
                  value={editForm.medicalCleared ? 'cleared' : 'pending'}
                  onChange={e => setEditForm(prev => ({ ...prev, medicalCleared: e.target.value === 'cleared' }))}
                >
                  <option value="cleared">Cleared for Competition (Eligible)</option>
                  <option value="pending">Pending Physical Clearance</option>
                </select>
              </div>


              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingPlayer(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>

        </div>

      )}

      {/* ── REMOVE PLAYER CONFIRMATION MODAL ── */}
      {playerToRemove && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            background: 'var(--bg-card)',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>
              Remove Athlete?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{playerToRemove.name}</strong> from the athletic roster? This will remove all associated tournament records.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setPlayerToRemove(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: '#38bdf8', borderColor: '#38bdf8' }}
                onClick={handleConfirmRemove}
              >
                Remove Athlete
              </button>
            </div>

          </div>

        </div>

      )}
    </div>
  );
}
