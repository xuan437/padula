// ============================================================
// ui/EmptyState.tsx — Shared empty-state display block
// Used when a list or table has no data to show.
// ============================================================

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '52px 24px',
      textAlign: 'center',
      gap: '10px',
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: '36px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-secondary)' }}>{title}</div>
      {description && (
        <div style={{ fontSize: '13px', maxWidth: '340px', lineHeight: 1.5 }}>{description}</div>
      )}
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
}

