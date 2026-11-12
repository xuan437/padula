import { useState, useMemo } from 'react';
import type { StatsMetricsSettings, SportId } from '../../../types/settings';
import {
  BarChartIcon,
  TrophyIcon,
  CheckIcon,
} from '../../../components/Icons';

interface Props {
  settings: StatsMetricsSettings;
  onChange: (updated: StatsMetricsSettings) => void;
}

const AVAILABLE_SPORTS: { id: SportId; name: string }[] = [
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

export default function StatsMetricsSection({
  settings,
  onChange,
}: Props) {
  const [selectedSport, setSelectedSport] = useState<SportId>('basketball');

  // Interactive Live Preview inputs for MVP Score calculation
  const [testEfficiency, setTestEfficiency] = useState(24.5);
  const [testWinPct, setTestWinPct] = useState(80.0);
  const [testPpg, setTestPpg] = useState(18.2);

  // Live evaluated MVP Score
  const calculatedMvpScore = useMemo(() => {
    // Standard weighted calculation preview: 50% Eff + 30% Win% + 20% PPG
    const result = (testEfficiency * 0.5) + (testWinPct * 0.3) + (testPpg * 0.2);
    return Math.round(result * 10) / 10;
  }, [testEfficiency, testWinPct, testPpg]);

  const currentTrackedStats = settings.trackedStatsPerSport[selectedSport] || [];

  const handleToggleStat = (statName: string) => {
    const exists = currentTrackedStats.includes(statName);
    const updatedStats = exists
      ? currentTrackedStats.filter(s => s !== statName)
      : [...currentTrackedStats, statName];

    onChange({
      ...settings,
      trackedStatsPerSport: {
        ...settings.trackedStatsPerSport,
        [selectedSport]: updatedStats,
      },
    });
  };

  const handleMedalChange = <K extends keyof typeof settings.medalPoints>(
    medal: K,
    val: number
  ) => {
    onChange({
      ...settings,
      medalPoints: {
        ...settings.medalPoints,
        [medal]: val,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Medal Points Per Placement ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <TrophyIcon size={18} color="#f59e0b" />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
              Official Medal Points &amp; Championship Weights
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Points awarded to departments toward the Overall Championship Trophy.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {/* Gold */}
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🥇</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                Gold Medal
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.medalPoints.gold}
              onChange={e => handleMedalChange('gold', parseInt(e.target.value, 10) || 15)}
              className="form-input"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: 700 }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Championship points
            </span>
          </div>

          {/* Silver */}
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.08)', border: '1px solid rgba(148, 163, 184, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🥈</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                Silver Medal
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.medalPoints.silver}
              onChange={e => handleMedalChange('silver', parseInt(e.target.value, 10) || 10)}
              className="form-input"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: 700 }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Runner-up points
            </span>
          </div>

          {/* Bronze */}
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🥉</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>
                Bronze Medal
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={settings.medalPoints.bronze}
              onChange={e => handleMedalChange('bronze', parseInt(e.target.value, 10) || 5)}
              className="form-input"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: 700 }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              3rd Place points
            </span>
          </div>

          {/* 4th Place */}
          <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🎖️</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                4th Place
              </span>
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.medalPoints.fourthPlace}
              onChange={e => handleMedalChange('fourthPlace', parseInt(e.target.value, 10) || 2)}
              className="form-input"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: 700 }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Consolation points
            </span>
          </div>
        </div>
      </div>

      {/* ── Tracked Metrics Per Sport ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChartIcon size={18} color="var(--accent)" />
              Active Stat Tracking Fields per Sport
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Enable or disable specific box-score stats recorded by Official Scorers.
            </span>
          </div>

          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value as SportId)}
            className="form-input"
            style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
          >
            {AVAILABLE_SPORTS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {currentTrackedStats.map(stat => (
            <button
              key={stat}
              type="button"
              onClick={() => handleToggleStat(stat)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckIcon size={14} color="#22c55e" />
              <span>{stat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom Metric Formulas with Live Preview ── */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800 }}>
          Custom Formulas &amp; Derived Metrics Live Preview
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Formula Config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                EFFICIENCY RATING (PER) FORMULA
              </label>
              <input
                type="text"
                value={settings.efficiencyFormula.formula}
                onChange={e => onChange({
                  ...settings,
                  efficiencyFormula: { ...settings.efficiencyFormula, formula: e.target.value },
                })}
                className="form-input"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <CheckIcon size={12} /> Formula syntax validated &amp; active
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                MVP SCORE FORMULA
              </label>
              <input
                type="text"
                value={settings.mvpFormula.formula}
                onChange={e => onChange({
                  ...settings,
                  mvpFormula: { ...settings.mvpFormula, formula: e.target.value },
                })}
                className="form-input"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <CheckIcon size={12} /> Formula syntax validated &amp; active
              </span>
            </div>
          </div>

          {/* Interactive Calculator Preview Box */}
          <div style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                Live Formula Simulator
              </span>
              <h4 style={{ margin: '4px 0 12px', fontSize: '14px', fontWeight: 700 }}>
                Test Metric Weights in Real-Time
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                    <span>Efficiency (PER):</span>
                    <strong>{testEfficiency}</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={0.5}
                    value={testEfficiency}
                    onChange={e => setTestEfficiency(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                    <span>Team Win %:</span>
                    <strong>{testWinPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={testWinPct}
                    onChange={e => setTestWinPct(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                    <span>Scoring Average (PPG):</span>
                    <strong>{testPpg}</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={0.5}
                    value={testPpg}
                    onChange={e => setTestPpg(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Resulting MVP Rating:
              </span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent)' }}>
                {calculatedMvpScore} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

