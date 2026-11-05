import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardIcon,
  CheckIcon,
  CalendarIcon,
} from '../components/Icons';

type RegTab = 'teams' | 'players' | 'referees' | 'scorekeepers' | 'coaches' | 'managers' | 'coordinators';

const MAX_COORDINATORS = 3;

export default function RegistrationPage() {
  const {
    currentUser,
    registeredUsers,
    registerUser,
    officials,
    registerOfficial,
    toggleOfficialStatus,
    players,
    registerPlayer,
    togglePlayerStatus,
    teams,
    registerTeam,
    toggleTeamStatus,
    departments,
    toggleUserStatus,
    setActiveView,
  } = useApp();

  const isDirector = currentUser?.role === 'director';
  const isCoordinator = currentUser?.role === 'coordinator';
  const canRegister = isDirector || isCoordinator;

  const [activeTab, setActiveTab] = useState<RegTab>('teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [registeredPlayerNotice, setRegisteredPlayerNotice] = useState<boolean>(false);

  // Active Coordinators calculation
  const activeCoordinators = useMemo(() => {
    return registeredUsers.filter(u => u.role === 'coordinator' && u.isActive !== false);
  }, [registeredUsers]);

  const coordinatorLimitReached = activeCoordinators.length >= MAX_COORDINATORS;

  // Form states
  const [teamForm, setTeamForm] = useState({ name: '', sport: 's1', department: 'd1', division: 'div1', color: '#3b82f6' });
  const [playerForm, setPlayerForm] = useState({ name: '', studentId: '', department: 'd1', sport: 's1', jerseyNumber: '', position: '', email: '', password: 'password123', medicalCleared: true });
  const [officialForm, setOfficialForm] = useState({ name: '', sport: 'Basketball', affiliation: '', licenseId: '', contact: '' });
  const [coordForm, setCoordForm] = useState({ name: '', email: '', department: 'd1', password: 'password123' });

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
    setSuccessBanner(`Team "${teamForm.name}" registered successfully.`);
    setTeamForm({ name: '', sport: 's1', department: 'd1', division: 'div1', color: '#3b82f6' });
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Handle Player Submit
  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name.trim() || !playerForm.studentId.trim()) return;
    const cleanStudentId = playerForm.studentId.trim();
    const cleanEmail = playerForm.email.trim().toLowerCase() || `${cleanStudentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.asiancollege.edu.ph`;
    const cleanPassword = playerForm.password.trim() || 'password123';

    // 1. Register player entity
    registerPlayer({
      name: playerForm.name.trim(),
      studentId: cleanStudentId,
      department: playerForm.department,
      sport: playerForm.sport,
      jerseyNumber: playerForm.jerseyNumber.trim() || '00',
      position: playerForm.position.trim() || 'Player',
      email: cleanEmail,
      medicalCleared: playerForm.medicalCleared,
      isActive: true,
      currentSeasonGoals: 0,
    });

    // 2. Create login account for this player
    registerUser({
      id: `u-pl-${Date.now()}`,
      name: playerForm.name.trim(),
      role: 'player',
      username: cleanStudentId,
      email: cleanEmail,
      password: cleanPassword,
      department: playerForm.department,
      avatarInitials: playerForm.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      gmailVerified: Boolean(playerForm.email.trim()),
      isActive: true,
    });

    setSuccessBanner(`Athlete "${playerForm.name}" registered! They can log in using Student ID "${cleanStudentId}" or email with their password.`);
    setRegisteredPlayerNotice(true);
    setPlayerForm({ name: '', studentId: '', department: 'd1', sport: 's1', jerseyNumber: '', position: '', email: '', password: 'password123', medicalCleared: true });
    setTimeout(() => {
      setRegisteredPlayerNotice(false);
      setSuccessBanner(null);
    }, 8000);
  };

  // Handle Official Submit (referee, scorekeeper, coach, manager)
  const handleOfficialSubmit = (role: 'referee' | 'scorekeeper' | 'coach' | 'manager') => (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialForm.name.trim()) return;
    registerOfficial({
      name: officialForm.name.trim(),
      role,
      sport: officialForm.sport,
      affiliation: officialForm.affiliation.trim() || 'Asian College Board',
      licenseId: officialForm.licenseId.trim() || `PAD-${role.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
      contact: officialForm.contact.trim().toLowerCase(),
      isActive: true,
    });

    // If official has email, create account for them
    if (officialForm.contact.trim()) {
      registerUser({
        id: `u-${Date.now()}`,
        name: officialForm.name.trim(),
        role: role === 'scorekeeper' ? 'scorer' : 'guest',
        username: officialForm.contact.split('@')[0],
        email: officialForm.contact.trim().toLowerCase(),
        password: 'password123',
        mustChangePassword: true,
        isActive: true,
      });
    }

    setSuccessBanner(`${role.charAt(0).toUpperCase() + role.slice(1)} "${officialForm.name}" registered successfully.`);
    setOfficialForm({ name: '', sport: 'Basketball', affiliation: '', licenseId: '', contact: '' });
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Handle Coordinator Submit (Director Only)
  const handleCoordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector || coordinatorLimitReached) return;
    if (!coordForm.name.trim() || !coordForm.email.trim()) return;

    registerUser({
      id: `u-${Date.now()}`,
      name: coordForm.name.trim(),
      role: 'coordinator',
      username: coordForm.email.split('@')[0],
      email: coordForm.email.trim().toLowerCase(),
      department: coordForm.department,
      password: coordForm.password || 'password123',
      mustChangePassword: true,
      isActive: true,
    });

    setSuccessBanner(`Sports Coordinator "${coordForm.name}" registered successfully.`);
    setCoordForm({ name: '', email: '', department: 'd1', password: 'password123' });
    setTimeout(() => setSuccessBanner(null), 4000);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
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
                  placeholder="e.g. Padula Eagles"
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
                  <option value="s1">Basketball (5v5)</option>
                  <option value="s2">Volleyball</option>
                  <option value="s3">Badminton</option>
                  <option value="s4">Table Tennis</option>
                  <option value="s5">Mobile Legends</option>
                  <option value="s6">DOTA</option>
                  <option value="s7">Valorant</option>
                  <option value="s8">Chess</option>
                  <option value="s9">Cheerdance</option>
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
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => {
                    const dept = departments.find(d => d.id === t.department);
                    const isActive = t.isActive !== false;
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{t.name}</td>
                        <td style={{ padding: '12px' }}>{dept?.shortName || t.department}</td>
                        <td style={{ padding: '12px', textTransform: 'capitalize' }}>{t.sport === 's1' ? 'Basketball' : t.sport === 's2' ? 'Volleyball' : t.sport}</td>
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
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggleTeamStatus(t.id, !isActive)}
                            style={{ fontSize: '11.5px', color: isActive ? '#dc2626' : '#059669' }}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
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
      {/* TAB 2: PLAYERS REGISTRATION                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'players' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px' }}>Register Player</h3>
            <form onSubmit={handlePlayerSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara Santos"
                  value={playerForm.name}
                  onChange={e => setPlayerForm(p => ({ ...p, name: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input
                  type="text"
                  required
                  placeholder="2024-101"
                  value={playerForm.studentId}
                  onChange={e => setPlayerForm(p => ({ ...p, studentId: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  value={playerForm.department}
                  onChange={e => setPlayerForm(p => ({ ...p, department: e.target.value }))}
                  className="form-input"
                >
                  {departments.map(d => <option key={d.id} value={d.id}>{d.shortName} – {d.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sport</label>
                <select
                  value={playerForm.sport}
                  onChange={e => setPlayerForm(p => ({ ...p, sport: e.target.value }))}
                  className="form-input"
                >
                  <option value="s1">Basketball</option>
                  <option value="s2">Volleyball</option>
                  <option value="s3">Badminton</option>
                  <option value="s4">Table Tennis</option>
                  <option value="s5">Mobile Legends</option>
                  <option value="s6">DOTA</option>
                  <option value="s7">Valorant</option>
                  <option value="s8">Chess</option>
                  <option value="s9">Cheerdance</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jersey Number</label>
                <input
                  type="text"
                  placeholder="10"
                  value={playerForm.jerseyNumber}
                  onChange={e => setPlayerForm(p => ({ ...p, jerseyNumber: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Position</label>
                <input
                  type="text"
                  placeholder="e.g. Point Guard"
                  value={playerForm.position}
                  onChange={e => setPlayerForm(p => ({ ...p, position: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gmail Address</label>
                <input
                  type="email"
                  placeholder="player@asiancollege.edu.ph"
                  value={playerForm.email}
                  onChange={e => setPlayerForm(p => ({ ...p, email: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Athlete Login Password *</label>
                <input
                  type="password"
                  placeholder="Set password (e.g. password123)"
                  value={playerForm.password}
                  onChange={e => setPlayerForm(p => ({ ...p, password: e.target.value }))}
                  className="form-input"
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  The player will use their Student ID or Email and this password to log in.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                <input
                  type="checkbox"
                  id="medClear"
                  checked={playerForm.medicalCleared}
                  onChange={e => setPlayerForm(p => ({ ...p, medicalCleared: e.target.checked }))}
                />
                <label htmlFor="medClear" style={{ fontSize: '13px', cursor: 'pointer' }}>
                  Medical Clearance Approved
                </label>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '11px 24px', fontWeight: 700 }}>
                  Register Player
                </button>
              </div>
            </form>
          </div>

          {/* Quick Recent Registrations Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Registered Athletes ({players.length})</h3>
              <input
                type="text"
                placeholder="Search athlete…"
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
                    <th style={{ padding: '10px 12px' }}>Student ID</th>
                    <th style={{ padding: '10px 12px' }}>Dept</th>
                    <th style={{ padding: '10px 12px' }}>Jersey</th>
                    <th style={{ padding: '10px 12px' }}>Clearance</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.studentId.includes(searchQuery)).map(p => {
                    const dept = departments.find(d => d.id === p.department);
                    const isActive = p.isActive !== false;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{p.name}</td>
                        <td style={{ padding: '12px' }}>{p.studentId}</td>
                        <td style={{ padding: '12px' }}>{dept?.shortName || p.department}</td>
                        <td style={{ padding: '12px' }}>#{p.jerseyNumber}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: p.medicalCleared ? '#059669' : '#ea580c', fontWeight: 600 }}>
                            {p.medicalCleared ? '✓ Cleared' : 'Pending'}
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
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => togglePlayerStatus(p.id, !isActive)}
                            style={{ fontSize: '11.5px', color: isActive ? '#dc2626' : '#059669' }}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
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
                    <option value="Basketball">Basketball</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Table Tennis">Table Tennis</option>
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
                  <label className="form-label">Contact / Institutional Email</label>
                  <input
                    type="email"
                    placeholder="name@asiancollege.edu.ph"
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
                      <th style={{ padding: '10px 12px' }}>Contact</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficials.map(o => {
                      const isActive = o.isActive !== false;
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: 700 }}>{o.name}</td>
                          <td style={{ padding: '12px' }}>{o.sport}</td>
                          <td style={{ padding: '12px', fontFamily: 'monospace' }}>{o.licenseId || '—'}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{o.contact || '—'}</td>
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
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => toggleOfficialStatus(o.id, !isActive)}
                              style={{ fontSize: '11.5px', color: isActive ? '#dc2626' : '#059669' }}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
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

              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="text"
                  disabled={coordinatorLimitReached}
                  value={coordForm.password}
                  onChange={e => setCoordForm(p => ({ ...p, password: e.target.value }))}
                  className="form-input"
                />
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
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredUsers.filter(u => u.role === 'coordinator').map(u => {
                    const isActive = u.isActive !== false;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{u.name}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>{u.department || 'All'}</td>
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
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggleUserStatus(u.id, !isActive)}
                            style={{ fontSize: '11.5px', color: isActive ? '#dc2626' : '#059669' }}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
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

    </div>
  );
}
