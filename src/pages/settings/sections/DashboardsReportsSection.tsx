import type { DashboardSettings, ExportFormat, DefaultViewByRole, SportId } from '../../../types/settings';
import type { UserRole } from '../../../types';
import {
  BarChartIcon,
  CheckIcon,
} from '../../../components/Icons';

interface Props {
  settings: DashboardSettings;
  onChange: (updated: DashboardSettings) => void;
}

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'director', label: 'Sports Director' },
  { id: 'coordinator', label: 'Sports Coordinator' },
  { id: 'scorer', label: 'Official Scorer' },
  { id: 'guest', label: 'Public Guest' },
];

export default function DashboardsReportsSection({
  settings,
  onChange,
}: Props) {
  const handleUpdateRoleView = (role: UserRole, view: DefaultViewByRole) => {
    onChange({
      ...settings,
      defaultViews: {
        ...settings.defaultViews,
        [role]: view,
      },
    });
  };

  const handleToggleExportFormat = (fmt: ExportFormat) => {
    const exists = settings.enabledExportFormats.includes(fmt);
    const updated = exists
      ? settings.enabledExportFormats.filter(f => f !== fmt)
      : [...settings.enabledExportFormats, fmt];
    onChange({
      ...settings,
      enabledExportFormats: updated,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Default Dashboard Route per Role ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <BarChartIcon size={18} color="var(--accent)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              Initial Landing View per User Role
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Determines where each user lands upon successful authentication.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {ROLES.map(role => (
            <div key={role.id}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                {role.label.toUpperCase()} DEFAULT VIEW
              </label>
              <select
                value={settings.defaultViews[role.id]}
                onChange={e => handleUpdateRoleView(role.id, e.target.value as DefaultViewByRole)}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="admin">Director / Admin Console</option>
                <option value="scorekeeper">Scorer Desk Interface</option>
                <option value="live">Live Scoreboard</option>
                <option value="public">Public Analytics &amp; Standings</option>
                <option value="analytics">Analytics &amp; Leaderboards</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ── Default Filter & Chart Configuration ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>
          Default Filters &amp; Visual Chart Preferences
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              DEFAULT SPORT SELECTION
            </label>
            <select
              value={settings.defaultSportFilter}
              onChange={e => onChange({ ...settings, defaultSportFilter: e.target.value as SportId | 'all' })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="all">All Sports Combined</option>
              <option value="basketball">Basketball</option>
              <option value="volleyball">Volleyball</option>
              <option value="football">Football</option>
              <option value="mobilelegends">Mobile Legends</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              DEFAULT DATE RANGE FILTER
            </label>
            <select
              value={settings.defaultDateFilter}
              onChange={e => onChange({ ...settings, defaultDateFilter: e.target.value as any })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="today">Today's Active Fixtures</option>
              <option value="upcoming">Upcoming Matches This Week</option>
              <option value="all">Full Season Schedule</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              PRIMARY CHART STYLE
            </label>
            <select
              value={settings.chartTypePreference}
              onChange={e => onChange({ ...settings, chartTypePreference: e.target.value as any })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="bar">Bar Chart (Categorical Comparisons)</option>
              <option value="line">Line Trend (Progression over Rounds)</option>
              <option value="radar">Radar / Spider Chart (Multi-Attribute Skill)</option>
            </select>
          </div>
        </div>

        {/* Comparison Tools Toggles */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            ENABLE ANALYTICS COMPARISON MODES
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enablePlayerComparison}
                onChange={e => onChange({ ...settings, enablePlayerComparison: e.target.checked })}
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
              />
              <span><strong>Head-to-Head Player Comparison:</strong> Side-by-side PER, PPG, shooting accuracy stats.</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enableTeamComparison}
                onChange={e => onChange({ ...settings, enableTeamComparison: e.target.checked })}
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
              />
              <span><strong>Department vs Department Matchup Radar:</strong> Offense/defense metric comparisons.</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enableSeasonComparison}
                onChange={e => onChange({ ...settings, enableSeasonComparison: e.target.checked })}
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
              />
              <span><strong>Historical Season Trends:</strong> Compare Padula 2026 vs previous tournament records.</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Export Formats ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800 }}>
          Enabled Report Export Formats
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {(['pdf', 'excel', 'csv'] as ExportFormat[]).map(fmt => {
            const isEnabled = settings.enabledExportFormats.includes(fmt);
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => handleToggleExportFormat(fmt)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: isEnabled ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-elevated)',
                  color: isEnabled ? '#22c55e' : 'var(--text-muted)',
                  border: isEnabled ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isEnabled && <CheckIcon size={14} color="#22c55e" />}
                <span>{fmt === 'pdf' ? 'PDF Document' : fmt === 'excel' ? 'Excel Spreadsheet (.xlsx)' : 'Comma-Separated Values (.csv)'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

