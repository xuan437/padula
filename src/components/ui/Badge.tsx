// ============================================================
// ui/Badge.tsx — Shared status and role badge components
// Used across pages for consistency.
// ============================================================

/** Status badge for matches: live, scheduled, finished */
export function StatusBadge({ status }: { status: string }) {
  const cls = `status-badge ${status.toLowerCase()}`;
  const label = status === 'live'
    ? 'Live'
    : status === 'scheduled'
    ? 'Scheduled'
    : status === 'finished'
    ? 'Finished'
    : status;

  return (
    <span className={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      {status === 'live' && <span className="live-dot" />}
      {label}
    </span>
  );
}

/** Eligibility badge for players */
export function EligibilityBadge({ cleared }: { cleared: boolean }) {
  return cleared ? (
    <span style={{
      background: 'rgba(16,185,129,0.12)',
      border: '1px solid rgba(16,185,129,0.35)',
      color: '#059669',
      fontSize: '10.5px',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
    }}>
      ✓ Eligible
    </span>
  ) : (
    <span style={{
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#dc2626',
      fontSize: '10.5px',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
    }}>
      ✗ Pending
    </span>
  );
}

/** Role badge for users */
const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  director:    { bg: 'rgba(59,130,246,0.12)',  text: '#2563eb' },
  coordinator: { bg: 'rgba(245,158,11,0.12)',  text: '#b45309' },
  scorer:      { bg: 'rgba(16,185,129,0.12)',  text: '#059669' },
  player:      { bg: 'rgba(249,115,22,0.12)',  text: '#c2410c' },
  guest:       { bg: 'rgba(100,116,139,0.12)', text: '#475569' },
};

export function RoleBadge({ role }: { role: string }) {
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.guest;
  const labels: Record<string, string> = {
    director: 'Director', coordinator: 'Coordinator',
    scorer: 'Scorer', player: 'Player', guest: 'Guest',
  };
  return (
    <span style={{
      background: colors.bg,
      color: colors.text,
      fontSize: '10.5px',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
    }}>
      {labels[role] ?? role}
    </span>
  );
}

