import { useState, useMemo } from 'react';
import type { SecuritySettings, RolePermissions } from '../../../types/settings';
import type { UserRole } from '../../../types';
import { useApp } from '../../../context/AppContext';
import {
  ShieldIcon,
  UsersIcon,
  LockIcon,
  TrophyIcon,
  FileTextIcon,
} from '../../../components/Icons';

interface Props {
  settings: SecuritySettings;
  onChange: (updated: SecuritySettings) => void;
}

const ROLES_ORDER: UserRole[] = ['director', 'coordinator', 'scorer', 'guest'];

export default function UsersSecuritySection({
  settings,
  onChange,
}: Props) {
  const { auditLogs, staff, registeredUsers, addAuditLog } = useApp();

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

  // All coordinators across staff + registeredUsers + built-in demo coordinator for testing
  const allCoordinators = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    staff.filter(s => s.role === 'coordinator').forEach(s => {
      map.set(s.id, { id: s.id, name: s.name, email: s.email });
    });
    registeredUsers.filter(u => u.role === 'coordinator').forEach(u => {
      if (!map.has(u.id)) {
        map.set(u.id, { id: u.id, name: u.name, email: u.email });
      }
    });
    if (!map.has('mock-coordinator')) {
      map.set('mock-coordinator', {
        id: 'mock-coordinator',
        name: 'Demo Coordinator',
        email: 'demo.coordinator@asiancollege.edu.ph',
      });
    }
    return Array.from(map.values());
  }, [staff, registeredUsers]);

  // Current active coordinators count
  const activeCoordinators = allCoordinators;

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
    addAuditLog('settings_update', 'Emergency Force Logout broadcasted across all active sessions');
    setTimeout(() => setForceLogoutTriggered(false), 4000);
  };

  const handleAddCoordinatorSlot = () => {
    const nextSlotNumber = settings.coordinators.length > 0
      ? Math.max(...settings.coordinators.map(c => c.slotNumber)) + 1
      : 1;
    onChange({
      ...settings,
      coordinators: [
        ...settings.coordinators,
        {
          slotNumber: nextSlotNumber,
          userId: undefined,
          assignedCompetitionId: `comp-${nextSlotNumber}`,
          assignedCompetitionName: 'All Sports / Unassigned Scope',
        },
      ],
    });
    addAuditLog('settings_update', `Added Coordinator Slot #${nextSlotNumber}`);
  };

  const handleRemoveCoordinatorSlot = (slotNumber: number) => {
    onChange({
      ...settings,
      coordinators: settings.coordinators.filter(c => c.slotNumber !== slotNumber),
    });
    addAuditLog('settings_update', `Removed Coordinator Slot #${slotNumber}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Coordinator Slots & Limit Enforcement ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UsersIcon size={18} color="var(--accent)" />
              Sports Coordinators Management
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Assign coordinators to competitions / tournament brackets with no account limit.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}>
              {activeCoordinators.length} Active Coordinators
            </span>
            <button
              type="button"
              onClick={handleAddCoordinatorSlot}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '11.5px', padding: '5px 12px' }}
            >
              + Add Coordinator Slot
            </button>
          </div>
        </div>

        {/* Dedicated Slots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {settings.coordinators.map(slot => {
            const assignedStaff = allCoordinators.find(s => s.id === slot.userId);
            return (
              <div
                key={slot.slotNumber}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: slot.userId ? '1px solid var(--accent)' : '1px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)' }}>
                    Slot #{slot.slotNumber}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    {settings.coordinators.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCoordinatorSlot(slot.slotNumber)}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                        title="Remove Coordinator Slot"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
                    Assigned Coordinator
                  </label>
                  <select
                    value={slot.userId || ''}
                    onChange={e => {
                      const nextUserId = e.target.value || undefined;
                      const nextSlots = settings.coordinators.map(c =>
                        c.slotNumber === slot.slotNumber ? { ...c, userId: nextUserId } : c
                      );
                      onChange({ ...settings, coordinators: nextSlots });
                    }}
                    className="form-input"
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontWeight: 600 }}
                  >
                    <option value="">— Unassigned Slot —</option>
                    {allCoordinators.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
                {assignedStaff && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {assignedStaff.email}
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
                    Assigned Competition / Scope
                  </label>
                  <input
                    type="text"
                    value={slot.assignedCompetitionName || ''}
                    onChange={e => {
                      const nextSlots = settings.coordinators.map(c =>
                        c.slotNumber === slot.slotNumber
                          ? { ...c, assignedCompetitionName: e.target.value }
                          : c
                      );
                      onChange({ ...settings, coordinators: nextSlots });
                    }}
                    placeholder="e.g. All Sports / Basketball"
                    className="form-input"
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                  />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrophyIcon size={13} color="#38bdf8" />
                  <span>{slot.assignedCompetitionName || 'Not assigned to sport'}</span>
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
              SCORER SPORT LIMIT RULE
            </label>
            <button
              type="button"
              onClick={() => onChange({ ...settings, oneSportPerScorer: !settings.oneSportPerScorer })}
              className={`btn ${settings.oneSportPerScorer ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700 }}
            >
              {settings.oneSportPerScorer ? '✓ One Sport Per Scorer (Enforced)' : 'Allow Multiple Sports Per Scorer'}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Blocks assigning a scorer to a second sport and scopes their dashboard to 1 sport.
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
                background: forceLogoutTriggered ? '#16a34a' : 'rgba(56, 189, 248, 0.15)',
                color: forceLogoutTriggered ? '#ffffff' : '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
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
                return (
                  <tr key={role} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 700, textTransform: 'capitalize' }}>
                      {role}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perms.canViewMatches}
                        onChange={e => handleUpdatePermission(role, 'canViewMatches', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perms.canEnterScores}
                        onChange={e => handleUpdatePermission(role, 'canEnterScores', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perms.canEditFinalScores}
                        onChange={e => handleUpdatePermission(role, 'canEditFinalScores', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perms.canApproveRosters}
                        onChange={e => handleUpdatePermission(role, 'canApproveRosters', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perms.canManageSchedules}
                        onChange={e => handleUpdatePermission(role, 'canManageSchedules', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perms.canManageUsers}
                        onChange={e => handleUpdatePermission(role, 'canManageUsers', e.target.checked)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
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
            <FileTextIcon size={14} /> Export Filtered Audit Trail (CSV)
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

