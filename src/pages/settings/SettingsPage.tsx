import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { AppSettings } from '../../types/settings';
import {
  getSettings,
  updateSettings,
  resetSettings,
  resetSection,
  exportSettings,
  importSettings,
} from '../../services/settingsService';
import {
  SettingsIcon,
  TrophyIcon,
  UsersIcon,
  BarChartIcon,
  ClipboardIcon,
  ShieldIcon,
  LiveIcon,
  CheckIcon,
  AlertTriangleIcon,
  XIcon,
} from '../../components/Icons';
import { PageHeader } from '../../components/ui';

// Section components
import SportsCompetitionSection from './sections/SportsCompetitionSection';
import RosterRulesSection from './sections/RosterRulesSection';
import StatsMetricsSection from './sections/StatsMetricsSection';
import ScoringEntrySection from './sections/ScoringEntrySection';
import UsersSecuritySection from './sections/UsersSecuritySection';
import DashboardsReportsSection from './sections/DashboardsReportsSection';
import PublicDisplaySection from './sections/PublicDisplaySection';
import SystemManagementSection from './sections/SystemManagementSection';

type SectionKey =
  | 'sportsCompetition'
  | 'rosterRules'
  | 'statsMetrics'
  | 'scoring'
  | 'security'
  | 'dashboards'
  | 'publicDisplay'
  | 'system';

interface TabDefinition {
  key: SectionKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  coordinatorAllowed: boolean;
  directorOnly: boolean;
}

const ALL_TABS: TabDefinition[] = [
  {
    key: 'sportsCompetition',
    label: '1. Sports & Competition Setup',
    shortLabel: 'Sports & Competition',
    icon: TrophyIcon,
    coordinatorAllowed: true,
    directorOnly: false,
  },
  {
    key: 'rosterRules',
    label: '2. Teams, Players & Roster Rules',
    shortLabel: 'Teams & Rosters',
    icon: UsersIcon,
    coordinatorAllowed: true,
    directorOnly: false,
  },
  {
    key: 'statsMetrics',
    label: '3. Statistics & Metrics',
    shortLabel: 'Stats & Metrics',
    icon: BarChartIcon,
    coordinatorAllowed: false,
    directorOnly: true,
  },
  {
    key: 'scoring',
    label: '4. Scoring & Data Entry',
    shortLabel: 'Scoring & Data Entry',
    icon: ClipboardIcon,
    coordinatorAllowed: true,
    directorOnly: false,
  },
  {
    key: 'security',
    label: '5. Users, Roles & Security',
    shortLabel: 'Users & Security',
    icon: ShieldIcon,
    coordinatorAllowed: false,
    directorOnly: true,
  },
  {
    key: 'dashboards',
    label: '6. Dashboards & Reports',
    shortLabel: 'Dashboards & Reports',
    icon: BarChartIcon,
    coordinatorAllowed: false,
    directorOnly: true,
  },
  {
    key: 'publicDisplay',
    label: '7. Public Display & Notifications',
    shortLabel: 'Public & Notifications',
    icon: LiveIcon,
    coordinatorAllowed: false,
    directorOnly: true,
  },
  {
    key: 'system',
    label: '8. System & Data Management',
    shortLabel: 'System & Branding',
    icon: SettingsIcon,
    coordinatorAllowed: false,
    directorOnly: true,
  },
];

