import type { Match, Team, Player } from '../types';
import { isPlaceholder } from './bracket';

export interface TeamStatsProfile {
  name: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  pointDiff: number;
  streak: number;
  clearedPlayersCount: number;
  keyPlayer: { name: string; jerseyNumber?: string } | null;
}

export interface MatchPrediction {
  teamA: string;
  teamB: string;
  sport: string;
  winProbA: number; // 0 - 100
  winProbB: number; // 0 - 100
  predictedScoreA: number;
  predictedScoreB: number;
  scoreRangeA: [number, number];
  scoreRangeB: [number, number];
  favorite: string | 'Even Match';
  confidence: 'High' | 'Moderate' | 'Even / Toss-up';
  matchQualityRating: number; // 50 to 99
  keyFactors: string[];
  tacticalSummary: string;
  statsA: TeamStatsProfile;
  statsB: TeamStatsProfile;
  disclaimer: string;
  isOfficialOutcome: false;
}

// Typical scoring ranges per sport
const SPORT_SCORING_BASELINES: Record<string, { baseScore: number; variance: number }> = {
  s1: { baseScore: 78, variance: 14 }, // Basketball
  s2: { baseScore: 25, variance: 5 },  // Volleyball (per set reference)
  s3: { baseScore: 21, variance: 4 },  // Badminton (per set reference)
  s4: { baseScore: 11, variance: 3 },  // Table Tennis
  s5: { baseScore: 16, variance: 6 },  // Esports (rounds)
  s6: { baseScore: 1,  variance: 0.5 }, // Chess (points)
  s7: { baseScore: 3,  variance: 1.5 }, // Football / Futsal
  s8: { baseScore: 21, variance: 5 },  // Sepak Takraw
  s9: { baseScore: 13, variance: 3 },  // Frisbee
  s10: { baseScore: 380, variance: 60 }, // Scrabble
};

/**
 * Computes individual statistical profile for a team
 */
export function computeTeamProfile(
  teamName: string,
  sport: string,
  allMatches: Match[],
  teams: Team[],
  players: Player[]
): TeamStatsProfile {
  const finished = allMatches.filter(
    m => m.status === 'finished' && !m.isBye && (m.teamA === teamName || m.teamB === teamName)
  );

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;
  let streak = 0;

  // Scan in chronological order for streak
  finished.forEach(m => {
    const isTeamA = m.teamA === teamName;
    const scored = isTeamA ? m.scoreA : m.scoreB;
    const conceded = isTeamA ? m.scoreB : m.scoreA;

    pointsFor += scored;
    pointsAgainst += conceded;

    if (m.winner === teamName) {
      wins++;
      streak = streak > 0 ? streak + 1 : 1;
    } else if (m.winner) {
      losses++;
      streak = streak < 0 ? streak - 1 : -1;
    }
  });

  const gamesPlayed = wins + losses;
  const avgPointsFor = gamesPlayed > 0 ? Number((pointsFor / gamesPlayed).toFixed(1)) : 0;
  const avgPointsAgainst = gamesPlayed > 0 ? Number((pointsAgainst / gamesPlayed).toFixed(1)) : 0;
  const pointDiff = pointsFor - pointsAgainst;

  // Team roster & active cleared players
  const teamObj = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
  const teamPlayers = players.filter(p => {
    if (teamObj && p.teamId === teamObj.id) return true;
    return p.department === teamObj?.department && p.sport === sport;
  });

  const cleared = teamPlayers.filter(p => p.medicalCleared && p.isActive !== false);
  const keyPlayer = cleared.length > 0
    ? { name: cleared[0].name, jerseyNumber: cleared[0].jerseyNumber }
    : null;

  return {
    name: teamName,
    gamesPlayed,
    wins,
    losses,
    pointsFor,
    pointsAgainst,
    avgPointsFor,
    avgPointsAgainst,
    pointDiff,
    streak,
    clearedPlayersCount: cleared.length,
    keyPlayer,
  };
}

