import { getRoundName, getSeedOrder } from './bracket';
import type {
  Match,
  Team,
  LadderEntry,
  LadderChallenge,
  BracketPrediction,
  TiebreakerRule,
  SwissPairingRule,
} from '../types';

function nextPow2(n: number): number {
  if (n <= 2) return 2;
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

function makeUid(prefix: string, seq: number): string {
  return `${prefix}-${Date.now().toString(36)}-${seq}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── 1. Single-Elimination Generator (auto-seeding + power-of-2 BYEs) ─────────
export function generateSingleEliminationMatches(opts: {
  eventId: string;
  sport: string;
  division?: string;
  venue: string;
  teams: Team[];
  bestOfByRound?: (roundNum: number, totalRounds: number) => 1 | 3 | 5;
  startMatchNumber?: number;
  baseDateStr?: string;
  baseStartHour?: number;
}): Match[] {
  const {
    eventId,
    sport,
    division,
    venue,
    teams,
    bestOfByRound = () => 1,
    startMatchNumber = 1,
    baseDateStr = '2026-11-10',
    baseStartHour = 9,
  } = opts;

  const N = teams.length;
  const P = nextPow2(Math.max(2, N));
  const totalRounds = Math.round(Math.log2(P));
  const seedOrder = getSeedOrder(P);
  let matchNum = startMatchNumber;

  const rounds: Match[][] = [];
  for (let r = 1; r <= totalRounds; r++) {
    const count = P / Math.pow(2, r);
    const rMatches: Match[] = [];
    const roundName = getRoundName(r, totalRounds);
    for (let slot = 1; slot <= count; slot++) {
      const hour = Math.min(20, baseStartHour + (slot - 1) * 2);
      rMatches.push({
        id: makeUid('m', matchNum),
        eventId,
        sport,
        division,
        format: 'single_elimination',
        stage: 'elimination',
        bracketSide: 'winners',
        bestOf: bestOfByRound(r, totalRounds),
        roundNumber: r,
        slot,
        matchNumber: matchNum++,
        round: roundName,
        status: 'scheduled',
        teamA: r === 1 ? 'TBD' : `Winner of ${getRoundName(r - 1, totalRounds)} #${slot * 2 - 1}`,
        teamB: r === 1 ? 'TBD' : `Winner of ${getRoundName(r - 1, totalRounds)} #${slot * 2}`,
        scoreA: 0,
        scoreB: 0,
        isBye: false,
        venue,
        scheduledTime: `${baseDateStr}T${String(hour).padStart(2, '0')}:00:00`,
      });
    }
    rounds.push(rMatches);
  }

  for (let r = 0; r < totalRounds - 1; r++) {
    for (let i = 0; i < rounds[r].length; i++) {
      rounds[r][i].nextMatchId = rounds[r + 1][Math.floor(i / 2)].id;
      rounds[r][i].nextSlot = i % 2 === 0 ? 'A' : 'B';
    }
  }

  // Place seeded teams & auto-advance BYEs
  for (let i = 0; i < rounds[0].length; i++) {
    const seedA = seedOrder[i * 2] - 1;
    const seedB = seedOrder[i * 2 + 1] - 1;
    const m = rounds[0][i];
    m.teamA = teams[seedA]?.name || (N === 0 ? 'TBD' : 'BYE');
    m.teamB = teams[seedB]?.name || (N === 0 ? 'TBD' : 'BYE');

    const aIsBye = m.teamA === 'BYE';
    const bIsBye = m.teamB === 'BYE';
    if ((aIsBye || bIsBye) && !(aIsBye && bIsBye)) {
      m.isBye = true;
      m.status = 'finished';
      m.winner = aIsBye ? m.teamB : m.teamA;
      if (m.nextMatchId && m.nextSlot && m.winner && m.winner !== 'BYE') {
        const nextM = rounds[1]?.find(nm => nm.id === m.nextMatchId);
        if (nextM) {
          if (m.nextSlot === 'A') nextM.teamA = m.winner;
          else nextM.teamB = m.winner;
        }
      }
    }
  }

  return rounds.flat();
}

