import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileTextIcon,
  SearchIcon,
} from '../components/Icons';
import type { AuditAction } from '../types';

const ACTION_COLORS: Record<AuditAction, string> = {
  login:              '#3b82f6',
  logout:             '#64748b',
  event_create:       '#10b981',
  event_update:       '#f59e0b',
  event_publish:      '#10b981',
  event_archive:      '#94a3b8',
  team_register:      '#3b82f6',
  player_register:    '#38bdf8',
  bracket_generate:   '#f97316',
  match_start:        '#f59e0b',
  score_update:       '#10b981',
  match_finish:       '#a78bfa',
  official_register:  '#fbbf24',
  official_assign:    '#f59e0b',
  announcement_post:  '#ec4899',
  department_add:     '#3b82f6',
  venue_add:          '#38bdf8',
  division_add:       '#a78bfa',
};

const ROLE_COLOR: Record<string, string> = {
  director:    '#ef4444',
  coordinator: '#3b82f6',
  scorer:      '#10b981',
  player:      '#f97316',
  guest:       '#64748b',
};

type LogFilter = 'all' | AuditAction;

export default function AuditLogPage() {
  const { auditLogs } = useApp();
  const [filterRole, setFilterRole] = useState('all');
  const [filterAction, setFilterAction] = useState<LogFilter>('all');
  const [search, setSearch] = useState('');
  const pageSize = 50;

  const filtered = auditLogs.filter(log => {
    if (filterRole !== 'all' && log.userRole !== filterRole) return false;
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (search && !log.details.toLowerCase().includes(search.toLowerCase()) && !log.userName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).slice(0, pageSize);

  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action)));

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Asian College Padula Athletics</div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-desc">Complete immutable record of all system events, authenticated logins, and score changes</p>
        </div>
        <div className="header-badge glass-card" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileTextIcon size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700 }}>{auditLogs.length} Total Logs</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: '2 1 220px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <SearchIcon size={14} />
          </div>
          <input
            className="form-input"
            placeholder="Search actions, users, details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13px' }}
          />
        </div>

        {/* Role filter */}
        <div style={{ flex: '1 1 140px' }}>
          <select className="form-input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ fontSize: '12.5px' }}>
            <option value="all">All Roles</option>
            <option value="director">Sports Director</option>
            <option value="coordinator">Sports Coordinator</option>
            <option value="scorer">Official Scorer</option>
            <option value="player">Student Athlete</option>
          </select>
        </div>

        {/* Action filter */}
        <div style={{ flex: '1 1 150px' }}>
          <select className="form-input" value={filterAction} onChange={e => setFilterAction(e.target.value as any)} style={{ fontSize: '12.5px' }}>
            <option value="all">All Actions</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Clear filter button */}
        {(filterRole !== 'all' || filterAction !== 'all' || search) && (
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => { setFilterRole('all'); setFilterAction('all'); setSearch(''); }}
            style={{ fontSize: '12px' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Log entries Table */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '170px 140px 160px 1fr 120px',
          padding: '12px 18px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          minWidth: '820px',
          alignItems: 'center',
        }}>
          <span>Timestamp</span>
          <span>Action</span>
          <span>Authenticated User</span>
          <span>Event Details</span>
          <span style={{ textAlign: 'right' }}>Role</span>
        </div>

        <div style={{ minWidth: '820px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No audit logs match your selected filter criteria.
            </div>
          ) : (
            filtered.map(log => {
              const color = ACTION_COLORS[log.action] ?? '#94a3b8';
              const roleColor = ROLE_COLOR[log.userRole] ?? '#94a3b8';
              const ts = new Date(log.timestamp);

              return (
                <div
                  key={log.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '170px 140px 160px 1fr 120px',
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--border-light)',
                    alignItems: 'center',
                    fontSize: '12.5px',
                    transition: 'background var(--transition)',
                  }}
                  className="table-row"
                >
                  {/* Timestamp */}
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <div>{ts.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{ts.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  </div>

                  {/* Action Badge */}
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color,
                      background: `${color}18`,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${color}35`,
                      display: 'inline-block',
                      textTransform: 'capitalize',
                    }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* User */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      border: `1.5px solid ${roleColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                    }}>
                      {log.userName[0] || 'U'}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.userName}
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                    {log.details}
                  </div>

                  {/* Role */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: roleColor,
                      background: `${roleColor}18`,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${roleColor}30`,
                      display: 'inline-block',
                    }}>
                      {log.userRole}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
