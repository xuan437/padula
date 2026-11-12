import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName, getSportIcon } from '../lib/sports';
import { SportFilter } from '../components/ui';
import {
  UsersIcon,
  SearchIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
} from '../components/Icons';
import type { Player } from '../types';

export default function PlayerDashboard() {
  const {
    currentUser,
    players,
    teams,
    departments,
    setActiveView,
    updatePlayer,
    removePlayer,
    officials,
  } = useApp();

  // Role permissions
  const isDirector = currentUser?.role === 'director';
  const isCoordinator = currentUser?.role === 'coordinator';
  const canManage = isDirector || isCoordinator;
  const isScorer = currentUser?.role === 'scorer';
  const isGuest = !currentUser || currentUser?.role === 'guest';
  const isPlayer = currentUser?.role === 'player';

  // Find my athlete profile if logged in as player
  const myPlayerProfile = useMemo(() => {
    if (!isPlayer) return null;
    return players.find(p =>
      (p.email && currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      p.studentId.toLowerCase() === currentUser?.username.toLowerCase() ||
      p.name.toLowerCase() === currentUser?.name.toLowerCase()
    );
  }, [isPlayer, players, currentUser]);

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
  const [sortBy, setSortBy] = useState<'name' | 'team' | 'jersey' | 'points'>('name');
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
  });

  const sportCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of players) {
      acc[p.sport] = (acc[p.sport] || 0) + 1;
    }
    return acc;
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
        if (sortBy === 'team') {
          const teamA = teams.find(t => t.id === a.teamId)?.name || '';
          const teamB = teams.find(t => t.id === b.teamId)?.name || '';
          return teamA.localeCompare(teamB);
        }
        return 0;
      });
  }, [players, selectedSport, selectedTeam, selectedDept, eligibilityFilter, searchQuery, sortBy, isScorer, myOfficial, isGuest, teams]);

  const handleOpenEdit = (p: Player) => {
    setEditingPlayer(p);
    setEditForm({
      teamId: p.teamId || '',
      jerseyNumber: p.jerseyNumber,
      position: p.position || '',
      medicalCleared: p.medicalCleared,
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

      {/* ── Athlete Profile Hero (Shown when logged in as a Player) ── */}
      {isPlayer && myPlayerProfile && (
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(15,23,42,0.85) 100%)',
            border: '1.5px solid var(--accent)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-sports)',
              fontWeight: 900,
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
            }}>
              #{myPlayerProfile.jerseyNumber || '00'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Student Athlete Portal
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: myPlayerProfile.medicalCleared ? '#10b981' : '#ef4444',
                  background: myPlayerProfile.medicalCleared ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  {myPlayerProfile.medicalCleared ? <><CheckIcon size={11} color="#10b981" /> Cleared</> : 'Medical Pending'}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Welcome, {myPlayerProfile.name}
              </h2>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>ID: <strong style={{ color: 'var(--text-primary)' }}>{myPlayerProfile.studentId}</strong></span>
                <span>Team: <strong style={{ color: 'var(--accent)' }}>{teams.find(t => t.id === myPlayerProfile.teamId)?.name || 'Unassigned'}</strong></span>
                <span>Sport: <strong style={{ color: 'var(--text-primary)' }}>{getSportName(myPlayerProfile.sport)}</strong></span>
                <span>Position: <strong style={{ color: 'var(--text-primary)' }}>{myPlayerProfile.position || 'Athlete'}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setActiveProfilePlayer(myPlayerProfile)}
              style={{ fontWeight: 700, padding: '8px 18px' }}
            >
              View My Match Stats & Profile
            </button>
          </div>
        </div>
      )}

      {/* ── Sport Filter Tabs ── */}
      <div className="glass-card" style={{ padding: '12px 16px' }}>
        <SportFilter
          value={selectedSport}
          onChange={setSelectedSport}
          counts={sportCounts}
          allLabel="All Sports"
        />
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
            placeholder={isGuest ? 'Search by athlete name, jersey #, position...' : 'Search by athlete name, student ID, jersey #, position...'}
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


        {/* Eligibility filter */}
        {!isGuest && (
          <div style={{ flex: '1 1 140px' }}>
            <select
              className="form-input"
              value={eligibilityFilter}
              onChange={e => setEligibilityFilter(e.target.value as any)}
              style={{ fontSize: '12.5px' }}
            >
              <option value="all">All Status</option>
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
              ? 'Get started by registering student athletes into the intramural roster.'
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
              ? '75px 2fr 1.4fr 1.2fr 1.1fr 80px 95px 75px 75px 130px'
              : '75px 2fr 1.4fr 1.2fr 1.1fr 80px 95px 75px 75px',
            padding: '12px 16px',
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            minWidth: '950px',
            alignItems: 'center',
          }}>
            <span style={{ textAlign: 'center' }}>Jersey #</span>
            <span>Name</span>
            <span>Team</span>
            <span>Sport</span>
            <span>Position</span>
            <span style={{ textAlign: 'center' }}>College</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'center' }}>Points</span>
            <span style={{ textAlign: 'center' }}>Matches</span>
            {canManage && <span style={{ textAlign: 'right' }}>Actions</span>}
          </div>


          <div style={{ minWidth: '950px' }}>
            {filteredPlayers.map(p => {
              const team = teams.find(t => t.id === p.teamId);
              const dept = departments.find(d => d.id === p.department);
              const points = p.currentSeasonGoals ?? p.intGoals ?? 0;
              const matches = p.intMatches ?? p.matchStats?.length ?? 0;

              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: canManage
                      ? '75px 2fr 1.4fr 1.2fr 1.1fr 80px 95px 75px 75px 130px'
                      : '75px 2fr 1.4fr 1.2fr 1.1fr 80px 95px 75px 75px',
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
                        style={{ fontSize: '11.5px', padding: '4px 8px', color: '#ef4444' }}
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {filteredPlayers.map(p => {
            const team = teams.find(t => t.id === p.teamId);
            const dept = departments.find(d => d.id === p.department);
            const points = p.currentSeasonGoals ?? p.intGoals ?? 0;

            return (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}
                onClick={() => setActiveProfilePlayer(p)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}>
                        #{p.jerseyNumber}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: `${dept?.color || '#3b82f6'}18`,
                        color: dept?.color || 'var(--accent)',
                      }}>
                        {dept?.shortName || 'ATH'}
                      </span>
                    </div>


                    <span className={`status-badge ${p.medicalCleared ? 'live' : 'scheduled'}`} style={{ fontSize: '10px' }}>
                      {p.medicalCleared ? 'Eligible' : 'Pending'}
                    </span>
                  </div>


                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      border: '2px solid var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                    }}>
                      {p.name[0]}
                    </div>

                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.name}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {p.position || 'Athlete'} · {getSportName(p.sport)}
                      </div>

                    </div>

                  </div>

                </div>


                <div style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}>
                  <span>Team: <strong>{team?.name || 'Unassigned'}</strong></span>
                  <span>Pts: <strong style={{ color: 'var(--accent)' }}>{points}</strong></span>
                </div>


                {canManage && (
                  <div
                    style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '4px' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleOpenEdit(p)}
                      style={{ fontSize: '11.5px', padding: '3px 8px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setPlayerToRemove(p)}
                      style={{ fontSize: '11.5px', padding: '3px 8px', color: '#ef4444' }}
                    >
                      Remove
                    </button>
                  </div>

                )}
              </div>

            );
          })}
        </div>

      )}

      {/* ── PLAYER PROFILE MODAL / DRAWER ── */}
      {activeProfilePlayer && (
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
            maxWidth: '560px',
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
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
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
                {activeProfilePlayer.name[0]}
              </div>

              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  {activeProfilePlayer.name}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>#{activeProfilePlayer.jerseyNumber}</span>
                  <span>·</span>
                  <span>{activeProfilePlayer.position || 'Athlete'}</span>
                  <span>·</span>
                  <span>{getSportName(activeProfilePlayer.sport)}</span>
                </div>

              </div>

            </div>


            {/* Eligibility & Details Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Eligibility Status</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: activeProfilePlayer.medicalCleared ? '#10b981' : '#f59e0b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {activeProfilePlayer.medicalCleared ? <><CheckIcon size={12} color="#10b981" /> Medically Cleared</> : 'Pending Physical Exam'}
                </div>

              </div>


              <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team Affiliation</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {teams.find(t => t.id === activeProfilePlayer.teamId)?.name || 'Unassigned'}
                </div>

              </div>


              {!isGuest && (
                <>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student ID</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {activeProfilePlayer.studentId}
                    </div>

                  </div>


                  <div style={{ background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic GWA</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {activeProfilePlayer.gwa?.toFixed(2) || '1.75'}
                    </div>

                  </div>

                </>
              )}
            </div>


            {/* Match Stats History */}
            {activeProfilePlayer.matchStats && activeProfilePlayer.matchStats.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Recent Match Results & Performance
                </h4>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', overflow: 'hidden' }}>
                  {activeProfilePlayer.matchStats.map((ms, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      fontSize: '12px',
                      borderBottom: idx < (activeProfilePlayer.matchStats?.length || 0) - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>{ms.matchday}</span> vs <span>{ms.opponent}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '6px' }}>({ms.venue})</span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700 }}>{ms.result}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{ms.points} pts</span>
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
                    handleOpenEdit(activeProfilePlayer);
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
                    placeholder="e.g. Point Guard, Libero"
                  />
                </div>

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
              Are you sure you want to remove <strong>{playerToRemove.name}</strong> from the intramural roster? This will remove all associated tournament records.
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
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
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