// ── 2. Double-Elimination Generator (WB + LB + Grand Final + Optional Bracket Reset) ──
export function generateDoubleEliminationMatches(opts: {
  eventId: string;
  sport: string;
  division?: string;
  venue: string;
  teams: Team[];
  includeBracketReset?: boolean;
  startMatchNumber?: number;
}): Match[] {
  const {
    eventId,
    sport,
    division,
    venue,
    teams,
    includeBracketReset = true,
    startMatchNumber = 1,
  } = opts;

  const P = nextPow2(Math.max(4, teams.length));
  const totalWbRounds = Math.round(Math.log2(P));
  const seedOrder = getSeedOrder(P);
  let matchNum = startMatchNumber;

  // Winners Bracket
  const wbRounds: Match[][] = [];
  for (let r = 1; r <= totalWbRounds; r++) {
    const count = P / Math.pow(2, r);
    const list: Match[] = [];
    for (let slot = 1; slot <= count; slot++) {
      list.push({
        id: makeUid('wb', matchNum),
        eventId,
        sport,
        division,
        format: 'double_elimination',
        stage: 'elimination',
        bracketSide: 'winners',
        bestOf: 1,
        roundNumber: r,
        slot,
        matchNumber: matchNum++,
        round: `Winners · ${getRoundName(r, totalWbRounds)}`,
        status: 'scheduled',
        teamA: 'TBD',
        teamB: 'TBD',
        scoreA: 0,
        scoreB: 0,
        isBye: false,
        venue,
      });
    }
    wbRounds.push(list);
  }

  for (let r = 0; r < totalWbRounds - 1; r++) {
    for (let i = 0; i < wbRounds[r].length; i++) {
      wbRounds[r][i].nextMatchId = wbRounds[r + 1][Math.floor(i / 2)].id;
      wbRounds[r][i].nextSlot = i % 2 === 0 ? 'A' : 'B';
    }
  }

  // Losers Bracket
  const lbRounds: Match[][] = [];
  const lbR1Count = Math.max(1, wbRounds[0].length / 2);
  for (let lb = 1; lb <= Math.max(1, totalWbRounds - 1); lb++) {
    const count = Math.max(1, lbR1Count / Math.pow(2, lb - 1));
    const list: Match[] = [];
    for (let slot = 1; slot <= count; slot++) {
      list.push({
        id: makeUid('lb', matchNum),
        eventId,
        sport,
        division,
        format: 'double_elimination',
        stage: 'elimination',
        bracketSide: 'losers',
        bestOf: 1,
        roundNumber: totalWbRounds + lb,
        slot,
        matchNumber: matchNum++,
        round: `Losers · Round ${lb}`,
        status: 'scheduled',
        teamA: 'Loser from WB',
        teamB: 'Loser from WB',
        scoreA: 0,
        scoreB: 0,
        isBye: false,
        venue,
      });
    }
    lbRounds.push(list);
  }

  for (let r = 0; r < lbRounds.length - 1; r++) {
    for (let i = 0; i < lbRounds[r].length; i++) {
      lbRounds[r][i].nextMatchId = lbRounds[r + 1][Math.floor(i / 2)].id;
      lbRounds[r][i].nextSlot = i % 2 === 0 ? 'A' : 'B';
    }
  }

  // Grand Final
  const grandFinal: Match = {
    id: makeUid('gf', matchNum),
    eventId,
    sport,
    division,
    format: 'double_elimination',
    stage: 'elimination',
    bracketSide: 'grand_final',
    bestOf: 1,
    roundNumber: totalWbRounds + lbRounds.length + 1,
    slot: 1,
    matchNumber: matchNum++,
    round: 'Grand Final',
    status: 'scheduled',
    teamA: 'Winners Bracket Champion',
    teamB: 'Losers Bracket Champion',
    scoreA: 0,
    scoreB: 0,
    isBye: false,
    venue,
  };

  // Optional Bracket Reset Final (triggered if Losers Champion defeats Winners Champion in GF)
  const resetFinal: Match | null = includeBracketReset
    ? {
        id: makeUid('gfr', matchNum),
        eventId,
        sport,
        division,
        format: 'double_elimination',
        stage: 'elimination',
        bracketSide: 'grand_final',
        isBracketReset: true,
        bestOf: 1,
        roundNumber: totalWbRounds + lbRounds.length + 2,
        slot: 1,
        matchNumber: matchNum++,
        round: 'Grand Final (Bracket Reset)',
        status: 'scheduled',
        teamA: 'TBD (If LB Winner Wins GF)',
        teamB: 'TBD (If LB Winner Wins GF)',
        scoreA: 0,
        scoreB: 0,
        isBye: false,
        venue,
      }
    : null;

  if (resetFinal) {
    grandFinal.nextMatchId = resetFinal.id;
  }

  // Wire WB Final -> GF Slot A, LB Final -> GF Slot B
  wbRounds[wbRounds.length - 1][0].nextMatchId = grandFinal.id;
  wbRounds[wbRounds.length - 1][0].nextSlot = 'A';
  lbRounds[lbRounds.length - 1][0].nextMatchId = grandFinal.id;
  lbRounds[lbRounds.length - 1][0].nextSlot = 'B';

  // Wire WB losers dropping into LB
  for (let r = 0; r < wbRounds.length; r++) {
    const targetLbIdx = Math.min(r, lbRounds.length - 1);
    wbRounds[r].forEach((m, idx) => {
      const targetMatch = lbRounds[targetLbIdx][Math.floor(idx / 2)] || lbRounds[targetLbIdx][0];
      if (targetMatch) {
        m.loserNextMatchId = targetMatch.id;
        m.loserNextSlot = idx % 2 === 0 ? 'A' : 'B';
      }
    });
  }

  // Seed WB Round 1 & auto-advance BYEs
  for (let i = 0; i < wbRounds[0].length; i++) {
    const idxA = seedOrder[i * 2] - 1;
    const idxB = seedOrder[i * 2 + 1] - 1;
    const m = wbRounds[0][i];
    m.teamA = teams[idxA]?.name || 'BYE';
    m.teamB = teams[idxB]?.name || 'BYE';
    if ((m.teamA === 'BYE' || m.teamB === 'BYE') && !(m.teamA === 'BYE' && m.teamB === 'BYE')) {
      m.isBye = true;
      m.status = 'finished';
      m.winner = m.teamA === 'BYE' ? m.teamB : m.teamA;
      const nextM = wbRounds[1]?.find(nm => nm.id === m.nextMatchId);
      if (nextM && m.nextSlot) {
        if (m.nextSlot === 'A') nextM.teamA = m.winner;
        else nextM.teamB = m.winner;
      }
    }
  }

  return [
    ...wbRounds.flat(),
    ...lbRounds.flat(),
    grandFinal,
    ...(resetFinal ? [resetFinal] : []),
  ];
}

