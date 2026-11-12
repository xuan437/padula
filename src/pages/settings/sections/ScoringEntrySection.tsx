import { useState } from 'react';
import type { ScoringSettings, SportId, ScorerInputMode, ConflictResolutionStrategy, ResultCorrectionPermission } from '../../../types/settings';
import {
  ClipboardIcon,
  LockIcon,
} from '../../../components/Icons';

interface Props {
  settings: ScoringSettings;
  onChange: (updated: ScoringSettings) => void;
  isCoordinator: boolean;
}

const ALL_SPORTS: { id: SportId; name: string }[] = [
  { id: 'basketball', name: 'Basketball' },
  { id: 'volleyball', name: 'Volleyball' },
  { id: 'football', name: 'Football' },
  { id: 'sepaktakraw', name: 'Sepak Takraw' },
  { id: 'tabletennis', name: 'Table Tennis' },
  { id: 'badminton', name: 'Badminton' },
  { id: 'frisbee', name: 'Frisbee (Ultimate)' },
  { id: 'chess', name: 'Chess' },
  { id: 'scrabble', name: 'Scrabble' },
  { id: 'mobilelegends', name: 'Mobile Legends' },
  { id: 'dota2', name: 'DOTA 2' },
  { id: 'valorant', name: 'Valorant' },
];

export default function ScoringEntrySection({
  settings,
  onChange,
}: Props) {
  const [selectedSport, setSelectedSport] = useState<SportId>('basketball');

  const currentLimit = settings.scoreLimits[selectedSport];

  const handleUpdateLimit = <K extends keyof typeof currentLimit>(
    field: K,
    val: (typeof currentLimit)[K]
  ) => {
    onChange({
      ...settings,
      scoreLimits: {
        ...settings.scoreLimits,
        [selectedSport]: {
          ...currentLimit,
          [field]: val,
        },
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Mode & Correction Policies ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <ClipboardIcon size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            Scorer Input Mode &amp; Result Correction Protocol
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Default Input Mode */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              SCORER DESK DEFAULT MODE
            </label>
            <select
              value={settings.defaultInputMode}
              onChange={e => onChange({ ...settings, defaultInputMode: e.target.value as ScorerInputMode })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="live">Live Real-Time Scoring (Court-side Tablet)</option>
              <option value="post_game">Post-Game / Batch Result Submission</option>
            </select>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Official Scorers will default to this interface layout on match launch.
            </span>
          </div>

          {/* Correction Permissions */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              WHO CAN EDIT FINALIZED RESULTS?
            </label>
            <select
              value={settings.correctionPermission}
              onChange={e => onChange({ ...settings, correctionPermission: e.target.value as ResultCorrectionPermission })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="director_only">Sports Director Only (High Security)</option>
              <option value="director_and_coordinator">Sports Director &amp; Assigned Coordinator</option>
            </select>
          </div>

          {/* Auto-lock time */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              AUTO-LOCK FINAL RESULTS AFTER (MINUTES)
            </label>
            <input
              type="number"
              min={0}
              max={1440}
              value={settings.autoLockResultsAfterMinutes}
              onChange={e => onChange({ ...settings, autoLockResultsAfterMinutes: parseInt(e.target.value, 10) || 0 })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              0 to disable auto-lock. (e.g. 60 min locks matches after completion).
            </span>
          </div>
        </div>

        {/* Checkbox Options */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.requireCorrectionReason}
              onChange={e => onChange({ ...settings, requireCorrectionReason: e.target.checked })}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <span>
              <strong>Mandatory Justification:</strong> Require official written reason for every score correction or dispute resolution in the audit log.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.allowPerGameScorerAssignment}
              onChange={e => onChange({ ...settings, allowPerGameScorerAssignment: e.target.checked })}
              style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
            />
            <span>
              <strong>Dynamic Scorer Delegation:</strong> Allow appointing different certified Official Scorers per individual match or sport.
            </span>
          </label>
        </div>
      </div>

      {/* ── Offline Device Mode & Conflict Handling ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <LockIcon size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            Offline Court-side Resilience &amp; Sync Strategy
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              OFFLINE SCORER MODE
            </label>
            <select
              value={settings.enableOfflineMode ? 'enabled' : 'disabled'}
              onChange={e => onChange({ ...settings, enableOfflineMode: e.target.value === 'enabled' })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="enabled">Enabled (Cache local scores in IndexedDB/Storage)</option>
              <option value="disabled">Disabled (Strict live internet connection required)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              SYNC PULSE INTERVAL (SECONDS)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={settings.offlineSyncIntervalSeconds}
              onChange={e => onChange({ ...settings, offlineSyncIntervalSeconds: parseInt(e.target.value, 10) || 15 })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              CONFLICT RESOLUTION STRATEGY
            </label>
            <select
              value={settings.conflictStrategy}
              onChange={e => onChange({ ...settings, conflictStrategy: e.target.value as ConflictResolutionStrategy })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="server_wins">Server Wins (Latest Central DB Record Prevails)</option>
              <option value="client_wins">Scorer Device Wins (Court-side Scorekeeper Overrides)</option>
              <option value="manual_review">Manual Flagging &amp; Director Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Input Validation & Anomaly Guardrails ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
              Entry Validation Rules (Rejects Impossible Input)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Prevents typos by rejecting scores that exceed physical or regulatory limits.
            </span>
          </div>

          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value as SportId)}
            className="form-input"
            style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
          >
            {ALL_SPORTS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              MAX SCORE PER SINGLE PERIOD
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={currentLimit.maxScorePerPeriod}
              onChange={e => handleUpdateLimit('maxScorePerPeriod', parseInt(e.target.value, 10) || 50)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Flags entries exceeding this ceiling in a single quarter/set.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              MAX AGGREGATE MATCH SCORE
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={currentLimit.maxTotalScore}
              onChange={e => handleUpdateLimit('maxTotalScore', parseInt(e.target.value, 10) || 150)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Absolute total points cap allowed for a full match.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              ARE DRAWS / TIES ACCEPTABLE?
            </label>
            <select
              value={currentLimit.allowDraws ? 'yes' : 'no'}
              onChange={e => handleUpdateLimit('allowDraws', e.target.value === 'yes')}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="no">Disallowed (Must proceed to overtime / tiebreak)</option>
              <option value="yes">Allowed (e.g. Football or Chess draws)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

