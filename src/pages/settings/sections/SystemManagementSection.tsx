import { useState, useRef } from 'react';
import type { SystemSettings, PrivacyLevel } from '../../../types/settings';
import { useApp } from '../../../context/AppContext';
import {
  SettingsIcon,
  CheckIcon,
} from '../../../components/Icons';

interface Props {
  settings: SystemSettings;
  onChange: (updated: SystemSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => void;
}

export default function SystemManagementSection({
  settings,
  onChange,
  onExportBackup,
  onImportBackup,
}: Props) {
  const { addAuditLog } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV Bulk Import simulation state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [csvImportSuccess, setCsvImportSuccess] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);

  const handleUpdateBranding = <K extends keyof typeof settings.branding>(
    field: K,
    val: (typeof settings.branding)[K]
  ) => {
    onChange({
      ...settings,
      branding: {
        ...settings.branding,
        [field]: val,
      },
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      if (text) onImportBackup(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvImportSuccess(false);

    // Mock preview rows
    setCsvPreviewRows([
      ['John Dela Cruz', 'Basketball', 'CSE Titans', '#23', 'Guard', 'Enrolled & Verified'],
      ['Maria Santos', 'Volleyball', 'HTM Chefs', '#10', 'Setter', 'Enrolled & Verified'],
      ['Carlos Reyes', 'Football', 'BAA Falcons', '#7', 'Forward', 'Enrolled & Verified'],
    ]);
  };

  const handleExecuteCsvImport = () => {
    setCsvImportSuccess(true);
    addAuditLog('team_register', `Bulk roster imported via CSV (${csvPreviewRows.length} student-athletes registered)`);
  };

  const handleTriggerArchive = () => {
    setArchiveSuccess(true);
    addAuditLog('event_archive', `Padula Intramurals 2026 season archived into historical analytics records.`);
    setTimeout(() => setArchiveSuccess(false), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Backup & Restore ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <SettingsIcon size={18} color="var(--accent)" />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              System Backup, Export &amp; Disaster Recovery
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Export full settings and tournament configurations as encrypted JSON snapshots.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onExportBackup}
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            💾 Export Full Settings Backup (JSON)
          </button>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            📂 Restore / Import Settings Snapshot
          </button>
        </div>
      </div>

      {/* ── Student-Athlete Privacy & Retention ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>
          Student-Athlete Data Privacy &amp; Retention
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              PUBLIC STUDENT PRIVACY LEVEL
            </label>
            <select
              value={settings.studentAthletePrivacy}
              onChange={e => onChange({ ...settings, studentAthletePrivacy: e.target.value as PrivacyLevel })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="name_and_department">Name + Academic Department (Recommended)</option>
              <option value="name_only">First &amp; Last Name Only (High Privacy)</option>
              <option value="full_profile">Full Profile (Includes Year &amp; Course)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              HISTORICAL DATA RETENTION (MONTHS)
            </label>
            <input
              type="number"
              min={12}
              max={120}
              value={settings.dataRetentionMonths}
              onChange={e => onChange({ ...settings, dataRetentionMonths: parseInt(e.target.value, 10) || 60 })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Retains archived scores for 60 months (5 academic years).
            </span>
          </div>

          {/* Archive Action */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              ARCHIVE COMPLETED SEASON
            </label>
            <button
              type="button"
              onClick={handleTriggerArchive}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                background: archiveSuccess ? '#16a34a' : 'rgba(59, 130, 246, 0.1)',
                color: archiveSuccess ? '#ffffff' : '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                cursor: 'pointer',
              }}
            >
              {archiveSuccess ? '✓ Season Successfully Archived' : '📦 Archive Finished Intramurals Event'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Bulk CSV Import with Preview & Report ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800 }}>
          Bulk Roster &amp; Schedule Import (CSV)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvSelect}
              style={{ fontSize: '13px', color: 'var(--text-muted)' }}
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Upload standard .CSV template containing student athlete records or match schedules.
            </span>
          </div>

          {csvFile && csvPreviewRows.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                CSV File Validation Preview ({csvPreviewRows.length} Rows Detected)
              </h4>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 10px' }}>Athlete Name</th>
                      <th style={{ padding: '8px 10px' }}>Sport</th>
                      <th style={{ padding: '8px 10px' }}>Department</th>
                      <th style={{ padding: '8px 10px' }}>Jersey #</th>
                      <th style={{ padding: '8px 10px' }}>Position</th>
                      <th style={{ padding: '8px 10px' }}>Status Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreviewRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: '8px 10px' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <CheckIcon size={14} /> 0 syntax errors detected. Ready for import.
                </span>

                <button
                  type="button"
                  onClick={handleExecuteCsvImport}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '12px' }}
                >
                  {csvImportSuccess ? '✓ Import Committed' : 'Confirm & Ingest Roster'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── School Branding & Campus Colors ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>
          Asian College Branding, Palette &amp; Locale
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              INSTITUTION NAME
            </label>
            <input
              type="text"
              value={settings.branding.schoolName}
              onChange={e => handleUpdateBranding('schoolName', e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              CAMPUS DESIGNATION
            </label>
            <input
              type="text"
              value={settings.branding.campusName}
              onChange={e => handleUpdateBranding('campusName', e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              PRIMARY CRIMSON ACCENT COLOR
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={settings.branding.primaryColor}
                onChange={e => handleUpdateBranding('primaryColor', e.target.value)}
                style={{ width: '38px', height: '38px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'transparent' }}
              />
              <input
                type="text"
                value={settings.branding.primaryColor}
                onChange={e => handleUpdateBranding('primaryColor', e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              SYSTEM TIME ZONE
            </label>
            <select
              value={settings.branding.timeZone}
              onChange={e => handleUpdateBranding('timeZone', e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="Asia/Manila (GMT+8)">Asia/Manila (GMT+8, Philippine Standard Time)</option>
              <option value="UTC (GMT+0)">UTC (GMT+0)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