// ── 3. Round-Robin Generator & Tiebreaker Ranking ────────────────────────────
export function generateRoundRobinMatches(opts: {
  eventId: string;
  sport: string;
  division?: string;
  venue: string;
  teams: Team[];
  groupName?: string;
  format?: Match['format'];
  stage?: 'group' | 'elimination';
  startMatchNumber?: number;
}): Match[] {
  const {
    eventId,
    sport,
    division,
    venue,
    teams,
    groupName,
    format = 'round_robin',
    stage = 'group',
    startMatchNumber = 1,
  } = opts;

  if (teams.length < 2) return [];
  const pool = teams.map(t => t.name);
  if (pool.length % 2 !== 0) pool.push('__BYE__');

  const n = pool.length;
  const totalRounds = n - 1;
  const rot = [...pool];
  let matchNum = startMatchNumber;
  const result: Match[] = [];

  for (let r = 1; r <= totalRounds; r++) {
    let slot = 1;
    for (let i = 0; i < n / 2; i++) {
      const tA = rot[i];
      const tB = rot[n - 1 - i];
      if (tA === '__BYE__' || tB === '__BYE__') continue;

      result.push({
        id: makeUid('rr', matchNum),
        eventId,
        sport,
        division,
        format,
        stage,
        groupName,
        bestOf: 1,
        roundNumber: r,
        slot: slot++,
        matchNumber: matchNum++,
        round: groupName ? `${groupName} · Round ${r}` : `Round Robin · Round ${r}`,
        status: 'scheduled',
        teamA: tA,
        teamB: tB,
        scoreA: 0,
        scoreB: 0,
        isBye: false,
        venue,
      });
    }
    const last = rot.pop()!;
    rot.splice(1, 0, last);
  }

  return result;
}

