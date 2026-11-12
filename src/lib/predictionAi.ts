import type { Match, Team, Player } from '../types';
import { isPlaceholder } from './bracket';

export interface PastMatchRecord {
  matchId: string;
  opponent: string;
  teamScore: number;
  opponentScore: number;
  round: string;
  result: 'W' | 'L';
}

export interface TeamStatsProfile {
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  pointDiff: number;
  avgPointDiff: number;
  streak: number;
  recentForm: ('W' | 'L')[];
  formRating: number; // 0 - 100 weighted recent form
  eloRating: number; // Dynamic Elo starting at 1500
  strengthOfSchedule: number; // Average opponent Elo
  pythagoreanWinPct: number; // 0 - 100 expected win % from points scored/allowed
  offensiveEfficiency: number; // 100 = baseline average
  defensiveEfficiency: number; // 100 = baseline average (higher is better defense)
  clutchIndex: number; // 0 - 99 close-game & knockout poise
  clearedPlayersCount: number;
  rosterStarPower: number; // 50 - 99 athlete scoring & GWA index
  keyPlayer: { name: string; jerseyNumber?: string; goals?: number } | null;
  pastMatches: PastMatchRecord[];
}

export interface PredictionFactorSignal {
  label: string;
  edgeTeam: string | 'Even';
  advantageScore: number; // -100 (Team B) to +100 (Team A)
  detailA: string;
  detailB: string;
}

export interface MatchPrediction {
  teamA: string;
  teamB: string;
  sport: string;
  isLive: boolean;
  currentScoreA: number;
  currentScoreB: number;
  preMatchWinProbA: number; // 0 - 100 based purely on past performance & roster
  preMatchWinProbB: number; // 0 - 100
  winProbA: number; // 0 - 100 (blends past performance + live score when live)
  winProbB: number; // 0 - 100
  predictedWinner: string;
  predictedWinnerProb: number;
  predictedLoser: string;
  predictedScoreA: number;
  predictedScoreB: number;
  predictedMargin: number;
  scoreRangeA: [number, number];
  scoreRangeB: [number, number];
  favorite: string | 'Even Match';
  confidence: 'High' | 'Moderate' | 'Even / Toss-up';
  confidencePct: number; // 55 to 98
  matchQualityRating: number; // 50 to 99
  comebackProb: number; // 0 to 100 probability of trailing team coming back
  momentumLeader: string;
  momentumReason: string;
  h2hSummary: { teamAWins: number; teamBWins: number; totalMeetings: number };
  factorSignals: PredictionFactorSignal[];
  keyFactors: string[];
  tacticalSummary: string;
  pastPerformanceSummary: string;
  statsA: TeamStatsProfile;
  statsB: TeamStatsProfile;
  disclaimer: string;
  isOfficialOutcome: false;
}

// Typical scoring ranges & Pythagorean exponents per sport
const SPORT_SCORING_BASELINES: Record<string, { baseScore: number; variance: number; pythExp: number }> = {
  s1: { baseScore: 78, variance: 14, pythExp: 13.91 }, // Basketball
  s2: { baseScore: 25, variance: 5,  pythExp: 4.5 },   // Volleyball
  s3: { baseScore: 21, variance: 4,  pythExp: 3.8 },   // Badminton
  s4: { baseScore: 11, variance: 3,  pythExp: 3.2 },   // Table Tennis
  s5: { baseScore: 16, variance: 6,  pythExp: 2.5 },   // Esports
  s6: { baseScore: 2,  variance: 1,  pythExp: 2.0 },   // Chess
  s7: { baseScore: 3,  variance: 1.5, pythExp: 1.8 },  // Football / Futsal / Dancesport
  s8: { baseScore: 21, variance: 5,  pythExp: 3.5 },   // Sepak Takraw
  s9: { baseScore: 13, variance: 3,  pythExp: 2.8 },   // Frisbee
  s10: { baseScore: 380, variance: 60, pythExp: 6.0 }, // Scrabble
};

/**
 * Computes dynamic Elo ratings for all teams in a sport based on chronological finished matches
 */
