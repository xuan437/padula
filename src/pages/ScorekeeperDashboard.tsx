import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName, getSportIcon } from '../lib/sports';
import {
  MapPinIcon,
  CheckIcon,
  FlameIcon,
  LockIcon,
  ShieldIcon,
} from '../components/Icons';
import type { Match } from '../types';

// Offline entry
interface OfflineEntry {
  matchId: string;
  scoreA: number;
  scoreB: number;
  ts: number;
}

const OFFLINE_KEY = 'padula_offline_queue';

function loadQueue(): OfflineEntry[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveQueue(q: OfflineEntry[]) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
}

// ─────────────────────────────────────────────────────────────
// SPORT SPECIFIC SCORING CONTROLS
// ─────────────────────────────────────────────────────────────

interface ScoringProps {
  match: Match;
  editA: number;
  editB: number;
  setEditA: (n: number) => void;
  setEditB: (n: number) => void;
  isLocked: boolean;
  onQuickSave: (scoreA: number, scoreB: number) => void;
}

// 1. Basketball Desk (+1, +2, +3, Quarters, Fouls)
function BasketballScoringDesk({ match, editA, editB, setEditA, setEditB, isLocked, onQuickSave }: ScoringProps) {
  const [activeQuarter, setActiveQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT'>('Q1');
  const [foulsA, setFoulsA] = useState(2);
  const [foulsB, setFoulsB] = useState(3);

  const addScore = (team: 'A' | 'B', pts: number) => {
    if (isLocked) return;
    if (team === 'A') {
      const next = Math.max(0, editA + pts);
      setEditA(next);
      onQuickSave(next, editB);
    } else {
      const next = Math.max(0, editB + pts);
      setEditB(next);
      onQuickSave(editA, next);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Quarter Selector */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
        {(['Q1', 'Q2', 'Q3', 'Q4', 'OT'] as const).map(q => (
          <button
            key={q}
            type="button"
            className={`btn btn-sm ${activeQuarter === q ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveQuarter(q)}
            style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '14px' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Quick Points Buttons */}
      {!isLocked && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textAlign: 'center' }}>
              {match.teamA} Points
            </div>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => addScore('A', 1)}>+1</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => addScore('A', 2)}>+2</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => addScore('A', 3)}>+3</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fouls: {foulsA}</span>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                style={{ padding: '1px 6px', fontSize: '10px' }}
                onClick={() => setFoulsA(f => f + 1)}
              >
                +Foul
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textAlign: 'center' }}>
              {match.teamB} Points
            </div>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => addScore('B', 1)}>+1</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => addScore('B', 2)}>+2</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => addScore('B', 3)}>+3</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fouls: {foulsB}</span>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                style={{ padding: '1px 6px', fontSize: '10px' }}
                onClick={() => setFoulsB(f => f + 1)}
              >
                +Foul
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Volleyball Desk (Set-by-set rally scoring)
function VolleyballScoringDesk({ editA, editB, setEditA, setEditB, isLocked, onQuickSave }: ScoringProps) {
  const sets = [
    { set: 1, a: 25, b: 21 },
    { set: 2, a: 20, b: 25 },
    { set: 3, a: 15, b: 12 },
  ];

  const addPoint = (team: 'A' | 'B', delta: number) => {
    if (isLocked) return;
    if (team === 'A') {
      const next = Math.max(0, editA + delta);
      setEditA(next);
      onQuickSave(next, editB);
    } else {
      const next = Math.max(0, editB + delta);
      setEditB(next);
      onQuickSave(editA, next);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
          Set Breakdown (Sets Won: {editA} – {editB})
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-around' }}>
          {sets.map(s => (
            <div key={s.set} style={{ textAlign: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>S{s.set}: </span>
              <strong>{s.a} - {s.b}</strong>
            </div>
          ))}
        </div>
      </div>

      {!isLocked && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => addPoint('A', -1)}>-1 Set</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => addPoint('A', 1)}>+1 Set</button>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => addPoint('B', -1)}>-1 Set</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => addPoint('B', 1)}>+1 Set</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. Badminton & Table Tennis Desk (Game-by-game scores)
function RacquetScoringDesk({ editA, editB, setEditA, setEditB, isLocked, onQuickSave }: ScoringProps) {
  const addPoint = (team: 'A' | 'B', delta: number) => {
    if (isLocked) return;
    if (team === 'A') {
      const next = Math.max(0, editA + delta);
      setEditA(next);
      onQuickSave(next, editB);
    } else {
      const next = Math.max(0, editB + delta);
      setEditB(next);
      onQuickSave(editA, next);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Best of 3 Games · 21 Points to Win
      </div>
      {!isLocked && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => addPoint('A', -1)}>-1</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => addPoint('A', 1)}>+1 Pt</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => addPoint('B', -1)}>-1</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => addPoint('B', 1)}>+1 Pt</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. Chess Desk (Win / Draw / Loss)
function ChessScoringDesk({ match, setEditA, setEditB, isLocked, onQuickSave }: ScoringProps) {
  const setResult = (scoreA: number, scoreB: number) => {
    if (isLocked) return;
    setEditA(scoreA);
    setEditB(scoreB);
    onQuickSave(scoreA, scoreB);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        FIDE Chess Scoring: 1 Pt (Win), 0.5 Pt (Draw), 0 Pt (Loss)
      </div>
      {!isLocked && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setResult(1, 0)}
          >
            1 – 0 ({match.teamA} Wins)
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setResult(0.5, 0.5)}
          >
            0.5 – 0.5 (Draw)
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setResult(0, 1)}
          >
            0 – 1 ({match.teamB} Wins)
          </button>
        </div>
      )}
    </div>
  );
}

// 5. Cheerdance Desk (Judged criteria sheet with totals)
function CheerdanceScoringDesk({ editA, editB, setEditA, setEditB, isLocked, onQuickSave }: ScoringProps) {
  const [techA, setTechA] = useState(24);
  const [syncA, setSyncA] = useState(23);
  const [techB, setTechB] = useState(22);
  const [syncB, setSyncB] = useState(21);

  const calculateScores = () => {
    const totalA = techA + syncA + 37;
    const totalB = techB + syncB + 35;
    setEditA(totalA);
    setEditB(totalB);
    onQuickSave(totalA, totalB);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Judged Criteria: Technique (25), Sync (25), Choreography (20), Difficulty (20), Execution (10)
      </div>
      {!isLocked && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
            <span>Technique: <button type="button" className="btn btn-xs btn-ghost" onClick={() => setTechA(t => Math.min(25, t + 1))}>A: {techA}</button></span>
            <span>Sync: <button type="button" className="btn btn-xs btn-ghost" onClick={() => setSyncA(s => Math.min(25, s + 1))}>A: {syncA}</button></span>
            <span>Technique: <button type="button" className="btn btn-xs btn-ghost" onClick={() => setTechB(t => Math.min(25, t + 1))}>B: {techB}</button></span>
            <span>Sync: <button type="button" className="btn btn-xs btn-ghost" onClick={() => setSyncB(s => Math.min(25, s + 1))}>B: {syncB}</button></span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={calculateScores}
          >
            Recalculate Judges Total ({editA} vs {editB})
          </button>
        </div>
      )}
    </div>
  );
}

// 6. Esports Desk (Mobile Legends & Valorant)
function EsportsScoringDesk({ match, editA, editB, setEditA, setEditB, isLocked, onQuickSave }: ScoringProps) {
  const addMap = (team: 'A' | 'B') => {
    if (isLocked) return;
    if (team === 'A') {
      const next = editA + 1;
      setEditA(next);
      onQuickSave(next, editB);
    } else {
      const next = editB + 1;
      setEditB(next);
      onQuickSave(editA, next);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Competitive Esports · Map & Round Progression
      </div>
      {!isLocked && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => addMap('A')}>
            +1 Map ({match.teamA})
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => addMap('B')}>
            +1 Map ({match.teamB})
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MATCH CARD COMPONENT
// ─────────────────────────────────────────────────────────────
function MatchCard({ match }: { match: Match }) {
  const { updateMatchScore, finishMatch, startMatch, reopenMatch, currentUser } = useApp();
  const [editA, setEditA] = useState(match.scoreA);
  const [editB, setEditB] = useState(match.scoreB);
  const [isSaved, setIsSaved] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineEntry[]>(loadQueue);

  const isDirector = currentUser?.role === 'director';
  const isCoordinator = currentUser?.role === 'coordinator';
  const canReopen = isDirector || isCoordinator;
  const isLocked = match.status === 'finished';

  useEffect(() => {
    setEditA(match.scoreA);
    setEditB(match.scoreB);
  }, [match.scoreA, match.scoreB]);

  useEffect(() => {
    const goOnline = () => { setIsOffline(false); syncQueue(); };
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const syncQueue = () => {
    const q = loadQueue();
    const myEntries = q.filter(e => e.matchId === match.id);
    if (myEntries.length) {
      const last = myEntries[myEntries.length - 1];
      updateMatchScore(last.matchId, last.scoreA, last.scoreB);
      const remaining = q.filter(e => e.matchId !== match.id);
      saveQueue(remaining);
      setOfflineQueue(remaining);
    }
  };

  const handleSave = () => {
    if (isOffline) {
      const entry: OfflineEntry = { matchId: match.id, scoreA: editA, scoreB: editB, ts: Date.now() };
      const q = [...offlineQueue.filter(e => e.matchId !== match.id), entry];
      saveQueue(q);
      setOfflineQueue(q);
    } else {
      updateMatchScore(match.id, editA, editB);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleQuickSave = (scoreA: number, scoreB: number) => {
    if (!isOffline) {
      updateMatchScore(match.id, scoreA, scoreB);
    }
  };

  // Select sport scoring desk
  const renderSportDesk = () => {
    const sportName = getSportName(match.sport).toLowerCase();
    const props: ScoringProps = {
      match,
      editA,
      editB,
      setEditA,
      setEditB,
      isLocked,
      onQuickSave: handleQuickSave,
    };

    if (sportName.includes('basketball')) return <BasketballScoringDesk {...props} />;
    if (sportName.includes('volleyball')) return <VolleyballScoringDesk {...props} />;
    if (sportName.includes('badminton') || sportName.includes('table tennis')) return <RacquetScoringDesk {...props} />;
    if (sportName.includes('chess')) return <ChessScoringDesk {...props} />;
    if (sportName.includes('cheer')) return <CheerdanceScoringDesk {...props} />;
    if (sportName.includes('legends') || sportName.includes('dota') || sportName.includes('valorant')) return <EsportsScoringDesk {...props} />;
    return <BasketballScoringDesk {...props} />;
  };

  return (
    <div className="match-card glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Offline Alert */}
      {isOffline && (
        <div style={{
          background: 'var(--badge-warn-bg)',
          border: '1px solid var(--badge-warn-border)',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '12px',
          color: 'var(--badge-warn-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>Offline — Saved locally</span>
          {offlineQueue.some(e => e.matchId === match.id) && (
            <span style={{ fontWeight: 700, fontSize: '10px' }}>PENDING SYNC</span>
          )}
        </div>
      )}

      {/* Conflict Alert Warning */}
      {match.conflictWarning && (
        <div style={{
          background: '#ef444415',
          border: '1px solid #ef444440',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#ef4444',
          fontWeight: 600,
        }}>
          ⚠️ {match.conflictWarning}
        </div>
      )}

      {/* Header */}
      <div className="match-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getSportIcon(match.sport, 16, 'var(--accent)')}
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              {getSportName(match.sport)}
            </span>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {match.round}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isLocked && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#94a3b8',
              background: 'rgba(255,255,255,0.08)',
              padding: '2px 8px',
              borderRadius: '12px',
            }}>
              <LockIcon size={12} /> Locked
            </span>
          )}
          <span className={`status-badge ${match.status}`}>
            {match.status === 'live' && <span className="live-dot" />}
            {match.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Meta venue & officials */}
      <div className="match-meta" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPinIcon size={13} /> {match.venue}
        </span>
        {match.scorekeeper && (
          <span>Official Scorer: <strong>{match.scorekeeper}</strong></span>
        )}
      </div>

      {/* Main Score Box */}
      <div className="match-score-row">
        {/* Team A */}
        <div className="team-block">
          <div className="team-name" style={{ color: match.winner === match.teamA ? 'var(--accent)' : 'inherit', fontWeight: 700 }}>
            {match.teamA}
          </div>
          {!isLocked ? (
            <input
              className="score-input"
              type="number"
              min={0}
              value={editA}
              onChange={e => setEditA(Number(e.target.value))}
              disabled={match.status === 'scheduled'}
            />
          ) : (
            <div className="score-display">{match.scoreA}</div>
          )}
        </div>

        <div className="vs-divider">VS</div>

        {/* Team B */}
        <div className="team-block" style={{ textAlign: 'right' }}>
          <div className="team-name" style={{ color: match.winner === match.teamB ? 'var(--accent)' : 'inherit', fontWeight: 700 }}>
            {match.teamB}
          </div>
          {!isLocked ? (
            <input
              className="score-input"
              type="number"
              min={0}
              value={editB}
              onChange={e => setEditB(Number(e.target.value))}
              disabled={match.status === 'scheduled'}
            />
          ) : (
            <div className="score-display">{match.scoreB}</div>
          )}
        </div>
      </div>

      {/* Sport-Specific Scoring Desk */}
      {renderSportDesk()}

      {/* Winner Display */}
      {match.winner && (
        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--accent)',
          background: 'var(--accent-subtle)',
          padding: '8px',
          borderRadius: '8px',
        }}>
          Winner: {match.winner}
        </div>
      )}

      {/* Action Buttons */}
      <div className="match-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
        {match.status === 'scheduled' && (
          <button className="btn btn-sm btn-primary" onClick={() => startMatch(match.id)}>
            Start Match
          </button>
        )}

        {!isLocked && match.status === 'live' && (
          <>
            <button className="btn btn-sm btn-ghost" onClick={handleSave}>
              {isSaved ? <CheckIcon size={14} color="#10b981" /> : null}
              <span>{isSaved ? 'Saved' : 'Save Score'}</span>
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => finishMatch(match.id)}>
              Finalize & Lock Match
            </button>
          </>
        )}

        {/* Reopen finished match (Director / Coordinator only) */}
        {isLocked && canReopen && (
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => reopenMatch(match.id)}
            style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            Reopen Match
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCOREKEEPER DASHBOARD MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function ScorekeeperDashboard() {
  const { matches, officials, currentUser, assignMatchOfficials } = useApp();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');

  // Scorer assignment state for Director/Coordinator
  const isDirector = currentUser?.role === 'director';
  const isCoordinator = currentUser?.role === 'coordinator';
  const canAssign = isDirector || isCoordinator;

  const [assignmentModalMatch, setAssignmentModalMatch] = useState<Match | null>(null);
  const [selectedScorerName, setSelectedScorerName] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Find official record for current scorer
  const myOfficial = officials.find(o =>
    o.role === 'scorekeeper' && (
      o.name.toLowerCase() === currentUser?.name.toLowerCase() ||
      o.contact?.toLowerCase() === currentUser?.email?.toLowerCase()
    )
  );

  // Filter matches based on role:
  // - Director/Coordinator see all matches
  // - Official scorer only sees matches in their assigned sports
  const filteredMatches = matches.filter(m => {
    if (selectedSportFilter !== 'all' && m.sport !== selectedSportFilter) return false;

    if (canAssign) return true;

    // Scorer restriction
    if (!myOfficial?.sport || myOfficial.sport === 'All Sports') return true;
    const officialSport = myOfficial.sport.toLowerCase();
    const matchSport = getSportName(m.sport).toLowerCase();
    return matchSport === officialSport || m.sport.toLowerCase() === officialSport;
  });

  const activeMatches = filteredMatches.filter(m => m.status !== 'finished');
  const completedMatches = filteredMatches.filter(m => m.status === 'finished');

  const availableScorekeepers = officials.filter(o => o.role === 'scorekeeper');

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentModalMatch) return;
    assignMatchOfficials(assignmentModalMatch.id, {
      scorekeeper: selectedScorerName,
    });
    setAssignmentModalMatch(null);
  };

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="brand-pill-tag">Officiating Panel</div>
          <h1 className="page-title">Scoring Desk</h1>
          <p className="page-desc">Record, verify, and broadcast sport-specific scores in real-time</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            background: isOnline ? 'var(--badge-live-bg)' : 'var(--badge-warn-bg)',
            color: isOnline ? 'var(--badge-live-text)' : 'var(--badge-warn-text)',
            border: `1px solid ${isOnline ? 'var(--badge-live-border)' : 'var(--badge-warn-border)'}`,
          }}>
            {isOnline ? '● Online' : '○ Offline Mode'}
          </div>
          <div className="badge-chip">
            <span className="live-dot" />
            <span>{activeMatches.filter(m => m.status === 'live').length} Active Live</span>
          </div>
        </div>
      </div>

      {/* Scorer Notice for non-directors */}
      {!canAssign && myOfficial && (
        <div className="glass-card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldIcon size={16} color="var(--accent)" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Signed in as <strong>{myOfficial.name}</strong> · Assigned Sport: <strong>{myOfficial.sport}</strong> (Viewing matches in your assigned discipline)
          </span>
        </div>
      )}

      {/* Sport Filter Tabs */}
      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
          <button
            className={`btn btn-sm ${selectedSportFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedSportFilter('all')}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '12.5px', fontWeight: 600 }}
          >
            All Assigned Matches ({matches.length})
          </button>
          {SPORTS_CATALOG.map(sp => {
            const count = matches.filter(m => m.sport === sp.id).length;
            const isSelected = selectedSportFilter === sp.id;
            return (
              <button
                key={sp.id}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedSportFilter(sp.id)}
                style={{
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{getSportIcon(sp.id, 14, isSelected ? '#fff' : 'var(--text-muted)')}</span>
                <span>{sp.name}</span>
                <span style={{
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active & Scheduled Matches ── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            <FlameIcon size={18} color="var(--accent)" />
            <span>Active & Scheduled Matches ({activeMatches.length})</span>
          </h2>
        </div>

        {activeMatches.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            No active or scheduled matches found.
          </div>
        ) : (
          <div className="match-grid">
            {activeMatches.map(m => (
              <div key={m.id} style={{ position: 'relative' }}>
                <MatchCard match={m} />
                {canAssign && (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => {
                      setAssignmentModalMatch(m);
                      setSelectedScorerName(m.scorekeeper || '');
                    }}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      fontSize: '11px',
                      padding: '2px 8px',
                    }}
                  >
                    Assign Scorer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Completed Matches ── */}
      <section style={{ marginTop: '20px' }}>
        <h2 className="section-title">
          <CheckIcon size={18} color="var(--text-muted)" />
          <span>Completed & Finalized Matches ({completedMatches.length})</span>
        </h2>

        {completedMatches.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: '30px', textAlign: 'center' }}>
            No completed matches yet.
          </div>
        ) : (
          <div className="match-grid">
            {completedMatches.map(m => (
              <div key={m.id} style={{ position: 'relative' }}>
                <MatchCard match={m} />
                {canAssign && (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => {
                      setAssignmentModalMatch(m);
                      setSelectedScorerName(m.scorekeeper || '');
                    }}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      fontSize: '11px',
                      padding: '2px 8px',
                    }}
                  >
                    Assign Scorer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Scorer Assignment Modal (Director/Coordinator only) ── */}
      {assignmentModalMatch && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            background: 'var(--bg-card)',
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
              Assign Official Scorer
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Match: <strong>{assignmentModalMatch.teamA} vs {assignmentModalMatch.teamB}</strong> ({getSportName(assignmentModalMatch.sport)})
            </p>

            <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Certified Scorekeeper
                </label>
                <select
                  className="form-input"
                  value={selectedScorerName}
                  onChange={e => setSelectedScorerName(e.target.value)}
                  required
                >
                  <option value="">Choose an Official Scorekeeper...</option>
                  {availableScorekeepers.map(o => (
                    <option key={o.id} value={o.name}>
                      {o.name} ({o.sport})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setAssignmentModalMatch(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