export interface RankedStandingRow {
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
}

export function rankRoundRobinTeams(
  teamNames: string[],
  matches: Match[],
  tiebreakerOrder: TiebreakerRule[] = ['head_to_head', 'point_differential', 'total_points_scored'],
  pointConfig = { winPoints: 3, drawPoints: 1, lossPoints: 0 }
): RankedStandingRow[] {
  const map: Record<string, RankedStandingRow> = {};
  teamNames.forEach(name => {
    map[name] = {
      teamName: name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0,
    };
  });

  const finished = matches.filter(m => m.status === 'finished' && !m.isBye);
  finished.forEach(m => {
    const rowA = map[m.teamA];
    const rowB = map[m.teamB];
    if (!rowA || !rowB) return;
    rowA.played += 1;
    rowB.played += 1;
    rowA.pointsFor += m.scoreA;
    rowA.pointsAgainst += m.scoreB;
    rowB.pointsFor += m.scoreB;
    rowB.pointsAgainst += m.scoreA;

    if (m.scoreA > m.scoreB) {
      rowA.won += 1;
      rowA.points += pointConfig.winPoints;
      rowB.lost += 1;
      rowB.points += pointConfig.lossPoints;
    } else if (m.scoreB > m.scoreA) {
      rowB.won += 1;
      rowB.points += pointConfig.winPoints;
      rowA.lost += 1;
      rowA.points += pointConfig.lossPoints;
    } else {
      rowA.drawn += 1;
      rowB.drawn += 1;
      rowA.points += pointConfig.drawPoints;
      rowB.points += pointConfig.drawPoints;
    }
  });

  Object.values(map).forEach(r => {
    r.diff = r.pointsFor - r.pointsAgainst;
  });

  const headToHeadCompare = (a: string, b: string): number => {
    let aWins = 0;
    let bWins = 0;
    finished.forEach(m => {
      if (m.teamA === a && m.teamB === b) {
        if (m.scoreA > m.scoreB) aWins++;
        else if (m.scoreB > m.scoreA) bWins++;
      } else if (m.teamA === b && m.teamB === a) {
        if (m.scoreB > m.scoreA) aWins++;
        else if (m.scoreA > m.scoreB) bWins++;
      }
    });
    return bWins - aWins;
  };

  const rows = Object.values(map);
  const tiedCounts = new Map<string, number>();
  rows.forEach(r => {
    const key = `${r.points}:${r.won}`;
    tiedCounts.set(key, (tiedCounts.get(key) || 0) + 1);
  });

  return rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    const isTwoWayTie = (tiedCounts.get(`${a.points}:${a.won}`) || 0) === 2;
    for (const rule of tiebreakerOrder) {
      if (rule === 'head_to_head' && isTwoWayTie) {
        const h2h = headToHeadCompare(a.teamName, b.teamName);
        if (h2h !== 0) return h2h;
      } else if (rule === 'point_differential') {
        if (b.diff !== a.diff) return b.diff - a.diff;
      } else if (rule === 'total_points_scored') {
        if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
      }
    }
    return a.teamName.localeCompare(b.teamName);
  });
}