function computeSportEloMap(sport: string, allMatches: Match[], teams: Team[]): Record<string, number> {
  const elo: Record<string, number> = {};
  teams.filter(t => t.sport === sport || !sport).forEach(t => {
    elo[t.name] = 1500;
  });

  const baseline = SPORT_SCORING_BASELINES[sport] || { baseScore: 50, variance: 10, pythExp: 3.0 };

  const finished = allMatches
    .filter(m => m.status === 'finished' && !m.isBye && (m.sport === sport || !sport))
    .slice()
    .sort((a, b) => {
      const rA = a.roundNumber ?? 1;
      const rB = b.roundNumber ?? 1;
      if (rA !== rB) return rA - rB;
      return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
    });

  for (const m of finished) {
    if (isPlaceholder(m.teamA) || isPlaceholder(m.teamB)) continue;
    const rA = elo[m.teamA] ?? 1500;
    const rB = elo[m.teamB] ?? 1500;

    const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
    const expectedB = 1 - expectedA;

    const actualA = m.winner === m.teamA ? 1 : m.winner === m.teamB ? 0 : m.scoreA > m.scoreB ? 1 : 0;
    const actualB = 1 - actualA;

    // Margin-of-victory multiplier (FiveThirtyEight Elo style)
    const margin = Math.abs((m.scoreA || 0) - (m.scoreB || 0));
    const normMargin = Math.max(1, margin / Math.max(1, baseline.variance * 0.35));
    const movMultiplier = Math.log(normMargin + 1) * (2.2 / ((actualA === 1 ? rA - rB : rB - rA) * 0.001 + 2.2));
    const K = 32 * Math.max(0.8, Math.min(2.2, movMultiplier));

    elo[m.teamA] = Math.round(rA + K * (actualA - expectedA));
    elo[m.teamB] = Math.round(rB + K * (actualB - expectedB));
  }

  return elo;
}

/**
 * Computes individual statistical & historical performance profile for a team
 */
