import { useState, useMemo } from 'react';
import type { SecuritySettings, RolePermissions } from '../../../types/settings';
import type { UserRole } from '../../../types';
import { useApp } from '../../../context/AppContext';
import {
  ShieldIcon,
  UsersIcon,
  LockIcon,
} from '../../../components/Icons';

interface Props {
  settings: SecuritySettings;
  onChange: (updated: SecuritySettings) => void;
}

const ROLES_ORDER: UserRole[] = ['director', 'coordinator', 'scorer', 'player', 'guest'];

export default function UsersSecuritySection({
  settings,
  onChange,
}: Props) {
  const { auditLogs, staff } = useApp();

  // Audit Log filters
  const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [forceLogoutTriggered, setForceLogoutTriggered] = useState(false);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch =
        log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.userName.toLowerCase().includes(auditSearch.toLowerCase());
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesRole = roleFilter === 'all' || log.userRole === roleFilter;
      return matchesSearch && matchesAction && matchesRole;
    }).slice(0, 50); // limit to recent 50
  }, [auditLogs, auditSearch, actionFilter, roleFilter]);

  // Current active coordinators count
  const activeCoordinators = staff.filter(s => s.role === 'coordinator' && s.status === 'active');
  const isLimitReached = activeCoordinators.length >= settings.maxCoordinators;

  const handleUpdatePermission = (
    role: UserRole,
    field: keyof RolePermissions,
    value: boolean
  ) => {
    onChange({
      ...settings,
      permissionsMatrix: {
        ...settings.permissionsMatrix,
        [role]: {
          ...settings.permissionsMatrix[role],
          [field]: value,
        },
      },
    });
  };

  const handleExportAuditCsv = () => {
    const headers = ['Timestamp', 'User Name', 'Role', 'Action', 'Details'];
    const rows = filteredAuditLogs.map(log => [
      `"${log.timestamp}"`,
      `"${log.userName}"`,
      `"${log.userRole}"`,
      `"${log.action}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `padula_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTriggerForceLogout = () => {
    setForceLogoutTriggered(true);
    onChange({
      ...settings,
      forceLogoutAllActiveSessions: true,
    });
    setTimeout(() => setForceLogoutTriggered(false), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Coordinator Slots & Limit Enforcement ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UsersIcon size={18} color="var(--accent)" />
              Sports Coordinators Management (Enforced Maximum: 3)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Each coordinator is assigned to exactly one competition / tournament bracket.
            </span>
          </div>

          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '12px',
            background: isLimitReached ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.12)',
            color: isLimitReached ? '#ef4444' : '#22c55e',
            border: isLimitReached ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
          }}>
            {activeCoordinators.length} of {settings.maxCoordinators} Slots Assigned
          </span>
        </div>

        {isLimitReached && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: '16px',
            fontSize: '12.5px',
            color: '#fca5a5',
            lineHeight: 1.4,
          }}>
            <strong>⚠️ Maximum Coordinator Limit Reached:</strong> The system strictly caps the institution at 3 simultaneous Sports Coordinators. To assign a new coordinator, an existing coordinator slot must be deactivated or re-assigned.
          </div>
        )}

        {/* 3 Dedicated Slots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {settings.coordinators.map(slot => {
            const assignedStaff = staff.find(s => s.id === slot.userId);
            return (
              <div
                key={slot.slotNumber}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: slot.userId ? '1px solid var(--accent)' : '1px dashed var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)' }}>
                    Slot #{slot.slotNumber}
                  </span>
                  <span style={{
                    fontSize: '10.5px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    background: slot.userId ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                    color: slot.userId ? '#22c55e' : 'var(--text-muted)',
                  }}>
                    {slot.userId ? 'Assigned' : 'Available'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>
                  {assignedStaff ? assignedStaff.name : 'Unassigned Coordinator'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {assignedStaff ? assignedStaff.email : 'Awaiting assignment'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>
                  🏆 {slot.assignedCompetitionName || 'Not assigned to sport'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Security, Domain & Session Controls ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <LockIcon size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            Institutional Access &amp; Session Inactivity Limits
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              ALLOWED EMAIL DOMAIN
            </label>
            <input
              type="text"
              value={settings.allowedEmailDomain}
              onChange={e => onChange({ ...settings, allowedEmailDomain: e.target.value })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Restricts Google Sign-In strictly to institutional accounts.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              STAFF SESSION TIMEOUT (MINUTES)
            </label>
            <input
              type="number"
              min={5}
              max={240}
              value={settings.sessionTimeoutMinutes}
              onChange={e => onChange({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value, 10) || 30 })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Auto-terminates idle sessions for Director and Coordinators.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              SCORER TIMEOUT (MINUTES)
            </label>
            <input
              type="number"
              min={30}
              max={300}
              value={settings.scorerSessionTimeoutMinutes}
              onChange={e => onChange({ ...settings, scorerSessionTimeoutMinutes: parseInt(e.target.value, 10) || 120 })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Extended grace window for official court scorers.
            </span>
          </div>

          {/* Force Logout Action */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              EMERGENCY ACCESS REVOCATION
            </label>
            <button
              type="button"
              onClick={handleTriggerForceLogout}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                background: forceLogoutTriggered ? '#16a34a' : 'rgba(239, 68, 68, 0.15)',
                color: forceLogoutTriggered ? '#ffffff' : '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {forceLogoutTriggered ? '✓ Force Logout Broadcasted' : 'Force Logout All Active Sessions'}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Immediately revokes tokens and kicks all non-director users.
            </span>
          </div>
        </div>
      </div>

      {/* ── Role Permissions Matrix Table ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldIcon size={18} color="var(--accent)" />
          Role Permissions Matrix
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Role</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>View Matches</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Enter Scores</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Edit Final Scores</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Approve Rosters</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Manage Schedule</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Manage Users</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Access Settings</th>
              </tr>
            </thead>
            <tbody>
              {ROLES_ORDER.map(role => {
                const perms = settings.permissionsMatrix[role];
                const isDirector = role === 'director';
                return (
                  <tr key={role} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 700, textTransform: 'capitalize' }}>
                      {role}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={isDirector}
                        checked={perms.canViewMatches}
                        onChange={e => handleUpdatePermission(role, 'canViewMatches', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={isDirector}
                        checked={perms.canEnterScores}
                        onChange={e => handleUpdatePermission(role, 'canEnterScores', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={isDirector}
                        checked={perms.canEditFinalScores}
                        onChange={e => handleUpdatePermission(role, 'canEditFinalScores', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={isDirector}
                        checked={perms.canApproveRosters}
                        onChange={e => handleUpdatePermission(role, 'canApproveRosters', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={isDirector}
                        checked={perms.canManageSchedules}
                        onChange={e => handleUpdatePermission(role, 'canManageSchedules', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={isDirector}
                        checked={perms.canManageUsers}
                        onChange={e => handleUpdatePermission(role, 'canManageUsers', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        disabled={isDirector}
                        checked={perms.canAccessSettings}
                        onChange={e => handleUpdatePermission(role, 'canAccessSettings', e.target.checked)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Audit Log Viewer with Filters & CSV Export ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
              Audit Log Viewer &amp; Traceability
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Live audit trail of administrative modifications and score entries.
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportAuditCsv}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            📥 Export Filtered Audit Trail (CSV)
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '7px 12px', fontSize: '12.5px' }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="form-input"
            style={{ padding: '7px 12px', fontSize: '12.5px' }}
          >
            <option value="all">All Roles</option>
            <option value="director">Director</option>
            <option value="coordinator">Coordinator</option>
            <option value="scorer">Scorer</option>
          </select>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="form-input"
            style={{ padding: '7px 12px', fontSize: '12.5px' }}
          >
            <option value="all">All Actions</option>
            <option value="settings_update">Settings Update</option>
            <option value="score_update">Score Update</option>
            <option value="login">Login</option>
            <option value="approve_access">Approve Access</option>
          </select>
        </div>

        {/* Log Entries */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredAuditLogs.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No audit logs matching current filter parameters.
            </div>
          ) : (
            filteredAuditLogs.map(log => (
              <div
                key={log.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                  }}>
                    {log.action}
                  </span>
                  <span style={{ fontWeight: 600 }}>{log.userName}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({log.userRole}):</span>
                  <span>{log.details}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