// ── 4. Group-Stage Generator (N groups -> Top K advance to Single-Elimination) ──
export function generateGroupStageMatches(opts: {
  eventId: string;
  sport: string;
  division?: string;
  venue: string;
  teams: Team[];
  groupCount?: number;
  advancingPerGroup?: number;
}): Match[] {
  const {
    eventId,
    sport,
    division,
    venue,
    teams,
    groupCount = 2,
    advancingPerGroup = 2,
  } = opts;

  const safeGroups = Math.max(2, Math.min(groupCount, Math.max(2, Math.floor(teams.length / 2))));
  const groups: Team[][] = Array.from({ length: safeGroups }, () => []);
  teams.forEach((team, idx) => {
    groups[idx % safeGroups].push(team);
  });

  let matchNum = 1;
  const groupMatches: Match[] = [];
  groups.forEach((gTeams, gIdx) => {
    const label = `Group ${String.fromCharCode(65 + gIdx)}`;
    const gm = generateRoundRobinMatches({
      eventId,
      sport,
      division,
      venue,
      teams: gTeams,
      groupName: label,
      format: 'group_stage',
      stage: 'group',
      startMatchNumber: matchNum,
    });
    matchNum += gm.length;
    groupMatches.push(...gm);
  });

  // Pre-create Knockout placeholder bracket for top advancingPerGroup * safeGroups teams
  const knockoutSlots = Math.max(2, safeGroups * advancingPerGroup);
  const placeholderTeams: Team[] = [];
  for (let rank = 1; rank <= advancingPerGroup; rank++) {
    for (let g = 0; g < safeGroups; g++) {
      if (placeholderTeams.length < knockoutSlots) {
        const gLetter = String.fromCharCode(65 + g);
        placeholderTeams.push({
          id: `ko-${gLetter}-${rank}`,
          name: `TBD (${gLetter}#${rank})`,
          sport,
          department: '',
          players: [],
        });
      }
    }
  }

  const koMatches = generateSingleEliminationMatches({
    eventId,
    sport,
    division,
    venue,
    teams: placeholderTeams,
    startMatchNumber: matchNum,
  }).map(m => ({ ...m, format: 'group_stage' as const, round: `Knockout · ${m.round}` }));

  return [...groupMatches, ...koMatches];
}

// ── 5. Swiss System Generator (pair similar records, avoid repeats) ──────────
export function generateSwissRoundMatches(opts: {
  eventId: string;
  sport: string;
  division?: string;
  venue: string;
  teams: Team[];
  existingMatches: Match[];
  roundNumber: number;
  pairingRule?: SwissPairingRule;
}): Match[] {
  const {
    eventId,
    sport,
    division,
    venue,
    teams,
    existingMatches,
    roundNumber,
    pairingRule = 'adjacent',
  } = opts;

  const teamNames = teams.map(t => t.name);
  const standings = rankRoundRobinTeams(teamNames, existingMatches);

  const playedPairs = new Set<string>();
  const byeHistory = new Set<string>();
  existingMatches.forEach(m => {
    if (m.isBye && m.winner) {
      byeHistory.add(m.winner);
    } else if (m.teamA && m.teamB) {
      playedPairs.add([m.teamA, m.teamB].sort().join('||'));
    }
  });

  const ordered = standings.map(s => s.teamName);
  const result: Match[] = [];
  let matchNum = existingMatches.reduce((max, m) => Math.max(max, m.matchNumber || 0), 0) + 1;
  let slot = 1;

  // Handle odd team count with BYE for lowest-ranked team without prior BYE
  const pool = [...ordered];
  if (pool.length % 2 !== 0) {
    let byeIdx = pool.length - 1;
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!byeHistory.has(pool[i])) {
        byeIdx = i;
        break;
      }
    }
    const [byeTeam] = pool.splice(byeIdx, 1);
    result.push({
      id: makeUid('sw', matchNum),
      eventId,
      sport,
      division,
      format: 'swiss',
      stage: 'group',
      swissRound: roundNumber,
      bestOf: 1,
      roundNumber,
      slot: slot++,
      matchNumber: matchNum++,
      round: `Swiss · Round ${roundNumber}`,
      status: 'finished',
      teamA: byeTeam,
      teamB: 'BYE',
      scoreA: 1,
      scoreB: 0,
      winner: byeTeam,
      isBye: true,
      venue,
    });
  }

  const used = new Set<string>();
  for (let i = 0; i < pool.length; i++) {
    const tA = pool[i];
    if (used.has(tA)) continue;

    const candidates = pool.slice(i + 1).filter(tB => !used.has(tB));
    let opponent = candidates.find(tB => !playedPairs.has([tA, tB].sort().join('||')));
    if (!opponent) {
      opponent = pairingRule === 'top_bottom' ? candidates[candidates.length - 1] : candidates[0];
    }
    if (!opponent) continue;

    used.add(tA);
    used.add(opponent);
    result.push({
      id: makeUid('sw', matchNum),
      eventId,
      sport,
      division,
      format: 'swiss',
      stage: 'group',
      swissRound: roundNumber,
      bestOf: 1,
      roundNumber,
      slot: slot++,
      matchNumber: matchNum++,
      round: `Swiss · Round ${roundNumber}`,
      status: 'scheduled',
      teamA: tA,
      teamB: opponent,
      scoreA: 0,
      scoreB: 0,
      isBye: false,
      venue,
    });
  }

  return result;
}

