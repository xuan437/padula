import React, { type ReactNode, useState, useEffect } from 'react';
import { getAllSports, type SportMeta, getSportIcon } from '../../lib/sports';

// ── 1. Breadcrumbs ────────────────────────────────────────────────────────────
export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <span style={{ opacity: 0.5 }}>/</span>}
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 11.5,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ) : (
              <span style={{ color: isLast ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isLast ? 700 : 600 }}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// ── 2. PageHeader (ONE unified header component across all pages) ─────────────
export interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  eyebrow,
  title,
  description,
  badge,
  actions,
}) => {
  const effectiveBreadcrumbs: BreadcrumbItem[] = breadcrumbs || (eyebrow ? [{ label: 'Padula 2026' }, { label: eyebrow }] : []);

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        flexWrap: 'wrap',
        paddingBottom: 18,
        marginBottom: 22,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ minWidth: 220, flex: 1 }}>
        {effectiveBreadcrumbs.length > 0 && <Breadcrumbs items={effectiveBreadcrumbs} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1
            className="padula-athletic-text"
            style={{
              fontSize: 26,
              fontWeight: 900,
              margin: 0,
              color: 'var(--text-primary)',
              letterSpacing: '0.02em',
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 680, lineHeight: 1.45 }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </header>
  );
};

// ── 3. StatCard (ONE unified stat-card component, semantic color only) ────────
export type SemanticTone = 'neutral' | 'live' | 'success' | 'warning' | 'info';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: SemanticTone;
  trend?: string;
  hint?: string;
  sparkline?: number[];
  onClick?: () => void;
  linkLabel?: string;
}

