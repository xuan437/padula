import { useState } from 'react';
import type { RosterRulesSettings, SportId } from '../../../types/settings';
import {
  UsersIcon,
  ShieldIcon,
} from '../../../components/Icons';

interface Props {
  settings: RosterRulesSettings;
  onChange: (updated: RosterRulesSettings) => void;
  isCoordinator: boolean;
}

const SPORT_NAMES: Record<SportId, string> = {
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  football: 'Football',
  sepaktakraw: 'Sepak Takraw',
  tabletennis: 'Table Tennis',
  badminton: 'Badminton',
  frisbee: 'Frisbee (Ultimate)',
  chess: 'Chess',
  scrabble: 'Scrabble',
  mobilelegends: 'Mobile Legends',
  dota2: 'DOTA 2',
  valorant: 'Valorant',
};

export default function RosterRulesSection({
  settings,
  onChange,
}: Props) {
  const [selectedSport, setSelectedSport] = useState<SportId>('basketball');

  const currentRule = settings.rosterPerSport[selectedSport];

  const handleUpdateRoster = <K extends keyof typeof currentRule>(
    field: K,
    val: (typeof currentRule)[K]
  ) => {
    onChange({
      ...settings,
      rosterPerSport: {
        ...settings.rosterPerSport,
        [selectedSport]: {
          ...currentRule,
          [field]: val,
        },
      },
    });
  };

  const handleUpdateJersey = <K extends keyof typeof settings.jerseyRules>(
    field: K,
    val: (typeof settings.jerseyRules)[K]
  ) => {
    onChange({
      ...settings,
      jerseyRules: {
        ...settings.jerseyRules,
        [field]: val,
      },
    });
  };

  const handleUpdateEligibility = <K extends keyof typeof settings.eligibility>(
    field: K,
    val: (typeof settings.eligibility)[K]
  ) => {
    onChange({
      ...settings,
      eligibility: {
        ...settings.eligibility,
        [field]: val,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Top Overview / General Roster Policies ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <UsersIcon size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
            Mandatory Coaching &amp; Staff Requirements
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              OFFICIAL HEAD COACH
            </label>
            <select
              value={settings.requireCoach ? 'required' : 'optional'}
              onChange={e => onChange({ ...settings, requireCoach: e.target.value === 'required' })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="required">Strictly Required per Team</option>
              <option value="optional">Optional / Team Captain Managed</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              OFFICIAL TEAM TRAINER / MEDIC
            </label>
            <select
              value={settings.requireTrainer ? 'required' : 'optional'}
              onChange={e => onChange({ ...settings, requireTrainer: e.target.value === 'required' })}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="required">Strictly Required per Team</option>
              <option value="optional">Optional / College Medical Standby</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              ALLOWED PLAYER STATUSES
            </label>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
              {settings.allowedPlayerStatuses.map(status => (
                <span
                  key={status}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: status === 'active' ? 'rgba(34,197,94,0.1)' : status === 'injured' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    color: status === 'active' ? '#22c55e' : status === 'injured' ? '#f59e0b' : '#ef4444',
                    border: '1px solid var(--border)',
                  }}
                >
                  {status}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Per-Sport Roster & Substitution Constraints ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
              Sport-Specific Roster Sizes &amp; Substitutions
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Configure minimum and maximum player capacity and in-game substitution allowances.
            </span>
          </div>

          {/* Sport dropdown selector */}
          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value as SportId)}
            className="form-input"
            style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, minWidth: '160px' }}
          >
            {(Object.keys(SPORT_NAMES) as SportId[]).map(id => (
              <option key={id} value={id}>
                {SPORT_NAMES[id]}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              MINIMUM ROSTER SIZE
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={currentRule.minPlayers}
              onChange={e => handleUpdateRoster('minPlayers', parseInt(e.target.value, 10) || 1)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              MAXIMUM ROSTER CAPACITY
            </label>
            <input
              type="number"
              min={1}
              max={35}
              value={currentRule.maxPlayers}
              onChange={e => handleUpdateRoster('maxPlayers', parseInt(e.target.value, 10) || 1)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              STARTING LINEUP SIZE
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={currentRule.minStarters}
              onChange={e => handleUpdateRoster('minStarters', parseInt(e.target.value, 10) || 1)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              MAX SUBS PER MATCH
            </label>
            <input
              type="number"
              min={0}
              max={99}
              value={currentRule.maxSubstitutionsPerGame}
              onChange={e => handleUpdateRoster('maxSubstitutionsPerGame', parseInt(e.target.value, 10) || 0)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Allowed Positions */}
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
            OFFICIAL REGISTERED POSITIONS FOR {SPORT_NAMES[selectedSport].toUpperCase()} ({currentRule.allowedPositions.length})
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {currentRule.allowedPositions.map((pos, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {pos}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Jersey Number & Student Eligibility ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Jersey Rules */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800 }}>
            Jersey Number Rules
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  MIN NUMBER
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={settings.jerseyRules.minNumber}
                  onChange={e => handleUpdateJersey('minNumber', parseInt(e.target.value, 10) || 0)}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  MAX NUMBER
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={settings.jerseyRules.maxNumber}
                  onChange={e => handleUpdateJersey('maxNumber', parseInt(e.target.value, 10) || 99)}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                DUPLICATE NUMBERS WITHIN TEAM
              </label>
              <select
                value={settings.jerseyRules.allowDuplicatesWithinTeam ? 'yes' : 'no'}
                onChange={e => handleUpdateJersey('allowDuplicatesWithinTeam', e.target.value === 'yes')}
                className="form-input"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="no">Strictly Disallowed (Unique per team)</option>
                <option value="yes">Allowed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Eligibility */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldIcon size={16} color="var(--accent)" />
            Student Eligibility Checklist
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.eligibility.requireEnrolledStudent}
                onChange={e => handleUpdateEligibility('requireEnrolledStudent', e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
              />
              <span>Must be currently enrolled Asian College student</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.eligibility.requireMedicalClearance}
                onChange={e => handleUpdateEligibility('requireMedicalClearance', e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
              />
              <span>Requires official Campus Clinic Medical Clearance</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.eligibility.requireSignedWaiver}
                onChange={e => handleUpdateEligibility('requireSignedWaiver', e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
              />
              <span>Requires signed Parent / Guardian Sports Waiver</span>
            </label>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
                  MIN GPA / GRADE
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={1.0}
                  max={4.0}
                  value={settings.eligibility.minGpa}
                  onChange={e => handleUpdateEligibility('minGpa', parseFloat(e.target.value) || 2.0)}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
                  MAX PLAYING YEARS
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={settings.eligibility.maxAcademicYearsEligible}
                  onChange={e => handleUpdateEligibility('maxAcademicYearsEligible', parseInt(e.target.value, 10) || 5)}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