export function computeTeamProfile(
  teamName: string,
  sport: string,
  allMatches: Match[],
  teams: Team[],
  players: Player[]
): TeamStatsProfile {
  const baseline = SPORT_SCORING_BASELINES[sport] || { baseScore: 50, variance: 10, pythExp: 3.0 };
  const eloMap = computeSportEloMap(sport, allMatches, teams);

  const finished = allMatches
    .filter(
      m => m.status === 'finished' && !m.isBye && (m.teamA === teamName || m.teamB === teamName)
    )
    .slice()
    .sort((a, b) => (a.roundNumber ?? 1) - (b.roundNumber ?? 1));

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;
  let streak = 0;
  let closeGameWins = 0;
  let closeGamesTotal = 0;
  const recentForm: ('W' | 'L')[] = [];
  const pastMatches: PastMatchRecord[] = [];
  const opponentElos: number[] = [];

  finished.forEach(m => {
    const isTeamA = m.teamA === teamName;
    const opponent = isTeamA ? m.teamB : m.teamA;
    const scored = isTeamA ? m.scoreA : m.scoreB;
    const conceded = isTeamA ? m.scoreB : m.scoreA;

    pointsFor += scored;
    pointsAgainst += conceded;
    opponentElos.push(eloMap[opponent] ?? 1500);

    const won = m.winner === teamName || (!m.winner && scored > conceded);
    const margin = Math.abs(scored - conceded);
    if (margin <= Math.max(2, baseline.variance * 0.45)) {
      closeGamesTotal++;
      if (won) closeGameWins++;
    }

    if (won) {
      wins++;
      streak = streak > 0 ? streak + 1 : 1;
      recentForm.push('W');
      pastMatches.push({
        matchId: m.id,
        opponent,
        teamScore: scored,
        opponentScore: conceded,
        round: m.round || 'Tournament Round',
        result: 'W',
      });
    } else {
      losses++;
      streak = streak < 0 ? streak - 1 : -1;
      recentForm.push('L');
      pastMatches.push({
        matchId: m.id,
        opponent,
        teamScore: scored,
        opponentScore: conceded,
        round: m.round || 'Tournament Round',
        result: 'L',
      });
    }
  });

  const gamesPlayed = wins + losses;
  const winPct = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 50;
  const avgPointsFor = gamesPlayed > 0 ? Number((pointsFor / gamesPlayed).toFixed(1)) : 0;
  const avgPointsAgainst = gamesPlayed > 0 ? Number((pointsAgainst / gamesPlayed).toFixed(1)) : 0;
  const pointDiff = pointsFor - pointsAgainst;
  const avgPointDiff = gamesPlayed > 0 ? Number((pointDiff / gamesPlayed).toFixed(1)) : 0;

  // Exponentially weighted recent form (most recent games carry highest weight)
  const last5 = recentForm.slice(-5);
  let formWeightedSum = 0;
  let formWeightTotal = 0;
  last5.forEach((res, idx) => {
    const w = Math.pow(1.45, idx);
    formWeightedSum += (res === 'W' ? 100 : 0) * w;
    formWeightTotal += w;
  });
  const formRating = formWeightTotal > 0 ? Math.round(formWeightedSum / formWeightTotal) : 50;

  // Pythagorean win expectation from scoring efficiency
  let pythagoreanWinPct = 50;
  if (pointsFor > 0 || pointsAgainst > 0) {
    const pf = Math.max(1, pointsFor);
    const pa = Math.max(1, pointsAgainst);
    const exp = Math.min(6, baseline.pythExp); // cap exponent for small sample stability
    const pfPow = Math.pow(pf, exp);
    const paPow = Math.pow(pa, exp);
    pythagoreanWinPct = Math.round((pfPow / (pfPow + paPow)) * 100);
  }

  // Offensive & Defensive Efficiency normalized around 100
  const offensiveEfficiency = avgPointsFor > 0
    ? Math.round(Math.max(60, Math.min(145, (avgPointsFor / baseline.baseScore) * 100)))
    : 100;
  const defensiveEfficiency = avgPointsAgainst > 0
    ? Math.round(Math.max(60, Math.min(145, (2 - avgPointsAgainst / baseline.baseScore) * 100)))
    : 100;

  // Team roster & active cleared players
  const teamObj = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
  const teamPlayers = players.filter(p => {
    if (teamObj && p.teamId === teamObj.id) return true;
    return p.department === teamObj?.department && p.sport === sport;
  });

  const cleared = teamPlayers.filter(p => p.medicalCleared && p.isActive !== false);
  const sortedByScoring = [...cleared].sort(
    (a, b) =>
      ((b.currentSeasonGoals || 0) * 2 + (b.intGoals || 0)) -
      ((a.currentSeasonGoals || 0) * 2 + (a.intGoals || 0))
  );

  const keyPlayer = sortedByScoring.length > 0
    ? {
        name: sortedByScoring[0].name,
        jerseyNumber: sortedByScoring[0].jerseyNumber,
        goals: (sortedByScoring[0].currentSeasonGoals || 0) + (sortedByScoring[0].intGoals || 0),
      }
    : null;

  const totalGoals = cleared.reduce(
    (sum, p) => sum + (p.currentSeasonGoals || 0) * 1.5 + (p.intGoals || 0) * 0.8,
    0
  );
  const rosterStarPower = Math.min(98, Math.max(55, Math.round(62 + cleared.length * 3.5 + Math.min(22, totalGoals * 0.6))));

  const eloRating = eloMap[teamName] ?? 1500;
  const strengthOfSchedule = opponentElos.length > 0
    ? Math.round(opponentElos.reduce((a, b) => a + b, 0) / opponentElos.length)
    : 1500;

  // Clutch index blends close-game win rate, streak, and Elo above 1500
  const closeWinRate = closeGamesTotal > 0 ? closeGameWins / closeGamesTotal : winPct / 100;
  const clutchIndex = Math.min(
    99,
    Math.max(45, Math.round(55 + (closeWinRate - 0.5) * 35 + Math.max(-10, Math.min(15, streak * 4)) + (eloRating - 1500) * 0.06))
  );

  return {
    name: teamName,
    gamesPlayed,
    wins,
    losses,
    winPct,
    pointsFor,
    pointsAgainst,
    avgPointsFor,
    avgPointsAgainst,
    pointDiff,
    avgPointDiff,
    streak,
    recentForm: last5,
    formRating,
    eloRating,
    strengthOfSchedule,
    pythagoreanWinPct,
    offensiveEfficiency,
    defensiveEfficiency,
    clutchIndex,
    clearedPlayersCount: cleared.length,
    rosterStarPower,
    keyPlayer,
    pastMatches,
  };
}

