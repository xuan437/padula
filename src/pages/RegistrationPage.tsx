import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardIcon,
  CheckIcon,
  CalendarIcon,
  MailIcon,
  XIcon,
  CopyIcon,
  UsersIcon,
  UserIcon,
  PlusIcon,
  ShieldIcon,
  TrophyIcon,
} from '../components/Icons';
import { SPORTS_CATALOG, getSportName, getSportIcon } from '../lib/sports';
import { buildGmailComposeUrl } from '../lib/emailApi';
import type { StaffInvitation, Team, Player } from '../types';

const POSITIONS_BY_SPORT: Record<string, string[]> = {
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Libero', 'Opposite Hitter'],
  Football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker'],
  'Sepak Takraw': ['Tekong (Server)', 'Killer (Spiker)', 'Feeder (Setter)'],
  Badminton: ['Singles Specialist', 'Doubles Front', 'Doubles Back'],
  'Table Tennis': ['Offensive Attacker', 'Defensive Chopper', 'All-Rounder'],
  'Frisbee (Ultimate)': ['Handler', 'Cutter', 'Deep Receiver'],
  Chess: ['Board 1', 'Board 2', 'Board 3', 'Alternate'],
  Scrabble: ['Player', 'Alternate'],
  'Mobile Legends': ['Mid Lane', 'Jungler', 'Exp Lane', 'Gold Lane', 'Roamer'],
  'DOTA 2': ['Carry (Pos 1)', 'Mid (Pos 2)', 'Offlane (Pos 3)', 'Soft Support (Pos 4)', 'Hard Support (Pos 5)'],
  Valorant: ['Duelist', 'Initiator', 'Controller', 'Sentinel'],
};

export function formatPlayerInitialLastName(fullName: string): string {
  if (!fullName || !fullName.trim()) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return parts[0];
  const firstInitial = parts[0].charAt(0).toUpperCase();
  let lastName = parts[parts.length - 1];
  if (parts.length > 2) {
    const prefix = parts[parts.length - 2].toLowerCase();
    if (['de', 'dela', 'del', 'san', 'sta', 'los', 'las'].includes(prefix)) {
      lastName = `${parts[parts.length - 2]} ${lastName}`;
    }
  }
  return `${firstInitial}.${lastName}`;
}

type RegTab = 'teams' | 'players' | 'referees' | 'scorekeepers' | 'coaches' | 'managers' | 'coordinators';

const MAX_COORDINATORS = 3;

