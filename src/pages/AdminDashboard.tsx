import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';
import type { Sport } from '../types';
import {
  BasketballIcon,
  VolleyballIcon,
  ShuttlecockIcon,
  TableTennisIcon,
  GamepadIcon,
  ChessIcon,
  TrophyIcon,
  MapPinIcon,
  CheckIcon,
  UsersIcon,
  CalendarIcon,
  MedalIcon,
  FlameIcon,
  ClipboardIcon,
  ShieldIcon,
  HomeIcon,
  LiveIcon,
  BarChartIcon,
  AlertTriangleIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
  FileTextIcon,
} from '../components/Icons';
import padulaTitleImg from '../assets/padula-title.png';

// ─── Sport catalog ─────────────────────────────────────────────────────────────
const SPORTS: (Sport & { iconComp: (c?: string) => React.ReactNode })[] = [
  { id: 's1', name: 'Basketball',     type: 'bracket', subtitle: 'Team sport · 5v5',            icon: '🏀', iconComp: (c) => <BasketballIcon size={24} color={c} /> },
  { id: 's2', name: 'Volleyball',     type: 'bracket', subtitle: 'Men, women divisions',         icon: '🏐', iconComp: (c) => <VolleyballIcon  size={24} color={c} /> },
  { id: 's3', name: 'Badminton',      type: 'bracket', subtitle: 'Singles, doubles tournament',  icon: '🏸', iconComp: (c) => <ShuttlecockIcon size={24} color={c} /> },
  { id: 's4', name: 'Table Tennis',   type: 'bracket', subtitle: 'Singles & doubles match',      icon: '🏓', iconComp: (c) => <TableTennisIcon size={24} color={c} /> },
  { id: 's5', name: 'Mobile Legends', type: 'bracket', subtitle: 'Collegiate Esports · 5v5',     icon: '🎮', iconComp: (c) => <GamepadIcon     size={24} color={c} /> },
  { id: 's6', name: 'DOTA',           type: 'bracket', subtitle: 'MOBA Esports · 5v5',           icon: '🎮', iconComp: (c) => <GamepadIcon     size={24} color={c} /> },
  { id: 's7', name: 'Valorant',       type: 'bracket', subtitle: 'Tactical FPS · 5v5',           icon: '🎮', iconComp: (c) => <GamepadIcon     size={24} color={c} /> },
  { id: 's8', name: 'Chess',          type: 'bracket', subtitle: 'Standard & rapid chess',       icon: '♟',  iconComp: (c) => <ChessIcon       size={24} color={c} /> },
  { id: 's9', name: 'Cheerdance',     type: 'judged',  subtitle: 'Team routine · judged',        icon: '📣', iconComp: (c) => <TrophyIcon      size={24} color={c} /> },
];

type SetupStep = 'accounts' | 'sport' | 'event' | 'teams' | 'bracket' | 'scorekeepers' | 'publish';