/**
 * Generates an advanced statistical forecast for any matchup
 */
export function predictMatch(
  teamAName: string,
  teamBName: string,
  sport: string,
  allMatches: Match[],
  teams: Team[],
  players: Player[]
): MatchPrediction | null {
  if (isPlaceholder(teamAName) || isPlaceholder(teamBName)) {
    return null;
  }

  const statsA = computeTeamProfile(teamAName, sport, allMatches, teams, players);
  const statsB = computeTeamProfile(teamBName, sport, allMatches, teams, players);

  const baseline = SPORT_SCORING_BASELINES[sport] || { baseScore: 50, variance: 10 };

  // 1. Scoring rating factors
  const winRateA = statsA.gamesPlayed > 0 ? statsA.wins / statsA.gamesPlayed : 0.5;
  const winRateB = statsB.gamesPlayed > 0 ? statsB.wins / statsB.gamesPlayed : 0.5;

  // 2. Offense & Defense differential
  const diffPerGameA = statsA.gamesPlayed > 0 ? (statsA.pointDiff / statsA.gamesPlayed) : 0;
  const diffPerGameB = statsB.gamesPlayed > 0 ? (statsB.pointDiff / statsB.gamesPlayed) : 0;

  // 3. Squad depth & cleared players
  const rosterAdvantage = (statsA.clearedPlayersCount - statsB.clearedPlayersCount) * 1.5;

  // 4. Head-to-Head history
  const h2h = allMatches.filter(
    m => m.status === 'finished' && !m.isBye &&
      ((m.teamA === teamAName && m.teamB === teamBName) || (m.teamA === teamBName && m.teamB === teamAName))
  );
  let h2hAdvantage = 0;
  h2h.forEach(m => {
    if (m.winner === teamAName) h2hAdvantage += 4;
    else if (m.winner === teamBName) h2hAdvantage -= 4;
  });

  // Calculate composite power rating
  const powerA = (winRateA * 35) + (diffPerGameA * 1.8) + (statsA.streak * 2.5) + rosterAdvantage + (h2hAdvantage / 2);
  const powerB = (winRateB * 35) + (diffPerGameB * 1.8) + (statsB.streak * 2.5) - rosterAdvantage - (h2hAdvantage / 2);

  const rawDelta = powerA - powerB;

  // Logistic win probability curve bounded realistically between 18% and 82%
  const sigmoid = 1 / (1 + Math.exp(-rawDelta / 14));
  let probA = Math.round(sigmoid * 100);
  probA = Math.max(18, Math.min(82, probA));
  const probB = 100 - probA;

  // Score projection based on sport baseline and team offense/defense
  const offAdjA = statsA.avgPointsFor > 0 ? (statsA.avgPointsFor - baseline.baseScore) * 0.4 : 0;
  const defAdjB = statsB.avgPointsAgainst > 0 ? (statsB.avgPointsAgainst - baseline.baseScore) * 0.3 : 0;
  const offAdjB = statsB.avgPointsFor > 0 ? (statsB.avgPointsFor - baseline.baseScore) * 0.4 : 0;
  const defAdjA = statsA.avgPointsAgainst > 0 ? (statsA.avgPointsAgainst - baseline.baseScore) * 0.3 : 0;

  let projA = Math.round(baseline.baseScore + offAdjA + defAdjB + (probA > 50 ? (probA - 50) * 0.15 : (probA - 50) * 0.15));
  let projB = Math.round(baseline.baseScore + offAdjB + defAdjA + (probB > 50 ? (probB - 50) * 0.15 : (probB - 50) * 0.15));

  // Sport specific adjustments (no ties in elimination sports like basketball/volleyball)
  if (projA === projB) {
    if (probA >= probB) projA += 1;
    else projB += 1;
  }

  // Safety floor
  projA = Math.max(1, projA);
  projB = Math.max(1, projB);

  const rangeA: [number, number] = [
    Math.max(1, Math.round(projA - baseline.variance * 0.4)),
    Math.round(projA + baseline.variance * 0.4),
  ];
  const rangeB: [number, number] = [
    Math.max(1, Math.round(projB - baseline.variance * 0.4)),
    Math.round(projB + baseline.variance * 0.4),
  ];

  // Key factors extraction
  const factors: string[] = [];
  if (Math.abs(probA - probB) <= 8) {
    factors.push('Evenly matched programs: high probability of down-to-the-wire finish');
  } else if (probA > probB) {
    factors.push(`${teamAName} favored with ${probA}% predicted probability based on tournament metrics`);
  } else {
    factors.push(`${teamBName} favored with ${probB}% predicted probability based on tournament metrics`);
  }

  if (statsA.avgPointsFor > 0 && statsB.avgPointsFor > 0) {
    if (statsA.avgPointsFor > statsB.avgPointsFor + 4) {
      factors.push(`${teamAName} holds scoring edge averaging ${statsA.avgPointsFor} PPG vs ${statsB.avgPointsFor} PPG`);
    } else if (statsB.avgPointsFor > statsA.avgPointsFor + 4) {
      factors.push(`${teamBName} holds scoring edge averaging ${statsB.avgPointsFor} PPG vs ${statsA.avgPointsFor} PPG`);
    }
  }

  if (statsA.clearedPlayersCount > statsB.clearedPlayersCount) {
    factors.push(`${teamAName} holds deeper cleared roster (${statsA.clearedPlayersCount} vs ${statsB.clearedPlayersCount} active athletes)`);
  } else if (statsB.clearedPlayersCount > statsA.clearedPlayersCount) {
    factors.push(`${teamBName} holds deeper cleared roster (${statsB.clearedPlayersCount} vs ${statsA.clearedPlayersCount} active athletes)`);
  }

  if (h2h.length > 0) {
    factors.push(`Prior meetings in tournament record: ${h2h.length} game(s) on file`);
  }

  if (statsA.streak >= 2) factors.push(`${teamAName} carries hot momentum (${statsA.streak}-game win streak)`);
  if (statsB.streak >= 2) factors.push(`${teamBName} carries hot momentum (${statsB.streak}-game win streak)`);

  const confidence: 'High' | 'Moderate' | 'Even / Toss-up' =
    Math.abs(probA - probB) >= 24 ? 'High' : Math.abs(probA - probB) >= 12 ? 'Moderate' : 'Even / Toss-up';

  const favorite = probA > 54 ? teamAName : probB > 54 ? teamBName : 'Even Match';
  const matchQualityRating = Math.round(100 - Math.abs(probA - probB) * 0.6);

  // AI narrative summary
  const tacticalSummary = `Padula AI analytical model estimates ${favorite !== 'Even Match' ? `${favorite} as the projected favorite (${Math.max(probA, probB)}%)` : 'an exceptionally balanced contest'} with an expected final tempo around ${projA}–${projB}. ${statsA.keyPlayer ? `${teamAName}'s ${statsA.keyPlayer.name}` : teamAName} and ${statsB.keyPlayer ? `${teamBName}'s ${statsB.keyPlayer.name}` : teamBName} are designated key athletes to watch.`;

  return {
    teamA: teamAName,
    teamB: teamBName,
    sport,
    winProbA: probA,
    winProbB: probB,
    predictedScoreA: projA,
    predictedScoreB: projB,
    scoreRangeA: rangeA,
    scoreRangeB: rangeB,
    favorite,
    confidence,
    matchQualityRating,
    keyFactors: factors.slice(0, 4),
    tacticalSummary,
    statsA,
    statsB,
    disclaimer: 'AI statistical forecast for spectator & analytical insight only. Official tournament outcomes are determined solely by on-court play and certified scorekeepers.',
    isOfficialOutcome: false,
  };
}