const TONE_MAP: Record<SemanticTone, { accent: string; bg: string; border: string }> = {
  neutral: { accent: 'var(--text-primary)', bg: 'var(--bg-elevated)', border: 'var(--border)' },
  live:    { accent: 'var(--color-live)',    bg: 'var(--badge-live-bg)',   border: 'var(--badge-live-border)' },
  success: { accent: 'var(--color-success)', bg: 'var(--badge-finish-bg)', border: 'var(--badge-finish-border)' },
  warning: { accent: 'var(--color-warning)', bg: 'var(--badge-sched-bg)',  border: 'var(--badge-sched-border)' },
  info:    { accent: 'var(--color-info)',    bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.28)' },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  tone = 'neutral',
  trend,
  hint,
  sparkline,
  onClick,
  linkLabel,
}) => {
  const palette = TONE_MAP[tone];
  const isZero = value === 0 || value === '0';

  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const max = Math.max(...sparkline, 1);
    const min = Math.min(...sparkline, 0);
    const range = Math.max(max - min, 1);
    const width = 64;
    const height = 22;
    const points = sparkline
      .map((val, idx) => {
        const x = (idx / (sparkline.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return (
      <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0 }}>
        <polyline
          fill="none"
          stroke={tone === 'neutral' ? 'var(--accent)' : palette.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className="glass-card"
      style={{
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        border: tone === 'live' ? `1px solid ${palette.border}` : '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 112,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          {label}
        </span>
        {icon && (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: palette.bg,
              border: `1px solid ${palette.border}`,
              color: tone === 'neutral' ? 'var(--text-secondary)' : palette.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            lineHeight: 1,
            color: tone === 'live' ? 'var(--color-live)' : 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {value}
        </div>
        {renderSparkline()}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 18 }}>
        {isZero && hint ? (
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>
            {hint}
          </span>
        ) : trend ? (
          <span style={{ fontSize: 11.5, color: tone === 'neutral' ? 'var(--text-secondary)' : palette.accent, fontWeight: 600 }}>
            {trend}
          </span>
        ) : (
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{hint || ''}</span>
        )}
        {onClick && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
            {linkLabel || 'View →'}
          </span>
        )}
      </div>
    </div>
  );
};

// ── 4. SportFilter (Unified multi-line sport filter bar matching design system) ───
export interface SportFilterProps {
  value: string; // 'ALL' or sport.id
  onChange: (sportId: string) => void;
  counts?: Record<string, number>;
  includeAll?: boolean;
  allLabel?: string;
  sports?: SportMeta[];
  label?: string;
  wrap?: boolean;
}

export const SportFilter: React.FC<SportFilterProps> = ({
  value,
  onChange,
  counts,
  includeAll = true,
  allLabel = 'All Sports',
  sports,
  label = 'FILTER SPORT:',
  wrap = true,
}) => {
  const [allSportsList, setAllSportsList] = useState<SportMeta[]>(() => sports || getAllSports());

  useEffect(() => {
    if (sports) {
      setAllSportsList(sports);
      return;
    }
    const update = () => setAllSportsList(getAllSports());
    window.addEventListener('padula_sports_updated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('padula_sports_updated', update);
      window.removeEventListener('storage', update);
    };
  }, [sports]);

  const activeSports = sports || allSportsList;

  const totalCount = counts
    ? Object.values(counts).reduce((acc, n) => acc + n, 0)
    : undefined;

  const normalizedVal = (value || 'ALL').toUpperCase();

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <div
        className="sport-filter-wrap no-scrollbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          overflowX: wrap ? 'visible' : 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '4px 0',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {label && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginRight: 2,
              whiteSpace: 'nowrap',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {label}
          </span>
        )}

        {includeAll && (
          <button
            type="button"
            onClick={() => onChange('ALL')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: (normalizedVal === 'ALL' || normalizedVal === '') ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: (normalizedVal === 'ALL' || normalizedVal === '') ? 'var(--accent)' : 'var(--bg-surface)',
              color: (normalizedVal === 'ALL' || normalizedVal === '') ? '#ffffff' : 'var(--text-primary)',
              boxShadow: (normalizedVal === 'ALL' || normalizedVal === '') ? '0 2px 6px -1px rgba(220, 38, 38, 0.4)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease',
              height: 34,
            }}
          >
            <span>{allLabel}</span>
            {totalCount !== undefined && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 6,
                  background: (normalizedVal === 'ALL' || normalizedVal === '') ? 'rgba(255,255,255,0.24)' : 'var(--bg-elevated)',
                  color: (normalizedVal === 'ALL' || normalizedVal === '') ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {totalCount}
              </span>
            )}
          </button>
        )}

        {activeSports.map((sp: SportMeta) => {
          const isSelected = normalizedVal === sp.id.toUpperCase() || normalizedVal === sp.name.toUpperCase();
          const count = counts ? (counts[sp.id] ?? counts[sp.name] ?? 0) : undefined;
          return (
            <button
              key={sp.id}
              type="button"
              onClick={() => onChange(sp.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: isSelected ? 700 : 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
                color: isSelected ? '#ffffff' : 'var(--text-primary)',
                boxShadow: isSelected ? '0 2px 6px -1px rgba(220, 38, 38, 0.4)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
                height: 34,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {getSportIcon(sp.id, 14, isSelected ? '#ffffff' : 'var(--text-secondary)')}
              </span>
              <span>{sp.name}</span>
              {count !== undefined && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 6,
                    background: isSelected ? 'rgba(255,255,255,0.24)' : 'var(--bg-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── 5. Badge (Semantic meaning only) ─────────────────────────────────────────
export interface BadgeProps {
  tone?: 'live' | 'success' | 'warning' | 'info' | 'neutral';
  children: ReactNode;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, pulse }) => {
  const styles: Record<string, React.CSSProperties> = {
    live:    { background: 'var(--badge-live-bg)',   color: 'var(--badge-live-text)',   border: '1px solid var(--badge-live-border)' },
    success: { background: 'var(--badge-finish-bg)', color: 'var(--badge-finish-text)', border: '1px solid var(--badge-finish-border)' },
    warning: { background: 'var(--badge-sched-bg)',  color: 'var(--badge-sched-text)',  border: '1px solid var(--badge-sched-border)' },
    info:    { background: 'rgba(59,130,246,0.14)',  color: '#60a5fa',                  border: '1px solid rgba(59,130,246,0.3)' },
    neutral: { background: 'var(--bg-elevated)',     color: 'var(--text-secondary)',    border: '1px solid var(--border)' },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.03em',
        ...styles[tone],
      }}
    >
      {pulse && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            animation: 'pulse-dot 1.4s infinite',
          }}
        />
      )}
      {children}
    </span>
  );
};

// ── 6. Tabs (Icon-based, no raw emoji required) ──────────────────────────────
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
}

export const Tabs: React.FC<{
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}> = ({ items, activeId, onChange }) => {
  return (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflowX: 'auto',
        padding: 4,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      {items.map(t => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              minHeight: 38,
            }}
          >
            {t.icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{t.icon}</span>}
            <span>{t.label}</span>
            {t.badge !== undefined && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: active ? 'rgba(255,255,255,0.22)' : 'var(--bg-elevated)',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── 7. ChartCard & EmptyState (Never render red 0-stubs on empty charts) ─────
export const EmptyState: React.FC<{
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}> = ({ icon, title, description, action, compact }) => (
  <div
    style={{
      padding: compact ? '24px 16px' : '40px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      background: 'var(--bg-elevated)',
      border: '1px dashed var(--border)',
      borderRadius: 12,
    }}
  >
    {icon && (
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
    )}
    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
    {description && (
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 420 }}>{description}</p>
    )}
    {action && <div style={{ marginTop: 6 }}>{action}</div>}
  </div>
);

export const ChartCard: React.FC<{
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: ReactNode;
}> = ({ title, subtitle, rightSlot, isEmpty, emptyTitle, emptyDescription, children }) => (
  <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {rightSlot}
    </div>
    {isEmpty ? (
      <EmptyState
        compact
        title={emptyTitle || 'No data recorded yet'}
        description={emptyDescription || 'Data will populate automatically once matches are scored or Demo Data is loaded.'}
      />
    ) : (
      <div>{children}</div>
    )}
  </div>
);

// ── 8. Drawer (Slide-over panel for Team Profile, Match Detail, Audit Row) ───
export const Drawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children: ReactNode;
}> = ({ open, onClose, title, subtitle, width = 540, children }) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 10, 20, 0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: width,
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ fontWeight: 700 }}
          >
            ✕ Close
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>{children}</div>
      </div>
    </div>
  );
};