const STEPS: { id: SetupStep; label: string; desc: string; icon: (c?: string) => React.ReactNode }[] = [
  { id: 'accounts', label: 'User Accounts', desc: 'Admin, manager, coach, scorer', icon: (c) => <UsersIcon size={18} color={c} /> },
  { id: 'sport', label: 'Sport & Category', desc: 'From sports catalog', icon: (c) => <TrophyIcon size={18} color={c} /> },
  { id: 'event', label: 'Create Event', desc: 'Dates, venue, tournament rules', icon: (c) => <CalendarIcon size={18} color={c} /> },
  { id: 'teams', label: 'Register Teams', desc: 'Collegiate roster validation', icon: (c) => <MedalIcon size={18} color={c} /> },
  { id: 'bracket', label: 'Generate Bracket', desc: 'Auto-seeding and match pairing', icon: (c) => <FlameIcon size={18} color={c} /> },
  { id: 'scorekeepers', label: 'Assign Scorekeepers', desc: 'Per match & court assignment', icon: (c) => <ClipboardIcon size={18} color={c} /> },
  { id: 'publish', label: 'Publish Schedule', desc: 'Broadcast live to portal', icon: (c) => <ShieldIcon size={18} color={c} /> },
];

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, color, linkLabel, onClick, warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color?: string;
  linkLabel?: string;
  onClick?: () => void;
  warning?: boolean;
}) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: onClick ? 'pointer' : undefined,
        borderLeft: warning ? '3px solid #f59e0b' : `3px solid ${color || 'var(--accent)'}`,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onClick={onClick}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color || 'var(--accent)'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        {warning && <span style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', background: '#f59e0b18', padding: '2px 8px', borderRadius: 20 }}>Attention</span>}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
      {linkLabel && (
        <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
          {linkLabel} <ArrowRightIcon size={11} />
        </div>
      )}
    </div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────────────────
function AlertItem({ icon, text, actionLabel, onAction, severity = 'warning' }: {
  icon: React.ReactNode;
  text: string;
  actionLabel: string;
  onAction: () => void;
  severity?: 'warning' | 'error' | 'info';
}) {
  const colors = { warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' };
  const col = colors[severity];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 10, background: `${col}0d`, border: `1px solid ${col}30`, flexWrap: 'wrap' }}>
      <div style={{ color: col, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', minWidth: 180 }}>{text}</div>
      <button
        type="button"
        className="btn btn-sm"
        onClick={onAction}
        style={{ background: col, color: '#fff', border: 'none', fontWeight: 700, fontSize: '11px', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ─── Live Match Card ──────────────────────────────────────────────────────────
function LiveMatchCard({ match, onOpen }: { match: any; onOpen: () => void }) {
  const sport = SPORTS_CATALOG.find(s => s.id === match.sport || s.name.toLowerCase() === match.sport.toLowerCase());
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <div
      className="glass-card"
      style={{ padding: '16px 20px', cursor: 'pointer', border: isLive ? '1px solid rgba(220,38,38,0.35)' : '1px solid var(--border)' }}
      onClick={onOpen}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {sport && <span>{sport.icon('var(--text-muted)', 16)}</span>}
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sport?.name || match.sport}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {match.round}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLive && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10px', fontWeight: 800, color: '#dc2626', background: 'rgba(220,38,38,0.12)', padding: '3px 8px', borderRadius: 20 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.4s infinite' }} />LIVE</span>}
          {isFinished && <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: 20 }}>FINISHED</span>}
          {!isLive && !isFinished && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: 20 }}>SCHEDULED</span>}
          {match.conflictWarning && <span style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '3px 8px', borderRadius: 20 }}>Conflict</span>}
        </div>
      </div>

      {/* Teams & Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.teamA}</span>
        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{match.scoreA}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 700 }}>–</span>
            <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{match.scoreB}</span>
          </div>
        </div>
        <span style={{ flex: 1, fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.teamB}</span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
          <MapPinIcon size={11} color="var(--text-muted)" /> {match.venue}
        </span>
        {match.scorekeeper && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
            <ClipboardIcon size={11} color="var(--text-muted)" /> {match.scorekeeper}
          </span>
        )}
        {!match.scorekeeper && (
          <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>No scorer assigned</span>
        )}
        {match.scheduledTime && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            <ClockIcon size={11} color="var(--text-muted)" />
            {new Date(match.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const {
    currentUser, matches, officials, players, teams, departments,
    registeredUsers, auditLogs, announcements,
    assignMatchOfficials, setActiveView, postAnnouncement,
    updatePlayer, addAuditLog,
  } = useApp();

  // Top-level tab: dashboard | officials-hub | wizard
  const [adminTab, setAdminTab] = useState<'dashboard' | 'officials-hub' | 'wizard'>('dashboard');

  // Modals for Needs Attention
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedReassignScorer, setSelectedReassignScorer] = useState<Record<string, string>>({});

  // Wizard state
  const [activeStep, setActiveStep] = useState<SetupStep>('accounts');
  const [selectedSport, setSelectedSport] = useState<typeof SPORTS[0] | null>(null);
  const [entriesValid, setEntriesValid] = useState<boolean | null>(null);
  const [eventForm, setEventForm] = useState({
    name: 'Asian College Padula Intramurals 2026',
    dates: 'Nov 10 – Nov 18, 2026',
    venue: 'Padula Sports Arena',
    rules: 'Official Inter-Collegiate Athletic Rules',
  });

  // Officials Hub state
  const [officialFilter, setOfficialFilter] = useState<'all' | 'referee' | 'scorekeeper' | 'coach' | 'manager'>('all');

  // Dashboard state
  const [scheduleFilter, setScheduleFilter] = useState<{ sport: string; status: string }>({ sport: 'all', status: 'all' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', priority: 'normal' as 'normal' | 'urgent' });
  const [showAnnForm, setShowAnnForm] = useState(false);

  const role = currentUser?.role ?? 'guest';
  const isDirector = role === 'director';
  const isScorer = role === 'scorer';
  const isPlayer = role === 'player';

  // ── Derived Data ─────────────────────────────────────────────────────────────
  const refereesList = officials.filter(o => o.role === 'referee');

  // Combined scorekeepers list (reads both accredited officials and registered scorekeeper accounts)
  const scorekeepersList = useMemo(() => {
    const list = [...officials.filter(o => o.role === 'scorekeeper')];
    registeredUsers.filter(u => u.role === 'scorer').forEach(u => {
      const exists = list.some(o =>
        o.name.toLowerCase() === u.name.toLowerCase() ||
        (u.email && o.contact?.toLowerCase() === u.email.toLowerCase())
      );
      if (!exists) {
        list.push({
          id: u.id,
          name: u.name,
          role: 'scorekeeper',
          sport: 'All Sports',
          affiliation: 'Asian College Dumaguete',
          contact: u.email,
          licenseId: `ACC-SC-${u.id.slice(-4)}`,
          isActive: u.isActive !== false,
        });
      }
    });
    return list;
  }, [officials, registeredUsers]);
  const coachesList = officials.filter(o => o.role === 'coach');
  const managersList = officials.filter(o => o.role === 'manager');
  const filteredOfficials = officialFilter === 'all' ? officials : officials.filter(o => o.role === officialFilter);

  const liveMatches = useMemo(() => matches.filter(m => m.status === 'live'), [matches]);
  const scheduledMatches = useMemo(() => matches.filter(m => m.status === 'scheduled'), [matches]);
  const finishedMatches = useMemo(() => matches.filter(m => m.status === 'finished'), [matches]);

  const today = new Date().toDateString();
  const upcomingToday = useMemo(() =>
    scheduledMatches.filter(m => m.scheduledTime && new Date(m.scheduledTime).toDateString() === today),
    [scheduledMatches, today]);
  const finishedToday = useMemo(() =>
    finishedMatches.filter(m => m.scheduledTime && new Date(m.scheduledTime).toDateString() === today),
    [finishedMatches, today]);

  const coordinatorCount = registeredUsers.filter(u => u.role === 'coordinator' && u.isActive !== false).length;
  const activePlayers = players.filter(p => p.isActive !== false).length;
  const pendingPlayers = players.filter(p => !p.medicalCleared).length;
  const activeScorers = officials.filter(o => o.role === 'scorekeeper' && o.isActive !== false).length;

  const progressPct = matches.length > 0 ? Math.round((finishedMatches.length / matches.length) * 100) : 0;

  // ── Handlers for Attention Items ─────────────────────────────────────────────
  const pendingPlayersList = useMemo(() => players.filter(p => !p.medicalCleared), [players]);
  const conflictedMatches = useMemo(() => matches.filter(m => m.conflictWarning), [matches]);

  const handleApproveMedical = (playerId: string) => {
    const p = players.find(x => x.id === playerId);
    updatePlayer(playerId, { medicalCleared: true });
    addAuditLog('player_clear', `Approved medical clearance for athlete ${p?.name || playerId} (${p?.studentId || ''})`, playerId, 'Player');
  };

  const handleApproveAllMedical = () => {
    pendingPlayersList.forEach(p => {
      updatePlayer(p.id, { medicalCleared: true });
      addAuditLog('player_clear', `Bulk approved medical clearance for athlete ${p.name} (${p.studentId})`, p.id, 'Player');
    });
  };

  const handleResolveConflict = (matchId: string, newScorer: string) => {
    assignMatchOfficials(matchId, { scorekeeper: newScorer });
  };

  // ── Alerts ───────────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: {
      icon: React.ReactNode;
      text: string;
      actionLabel: string;
      onTrigger: () => void;
      severity: 'warning' | 'error' | 'info';
    }[] = [];

    const unassignedScorer = matches.filter(m => m.status !== 'finished' && !m.scorekeeper);
    if (unassignedScorer.length > 0)
      list.push({
        icon: <ClipboardIcon size={16} />,
        text: `${unassignedScorer.length} match${unassignedScorer.length > 1 ? 'es' : ''} without an assigned scorer.`,
        actionLabel: 'Assign Now',
        onTrigger: () => setAdminTab('officials-hub'),
        severity: 'warning',
      });

    const unassignedRef = matches.filter(m => m.status !== 'finished' && !m.referee);
    if (unassignedRef.length > 0)
      list.push({
        icon: <FlameIcon size={16} />,
        text: `${unassignedRef.length} match${unassignedRef.length > 1 ? 'es' : ''} without a referee.`,
        actionLabel: 'Assign Now',
        onTrigger: () => setAdminTab('officials-hub'),
        severity: 'warning',
      });

    if (pendingPlayers > 0)
      list.push({
        icon: <UsersIcon size={16} />,
        text: `${pendingPlayers} player${pendingPlayers > 1 ? 's' : ''} pending medical clearance.`,
        actionLabel: 'View Players',
        onTrigger: () => setShowMedicalModal(true),
        severity: 'warning',
      });

    const smallTeams = teams.filter(t => t.players.length < 5 && t.isActive !== false);
    if (smallTeams.length > 0)
      list.push({
        icon: <AlertTriangleIcon size={16} />,
        text: `${smallTeams.length} team${smallTeams.length > 1 ? 's' : ''} have fewer than 5 players on roster.`,
        actionLabel: 'View Teams',
        onTrigger: () => setActiveView('registration'),
        severity: 'error',
      });

    const conflicted = matches.filter(m => m.conflictWarning);
    if (conflicted.length > 0)
      list.push({
        icon: <ClockIcon size={16} />,
        text: `${conflicted.length} scorer time conflict detected.`,
        actionLabel: 'Resolve',
        onTrigger: () => setShowConflictModal(true),
        severity: 'error',
      });

    return list;
  }, [matches, pendingPlayers, teams, setActiveView]);

  // ── Scorer: assigned matches only ────────────────────────────────────────────
  const myOfficial = useMemo(() => {
    if (!isScorer) return null;
    return officials.find(o =>
      o.role === 'scorekeeper' && (
        o.name.toLowerCase() === currentUser?.name?.toLowerCase() ||
        o.contact?.toLowerCase() === currentUser?.email?.toLowerCase()
      )
    );
  }, [isScorer, officials, currentUser]);

  const myMatches = useMemo(() => {
    if (!isScorer) return matches;
    return matches.filter(m => m.scorekeeper?.toLowerCase() === currentUser?.name?.toLowerCase());
  }, [isScorer, matches, currentUser]);

  // ── Schedule table (filtered) ────────────────────────────────────────────────
  const filteredSchedule = useMemo(() => {
    return matches.filter(m => {
      const sportOk = scheduleFilter.sport === 'all' || m.sport === scheduleFilter.sport || getSportName(m.sport).toLowerCase() === scheduleFilter.sport.toLowerCase();
      const statusOk = scheduleFilter.status === 'all' || m.status === scheduleFilter.status;
      return sportOk && statusOk;
    });
  }, [matches, scheduleFilter]);

  // ── Recent Audit Logs ────────────────────────────────────────────────────────
  const recentAudit = useMemo(() => [...auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10), [auditLogs]);

  // ── Wizard helpers ────────────────────────────────────────────────────────────
  const stepIdx = STEPS.findIndex(s => s.id === activeStep);
  const goNext = () => { if (stepIdx < STEPS.length - 1) setActiveStep(STEPS[stepIdx + 1].id); };
  const goPrev = () => { if (stepIdx > 0) setActiveStep(STEPS[stepIdx - 1].id); };

  // ─── Wizard step renderer ──────────────────────────────────────────────────
  const renderStep = () => {
    switch (activeStep) {
      case 'accounts':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Manage Athletic Department Accounts</h3>
            <p className="step-section-sub">Configure permissions for tournament directors, coaches, referee officials, and scorekeepers.</p>
            <div className="role-cards">
              {[
                { role: 'Tournament Director', icon: <ShieldIcon size={24} color="#ff3355" />, desc: 'Master governance & sanctioning', count: 2 },
                { role: 'Athletic Managers', icon: <TrophyIcon size={24} color="#38bdf8" />, desc: 'Department team administration', count: managersList.length },
                { role: 'Varsity Coaches', icon: <UsersIcon size={24} color="#fbbf24" />, desc: 'Team rosters & athletic training', count: coachesList.length },
                { role: 'Official Referees', icon: <FlameIcon size={24} color="#ff4d6d" />, desc: 'Game officiating & rule compliance', count: refereesList.length },
                { role: 'Official Scorekeepers', icon: <ClipboardIcon size={24} color="#34d399" />, desc: 'Live digital scoring desk', count: scorekeepersList.length },
              ].map(r => (
                <div key={r.role} className="role-card glass-card">
                  <div className="role-icon-box">{r.icon}</div>
                  <div className="role-info"><strong>{r.role}</strong><span>{r.desc}</span></div>
                  <div className="role-count">{r.count}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={goNext}>Next: Select Sport →</button>
              <button className="btn btn-navy" onClick={() => setAdminTab('officials-hub')}>Go to Officials Hub →</button>
            </div>
          </div>
        );

      case 'sport':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Official Sports Catalog</h3>
            <p className="step-section-sub">Select the athletic event to configure tournament brackets and match regulations.</p>
            <div className="sports-grid">
              {SPORTS.map(sport => {
                const isSel = selectedSport?.id === sport.id;
                return (
                  <button key={sport.id} className={`sport-tile ${sport.type} ${isSel ? 'selected' : ''}`} onClick={() => setSelectedSport(sport)}>
                    <div className="sport-tile-icon-box">{sport.iconComp(isSel ? '#ff3355' : '#93c5fd')}</div>
                    <span className="sport-name">{sport.name}</span>
                    <span className="sport-subtitle">{sport.subtitle}</span>
                  </button>
                );
              })}
            </div>
            <div className="legend">
              <span className="legend-item bracket" style={{ color: '#ff4d6d' }}>● Elimination Tournament</span>
              <span className="legend-item judged" style={{ color: '#38bdf8' }}>● Judged & Point Score Ranking</span>
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={!selectedSport}>Next: Event Details →</button>
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Event Details {selectedSport && `— ${selectedSport.name}`}</h3>
            <p className="step-section-sub">Specify dates, arena locations, and regulatory handbook guidelines.</p>
            <div className="form-grid">
              {[
                { label: 'Tournament Title', key: 'name', placeholder: 'e.g. Asian College Padula Cup 2026' },
                { label: 'Tournament Dates', key: 'dates', placeholder: 'e.g. Oct 28 – Nov 5' },
                { label: 'Venue / Court', key: 'venue', placeholder: 'e.g. Padula Sports Complex Court A' },
                { label: 'Regulatory Ruleset', key: 'rules', placeholder: 'e.g. Official NCAA / FIBA Standard Rules' },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  <input className="form-input" placeholder={f.placeholder}
                    value={(eventForm as Record<string, string>)[f.key]}
                    onChange={e => setEventForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next: Team Roster →</button>
            </div>
          </div>
        );

      case 'teams':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Register Teams & Athlete Rosters</h3>
            <p className="step-section-sub">Validate coach submissions for eligibility and physical fitness certification.</p>
            <div className="teams-list">
              {[
                { name: 'Padula Eagles', division: 'Business Administration & Accountancy (BAA)', seed: '#1' },
                { name: 'Red Lions', division: 'Computer Studies & Engineering (CSE)', seed: '#2' },
                { name: 'Blue Sharks', division: 'Hospitality & Tourism Management (HTM)', seed: '#3' },
                { name: 'Padula Tigers', division: 'Department of Public Development (DPD)', seed: '#4' },
                { name: 'Panthers', division: 'Senior Department', seed: '#5' },
                { name: 'Silver Wolves', division: 'Business Administration & Accountancy (BAA)', seed: '#6' },
              ].map(team => (
                <div key={team.name} className="team-row glass-card">
                  <span className="team-num">{team.seed}</span>
                  <div className="team-info-col">
                    <span className="team-name-lg">{team.name}</span>
                    <span className="team-sub-dep">{team.division}</span>
                  </div>
                  <span className="team-status valid"><CheckIcon size={14} color="#34d399" /> Certified Eligible</span>
                </div>
              ))}
            </div>
            <div className="validation-question glass-card" style={{ padding: '18px 24px', marginTop: '20px' }}>
              <p style={{ fontWeight: 700, fontSize: '15px' }}>Are all team rosters verified by Asian College Padula Sports Board?</p>
              <div className="validation-btns">
                <button className={`btn ${entriesValid === false ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setEntriesValid(false)}>Flag Incomplete Entries</button>
                <button className={`btn ${entriesValid === true ? 'btn-success' : 'btn-primary'}`} onClick={() => { setEntriesValid(true); goNext(); }}>Confirm & Generate Bracket</button>
              </div>
            </div>
          </div>
        );

      case 'bracket':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Automated Tournament Bracket Seeding</h3>
            <p className="step-section-sub">Single-elimination championship bracket mapped to active court venues.</p>
            <div className="bracket-preview">
              <div className="bracket-round">
                <div className="bracket-label">Quarter-Finals</div>
                {[['Padula Eagles', 'Red Lions'], ['Blue Sharks', 'Padula Tigers'], ['Panthers', 'Silver Wolves'], ['Golden Falcons', 'Crimson Bears']].map(([a, b], i) => (
                  <div key={i} className="bracket-match glass-card">
                    <span style={{ fontWeight: 600 }}>{a}</span>
                    <span className="bracket-vs">VS</span>
                    <span style={{ fontWeight: 600 }}>{b}</span>
                  </div>
                ))}
              </div>
              <div className="bracket-round">
                <div className="bracket-label">Semi-Finals</div>
                {[['Winner QF1', 'Winner QF2'], ['Winner QF3', 'Winner QF4']].map((p, i) => (
                  <div key={i} className="bracket-match glass-card tbd">
                    <span>{p[0]}</span><span className="bracket-vs">VS</span><span>{p[1]}</span>
                  </div>
                ))}
              </div>
              <div className="bracket-round">
                <div className="bracket-label">Padula Championship Final</div>
                <div className="bracket-match glass-card tbd final">
                  <TrophyIcon size={18} color="#fbbf24" />
                  <span>Gold Medal Championship Match</span>
                </div>
              </div>
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next: Assign Scorekeepers →</button>
            </div>
          </div>
        );

      case 'scorekeepers':
        return (
          <div className="step-content">
            <h3 className="step-section-heading">Official Scorekeeper & Referee Game Assignment</h3>
            <p className="step-section-sub">Assign certified staff and game officials to active competition courts.</p>
            <div className="assign-grid">
              {matches.map(m => (
                <div key={m.id} className="assign-card glass-card">
                  <div className="assign-match" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.teamA} vs {m.teamB}</div>
                  <div className="assign-venue" style={{ color: 'var(--text-muted)' }}><MapPinIcon size={14} color="var(--text-muted)" /> {m.venue} ({m.sport})</div>
                  <div className="assign-scorer" style={{ marginTop: '8px', color: 'var(--text-secondary)' }}><ClipboardIcon size={14} color="#10b981" /> Scorer: <strong>{m.scorekeeper || 'Unassigned'}</strong></div>
                  <div className="assign-scorer" style={{ marginTop: '4px', color: 'var(--text-secondary)' }}><FlameIcon size={14} color="var(--accent)" /> Referee: <strong>{m.referee || 'Unassigned'}</strong></div>
                </div>
              ))}
            </div>
            <div className="step-nav">
              <button className="btn btn-ghost" onClick={goPrev}>← Back</button>
              <button className="btn btn-primary" onClick={goNext}>Publish Official Schedule →</button>
            </div>
          </div>
        );

      case 'publish':
        return (
          <div className="step-content publish-step glass-card" style={{ padding: '36px', textAlign: 'center' }}>
            <div style={{ margin: '0 auto 16px' }}><ShieldIcon size={54} color="#ff3355" /></div>
            <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Asian College Padula Schedule Live!</h3>
            <p style={{ color: '#94a3b8', maxWidth: '480px', margin: '0 auto 24px' }}>
              Tournament brackets, assigned referees, scorekeepers, and managers are now active.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', maxWidth: '640px', margin: '0 auto 28px' }}>
              <div className="stat-box glass-card"><div className="stat-val" style={{ color: '#ff4d6d' }}>{matches.length}</div><div className="stat-lbl">Matches</div></div>
              <div className="stat-box glass-card"><div className="stat-val" style={{ color: '#38bdf8' }}>{refereesList.length}</div><div className="stat-lbl">Referees</div></div>
              <div className="stat-box glass-card"><div className="stat-val" style={{ color: '#34d399' }}>{scorekeepersList.length}</div><div className="stat-lbl">Scorekeepers</div></div>
              <div className="stat-box glass-card"><div className="stat-val" style={{ color: '#fbbf24' }}>{coachesList.length}</div><div className="stat-lbl">Coaches</div></div>
            </div>
            <button className="btn btn-primary" onClick={() => setActiveStep('accounts')}>Configure Another Tournament Event</button>
          </div>
        );

      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORER DASHBOARD — simple focused view
  // ═══════════════════════════════════════════════════════════════════════════
  if (isScorer) {
    return (
      <div className="dashboard-content">
        <div className="page-header">
          <div>
            <div className="brand-pill-tag">Scoring Desk</div>
            <h1 className="page-title">My Assigned Matches</h1>
            <p className="page-desc">
              {myOfficial ? `Assigned sport: ${myOfficial.sport}` : 'Showing all matches you are assigned to score.'}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setActiveView('scorekeeper')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardIcon size={16} /> Open Scoring Desk
          </button>
        </div>

        {myMatches.length === 0 ? (
          <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ClipboardIcon size={40} color="var(--text-muted)" />
            <p style={{ marginTop: 12, fontSize: 14 }}>You have no matches assigned yet. Contact the Sports Director.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {myMatches.map(m => (
              <LiveMatchCard key={m.id} match={m} onOpen={() => setActiveView('scorekeeper')} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYER DASHBOARD — their matches & personal info
  // ═══════════════════════════════════════════════════════════════════════════
  if (isPlayer) {
    return (
      <div className="dashboard-content">
        <div className="page-header">
          <div>
            <div className="brand-pill-tag">Athlete Portal</div>
            <h1 className="page-title">My Schedule</h1>
            <p className="page-desc">Your upcoming matches, results, and personal performance data.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setActiveView('player-stats')} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChartIcon size={16} /> My Stats
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {matches.slice(0, 6).map(m => (
            <LiveMatchCard key={m.id} match={m} onOpen={() => setActiveView('live')} />
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECTOR / COORDINATOR — Full Operations Dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="dashboard-content">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={padulaTitleImg} alt="PADULA 2026" className="padula-hero-title-img" />
          <div>
            <div className="brand-pill-tag">Asian College Dumaguete</div>
            <h1 className="page-title" style={{ fontFamily: 'var(--font-sports)', fontStyle: 'italic', letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0 }}>Tournament Operations</h1>
            <p className="page-desc" style={{ marginTop: 2 }}>
              {isDirector
                ? `Sports Director · ${coordinatorCount} coordinator${coordinatorCount !== 1 ? 's' : ''} active`
                : 'Sports Coordinator · Operations overview'}
            </p>
          </div>
        </div>
        {/* Top tab switcher */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm ${adminTab === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAdminTab('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <HomeIcon size={14} /> Dashboard
          </button>
          <button className={`btn btn-sm ${adminTab === 'officials-hub' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAdminTab('officials-hub')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShieldIcon size={14} /> Officials Hub
          </button>
          <button className={`btn btn-sm ${adminTab === 'wizard' ? 'btn-navy' : 'btn-ghost'}`} onClick={() => setAdminTab('wizard')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarIcon size={14} /> Setup Wizard
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1: OPERATIONS DASHBOARD
         ════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── Summary Cards ──────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
            <StatCard icon={<LiveIcon size={18} color="#dc2626" />} label="Live Now" value={liveMatches.length} color="#dc2626" linkLabel="View Live" onClick={() => setActiveView('live')} />
            <StatCard icon={<ClockIcon size={18} color="#f59e0b" />} label="Upcoming Today" value={upcomingToday.length} color="#f59e0b" linkLabel="See Schedule" onClick={() => setActiveView('live')} />
            <StatCard icon={<CheckIcon size={18} color="#10b981" />} label="Finished Today" value={finishedToday.length} color="#10b981" />
            <StatCard icon={<UsersIcon size={18} color="#3b82f6" />} label="Total Teams" value={teams.filter(t => t.isActive !== false).length} color="#3b82f6" linkLabel="Manage Teams" onClick={() => setActiveView('registration')} />
            <StatCard icon={<MedalIcon size={18} color="#a78bfa" />} label="Total Players" value={activePlayers} color="#a78bfa" linkLabel="View Players" onClick={() => setActiveView('player')} />
            <StatCard icon={<ShieldIcon size={18} color="#38bdf8" />} label="Officials" value={officials.length} color="#38bdf8" linkLabel="Officials Hub" onClick={() => setAdminTab('officials-hub')} />
            <StatCard icon={<ClipboardIcon size={18} color="#34d399" />} label="Active Scorers" value={activeScorers} color="#34d399" />
            {pendingPlayers > 0 && <StatCard icon={<AlertTriangleIcon size={18} color="#f59e0b" />} label="Pending Clearance" value={pendingPlayers} warning linkLabel="View Players" onClick={() => setActiveView('player')} />}
          </div>

          {/* ── Tournament Progress ─────────────────────────────────────────── */}
          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrophyIcon size={16} color="var(--accent)" /> Tournament Progress
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{finishedMatches.length} / {matches.length} matches completed</span>
            </div>
            <div style={{ height: 10, borderRadius: 20, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 20, background: 'linear-gradient(90deg, var(--accent), #f59e0b)', width: `${progressPct}%`, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              <span>{progressPct}% complete</span>
              <span>{scheduledMatches.length} remaining</span>
            </div>
          </div>

          {/* ── Needs Attention ─────────────────────────────────────────────── */}
          {alerts.length > 0 && (
            <div>
              <SectionDivider label="Needs Attention" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {alerts.map((a, i) => (
                  <AlertItem key={i} icon={a.icon} text={a.text} actionLabel={a.actionLabel} severity={a.severity} onAction={a.onTrigger} />
                ))}
              </div>
            </div>
          )}

          {/* ── Quick Actions ───────────────────────────────────────────────── */}
          <div>
            <SectionDivider label="Quick Actions" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('registration')}>
                <PlusIcon size={15} /> Register Player
              </button>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('registration')}>
                <UsersIcon size={15} /> Register Team
              </button>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('event-setup')}>
                <CalendarIcon size={15} /> Create Event
              </button>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setAdminTab('officials-hub')}>
                <ClipboardIcon size={15} /> Assign Scorer
              </button>
              <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setShowAnnForm(v => !v)}>
                <FileTextIcon size={15} /> Post Announcement
              </button>
            </div>

            {/* Announcement form */}
            {showAnnForm && (
              <div className="glass-card" style={{ marginTop: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Post Announcement</div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Title</label>
                    <input className="form-input" placeholder="Announcement title" value={announcementForm.title} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-input" value={announcementForm.priority} onChange={e => setAnnouncementForm(p => ({ ...p, priority: e.target.value as 'normal' | 'urgent' }))}>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea className="form-input" rows={3} placeholder="Announcement body text…" value={announcementForm.body} onChange={e => setAnnouncementForm(p => ({ ...p, body: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => {
                    if (!announcementForm.title.trim() || !announcementForm.body.trim()) return;
                    postAnnouncement({ title: announcementForm.title, body: announcementForm.body, priority: announcementForm.priority, createdBy: currentUser?.name ?? 'Director' });
                    setAnnouncementForm({ title: '', body: '', priority: 'normal' });
                    setShowAnnForm(false);
                  }}>Post</button>
                  <button className="btn btn-ghost" onClick={() => setShowAnnForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Live Now ────────────────────────────────────────────────────── */}
          <div>
            <SectionDivider label={`Live Now (${liveMatches.length})`} />
            {liveMatches.length === 0 ? (
              <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', marginTop: 14 }}>
                <LiveIcon size={36} color="var(--text-muted)" />
                <p style={{ marginTop: 10, fontSize: 14 }}>No live matches right now.{upcomingToday.length > 0 ? ` Next: ${upcomingToday[0]?.teamA} vs ${upcomingToday[0]?.teamB}` : ''}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginTop: 14 }}>
                {liveMatches.map(m => <LiveMatchCard key={m.id} match={m} onOpen={() => setActiveView('live')} />)}
              </div>
            )}
          </div>

          {/* ── Next Matches ────────────────────────────────────────────────── */}
          {scheduledMatches.length > 0 && (
            <div>
              <SectionDivider label="Next Matches" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 14 }}>
                {scheduledMatches.slice(0, 5).map(m => <LiveMatchCard key={m.id} match={m} onOpen={() => setAdminTab('officials-hub')} />)}
              </div>
            </div>
          )}

          {/* ── Tournament Schedule & Results ───────────────────────────────── */}
          <div>
            <SectionDivider label="Tournament Schedule & Results" />
            <div className="glass-card" style={{ padding: '20px 24px', marginTop: 14 }}>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <select className="form-input" style={{ maxWidth: 170, padding: '7px 10px', fontSize: 12 }}
                  value={scheduleFilter.sport} onChange={e => setScheduleFilter(p => ({ ...p, sport: e.target.value }))}>
                  <option value="all">All Sports</option>
                  {SPORTS_CATALOG.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="form-input" style={{ maxWidth: 150, padding: '7px 10px', fontSize: 12 }}
                  value={scheduleFilter.status} onChange={e => setScheduleFilter(p => ({ ...p, status: e.target.value }))}>
                  <option value="all">All Statuses</option>
                  <option value="live">Live</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="finished">Finished</option>
                </select>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>{filteredSchedule.length} matches</span>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Sport', 'Teams', 'Score', 'Round', 'Venue', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedule.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No matches match the selected filters.</td></tr>
                    ) : filteredSchedule.map(m => {
                      const sport = SPORTS_CATALOG.find(s => s.id === m.sport || s.name.toLowerCase() === m.sport.toLowerCase());
                      const isLive = m.status === 'live';
                      const isFin = m.status === 'finished';
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {sport?.icon('var(--text-muted)', 15)}
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{sport?.name || m.sport}</span>
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {m.teamA} <span style={{ color: 'var(--accent)', fontWeight: 400 }}>vs</span> {m.teamB}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {isFin || isLive ? `${m.scoreA} – ${m.scoreB}` : '–'}
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{m.round}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPinIcon size={11} color="var(--text-muted)" /> {m.venue}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className={`status-badge ${m.status}`} style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {isLive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.4s infinite' }} />}
                              {m.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Recent Audit Activity ───────────────────────────────────────── */}
          <div>
            <SectionDivider label="Recent Activity" />
            <div className="glass-card" style={{ padding: '20px 24px', marginTop: 14 }}>
              {recentAudit.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>No audit activity recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentAudit.map((log, i) => {
                    const actionColors: Record<string, string> = {
                      login: '#10b981', logout: '#6b7280', score_update: '#3b82f6',
                      match_start: '#f59e0b', match_finish: '#8b5cf6', player_register: '#06b6d4',
                      team_register: '#14b8a6', official_register: '#38bdf8', announcement_post: '#ec4899',
                      event_create: '#a78bfa', bracket_generate: '#f59e0b',
                    };
                    const col = actionColors[log.action] || '#94a3b8';
                    const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 8, background: i % 2 === 0 ? 'var(--bg-elevated)' : 'transparent' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong style={{ color: col }}>{log.userName}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> — {log.details}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{dateStr} {timeStr}</span>
                        <span style={{ fontSize: '10px', background: `${col}18`, color: col, padding: '2px 7px', borderRadius: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{log.userRole}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button className="btn btn-sm btn-ghost" style={{ fontSize: 12 }} onClick={() => setActiveView('audit')}>
                  View Full Audit Trail <ArrowRightIcon size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Latest Announcements ─────────────────────────────────────────── */}
          {announcements.length > 0 && (
            <div>
              <SectionDivider label="Latest Announcements" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                {announcements.slice(0, 3).map(ann => (
                  <div key={ann.id} className="glass-card" style={{ padding: '14px 20px', borderLeft: ann.priority === 'urgent' ? '3px solid #ef4444' : '3px solid var(--accent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{ann.title}</span>
                      {ann.priority === 'urgent' && <span style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 20 }}>URGENT</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{ann.body}</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 8 }}>
                      {ann.createdBy} · {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2 — OFFICIALS REGISTRATION HUB
         ════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'officials-hub' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                Unified Registration Portal
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                All official registrations (Referees, Scorekeepers, Coaches, Managers, and Coordinators) are now managed on the Registration Page.
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setActiveView('registration')} style={{ fontWeight: 700 }}>
              Open Registration Portal →
            </button>
          </div>

          <SectionDivider label="Assign Officials Per Game" />

          {/* PER-GAME ASSIGNMENT CONSOLE */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: '20px' }}>
                  <ClipboardIcon size={20} color="var(--accent)" /> Per-Game Official Assignments
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Assign the certified Referee, Scorekeeper, Coaches, and Manager for each tournament match.
                </p>
              </div>
              <div className="badge-chip"><span>Total Matches: {matches.length}</span></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {matches.map(m => {
                const isComplete = m.referee && m.scorekeeper && m.coachA && m.coachB && m.manager;
                return (
                  <div key={m.id} className="glass-card" style={{
                    padding: '18px 22px',
                    background: 'var(--bg-elevated)',
                    border: isComplete ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--border)',
                    borderRadius: '12px',
                  }}>
                    {/* Match header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge-chip" style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>{m.sport.toUpperCase()}</span>
                        <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{m.teamA} <span style={{ color: 'var(--accent)' }}>vs</span> {m.teamB}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>· {m.round}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}><MapPinIcon size={13} color="var(--text-muted)" /> {m.venue}</span>
                        <span className={`status-badge ${m.status}`}>{m.status === 'live' && <span className="live-dot" />}{m.status.toUpperCase()}</span>
                        {isComplete
                          ? <span className="badge-chip" style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', borderColor: 'rgba(16,185,129,0.3)' }}><CheckIcon size={12} color="#059669" /> All Certified</span>
                          : <span className="badge-chip" style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>In Progress</span>
                        }
                      </div>
                    </div>

                    {/* Dropdowns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><FlameIcon size={12} color="var(--accent)" /> REFEREE</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.referee || ''} onChange={e => assignMatchOfficials(m.id, { referee: e.target.value })}>
                          <option value="">Select Referee...</option>
                          {refereesList.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><ClipboardIcon size={12} color="#10b981" /> SCOREKEEPER</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.scorekeeper || ''} onChange={e => assignMatchOfficials(m.id, { scorekeeper: e.target.value })}>
                          <option value="">Select Scorekeeper...</option>
                          {scorekeepersList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><UsersIcon size={12} color="#3b82f6" /> COACH ({m.teamA})</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.coachA || ''} onChange={e => assignMatchOfficials(m.id, { coachA: e.target.value })}>
                          <option value="">Select Coach...</option>
                          {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><UsersIcon size={12} color="#3b82f6" /> COACH ({m.teamB})</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.coachB || ''} onChange={e => assignMatchOfficials(m.id, { coachB: e.target.value })}>
                          <option value="">Select Coach...</option>
                          {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><TrophyIcon size={12} color="#f59e0b" /> MANAGER</label>
                        <select className="form-input" style={{ padding: '8px 10px', fontSize: '12.5px' }}
                          value={m.manager || ''} onChange={e => assignMatchOfficials(m.id, { manager: e.target.value })}>
                          <option value="">Select Manager...</option>
                          {managersList.map(mg => <option key={mg.id} value={mg.name}>{mg.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <SectionDivider label="Accredited Officials Directory" />

          {/* OFFICIALS DIRECTORY */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: '20px' }}>
                  <UsersIcon size={20} color="var(--accent)" /> Asian College Padula Accredited Officials
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>All certified Referees, Scorekeepers, Coaches, and Managers on record.</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['all', 'referee', 'scorekeeper', 'coach', 'manager'] as const).map(r => (
                  <button key={r} className={`btn btn-sm ${officialFilter === r ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setOfficialFilter(r)} style={{ textTransform: 'capitalize' }}>
                    {r === 'all' ? `All (${officials.length})` : `${r}s (${officials.filter(o => o.role === r).length})`}
                  </button>
                ))}
              </div>
            </div>

            {officials.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                <ShieldIcon size={38} color="var(--text-muted)" />
                <p style={{ marginTop: '12px', fontSize: '14px' }}>No officials registered yet. Use the registration page to add officials.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {filteredOfficials.map(official => {
                  const badgeColor =
                    official.role === 'referee' ? '#ef4444' :
                      official.role === 'scorekeeper' ? '#10b981' :
                        official.role === 'coach' ? '#3b82f6' : '#f59e0b';
                  return (
                    <div key={official.id} className="glass-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: `3px solid ${badgeColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: badgeColor, background: `${badgeColor}20`, padding: '2px 8px', borderRadius: '4px' }}>
                          {official.role}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{official.licenseId}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{official.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Affiliation: <strong style={{ color: 'var(--text-primary)' }}>{official.affiliation}</strong></div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Discipline: <strong style={{ color: 'var(--text-primary)' }}>{official.sport}</strong></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3 — 7-STEP TOURNAMENT WIZARD
         ════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'wizard' && (
        <div className="setup-wizard">
          <div className="wizard-sidebar glass-card">
            <div className="wizard-title">Tournament Setup Wizard</div>
            {STEPS.map((step, i) => {
              const isDone = i < stepIdx;
              const isActive = activeStep === step.id;
              const iconColor = isActive ? '#ff3355' : isDone ? '#34d399' : '#94a3b8';
              return (
                <button key={step.id} className={`wizard-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                  onClick={() => setActiveStep(step.id)}>
                  <div className="wizard-step-num">{isDone ? <CheckIcon size={14} color="#34d399" /> : i + 1}</div>
                  <div className="wizard-step-info">
                    <div className="wizard-step-label">
                      <span className="wizard-step-icon">{step.icon(iconColor)}</span>
                      <span>{step.label}</span>
                    </div>
                    <div className="wizard-step-desc">{step.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="wizard-main glass-card">{renderStep()}</div>
        </div>
      )}

      {/* ── Medical Clearance Modal ── */}
      {showMedicalModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative',
            background: 'var(--bg-card)',
          }}>
            <button
              type="button"
              onClick={() => setShowMedicalModal(false)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <UsersIcon size={22} color="var(--accent)" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Medical Clearance Review
              </h2>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Verify health certificates and grant official Padula 2026 intramurals tournament eligibility.
            </p>

            {pendingPlayersList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckIcon size={32} color="#10b981" />
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
                  All Athletes Cleared!
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  There are no athletes with pending medical clearance at this time.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {pendingPlayersList.length} Athlete{pendingPlayersList.length > 1 ? 's' : ''} Pending Clearance
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleApproveAllMedical}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    ✓ Approve All
                  </button>
                </div>

                {pendingPlayersList.map(p => {
                  const dept = departments.find(d => d.id === p.department);
                  const team = teams.find(t => t.id === p.teamId);
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '13px',
                          }}
                        >
                          {p.jerseyNumber ? `#${p.jerseyNumber}` : p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            ID: <strong>{p.studentId}</strong> · {dept?.shortName || p.department} · {team?.name || getSportName(p.sport)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleApproveMedical(p.id)}
                          style={{ fontSize: '11.5px', fontWeight: 700, padding: '5px 12px' }}
                        >
                          ✓ Approve Clearance
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setShowMedicalModal(false);
                  setActiveView('player');
                }}
                style={{ fontSize: '12px' }}
              >
                Go to Full Players Roster →
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowMedicalModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resolve Scorer Conflict Modal ── */}
      {showConflictModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
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
              onClick={() => setShowConflictModal(false)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ClockIcon size={22} color="#ef4444" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Resolve Scorer Scheduling Conflicts
              </h2>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Reassign official scorekeepers or adjust assignments to eliminate concurrent duty overlaps.
            </p>

            {conflictedMatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckIcon size={32} color="#10b981" />
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
                  All Conflicts Resolved!
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  No overlapping official assignments detected across tournament matches.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {conflictedMatches.map(m => {
                  const currentSelected = selectedReassignScorer[m.id] ?? '';
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text-primary)' }}>
                            {m.teamA} vs {m.teamB}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {getSportName(m.sport)} · {m.round} · {m.venue}
                          </div>
                        </div>

                        <span className="status-badge live" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          Overlap Conflict
                        </span>
                      </div>

                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#f87171',
                      }}>
                        ⚠️ {m.conflictWarning}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Reassign To Another Certified Scorer:
                          </label>
                          <select
                            className="form-input"
                            style={{ padding: '6px 10px', fontSize: '12.5px', width: '100%' }}
                            value={currentSelected}
                            onChange={e => setSelectedReassignScorer(prev => ({ ...prev, [m.id]: e.target.value }))}
                          >
                            <option value="">-- Choose New Scorer --</option>
                            <option value="__UNASSIGN__">Remove Scorer (Unassign)</option>
                            {scorekeepersList.map(o => (
                              <option key={o.id} value={o.name}>
                                {o.name} ({o.sport || 'Certified'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={!currentSelected}
                          onClick={() => handleResolveConflict(m.id, currentSelected === '__UNASSIGN__' ? '' : currentSelected)}
                          style={{ alignSelf: 'flex-end', fontWeight: 700, padding: '7px 14px' }}
                        >
                          Resolve Conflict
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setShowConflictModal(false);
                  setAdminTab('officials-hub');
                }}
                style={{ fontSize: '12px' }}
              >
                Go to Officials Hub →
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowConflictModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