/**
 * Generates a MAX-level statistical & live-aware forecast for any scheduled or live matchup
 * based on past performance, Elo ratings, Pythagorean expectation, H2H history, roster star power,
 * and real-time in-game score state (when the match is live).
 */
export function predictMatch(
  teamAName: string,
  teamBName: string,
  sport: string,
  allMatches: Match[],
  teams: Team[],
  players: Player[],
  liveMatch?: Match
): MatchPrediction | null {
  if (isPlaceholder(teamAName) || isPlaceholder(teamBName)) {
    return null;
  }

  // Automatically locate the active live or scheduled match if liveMatch wasn't explicitly passed
  const activeContextMatch =
    liveMatch ||
    allMatches.find(
      m =>
        m.status === 'live' &&
        !m.isBye &&
        m.sport === sport &&
        ((m.teamA === teamAName && m.teamB === teamBName) || (m.teamA === teamBName && m.teamB === teamAName))
    );

  const isLive = activeContextMatch?.status === 'live';
  const currentScoreA = activeContextMatch
    ? activeContextMatch.teamA === teamAName
      ? activeContextMatch.scoreA
      : activeContextMatch.scoreB
    : 0;
  const currentScoreB = activeContextMatch
    ? activeContextMatch.teamA === teamAName
      ? activeContextMatch.scoreB
      : activeContextMatch.scoreA
    : 0;

  const statsA = computeTeamProfile(teamAName, sport, allMatches, teams, players);
  const statsB = computeTeamProfile(teamBName, sport, allMatches, teams, players);

  const baseline = SPORT_SCORING_BASELINES[sport] || { baseScore: 50, variance: 10, pythExp: 3.0 };

  // ── 1. Elo & Historical Win/Loss Differential ──
  const eloDiff = statsA.eloRating - statsB.eloRating;
  const eloProbA = 1 / (1 + Math.pow(10, -eloDiff / 400)); // 0..1
  const eloEdge = Math.max(-100, Math.min(100, Math.round((eloProbA - 0.5) * 240)));

  // ── 2. Pythagorean & Net Efficiency Differential ──
  const netEffA = statsA.offensiveEfficiency + statsA.defensiveEfficiency - 200;
  const netEffB = statsB.offensiveEfficiency + statsB.defensiveEfficiency - 200;
  const pythDelta = (statsA.pythagoreanWinPct - statsB.pythagoreanWinPct) * 0.45 + (netEffA - netEffB) * 0.55;
  const effEdge = Math.max(-100, Math.min(100, Math.round(pythDelta * 1.8)));

  // ── 3. Head-to-Head History & Strength of Schedule ──
  const h2h = allMatches.filter(
    m =>
      m.status === 'finished' &&
      !m.isBye &&
      ((m.teamA === teamAName && m.teamB === teamBName) || (m.teamA === teamBName && m.teamB === teamAName))
  );
  let h2hWinsA = 0;
  let h2hWinsB = 0;
  h2h.forEach(m => {
    if (m.winner === teamAName) h2hWinsA++;
    else if (m.winner === teamBName) h2hWinsB++;
  });
  const sosDelta = (statsA.strengthOfSchedule - statsB.strengthOfSchedule) * 0.08;
  const h2hDelta = (h2hWinsA - h2hWinsB) * 6.5 + sosDelta;
  const h2hEdge = Math.max(-100, Math.min(100, Math.round(h2hDelta * 6)));

  // ── 4. Recent Form, Streak & Clutch Poise ──
  const formDelta =
    (statsA.formRating - statsB.formRating) * 0.22 +
    (statsA.streak - statsB.streak) * 3.2 +
    (statsA.clutchIndex - statsB.clutchIndex) * 0.25;
  const formEdge = Math.max(-100, Math.min(100, Math.round(formDelta * 2.5)));

  // ── 5. Squad Depth & Athlete Star Power ──
  const rosterDelta =
    (statsA.clearedPlayersCount - statsB.clearedPlayersCount) * 1.8 +
    (statsA.rosterStarPower - statsB.rosterStarPower) * 0.35;
  const rosterEdge = Math.max(-100, Math.min(100, Math.round(rosterDelta * 4)));

  // ── Pre-Match Composite Logit Score (Pure Past Performance + Roster) ──
  const preMatchComposite =
    (eloDiff * 0.095) +
    pythDelta * 0.42 +
    h2hDelta * 0.65 +
    formDelta * 0.48 +
    rosterDelta * 0.55;

  const preMatchSigmoid = 1 / (1 + Math.exp(-preMatchComposite / 13.5));
  let preMatchWinProbA = Math.round(preMatchSigmoid * 100);
  // If dead even 50-50, break tie deterministically using Elo, pointDiff, or team name hash so a clear winner is predicted
  if (preMatchWinProbA === 50) {
    if (statsA.eloRating !== statsB.eloRating) {
      preMatchWinProbA = statsA.eloRating > statsB.eloRating ? 52 : 48;
    } else if (statsA.pointDiff !== statsB.pointDiff) {
      preMatchWinProbA = statsA.pointDiff > statsB.pointDiff ? 52 : 48;
    } else {
      const hashA = teamAName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const hashB = teamBName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      preMatchWinProbA = hashA >= hashB ? 52 : 48;
    }
  }
  preMatchWinProbA = Math.max(14, Math.min(86, preMatchWinProbA));
  const preMatchWinProbB = 100 - preMatchWinProbA;

  // ── Pre-Match Expected Full-Game Score ──
  const offAdjA = statsA.avgPointsFor > 0 ? (statsA.avgPointsFor - baseline.baseScore) * 0.45 : 0;
  const defAdjB = statsB.avgPointsAgainst > 0 ? (statsB.avgPointsAgainst - baseline.baseScore) * 0.32 : 0;
  const offAdjB = statsB.avgPointsFor > 0 ? (statsB.avgPointsFor - baseline.baseScore) * 0.45 : 0;
  const defAdjA = statsA.avgPointsAgainst > 0 ? (statsA.avgPointsAgainst - baseline.baseScore) * 0.32 : 0;

  let baseProjA = Math.round(baseline.baseScore + offAdjA + defAdjB + (preMatchWinProbA - 50) * (baseline.variance * 0.025));
  let baseProjB = Math.round(baseline.baseScore + offAdjB + defAdjA + (preMatchWinProbB - 50) * (baseline.variance * 0.025));

  if (baseProjA === baseProjB) {
    if (preMatchWinProbA >= preMatchWinProbB) baseProjA += 1;
    else baseProjB += 1;
  }
  baseProjA = Math.max(1, baseProjA);
  baseProjB = Math.max(1, baseProjB);

  // ── Live In-Game Bayesian Update (when match is LIVE) ──
  let winProbA = preMatchWinProbA;
  let winProbB = preMatchWinProbB;
  let projA = baseProjA;
  let projB = baseProjB;
  let liveMomentumEdge = 0;

  if (isLive) {
    const expectedTotalPoints = Math.max(2, baseProjA + baseProjB);
    const currentTotalPoints = currentScoreA + currentScoreB;
    // Estimate game completion progress (0.05 at tip-off up to 0.92 near final buzzer)
    const gameProgress = Math.max(0.05, Math.min(0.92, currentTotalPoints / expectedTotalPoints));
    const remainingFraction = Math.max(0.08, 1 - gameProgress);

    // Expected remaining points weighted by pre-match offensive pace + historical clutch
    const remA = baseProjA * remainingFraction * (1 + (statsA.clutchIndex - 50) * 0.002);
    const remB = baseProjB * remainingFraction * (1 + (statsB.clutchIndex - 50) * 0.002);

    projA = Math.max(currentScoreA, Math.round(currentScoreA + remA));
    projB = Math.max(currentScoreB, Math.round(currentScoreB + remB));

    // Live score differential impact scales up as game progresses
    const liveLead = currentScoreA - currentScoreB;
    const remainingStdDev = Math.max(1.5, baseline.variance * Math.sqrt(remainingFraction));
    const liveScoreZ = liveLead / remainingStdDev;

    // Bayesian blend of Pre-Match Historical Prior + Live Score Z-Score
    const priorLogit = Math.log(preMatchWinProbA / Math.max(1, preMatchWinProbB));
    const liveWeight = 0.35 + gameProgress * 1.45;
    const posteriorLogit = priorLogit * (1 - gameProgress * 0.45) + liveScoreZ * liveWeight;
    const liveSigmoid = 1 / (1 + Math.exp(-posteriorLogit));

    winProbA = Math.round(liveSigmoid * 100);
    if (winProbA === 50) {
      winProbA = liveLead > 0 ? 53 : liveLead < 0 ? 47 : preMatchWinProbA;
    }
    winProbA = Math.max(5, Math.min(95, winProbA));
    winProbB = 100 - winProbA;

    if (projA === projB) {
      if (winProbA >= winProbB) projA += 1;
      else projB += 1;
    }
    // Ensure projected winner's projected score matches winProb direction
    if (winProbA > winProbB && projA <= projB) {
      projA = projB + Math.max(1, Math.round((winProbA - 50) * 0.12));
    } else if (winProbB > winProbA && projB <= projA) {
      projB = projA + Math.max(1, Math.round((winProbB - 50) * 0.12));
    }

    liveMomentumEdge = Math.max(-100, Math.min(100, Math.round((liveScoreZ / 2.2) * 100)));
  }

  const predictedWinner = winProbA >= winProbB ? teamAName : teamBName;
  const predictedWinnerProb = Math.max(winProbA, winProbB);
  const predictedLoser = winProbA >= winProbB ? teamBName : teamAName;
  const predictedMargin = Math.abs(projA - projB);

  const rangeA: [number, number] = [
    Math.max(isLive ? currentScoreA : 1, Math.round(projA - baseline.variance * (isLive ? 0.25 : 0.4))),
    Math.round(projA + baseline.variance * (isLive ? 0.25 : 0.4)),
  ];
  const rangeB: [number, number] = [
    Math.max(isLive ? currentScoreB : 1, Math.round(projB - baseline.variance * (isLive ? 0.25 : 0.4))),
    Math.round(projB + baseline.variance * (isLive ? 0.25 : 0.4)),
  ];

  // Factor signals breakdown for visual UI bars
  const factorSignals: PredictionFactorSignal[] = [
    {
      label: 'Past Performance & Elo Rating',
      edgeTeam: eloEdge > 5 ? teamAName : eloEdge < -5 ? teamBName : 'Even',
      advantageScore: eloEdge,
      detailA: `${statsA.eloRating} Elo (${statsA.wins}W–${statsA.losses}L, ${statsA.winPct}%)`,
      detailB: `${statsB.eloRating} Elo (${statsB.wins}W–${statsB.losses}L, ${statsB.winPct}%)`,
    },
    {
      label: 'Offensive & Defensive Efficiency',
      edgeTeam: effEdge > 5 ? teamAName : effEdge < -5 ? teamBName : 'Even',
      advantageScore: effEdge,
      detailA: `${statsA.avgPointsFor || baseline.baseScore} PPG · Pyth ${statsA.pythagoreanWinPct}%`,
      detailB: `${statsB.avgPointsFor || baseline.baseScore} PPG · Pyth ${statsB.pythagoreanWinPct}%`,
    },
    {
      label: 'Recent Form, Streak & Clutch Index',
      edgeTeam: formEdge > 5 ? teamAName : formEdge < -5 ? teamBName : 'Even',
      advantageScore: formEdge,
      detailA: `Clutch ${statsA.clutchIndex} · Form ${statsA.formRating}%`,
      detailB: `Clutch ${statsB.clutchIndex} · Form ${statsB.formRating}%`,
    },
    {
      label: 'Head-to-Head & Schedule Strength',
      edgeTeam: h2hEdge > 5 ? teamAName : h2hEdge < -5 ? teamBName : 'Even',
      advantageScore: h2hEdge,
      detailA: `H2H: ${h2hWinsA}W · SOS ${statsA.strengthOfSchedule}`,
      detailB: `H2H: ${h2hWinsB}W · SOS ${statsB.strengthOfSchedule}`,
    },
    {
      label: 'Squad Depth & Athlete Star Power',
      edgeTeam: rosterEdge > 5 ? teamAName : rosterEdge < -5 ? teamBName : 'Even',
      advantageScore: rosterEdge,
      detailA: `${statsA.clearedPlayersCount} cleared · Star ${statsA.rosterStarPower}`,
      detailB: `${statsB.clearedPlayersCount} cleared · Star ${statsB.rosterStarPower}`,
    },
  ];

  if (isLive) {
    factorSignals.unshift({
      label: 'Live Court Score & Pace Telemetry',
      edgeTeam: currentScoreA > currentScoreB ? teamAName : currentScoreB > currentScoreA ? teamBName : 'Even',
      advantageScore: liveMomentumEdge,
      detailA: `Live Score: ${currentScoreA} pts`,
      detailB: `Live Score: ${currentScoreB} pts`,
    });
  }

  // Key factors bullets
  const factors: string[] = [];
  if (isLive) {
    if (currentScoreA !== currentScoreB) {
      const leader = currentScoreA > currentScoreB ? teamAName : teamBName;
      const leadPts = Math.abs(currentScoreA - currentScoreB);
      factors.push(
        `LIVE TELEMETRY: ${leader} leads by ${leadPts} (${currentScoreA}–${currentScoreB}); AI projects ${predictedWinner} to win (${predictedWinnerProb}%) with a final score of ${projA}–${projB}.`
      );
    } else {
      factors.push(
        `LIVE TELEMETRY: Tied ${currentScoreA}–${currentScoreB}; past performance gives ${predictedWinner} a ${predictedWinnerProb}% edge to pull away.`
      );
    }
  }

  factors.push(
    `PAST PERFORMANCE RATING: ${teamAName} (${statsA.eloRating} Elo, ${statsA.wins}W–${statsA.losses}L) vs ${teamBName} (${statsB.eloRating} Elo, ${statsB.wins}W–${statsB.losses}L).`
  );

  if (statsA.gamesPlayed > 0 || statsB.gamesPlayed > 0) {
    factors.push(
      `SCORING EFFICIENCY: ${teamAName} averages ${statsA.avgPointsFor || baseline.baseScore} PPG (${statsA.pointDiff >= 0 ? `+${statsA.pointDiff}` : statsA.pointDiff} diff) vs ${teamBName}'s ${statsB.avgPointsFor || baseline.baseScore} PPG (${statsB.pointDiff >= 0 ? `+${statsB.pointDiff}` : statsB.pointDiff} diff).`
    );
  }

  if (h2h.length > 0) {
    factors.push(
      `HEAD-TO-HEAD RECORD: ${teamAName} ${h2hWinsA} – ${h2hWinsB} ${teamBName} across ${h2h.length} prior tournament meeting${h2h.length > 1 ? 's' : ''}.`
    );
  }

  if (statsA.streak >= 2 || statsB.streak >= 2) {
    const hotTeam = statsA.streak >= statsB.streak ? teamAName : teamBName;
    const hotStreak = Math.max(statsA.streak, statsB.streak);
    factors.push(`MOMENTUM STREAK: ${hotTeam} enters riding a ${hotStreak}-game winning streak.`);
  }

  if (statsA.clearedPlayersCount !== statsB.clearedPlayersCount) {
    const deeper = statsA.clearedPlayersCount > statsB.clearedPlayersCount ? teamAName : teamBName;
    factors.push(
      `ROSTER DEPTH: ${deeper} holds an active rotation edge (${Math.max(statsA.clearedPlayersCount, statsB.clearedPlayersCount)} vs ${Math.min(statsA.clearedPlayersCount, statsB.clearedPlayersCount)} medically cleared athletes).`
    );
  }

  const probGap = Math.abs(winProbA - winProbB);
  const confidence: 'High' | 'Moderate' | 'Even / Toss-up' =
    probGap >= 22 ? 'High' : probGap >= 10 ? 'Moderate' : 'Even / Toss-up';

  const confidencePct = Math.min(98, Math.max(64, Math.round(72 + probGap * 0.45 + (statsA.gamesPlayed + statsB.gamesPlayed) * 2.2)));
  const favorite = winProbA > 53 ? teamAName : winProbB > 53 ? teamBName : 'Even Match';
  const matchQualityRating = Math.min(99, Math.max(65, Math.round(96 - probGap * 0.45 + ((statsA.eloRating + statsB.eloRating - 3000) * 0.02))));

  // Comeback probability for the currently trailing / underdog team
  const underdogClutch = winProbA < winProbB ? statsA.clutchIndex : statsB.clutchIndex;
  const comebackProb = Math.min(49, Math.max(6, Math.round(Math.min(winProbA, winProbB) * 0.85 + (underdogClutch - 50) * 0.15)));

  const momentumLeader =
    isLive && currentScoreA !== currentScoreB
      ? currentScoreA > currentScoreB
        ? teamAName
        : teamBName
      : predictedWinner;

  const momentumReason = isLive
    ? currentScoreA !== currentScoreB
      ? `Leading ${Math.max(currentScoreA, currentScoreB)}–${Math.min(currentScoreA, currentScoreB)} on court with ${predictedWinner === momentumLeader ? 'historical Elo backing' : 'upset pressure against pre-game projections'}`
      : `Deadlocked ${currentScoreA}–${currentScoreB}; ${predictedWinner} favored by ${predictedWinnerProb}% via historical efficiency & clutch index`
    : `${predictedWinner} holds a ${predictedWinnerProb}% win probability via Elo (${winProbA >= winProbB ? statsA.eloRating : statsB.eloRating}) and Pythagorean efficiency`;

  const pastPerformanceSummary = `${teamAName} (${statsA.wins}W–${statsA.losses}L, ${statsA.eloRating} Elo, ${statsA.avgPointsFor || baseline.baseScore} PPG) vs ${teamBName} (${statsB.wins}W–${statsB.losses}L, ${statsB.eloRating} Elo, ${statsB.avgPointsFor || baseline.baseScore} PPG)`;

  const tacticalSummary = isLive
    ? `LIVE AI FORECAST: Based on past performance (${pastPerformanceSummary}) blended with live court telemetry (${currentScoreA}–${currentScoreB}), Padula AI predicts ${predictedWinner} to win (${predictedWinnerProb}% win probability) by a projected final score of ${projA}–${projB}. ${predictedLoser} retains a ${comebackProb}% comeback probability (Clutch Index: ${underdogClutch}).`
    : `PRE-MATCH AI FORECAST: Based on past tournament performance (${pastPerformanceSummary}), Padula AI predicts ${predictedWinner} to win (${predictedWinnerProb}% win probability) with an expected final score of ${projA}–${projB}. ${statsA.keyPlayer ? `${teamAName}'s ${statsA.keyPlayer.name}` : teamAName} and ${statsB.keyPlayer ? `${teamBName}'s ${statsB.keyPlayer.name}` : teamBName} are the primary impact athletes.`;

  return {
    teamA: teamAName,
    teamB: teamBName,
    sport,
    isLive,
    currentScoreA,
    currentScoreB,
    preMatchWinProbA,
    preMatchWinProbB,
    winProbA,
    winProbB,
    predictedWinner,
    predictedWinnerProb,
    predictedLoser,
    predictedScoreA: projA,
    predictedScoreB: projB,
    predictedMargin,
    scoreRangeA: rangeA,
    scoreRangeB: rangeB,
    favorite,
    confidence,
    confidencePct,
    matchQualityRating,
    comebackProb,
    momentumLeader,
    momentumReason,
    h2hSummary: { teamAWins: h2hWinsA, teamBWins: h2hWinsB, totalMeetings: h2h.length },
    factorSignals,
    keyFactors: factors.slice(0, 5),
    tacticalSummary,
    pastPerformanceSummary,
    statsA,
    statsB,
    disclaimer: 'AI statistical forecast powered by past tournament performance & live score telemetry. Official outcomes are determined solely by on-court play and certified scorekeepers.',
    isOfficialOutcome: false,
  };
}