// ── 6. Ladder / Pyramid Helpers ──────────────────────────────────────────────
export function generateInitialLadder(sport: string, teams: Team[], eventId?: string): LadderEntry[] {
  const now = new Date().toISOString();
  return teams.map((t, idx) => ({
    id: makeUid('lad', idx + 1),
    eventId,
    sport,
    teamId: t.id,
    teamName: t.name,
    rank: idx + 1,
    wins: 0,
    losses: 0,
    updatedAt: now,
  }));
}

export function resolveLadderChallenge(
  entries: LadderEntry[],
  challengerTeam: string,
  defenderTeam: string,
  winnerTeam: string
): { updatedEntries: LadderEntry[]; challenge: LadderChallenge } {
  const cEntry = entries.find(e => e.teamName === challengerTeam);
  const dEntry = entries.find(e => e.teamName === defenderTeam);
  const now = new Date().toISOString();

  const challenge: LadderChallenge = {
    id: makeUid('lch', entries.length + 1),
    eventId: cEntry?.eventId || dEntry?.eventId,
    sport: cEntry?.sport || dEntry?.sport || '',
    challengerTeam,
    defenderTeam,
    challengerRank: cEntry?.rank ?? 0,
    defenderRank: dEntry?.rank ?? 0,
    winnerTeam,
    status: 'completed',
    createdAt: now,
    completedAt: now,
  };

  if (!cEntry || !dEntry) {
    return { updatedEntries: entries, challenge };
  }

  const challengerWon = winnerTeam === challengerTeam && cEntry.rank > dEntry.rank;
  const updatedEntries = entries
    .map(e => {
      if (e.teamName === challengerTeam) {
        return {
          ...e,
          rank: challengerWon ? dEntry.rank : e.rank,
          wins: e.wins + (winnerTeam === challengerTeam ? 1 : 0),
          losses: e.losses + (winnerTeam === challengerTeam ? 0 : 1),
          updatedAt: now,
        };
      }
      if (e.teamName === defenderTeam) {
        return {
          ...e,
          rank: challengerWon ? cEntry.rank : e.rank,
          wins: e.wins + (winnerTeam === defenderTeam ? 1 : 0),
          losses: e.losses + (winnerTeam === defenderTeam ? 0 : 1),
          updatedAt: now,
        };
      }
      return e;
    })
    .sort((a, b) => a.rank - b.rank);

  return { updatedEntries, challenge };
}

// ── 7. Prediction Bracket Leaderboard Scorer ─────────────────────────────────
export function scoreBracketPredictions(
  predictions: BracketPrediction[],
  matches: Match[]
): { predictorName: string; correct: number; totalEvaluated: number; points: number }[] {
  const finishedMap = new Map<string, Match>();
  matches.filter(m => m.status === 'finished' && m.winner).forEach(m => finishedMap.set(m.id, m));

  const board: Record<string, { predictorName: string; correct: number; totalEvaluated: number; points: number }> = {};
  predictions.forEach(pred => {
    const key = pred.predictorName.trim().toLowerCase() || pred.deviceId;
    if (!board[key]) {
      board[key] = { predictorName: pred.predictorName, correct: 0, totalEvaluated: 0, points: 0 };
    }
    const match = finishedMap.get(pred.matchId);
    if (match) {
      board[key].totalEvaluated += 1;
      if (match.winner === pred.predictedWinner) {
        board[key].correct += 1;
        board[key].points += 10;
      }
    }
  });

  return Object.values(board).sort((a, b) => b.points - a.points || b.correct - a.correct);
}
