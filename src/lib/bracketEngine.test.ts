import assert from 'node:assert/strict';
import {
  generateSingleEliminationMatches,
  generateDoubleEliminationMatches,
  generateRoundRobinMatches,
  rankRoundRobinTeams,
  generateGroupStageMatches,
  generateSwissRoundMatches,
  generateInitialLadder,
  resolveLadderChallenge,
} from './bracketEngine';
import type { Team, Match } from '../types';

function makeTeams(count: number, sport = 's1'): Team[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Team ${i + 1}`,
    sport,
    department: `d${(i % 4) + 1}`,
    players: [],
  }));
}

// 1. Test Single-Elimination with odd team count (5 teams -> 8-slot bracket, 3 BYEs)
{
  const teams = makeTeams(5);
  const matches = generateSingleEliminationMatches({
    eventId: 'evt-se',
    sport: 's1',
    venue: 'Main Court',
    teams,
  });
  const r1 = matches.filter(m => m.roundNumber === 1);
  const byes = r1.filter(m => m.isBye);
  assert.equal(r1.length, 4, '5 teams should produce 4 Round 1 matches (8-slot power of 2)');
  assert.equal(byes.length, 3, '5 teams in 8-slot bracket should have 3 BYEs');
  assert.ok(byes.every(b => b.status === 'finished' && b.winner && b.winner !== 'BYE'), 'BYE matches must auto-advance real team');
}

// 2. Test Double-Elimination with Losers Bracket & Bracket Reset
{
  const teams = makeTeams(4);
  const matches = generateDoubleEliminationMatches({
    eventId: 'evt-de',
    sport: 's1',
    venue: 'Main Court',
    teams,
    includeBracketReset: true,
  });
  const wb = matches.filter(m => m.bracketSide === 'winners');
  const lb = matches.filter(m => m.bracketSide === 'losers');
  const gf = matches.filter(m => m.bracketSide === 'grand_final');
  assert.ok(wb.length >= 3, '4-team DE has Winners Bracket matches');
  assert.ok(lb.length >= 1, '4-team DE has Losers Bracket matches');
  assert.equal(gf.length, 2, 'DE with reset enabled includes Grand Final + Bracket Reset');
  assert.ok(wb[0].loserNextMatchId, 'WB Round 1 losers drop into Losers Bracket');
}

// 3. Test Round-Robin odd team count (3 teams) & Tiebreaker resolution
{
  const teams = makeTeams(3);
  const rrMatches = generateRoundRobinMatches({
    eventId: 'evt-rr',
    sport: 's1',
    venue: 'Main Court',
    teams,
  });
  assert.equal(rrMatches.length, 3, '3-team Round Robin has 3 total pairings');

  // Create a 2-way tie on points/wins resolved by head-to-head
  const scored: Match[] = [
    { ...rrMatches[0], teamA: 'Team 1', teamB: 'Team 2', scoreA: 80, scoreB: 70, status: 'finished' },
    { ...rrMatches[1], teamA: 'Team 1', teamB: 'Team 3', scoreA: 60, scoreB: 75, status: 'finished' },
    { ...rrMatches[2], teamA: 'Team 2', teamB: 'Team 3', scoreA: 90, scoreB: 60, status: 'finished' },
  ];
  const ranked = rankRoundRobinTeams(['Team 1', 'Team 2', 'Team 3'], scored, ['head_to_head', 'point_differential']);
  // All 3 teams are 1W-1L (3 pts); Team 2 has +20 diff, Team 1 has -5, Team 3 has -15
  // With head_to_head on a 3-way circle, it falls through to point_differential -> Team 2 first
  assert.equal(ranked[0].teamName, 'Team 2', '3-way tie resolves via point differential to Team 2 (+20)');
}

// 4. Test Group-Stage (8 teams, 2 groups, top 2 per group -> 4-team knockout)
{
  const teams = makeTeams(8);
  const gsMatches = generateGroupStageMatches({
    eventId: 'evt-gs',
    sport: 's1',
    venue: 'Main Court',
    teams,
    groupCount: 2,
    advancingPerGroup: 2,
  });
  const groupGames = gsMatches.filter(m => m.stage === 'group');
  const koGames = gsMatches.filter(m => m.stage === 'elimination');
  assert.equal(groupGames.length, 12, '2 groups of 4 teams = 6 + 6 = 12 group matches');
  assert.equal(koGames.length, 3, 'Top 2 from 2 groups = 4-team knockout (2 SF + 1 Final)');
}

// 5. Test Swiss System repeat-pairing avoidance & odd-team BYE
{
  const teams = makeTeams(5);
  const r1 = generateSwissRoundMatches({
    eventId: 'evt-sw',
    sport: 's1',
    venue: 'Main Court',
    teams,
    existingMatches: [],
    roundNumber: 1,
  });
  assert.equal(r1.length, 3, '5-team Swiss Round 1 produces 2 games + 1 BYE');
  assert.equal(r1.filter(m => m.isBye).length, 1, 'Odd team count gets 1 BYE');

  const r1Finished = r1.map(m =>
    m.isBye ? m : { ...m, status: 'finished' as const, scoreA: 10, scoreB: 5, winner: m.teamA }
  );
  const r2 = generateSwissRoundMatches({
    eventId: 'evt-sw',
    sport: 's1',
    venue: 'Main Court',
    teams,
    existingMatches: r1Finished,
    roundNumber: 2,
  });
  const r1Pairs = new Set(r1.filter(m => !m.isBye).map(m => [m.teamA, m.teamB].sort().join('||')));
  const r2NonBye = r2.filter(m => !m.isBye);
  assert.ok(
    r2NonBye.every(m => !r1Pairs.has([m.teamA, m.teamB].sort().join('||'))),
    'Swiss Round 2 avoids repeat pairings from Round 1'
  );
}

// 6. Test Ladder / Pyramid Challenge & Rank Swap
{
  const teams = makeTeams(4);
  const ladder = generateInitialLadder('s1', teams, 'evt-lad');
  const { updatedEntries, challenge } = resolveLadderChallenge(ladder, 'Team 3', 'Team 2', 'Team 3');
  const t3 = updatedEntries.find(e => e.teamName === 'Team 3')!;
  const t2 = updatedEntries.find(e => e.teamName === 'Team 2')!;
  assert.equal(t3.rank, 2, 'Winning challenger swaps up to rank 2');
  assert.equal(t2.rank, 3, 'Defeated defender drops to rank 3');
  assert.equal(challenge.winnerTeam, 'Team 3');
}

console.log('ALL BRACKET ENGINE TESTS PASSED (6/6 suites)');
