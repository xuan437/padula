import { useMemo } from 'react';
import type { Match } from '../types';
import { useApp } from '../context/AppContext';
import { predictMatch } from '../lib/predictionAi';
import { getSportName, getSportIcon } from '../lib/sports';
import { SparklesIcon, XIcon, FlameIcon, TrophyIcon, ZapIcon, AlertTriangleIcon } from './Icons';

interface AIPredictionModalProps {
  match: Match;
  onClose: () => void;
}

export default function AIPredictionModal({ match, onClose }: AIPredictionModalProps) {
  const { matches, teams, players } = useApp();

  const prediction = useMemo(() => {
    return predictMatch(match.teamA, match.teamB, match.sport, matches, teams, players, match);
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
    isLive,
    currentScoreA, currentScoreB,
    preMatchWinProbA, preMatchWinProbB,
    winProbA, winProbB,
    predictedWinner, predictedWinnerProb,
    predictedScoreA, predictedScoreB,
    scoreRangeA, scoreRangeB,
    confidence, confidencePct, matchQualityRating,
    comebackProb, momentumLeader, momentumReason,
    factorSignals, keyFactors, tacticalSummary,
    statsA, statsB, disclaimer
  } = prediction;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
      backdropFilter: 'blur(5px)',
    }}>
      <div className="glass-card" onClick={e => e.stopPropagation()} style={{
        maxWidth: 680, width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: 24,
        position: 'relative', border: '1px solid rgba(220, 38, 38, 0.35)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.55)'
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
            width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            color: '#fff', boxShadow: '0 2px 10px rgba(220,38,38,0.4)'
          }}>
            <SparklesIcon size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Padula Neural AI Match Intelligence v4.0 MAX
              </span>
              {isLive && (
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 12, background: 'rgba(220,38,38,0.18)', color: '#ef4444', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span className="live-dot" /> LIVE IN-GAME PREDICTION
                </span>
              )}
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 800 }}>
                {confidence} ({confidencePct}% Model Confidence)
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {getSportIcon(match.sport, 14, 'var(--accent)')}
              <span>{getSportName(match.sport)} · {match.round || 'Tournament Match'} · {match.venue || 'Main Arena'}</span>
            </div>
          </div>
        </div>

        {/* Explicit Predicted Winner Callout Banner */}
        <div style={{
          padding: '14px 18px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.14), rgba(59, 130, 246, 0.10))',
          border: '1.5px solid rgba(220, 38, 38, 0.35)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(234, 179, 8, 0.18)', border: '1px solid rgba(234, 179, 8, 0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', flexShrink: 0,
            }}>
              <TrophyIcon size={18} color="#eab308" />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                {isLive ? 'AI Live Match Winner Prediction (Past Performance + Live Score)' : 'AI Predicted Match Winner (Based on Past Performance)'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{predictedWinner}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.14)', padding: '2px 8px', borderRadius: 20 }}>
                  {predictedWinnerProb}% Win Probability
                </span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Projected Final Score
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>
              {predictedScoreA} – {predictedScoreB}
            </div>
          </div>
        </div>

        {/* Win Probability & Live Score Box */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
          {isLive && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)',
              fontSize: 12
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="live-dot" /> Live Court Score: <strong style={{ color: 'var(--text-primary)' }}>{match.teamA} {currentScoreA} – {currentScoreB} {match.teamB}</strong>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Pre-Match Past Performance Edge: <strong>{match.teamA} {preMatchWinProbA}% / {match.teamB} {preMatchWinProbB}%</strong>
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{match.teamA}</span>
                {predictedWinner === match.teamA && (
                  <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.16)', color: '#10b981', fontWeight: 800 }}>
                    PREDICTED WINNER
                  </span>
                )}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: winProbA >= 50 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {winProbA}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isLive ? 'Live Win Probability' : 'Win Probability'}
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Match Quality {matchQualityRating}/100 · Comeback Odds {comebackProb}%
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                {predictedWinner === match.teamB && (
                  <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.16)', color: '#10b981', fontWeight: 800 }}>
                    PREDICTED WINNER
                  </span>
                )}
                <span>{match.teamB}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: winProbB >= 50 ? '#3b82f6' : 'var(--text-secondary)' }}>
                {winProbB}%
              </div>
            </div>
          </div>

          {/* Bar Visual */}
          <div style={{ width: '100%', height: 12, background: 'rgba(59, 130, 246, 0.4)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
            <span>Projected Final: <strong style={{ color: 'var(--text-primary)' }}>{predictedScoreA} pts</strong> ({scoreRangeA[0]}–{scoreRangeA[1]})</span>
            <span>Momentum: <strong style={{ color: 'var(--accent)' }}>{momentumLeader}</strong></span>
            <span>Projected Final: <strong style={{ color: 'var(--text-primary)' }}>{predictedScoreB} pts</strong> ({scoreRangeB[0]}–{scoreRangeB[1]})</span>
          </div>
        </div>

        {/* Tactical AI Summary */}
        <div style={{
          padding: '12px 14px', borderRadius: 8, background: 'rgba(220, 38, 38, 0.06)',
          borderLeft: '3px solid var(--accent)', marginBottom: 16
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FlameIcon size={12} /> Neural AI Tactical &amp; Past Performance Breakdown
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-primary)', margin: 0 }}>
            {tacticalSummary}
          </p>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ZapIcon size={12} color="var(--accent)" /> Momentum Driver: {momentumReason}
          </div>
        </div>

        {/* Multi-Factor AI Signal Breakdown */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
            Multi-Factor AI Signal Weights ({match.teamA} vs {match.teamB})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {factorSignals.map((sig, idx) => {
              // Map -100..+100 to 0..100% for Team A bar
              const pctA = Math.max(8, Math.min(92, Math.round(50 + sig.advantageScore * 0.42)));
              return (
                <div key={idx} style={{ background: 'var(--bg-elevated)', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{sig.detailA}</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: 11, textTransform: 'uppercase' }}>
                      {sig.label} {sig.edgeTeam !== 'Even' ? `(${sig.edgeTeam} Edge)` : '(Balanced)'}
                    </strong>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{sig.detailB}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(59,130,246,0.35)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${pctA}%`, background: 'var(--accent)', transition: 'width 0.4s ease' }} />
                    <div style={{ width: `${100 - pctA}%`, background: '#3b82f6', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side-by-Side Past Performance & Historical Metrics */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
            Historical Past Performance Comparison
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { team: match.teamA, stats: statsA, accent: 'var(--accent)' },
              { team: match.teamB, stats: statsB, accent: '#3b82f6' },
            ].map(({ team, stats, accent }) => (
              <div key={team} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{team}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: accent }}>{stats.eloRating} ELO</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Past Record:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{stats.wins}W – {stats.losses}L ({stats.winPct}%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Avg Scoring / Allowed:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{stats.avgPointsFor || '—'} / {stats.avgPointsAgainst || '—'} PPG</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Point Differential:</span>
                    <strong style={{ color: stats.pointDiff >= 0 ? '#10b981' : '#ef4444' }}>
                      {stats.pointDiff >= 0 ? `+${stats.pointDiff}` : stats.pointDiff} ({stats.avgPointDiff >= 0 ? `+${stats.avgPointDiff}` : stats.avgPointDiff}/g)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Pythagorean Win %:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{stats.pythagoreanWinPct}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Clutch / Star Index:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{stats.clutchIndex} / {stats.rosterStarPower}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Recent Form:</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {stats.recentForm.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>Debut / No Completed Games</span>
                      ) : (
                        stats.recentForm.map((r, i) => (
                          <span key={i} style={{
                            fontSize: 10, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                            background: r === 'W' ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.16)',
                            color: r === 'W' ? '#10b981' : '#ef4444',
                          }}>
                            {r}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  {stats.keyPlayer && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Impact Athlete:</span>
                      <strong style={{ color: accent }}>{stats.keyPlayer.name} {stats.keyPlayer.jerseyNumber ? `#${stats.keyPlayer.jerseyNumber}` : ''}</strong>
                    </div>
                  )}
                </div>

                {/* Recent Past Match Log */}
                {stats.pastMatches.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                      Past Match Log ({stats.pastMatches.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {stats.pastMatches.slice(-3).reverse().map(pm => (
                        <div key={pm.matchId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-secondary)' }}>
                          <span>
                            <strong style={{ color: pm.result === 'W' ? '#10b981' : '#ef4444' }}>{pm.result}</strong> vs {pm.opponent}
                          </span>
                          <span style={{ fontWeight: 700 }}>{pm.teamScore}–{pm.opponentScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deciding Factors */}
        {keyFactors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
              Critical AI Prediction Factors
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
          paddingTop: 10, borderTop: '1px solid var(--border)', fontStyle: 'italic',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertTriangleIcon size={13} color="#f59e0b" />
          <span>{disclaimer}</span>
        </div>
      </div>
    </div>
  );
}
