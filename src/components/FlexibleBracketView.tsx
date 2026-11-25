import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getSportName } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import { scoreBracketPredictions } from '../lib/bracketEngine';
import TournamentTreeBracket from './TournamentTreeBracket';
import { TrophyIcon, FlameIcon, MedalIcon, UsersIcon, SparklesIcon, CheckIcon } from './Icons';

function getDeviceId(): string {
  try {
    let id = localStorage.getItem('padula_device_id');
    if (!id) {
      id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('padula_device_id', id);
    }
    return id;
  } catch {
    return 'dev-guest';
  }
}

export default function FlexibleBracketView({
  sportId,
  isPublicView = true,
}: {
  sportId: string;
  isPublicView?: boolean;
}) {
  const {
    matches,
    events,
    teams,
    settings,
    currentUser,
    ladderEntries,
    ladderChallenges,
    bracketPredictions,
    bracketVotes,
    submitBracketPrediction,
    castBracketVote,
  } = useApp();

  const [predictorName, setPredictorName] = useState(currentUser?.name || '');
  const [voteNotice, setVoteNotice] = useState<string | null>(null);
  const deviceId = useMemo(() => getDeviceId(), []);
  const voterKey = currentUser?.email || deviceId;

  const sportName = getSportName(sportId);
  const sportMatches = useMemo(
    () =>
      matches.filter(
        m =>
          m.sport === sportId ||
          getSportName(m.sport).toLowerCase() === sportName.toLowerCase()
      ),
    [matches, sportId, sportName]
  );
  const sportLadder = useMemo(
    () => ladderEntries.filter(e => e.sport === sportId).sort((a, b) => a.rank - b.rank),
    [ladderEntries, sportId]
  );
  const sportChallenges = useMemo(
    () => ladderChallenges.filter(c => c.sport === sportId),
    [ladderChallenges, sportId]
  );
  const activeEvent = useMemo(
    () => events.find(e => !e.archived && (e.sport === sportId || getSportName(e.sport).toLowerCase() === sportName.toLowerCase())),
    [events, sportId, sportName]
  );

  const format = activeEvent?.format || sportMatches[0]?.format || 'single_elimination';
  const sportRule = settings?.sportsCompetition?.sports?.[sportId as keyof typeof settings.sportsCompetition.sports];
  const override = settings?.sportsCompetition?.competitionOverrides?.[sportId];
  const enablePredictions = Boolean(override?.enablePredictionBracket ?? sportRule?.enablePredictionBracket);
  const enableVoting = Boolean(override?.enableVotingBracket ?? sportRule?.enableVotingBracket);
  const enableCustomMedia = Boolean(override?.enableCustomBracketMedia ?? sportRule?.enableCustomBracketMedia);

  const liveMatches = sportMatches.filter(m => m.status === 'live' && !m.isBye);
  const predictionLeaderboard = useMemo(
    () => scoreBracketPredictions(bracketPredictions.filter(p => p.sport === sportId), sportMatches),
    [bracketPredictions, sportId, sportMatches]
  );

  // Show bracket only when it has content
  if (sportMatches.length === 0 && sportLadder.length === 0) {
    return null;
  }

  const getTeamColor = (name: string) =>
    teams.find(t => t.name.toLowerCase() === name.toLowerCase())?.color || 'var(--accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Live TV Scoreboard Strip for any Live Matches in this bracket */}
      {liveMatches.length > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #0b162d 0%, #102a4c 100%)',
            color: '#f8fafc',
            border: '1.5px solid #38bdf8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FlameIcon size={16} color="#38bdf8" />
            <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
              LIVE TV SCOREBOARD · {sportName}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {liveMatches.map(m => (
              <div
                key={m.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{m.teamA}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', fontVariantNumeric: 'tabular-nums' }}>
                  {m.scoreA} – {m.scoreB}
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontWeight: 800, fontSize: 14 }}>{m.teamB}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {voteNotice && (
        <div className="glass-card" style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 700, color: '#10b981' }}>
          <CheckIcon size={13} color="#10b981" /> {voteNotice}
        </div>
      )}

      {/* Format-specific single clean view */}
      {format === 'ladder' ? (
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MedalIcon size={18} color="var(--accent)" />
              {sportName} — Ladder / Pyramid Standings
            </h3>
            <span className="badge-chip">Challenge team above to swap</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sportLadder.map(entry => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 900, fontSize: 15, color: entry.rank === 1 ? '#eab308' : 'var(--accent)', minWidth: 28 }}>
                    #{entry.rank}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{entry.teamName}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {entry.wins}W – {entry.losses}L
                </span>
              </div>
            ))}
          </div>
          {sportChallenges.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>
                RECENT CHALLENGE HISTORY
              </div>
              {sportChallenges.slice(0, 6).map(ch => (
                <div key={ch.id} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-secondary)' }}>
                  #{ch.challengerRank} <strong>{ch.challengerTeam}</strong> challenged #{ch.defenderRank} <strong>{ch.defenderTeam}</strong> — Winner: <strong style={{ color: '#10b981' }}>{ch.winnerTeam}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : format === 'swiss' || format === 'group_stage' || format === 'round_robin' || format === 'point_system' ? (
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyIcon size={18} color="var(--accent)" />
            {sportName} — {format === 'swiss' ? 'Swiss System Pairings' : format === 'group_stage' ? 'Group Stage & Knockout' : 'Round Robin Schedule'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {sportMatches.map((m, idx) => {
              const hasVoted = bracketVotes.some(v => v.matchId === m.id && v.voterKey === voterKey);
              return (
                <div key={m.id} style={{ padding: 14, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>
                    <span>{m.groupName ? `${m.groupName} · ` : ''}{m.round || `Match #${idx + 1}`}</span>
                    <span className={`status-badge ${m.status}`}>{m.status.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
                      {enableCustomMedia && (
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: getTeamColor(m.teamA) }} />
                      )}
                      {isPlaceholder(m.teamA) ? 'TBD' : m.teamA}
                    </span>
                    <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{m.scoreA} – {m.scoreB}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
                      {isPlaceholder(m.teamB) ? 'TBD' : m.teamB}
                      {enableCustomMedia && (
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: getTeamColor(m.teamB) }} />
                      )}
                    </span>
                  </div>

                  {enableVoting && m.status !== 'finished' && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB) && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button
                        type="button"
                        disabled={hasVoted}
                        className="btn btn-xs btn-outline"
                        onClick={() => {
                          const r = castBracketVote(m.id, m.sport, 'A', voterKey);
                          setVoteNotice(r.message);
                        }}
                        style={{ flex: 1 }}
                      >
                        Vote {m.teamA} ({m.votesA || 0})
                      </button>
                      <button
                        type="button"
                        disabled={hasVoted}
                        className="btn btn-xs btn-outline"
                        onClick={() => {
                          const r = castBracketVote(m.id, m.sport, 'B', voterKey);
                          setVoteNotice(r.message);
                        }}
                        style={{ flex: 1 }}
                      >
                        Vote {m.teamB} ({m.votesB || 0})
                      </button>
                    </div>
                  )}

                  {enablePredictions && m.status === 'scheduled' && !isPlaceholder(m.teamA) && !isPlaceholder(m.teamB) && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => submitBracketPrediction({
                          eventId: m.eventId,
                          sport: m.sport,
                          matchId: m.id,
                          predictorName: predictorName.trim() || 'Spectator',
                          predictedWinner: m.teamA,
                          deviceId,
                        })}
                        style={{ flex: 1 }}
                      >
                        Pick {m.teamA}
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => submitBracketPrediction({
                          eventId: m.eventId,
                          sport: m.sport,
                          matchId: m.id,
                          predictorName: predictorName.trim() || 'Spectator',
                          predictedWinner: m.teamB,
                          deviceId,
                        })}
                        style={{ flex: 1 }}
                      >
                        Pick {m.teamB}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <TournamentTreeBracket initialSportId={sportId} showSportSelector={false} isPublicView={isPublicView} />
      )}

      {/* Prediction Bracket Leaderboard */}
      {enablePredictions && (
        <div className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SparklesIcon size={15} color="var(--accent)" />
              Prediction Bracket Leaderboard
            </h4>
            <input
              type="text"
              className="form-input"
              placeholder="Your Name for Predictions"
              value={predictorName}
              onChange={e => setPredictorName(e.target.value)}
              style={{ maxWidth: 220, padding: '5px 10px', fontSize: 12 }}
            />
          </div>
          {predictionLeaderboard.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UsersIcon size={13} /> Submit predictions on scheduled matches above to appear on the leaderboard.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {predictionLeaderboard.slice(0, 8).map((row, i) => (
                <div key={row.predictorName + i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
                  <span><strong>#{i + 1}</strong> {row.predictorName}</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{row.points} pts ({row.correct}/{row.totalEvaluated})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
