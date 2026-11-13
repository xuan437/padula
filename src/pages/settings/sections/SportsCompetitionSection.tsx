import { useState, useMemo } from 'react';
import type { SportsCompetitionSettings, SportId, TournamentFormat, TiebreakerRule } from '../../../types/settings';
import {
  TrophyIcon,
  CalendarIcon,
  CheckIcon,
} from '../../../components/Icons';

interface Props {
  settings: SportsCompetitionSettings;
  onChange: (updated: SportsCompetitionSettings) => void;
  isCoordinator: boolean;
  coordinatorCompetitionId?: string;
}

const ALL_SPORTS: { id: SportId; name: string; category: string }[] = [
  { id: 'basketball', name: 'Basketball', category: 'Team Sport' },
  { id: 'volleyball', name: 'Volleyball', category: 'Team Sport' },
  { id: 'football', name: 'Football', category: 'Team Sport' },
  { id: 'sepaktakraw', name: 'Sepak Takraw', category: 'Team Sport' },
  { id: 'tabletennis', name: 'Table Tennis', category: 'Individual Sport' },
  { id: 'badminton', name: 'Badminton', category: 'Individual Sport' },
  { id: 'frisbee', name: 'Frisbee (Ultimate)', category: 'Team Sport' },
  { id: 'chess', name: 'Chess', category: 'Board Sport' },
  { id: 'scrabble', name: 'Scrabble', category: 'Board Sport' },
  { id: 'mobilelegends', name: 'Mobile Legends: Bang Bang', category: 'Esport' },
  { id: 'dota2', name: 'DOTA 2', category: 'Esport' },
  { id: 'valorant', name: 'Valorant', category: 'Esport' },
];

const TIEBREAKER_OPTIONS: { id: TiebreakerRule; label: string }[] = [
  { id: 'head_to_head', label: 'Head-to-Head Result' },
  { id: 'point_differential', label: 'Point / Goal Differential' },
  { id: 'total_points_scored', label: 'Total Points / Score Accumulated' },
  { id: 'buchholz', label: 'Buchholz System (Chess / Swiss)' },
  { id: 'coin_toss', label: 'Official Coin Toss' },
];