export default function RegistrationPage() {
  const {
    currentUser,
    registeredUsers,
    registerUser,
    staffInvitations,
    latestInvitation,
    clearLatestInvitation,
    respondToInvitation,
    officials,
    registerOfficial,
    toggleOfficialStatus,
    removeOfficial,
    players,
    registerPlayer,
    updatePlayer,
    togglePlayerStatus,
    removePlayer,
    teams,
    registerTeam,
    toggleTeamStatus,
    removeTeam,
    matches,
    departments,
    toggleUserStatus,
    removeUser,
    setActiveView,
  } = useApp();

  const isDirector = currentUser?.role === 'director';
  const isCoordinator = currentUser?.role === 'coordinator';
  const canRegister = isDirector || isCoordinator;

  const [activeTab, setActiveTab] = useState<RegTab>('teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [registeredPlayerNotice, setRegisteredPlayerNotice] = useState<boolean>(false);
  const [selectedInvitationModal, setSelectedInvitationModal] = useState<StaffInvitation | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [apiTargetEmailOverride, setApiTargetEmailOverride] = useState('');
  const [apiDispatchFeedback, setApiDispatchFeedback] = useState<{
    success: boolean;
    message: string;
    txId?: string;
    timestamp?: string;
  } | null>(null);
  const [viewingRosterTeam, setViewingRosterTeam] = useState<Team | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const getTeamPlayers = (team: Team) => {
    return players.filter(p =>
      p.teamId === team.id ||
      (team.players && team.players.includes(p.id)) ||
      (p.sport === team.sport && p.department === team.department)
    );
  };

  useEffect(() => {
    if (latestInvitation) {
      setSelectedInvitationModal(latestInvitation);
      setApiTargetEmailOverride('');
      setApiDispatchFeedback(null);
      clearLatestInvitation();
    }
  }, [latestInvitation, clearLatestInvitation]);

  const showBanner = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Active Coordinators calculation
  const activeCoordinators = useMemo(() => {
    return registeredUsers.filter(u => u.role === 'coordinator' && u.isActive !== false);
  }, [registeredUsers]);

  const coordinatorLimitReached = activeCoordinators.length >= MAX_COORDINATORS;

  // Form states
  const [teamForm, setTeamForm] = useState({ name: '', sport: 's1', department: 'd1', division: 'div1', color: '#3b82f6' });
  const [playerForm, setPlayerForm] = useState({ name: '', studentId: '', department: 'd1', sport: 's1', teamId: '', jerseyNumber: '', position: '', email: '', medicalCleared: true });
  const [officialForm, setOfficialForm] = useState({ name: '', sport: 'Basketball', affiliation: '', licenseId: '', contact: '' });
  const [coordForm, setCoordForm] = useState({ name: '', email: '', department: 'd1' });

  // Handle Team Submit
  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    registerTeam({
      name: teamForm.name.trim(),
      sport: teamForm.sport,
      department: teamForm.department,
      division: teamForm.division,
      players: [],
      color: teamForm.color,
      isActive: true,
    });
    setSuccessBanner(`Team "${teamForm.name}" registered and automatically assigned to an open match slot in the Scorer Desk!`);
    setTeamForm({ name: '', sport: 's1', department: 'd1', division: 'div1', color: '#3b82f6' });
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Handle Player Submit
  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name.trim() || !playerForm.studentId.trim()) return;
    const cleanStudentId = playerForm.studentId.trim();
    const cleanEmail = playerForm.email.trim().toLowerCase() || `${cleanStudentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.asiancollege.edu.ph`;

    // Register player entity (no player login account)
    registerPlayer({
      name: playerForm.name.trim(),
      studentId: cleanStudentId,
      department: playerForm.department,
      sport: playerForm.sport,
      teamId: playerForm.teamId || undefined,
      jerseyNumber: playerForm.jerseyNumber.trim() || '00',
      position: playerForm.position.trim() || 'Player',
      email: cleanEmail,
      medicalCleared: playerForm.medicalCleared,
      isActive: true,
      currentSeasonGoals: 0,
    });

    const assignedTeam = teams.find(t => t.id === playerForm.teamId);
    const teamNotice = assignedTeam ? ` and assigned to team "${assignedTeam.name}"` : '';
    setSuccessBanner(`Athlete "${playerForm.name}" (${cleanStudentId}) registered successfully${teamNotice}.`);
    setRegisteredPlayerNotice(true);
    setPlayerForm({ name: '', studentId: '', department: 'd1', sport: 's1', teamId: '', jerseyNumber: '', position: '', email: '', medicalCleared: true });
    setTimeout(() => {
      setRegisteredPlayerNotice(false);
      setSuccessBanner(null);
    }, 5000);
  };

  // Player Edit & Reassign State
  const [editingAthlete, setEditingAthlete] = useState<Player | null>(null);
  const [editAthleteForm, setEditAthleteForm] = useState<{
    teamId: string;
    jerseyNumber: string;
    position: string;
    medicalCleared: boolean;
  }>({ teamId: '', jerseyNumber: '', position: '', medicalCleared: true });

  const startEditAthlete = (p: Player) => {
    setEditingAthlete(p);
    setEditAthleteForm({
      teamId: p.teamId || '',
      jerseyNumber: p.jerseyNumber || '',
      position: p.position || '',
      medicalCleared: p.medicalCleared !== false,
    });
  };

  const handleSaveAthleteEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAthlete) return;
    updatePlayer(editingAthlete.id, {
      teamId: editAthleteForm.teamId || undefined,
      jerseyNumber: editAthleteForm.jerseyNumber.trim() || '00',
      position: editAthleteForm.position.trim() || 'Player',
      medicalCleared: editAthleteForm.medicalCleared,
    });
    const assignedTeam = teams.find(t => t.id === editAthleteForm.teamId);
    showBanner(`Athlete "${editingAthlete.name}" updated successfully${assignedTeam ? ` and assigned to ${assignedTeam.name}` : ''}.`);
    setEditingAthlete(null);
  };

  const handlePlayerTeamSelect = (selectedId: string) => {
    if (!selectedId) {
      setPlayerForm(p => ({ ...p, teamId: '' }));
      return;
    }
    const chosenTeam = teams.find(t => t.id === selectedId);
    if (chosenTeam) {
      setPlayerForm(p => ({
        ...p,
        teamId: chosenTeam.id,
        department: chosenTeam.department || p.department,
        sport: chosenTeam.sport || p.sport,
      }));
    }
  };

  const currentSportName = useMemo(() => getSportName(playerForm.sport), [playerForm.sport]);
  const sportPresetPositions = useMemo(() => POSITIONS_BY_SPORT[currentSportName] || [], [currentSportName]);

  const playerMatchingTeams = useMemo(() => {
    return teams.filter(t => {
      if (t.isActive === false) return false;
      const tSport = getSportName(t.sport).toLowerCase();
      const curSport = currentSportName.toLowerCase();
      return (t.sport === playerForm.sport || tSport === curSport) && t.department === playerForm.department;
    });
  }, [teams, playerForm.sport, playerForm.department, currentSportName]);

  const playerOtherSportTeams = useMemo(() => {
    return teams.filter(t => {
      if (t.isActive === false) return false;
      const tSport = getSportName(t.sport).toLowerCase();
      const curSport = currentSportName.toLowerCase();
      return (t.sport === playerForm.sport || tSport === curSport) && t.department !== playerForm.department;
    });
  }, [teams, playerForm.sport, playerForm.department, currentSportName]);

  const playerOtherActiveTeams = useMemo(() => {
    return teams.filter(t => {
      if (t.isActive === false) return false;
      const tSport = getSportName(t.sport).toLowerCase();
      const curSport = currentSportName.toLowerCase();
      return t.sport !== playerForm.sport && tSport !== curSport;
    });
  }, [teams, playerForm.sport, currentSportName]);

  const selectedTeamDetails = useMemo(() => {
    return teams.find(t => t.id === playerForm.teamId);
  }, [teams, playerForm.teamId]);

  // Handle Official Submit (referee, scorekeeper, coach, manager)
  const handleOfficialSubmit = (role: 'referee' | 'scorekeeper' | 'coach' | 'manager') => (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialForm.name.trim()) return;

    const cleanName = officialForm.name.trim();
    const cleanSport = officialForm.sport;
    const cleanContact = officialForm.contact.trim().toLowerCase();
    const license = officialForm.licenseId.trim() || `PAD-${role.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`;

    // 1. Register official in officials table
    registerOfficial({
      name: cleanName,
      role,
      sport: cleanSport,
      affiliation: officialForm.affiliation.trim() || 'Asian College Board',
      licenseId: license,
      contact: cleanContact,
      isActive: true,
    });

    // 2. If scorekeeper, register into authorized staff user accounts for Google sign-in
    if (role === 'scorekeeper') {
      const cleanEmail = cleanContact.includes('@')
        ? cleanContact
        : (cleanContact ? `${cleanContact}@asiancollege.edu.ph` : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@asiancollege.edu.ph`);
      const cleanUsername = cleanContact
        ? (cleanContact.includes('@') ? cleanContact.split('@')[0] : cleanContact)
        : cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

      const inv = registerUser({
        id: `u-sc-${Date.now()}`,
        name: cleanName,
        role: 'scorer',
        username: cleanUsername,
        email: cleanEmail,
        assignedSport: cleanSport,
        avatarInitials: cleanName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        isActive: true,
      });

      if (inv) {
        setSelectedInvitationModal(inv);
      }

      setSuccessBanner(`Scorekeeper "${cleanName}" registered! Official invitation letter with password (${inv?.generatedPassword || ''}) sent to ${cleanEmail}.`);
    } else {
      setSuccessBanner(`${role.charAt(0).toUpperCase() + role.slice(1)} "${cleanName}" registered and automatically assigned to ${cleanSport} match slots.`);
    }

    setOfficialForm({ name: '', sport: 'Basketball', affiliation: '', licenseId: '', contact: '' });
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  // Handle Coordinator Submit (Director Only)
  const handleCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector || coordinatorLimitReached) return;
    if (!coordForm.name.trim() || !coordForm.email.trim()) return;

    const email = coordForm.email.trim().toLowerCase();
    const finalEmail = email.includes('@') ? email : `${email}@asiancollege.edu.ph`;

    const inv = registerUser({
      id: `u-${Date.now()}`,
      name: coordForm.name.trim(),
      role: 'coordinator',
      username: finalEmail.split('@')[0],
      email: finalEmail,
      department: coordForm.department,
      isActive: true,
    });

    if (inv) {
      setSelectedInvitationModal(inv);
    }

    setSuccessBanner(`Sports Coordinator "${coordForm.name}" registered! Official invitation letter with password (${inv?.generatedPassword || ''}) sent to "${finalEmail}".`);
    setCoordForm({ name: '', email: '', department: 'd1' });
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  if (!canRegister) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>Access Restricted</h2>
        <p>Only Sports Directors and Coordinators can access this registration portal.</p>
        <button className="btn btn-primary" onClick={() => setActiveView('public')} style={{ marginTop: '14px' }}>
          Return to Public Results
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '22px',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
    }}>
      
      {/* ── Page Header & Top Summary Stats ── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardIcon size={16} />
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>
                Official Registration Desk
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              Tournament Registration
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Single source of truth for registering teams, student athletes, game officials, and coordinators.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setActiveView('event-setup')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600 }}
          >
            <CalendarIcon size={15} /> Open Tournament Setup Wizard →
          </button>
        </div>

        {/* ── Summary Stats Badges Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Teams</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{teams.length}</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Athletes</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{players.length}</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Officials</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{officials.length}</div>
          </div>
          {isDirector && (
            <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Coordinators</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: coordinatorLimitReached ? '#ea580c' : 'var(--text-primary)', marginTop: '2px' }}>
                {activeCoordinators.length} of {MAX_COORDINATORS}
              </div>
            </div>
          )}
          <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Pending Clearance</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#eab308', marginTop: '2px' }}>
              {players.filter(p => !p.medicalCleared).length}
            </div>
          </div>
        </div>
      </div>

      {/* ── Success / Alert Banners ── */}
      {successBanner && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '10px',
          padding: '12px 18px',
          fontSize: '13.5px',
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
        }}>
          <CheckIcon size={18} color="#059669" />
          {successBanner}
        </div>
      )}

      {registeredPlayerNotice && (
        <div style={{
          background: 'var(--accent-light)',
          border: '1px solid var(--accent-border)',
          borderRadius: '10px',
          padding: '12px 18px',
          fontSize: '13.5px',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
            <CheckIcon size={18} color="var(--accent)" />
            Player registered.
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setActiveView('player')}
            style={{ fontWeight: 700 }}
          >
            View in Players List →
          </button>
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'teams', label: 'Teams' },
          { id: 'players', label: 'Players' },
          { id: 'referees', label: 'Referees' },
          { id: 'scorekeepers', label: 'Scorekeepers' },
          { id: 'coaches', label: 'Coaches' },
          { id: 'managers', label: 'Managers' },
          ...(isDirector ? [{ id: 'coordinators', label: `Sports Coordinators (${activeCoordinators.length}/${MAX_COORDINATORS})` }] : []),
        ].map(t => (
          <button
            key={t.id}
            type="button"
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setActiveTab(t.id as RegTab); setSearchQuery(''); }}
            style={{ borderRadius: '20px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: TEAMS REGISTRATION                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'teams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px' }}>Register Team</h3>
            <form onSubmit={handleTeamSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter team name"
                  value={teamForm.name}
                  onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department / College</label>
                <select
                  value={teamForm.department}
                  onChange={e => setTeamForm(p => ({ ...p, department: e.target.value }))}
                  className="form-input"
                >
                  {departments.map(d => <option key={d.id} value={d.id}>{d.shortName} – {d.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sport</label>
                <select
                  value={teamForm.sport}
                  onChange={e => setTeamForm(p => ({ ...p, sport: e.target.value }))}
                  className="form-input"
                >
                  {SPORTS_CATALOG.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.format})</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '11px 18px', fontWeight: 700 }}>
                Register Team
              </button>
            </form>
          </div>

          {/* Teams Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Registered Teams ({teams.length})</h3>
              <input
                type="text"
                placeholder="Search teams…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ maxWidth: '220px', padding: '6px 12px', fontSize: '12.5px' }}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px' }}>Team Name</th>
                    <th style={{ padding: '10px 12px' }}>Department</th>
                    <th style={{ padding: '10px 12px' }}>Sport</th>
                    <th style={{ padding: '10px 12px' }}>Scorer Desk Slot</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => {
                    const dept = departments.find(d => d.id === t.department);
                    const isActive = t.isActive !== false;
                    const teamPlayers = getTeamPlayers(t);
                    const assignedMatch = matches.find(m => m.sport === t.sport && (m.teamA === t.name || m.teamB === t.name));
                    const assignedSlotLabel = assignedMatch
                      ? `${assignedMatch.round} #${assignedMatch.slot ?? assignedMatch.matchNumber ?? 1} · Slot ${assignedMatch.teamA === t.name ? 'A' : 'B'}`
                      : 'Auto-Syncing...';
                    const isExpanded = expandedTeamId === t.id;

                    return (
                      <React.Fragment key={t.id}>
                        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{t.name}</span>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                padding: '1px 7px',
                              }}>
                                {teamPlayers.length} player{teamPlayers.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>{dept?.shortName || t.department}</td>
                          <td style={{ padding: '12px' }}>{getSportName(t.sport)}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                              background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)',
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}>
                              <CheckIcon size={11} color="#3b82f6" /> {assignedSlotLabel}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                              background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                              color: isActive ? '#059669' : '#dc2626',
                            }}>
                              {isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  setViewingRosterTeam(t);
                                  setExpandedTeamId(isExpanded ? null : t.id);
                                }}
                                style={{
                                  fontSize: '11.5px',
                                  color: '#2563eb',
                                  borderColor: 'rgba(37, 99, 235, 0.35)',
                                  background: 'rgba(37, 99, 235, 0.06)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontWeight: 700,
                                }}
                                title={`View players registered for ${t.name}`}
                              >
                                <UsersIcon size={12} color="#2563eb" />
                                <span>View Players ({teamPlayers.length})</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => toggleTeamStatus(t.id, !isActive)}
                                style={{ fontSize: '11.5px', color: isActive ? '#dc2626' : '#059669' }}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  if (window.confirm(`Delete team "${t.name}"?`)) {
                                    removeTeam(t.id);
                                    showBanner(`Team "${t.name}" deleted.`);
                                  }
                                }}
                                style={{ fontSize: '11.5px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.28)' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline expanded players list in requested "A.Cruz" format */}
                        {isExpanded && (
                          <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                            <td colSpan={6} style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Players in {t.name} ({teamPlayers.length}):
                                  </span>
                                  {teamPlayers.length === 0 ? (
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                      No players assigned to this team yet.
                                    </span>
                                  ) : (
                                    teamPlayers.map(p => (
                                      <span
                                        key={p.id}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          padding: '4px 10px',
                                          borderRadius: 6,
                                          background: 'var(--bg-surface)',
                                          border: '1px solid var(--border)',
                                          fontSize: '12px',
                                          fontWeight: 700,
                                          color: 'var(--text-primary)',
                                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                        }}
                                        title={`Full Name: ${p.name} · Position: ${p.position || 'Player'} · Student ID: ${p.studentId}`}
                                      >
                                        <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{formatPlayerInitialLastName(p.name)}</span>
                                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                          #{p.jerseyNumber || '?'}
                                        </span>
                                      </span>
                                    ))
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => setViewingRosterTeam(t)}
                                  style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--accent)' }}
                                >
                                  Open Roster Modal ↗
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: PLAYERS REGISTRATION                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'players' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Registration Card with Upgraded Styling */}
          <div
            className="glass-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Top Accent Gradient Bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #dc2626 0%, #f59e0b 50%, #3b82f6 100%)',
              }}
            />

            {/* Header with Badges & Metadata */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '22px', borderBottom: '1px solid var(--border-light)', paddingBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(59, 130, 246, 0.15))',
                  border: '1px solid var(--accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)',
                  flexShrink: 0,
                }}>
                  <UserIcon size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--accent)',
                      background: 'var(--accent-light)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--accent-border)',
                    }}>
                      Official Roster Management
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Padula 2026 Season
                    </span>
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Register Player & Squad Assignment
                  </h2>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: '640px' }}>
                    Enroll student athletes, assign official jersey numbers, designate sport positions, and link directly to active collegiate squads.
                  </p>
                </div>
              </div>

              {/* Quick Counts Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  textAlign: 'right',
                }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Athletes
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {players.length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>registered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handlePlayerSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '18px',
              }}>
                {/* 1. Full Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <UserIcon size={13} color="var(--accent)" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Clara Santos"
                    value={playerForm.name}
                    onChange={e => setPlayerForm(p => ({ ...p, name: e.target.value }))}
                    className="form-input"
                    style={{ height: '42px', borderRadius: '8px', fontSize: '13.5px' }}
                  />
                </div>

                {/* 2. Student ID */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <ClipboardIcon size={13} color="var(--accent)" />
                    Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2024-101"
                    value={playerForm.studentId}
                    onChange={e => setPlayerForm(p => ({ ...p, studentId: e.target.value }))}
                    className="form-input"
                    style={{ height: '42px', borderRadius: '8px', fontSize: '13.5px', fontFamily: 'monospace' }}
                  />
                </div>

                {/* 3. Gmail Address */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <MailIcon size={13} color="var(--accent)" />
                    Institutional Gmail
                  </label>
                  <input
                    type="email"
                    placeholder="player@asiancollege.edu.ph"
                    value={playerForm.email}
                    onChange={e => setPlayerForm(p => ({ ...p, email: e.target.value }))}
                    className="form-input"
                    style={{ height: '42px', borderRadius: '8px', fontSize: '13px' }}
                  />
                </div>

                {/* 4. Department */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <TrophyIcon size={13} color="var(--accent)" />
                    Department / College
                  </label>
                  <select
                    value={playerForm.department}
                    onChange={e => setPlayerForm(p => ({ ...p, department: e.target.value }))}
                    className="form-input"
                    style={{ height: '42px', borderRadius: '8px', fontSize: '13.5px' }}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.shortName} – {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Sport */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <TrophyIcon size={13} color="var(--accent)" />
                    Sport / Discipline
                  </label>
                  <select
                    value={playerForm.sport}
                    onChange={e => setPlayerForm(p => ({ ...p, sport: e.target.value }))}
                    className="form-input"
                    style={{ height: '42px', borderRadius: '8px', fontSize: '13.5px' }}
                  >
                    {SPORTS_CATALOG.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.format})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Assign to Team (Requested Feature) */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', margin: 0 }}>
                      <UsersIcon size={13} color="var(--accent)" />
                      Assign to Team *
                    </label>
                    {selectedTeamDetails && (
                      <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckIcon size={11} color="#10b981" /> Assigned
                      </span>
                    )}
                  </div>
                  <select
                    value={playerForm.teamId}
                    onChange={e => handlePlayerTeamSelect(e.target.value)}
                    className="form-input"
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      borderColor: playerForm.teamId ? 'var(--accent)' : 'var(--border)',
                      fontWeight: playerForm.teamId ? 600 : 400,
                    }}
                  >
                    <option value="">— No Team Assigned (Draft Pool / Reserves) —</option>

                    {playerMatchingTeams.length > 0 && (
                      <optgroup label={`Matching Squads (${currentSportName} · ${departments.find(d => d.id === playerForm.department)?.shortName || 'Dept'})`}>
                        {playerMatchingTeams.map(t => (
                          <option key={t.id} value={t.id}>
                            ★ {t.name} ({(t.players || []).length} rostered)
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {playerOtherSportTeams.length > 0 && (
                      <optgroup label={`Other Teams in ${currentSportName}`}>
                        {playerOtherSportTeams.map(t => {
                          const dept = departments.find(d => d.id === t.department);
                          return (
                            <option key={t.id} value={t.id}>
                              {t.name} ({dept?.shortName || t.department} · {(t.players || []).length} rostered)
                            </option>
                          );
                        })}
                      </optgroup>
                    )}

                    {playerOtherActiveTeams.length > 0 && (
                      <optgroup label="Other Active Tournament Teams">
                        {playerOtherActiveTeams.map(t => {
                          const dept = departments.find(d => d.id === t.department);
                          return (
                            <option key={t.id} value={t.id}>
                              {t.name} ({getSportName(t.sport)} · {dept?.shortName || t.department})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>

                  {/* Team Preview Pill / Context */}
                  {selectedTeamDetails ? (
                    <div style={{
                      marginTop: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11.5px',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: selectedTeamDetails.color || 'var(--accent)',
                        display: 'inline-block',
                      }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTeamDetails.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>• {(selectedTeamDetails.players || []).length} players on roster</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      Athlete will be registered into the open department pool.
                    </div>
                  )}
                </div>

                {/* 7. Jersey Number */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent)' }}>#</span>
                    Jersey Number
                  </label>
                  <input
                    type="text"
                    placeholder="10"
                    value={playerForm.jerseyNumber}
                    onChange={e => setPlayerForm(p => ({ ...p, jerseyNumber: e.target.value }))}
                    className="form-input"
                    style={{ height: '42px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700 }}
                  />
                </div>

                {/* 8. Position with Smart Suggestions */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', margin: 0 }}>
                      <UserIcon size={13} color="var(--accent)" />
                      Position
                    </label>
                    {sportPresetPositions.length > 0 && (
                      <span style={{ fontSize: '10.5px', color: 'var(--accent)', fontWeight: 600 }}>
                        {currentSportName} Presets
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="player-reg-positions-list"
                    placeholder={sportPresetPositions[0] || 'e.g. Point Guard / Carry'}
                    value={playerForm.position}
                    onChange={e => setPlayerForm(p => ({ ...p, position: e.target.value }))}
                    className="form-input"
                    style={{ height: '42px', borderRadius: '8px', fontSize: '13.5px' }}
                  />
                  <datalist id="player-reg-positions-list">
                    {sportPresetPositions.map(pos => (
                      <option key={pos} value={pos} />
                    ))}
                  </datalist>

                  {/* Quick-click position suggestions */}
                  {sportPresetPositions.length > 0 && !playerForm.position && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {sportPresetPositions.slice(0, 4).map(pos => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setPlayerForm(p => ({ ...p, position: pos }))}
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          + {pos}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Clearance Verification Box */}
              <div
                onClick={() => setPlayerForm(p => ({ ...p, medicalCleared: !p.medicalCleared }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: `1px solid ${playerForm.medicalCleared ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  background: playerForm.medicalCleared ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  transition: 'all 0.15s ease',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="medClear"
                    checked={playerForm.medicalCleared}
                    onChange={e => {
                      e.stopPropagation();
                      setPlayerForm(p => ({ ...p, medicalCleared: e.target.checked }));
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldIcon size={15} color={playerForm.medicalCleared ? '#10b981' : '#f59e0b'} />
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Athletic & Medical Clearance Approved
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Certified by Asian College Sports Health & Clinic. Eligible for tournament matches.
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: playerForm.medicalCleared ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: playerForm.medicalCleared ? '#059669' : '#d97706',
                  border: `1px solid ${playerForm.medicalCleared ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {playerForm.medicalCleared ? '✓ Eligible for Play' : 'Pending Physical Exam'}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 26px',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  }}
                >
                  <PlusIcon size={16} />
                  Register Athlete & Assign Team
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setPlayerForm({
                    name: '',
                    studentId: '',
                    department: 'd1',
                    sport: 's1',
                    teamId: '',
                    jerseyNumber: '',
                    position: '',
                    email: '',
                    medicalCleared: true,
                  })}
                  style={{ padding: '12px 20px', fontSize: '13px' }}
                >
                  Reset Form
                </button>
              </div>
            </form>
          </div>

          {/* Quick Recent Registrations Table */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Registered Athletes ({players.length})
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Manage team assignments, clearances, and roster statuses
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search athlete or ID…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: '220px', padding: '7px 12px', fontSize: '12.5px', height: '36px' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Jersey #</th>
                    <th style={{ padding: '10px 12px' }}>Athlete Name & ID</th>
                    <th style={{ padding: '10px 12px' }}>Dept</th>
                    <th style={{ padding: '10px 12px' }}>Sport</th>
                    <th style={{ padding: '10px 12px' }}>Team / Squad</th>
                    <th style={{ padding: '10px 12px' }}>Position</th>
                    <th style={{ padding: '10px 12px' }}>Clearance</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.studentId.includes(searchQuery)).map(p => {
                    const dept = departments.find(d => d.id === p.department);
                    const team = teams.find(t => t.id === p.teamId);
                    const isActive = p.isActive !== false;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        {/* Jersey */}
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '11.5px',
                            background: 'var(--bg-elevated)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            display: 'inline-block',
                            fontFamily: 'monospace',
                          }}>
                            #{p.jerseyNumber || '00'}
                          </span>
                        </td>

                        {/* Athlete Name & ID */}
                        <td style={{ padding: '12px' }}>
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
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                ID: {p.studentId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Dept */}
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                          }}>
                            {dept?.shortName || p.department}
                          </span>
                        </td>

                        {/* Sport */}
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {getSportIcon(p.sport, 13, 'var(--accent)')}
                            <span>{getSportName(p.sport)}</span>
                          </div>
                        </td>

                        {/* Assigned Team */}
                        <td style={{ padding: '12px' }}>
                          {team ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 9px',
                              borderRadius: '12px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: 'var(--text-primary)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                            }}>
                              <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: team.color || 'var(--accent)',
                              }} />
                              {team.name}
                            </span>
                          ) : (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-muted)',
                              border: '1px dashed var(--border)',
                            }}>
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Position */}
                        <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {p.position || 'Player'}
                        </td>

                        {/* Clearance */}
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            color: p.medicalCleared ? '#059669' : '#ea580c',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            {p.medicalCleared ? <><CheckIcon size={12} color="#059669" /> Cleared</> : 'Pending'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                            color: isActive ? '#059669' : '#dc2626',
                          }}>
                            {isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => startEditAthlete(p)}
                              style={{ fontSize: '11.5px', color: 'var(--text-primary)', padding: '3px 8px' }}
                            >
                              Edit / Assign
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => togglePlayerStatus(p.id, !isActive)}
                              style={{ fontSize: '11.5px', color: isActive ? '#dc2626' : '#059669', padding: '3px 8px' }}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (window.confirm(`Delete athlete "${p.name}"?`)) {
                                  removePlayer(p.id);
                                  showBanner(`Athlete "${p.name}" deleted.`);
                                }
                              }}
                              style={{ fontSize: '11.5px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.28)', padding: '3px 8px' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TABS 3–6: OFFICIALS (Referees, Scorekeepers, Coaches, Managers) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {['referees', 'scorekeepers', 'coaches', 'managers'].includes(activeTab) && (() => {
        const role = activeTab === 'referees' ? 'referee'
                   : activeTab === 'scorekeepers' ? 'scorekeeper'
                   : activeTab === 'coaches' ? 'coach'
                   : 'manager';
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        const filteredOfficials = officials.filter(o => o.role === role && o.name.toLowerCase().includes(searchQuery.toLowerCase()));

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px' }}>Register {roleLabel}</h3>
              <form onSubmit={handleOfficialSubmit(role)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Marcus Aurelio"
                    value={officialForm.name}
                    onChange={e => setOfficialForm(p => ({ ...p, name: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Sport</label>
                  <select
                    value={officialForm.sport}
                    onChange={e => setOfficialForm(p => ({ ...p, sport: e.target.value }))}
                    className="form-input"
                  >
                    {SPORTS_CATALOG.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    <option value="All Sports">All Sports</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Affiliation / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Athletic Board"
                    value={officialForm.affiliation}
                    onChange={e => setOfficialForm(p => ({ ...p, affiliation: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">License / Accreditation ID</label>
                  <input
                    type="text"
                    placeholder="e.g. PAD-REF-05"
                    value={officialForm.licenseId}
                    onChange={e => setOfficialForm(p => ({ ...p, licenseId: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {role === 'scorekeeper' ? 'Institutional Email / Login Username *' : 'Contact / Institutional Email'}
                  </label>
                  <input
                    type={role === 'scorekeeper' ? 'text' : 'email'}
                    required={role === 'scorekeeper'}
                    placeholder={role === 'scorekeeper' ? 'e.g. s.chen@asiancollege.edu.ph or sam.chen' : 'name@asiancollege.edu.ph'}
                    value={officialForm.contact}
                    onChange={e => setOfficialForm(p => ({ ...p, contact: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '11px 18px', fontWeight: 700 }}>
                  Register {roleLabel}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Registered {roleLabel}s ({filteredOfficials.length})</h3>
                <input
                  type="text"
                  placeholder={`Search ${role}…`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ maxWidth: '220px', padding: '6px 12px', fontSize: '12.5px' }}
                />
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px' }}>Name</th>
                      <th style={{ padding: '10px 12px' }}>Sport</th>
                      <th style={{ padding: '10px 12px' }}>License ID</th>
                      <th style={{ padding: '10px 12px' }}>Contact / Email</th>
                      {role === 'scorekeeper' && <th style={{ padding: '10px 12px' }}>Invitation &amp; Password</th>}
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficials.map(o => {
                      const isActive = o.isActive !== false;
                      const inv = role === 'scorekeeper'
                        ? staffInvitations.find(i =>
                            (o.contact && i.recipientEmail.toLowerCase() === o.contact.toLowerCase()) ||
                            i.recipientName.toLowerCase() === o.name.toLowerCase()
                          )
                        : undefined;
                      const invStatus = inv?.status || o.invitationStatus || (o.id === 'demo-off-scorer' ? 'accepted' : undefined);
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: 700 }}>{o.name}</td>
                          <td style={{ padding: '12px' }}>{o.sport}</td>
                          <td style={{ padding: '12px', fontFamily: 'monospace' }}>{o.licenseId || '—'}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{o.contact || '—'}</td>
                          {role === 'scorekeeper' && (
                            <td style={{ padding: '12px' }}>
                              {inv ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      background: invStatus === 'accepted' ? 'rgba(16,185,129,0.14)' : invStatus === 'declined' ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.14)',
                                      color: invStatus === 'accepted' ? '#10b981' : invStatus === 'declined' ? '#ef4444' : '#f59e0b',
                                    }}>
                                      {invStatus === 'accepted' ? 'Accepted' : invStatus === 'declined' ? 'Declined' : 'Pending'}
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-ghost"
                                      onClick={() => setSelectedInvitationModal(inv)}
                                      style={{ fontSize: '10.5px', padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <MailIcon size={11} /> View Letter
                                    </button>
                                  </div>
                                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                    Pwd: <strong>{inv.generatedPassword}</strong>
                                  </div>
                                  {invStatus === 'pending' && (
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-ghost"
                                        onClick={() => {
                                          respondToInvitation(inv.id, 'accepted');
                                          showBanner(`Invitation accepted for Scorekeeper "${o.name}".`);
                                        }}
                                        style={{ fontSize: '10px', padding: '2px 7px', color: '#10b981', borderColor: 'rgba(16,185,129,0.35)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                      >
                                        <CheckIcon size={10} color="#10b981" /> Accept
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-ghost"
                                        onClick={() => {
                                          respondToInvitation(inv.id, 'declined');
                                          showBanner(`Invitation declined for Scorekeeper "${o.name}".`);
                                        }}
                                        style={{ fontSize: '10px', padding: '2px 7px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                      >
                                        <XIcon size={10} color="#ef4444" /> Decline
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <CheckIcon size={11} color="#10b981" /> Official Account
                                </span>
                              )}
                            </td>
                          )}
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                              background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                              color: isActive ? '#059669' : '#dc2626',
                            }}>
                              {isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => toggleOfficialStatus(o.id, !isActive)}
                                style={{ fontSize: '11.5px', color: isActive ? '#dc2626' : '#059669' }}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  if (window.confirm(`Delete ${role} "${o.name}"?`)) {
                                    removeOfficial(o.id);
                                    showBanner(`${roleLabel} "${o.name}" deleted.`);
                                  }
                                }}
                                style={{ fontSize: '11.5px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.28)' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 7: SPORTS COORDINATORS (Director Only)                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'coordinators' && isDirector && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Limit Notification Card */}
          <div style={{
            background: coordinatorLimitReached ? 'rgba(234, 88, 12, 0.12)' : 'rgba(37, 99, 235, 0.08)',
            border: `1.5px solid ${coordinatorLimitReached ? '#ea580c' : 'var(--accent)'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: coordinatorLimitReached ? '#ea580c' : 'var(--text-primary)' }}>
                {activeCoordinators.length} of {MAX_COORDINATORS} Sports Coordinators registered
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {coordinatorLimitReached
                  ? 'Maximum of 3 Sports Coordinators reached. Deactivate one to add another.'
                  : 'Sports Coordinators can register teams, athletes, and officials, but cannot register coordinators or edit the Director.'}
              </div>
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '20px',
              background: coordinatorLimitReached ? '#ea580c' : 'var(--accent)',
              color: '#fff',
            }}>
              {coordinatorLimitReached ? 'LIMIT REACHED' : `${MAX_COORDINATORS - activeCoordinators.length} SLOTS AVAILABLE`}
            </span>
          </div>

          {/* Form */}
          <div className="glass-card" style={{ padding: '24px', opacity: coordinatorLimitReached ? 0.6 : 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px' }}>Register Sports Coordinator</h3>
            <form onSubmit={handleCoordSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  disabled={coordinatorLimitReached}
                  placeholder="e.g. Jordan Lee"
                  value={coordForm.name}
                  onChange={e => setCoordForm(p => ({ ...p, name: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  disabled={coordinatorLimitReached}
                  placeholder="j.lee@asiancollege.edu.ph"
                  value={coordForm.email}
                  onChange={e => setCoordForm(p => ({ ...p, email: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Department</label>
                <select
                  disabled={coordinatorLimitReached}
                  value={coordForm.department}
                  onChange={e => setCoordForm(p => ({ ...p, department: e.target.value }))}
                  className="form-input"
                >
                  {departments.map(d => <option key={d.id} value={d.id}>{d.shortName} – {d.name}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={coordinatorLimitReached}
                className="btn btn-primary"
                style={{ padding: '11px 18px', fontWeight: 700 }}
              >
                Register Coordinator
              </button>
            </form>
          </div>

          {/* List of Coordinators */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px' }}>Sports Coordinators List</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px' }}>Name</th>
                    <th style={{ padding: '10px 12px' }}>Email</th>
                    <th style={{ padding: '10px 12px' }}>Department</th>
                    <th style={{ padding: '10px 12px' }}>Invitation &amp; Password</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredUsers.filter(u => u.role === 'coordinator').map(u => {
                    const isActive = u.isActive !== false;
                    const inv = staffInvitations.find(i =>
                      i.recipientEmail.toLowerCase() === u.email?.toLowerCase() ||
                      i.id === u.invitationId
                    );
                    const invStatus = inv?.status || u.invitationStatus || (u.id === 'demo-coordinator' ? 'accepted' : undefined);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{u.name}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>{u.department || 'All'}</td>
                        <td style={{ padding: '12px' }}>
                          {inv ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  background: invStatus === 'accepted' ? 'rgba(16,185,129,0.14)' : invStatus === 'declined' ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.14)',
                                  color: invStatus === 'accepted' ? '#10b981' : invStatus === 'declined' ? '#ef4444' : '#f59e0b',
                                }}>
                                  {invStatus === 'accepted' ? 'Accepted' : invStatus === 'declined' ? 'Declined' : 'Pending'}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost"
                                  onClick={() => setSelectedInvitationModal(inv)}
                                  style={{ fontSize: '10.5px', padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <MailIcon size={11} /> View Letter
                                </button>
                              </div>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                Pwd: <strong>{inv.generatedPassword}</strong>
                              </div>
                              {invStatus === 'pending' && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => {
                                      respondToInvitation(inv.id, 'accepted');
                                      showBanner(`Invitation accepted for Sports Coordinator "${u.name}".`);
                                    }}
                                    style={{ fontSize: '10px', padding: '2px 7px', color: '#10b981', borderColor: 'rgba(16,185,129,0.35)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                  >
                                    <CheckIcon size={10} color="#10b981" /> Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => {
                                      respondToInvitation(inv.id, 'declined');
                                      showBanner(`Invitation declined for Sports Coordinator "${u.name}".`);
                                    }}
                                    style={{ fontSize: '10px', padding: '2px 7px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                  >
                                    <XIcon size={10} color="#ef4444" /> Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <CheckIcon size={11} color="#10b981" /> Official Account
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                            background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                            color: isActive ? '#059669' : '#dc2626',
                          }}>
                            {isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => toggleUserStatus(u.id, !isActive)}
                              style={{ fontSize: '11.5px', color: isActive ? '#dc2626' : '#059669' }}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (window.confirm(`Delete coordinator "${u.name}"?`)) {
                                  removeUser(u.id);
                                  showBanner(`Sports Coordinator "${u.name}" deleted.`);
                                }
                              }}
                              style={{ fontSize: '11.5px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.28)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* OFFICIAL EMAIL INVITATION LETTER & CREDENTIALS MODAL          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedInvitationModal && (() => {
        const liveInv = staffInvitations.find(i => i.id === selectedInvitationModal.id) || selectedInvitationModal;
        const effectiveTargetEmail = (apiTargetEmailOverride || liveInv.dispatchedToEmail || liveInv.recipientEmail).trim().toLowerCase();
        const mailtoHref = `mailto:${encodeURIComponent(effectiveTargetEmail)}?subject=${encodeURIComponent(liveInv.subject)}&body=${encodeURIComponent(liveInv.letterBody)}`;
        const gmailWebHref = buildGmailComposeUrl(effectiveTargetEmail, liveInv.subject, liveInv.letterBody);
        const senderDisplayName = currentUser?.name || liveInv.sentBy || 'Mr. John Eric Samane';
        const senderDisplayEmail = currentUser?.email || liveInv.sentByEmail || 'jsamane@asiancollege.edu.ph';

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '28px',
              background: 'linear-gradient(180deg, #0e172e 0%, #090e1f 100%)',
              border: '1px solid rgba(59, 130, 246, 0.28)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '6px',
                  }}>
                    <MailIcon size={12} color="#f87171" />
                    <span>Official Appointment Letter</span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    {liveInv.roleTitle} Invitation — <span style={{ color: '#38bdf8' }}>{liveInv.recipientName}</span>
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {liveInv.dispatchedViaApi && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <CheckIcon size={12} color="#10b981" /> SENT VIA GMAIL
                    </span>
                  )}
                  <span style={{
                    padding: '4px 11px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: liveInv.status === 'accepted' ? 'rgba(16,185,129,0.14)' : liveInv.status === 'declined' ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.14)',
                    color: liveInv.status === 'accepted' ? '#10b981' : liveInv.status === 'declined' ? '#ef4444' : '#fbbf24',
                    border: `1px solid ${liveInv.status === 'accepted' ? 'rgba(16,185,129,0.3)' : liveInv.status === 'declined' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                    {liveInv.status === 'accepted' ? 'ACCEPTED' : liveInv.status === 'declined' ? 'DECLINED' : 'AWAITING RESPONSE'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedInvitationModal(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    title="Close"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              </div>

              {/* Email Envelope Metadata Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 18px',
                fontSize: '12.5px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 700, width: '60px', textTransform: 'uppercase', fontSize: '10.5px' }}>From:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{senderDisplayName}</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace', fontSize: '11.5px' }}>&lt;{senderDisplayEmail}&gt;</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 700, width: '60px', textTransform: 'uppercase', fontSize: '10.5px' }}>To:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{liveInv.recipientName}</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>&lt;{effectiveTargetEmail}&gt;</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 700, width: '60px', textTransform: 'uppercase', fontSize: '10.5px' }}>Subject:</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{liveInv.subject}</span>
                </div>
              </div>

              {/* Gmail Dispatch Section */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(30, 58, 138, 0.03) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.28)',
                borderRadius: '14px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                  }}>
                    <MailIcon size={16} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
                      Dispatch Appointment via Official Gmail
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.6)' }}>
                      Compose and send appointment credentials to recipient's official school account.
                    </div>
                  </div>
                </div>

                {/* Sender & Destination Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10.5px', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Authenticated Sender
                    </span>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                      {senderDisplayName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', fontFamily: 'monospace' }}>
                      {senderDisplayEmail}
                    </div>
                  </div>
                  <div>
                    <label style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10.5px', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                      Destination Official Gmail
                    </label>
                    <input
                      type="email"
                      value={effectiveTargetEmail}
                      onChange={(e) => setApiTargetEmailOverride(e.target.value)}
                      placeholder="e.g. coordinator@asiancollege.edu.ph"
                      style={{
                        width: '100%',
                        padding: '7px 12px',
                        fontSize: '12.5px',
                        borderRadius: '6px',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        background: 'rgba(10, 16, 33, 0.8)',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Feedback Banner if recently dispatched */}
                {apiDispatchFeedback && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: apiDispatchFeedback.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: apiDispatchFeedback.success ? '#10b981' : '#ef4444',
                    border: `1px solid ${apiDispatchFeedback.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}>
                    {apiDispatchFeedback.success ? <CheckIcon size={14} color="#10b981" /> : <XIcon size={14} color="#ef4444" />}
                    <span>{apiDispatchFeedback.message}</span>
                  </div>
                )}

                {/* Email Dispatch Action CTA */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <a
                    href={gmailWebHref}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      color: '#fff',
                      border: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <MailIcon size={15} color="#fff" />
                    <span>Open in Gmail Web Composer</span>
                  </a>
                </div>

                {/* Delivery Guide Note */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.18)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '11.5px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.5,
                }}>
                  <strong style={{ color: '#60a5fa' }}>💡 Ready to dispatch this appointment?</strong>
                  <div style={{ marginTop: '2px' }}>
                    Clicking <strong>[Open in Gmail Web Composer]</strong> opens a new tab in your official Gmail with the recipient, subject, and credentials letter pre-filled and formatted, ready for instant delivery.
                  </div>
                </div>
              </div>

              {/* Highlighted Credentials Box */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.06em' }}>
                    Assigned Portal Credentials (Included in Letter)
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px', color: '#ffffff' }}>
                    Email: <strong style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{liveInv.recipientEmail}</strong>
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '2px', color: '#ffffff' }}>
                    Password: <strong style={{ fontFamily: 'monospace', color: '#34d399', fontSize: '14px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{liveInv.generatedPassword}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    navigator.clipboard?.writeText(`Email: ${liveInv.recipientEmail}\nPassword: ${liveInv.generatedPassword}`);
                    setCopiedCreds(true);
                    setTimeout(() => setCopiedCreds(false), 2000);
                  }}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: copiedCreds ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    color: copiedCreds ? '#34d399' : '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '7px 12px',
                    borderRadius: '6px',
                  }}
                >
                  <CopyIcon size={13} />
                  <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                </button>
              </div>

              {/* Letter Body Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.06em' }}>
                  Letter Content Preview
                </span>
                <pre style={{
                  margin: 0,
                  padding: '18px',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  color: '#e2e8f0',
                  fontSize: '12.5px',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  maxHeight: '240px',
                  overflowY: 'auto',
                }}>
                  {liveInv.letterBody}
                </pre>
              </div>

              {/* Accept / Decline Response Section */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                    Appointment Response
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
                    Accept or decline on behalf of the staff member.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const updated = respondToInvitation(liveInv.id, 'accepted');
                      if (updated) setSelectedInvitationModal(updated);
                      showBanner(`${liveInv.roleTitle} "${liveInv.recipientName}" accepted the invitation!`);
                    }}
                    style={{
                      background: liveInv.status === 'accepted' ? '#059669' : '#10b981',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      padding: '8px 16px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckIcon size={13} color="#fff" /> Accept Appointment
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const updated = respondToInvitation(liveInv.id, 'declined');
                      if (updated) setSelectedInvitationModal(updated);
                      showBanner(`${liveInv.roleTitle} "${liveInv.recipientName}" declined the invitation.`);
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      fontWeight: 700,
                      padding: '8px 16px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <XIcon size={13} color="#ef4444" /> Decline Appointment
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
                <a
                  href={mailtoHref}
                  className="btn btn-sm btn-ghost"
                  style={{ textDecoration: 'none', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255, 255, 255, 0.65)' }}
                >
                  <MailIcon size={13} /> Send via Default Email App
                </a>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedInvitationModal(null)}
                  style={{ padding: '8px 24px', fontWeight: 700, borderRadius: '8px' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── View Players in Registered Team Modal ── */}
      {viewingRosterTeam && (() => {
        const team = viewingRosterTeam;
        const dept = departments.find(d => d.id === team.department);
        const teamPlayers = getTeamPlayers(team);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setViewingRosterTeam(null)}
          >
            <div
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '650px',
                maxHeight: '85vh',
                overflowY: 'auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      color: 'var(--accent)',
                      background: 'rgba(220, 38, 38, 0.1)',
                      border: '1px solid rgba(220, 38, 38, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                    }}>
                      Registered Players Roster
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {dept?.name || team.department} • {getSportName(team.sport)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {team.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Players formatted as <strong>First Initial.Last Name (&quot;A.Cruz&quot;)</strong>:
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setViewingRosterTeam(null)}
                  style={{ minWidth: 32, height: 32, padding: 0, fontSize: '16px', borderRadius: '50%' }}
                >
                  ✕
                </button>
              </div>

              {/* Players Grid */}
              {teamPlayers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  <UsersIcon size={36} color="var(--text-muted)" />
                  <p style={{ marginTop: '12px', fontSize: '13.5px', fontWeight: 600 }}>No players assigned to {team.name} yet.</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You can assign players to this team in the Players tab.</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '10px' }}
                    onClick={() => {
                      setViewingRosterTeam(null);
                      setActiveTab('players');
                    }}
                  >
                    + Register Players
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                  {teamPlayers.map(p => {
                    const shortName = formatPlayerInitialLastName(p.name);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(220, 38, 38, 0.12)',
                            border: '1px solid rgba(220, 38, 38, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            color: 'var(--accent)',
                            flexShrink: 0,
                          }}>
                            #{p.jerseyNumber || '?'}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: 'var(--accent)', letterSpacing: '-0.01em' }}>{shortName}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name} {p.position ? `· ${p.position}` : ''}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: p.medicalCleared ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: p.medicalCleared ? '#10b981' : '#f59e0b',
                          border: `1px solid ${p.medicalCleared ? 'rgba(16, 185, 129, 0.28)' : 'rgba(245, 158, 11, 0.28)'}`,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {p.medicalCleared ? 'Cleared ✓' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Total: <strong>{teamPlayers.length}</strong> player(s) in {team.name}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setViewingRosterTeam(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setViewingRosterTeam(null);
                      setActiveView('player');
                    }}
                  >
                    Open Athlete Directory →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Athlete & Squad Assignment Modal ── */}
      {editingAthlete && (() => {
        const athleteSportName = getSportName(editingAthlete.sport);
        const athletePositions = POSITIONS_BY_SPORT[athleteSportName] || [];
        const athleteDept = departments.find(d => d.id === editingAthlete.department);
        const matchingSportTeams = teams.filter(t => {
          if (t.isActive === false) return false;
          const sName = getSportName(t.sport).toLowerCase();
          return t.sport === editingAthlete.sport || sName === athleteSportName.toLowerCase();
        });

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setEditingAthlete(null)}
          >
            <div
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                position: 'relative',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                <div>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'var(--accent)',
                    background: 'var(--accent-light)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}>
                    Roster Assignment
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 2px', color: 'var(--text-primary)' }}>
                    Edit {editingAthlete.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ID: {editingAthlete.studentId} • {athleteDept?.shortName || editingAthlete.department} • {athleteSportName}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingAthlete(null)}
                  style={{ padding: '6px' }}
                >
                  <XIcon size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveAthleteEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Team Selection */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Assigned Team / Competing Squad
                  </label>
                  <select
                    className="form-input"
                    value={editAthleteForm.teamId}
                    onChange={e => setEditAthleteForm(prev => ({ ...prev, teamId: e.target.value }))}
                    style={{ height: '40px', borderRadius: '8px' }}
                  >
                    <option value="">— No Team Assigned (Draft Pool / Unassigned) —</option>
                    <optgroup label={`Teams in ${athleteSportName}`}>
                      {matchingSportTeams.map(t => {
                        const dept = departments.find(d => d.id === t.department);
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} ({dept?.shortName || t.department})
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="All Other Active Teams">
                      {teams.filter(t => !matchingSportTeams.includes(t) && t.isActive !== false).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({getSportName(t.sport)})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Jersey & Position Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Jersey #
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={editAthleteForm.jerseyNumber}
                      onChange={e => setEditAthleteForm(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                      required
                      style={{ height: '40px', borderRadius: '8px', fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Position
                    </label>
                    <input
                      type="text"
                      list="edit-athlete-positions-list"
                      className="form-input"
                      value={editAthleteForm.position}
                      onChange={e => setEditAthleteForm(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="e.g. Point Guard, Carry"
                      style={{ height: '40px', borderRadius: '8px' }}
                    />
                    <datalist id="edit-athlete-positions-list">
                      {athletePositions.map(pos => (
                        <option key={pos} value={pos} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Medical Clearance Toggle */}
                <div
                  onClick={() => setEditAthleteForm(p => ({ ...p, medicalCleared: !p.medicalCleared }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${editAthleteForm.medicalCleared ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    background: editAthleteForm.medicalCleared ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldIcon size={14} color={editAthleteForm.medicalCleared ? '#10b981' : '#f59e0b'} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Medical Clearance Status
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: editAthleteForm.medicalCleared ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: editAthleteForm.medicalCleared ? '#059669' : '#d97706',
                  }}>
                    {editAthleteForm.medicalCleared ? '✓ Cleared' : 'Pending'}
                  </span>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditingAthlete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontWeight: 700 }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
