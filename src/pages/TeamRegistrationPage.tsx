import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusIcon, CheckIcon, UsersIcon, TrophyIcon, ShieldIcon } from '../components/Icons';
import { SPORTS_CATALOG } from '../lib/sports';

type RegTab = 'teams' | 'players' | 'roster';

const SPORTS_LIST = SPORTS_CATALOG.map(s => ({ id: s.id, name: s.name }));

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
  DOTA: ['Carry (Pos 1)', 'Mid (Pos 2)', 'Offlane (Pos 3)', 'Soft Support (Pos 4)', 'Hard Support (Pos 5)'],
  Valorant: ['Duelist', 'Initiator', 'Controller', 'Sentinel'],
};

function PlayerCard({ player, department, team }: {
  player: { id: string; name: string; studentId: string; jerseyNumber: string; position?: string; gwa?: number; medicalCleared: boolean; department: string; sport: string; };
  department?: { name: string; shortName: string; color: string };
  team?: { name: string; color?: string };
}) {
  return (
    <div className="glass-card" style={{
      padding: '0',
      overflow: 'hidden',
      borderRadius: '14px',
      border: `1px solid ${department?.color ?? '#3b82f6'}40`,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Card header stripe */}
      <div style={{
        height: '6px',
        background: department?.color ?? '#3b82f6',
      }} />
      <div style={{ padding: '16px' }}>
        {/* Avatar + Jersey */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '12px',
            background: `${department?.color ?? '#3b82f6'}25`,
            border: `2px solid ${department?.color ?? '#3b82f6'}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '20px', color: department?.color ?? '#3b82f6',
          }}>
            #{player.jerseyNumber}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{player.name}</div>
            <div style={{ fontSize: '11px', color: department?.color ?? '#3b82f6', fontWeight: 700, marginTop: '2px' }}>{department?.shortName ?? '—'}</div>
          </div>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>ID</span><strong style={{ color: 'var(--text-primary)' }}>{player.studentId}</strong>
          </div>
          {player.position && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Position</span><strong style={{ color: 'var(--text-primary)' }}>{player.position}</strong>
            </div>
          )}
          {player.gwa !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GWA</span>
              <strong style={{ color: player.gwa <= 2.5 ? '#10b981' : '#f97316' }}>
                {player.gwa.toFixed(2)}
              </strong>
            </div>
          )}
          {team && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Team</span><strong style={{ color: team.color ?? 'var(--text-primary)' }}>{team.name}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span>Medical</span>
            <span style={{
              fontSize: '10px', fontWeight: 700,
              color: player.medicalCleared ? '#34d399' : '#f87171',
              background: player.medicalCleared ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
              padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.04em',
            }}>
              {player.medicalCleared ? '✓ CLEARED' : '✗ PENDING'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamRegistrationPage() {
  const { players, teams, departments, divisions, registerTeam, registerPlayer } = useApp();
  const [tab, setTab] = useState<RegTab>('teams');
  const [filterSport, setFilterSport] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');

  // Team form
  const [teamForm, setTeamForm] = useState({ name: '', sport: 's1', department: '', division: '', coach: '', color: '#3b82f6' });
  const [teamSuccess, setTeamSuccess] = useState('');

  // Player form
  const [playerForm, setPlayerForm] = useState({
    name: '', studentId: '', department: '', sport: 's1', teamId: '',
    jerseyNumber: '', position: '', gwa: '', medicalCleared: true, email: '',
  });
  const [playerSuccess, setPlayerSuccess] = useState('');

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.department) return;
    registerTeam({ name: teamForm.name, sport: teamForm.sport, department: teamForm.department, division: teamForm.division, coach: teamForm.coach, players: [], color: teamForm.color });
    setTeamSuccess(`Team "${teamForm.name}" registered!`);
    setTeamForm({ name: '', sport: 's1', department: '', division: '', coach: '', color: '#3b82f6' });
    setTimeout(() => setTeamSuccess(''), 3500);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.name.trim() || !playerForm.studentId.trim() || !playerForm.department) return;
    const cleanStudentId = playerForm.studentId.trim();
    const cleanEmail = playerForm.email.trim().toLowerCase() || `${cleanStudentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.asiancollege.edu.ph`;

    registerPlayer({
      name: playerForm.name, studentId: cleanStudentId,
      department: playerForm.department, sport: playerForm.sport,
      teamId: playerForm.teamId || undefined,
      jerseyNumber: playerForm.jerseyNumber,
      position: playerForm.position || undefined,
      gwa: playerForm.gwa ? Number(playerForm.gwa) : undefined,
      medicalCleared: playerForm.medicalCleared,
      email: cleanEmail,
      gmailVerified: Boolean(playerForm.email),
    });

    setPlayerSuccess(`${playerForm.name} registered successfully!`);
    setPlayerForm({ name: '', studentId: '', department: '', sport: 's1', teamId: '', jerseyNumber: '', position: '', gwa: '', medicalCleared: true, email: '' });
    setTimeout(() => setPlayerSuccess(''), 4500);
  };

  const filteredPlayers = players.filter(p =>
    (filterSport === 'all' || p.sport === filterSport) &&
    (filterTeam  === 'all' || p.teamId === filterTeam)
  );

  return (
    <div className="dashboard-content">
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Asian College Padula Athletics</div>
          <h1 className="page-title">Team & Player Registration</h1>
          <p className="page-desc">Register department teams, athlete rosters, and player cards</p>
        </div>
        <div className="stats-row">
          <div className="mini-stat glass-card"><span className="mini-val">{teams.length}</span><span className="mini-lbl">Teams</span></div>
          <div className="mini-stat glass-card"><span className="mini-val">{players.length}</span><span className="mini-lbl">Players</span></div>
          <div className="mini-stat glass-card"><span className="mini-val" style={{ color: '#34d399' }}>{players.filter(p => p.medicalCleared).length}</span><span className="mini-lbl">Cleared</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card" style={{ display: 'flex', gap: '8px', padding: '8px', marginBottom: '28px' }}>
        {(['teams', 'players', 'roster'] as RegTab[]).map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, textTransform: 'capitalize' }} onClick={() => setTab(t)}>
            {t === 'teams' ? <TrophyIcon size={16} /> : t === 'players' ? <UsersIcon size={16} /> : <ShieldIcon size={16} />}
            {t === 'teams' ? 'Register Teams' : t === 'players' ? 'Register Players' : 'Player Cards Roster'}
          </button>
        ))}
      </div>

      {/* ── TEAMS ─────────────────────────────────────────────────────────── */}
      {tab === 'teams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '20px', color: 'var(--text-primary)' }}>Register New Team</h3>
            <form onSubmit={handleAddTeam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Team Name *</label>
                  <input className="form-input" placeholder="e.g. BAA Eagles" value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Sport *</label>
                  <select className="form-input" value={teamForm.sport} onChange={e => setTeamForm(p => ({ ...p, sport: e.target.value }))}>
                    {SPORTS_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select className="form-input" value={teamForm.department} onChange={e => setTeamForm(p => ({ ...p, department: e.target.value }))} required>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.shortName})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Division</label>
                  <select className="form-input" value={teamForm.division} onChange={e => setTeamForm(p => ({ ...p, division: e.target.value }))}>
                    <option value="">Select division...</option>
                    {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Head Coach</label>
                  <input className="form-input" placeholder="Coach name" value={teamForm.coach} onChange={e => setTeamForm(p => ({ ...p, coach: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Team Color</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="color" className="form-input" style={{ padding: '6px', height: '42px', flex: '0 0 60px' }} value={teamForm.color} onChange={e => setTeamForm(p => ({ ...p, color: e.target.value }))} />
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: teamForm.color, border: '2px solid rgba(255,255,255,0.2)' }} />
                  </div>
                </div>
              </div>
              {teamSuccess && <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckIcon size={14} color="#34d399" /> {teamSuccess}</div>}
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <PlusIcon size={16} /> Register Team
              </button>
            </form>
          </div>

          {/* Teams grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {teams.map(team => {
              const dept = departments.find(d => d.id === team.department);
              const sport = SPORTS_LIST.find(s => s.id === team.sport);
              const teamPlayers = players.filter(p => p.teamId === team.id);
              return (
                <div key={team.id} className="glass-card" style={{ padding: '0', overflow: 'hidden', borderLeft: `4px solid ${team.color ?? '#3b82f6'}` }}>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${team.color ?? '#3b82f6'}20`, border: `1px solid ${team.color ?? '#3b82f6'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: team.color ?? 'var(--accent)' }}>
                        <ShieldIcon size={20} color={team.color ?? 'var(--accent)'} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{team.name}</div>
                        <div style={{ fontSize: '11px', color: dept?.color ?? 'var(--text-muted)', fontWeight: 700 }}>{dept?.shortName ?? '—'}</div>
                      </div>
                      {team.seed && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#fbbf24', fontWeight: 800 }}>Seed #{team.seed}</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Sport: <strong style={{ color: 'var(--text-primary)' }}>{sport?.name ?? team.sport}</strong></div>
                      {team.coach && <div>Coach: <strong style={{ color: 'var(--text-primary)' }}>{team.coach}</strong></div>}
                      <div>Roster: <strong>{teamPlayers.length}</strong> player{teamPlayers.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '20px' }}>
                        <CheckIcon size={10} color="#059669" /> Certified Eligible
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PLAYERS ───────────────────────────────────────────────────────── */}
      {tab === 'players' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', marginBottom: '20px', color: 'var(--text-primary)' }}>Register New Player</h3>
            <form onSubmit={handleAddPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="form-input" placeholder="Juan Dela Cruz" value={playerForm.name} onChange={e => setPlayerForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Student ID *</label>
                  <input className="form-input" placeholder="2024-00001" value={playerForm.studentId} onChange={e => setPlayerForm(p => ({ ...p, studentId: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select className="form-input" value={playerForm.department} onChange={e => setPlayerForm(p => ({ ...p, department: e.target.value }))} required>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sport</label>
                  <select className="form-input" value={playerForm.sport} onChange={e => setPlayerForm(p => ({ ...p, sport: e.target.value, position: '' }))}>
                    {SPORTS_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Team Assignment</label>
                  <select className="form-input" value={playerForm.teamId} onChange={e => setPlayerForm(p => ({ ...p, teamId: e.target.value }))}>
                    <option value="">No team assigned</option>
                    {teams.filter(t => t.sport === playerForm.sport).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Jersey Number</label>
                  <input className="form-input" placeholder="10" value={playerForm.jerseyNumber} onChange={e => setPlayerForm(p => ({ ...p, jerseyNumber: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <select className="form-input" value={playerForm.position} onChange={e => setPlayerForm(p => ({ ...p, position: e.target.value }))}>
                    <option value="">Select position...</option>
                    {(POSITIONS_BY_SPORT[SPORTS_LIST.find(s => s.id === playerForm.sport)?.name ?? ''] ?? []).map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>GWA (Eligibility)</label>
                  <input className="form-input" type="number" step="0.01" min="1" max="5" placeholder="1.75" value={playerForm.gwa} onChange={e => setPlayerForm(p => ({ ...p, gwa: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Gmail Address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="athlete@gmail.com or @asiancollege.edu.ph"
                    value={playerForm.email}
                    onChange={e => setPlayerForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="medical" checked={playerForm.medicalCleared} onChange={e => setPlayerForm(p => ({ ...p, medicalCleared: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: '#10b981' }} />
                <label htmlFor="medical" style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Medical clearance confirmed</label>
              </div>
              {playerSuccess && <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckIcon size={14} color="#34d399" /> {playerSuccess}</div>}
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                <PlusIcon size={16} /> Register Player
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ROSTER / PLAYER CARDS ─────────────────────────────────────────── */}
      {tab === 'roster' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select className="form-input" style={{ maxWidth: '200px' }} value={filterSport} onChange={e => setFilterSport(e.target.value)}>
              <option value="all">All Sports</option>
              {SPORTS_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="form-input" style={{ maxWidth: '200px' }} value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
              <option value="all">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <span style={{ alignSelf: 'center', fontSize: '13px', color: '#64748b' }}>{filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}</span>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="empty-state glass-card">No players found. Register players in the Players tab.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {filteredPlayers.map(player => {
                const dept = departments.find(d => d.id === player.department);
                const team = teams.find(t => t.id === player.teamId);
                return <PlayerCard key={player.id} player={player} department={dept} team={team} />;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

