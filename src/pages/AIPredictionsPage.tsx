import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName, getSportIcon } from '../lib/sports';
import { predictMatch, computeTeamProfile } from '../lib/predictionAi';
import { isPlaceholder } from '../lib/bracket';
import {
  SparklesIcon,
  FlameIcon,
  CalendarIcon,
  ActivityIcon,
  ChevronRightIcon,
  TrophyIcon,
  MapPinIcon,
  BarChartIcon,
} from '../components/Icons';
import { PageHeader } from '../components/ui';
import AIPredictionModal from '../components/AIPredictionModal';
import type { Match } from '../types';

export default function AIPredictionsPage() {
  const { matches, teams, players, departments, setActiveView } = useApp();

  // All live matches with valid competing teams
  const allLiveMatches = useMemo(() => {
    return matches.filter(
      m => m.status === 'live' && !m.isBye && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB)
    );
  }, [matches]);

  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'simulator' | 'power'>('live');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedMatchForModal, setSelectedMatchForModal] = useState<Match | null>(null);

  // Simulator State
  const [simSport, setSimSport] = useState<string>('s1');
  const [simTeamA, setSimTeamA] = useState<string>('');
  const [simTeamB, setSimTeamB] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<ReturnType<typeof predictMatch> | null>(null);

  const availableSports = SPORTS_CATALOG;

  // Filtered live matches
  const liveMatches = useMemo(() => {
    return allLiveMatches.filter(m => selectedSport === 'all' || m.sport === selectedSport);
  }, [allLiveMatches, selectedSport]);

  // Filtered upcoming matches where both teams are real teams
  const upcomingMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status !== 'scheduled') return false;
      if (m.isBye || isPlaceholder(m.teamA) || isPlaceholder(m.teamB)) return false;
      if (selectedSport !== 'all' && m.sport !== selectedSport) return false;
      return true;
    });
  }, [matches, selectedSport]);

  // Teams eligible for simulator
  const simTeams = useMemo(() => {
    return teams.filter(t => t.sport === simSport && t.isActive !== false);
  }, [teams, simSport]);

  // Handle simulation trigger
  const handleRunSimulation = () => {
    if (!simTeamA || !simTeamB || simTeamA === simTeamB) return;
    setIsSimulating(true);
    setTimeout(() => {
      const pred = predictMatch(simTeamA, simTeamB, simSport, matches, teams, players);
      setSimResult(pred);
      setIsSimulating(false);
    }, 250);
  };

  // Compute Power Rankings for teams in active sport
  const powerRankings = useMemo(() => {
    const activeSportTeams = teams.filter(
      t => (selectedSport === 'all' || t.sport === selectedSport) && t.isActive !== false
    );
    return activeSportTeams
      .map(team => {
        const profile = computeTeamProfile(team.name, team.sport, matches, teams, players);
        const winRate = profile.gamesPlayed > 0 ? profile.wins / profile.gamesPlayed : 0.5;
        const pointMargin = profile.gamesPlayed > 0 ? profile.pointDiff / profile.gamesPlayed : 0;
        const eloBonus = (profile.eloRating - 1500) * 0.08;
        const score = Math.round(
          winRate * 42 +
            pointMargin * 1.4 +
            profile.streak * 3 +
            eloBonus +
            (profile.pythagoreanWinPct - 50) * 0.25 +
            profile.clearedPlayersCount * 1.2 +
            32
        );
        return {
          team,
          profile,
          powerScore: Math.max(15, Math.min(99, score)),
        };
      })
      .sort((a, b) => b.powerScore - a.powerScore || b.profile.eloRating - a.profile.eloRating);
  }, [teams, selectedSport, matches, players]);

  // Compute genuine engine accuracy from finished matches
  const accuracyStats = useMemo(() => {
    const finished = matches.filter(
      m => m.status === 'finished' && !m.isBye && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB) && m.winner
    );
    if (finished.length === 0) {
      return { label: 'Awaiting results', pct: null, correct: 0, total: 0 };
    }
    let correct = 0;
    finished.forEach(m => {
      const pred = predictMatch(m.teamA, m.teamB, m.sport, matches, teams, players);
      if (pred) {
        const predictedWinner = pred.winProbA >= pred.winProbB ? m.teamA : m.teamB;
        if (m.winner === predictedWinner) correct++;
      }
    });
    const pct = Math.round((correct / finished.length) * 100);
    return {
      label: `${pct}% (${correct}/${finished.length})`,
      pct,
      correct,
      total: finished.length,
    };
  }, [matches, teams, players]);

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Padula 2026', onClick: () => setActiveView('dashboard') },
          { label: 'Predictions' },
        ]}
        title="Predictions"
        description="Transparent statistical forecasts powered by Elo ratings, Pythagorean efficiency, and head-to-head records."
        actions={
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Live Matches</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="live-dot" /> {allLiveMatches.length}
              </div>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Queued</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{upcomingMatches.length}</div>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Model Accuracy</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: accuracyStats.pct !== null ? '#10b981' : 'var(--text-muted)' }}>
                {accuracyStats.label}
              </div>
            </div>
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${activeTab === 'live' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('live')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FlameIcon size={14} color={activeTab === 'live' ? '#fff' : '#ef4444'} />
          <span>Live Match Winner Predictions ({allLiveMatches.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('upcoming')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <CalendarIcon size={14} /> Upcoming Match Forecasts ({upcomingMatches.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'simulator' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('simulator')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <SparklesIcon size={14} /> Head-to-Head AI Simulator
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'power' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('power')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ActivityIcon size={14} /> AI Power &amp; Elo Rankings
        </button>
      </div>

      {/* Sport Filter Bar (shared by Live & Upcoming tabs) */}
      {(activeTab === 'live' || activeTab === 'upcoming') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginRight: 2,
            userSelect: 'none',
          }}>
            FILTER SPORT:
          </span>
          <button
            type="button"
            className={`btn btn-sm ${selectedSport === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedSport('all')}
            style={{ borderRadius: 8, height: 34, padding: '6px 14px', fontWeight: selectedSport === 'all' ? 700 : 600 }}
          >
            All Sports
          </button>
          {availableSports.map(s => {
            const isSelected = selectedSport === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedSport(s.id)}
                style={{
                  borderRadius: 8,
                  height: 34,
                  padding: '6px 14px',
                  fontWeight: isSelected ? 700 : 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {getSportIcon(s.id, 14, isSelected ? '#ffffff' : 'var(--text-secondary)')}
                </span>
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: LIVE MATCH WINNER PREDICTIONS (BASED ON PAST PERFORMANCE + LIVE SCORE)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'live' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {liveMatches.length === 0 ? (
            <div className="glass-card" style={{ padding: 44, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', marginBottom: 12 }}>
                <FlameIcon size={28} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>No Live Matches Currently On Court</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 18px' }}>
                As soon as a match starts in the Scoring Desk, the Padula AI Engine automatically predicts the winner in real time using both teams&apos; past performance (Elo rating, W–L record, scoring efficiency, H2H, and clutch index) blended with live court scores.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('upcoming')}>
                  <CalendarIcon size={14} /> View Upcoming Match Forecasts ({upcomingMatches.length})
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setActiveTab('simulator')}>
                  <SparklesIcon size={14} /> Open Head-to-Head Simulator
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 18 }}>
              {liveMatches.map(match => {
                const pred = predictMatch(match.teamA, match.teamB, match.sport, matches, teams, players, match);
                if (!pred) return null;

                return (
                  <div
                    key={match.id}
                    className="glass-card"
                    style={{
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      border: '1.5px solid rgba(220, 38, 38, 0.4)',
                      boxShadow: '0 10px 32px rgba(220, 38, 38, 0.12)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedMatchForModal(match)}
                  >
                    {/* Top Row: Sport, Round, Live Badge & Confidence */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        {getSportIcon(match.sport, 15, 'var(--accent)')}
                        <span>{getSportName(match.sport)} · {match.round}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(220, 38, 38, 0.18)', color: '#ef4444', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span className="live-dot" /> LIVE
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 800 }}>
                          {pred.confidencePct}% AI Confidence
                        </span>
                      </div>
                    </div>

                    {/* Live Scoreboard Box */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{match.teamA}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {pred.statsA.eloRating} Elo · {pred.statsA.wins}W–{pred.statsA.losses}L ({pred.statsA.avgPointsFor || '—'} PPG)
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 14px',
                        borderRadius: 10,
                        background: 'rgba(220, 38, 38, 0.1)',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                      }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)' }}>{match.scoreA}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>:</span>
                        <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)' }}>{match.scoreB}</span>
                      </div>

                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{match.teamB}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {pred.statsB.eloRating} Elo · {pred.statsB.wins}W–{pred.statsB.losses}L ({pred.statsB.avgPointsFor || '—'} PPG)
                        </div>
                      </div>
                    </div>

                    {/* Explicit Predicted Winner Callout */}
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(59, 130, 246, 0.10))',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TrophyIcon size={18} color="#eab308" />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                            AI Predicted Match Winner (Past Performance + Live Pace)
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{pred.predictedWinner}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>
                              ({pred.predictedWinnerProb}% Win Prob)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Projected Final
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-primary)' }}>
                          {pred.predictedScoreA} – {pred.predictedScoreB}
                        </div>
                      </div>
                    </div>

                    {/* Live Win Probability Bar & Pre-Match Prior Comparison */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 5 }}>
                        <span style={{ color: pred.winProbA >= 50 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {match.teamA}: {pred.winProbA}% <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>(Pre-match: {pred.preMatchWinProbA}%)</span>
                        </span>
                        <span style={{ color: pred.winProbB >= 50 ? '#3b82f6' : 'var(--text-secondary)' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>(Pre-match: {pred.preMatchWinProbB}%)</span> {match.teamB}: {pred.winProbB}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'rgba(59, 130, 246, 0.35)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${pred.winProbA}%`, background: 'var(--accent)', transition: 'width 0.5s ease' }} />
                        <div style={{ width: `${pred.winProbB}%`, background: '#3b82f6', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    {/* Past Performance Edge Summary */}
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45, background: 'var(--bg-elevated)', padding: '9px 12px', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <BarChartIcon size={13} color="var(--accent)" />
                      <span><strong>Past Performance Basis:</strong> {pred.pastPerformanceSummary}. {pred.momentumReason}.</span>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', paddingTop: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPinIcon size={12} color="var(--text-muted)" /> {match.venue} · Comeback Odds: {pred.comebackProb}%
                      </span>
                      <span style={{ color: 'var(--accent)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Full Neural Breakdown <ChevronRightIcon size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: UPCOMING MATCH FORECASTS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {upcomingMatches.length === 0 ? (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: 14, borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', marginBottom: 12 }}>
                <SparklesIcon size={28} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>No Upcoming Scheduled Matches in Selected Sport</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Generate or schedule matches in the tournament bracket, or use the Head-to-Head Simulator to forecast any two teams.
              </p>
              <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('simulator')}>
                <SparklesIcon size={14} /> Launch Head-to-Head Simulator
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {upcomingMatches.map(match => {
                const pred = predictMatch(match.teamA, match.teamB, match.sport, matches, teams, players, match);
                if (!pred) return null;

                return (
                  <div
                    key={match.id}
                    className="glass-card"
                    style={{
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      border: '1px solid var(--border)',
                      transition: 'transform 0.2s ease, border-color 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedMatchForModal(match)}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {getSportIcon(match.sport, 14, 'var(--accent)')}
                        <span>{getSportName(match.sport)} · {match.round || 'Round Match'}</span>
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(220, 38, 38, 0.15)', color: 'var(--accent)', fontWeight: 800 }}>
                        {pred.confidence} ({pred.confidencePct}%)
                      </span>
                    </div>

                    {/* Predicted Winner Banner */}
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.28)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                    }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <TrophyIcon size={12} color="#10b981" /> Predicted Winner:
                      </span>
                      <strong style={{ color: '#10b981', fontWeight: 800 }}>
                        {pred.predictedWinner} ({pred.predictedWinnerProb}%)
                      </strong>
                    </div>

                    {/* Teams & Probability Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {match.teamA} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>({pred.statsA.eloRating} Elo)</span>
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: pred.winProbA >= 50 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {pred.winProbA}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(59, 130, 246, 0.3)', borderRadius: 3, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                        <div style={{ width: `${pred.winProbA}%`, background: 'var(--accent)' }} />
                        <div style={{ width: `${pred.winProbB}%`, background: '#3b82f6' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {match.teamB} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>({pred.statsB.eloRating} Elo)</span>
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: pred.winProbB >= 50 ? '#3b82f6' : 'var(--text-secondary)' }}>
                          {pred.winProbB}%
                        </span>
                      </div>
                    </div>

                    {/* Projected Spread Pill */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-elevated)',
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      color: 'var(--text-secondary)',
                    }}>
                      <span>Projected Score:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {pred.predictedScoreA} – {pred.predictedScoreB}
                      </strong>
                    </div>

                    {/* Key Factor Snippet */}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <SparklesIcon size={11} color="var(--accent)" /> {pred.pastPerformanceSummary}
                    </div>

                    {/* Action */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        View Deep Dive Forecast <ChevronRightIcon size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: HEAD-TO-HEAD AI SIMULATOR
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(220, 38, 38, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8, background: 'var(--accent)', color: '#fff'
              }}>
                <SparklesIcon size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Custom Matchup Probability Simulator</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Select any sport and pair any two registered teams to run the Padula v4.0 Neural &amp; Bayesian predictive model based on past performance.
                </p>
              </div>
            </div>

            {/* Selectors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Select Sport
                </label>
                <select
                  className="input-field"
                  value={simSport}
                  onChange={e => {
                    setSimSport(e.target.value);
                    setSimTeamA('');
                    setSimTeamB('');
                    setSimResult(null);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {availableSports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Team A
                </label>
                <select
                  className="input-field"
                  value={simTeamA}
                  onChange={e => setSimTeamA(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose Team A --</option>
                  {simTeams.map(t => (
                    <option key={t.id} value={t.name} disabled={t.name === simTeamB}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Team B
                </label>
                <select
                  className="input-field"
                  value={simTeamB}
                  onChange={e => setSimTeamB(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose Team B --</option>
                  {simTeams.map(t => (
                    <option key={t.id} value={t.name} disabled={t.name === simTeamA}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                className="btn btn-primary"
                onClick={handleRunSimulation}
                disabled={!simTeamA || !simTeamB || simTeamA === simTeamB || isSimulating}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontWeight: 800 }}
              >
                <SparklesIcon size={16} />
                {isSimulating ? 'Running Neural & Elo Simulation...' : 'Run AI Simulation'}
              </button>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className="glass-card" style={{ padding: 24, border: '1px solid var(--accent)', boxShadow: '0 8px 30px rgba(220, 38, 38, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FlameIcon size={14} /> AI Simulated Winner: {simResult.predictedWinner} ({simResult.predictedWinnerProb}%)
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(220, 38, 38, 0.15)', color: 'var(--accent)', fontWeight: 800 }}>
                  {simResult.confidence} ({simResult.confidencePct}% Model Confidence)
                </span>
              </div>

              {/* Head-to-Head Big Probability */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{simResult.teamA}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {simResult.statsA.eloRating} Elo · {simResult.statsA.wins}W–{simResult.statsA.losses}L
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: simResult.winProbA >= 50 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {simResult.winProbA}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Projected Final Score</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
                      {simResult.predictedScoreA} – {simResult.predictedScoreB}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                      ({simResult.scoreRangeA[0]}–{simResult.scoreRangeA[1]} vs {simResult.scoreRangeB[0]}–{simResult.scoreRangeB[1]})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{simResult.teamB}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {simResult.statsB.eloRating} Elo · {simResult.statsB.wins}W–{simResult.statsB.losses}L
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: simResult.winProbB >= 50 ? '#3b82f6' : 'var(--text-secondary)' }}>
                      {simResult.winProbB}%
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', height: 12, background: 'rgba(59, 130, 246, 0.4)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${simResult.winProbA}%`, background: 'var(--accent)', transition: 'width 0.6s ease' }} />
                  <div style={{ width: `${simResult.winProbB}%`, background: '#3b82f6', transition: 'width 0.6s ease' }} />
                </div>
              </div>

              {/* Multi-Factor Signal Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {simResult.factorSignals.map((sig, idx) => {
                  const pctA = Math.max(8, Math.min(92, Math.round(50 + sig.advantageScore * 0.42)));
                  return (
                    <div key={idx} style={{ background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span>{sig.detailA}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{sig.label}</strong>
                        <span>{sig.detailB}</span>
                      </div>
                      <div style={{ width: '100%', height: 5, background: 'rgba(59,130,246,0.35)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${pctA}%`, background: 'var(--accent)' }} />
                        <div style={{ width: `${100 - pctA}%`, background: '#3b82f6' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Narrative Summary */}
              <div style={{ padding: 14, borderRadius: 8, background: 'rgba(220, 38, 38, 0.05)', borderLeft: '3px solid var(--accent)', marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Tactical &amp; Past Performance Breakdown
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: 'var(--text-primary)' }}>
                  {simResult.tacticalSummary}
                </p>
              </div>

              {/* Deciding Factors */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Key Probabilistic Factors
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {simResult.keyFactors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: AI POWER & ELO RANKINGS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'power' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Tournament AI Power &amp; Elo Index</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Algorithmic team strength ranking based on dynamic Elo rating, Pythagorean win expectation, offensive/defensive efficiency, and recent form.
              </p>
            </div>
            <select
              className="input-field"
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12 }}
            >
              <option value="all">All Sports</option>
              {availableSports.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {powerRankings.length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No registered teams available in this sport category.
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', width: 50 }}>#</th>
                    <th style={{ padding: '12px 16px' }}>Team</th>
                    <th style={{ padding: '12px 16px' }}>Sport</th>
                    <th style={{ padding: '12px 16px' }}>Elo Rating</th>
                    <th style={{ padding: '12px 16px' }}>Record (Pyth %)</th>
                    <th style={{ padding: '12px 16px' }}>PPG / Opp</th>
                    <th style={{ padding: '12px 16px' }}>Recent Form</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>AI Power Index</th>
                  </tr>
                </thead>
                <tbody>
                  {powerRankings.map(({ team, profile, powerScore }, index) => {
                    const dept = departments.find(d => d.id === team.department);
                    return (
                      <tr key={team.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: index < 3 ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{team.name}</div>
                          {dept && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dept.name}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {getSportIcon(team.sport, 14)} {getSportName(team.sport)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--accent)' }}>
                          {profile.eloRating}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {profile.wins}W – {profile.losses}L
                          </span>{' '}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({profile.pythagoreanWinPct}%)</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {profile.avgPointsFor || '—'} / {profile.avgPointsAgainst || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {profile.recentForm.length === 0 ? (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                            ) : (
                              profile.recentForm.map((r, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: r === 'W' ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.16)',
                                    color: r === 'W' ? '#10b981' : '#ef4444',
                                  }}
                                >
                                  {r}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${powerScore}%`, height: '100%', background: 'var(--accent)' }} />
                            </div>
                            <span style={{ fontWeight: 900, fontSize: 14, color: 'var(--accent)' }}>
                              {powerScore}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for Match Deep Dive */}
      {selectedMatchForModal && (
        <AIPredictionModal
          match={selectedMatchForModal}
          onClose={() => setSelectedMatchForModal(null)}
        />
      )}
    </div>
  );
}
