import { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import type {
  SportsCompetitionSettings,
  SportId,
  TournamentFormat,
  TiebreakerRule,
  MatchSeriesOption,
  CoordinatorLockableField,
  CompetitionOverride,
  SeedingMode,
} from '../../../types/settings';
import {
  TrophyIcon,
  CalendarIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  LockIcon,
  UnlockIcon,
  ChevronRightIcon,
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
  { id: 'futsal', name: 'Futsal', category: 'Team Sport' },
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
  // Coordinators have full access to configure all sports (defaulting initial selection to their assigned sport if any)
  const allowedSports = ALL_SPORTS;
  const initialSport = useMemo<SportId>(() => {
    if (!coordinatorCompetitionId) return ALL_SPORTS[0].id;
    const matched = ALL_SPORTS.find(
      s => s.id === coordinatorCompetitionId || (coordinatorCompetitionId === 's1' && s.id === 'basketball')
    );
    return matched ? matched.id : ALL_SPORTS[0].id;
  }, [coordinatorCompetitionId]);

  const { matches } = useApp();
  const [selectedSportId, setSelectedSportId] = useState<SportId>(initialSport);
  const [showAdvancedLists, setShowAdvancedLists] = useState(false);

  const currentSportRule = settings.sports[selectedSportId];
  const isLocked = (_field: CoordinatorLockableField) => false;

  const activeOverride: CompetitionOverride =
    settings.competitionOverrides?.[selectedSportId] || {};

  const effectiveFormat: TournamentFormat =
    (isCoordinator && activeOverride.format) ||
    settings.competitionFormats[selectedSportId] ||
    currentSportRule.defaultTournamentFormat ||
    'single_elimination';

  const defaultSeriesOpt: MatchSeriesOption =
    currentSportRule.defaultSeries ||
    (currentSportRule.bestOf === 5 ? 'best_of_5' : currentSportRule.bestOf === 3 ? 'best_of_3' : 'single_game');

  const effectiveSeries = {
    groupStage: defaultSeriesOpt,
    quarterFinals: defaultSeriesOpt,
    semiFinals: defaultSeriesOpt,
    finals: defaultSeriesOpt,
    ...(currentSportRule.seriesByRound || {}),
    ...(isCoordinator ? activeOverride.seriesByRound || {} : {}),
  };

  const effectivePoints = {
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    ...(currentSportRule.pointSystem || {}),
    ...(isCoordinator ? activeOverride.pointSystem || {} : {}),
  };

  const effectiveAdvancing =
    (isCoordinator ? activeOverride.advancingTeamsCount : undefined) ??
    currentSportRule.advancingTeamsCount ??
    4;

  const effectiveSeeding: SeedingMode =
    (isCoordinator ? activeOverride.seedingMode : undefined) ??
    currentSportRule.seedingMode ??
    'seeded';

  const activeOrFinishedCount = useMemo(() => {
    return matches.filter(
      m =>
        (m.sport === selectedSportId || m.sport.toLowerCase().includes(selectedSportId)) &&
        (m.status === 'live' || m.status === 'finished')
    ).length;
  }, [matches, selectedSportId]);

  const confirmIfMatchesStarted = () => {
    if (activeOrFinishedCount === 0) return true;
    return window.confirm(
      `Warning: ${activeOrFinishedCount} match(es) in ${currentSportRule.sportName} are already in progress or finished. Changes will apply to upcoming matches only. Continue?`
    );
  };

  const updateCoordinatorOverride = (patch: Partial<CompetitionOverride>) => {
    if (!confirmIfMatchesStarted()) return;
    onChange({
      ...settings,
      competitionOverrides: {
        ...(settings.competitionOverrides || {}),
        [selectedSportId]: {
          ...activeOverride,
          ...patch,
          applyToUpcomingOnly: true,
        },
      },
    });
  };

  const resetCoordinatorOverride = () => {
    if (!confirmIfMatchesStarted()) return;
    const nextOverrides = { ...(settings.competitionOverrides || {}) };
    delete nextOverrides[selectedSportId];
    onChange({
      ...settings,
      competitionOverrides: nextOverrides,
    });
  };

  const toggleDirectorLock = (field: CoordinatorLockableField) => {
    const current = settings.coordinatorLockedFields || [];
    const next = current.includes(field)
      ? current.filter(f => f !== field)
      : [...current, field];
    onChange({
      ...settings,
      coordinatorLockedFields: next,
    });
  };

  const statusBadge = (field: keyof CompetitionOverride, lockKey?: CoordinatorLockableField) => {
    if (lockKey && isLocked(lockKey)) {
      return (
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle' }}>
          <LockIcon size={11} color="#38bdf8" /> Locked by Director
        </span>
      );
    }
    if (!isCoordinator) return null;
    const customized = activeOverride[field] !== undefined;
    return (
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '1px 6px',
        borderRadius: 999,
        marginLeft: 6,
        background: customized ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
        color: customized ? '#f59e0b' : '#10b981',
      }}>
        {customized ? 'Customized' : 'Default'}
      </span>
    );
  };

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
            <strong>Full Coordinator Customization Enabled:</strong> You can update rules, tournament formats, tiebreakers, series, and event parameters across all sports (currently viewing <strong>{ALL_SPORTS.find(s => s.id === selectedSportId)?.name || 'Basketball'}</strong>).
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {isCoordinator && Object.keys(activeOverride).length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={resetCoordinatorOverride}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}
              >
                <RefreshIcon size={12} /> Reset to Default
              </button>
            )}
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
        </div>

        {isCoordinator && activeOrFinishedCount > 0 && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#f59e0b',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <AlertTriangleIcon size={15} color="#f59e0b" />
            <span>
              {activeOrFinishedCount} match(es) already in progress or finished. Any settings changes apply to <strong>upcoming matches only</strong>.
            </span>
          </div>
        )}

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

          {/* Score Unit */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              SCORE UNIT LABEL
            </label>
            <input
              type="text"
              value={currentSportRule.unit}
              onChange={e => handleUpdateSport('unit', e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>

          {/* Max Points Per Period */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
              MAX SCORE CEILING PER PERIOD
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={currentSportRule.maxPointsPossiblePerPeriod}
              onChange={e => handleUpdateSport('maxPointsPossiblePerPeriod', parseInt(e.target.value, 10) || 50)}
              className="form-input"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Tournament Format, Series by Round & Tiebreakers */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              TOURNAMENT FORMAT {statusBadge('format', 'format')}
            </label>
            <select
              value={effectiveFormat}
              disabled={isLocked('format')}
              onChange={e => {
                const fmt = e.target.value as TournamentFormat;
                if (isCoordinator) updateCoordinatorOverride({ format: fmt });
                else handleUpdateFormat(fmt);
              }}
              className="form-input"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="single_elimination">Single Elimination (Knockout Bracket)</option>
              <option value="double_elimination">Double Elimination (Winners &amp; Losers Brackets)</option>
              <option value="round_robin">Round Robin (Every team plays each other)</option>
              <option value="point_system">Point System (Standings Based on Points)</option>
              <option value="combined_rr_elim">Combined: Round Robin → Elimination Round</option>
              <option value="combined_pts_elim">Combined: Point System → Elimination Round</option>
            </select>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Determines bracket generation and progression flow for {currentSportRule.sportName}.
            </span>

            {/* Progressive Disclosure: Advancing Teams for Combined Formats */}
            {(effectiveFormat === 'combined_rr_elim' || effectiveFormat === 'combined_pts_elim') && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  TEAMS ADVANCING TO ELIMINATION ROUND {statusBadge('advancingTeamsCount', 'advancingTeamsCount')}
                </label>
                <select
                  value={effectiveAdvancing}
                  disabled={isLocked('advancingTeamsCount')}
                  onChange={e => {
                    const n = parseInt(e.target.value, 10) || 4;
                    if (isCoordinator) updateCoordinatorOverride({ advancingTeamsCount: n });
                    else handleUpdateSport('advancingTeamsCount', n);
                  }}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12.5 }}
                >
                  <option value={2}>Top 2 Teams (Finals)</option>
                  <option value={4}>Top 4 Teams (Semi-Finals)</option>
                  <option value={8}>Top 8 Teams (Quarter-Finals)</option>
                </select>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Elimination Round only activates after group/point stage is reached.
                </span>
              </div>
            )}

            {/* Progressive Disclosure: Bracket Seeding & Byes for Elimination Formats */}
            {(effectiveFormat === 'single_elimination' || effectiveFormat === 'double_elimination' || effectiveFormat === 'combined_rr_elim' || effectiveFormat === 'combined_pts_elim') && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  BRACKET SEEDING MODE {statusBadge('seedingMode', 'seedingMode')}
                </label>
                <select
                  value={effectiveSeeding}
                  disabled={isLocked('seedingMode')}
                  onChange={e => {
                    const mode = e.target.value as SeedingMode;
                    if (isCoordinator) updateCoordinatorOverride({ seedingMode: mode });
                    else handleUpdateSport('seedingMode', mode);
                  }}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12.5 }}
                >
                  <option value="seeded">Seeded Auto-Bracket</option>
                  <option value="random">Random Draw Auto-Bracket</option>
                  <option value="manual">Manual Placement / Swap</option>
                </select>
              </div>
            )}
          </div>

          {/* Match Series Per Round */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              MATCH SERIES PER ROUND {statusBadge('seriesByRound', 'seriesByRound')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(
                [
                  { key: 'groupStage', label: 'Group Stage / Round 1' },
                  { key: 'quarterFinals', label: 'Quarter-Finals' },
                  { key: 'semiFinals', label: 'Semi-Finals' },
                  { key: 'finals', label: 'Finals' },
                ] as const
              ).map(round => (
                <div key={round.key}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 3 }}>
                    {round.label}
                  </label>
                  <select
                    value={effectiveSeries[round.key] || 'single_game'}
                    disabled={isLocked('seriesByRound')}
                    onChange={e => {
                      const nextSeries = { ...effectiveSeries, [round.key]: e.target.value as MatchSeriesOption };
                      if (isCoordinator) updateCoordinatorOverride({ seriesByRound: nextSeries });
                      else handleUpdateSport('seriesByRound', nextSeries);
                    }}
                    className="form-input"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12 }}
                  >
                    <option value="single_game">Single Game</option>
                    <option value="best_of_3">Best of 3</option>
                    <option value="best_of_5">Best of 5</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Progressive Disclosure: Point System (for Round Robin / Point System / Combined) */}
            {(effectiveFormat === 'round_robin' || effectiveFormat === 'point_system' || effectiveFormat === 'combined_rr_elim' || effectiveFormat === 'combined_pts_elim') && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  POINT SYSTEM (WIN / DRAW / LOSS) {statusBadge('pointSystem', 'pointSystem')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {(['winPoints', 'drawPoints', 'lossPoints'] as const).map(pk => (
                    <div key={pk}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
                        {pk === 'winPoints' ? 'Win' : pk === 'drawPoints' ? 'Draw' : 'Loss'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        disabled={isLocked('pointSystem')}
                        value={effectivePoints[pk]}
                        onChange={e => {
                          const nextPts = { ...effectivePoints, [pk]: parseInt(e.target.value, 10) || 0 };
                          if (isCoordinator) updateCoordinatorOverride({ pointSystem: nextPts });
                          else handleUpdateSport('pointSystem', nextPts);
                        }}
                        className="form-input"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 12.5 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              TIEBREAKER PRIORITY ORDER {statusBadge('tiebreakerOrder', 'tiebreakerOrder')}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {((isCoordinator && activeOverride.tiebreakerOrder) || currentSportRule.tiebreakerOrder).map((tb, idx, arr) => (
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
                    gap: '8px',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    #{idx + 1}. {TIEBREAKER_OPTIONS.find(o => o.id === tb)?.label || tb}
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      className="btn btn-xs btn-outline"
                      title="Move Up"
                      onClick={() => {
                        const next = [...arr];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        handleUpdateSport('tiebreakerOrder', next);
                        if (isCoordinator) updateCoordinatorOverride({ tiebreakerOrder: next });
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      className="btn btn-xs btn-outline"
                      title="Move Down"
                      onClick={() => {
                        const next = [...arr];
                        [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                        handleUpdateSport('tiebreakerOrder', next);
                        if (isCoordinator) updateCoordinatorOverride({ tiebreakerOrder: next });
                      }}
                    >
                      ↓
                    </button>
                    {arr.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        title="Remove Tiebreaker"
                        onClick={() => {
                          const next = arr.filter(x => x !== tb);
                          handleUpdateSport('tiebreakerOrder', next);
                          if (isCoordinator) updateCoordinatorOverride({ tiebreakerOrder: next });
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {TIEBREAKER_OPTIONS.filter(
                opt => !((isCoordinator && activeOverride.tiebreakerOrder) || currentSportRule.tiebreakerOrder).includes(opt.id)
              ).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {TIEBREAKER_OPTIONS.filter(
                    opt => !((isCoordinator && activeOverride.tiebreakerOrder) || currentSportRule.tiebreakerOrder).includes(opt.id)
                  ).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => {
                        const currentList = (isCoordinator && activeOverride.tiebreakerOrder) || currentSportRule.tiebreakerOrder;
                        const next = [...currentList, opt.id];
                        handleUpdateSport('tiebreakerOrder', next);
                        if (isCoordinator) updateCoordinatorOverride({ tiebreakerOrder: next });
                      }}
                    >
                      + {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Global Event & Season Setup (Director & Coordinator) ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <CalendarIcon size={18} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              Event &amp; Season Parameters
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
                SEASON TITLE
              </label>
              <input
                type="text"
                value={settings.eventSetup.seasonName}
                onChange={e => handleUpdateEvent('seasonName', e.target.value)}
                className="form-input"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                HOST CAMPUS
              </label>
              <input
                type="text"
                value={settings.eventSetup.hostCampus}
                onChange={e => handleUpdateEvent('hostCampus', e.target.value)}
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

          {/* Field Lock Controls */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                FIELD EDITABILITY &amp; PERMISSION LOCKS
              </label>
              {(settings.coordinatorLockedFields || []).length > 0 && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => onChange({ ...settings, coordinatorLockedFields: [] })}
                >
                  Unlock All Fields
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
              {(
                [
                  { id: 'format', label: 'Tournament Format' },
                  { id: 'seriesByRound', label: 'Match Series (Single / Best of 3 / Best of 5)' },
                  { id: 'pointSystem', label: 'Point System (Win / Draw / Loss)' },
                  { id: 'tiebreakerOrder', label: 'Tiebreakers' },
                  { id: 'advancingTeamsCount', label: 'Advancing Teams Count' },
                  { id: 'seedingMode', label: 'Bracket Seeding & Byes' },
                  { id: 'scheduleRules', label: 'Schedule & Period Rules' },
                ] as { id: CoordinatorLockableField; label: string }[]
              ).map(item => {
                const locked = (settings.coordinatorLockedFields || []).includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleDirectorLock(item.id)}
                    className={`btn btn-sm ${locked ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      fontSize: 11.5,
                      width: '100%',
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      whiteSpace: 'normal',
                      padding: '8px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                      {locked ? <LockIcon size={13} color="#ffffff" /> : <UnlockIcon size={13} color="var(--accent)" />}
                    </span>
                    <span>
                      <strong>{locked ? 'Locked' : 'Editable'}:</strong> {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progressive Disclosure: Master Dropdown Lists */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setShowAdvancedLists(p => !p)}
              style={{
                fontWeight: 700,
                padding: '8px 12px',
                width: '100%',
                maxWidth: '100%',
                justifyContent: 'flex-start',
                textAlign: 'left',
                whiteSpace: 'normal',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{
                display: 'inline-flex',
                flexShrink: 0,
                transform: showAdvancedLists ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}>
                <ChevronRightIcon size={14} />
              </span>
              <span>
                {showAdvancedLists
                  ? 'Hide Master Dropdown Lists (Venues, Departments, Divisions, Categories)'
                  : 'Show Master Dropdown Lists (Venues, Departments, Divisions, Categories)'}
              </span>
            </button>

            {showAdvancedLists && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {(
                  [
                    { key: 'venues', label: 'Venues' },
                    { key: 'departments', label: 'Departments' },
                    { key: 'divisions', label: 'Divisions' },
                    { key: 'categories', label: 'Categories' },
                  ] as const
                ).map(listDef => (
                  <div key={listDef.key} style={{ padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {listDef.label.toUpperCase()} ({settings.eventSetup[listDef.key].length})
                    </label>
                    <textarea
                      rows={4}
                      value={settings.eventSetup[listDef.key].join('\n')}
                      onChange={e =>
                        handleUpdateEvent(
                          listDef.key,
                          e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                        )
                      }
                      className="form-input"
                      placeholder={`One ${listDef.label.toLowerCase().slice(0, -1)} per line`}
                      style={{ width: '100%', fontSize: 11.5, padding: 8, borderRadius: 6 }}
                    />
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>One entry per line (used in registration dropdowns)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

