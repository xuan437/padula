import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName, getSportIcon } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import {
  getSportFoulRules,
  getPlayerTotalFouls,
  getPlayerFoulBreakdown,
  getPlayerRosterStatus,
} from '../lib/fouls';
import { MapPinIcon, CheckIcon, FlameIcon, LockIcon, CalendarIcon, AlertTriangleIcon, UsersIcon, PlusIcon } from '../components/Icons';
import type { Match, GameOfficial, Player, PlayerRosterStatus } from '../types';

// ─────────────────────────────────────────────────────────────
// OFFLINE QUEUE
// ─────────────────────────────────────────────────────────────
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
  try {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
  } catch {
    /* storage full or blocked: scores still live in component state */
  }
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

// ─────────────────────────────────────────────────────────────
// SPORT SPECIFIC SCORING DESKS
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

function makeAdjuster({ editA, editB, setEditA, setEditB, isLocked, onQuickSave }: ScoringProps) {
  return (team: 'A' | 'B', delta: number) => {
    if (isLocked) return;
    const a = team === 'A' ? Math.max(0, editA + delta) : editA;
    const b = team === 'B' ? Math.max(0, editB + delta) : editB;
    setEditA(a);
    setEditB(b);
    onQuickSave(a, b);
  };
}

function TeamButtons({ title, steps, onAdjust, children }: {
  title: string;
  steps: number[];
  onAdjust: (delta: number) => void;
  children?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
      <div
        title={title}
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginBottom: '6px',
          textAlign: 'center',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {steps.map(d => (
          <button
            key={d}
            type="button"
            className={`btn btn-sm ${d > 0 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onAdjust(d)}
            style={{
              minHeight: '50px',
              minWidth: d < 0 ? '58px' : '50px',
              fontSize: d < 0 ? '12px' : '16px',
              fontWeight: 800,
              padding: '6px 12px',
              borderRadius: '10px',
            }}
          >
            {d === -1 ? 'Undo' : d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

// Basketball: primary scoring + next period upfront; secondary actions (fouls/timeouts/subs) collapsible
function BasketballScoringDesk(props: ScoringProps) {
  const { match, isLocked } = props;
  const adjust = makeAdjuster(props);
  const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'] as const;
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT'>('Q1');
  const [foulsA, setFoulsA] = useState(0);
  const [foulsB, setFoulsB] = useState(0);
  const [timeoutsA, setTimeoutsA] = useState(0);
  const [timeoutsB, setTimeoutsB] = useState(0);
  const [subsA, setSubsA] = useState(0);
  const [subsB, setSubsB] = useState(0);
  const [showSecondary, setShowSecondary] = useState(false);

  const nextPeriod = () => {
    const idx = periods.indexOf(quarter);
    if (idx < periods.length - 1) setQuarter(periods[idx + 1]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {periods.map(q => (
          <button
            key={q}
            type="button"
            className={`btn btn-sm ${quarter === q ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setQuarter(q)}
            style={{ padding: '5px 11px', fontSize: '11.5px', borderRadius: '14px', minHeight: '34px' }}
          >
            {q}
          </button>
        ))}
        {!isLocked && quarter !== 'OT' && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={nextPeriod}
            style={{ padding: '5px 12px', fontSize: '11.5px', fontWeight: 700, borderRadius: '14px', minHeight: '34px' }}
          >
            Next Period →
          </button>
        )}
      </div>

      {!isLocked && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <TeamButtons title={`${match.teamA}`} steps={[-1, 1, 2, 3]} onAdjust={d => adjust('A', d)} />
          <TeamButtons title={`${match.teamB}`} steps={[-1, 1, 2, 3]} onAdjust={d => adjust('B', d)} />
        </div>
      )}

      {!isLocked && (
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={() => setShowSecondary(s => !s)}
            style={{ width: '100%', justifyContent: 'center', fontSize: '11.5px', fontWeight: 700 }}
          >
            {showSecondary ? '▾ Hide Secondary Controls (Fouls / Timeouts / Substitutions)' : '▸ Secondary Controls (Fouls / Timeouts / Substitutions)'}
          </button>
          {showSecondary && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px', padding: '10px', borderRadius: '8px', background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ fontWeight: 700, textAlign: 'center' }}>{match.teamA}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Fouls: <strong>{foulsA}</strong></span>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => setFoulsA(f => f + 1)}>+Foul</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Timeouts: <strong>{timeoutsA}</strong></span>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => setTimeoutsA(t => t + 1)}>+Timeout</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Substitutions: <strong>{subsA}</strong></span>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => setSubsA(s => s + 1)}>+Sub</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ fontWeight: 700, textAlign: 'center' }}>{match.teamB}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Fouls: <strong>{foulsB}</strong></span>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => setFoulsB(f => f + 1)}>+Foul</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Timeouts: <strong>{timeoutsB}</strong></span>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => setTimeoutsB(t => t + 1)}>+Timeout</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Substitutions: <strong>{subsB}</strong></span>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => setSubsB(s => s + 1)}>+Sub</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Volleyball, badminton, table tennis, sepak takraw:
// the match score is GAMES (or sets) WON, so the bracket winner is correct.
interface GamesConfig {
  keyword: string;
  pointsToWin: number;
  bestOf: number;
  decidingPoints?: number; // e.g. 15 in a deciding volleyball set
  cap?: number;            // e.g. 30 in badminton
}

// Default rules. Confirm these with your sports director.
const GAMES_CONFIG: GamesConfig[] = [
  { keyword: 'volleyball', pointsToWin: 25, bestOf: 5, decidingPoints: 15 },
  { keyword: 'badminton', pointsToWin: 21, bestOf: 3, cap: 30 },
  { keyword: 'table tennis', pointsToWin: 11, bestOf: 5 },
  { keyword: 'sepak takraw', pointsToWin: 21, bestOf: 3 },
];

function GamesDesk(props: ScoringProps & GamesConfig) {
  const { match, editA, editB, setEditA, setEditB, isLocked, onQuickSave, pointsToWin, bestOf, decidingPoints, cap } = props;
  const [ptsA, setPtsA] = useState(0);
  const [ptsB, setPtsB] = useState(0);
  const [history, setHistory] = useState<{ a: number; b: number }[]>([]);

  const gamesToWin = Math.ceil(bestOf / 2);
  const isDeciding = editA === gamesToWin - 1 && editB === gamesToWin - 1;
  const target = isDeciding && decidingPoints ? decidingPoints : pointsToWin;
  const matchOver = editA >= gamesToWin || editB >= gamesToWin;

  const gameWinner = (a: number, b: number): 'A' | 'B' | null => {
    const reached = a >= target || b >= target;
    const clear = Math.abs(a - b) >= 2 || (cap !== undefined && (a >= cap || b >= cap));
    return reached && clear ? (a > b ? 'A' : 'B') : null;
  };

  const addPoint = (team: 'A' | 'B') => {
    if (isLocked || matchOver) return;
    const a = ptsA + (team === 'A' ? 1 : 0);
    const b = ptsB + (team === 'B' ? 1 : 0);
    const winner = gameWinner(a, b);
    if (winner) {
      const nextA = editA + (winner === 'A' ? 1 : 0);
      const nextB = editB + (winner === 'B' ? 1 : 0);
      setHistory(h => [...h, { a, b }]);
      setPtsA(0);
      setPtsB(0);
      setEditA(nextA);
      setEditB(nextB);
      onQuickSave(nextA, nextB);
    } else {
      setPtsA(a);
      setPtsB(b);
    }
  };

  const removePoint = (team: 'A' | 'B') => {
    if (isLocked) return;
    if (team === 'A') setPtsA(p => Math.max(0, p - 1));
    else setPtsB(p => Math.max(0, p - 1));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
          Best of {bestOf} · {target} pts, win by 2 · Games won: {editA} – {editB}
        </div>
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            {history.map((g, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>G{i + 1}: </span>
                <strong>{g.a} - {g.b}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLocked && (
        matchOver ? (
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Match decided. Review the score, then finalize.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {([['A', match.teamA, ptsA], ['B', match.teamB, ptsB]] as const).map(([team, name, pts]) => (
              <div key={team} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{name}</div>
                <div style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0' }}>{pts}</div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => removePoint(team)}>-1</button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => addPoint(team)}>+1 Pt</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// Chess: Win / Draw / Loss
function ChessScoringDesk({ match, setEditA, setEditB, isLocked, onQuickSave }: ScoringProps) {
  const setResult = (a: number, b: number) => {
    if (isLocked) return;
    setEditA(a);
    setEditB(b);
    onQuickSave(a, b);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        1 Pt (Win), 0.5 Pt (Draw), 0 Pt (Loss). A drawn knockout needs a tiebreak game recorded as 1–0.
      </div>
      {!isLocked && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setResult(1, 0)}>1 – 0 ({match.teamA} Wins)</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setResult(0.5, 0.5)}>0.5 – 0.5 (Draw)</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setResult(0, 1)}>0 – 1 ({match.teamB} Wins)</button>
        </div>
      )}
    </div>
  );
}

// Cheerdance: judged sport. Enter each team's total in the score boxes above.
function CheerdanceScoringDesk() {
  return (
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
      Judged sport: enter each team's total from the judges' sheet in the score boxes above.
    </div>
  );
}

// Esports (maps won) and every other sport (points / goals)
function SimpleDesk(props: ScoringProps & { label: string }) {
  const { match, isLocked, label } = props;
  const adjust = makeAdjuster(props);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>{label}</div>
      {!isLocked && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <TeamButtons title={match.teamA} steps={[-1, 1]} onAdjust={d => adjust('A', d)} />
          <TeamButtons title={match.teamB} steps={[-1, 1]} onAdjust={d => adjust('B', d)} />
        </div>
      )}
    </div>
  );
}

function SportDesk(props: ScoringProps) {
  const name = getSportName(props.match.sport).toLowerCase();
  const games = GAMES_CONFIG.find(c => name.includes(c.keyword));
  if (games) return <GamesDesk {...props} {...games} />;
  if (name.includes('basketball')) return <BasketballScoringDesk {...props} />;
  if (name.includes('chess')) return <ChessScoringDesk {...props} />;
  if (name.includes('cheer')) return <CheerdanceScoringDesk />;
  if (name.includes('legends') || name.includes('dota') || name.includes('valorant')) {
    return <SimpleDesk {...props} label="Esports · Maps won" />;
  }
  return <SimpleDesk {...props} label="Points / Goals" />;
}

// ─────────────────────────────────────────────────────────────
// MATCH PLAYER LINEUP (IN PLAY / RESERVED) & ALL FOULS PANEL
// ─────────────────────────────────────────────────────────────
function MatchPlayerLineupAndFoulsPanel({
  match,
  isLocked,
  canEdit,
}: {
  match: Match;
  isLocked: boolean;
  canEdit: boolean;
}) {
  const {
    players,
    teams,
    departments,
    recordPlayerFoul,
    togglePlayerRosterStatus,
    registerPlayer,
  } = useApp();

  const [isOpen, setIsOpen] = useState(match.status === 'live');
  const [addingForSide, setAddingForSide] = useState<'A' | 'B' | null>(null);
  const [quickName, setQuickName] = useState('');
  const [quickJersey, setQuickJersey] = useState('');
  const [quickPosition, setQuickPosition] = useState('');
  const [quickStatus, setQuickStatus] = useState<PlayerRosterStatus>('in_play');

  const foulRules = useMemo(() => getSportFoulRules(match.sport), [match.sport]);

  const teamAObj = useMemo(
    () => teams.find(t => t.name.toLowerCase() === (match.teamA || '').toLowerCase() && (t.sport === match.sport || getSportName(t.sport) === getSportName(match.sport))) ||
          teams.find(t => t.name.toLowerCase() === (match.teamA || '').toLowerCase()),
    [teams, match.teamA, match.sport]
  );

  const teamBObj = useMemo(
    () => teams.find(t => t.name.toLowerCase() === (match.teamB || '').toLowerCase() && (t.sport === match.sport || getSportName(t.sport) === getSportName(match.sport))) ||
          teams.find(t => t.name.toLowerCase() === (match.teamB || '').toLowerCase()),
    [teams, match.teamB, match.sport]
  );

  const getTeamRoster = useCallback(
    (teamObj: typeof teamAObj, fallbackName: string): Player[] => {
      if (!teamObj && isPlaceholder(fallbackName)) return [];
      return players.filter(p => {
        if (teamObj && p.teamId === teamObj.id) return true;
        if (teamObj && (teamObj.players || []).includes(p.id)) return true;
        return false;
      });
    },
    [players]
  );

  const rosterA = useMemo(() => getTeamRoster(teamAObj, match.teamA), [getTeamRoster, teamAObj, match.teamA]);
  const rosterB = useMemo(() => getTeamRoster(teamBObj, match.teamB), [getTeamRoster, teamBObj, match.teamB]);

  const getEffectiveStatus = (p: Player): PlayerRosterStatus => {
    const matchOverride = match.playerLineupStatus?.[p.id];
    if (matchOverride) return matchOverride;
    return getPlayerRosterStatus(p);
  };

  const getEffectivePlayerFouls = (p: Player) => {
    const matchFoulRecord = match.playerMatchFouls?.[p.id];
    const seasonBreakdown = getPlayerFoulBreakdown(p);
    const seasonTotal = getPlayerTotalFouls(p);
    if (matchFoulRecord) {
      return {
        matchTotal: matchFoulRecord.total,
        seasonTotal,
        breakdown: { ...seasonBreakdown, ...matchFoulRecord.breakdown },
      };
    }
    return {
      matchTotal: seasonTotal,
      seasonTotal,
      breakdown: seasonBreakdown,
    };
  };

  const totalFoulsTeamA = useMemo(
    () => rosterA.reduce((sum, p) => sum + getEffectivePlayerFouls(p).matchTotal, 0),
    [rosterA, match.playerMatchFouls]
  );
  const totalFoulsTeamB = useMemo(
    () => rosterB.reduce((sum, p) => sum + getEffectivePlayerFouls(p).matchTotal, 0),
    [rosterB, match.playerMatchFouls]
  );

  const handleQuickAddPlayer = (side: 'A' | 'B') => {
    const targetTeam = side === 'A' ? teamAObj : teamBObj;
    if (!quickName.trim()) return;
    registerPlayer({
      name: quickName.trim(),
      studentId: `2026-${Math.floor(100 + Math.random() * 900)}`,
      department: targetTeam?.department || departments[0]?.id || 'd1',
      sport: match.sport,
      teamId: targetTeam?.id,
      jerseyNumber: quickJersey.trim() || String(Math.floor(1 + Math.random() * 98)),
      position: quickPosition.trim() || 'Athlete',
      medicalCleared: true,
      rosterStatus: quickStatus,
      fouls: 0,
      foulBreakdown: {},
      isActive: true,
    });
    setQuickName('');
    setQuickJersey('');
    setQuickPosition('');
    setAddingForSide(null);
  };

  const renderTeamColumn = (side: 'A' | 'B', teamName: string, roster: Player[], totalTeamFouls: number) => {
    const inPlayPlayers = roster.filter(p => getEffectiveStatus(p) === 'in_play');
    const reservedPlayers = roster.filter(p => getEffectiveStatus(p) === 'reserved');

    const renderPlayerCard = (p: Player, status: PlayerRosterStatus) => {
      const foulData = getEffectivePlayerFouls(p);
      const isFouledOut = Boolean(
        (foulRules.foulOutLimit && foulData.matchTotal >= foulRules.foulOutLimit) ||
        (foulData.breakdown['Red Card'] || 0) > 0 ||
        (foulData.breakdown['Red Card Penalty'] || 0) > 0 ||
        (foulData.breakdown['Fault Card (Red)'] || 0) > 0
      );
      const activeFoulTypes = Object.entries(foulData.breakdown).filter(([, count]) => count > 0);

      return (
        <div
          key={p.id}
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            background: 'var(--bg-surface)',
            border: isFouledOut
              ? '1.5px solid #ef4444'
              : status === 'in_play'
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  fontFamily: 'monospace',
                }}
              >
                #{p.jerseyNumber}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              {p.position && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  ({p.position})
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: isFouledOut
                    ? 'rgba(239, 68, 68, 0.16)'
                    : foulData.matchTotal > 0
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'var(--bg-elevated)',
                  color: isFouledOut ? '#ef4444' : foulData.matchTotal > 0 ? '#f59e0b' : 'var(--text-muted)',
                  border: isFouledOut
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : foulData.matchTotal > 0
                    ? '1px solid rgba(245, 158, 11, 0.35)'
                    : '1px solid var(--border-light)',
                }}
              >
                {foulData.matchTotal} Foul{foulData.matchTotal === 1 ? '' : 's'}
                {isFouledOut ? ` · ${foulRules.foulOutLabel || 'FOULED OUT'}` : ''}
              </span>

              {!isLocked && canEdit && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => togglePlayerRosterStatus(p.id, status === 'in_play' ? 'reserved' : 'in_play', match.id)}
                  title={status === 'in_play' ? 'Move player to Reserved (Bench)' : 'Substitute player In Play (On Court)'}
                  style={{
                    fontSize: '10px',
                    padding: '2px 7px',
                    color: status === 'in_play' ? '#f59e0b' : '#10b981',
                    borderColor: status === 'in_play' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {status === 'in_play' ? '⇄ Move to Reserved' : '⇄ Sub In Play'}
                </button>
              )}
            </div>
          </div>

          {/* Breakdown of recorded fouls on this player */}
          {activeFoulTypes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {activeFoulTypes.map(([fType, count]) => (
                <span
                  key={fType}
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1.5px 6px',
                    borderRadius: '4px',
                    background: fType.toLowerCase().includes('red')
                      ? 'rgba(239, 68, 68, 0.16)'
                      : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                      ? 'rgba(245, 158, 11, 0.16)'
                      : 'rgba(56, 189, 248, 0.12)',
                    color: fType.toLowerCase().includes('red')
                      ? '#ef4444'
                      : fType.toLowerCase().includes('yellow') || fType.toLowerCase().includes('technical')
                      ? '#f59e0b'
                      : '#38bdf8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{fType}: {count}</span>
                  {!isLocked && canEdit && (
                    <button
                      type="button"
                      onClick={() => recordPlayerFoul(p.id, fType, -1, match.id)}
                      title={`Remove 1 ${fType}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontWeight: 900,
                        fontSize: '10px',
                        padding: '0 2px',
                        lineHeight: 1,
                      }}
                    >
                      −
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* All Foul Buttons for this game's sport */}
          {!isLocked && canEdit && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingTop: '2px' }}>
              {foulRules.types.map(ft => (
                <button
                  key={ft.id}
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => recordPlayerFoul(p.id, ft.id, 1, match.id)}
                  title={`Record ${ft.label} on #${p.jerseyNumber} ${p.name}`}
                  style={{
                    fontSize: '9.5px',
                    padding: '2px 6px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    color:
                      ft.severity === 'severe'
                        ? '#ef4444'
                        : ft.severity === 'warning'
                        ? '#f59e0b'
                        : 'var(--text-secondary)',
                  }}
                >
                  +{ft.shortLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '10px',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
          <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text-primary)' }}>
            {teamName || `Team ${side}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#f59e0b' }}>
              Team Fouls: {totalTeamFouls}
            </span>
            {!isLocked && canEdit && (
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => setAddingForSide(prev => (prev === side ? null : side))}
                style={{ fontSize: '10px', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                <PlusIcon size={10} />
                <span>Player</span>
              </button>
            )}
          </div>
        </div>

        {addingForSide === side && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Add Player to {teamName} Roster
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '65px 1fr', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Jersey #"
                value={quickJersey}
                onChange={e => setQuickJersey(e.target.value)}
                style={{ fontSize: '11px', padding: '4px 6px' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Player Full Name"
                value={quickName}
                onChange={e => setQuickName(e.target.value)}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Position"
                value={quickPosition}
                onChange={e => setQuickPosition(e.target.value)}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              />
              <select
                className="form-input"
                value={quickStatus}
                onChange={e => setQuickStatus(e.target.value as PlayerRosterStatus)}
                style={{ fontSize: '11px', padding: '4px 6px' }}
              >
                <option value="in_play">In Play (Active)</option>
                <option value="reserved">Reserved (Bench)</option>
              </select>
              <button
                type="button"
                className="btn btn-xs btn-primary"
                onClick={() => handleQuickAddPlayer(side)}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* IN PLAY SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>● In Play (On Court / Active)</span>
            <span>{inPlayPlayers.length}</span>
          </div>
          {inPlayPlayers.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
              No players currently marked In Play.
            </div>
          ) : (
            inPlayPlayers.map(p => renderPlayerCard(p, 'in_play'))
          )}
        </div>

        {/* RESERVED SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>◐ Reserved (Bench / Substitutes)</span>
            <span>{reservedPlayers.length}</span>
          </div>
          {reservedPlayers.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: '6px', textAlign: 'center' }}>
              No reserved bench players.
            </div>
          ) : (
            reservedPlayers.map(p => renderPlayerCard(p, 'reserved'))
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button
        type="button"
        className="btn btn-xs btn-outline"
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '100%',
          justifyContent: 'space-between',
          padding: '7px 12px',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          borderRadius: '8px',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <UsersIcon size={13} color="var(--accent)" />
          <span>
            Players In Play / Reserved &amp; All Game Fouls ({rosterA.length + rosterB.length} Athletes · Fouls: {totalFoulsTeamA}–{totalFoulsTeamB})
          </span>
        </span>
        <span>{isOpen ? 'Hide ▴' : 'Manage Lineup & Fouls ▾'}</span>
      </button>

      {isOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          {renderTeamColumn('A', match.teamA, rosterA, totalFoulsTeamA)}
          {renderTeamColumn('B', match.teamB, rosterB, totalFoulsTeamB)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MATCH CARD
// ─────────────────────────────────────────────────────────────
function MatchCard({ match, queue, enqueue, onAssignScorer, canAssign }: {
  match: Match;
  queue: OfflineEntry[];
  enqueue: (e: OfflineEntry) => void;
  onAssignScorer?: (m: Match) => void;
  canAssign?: boolean;
}) {
  const { matches, teams, venues, assignMatchOfficials, updateMatchScore, finishMatch, advanceTeamToBracketSlot, startMatch, reopenMatch, currentUser } = useApp();
  const isOnline = useOnlineStatus();

  const [editA, setEditA] = useState(match.scoreA);
  const [editB, setEditB] = useState(match.scoreB);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [advanceNotice, setAdvanceNotice] = useState('');

  // Available next-round bracket slots in the same sport for Scorekeeper advancement decision
  const candidateTargets = useMemo(() => {
    const sportNameLower = getSportName(match.sport).toLowerCase();
    return matches
      .filter(m =>
        m.id !== match.id &&
        m.status === 'scheduled' &&
        (m.sport === match.sport || getSportName(m.sport).toLowerCase() === sportNameLower)
      )
      .sort((a, b) => (a.roundNumber ?? 1) - (b.roundNumber ?? 1) || (a.slot ?? 1) - (b.slot ?? 1));
  }, [matches, match.id, match.sport]);

  const [selectedAdvanceTarget, setSelectedAdvanceTarget] = useState<string>(() => {
    if (match.nextMatchId && match.nextSlot) {
      return `${match.nextMatchId}:${match.nextSlot}`;
    }
    return 'none';
  });

  useEffect(() => {
    if (match.nextMatchId && match.nextSlot) {
      setSelectedAdvanceTarget(`${match.nextMatchId}:${match.nextSlot}`);
    } else {
      setSelectedAdvanceTarget('none');
    }
  }, [match.nextMatchId, match.nextSlot]);

  // Registered teams & previous round winners for manual slot placement
  const selectableTeams = useMemo(() => {
    const sportNameLower = getSportName(match.sport).toLowerCase();
    const regNames = teams
      .filter(t => t.isActive !== false && (t.sport === match.sport || getSportName(t.sport).toLowerCase() === sportNameLower))
      .map(t => t.name);
    const matchTeamNames = matches
      .filter(m => m.sport === match.sport || getSportName(m.sport).toLowerCase() === sportNameLower)
      .flatMap(m => [m.teamA, m.teamB, m.winner].filter((n): n is string => !!n && !isPlaceholder(n)));
    return Array.from(new Set([...regNames, ...matchTeamNames]));
  }, [teams, matches, match.sport]);

  const canReopen = currentUser?.role === 'scorer' || currentUser?.role === 'director' || currentUser?.role === 'coordinator';
  const isLocked = match.status === 'finished';
  const isTBD = isPlaceholder(match.teamA) || isPlaceholder(match.teamB);
  const isChess = getSportName(match.sport).toLowerCase().includes('chess');
  const hasPending = queue.some(e => e.matchId === match.id);

  useEffect(() => {
    setEditA(match.scoreA);
    setEditB(match.scoreB);
  }, [match.scoreA, match.scoreB]);

  // Save online, or queue when offline
  const commit = (a: number, b: number) => {
    if (isOnline) updateMatchScore(match.id, a, b);
    else enqueue({ matchId: match.id, scoreA: a, scoreB: b, ts: Date.now() });
  };

  const handleSave = () => {
    commit(editA, editB);
    setError('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const isAssignedToMe = Boolean(
    (match.scorekeeper &&
      currentUser?.name &&
      match.scorekeeper.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
    (!match.scorekeeper || match.scorekeeper === 'Unassigned') ||
    currentUser?.role === 'scorer'
  );
  const canOverride = currentUser?.role === 'director' || currentUser?.role === 'coordinator';
  const canManageMatch = isAssignedToMe || canOverride || currentUser?.role === 'scorer';
  const canEdit = !isLocked && match.status === 'live' && (isAssignedToMe || canOverride || currentUser?.role === 'scorer');

  const parseAdvanceSelection = (val: string): { nextMatchId: string | null; nextSlot?: 'A' | 'B' } => {
    if (!val || val === 'none') return { nextMatchId: null };
    const lastColon = val.lastIndexOf(':');
    if (lastColon === -1) return { nextMatchId: null };
    const nextMatchId = val.slice(0, lastColon);
    const nextSlot = val.slice(lastColon + 1) as 'A' | 'B';
    return { nextMatchId, nextSlot };
  };

  const handleFinalize = () => {
    if (!isOnline) return;
    if (editA === 0 && editB === 0) {
      setError('Cannot finalize match with 0–0 scores. Game results must be entered.');
      return;
    }
    if (editA === editB) {
      setError('Scores are tied. A knockout match needs a winner before it can be finalized.');
      return;
    }
    if (!isAssignedToMe && !canOverride) {
      setError(`Only the assigned scorer (${match.scorekeeper || 'Unassigned'}) can finalize this match.`);
      return;
    }

    const winningTeam = editA > editB ? match.teamA : match.teamB;
    const advTarget = parseAdvanceSelection(selectedAdvanceTarget);
    const targetMatchObj = advTarget.nextMatchId ? matches.find(m => m.id === advTarget.nextMatchId) : undefined;
    const targetDesc = targetMatchObj
      ? `${targetMatchObj.round} (Match #${targetMatchObj.slot ?? targetMatchObj.matchNumber ?? ''}, Slot ${advTarget.nextSlot})`
      : 'None (Final / Manual Advancement)';

    const ok = window.confirm(
      `Finalize ${match.teamA} ${editA} – ${editB} ${match.teamB}?\nWinner: ${winningTeam}\nAdvance Winner To: ${targetDesc}`
    );
    if (!ok) return;
    setError('');
    const result = finishMatch(
      match.id,
      currentUser?.name,
      canOverride && !isAssignedToMe,
      { scoreA: editA, scoreB: editB },
      advTarget
    );
    if (!result.success) {
      setError(result.message || 'Could not finalize match.');
    }
  };

  const handleManualAdvanceWinner = () => {
    if (!match.winner) return;
    const advTarget = parseAdvanceSelection(selectedAdvanceTarget);
    if (!advTarget.nextMatchId || !advTarget.nextSlot) {
      setError('Select a target bracket match and slot to advance the winner to.');
      return;
    }
    const res = advanceTeamToBracketSlot(match.winner, advTarget.nextMatchId, advTarget.nextSlot, match.id);
    if (!res.success) {
      setError(res.message || 'Failed to advance team.');
    } else {
      setError('');
      setAdvanceNotice(`Advanced ${match.winner} to Slot ${advTarget.nextSlot}!`);
      setTimeout(() => setAdvanceNotice(''), 2500);
    }
  };

  return (
    <div className="match-card glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!isOnline && (
        <div style={{
          background: 'var(--badge-warn-bg)', border: '1px solid var(--badge-warn-border)', borderRadius: '6px',
          padding: '6px 10px', fontSize: '12px', color: 'var(--badge-warn-text)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Offline: scores are saved on this device</span>
          {hasPending && <span style={{ fontWeight: 700, fontSize: '10px' }}>PENDING SYNC</span>}
        </div>
      )}

      {/* Header */}
      <div className="match-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getSportIcon(match.sport, 16, 'var(--accent)')}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                {getSportName(match.sport)}
              </span>
              <span style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '1px 7px',
                borderRadius: '10px',
                background: match.format === 'round_robin' ? 'rgba(56,189,248,0.14)' : 'rgba(245,158,11,0.14)',
                color: match.format === 'round_robin' ? '#38bdf8' : '#f59e0b',
              }}>
                {match.format === 'double_elimination'
                  ? 'Double Elimination'
                  : match.format === 'round_robin'
                    ? 'Round Robin'
                    : match.format === 'point_system'
                      ? 'Point System'
                      : match.format === 'combined_rr_elim' || match.format === 'combined_pts_elim'
                        ? (match.stage === 'elimination' ? 'Elimination Stage' : 'Group Stage')
                        : 'Single Elimination'}
              </span>
              {match.bestOf && match.bestOf > 1 && (
                <span style={{
                  fontSize: '10px', fontWeight: 800, padding: '1.5px 6px', borderRadius: '999px',
                  background: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)',
                }}>
                  Best of {match.bestOf} ({match.seriesWinsA ?? 0}–{match.seriesWinsB ?? 0})
                </span>
              )}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{match.round}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isLocked && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8',
              background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '12px',
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

      {/* Date, Time, Event Place (Dropdown) & Scorer */}
      <div className="match-meta" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon size={12} color="var(--text-muted)" />
            <span>{match.scheduledTime ? new Date(match.scheduledTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}</span>
            <span>·</span>
            <span>{match.scheduledTime ? new Date(match.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Time TBA'}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Official Scorer: <strong>{match.scorekeeper || 'Demo Scorekeeper'}</strong>
            {canAssign && onAssignScorer && (
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => onAssignScorer(match)}
                style={{ fontSize: '10px', padding: '1px 6px', textDecoration: 'underline' }}
              >
                Assign
              </button>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            <MapPinIcon size={12} color="var(--accent)" /> Event Place:
          </span>
          <select
            className="form-input"
            style={{ flex: 1, minWidth: '180px', fontSize: '11.5px', padding: '4px 8px', height: 'auto' }}
            value={match.venue || venues[0]?.name || ''}
            disabled={isLocked}
            onChange={e => assignMatchOfficials(match.id, { venue: e.target.value })}
          >
            {venues.map(v => (
              <option key={v.id} value={v.name}>
                {v.name} — {v.location} (Cap. {v.capacity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isLocked && match.conflictWarning && (
        <div style={{
          background: '#38bdf815', border: '1px solid #38bdf840', borderRadius: '6px',
          padding: '8px 12px', fontSize: '12px', color: '#38bdf8', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertTriangleIcon size={13} color="#38bdf8" />
          <span>{match.conflictWarning}</span>
        </div>
      )}

      {/* Score row */}
      <div className="match-score-row">
        <div className="team-block">
          <div
            title={!isPlaceholder(match.teamA) ? 'Slot A (Auto-Assigned)' : 'Slot A (Open)'}
            style={{ fontSize: '10px', fontWeight: 700, color: !isPlaceholder(match.teamA) ? '#10b981' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}
          >
            {!isPlaceholder(match.teamA) ? <><CheckIcon size={10} color="#10b981" /> Slot A · Auto</> : 'Slot A · Open'}
          </div>
          <div className="team-name" style={{ color: match.winner === match.teamA ? 'var(--accent)' : 'inherit', fontWeight: 700 }}>
            {match.teamA || 'TBD'}
          </div>
          {!isLocked ? (
            <input
              className="score-input" type="number" min={0} step={isChess ? 0.5 : 1}
              value={editA}
              onChange={e => setEditA(Number(e.target.value))}
              disabled={!canEdit}
            />
          ) : (
            <div className="score-display">{match.scoreA}</div>
          )}
        </div>

        <div className="vs-divider" style={{ alignSelf: 'center' }}>VS</div>

        <div className="team-block" style={{ textAlign: 'right' }}>
          <div
            title={!isPlaceholder(match.teamB) ? 'Slot B (Auto-Assigned)' : 'Slot B (Open)'}
            style={{ fontSize: '10px', fontWeight: 700, color: !isPlaceholder(match.teamB) ? '#10b981' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, whiteSpace: 'nowrap' }}
          >
            {!isPlaceholder(match.teamB) ? <><CheckIcon size={10} color="#10b981" /> Slot B · Auto</> : 'Slot B · Open'}
          </div>
          <div className="team-name" style={{ color: match.winner === match.teamB ? 'var(--accent)' : 'inherit', fontWeight: 700, justifyContent: 'flex-end' }}>
            {match.teamB || 'TBD'}
          </div>
          {!isLocked ? (
            <input
              className="score-input" type="number" min={0} step={isChess ? 0.5 : 1}
              value={editB}
              onChange={e => setEditB(Number(e.target.value))}
              disabled={!canEdit}
            />
          ) : (
            <div className="score-display">{match.scoreB}</div>
          )}
        </div>
      </div>

      {/* Scoring desk, only once the match is playable */}
      {isTBD && !isLocked ? (
        <div style={{
          background: 'var(--bg-elevated)',
          padding: '10px 12px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Scorekeeper Bracket Slot Assignment (Select teams for this match):
          </div>
          {canManageMatch && selectableTeams.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Slot A ({match.teamA || 'TBD'})
                </label>
                <select
                  className="form-input"
                  style={{ fontSize: '11.5px', padding: '5px 8px', height: 'auto' }}
                  value={isPlaceholder(match.teamA) ? '' : match.teamA}
                  onChange={e => {
                    const val = e.target.value || 'TBD';
                    advanceTeamToBracketSlot(val, match.id, 'A');
                  }}
                >
                  <option value="">— TBD —</option>
                  {selectableTeams.map(tName => (
                    <option key={tName} value={tName}>{tName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Slot B ({match.teamB || 'TBD'})
                </label>
                <select
                  className="form-input"
                  style={{ fontSize: '11.5px', padding: '5px 8px', height: 'auto' }}
                  value={isPlaceholder(match.teamB) ? '' : match.teamB}
                  onChange={e => {
                    const val = e.target.value || 'TBD';
                    advanceTeamToBracketSlot(val, match.id, 'B');
                  }}
                >
                  <option value="">— TBD —</option>
                  {selectableTeams.map(tName => (
                    <option key={tName} value={tName}>{tName}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              Waiting for the Scorekeeper to advance teams from the previous round.
            </div>
          )}
        </div>
      ) : match.status === 'live' || isLocked ? (
        <SportDesk
          match={match}
          editA={editA}
          editB={editB}
          setEditA={setEditA}
          setEditB={setEditB}
          isLocked={isLocked || !canEdit}
          onQuickSave={commit}
        />
      ) : null}

      {/* Per-Player Lineup (In Play vs Reserved) & All Game Fouls Desk */}
      {!isTBD && (
        <MatchPlayerLineupAndFoulsPanel
          match={match}
          isLocked={isLocked}
          canEdit={canEdit || canManageMatch}
        />
      )}

      {/* Scorekeeper Advancement Target Selector (Decide which next-round slot the winner advances to) */}
      {(match.status === 'live' || (isLocked && match.winner)) && candidateTargets.length > 0 && canManageMatch && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Advance Winner To (Scorekeeper Decision):
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-input"
              style={{ flex: 1, fontSize: '12px', padding: '6px 10px', height: 'auto', minWidth: '200px' }}
              value={selectedAdvanceTarget}
              onChange={e => setSelectedAdvanceTarget(e.target.value)}
            >
              <option value="none">— Do not advance / Final Round —</option>
              {candidateTargets.flatMap(t => [
                <option key={`${t.id}:A`} value={`${t.id}:A`}>
                  {t.round} (Match #{t.slot ?? t.matchNumber ?? 1}) · Slot A [Currently: {t.teamA || 'TBD'}]
                </option>,
                <option key={`${t.id}:B`} value={`${t.id}:B`}>
                  {t.round} (Match #{t.slot ?? t.matchNumber ?? 1}) · Slot B [Currently: {t.teamB || 'TBD'}]
                </option>,
              ])}
            </select>
            {isLocked && match.winner && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleManualAdvanceWinner}
                style={{ fontSize: '11.5px', padding: '6px 12px', whiteSpace: 'nowrap' }}
              >
                Place Winner in Slot ↗
              </button>
            )}
          </div>
          {advanceNotice && (
            <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckIcon size={12} color="#10b981" /> {advanceNotice}
            </div>
          )}
        </div>
      )}

      {match.winner && (
        <div style={{
          textAlign: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--accent)',
          background: 'var(--accent-subtle)', padding: '8px', borderRadius: '8px',
        }}>
          Winner: {match.winner}
        </div>
      )}

      {error && (
        <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertTriangleIcon size={12} color="#38bdf8" /> {error}
        </div>
      )}

      {/* Actions */}
      <div className="match-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', paddingTop: '10px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
        {match.status === 'scheduled' && (
          <button
            className="btn btn-sm btn-primary"
            disabled={isTBD || (!isAssignedToMe && !canOverride)}
            title={isTBD ? 'Waiting for the previous round' : (!isAssignedToMe && !canOverride) ? `Only assigned scorer (${match.scorekeeper || 'Unassigned'}) can start` : undefined}
            onClick={() => startMatch(match.id)}
          >
            Start Match
          </button>
        )}

        {!isLocked && match.status === 'live' && (
          <>
            <button
              className="btn btn-sm btn-ghost"
              disabled={!isAssignedToMe && !canOverride}
              title={(!isAssignedToMe && !canOverride) ? `Only assigned scorer (${match.scorekeeper || 'Unassigned'}) can save scores` : undefined}
              onClick={handleSave}
            >
              {isSaved ? <CheckIcon size={14} color="#10b981" /> : null}
              <span>{isSaved ? 'Saved' : 'Save Score'}</span>
            </button>
            <button
              className="btn btn-sm btn-primary"
              disabled={!isOnline}
              title={!isOnline ? 'Go online to finalize' : undefined}
              onClick={handleFinalize}
            >
              Finalize & Lock Match
            </button>
          </>
        )}

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
// SCORING DESK DASHBOARD
// ─────────────────────────────────────────────────────────────
export default function ScorekeeperDashboard() {
  const { matches, officials, currentUser, assignMatchOfficials, registeredUsers, updateMatchScore, staff, setActiveView, settings } = useApp();
  const isOnline = useOnlineStatus();
  const [selectedSportFilter, setSelectedSportFilter] = useState('all');

  const canAssign = currentUser?.role === 'scorer';

  const [assignmentModalMatch, setAssignmentModalMatch] = useState<Match | null>(null);
  const [selectedScorerName, setSelectedScorerName] = useState('');

  // ── One offline queue for the whole dashboard ──
  const [queue, setQueue] = useState<OfflineEntry[]>(loadQueue);
  const updateRef = useRef(updateMatchScore);
  const matchesRef = useRef(matches);
  updateRef.current = updateMatchScore;
  matchesRef.current = matches;

  const enqueue = useCallback((entry: OfflineEntry) => {
    setQueue(prev => {
      const next = [...prev.filter(e => e.matchId !== entry.matchId), entry];
      saveQueue(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const pending = loadQueue();
    if (pending.length === 0) return;
    pending.forEach(e => {
      // Only apply to matches still live, so a finalized result is never overwritten
      const m = matchesRef.current.find(x => x.id === e.matchId);
      if (m && m.status === 'live') updateRef.current(e.matchId, e.scoreA, e.scoreB);
    });
    saveQueue([]);
    setQueue([]);
  }, [isOnline]);

  // Enforce Director's One-Sport-Per-Scorer restriction
  const assignedScorerSport = useMemo(() => {
    if (!currentUser || currentUser.role !== 'scorer') return null;
    if (currentUser.assignedCompetitionId) return currentUser.assignedCompetitionId;
    if (currentUser.assignedSport) return currentUser.assignedSport;
    const assignedMatch = matches.find(
      m => m.scorerId === currentUser.id || (m.scorekeeper && m.scorekeeper.toLowerCase() === currentUser.name.toLowerCase())
    );
    return assignedMatch?.sport || null;
  }, [currentUser, matches]);

  const visibleMatches = useMemo(() => {
    if (settings.security.oneSportPerScorer && currentUser?.role === 'scorer' && assignedScorerSport) {
      return matches.filter(
        m =>
          m.sport === assignedScorerSport ||
          getSportName(m.sport).toLowerCase() === getSportName(assignedScorerSport).toLowerCase()
      );
    }
    return matches;
  }, [matches, settings.security.oneSportPerScorer, currentUser, assignedScorerSport]);

  const filteredMatches = visibleMatches.filter(m => selectedSportFilter === 'all' || m.sport === selectedSportFilter);

  const activeMatches = filteredMatches
    .filter(m => m.status !== 'finished')
    .sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live'));
  const completedMatches = filteredMatches.filter(m => m.status === 'finished');

  const [collapsedSports, setCollapsedSports] = useState<Record<string, boolean>>({});
  const toggleSportGroup = (key: string) => {
    setCollapsedSports(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groupMatchesBySport = useCallback((list: Match[]) => {
    const map = new Map<string, Match[]>();
    list.forEach(m => {
      const k = m.sport || 'other';
      const arr = map.get(k);
      if (arr) arr.push(m);
      else map.set(k, [m]);
    });

    const catalogOrder = SPORTS_CATALOG.map(s => s.id);
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const idxA = catalogOrder.indexOf(a);
        const idxB = catalogOrder.indexOf(b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      })
      .map(([sportId, items]) => ({
        sportId,
        sportName: getSportName(sportId),
        items: [...items].sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (b.status === 'live' && a.status !== 'live') return 1;
          const rDiff = (a.roundNumber || 1) - (b.roundNumber || 1);
          if (rDiff !== 0) return rDiff;
          return (a.matchNumber || a.slot || 0) - (b.matchNumber || b.slot || 0);
        }),
      }));
  }, []);

  const activeBySport = useMemo(() => groupMatchesBySport(activeMatches), [activeMatches, groupMatchesBySport]);
  const completedBySport = useMemo(() => groupMatchesBySport(completedMatches), [completedMatches, groupMatchesBySport]);

  const availableScorekeepers = useMemo<GameOfficial[]>(() => {
    const list: GameOfficial[] = [...(officials || []).filter(o => o.role === 'scorekeeper')];
    const allScorers = [
      ...(registeredUsers || []).filter(u => u.role === 'scorer'),
      ...(staff || []).filter(s => s.role === 'scorer'),
    ];

    allScorers.forEach(u => {
      const uName = u.name?.trim();
      const uEmail = u.email?.trim().toLowerCase();
      if (!uName) return;

      const exists = list.some(o =>
        (o.name && o.name.toLowerCase() === uName.toLowerCase()) ||
        (uEmail && o.contact && o.contact.toLowerCase() === uEmail)
      );
      if (!exists) {
        list.push({
          id: u.id,
          name: uName,
          role: 'scorekeeper',
          sport: (u as any).assignedCompetitionId || (u as any).assignedSport || 'All Sports',
          affiliation: 'Asian College Staff',
        });
      }
    });
    return list;
  }, [officials, registeredUsers, staff]);


  const handleSaveAssignment = (e: FormEvent) => {
    e.preventDefault();
    if (!assignmentModalMatch || !selectedScorerName) return;
    assignMatchOfficials(assignmentModalMatch.id, { scorekeeper: selectedScorerName });
    setAssignmentModalMatch(null);
  };

  if (currentUser?.role !== 'scorer') {
    return (
      <div className="dashboard-content">
        <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Scorekeeper-Only Desk</h2>
          <p style={{ marginBottom: '16px', fontSize: '13.5px' }}>
            The Scoring Desk is reserved exclusively for Official Scorekeepers. Directors and Coordinators manage tournament operations from the Operations Dashboard.
          </p>
          <button className="btn btn-primary" onClick={() => setActiveView('admin')}>
            Return to Operations Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="brand-pill-tag">Official Scorekeeper Desk</div>
          <h1 className="page-title">Scorer Desk</h1>
          <p className="page-desc">
            {`Live match scoring, period updates, and bracket progression for Official Scorekeeper ${currentUser?.name || 'Demo Scorekeeper'} — authorized to score every available match.`}
          </p>
        </div>
      </div>

      {/* ── Sport Filter Pills ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
          className={`btn btn-sm ${selectedSportFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSelectedSportFilter('all')}
          style={{ borderRadius: 8, height: 34, padding: '6px 14px', fontWeight: selectedSportFilter === 'all' ? 700 : 600 }}
        >
          All Sports ({visibleMatches.length})
        </button>
        {SPORTS_CATALOG.map(s => {
          const count = visibleMatches.filter(m => m.sport === s.id).length;
          if (count === 0 && !canAssign) return null;
          const isSelected = selectedSportFilter === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedSportFilter(s.id)}
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
                {s.icon(isSelected ? '#ffffff' : 'var(--text-secondary)', 14)}
              </span>
              <span>{s.name} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Active / Live Matches (Categorized Per Game) ── */}
      <section>
        <h2 className="section-title">
          <FlameIcon size={18} color="var(--accent)" />
          <span>Active &amp; Scheduled Matches ({activeMatches.length})</span>
        </h2>

        {activeBySport.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: '30px', textAlign: 'center' }}>
            No active matches currently assigned.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeBySport.map(group => {
              const collapseKey = `active:${group.sportId}`;
              const isCollapsed = !!collapsedSports[collapseKey];
              const liveCount = group.items.filter(m => m.status === 'live').length;

              return (
                <div
                  key={group.sportId}
                  className="glass-card"
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                      marginBottom: isCollapsed ? 0 : '14px',
                      paddingBottom: isCollapsed ? 0 : '10px',
                      borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {getSportIcon(group.sportId, 17, 'var(--accent)')}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {group.sportName}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {group.items.length} Match{group.items.length === 1 ? '' : 'es'}
                      </span>
                      {liveCount > 0 && (
                        <span className="status-badge live" style={{ fontSize: '10px' }}>
                          <span className="live-dot" /> {liveCount} LIVE
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => toggleSportGroup(collapseKey)}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      {isCollapsed ? 'Show Matches ▾' : 'Hide ▴'}
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="match-grid">
                      {group.items.map(m => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          queue={queue}
                          enqueue={enqueue}
                          canAssign={canAssign}
                          onAssignScorer={target => {
                            setAssignmentModalMatch(target);
                            setSelectedScorerName(target.scorekeeper || '');
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Completed Matches (Categorized Per Game) ── */}
      <section style={{ marginTop: '20px' }}>
        <h2 className="section-title">
          <CheckIcon size={18} color="var(--text-muted)" />
          <span>Completed &amp; Finalized Matches ({completedMatches.length})</span>
        </h2>

        {completedBySport.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: '30px', textAlign: 'center' }}>
            No completed matches yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {completedBySport.map(group => {
              const collapseKey = `done:${group.sportId}`;
              const isCollapsed = !!collapsedSports[collapseKey];

              return (
                <div
                  key={group.sportId}
                  className="glass-card"
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                      marginBottom: isCollapsed ? 0 : '14px',
                      paddingBottom: isCollapsed ? 0 : '10px',
                      borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {getSportIcon(group.sportId, 17, 'var(--text-muted)')}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {group.sportName}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#10b981',
                        }}
                      >
                        {group.items.length} Finalized
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => toggleSportGroup(collapseKey)}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      {isCollapsed ? 'Show Matches ▾' : 'Hide ▴'}
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="match-grid">
                      {group.items.map(m => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          queue={queue}
                          enqueue={enqueue}
                          canAssign={canAssign}
                          onAssignScorer={target => {
                            setAssignmentModalMatch(target);
                            setSelectedScorerName(target.scorekeeper || '');
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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