import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import {
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
  XIcon,
} from '../components/Icons';
import padulaTitleImg from '../assets/padula-title.png';
import schoolLogo from '../assets/logo.png';

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
    updatePlayer, addAuditLog, clearAllMatches,
  } = useApp();

  // Modals for Needs Attention
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedReassignScorer, setSelectedReassignScorer] = useState<Record<string, string>>({});

  // Dashboard state
  const [scheduleFilter, setScheduleFilter] = useState<{ sport: string; status: string }>({ sport: 'all', status: 'all' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', priority: 'normal' as 'normal' | 'urgent' });
  const [showAnnForm, setShowAnnForm] = useState(false);

  const role = currentUser?.role ?? 'guest';
  const isDirector = role === 'director';
  const isScorer = role === 'scorer';
  const isPlayer = role === 'player';

  // ── Derived Data ─────────────────────────────────────────────────────────────
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
          id: `u-${u.id}`,
          name: u.name,
          role: 'scorekeeper',
          sport: u.assignedSport || 'General',
          licenseId: `ACC-SC-${u.id.slice(-4)}`,
          isActive: u.isActive !== false,
        });
      }
    });
    return list;
  }, [officials, registeredUsers]);

  const liveMatches = useMemo(() => matches.filter(m => m.status === 'live' && !m.isBye && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB)), [matches]);
  const scheduledMatches = useMemo(() => matches.filter(m => m.status === 'scheduled' && !m.isBye && !(isPlaceholder(m.teamA) && isPlaceholder(m.teamB))), [matches]);
  const finishedMatches = useMemo(() => matches.filter(m => m.status === 'finished' && !m.isBye && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB)), [matches]);

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
  const conflictedMatches = useMemo(() => matches.filter(m => m.status !== 'finished' && m.conflictWarning), [matches]);

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
    setSelectedReassignScorer(prev => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
    // Close the modal if this was the last conflicted match
    const remaining = conflictedMatches.filter(m => m.id !== matchId);
    if (remaining.length === 0) {
      setShowConflictModal(false);
    }
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
        onTrigger: () => setActiveView('officials'),
        severity: 'warning',
      });

    const unassignedRef = matches.filter(m => m.status !== 'finished' && !m.referee);
    if (unassignedRef.length > 0)
      list.push({
        icon: <FlameIcon size={16} />,
        text: `${unassignedRef.length} match${unassignedRef.length > 1 ? 'es' : ''} without a referee.`,
        actionLabel: 'Assign Now',
        onTrigger: () => setActiveView('officials'),
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

    const conflicted = matches.filter(m => m.status !== 'finished' && m.conflictWarning);
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
          <img
            src={schoolLogo}
            alt="Asian College"
            style={{
              height: 46,
              width: 46,
              objectFit: 'cover',
              borderRadius: '50%',
              flexShrink: 0,
              border: '2px solid rgba(220, 38, 38, 0.25)',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
            }}
          />
          <img
            src={padulaTitleImg}
            alt="PADULA 2026"
            style={{
              height: 44,
              width: 'auto',
              maxWidth: '180px',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 3px 12px rgba(15, 35, 71, 0.35))',
            }}
          />
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
            <div className="brand-pill-tag" style={{ display: 'inline-block', fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Asian College Dumaguete
            </div>
            <h1 className="page-title" style={{ fontFamily: 'var(--font-sports)', fontStyle: 'italic', letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0, fontSize: '22px', lineHeight: 1.1 }}>
              Tournament Operations
            </h1>
            <p className="page-desc" style={{ marginTop: 3, fontSize: '12px', color: 'var(--text-muted)' }}>
              {isDirector
                ? `Sports Director: Mr. John Eric Samane · ${coordinatorCount} coordinator${coordinatorCount !== 1 ? 's' : ''} active`
                : 'Sports Coordinator · Operations overview'}
            </p>
          </div>
        </div>

        {/* Top page navigation shortcuts */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-primary" onClick={() => setActiveView('admin')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <HomeIcon size={14} /> Dashboard
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setActiveView('officials')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShieldIcon size={14} /> Officials Hub
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setActiveView('setup-wizard')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarIcon size={14} /> Setup Wizard
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Summary Cards ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          <StatCard icon={<LiveIcon size={18} color="#dc2626" />} label="Live Now" value={liveMatches.length} color="#dc2626" linkLabel="View Live" onClick={() => setActiveView('live')} />
          <StatCard icon={<ClockIcon size={18} color="#f59e0b" />} label="Upcoming Today" value={upcomingToday.length} color="#f59e0b" linkLabel="See Schedule" onClick={() => setActiveView('live')} />
          <StatCard icon={<CheckIcon size={18} color="#10b981" />} label="Finished Today" value={finishedToday.length} color="#10b981" />
          <StatCard icon={<UsersIcon size={18} color="#3b82f6" />} label="Total Teams" value={teams.filter(t => t.isActive !== false).length} color="#3b82f6" linkLabel="Manage Teams" onClick={() => setActiveView('registration')} />
          <StatCard icon={<MedalIcon size={18} color="#a78bfa" />} label="Total Players" value={activePlayers} color="#a78bfa" linkLabel="View Players" onClick={() => setActiveView('player')} />
          <StatCard icon={<ShieldIcon size={18} color="#38bdf8" />} label="Officials" value={officials.length} color="#38bdf8" linkLabel="Officials Hub" onClick={() => setActiveView('officials')} />
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
            <span>{Math.max(0, matches.length - finishedMatches.length)} remaining</span>
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
            {isDirector ? (
              <>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('setup-wizard')}>
                  <CalendarIcon size={15} /> Setup Wizard
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('officials')}>
                  <ShieldIcon size={15} /> Officials Hub
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('event-setup')}>
                  <PlusIcon size={15} /> Add Sport
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('event-setup')}>
                  <HomeIcon size={15} /> Add Venue
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('registration')}>
                  <ShieldIcon size={15} /> Add Coordinator
                </button>
                <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setShowAnnForm(v => !v)}>
                  <FileTextIcon size={15} /> Post Announcement
                </button>
                {matches.length > 0 && (
                  <button
                    className="btn btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    onClick={() => {
                      if (window.confirm('Remove all current matches? This allows you to test generating a new bracket from scratch.')) {
                        clearAllMatches();
                      }
                    }}
                    title="Clear all matches to test bracket registration from scratch"
                  >
                    <XIcon size={15} /> Remove Current Matches
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('registration')}>
                  <PlusIcon size={15} /> Register Player
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('registration')}>
                  <UsersIcon size={15} /> Register Team
                </button>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setActiveView('officials')}>
                  <ClipboardIcon size={15} /> Assign Scorer
                </button>
                <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setShowAnnForm(v => !v)}>
                  <FileTextIcon size={15} /> Post Announcement
                </button>
              </>
            )}
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
              {scheduledMatches.slice(0, 5).map(m => <LiveMatchCard key={m.id} match={m} onOpen={() => setActiveView('officials')} />)}
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
                  setActiveView('officials');
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
