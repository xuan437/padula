import { useMemo } from 'react';
import type { Match } from '../types';
import { useApp } from '../context/AppContext';
import { predictMatch } from '../lib/predictionAi';
import { getSportName, getSportIcon } from '../lib/sports';
import { SparklesIcon, XIcon, FlameIcon } from './Icons';

interface AIPredictionModalProps {
  match: Match;
  onClose: () => void;
}

export default function AIPredictionModal({ match, onClose }: AIPredictionModalProps) {
  const { matches, teams, players } = useApp();

  const prediction = useMemo(() => {
    return predictMatch(match.teamA, match.teamB, match.sport, matches, teams, players);
  }, [match, matches, teams, players]);

  if (!prediction) {
    return (
      <div className="modal-backdrop" onClick={onClose} style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
      }}>
        <div className="glass-card" onClick={e => e.stopPropagation()} style={{
          maxWidth: 480, width: '100%', padding: 24, textAlign: 'center', position: 'relative'
        }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <XIcon size={18} />
          </button>
          <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent)', marginBottom: 12 }}>
            <SparklesIcon size={24} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Prediction Pending</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Both competitor slots must be confirmed before the Padula AI model can forecast this matchup.
          </p>
        </div>
      </div>
    );
  }

  const {
    winProbA, winProbB,
    predictedScoreA, predictedScoreB,
    scoreRangeA, scoreRangeB,
    confidence, matchQualityRating,
    keyFactors, tacticalSummary,
    statsA, statsB, disclaimer
  } = prediction;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
      backdropFilter: 'blur(4px)',
    }}>
      <div className="glass-card" onClick={e => e.stopPropagation()} style={{
        maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24,
        position: 'relative', border: '1px solid rgba(220, 38, 38, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Close Button */}
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--text-muted)', padding: 4
        }}>
          <XIcon size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            color: '#fff', boxShadow: '0 2px 8px rgba(220,38,38,0.4)'
          }}>
            <SparklesIcon size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Padula AI Match Intelligence
              </span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(220,38,38,0.15)', color: 'var(--accent)', fontWeight: 700 }}>
                {confidence}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {getSportIcon(match.sport, 14, 'var(--accent)')}
              <span>{getSportName(match.sport)} · {match.round || 'Tournament Match'}</span>
            </div>
          </div>
        </div>

        {/* Win Probability Bar */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{match.teamA}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: winProbA >= 50 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {winProbA}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Win Probability
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Quality {matchQualityRating}/100
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{match.teamB}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: winProbB >= 50 ? '#3b82f6' : 'var(--text-secondary)' }}>
                {winProbB}%
              </div>
            </div>
          </div>

          {/* Bar Visual */}
          <div style={{ width: '100%', height: 10, background: 'rgba(59, 130, 246, 0.4)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
            <div style={{
              width: `${winProbA}%`,
              background: 'linear-gradient(90deg, #dc2626, #ef4444)',
              transition: 'width 0.6s ease',
            }} />
            <div style={{
              width: `${winProbB}%`,
              background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
              transition: 'width 0.6s ease',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Projected {predictedScoreA} pts ({scoreRangeA[0]}–{scoreRangeA[1]})</span>
            <span>Projected {predictedScoreB} pts ({scoreRangeB[0]}–{scoreRangeB[1]})</span>
          </div>
        </div>

        {/* Tactical AI Summary */}
        <div style={{
          padding: '12px 14px', borderRadius: 8, background: 'rgba(220, 38, 38, 0.05)',
          borderLeft: '3px solid var(--accent)', marginBottom: 16
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FlameIcon size={12} /> AI Tactical Breakdown
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-primary)', margin: 0 }}>
            {tacticalSummary}
          </p>
        </div>

        {/* Side-by-Side Statistical Edge */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
            Key Matchup Metrics
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {/* Team A Metrics */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                {match.teamA}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>Avg Scoring: <strong style={{ color: 'var(--text-primary)' }}>{statsA.avgPointsFor || '—'} PPG</strong></div>
                <div>Avg Conceded: <strong style={{ color: 'var(--text-primary)' }}>{statsA.avgPointsAgainst || '—'} PPG</strong></div>
                <div>Cleared Athletes: <strong style={{ color: 'var(--text-primary)' }}>{statsA.clearedPlayersCount} active</strong></div>
                {statsA.keyPlayer && (
                  <div>Key Player: <strong style={{ color: 'var(--accent)' }}>{statsA.keyPlayer.name}</strong></div>
                )}
              </div>
            </div>

            {/* Team B Metrics */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                {match.teamB}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>Avg Scoring: <strong style={{ color: 'var(--text-primary)' }}>{statsB.avgPointsFor || '—'} PPG</strong></div>
                <div>Avg Conceded: <strong style={{ color: 'var(--text-primary)' }}>{statsB.avgPointsAgainst || '—'} PPG</strong></div>
                <div>Cleared Athletes: <strong style={{ color: 'var(--text-primary)' }}>{statsB.clearedPlayersCount} active</strong></div>
                {statsB.keyPlayer && (
                  <div>Key Player: <strong style={{ color: '#3b82f6' }}>{statsB.keyPlayer.name}</strong></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Deciding Factors */}
        {keyFactors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
              Critical Match Factors
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {keyFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer per System Rules */}
        <div style={{
          fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4,
          paddingTop: 10, borderTop: '1px solid var(--border)', fontStyle: 'italic'
        }}>
          ⚠️ {disclaimer}
        </div>
      </div>
    </div>
  );
}