export default function SportsCompetitionSection({
  settings,
  onChange,
  isCoordinator,
  coordinatorCompetitionId,
}: Props) {
  // If coordinator, filter to their assigned sport or default to basketball
  const allowedSports = useMemo(() => {
    if (!isCoordinator || !coordinatorCompetitionId) return ALL_SPORTS;
    const matched = ALL_SPORTS.filter(
      s => s.id === coordinatorCompetitionId || (coordinatorCompetitionId === 's1' && s.id === 'basketball')
    );
    return matched.length > 0 ? matched : [ALL_SPORTS[0]];
  }, [isCoordinator, coordinatorCompetitionId]);

  const [selectedSportId, setSelectedSportId] = useState<SportId>(allowedSports[0].id);

  const currentSportRule = settings.sports[selectedSportId];

  const handleUpdateSport = <K extends keyof typeof currentSportRule>(
    field: K,
    val: (typeof currentSportRule)[K]
  ) => {
    const updated = {
      ...settings,
      sports: {
        ...settings.sports,
        [selectedSportId]: {
          ...currentSportRule,
          [field]: val,
        },
      },
    };
    onChange(updated);
  };

  const handleUpdateFormat = (format: TournamentFormat) => {
    const updated = {
      ...settings,
      competitionFormats: {
        ...settings.competitionFormats,
        [selectedSportId]: format,
      },
    };
    onChange(updated);
  };

  const handleUpdateEvent = <K extends keyof typeof settings.eventSetup>(
    field: K,
    val: (typeof settings.eventSetup)[K]
  ) => {
    const updated = {
      ...settings,
      eventSetup: {
        ...settings.eventSetup,
        [field]: val,
      },
    };
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Coordinator Scope Notification */}
      {isCoordinator && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12.5px',
          color: '#93c5fd',
        }}>
          <CheckIcon size={16} color="#3b82f6" />
          <span>
            <strong>Coordinator Scope:</strong> You have permission to configure rules and scoring for your assigned competition (<strong>{ALL_SPORTS.find(s => s.id === selectedSportId)?.name || 'Basketball'}</strong>).
          </span>
        </div>
      )}

      {/* ── Sport Selector Pills ── */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Select Sport to Configure ({allowedSports.length} Available)
        </label>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {allowedSports.map(s => {
            const isSelected = s.id === selectedSportId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSportId(s.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{s.name}</span>
                <span style={{
                  fontSize: '10px',
                  opacity: 0.8,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                }}>
                  {s.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Sport Rules Card ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrophyIcon size={18} color="var(--accent)" />
              {currentSportRule.sportName} — Scoring & Period Rules
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Category: {currentSportRule.category.toUpperCase()} · Score Unit: {currentSportRule.unit}
            </span>
          </div>
          <span style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#22c55e',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            fontWeight: 700,
          }}>
            Active Sport
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Period Type */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              PERIOD STRUCTURE
            </label>
            <select
              value={currentSportRule.periodType}
              onChange={e => handleUpdateSport('periodType', e.target.value as any)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="quarters">Quarters (e.g. Basketball)</option>
              <option value="sets">Sets (e.g. Volleyball, Sepak Takraw)</option>
              <option value="halves">Halves (e.g. Football, Frisbee)</option>
              <option value="games">Games / Matches (e.g. Esports, Table Tennis)</option>
              <option value="rounds">Rounds (e.g. Chess, Scrabble)</option>
            </select>
          </div>

          {/* Number of Periods */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              STANDARD PERIOD COUNT
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={currentSportRule.periodCount}
              onChange={e => handleUpdateSport('periodCount', parseInt(e.target.value, 10) || 1)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          {/* Period Duration */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              PERIOD DURATION (MINUTES)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={currentSportRule.periodDurationMinutes}
              onChange={e => handleUpdateSport('periodDurationMinutes', parseInt(e.target.value, 10) || 10)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          {/* Best-Of Series */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              MATCH SERIES FORMAT
            </label>
            <select
              value={currentSportRule.bestOf}
              onChange={e => handleUpdateSport('bestOf', parseInt(e.target.value, 10) || 1)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value={1}>Single Game (Best of 1)</option>
              <option value={3}>Best of 3</option>
              <option value={5}>Best of 5</option>
              <option value={7}>Best of 7 (Grand Finals)</option>
            </select>
          </div>

          {/* Target Score to Win */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              TARGET WIN SCORE (OPTIONAL)
            </label>
            <input
              type="number"
              value={currentSportRule.targetScoreToWin ?? ''}
              onChange={e => handleUpdateSport('targetScoreToWin', e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          {/* Win by Two Points */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              DEUCE / WIN BY 2
            </label>
            <select
              value={currentSportRule.winByTwo ? 'yes' : 'no'}
              onChange={e => handleUpdateSport('winByTwo', e.target.value === 'yes')}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            >
              <option value="no">Disabled (First to target wins)</option>
              <option value="yes">Enabled (Must win by 2 points lead)</option>
            </select>
          </div>
        </div>

        {/* Tournament Format & Tiebreakers */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              TOURNAMENT FORMAT
            </label>
            <select
              value={settings.competitionFormats[selectedSportId] || 'single_elimination'}
              onChange={e => handleUpdateFormat(e.target.value as TournamentFormat)}
              className="form-input"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="single_elimination">Single Elimination (Knockout Bracket)</option>
              <option value="double_elimination">Double Elimination (Upper & Lower Brackets)</option>
              <option value="round_robin">Round Robin (Every team plays each other)</option>
              <option value="pool_play_knockout">Pool Play + Knockout (Groups into Semi-Finals)</option>
            </select>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Determines bracket generation and progression flow for {currentSportRule.sportName}.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              TIEBREAKER PRIORITY ORDER
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentSportRule.tiebreakerOrder.map((tb, idx) => (
                <div
                  key={tb}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    #{idx + 1}. {TIEBREAKER_OPTIONS.find(o => o.id === tb)?.label || tb}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Priority Level {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Global Event & Season Setup (Director Only) ── */}
      {!isCoordinator && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <CalendarIcon size={18} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              Event &amp; Season Parameters
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                EVENT / TOURNAMENT NAME
              </label>
              <input
                type="text"
                value={settings.eventSetup.eventName}
                onChange={e => handleUpdateEvent('eventName', e.target.value)}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                ACADEMIC YEAR
              </label>
              <input
                type="text"
                value={settings.eventSetup.academicYear}
                onChange={e => handleUpdateEvent('academicYear', e.target.value)}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                START DATE
              </label>
              <input
                type="date"
                value={settings.eventSetup.startDate}
                onChange={e => handleUpdateEvent('startDate', e.target.value)}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                END DATE
              </label>
              <input
                type="date"
                value={settings.eventSetup.endDate}
                onChange={e => handleUpdateEvent('endDate', e.target.value)}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Venues Preview */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              OFFICIATING VENUES ({settings.eventSetup.venues.length})
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {settings.eventSetup.venues.map((venue, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11.5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  📍 {venue}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