// ── 9. Stepper (Coordinator workflow & First-time Setup Checklist) ───────────
export interface StepperItem {
  id: string;
  label: string;
  sublabel?: string;
  done?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export const Stepper: React.FC<{ steps: StepperItem[] }> = ({ steps }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${steps.length}, minmax(120px, 1fr))`,
      gap: 8,
      overflowX: 'auto',
    }}
  >
    {steps.map((s, idx) => (
      <button
        key={s.id}
        type="button"
        onClick={s.onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          border: s.active
            ? '1.5px solid var(--accent)'
            : s.done
            ? '1px solid rgba(16,185,129,0.35)'
            : '1px solid var(--border)',
          background: s.active
            ? 'var(--accent-light)'
            : s.done
            ? 'rgba(16,185,129,0.08)'
            : 'var(--bg-elevated)',
          cursor: s.onClick ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            flexShrink: 0,
            background: s.done ? '#10b981' : s.active ? 'var(--accent)' : 'var(--bg-surface)',
            color: s.done || s.active ? '#ffffff' : 'var(--text-muted)',
            border: s.done || s.active ? 'none' : '1px solid var(--border)',
          }}
        >
          {s.done ? '✓' : idx + 1}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.label}
          </div>
          {s.sublabel && (
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.sublabel}
            </div>
          )}
        </div>
      </button>
    ))}
  </div>
);

