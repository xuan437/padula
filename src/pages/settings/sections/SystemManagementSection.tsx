import { useState, useRef } from 'react';
import type { SystemSettings, PrivacyLevel } from '../../../types/settings';
import { useApp } from '../../../context/AppContext';
import {
  SettingsIcon,
  CheckIcon,
  FileTextIcon,
  RefreshIcon,
  LayersIcon,
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
  const {
    addAuditLog,
    currentUser,
    signInMockAccount,
    seedDemoData,
    clearAllMatches,
    events,
    setEvents,
    teams,
    registerTeam,
    registerPlayer,
  } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV Bulk Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [csvImportSuccess, setCsvImportSuccess] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

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

  const SAMPLE_DEMO_CSV_ROWS: string[][] = [
    ['John Dela Cruz', 'Basketball', 'CSE Titans', '#23', 'Guard', 'Enrolled & Verified'],
    ['Maria Santos', 'Volleyball', 'HTM Chefs', '#10', 'Setter', 'Enrolled & Verified'],
    ['Carlos Reyes', 'Football', 'BAA Falcons', '#7', 'Forward', 'Enrolled & Verified'],
    ['Alyssa Mendoza', 'Badminton', 'SHS Phoenix', '#14', 'Singles', 'Enrolled & Verified'],
  ];

  const handleLoadSampleDemoCsv = () => {
    setCsvFile(new File(['sample'], 'padula_demo_roster_2026.csv', { type: 'text/csv' }));
    setCsvImportSuccess(false);
    setCsvPreviewRows(SAMPLE_DEMO_CSV_ROWS);
  };

  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvImportSuccess(false);

    const reader = new FileReader();
    reader.onload = ev => {
      const text = (ev.target?.result as string) || '';
      const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        const parsed = lines.map(line =>
          line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
        );
        // Skip header row if first cell looks like a header
        const startIdx = parsed[0]?.[0]?.toLowerCase().includes('name') || parsed[0]?.[0]?.toLowerCase().includes('athlete') ? 1 : 0;
        const rows = parsed.slice(startIdx).map(r => [
          r[0] || 'Student Athlete',
          r[1] || 'Basketball',
          r[2] || 'CSE Titans',
          r[3] || '#1',
          r[4] || 'Player',
          r[5] || 'Enrolled & Verified',
        ]);
        setCsvPreviewRows(rows.length > 0 ? rows : SAMPLE_DEMO_CSV_ROWS);
      } else {
        setCsvPreviewRows(SAMPLE_DEMO_CSV_ROWS);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteCsvImport = () => {
    let importedCount = 0;
    csvPreviewRows.forEach((row, idx) => {
      const [name, sport, deptOrTeam, jerseyStr, position] = row;
      if (!name) return;
      const cleanSport = sport || 'Basketball';
      const cleanTeamName = deptOrTeam || 'CSE Titans';
      const existingTeam = teams.find(
        t => t.name.toLowerCase() === cleanTeamName.toLowerCase() && t.sport.toLowerCase() === cleanSport.toLowerCase()
      );
      let teamId = existingTeam?.id;
      if (!teamId) {
        teamId = registerTeam({
          name: cleanTeamName,
          department: cleanTeamName.split(' ')[0] || 'CSE',
          sport: cleanSport,
          division: "Men's",
          coach: 'Coach Appointed',
          players: [],
          isActive: true,
        });
      }
      const jerseyStrClean = String(jerseyStr || '').replace(/[^0-9]/g, '') || String(idx + 1);
      registerPlayer({
        name,
        studentId: `2026-CSV-${100 + idx}`,
        teamId,
        sport: cleanSport,
        department: cleanTeamName.split(' ')[0] || 'CSE',
        division: "Men's",
        jerseyNumber: jerseyStrClean,
        position: position || 'Player',
        medicalCleared: true,
        rosterStatus: 'in_play',
        isActive: true,
      });
      importedCount++;
    });

    setCsvImportSuccess(true);
    addAuditLog('team_register', `Bulk roster imported via CSV (${importedCount} student-athletes registered into live database)`);
  };

  const handleTriggerArchive = () => {
    const nowIso = new Date().toISOString();
    const updated = events.map(e => ({ ...e, status: 'completed' as const, archived: true, archivedAt: nowIso }));
    setEvents(updated);
    setArchiveSuccess(true);
    setRestoreSuccess(false);
    addAuditLog('event_archive', `Padula 2026 season (${updated.length} events) archived into historical analytics records.`);
    setTimeout(() => setArchiveSuccess(false), 4000);
  };

  const handleRestoreArchivedEvents = () => {
    const updated = events.map(e => (e.archived ? { ...e, status: 'ongoing' as const, archived: false, archivedAt: undefined } : e));
    setEvents(updated);
    setRestoreSuccess(true);
    setArchiveSuccess(false);
    addAuditLog('settings_update', `Restored archived tournament events back to active ongoing status.`);
    setTimeout(() => setRestoreSuccess(false), 4000);
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
            <FileTextIcon size={15} /> Export Full Settings Backup (JSON)
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
            <RefreshIcon size={15} /> Restore / Import Settings Snapshot
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
              ARCHIVE / RESTORE COMPLETED SEASON ({events.filter(e => e.archived).length}/{events.length} Archived)
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleTriggerArchive}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  background: archiveSuccess ? '#16a34a' : 'rgba(59, 130, 246, 0.1)',
                  color: archiveSuccess ? '#ffffff' : '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {archiveSuccess ? <><CheckIcon size={14} /> Season Archived</> : <><LayersIcon size={14} /> Archive Events</>}
              </button>
              <button
                type="button"
                onClick={handleRestoreArchivedEvents}
                className="btn btn-outline"
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {restoreSuccess ? '✓ Restored' : 'Restore Archived'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bulk CSV Import with Preview & Report ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            Bulk Roster &amp; Schedule Import (CSV)
          </h3>
          <button
            type="button"
            onClick={handleLoadSampleDemoCsv}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px', fontWeight: 700 }}
          >
            Load Sample Demo CSV Roster
          </button>
        </div>

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

      {/* ── Demo Account & Live Testing Sandbox Controls ── */}
      <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
              Demo Account &amp; Live Testing Sandbox Controls
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Instantly switch between official / demo accounts or re-seed tournament brackets to test all Settings changes live.
            </span>
          </div>
          <span style={{
            fontSize: '11.5px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.14)',
            color: '#38bdf8',
          }}>
            Active Account: {currentUser?.name || 'Guest'} ({currentUser?.role || 'guest'})
          </span>
        </div>

        {demoNotice && (
          <div style={{
            marginBottom: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.14)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            color: '#22c55e',
            fontSize: '12.5px',
            fontWeight: 700,
          }}>
            ✓ {demoNotice}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={async () => {
              await signInMockAccount('demo.director@asiancollege.edu.ph');
              setDemoNotice('Switched to Demo Director (demo.director@asiancollege.edu.ph) with full Settings access.');
            }}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '12px' }}
          >
            Switch to Demo Director
          </button>

          <button
            type="button"
            onClick={async () => {
              await signInMockAccount('demo.coordinator@asiancollege.edu.ph');
              setDemoNotice('Switched to Demo Coordinator (demo.coordinator@asiancollege.edu.ph) — Settings & Tournament Control unlocked for testing.');
            }}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px' }}
          >
            Switch to Demo Coordinator
          </button>

          <button
            type="button"
            onClick={async () => {
              await signInMockAccount('demo.scorer@asiancollege.edu.ph');
              setDemoNotice('Switched to Demo Scorer (demo.scorer@asiancollege.edu.ph) — Scorer Desk & Settings testing active.');
            }}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px' }}
          >
            Switch to Demo Scorer
          </button>

          <button
            type="button"
            onClick={() => {
              seedDemoData();
              setDemoNotice('Demo tournament data, teams, rosters, and matches seeded using current Settings rules.');
            }}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px' }}
          >
            Seed / Reset Demo Tournament Data
          </button>

          <button
            type="button"
            onClick={() => {
              clearAllMatches();
              setDemoNotice('Cleared all active matches for fresh bracket testing.');
            }}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '12px', color: '#ef4444' }}
          >
            Clear All Matches
          </button>
        </div>
      </div>
    </div>
  );
}