export default function SettingsPage() {
  const { currentUser, setActiveView, addAuditLog } = useApp();

  // ── Access Rule & Role Guard ───────────────────────────────────────────────
  const isDirector = currentUser?.role === 'director';
  const isCoordinator = currentUser?.role === 'coordinator';
  const hasAccess = isDirector || isCoordinator;

  // Filter tabs by permission
  const allowedTabs = useMemo(() => {
    if (isDirector) return ALL_TABS;
    if (isCoordinator) return ALL_TABS.filter(t => t.coordinatorAllowed);
    return [];
  }, [isDirector, isCoordinator]);

  const [activeTab, setActiveTab] = useState<SectionKey>(allowedTabs[0]?.key || 'sportsCompetition');

  // Master local settings state (for unsaved changes detection)
  const [initialSettings, setInitialSettings] = useState<AppSettings>(() => getSettings());
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(() => getSettings());

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Unsaved changes detection
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(initialSettings) !== JSON.stringify(currentSettings);
  }, [initialSettings, currentSettings]);

  // Warn on page unload if changes are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Reset tab if user changes and activeTab is not allowed
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.some(t => t.key === activeTab)) {
      setActiveTab(allowedTabs[0].key);
    }
  }, [allowedTabs, activeTab]);

  // Auto dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = () => {
    try {
      const updated = updateSettings(currentSettings, currentUser?.name || 'Staff User');
      setInitialSettings(updated);
      setCurrentSettings(updated);
      addAuditLog('settings_update', `Settings updated for section "${activeTab}" by ${currentUser?.name || 'User'}`);
      setToast({ type: 'success', message: 'Settings successfully saved and persisted.' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to save settings.' });
    }
  };

  const handleResetSection = () => {
    if (!window.confirm(`Are you sure you want to reset "${ALL_TABS.find(t => t.key === activeTab)?.shortLabel}" to system defaults?`)) {
      return;
    }
    try {
      const reset = resetSection(activeTab, currentUser?.name || 'Staff User');
      setInitialSettings(reset);
      setCurrentSettings(reset);
      addAuditLog('settings_reset', `Section "${activeTab}" reset to defaults by ${currentUser?.name || 'User'}`);
      setToast({ type: 'success', message: `Reset "${ALL_TABS.find(t => t.key === activeTab)?.shortLabel}" to defaults.` });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to reset section.' });
    }
  };

  const handleResetAll = () => {
    if (!window.confirm('Are you sure you want to reset ALL 8 sections of settings to Asian College Padula defaults?')) {
      return;
    }
    try {
      const reset = resetSettings(currentUser?.name || 'Staff User');
      setInitialSettings(reset);
      setCurrentSettings(reset);
      addAuditLog('settings_reset', `All application settings reset to factory defaults by ${currentUser?.name || 'User'}`);
      setToast({ type: 'success', message: 'All settings reset to defaults.' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to reset settings.' });
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportSettings();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `padula_settings_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addAuditLog('settings_export', 'Exported settings backup file (JSON)');
  };

  const handleImportBackup = (jsonStr: string) => {
    const res = importSettings(jsonStr, currentUser?.name || 'JSON Import');
    if (res.success && res.settings) {
      setInitialSettings(res.settings);
      setCurrentSettings(res.settings);
      addAuditLog('settings_import', 'Restored settings snapshot from JSON file');
      setToast({ type: 'success', message: 'Settings successfully restored from backup file.' });
    } else {
      setToast({ type: 'error', message: res.error || 'Failed to import settings.' });
    }
  };

  // ── Blocked / Unauthorized Screen ──────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <ShieldIcon size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>
            Access Denied
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 24px' }}>
            The Tournament Settings console is restricted to the <strong>Sports Director</strong> and authorized <strong>Sports Coordinators</strong>. Official Scorers and guests do not have permission to modify system parameters.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveView(currentUser?.role === 'scorer' ? 'scorekeeper' : 'public')}
          >
            Return to Authorized Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="Tournament &amp; System Settings"
        description={
          isDirector
            ? 'Enterprise configuration console for sports, rosters, scoring rules, metrics, and security.'
            : `Coordinator Console: Authorized for ${currentUser?.assignedCompetitionId || 'assigned competition'} rules & scoring.`
        }
        badge={
          <span style={{
            fontSize: '11.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: '20px',
            background: isDirector ? 'rgba(220, 38, 38, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            color: isDirector ? '#ef4444' : '#3b82f6',
            border: isDirector ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
          }}>
            {isDirector ? 'Sports Director Access' : 'Sports Coordinator Access'}
          </span>
        }
      />

      {/* ── Unsaved Changes Warning Banner ── */}
      {hasUnsavedChanges && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.14)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#fbbf24' }}>
            <AlertTriangleIcon size={18} color="#f59e0b" />
            <span>
              <strong>Unsaved Changes Detected:</strong> You have modified settings that have not yet been committed to storage.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setCurrentSettings(initialSettings)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '12px' }}
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckIcon size={14} /> Save Changes Now
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Message ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 18px',
          borderRadius: '8px',
          background: toast.type === 'success' ? '#16a34a' : '#dc2626',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          {toast.type === 'success' ? <CheckIcon size={16} color="#fff" /> : <AlertTriangleIcon size={16} color="#fff" />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* ── Main Layout: Sidebar Tabs (Desktop) / Dropdown (Mobile) + Content ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)',
        gap: '24px',
        alignItems: 'start',
      }}
      className="settings-layout"
      >
        {/* Left Navigation Tabs */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '6px 12px 4px',
            }}>
              Settings Sections
            </div>

            {allowedTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '11px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-primary)',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={isActive ? '#ffffff' : 'var(--text-muted)'} />
                    <span>{tab.shortLabel}</span>
                  </span>
                  {tab.directorOnly && (
                    <span style={{
                      fontSize: '9.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(220,38,38,0.1)',
                      color: isActive ? '#ffffff' : '#ef4444',
                      fontWeight: 700,
                    }}>
                      Director
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Card */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Quick Actions
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '12.5px', padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <CheckIcon size={14} /> Save Current Settings
            </button>

            <button
              type="button"
              onClick={handleResetSection}
              className="btn btn-ghost"
              style={{ width: '100%', fontSize: '12px', padding: '8px', color: 'var(--text-muted)' }}
            >
              Reset This Section to Defaults
            </button>

            {isDirector && (
              <button
                type="button"
                onClick={handleResetAll}
                className="btn btn-ghost"
                style={{ width: '100%', fontSize: '11.5px', padding: '8px', color: '#ef4444' }}
              >
                Reset All 8 Sections
              </button>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Section Header Bar */}
          <div className="glass-card" style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h2 style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: 800 }}>
                {ALL_TABS.find(t => t.key === activeTab)?.label}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Last updated {new Date(currentSettings.lastUpdated).toLocaleDateString()} by {currentSettings.updatedBy}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleResetSection}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '12px' }}
              >
                Reset Section
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckIcon size={14} /> Save Section
              </button>
            </div>
          </div>

          {/* Section Dynamic Component */}
          {activeTab === 'sportsCompetition' && (
            <SportsCompetitionSection
              settings={currentSettings.sportsCompetition}
              onChange={updated => setCurrentSettings({ ...currentSettings, sportsCompetition: updated })}
              isCoordinator={isCoordinator}
              coordinatorCompetitionId={currentUser?.assignedCompetitionId}
            />
          )}

          {activeTab === 'rosterRules' && (
            <RosterRulesSection
              settings={currentSettings.rosterRules}
              onChange={updated => setCurrentSettings({ ...currentSettings, rosterRules: updated })}
              isCoordinator={isCoordinator}
            />
          )}

          {activeTab === 'statsMetrics' && (
            <StatsMetricsSection
              settings={currentSettings.statsMetrics}
              onChange={updated => setCurrentSettings({ ...currentSettings, statsMetrics: updated })}
            />
          )}

          {activeTab === 'scoring' && (
            <ScoringEntrySection
              settings={currentSettings.scoring}
              onChange={updated => setCurrentSettings({ ...currentSettings, scoring: updated })}
              isCoordinator={isCoordinator}
            />
          )}

          {activeTab === 'security' && (
            <UsersSecuritySection
              settings={currentSettings.security}
              onChange={updated => setCurrentSettings({ ...currentSettings, security: updated })}
            />
          )}

          {activeTab === 'dashboards' && (
            <DashboardsReportsSection
              settings={currentSettings.dashboards}
              onChange={updated => setCurrentSettings({ ...currentSettings, dashboards: updated })}
            />
          )}

          {activeTab === 'publicDisplay' && (
            <PublicDisplaySection
              settings={currentSettings.publicDisplay}
              onChange={updated => setCurrentSettings({ ...currentSettings, publicDisplay: updated })}
            />
          )}

          {activeTab === 'system' && (
            <SystemManagementSection
              settings={currentSettings.system}
              onChange={updated => setCurrentSettings({ ...currentSettings, system: updated })}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          )}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .settings-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

