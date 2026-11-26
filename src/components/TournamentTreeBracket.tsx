import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SPORTS_CATALOG, getSportName } from '../lib/sports';
import { isPlaceholder } from '../lib/bracket';
import { TrophyIcon, TrashIcon } from './Icons';
import type { Match } from '../types';

export interface BracketTeamEntry {
  name: string;
  department?: string;
  score?: number | string;
  isWinner?: boolean;
  isLive?: boolean;
  seed?: number;
}

export interface SportBracketTree {
  // Left Side (8 teams in R16 -> 4 teams in QF -> 2 teams in SF)
  leftR16: [BracketTeamEntry, BracketTeamEntry][]; // 4 pairs
  leftQF: [BracketTeamEntry, BracketTeamEntry][];  // 2 pairs
  leftSF: [BracketTeamEntry, BracketTeamEntry];   // 1 pair
  
  // Center Final
  final: {
    teamA: BracketTeamEntry;
    teamB: BracketTeamEntry;
    champion?: string;
    isLive?: boolean;
  };

  // Right Side (8 teams in R16 -> 4 teams in QF -> 2 teams in SF)
  rightR16: [BracketTeamEntry, BracketTeamEntry][]; // 4 pairs
  rightQF: [BracketTeamEntry, BracketTeamEntry][];  // 2 pairs
  rightSF: [BracketTeamEntry, BracketTeamEntry];   // 1 pair

  hasR16?: boolean;
  totalTeams?: number;
  matchLabels?: {
    r16: { num: number; status?: string; isNextUp?: boolean }[];
    qf: { num: number; status?: string; isNextUp?: boolean }[];
    sf: { num: number; status?: string; isNextUp?: boolean }[];
    final: { num: number; status?: string; isNextUp?: boolean };
  };
  orderedMatches?: {
    num: number;
    id?: string;
    round: string;
    teamA: string;
    teamB: string;
    scoreA?: number;
    scoreB?: number;
    status: string;
    venue?: string;
    scheduledTime?: string;
    isNextUp?: boolean;
  }[];
}

// Factory helper: creates an unplayed 16-team bracket structure.
// Automatic seeding & pairings only — NEVER automatically decides scores or winners!
function makeTree(
  leftR16: [BracketTeamEntry, BracketTeamEntry][],
  rightR16: [BracketTeamEntry, BracketTeamEntry][]
): SportBracketTree {
  return {
    leftR16: leftR16.map(pair => [{ name: pair[0].name, seed: pair[0].seed }, { name: pair[1].name, seed: pair[1].seed }]),
    leftQF: [
      [{ name: 'TBD' }, { name: 'TBD' }],
      [{ name: 'TBD' }, { name: 'TBD' }],
    ],
    leftSF: [
      { name: 'TBD' },
      { name: 'TBD' },
    ],
    final: {
      teamA: { name: 'TBD' },
      teamB: { name: 'TBD' },
      champion: 'To Be Decided',
      isLive: false,
    },
    rightSF: [
      { name: 'TBD' },
      { name: 'TBD' },
    ],
    rightQF: [
      [{ name: 'TBD' }, { name: 'TBD' }],
      [{ name: 'TBD' }, { name: 'TBD' }],
    ],
    rightR16: rightR16.map(pair => [{ name: pair[0].name, seed: pair[0].seed }, { name: pair[1].name, seed: pair[1].seed }]),
  };
}

// ── Clean Unseeded Bracket Structure for Every Sport in Padula ──────────────
const makeCleanTree = () => makeTree(
  [
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
  ],
  [
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
    [{ name: 'TBD' }, { name: 'TBD' }],
  ]
);

const SPORT_TREES_16: Record<string, SportBracketTree> = {
  s1: makeCleanTree(),
  s2: makeCleanTree(),
  s3: makeCleanTree(),
  s4: makeCleanTree(),
  s5: makeCleanTree(),
  s6: makeCleanTree(),
  s7: makeCleanTree(),
  s8: makeCleanTree(),
  s9: makeCleanTree(),
  s10: makeCleanTree(),
};

// ── Single Team Box Node ─────────────────────────────────────────────────────
function MatchNodeBox({
  team,
  align = 'left',
  fullWidth = false,
}: {
  team: BracketTeamEntry;
  align?: 'left' | 'right' | 'center';
  fullWidth?: boolean;
}) {
  const isWinner = !!team.isWinner;
  const isLive = !!team.isLive;
  const isTbdOnly = (!team.name || team.name.trim().toUpperCase() === 'TBD') && !team.seed && team.score === undefined;
  const effectiveAlign: 'left' | 'right' | 'center' = isTbdOnly ? 'center' : align;

  return (
    <div
      style={{
        background: isWinner ? 'var(--accent-light, #e0f2fe)' : 'var(--bg-card, #ffffff)',
        color: isWinner ? 'var(--accent, #0284c7)' : 'var(--text-primary, #0f172a)',
        border: isWinner
          ? '1.5px solid var(--accent, #0284c7)'
          : isLive
          ? '1.5px solid #38bdf8'
          : '1px solid var(--border, #e2e8f0)',
        borderRadius: '7px',
        padding: '0 10px',
        width: fullWidth ? '100%' : '136px',
        height: '34px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: effectiveAlign === 'right' ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: effectiveAlign === 'center' && team.score === undefined ? 'center' : 'space-between',
        gap: '6px',
        position: 'relative',
        boxShadow: isWinner ? '0 2px 6px rgba(2, 132, 199,0.14)' : '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: effectiveAlign === 'right' ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent:
            effectiveAlign === 'center'
              ? 'center'
              : effectiveAlign === 'right'
              ? 'flex-end'
              : 'flex-start',
          gap: '5px',
          overflow: 'hidden',
          flex: 1,
          minWidth: 0,
        }}
      >
        {team.seed && (
          <span style={{ fontSize: '9px', color: 'var(--text-muted, #94a3b8)', fontWeight: 800, flexShrink: 0 }}>
            {team.seed}
          </span>
        )}
        <span
          style={{
            fontSize: '11px',
            fontWeight: isWinner ? 800 : 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: effectiveAlign,
            flex: effectiveAlign === 'center' ? undefined : 1,
            minWidth: 0,
          }}
          title={team.name}
        >
          {team.name}
        </span>
      </div>

      {team.score !== undefined && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: isWinner ? 'var(--accent, #0284c7)' : 'var(--text-primary, #0f172a)',
            background: 'var(--bg-elevated, #f1f5f9)',
            padding: '1px 5px',
            borderRadius: '4px',
            flexShrink: 0,
          }}
        >
          {team.score}
        </span>
      )}

      {isLive && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#38bdf8',
            boxShadow: '0 0 0 2px #fff',
          }}
          title="Live Match"
        />
      )}
    </div>
  );
}

// ── Match Number Badge on Bracket Tree ───────────────────────────────────────
function MatchNumberBadge({
  num,
  status,
  isNextUp,
  left,
  top,
}: {
  num: number;
  status?: string;
  isNextUp?: boolean;
  left: number;
  top: number;
}) {
  const isLive = status === 'live';
  const isFinished = status === 'finished';

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '999px',
        fontSize: '9.5px',
        fontWeight: 900,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        background: isLive
          ? '#0284c7'
          : isNextUp
          ? '#0ea5e9'
          : isFinished
          ? 'rgba(16, 185, 129, 0.16)'
          : 'var(--bg-elevated, #1e293b)',
        color: isLive || isNextUp
          ? '#ffffff'
          : isFinished
          ? '#10b981'
          : 'var(--accent, #0284c7)',
        border: isLive
          ? '1.5px solid #fca5a5'
          : isNextUp
          ? '1.5px solid #7dd3fc'
          : isFinished
          ? '1px solid rgba(16, 185, 129, 0.45)'
          : '1px solid rgba(2, 132, 199, 0.4)',
        boxShadow: isLive
          ? '0 2px 8px rgba(2, 132, 199, 0.4)'
          : isNextUp
          ? '0 2px 8px rgba(14, 165, 233, 0.4)'
          : '0 1px 4px rgba(0,0,0,0.18)',
      }}
      title={`Match #${num}${isLive ? ' (LIVE NOW)' : isNextUp ? ' (PLAY NEXT)' : isFinished ? ' (COMPLETED)' : ''}`}
    >
      <span>Match #{num}</span>
      {isLive && <span style={{ fontSize: '8.5px', fontWeight: 900 }}>• LIVE</span>}
      {!isLive && isNextUp && <span style={{ fontSize: '8.5px', fontWeight: 900 }}>• NEXT</span>}
      {isFinished && <span style={{ fontSize: '8.5px', fontWeight: 900 }}>✓</span>}
    </div>
  );
}

// ── Main Symmetrical 16-Team Bracket Component ──────────────────────────────
export default function TournamentTreeBracket({
  initialSportId = 's1',
  showSportSelector = true,
  isPublicView = false,
  onSportChange,
}: {
  initialSportId?: string;
  showSportSelector?: boolean;
  isPublicView?: boolean;
  onSportChange?: (sportId: string) => void;
}) {
  const { matches, teams, deleteBracket, currentUser, activeView } = useApp();
  const [selectedSport, setSelectedSport] = useState<string>(initialSportId || 's1');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSportId && initialSportId !== selectedSport) {
      setSelectedSport(initialSportId);
    }
  }, [initialSportId]);

  const handleSelectSport = (sportId: string) => {
    setSelectedSport(sportId);
    onSportChange?.(sportId);
  };

  // Active sport metadata
  const sportMeta = useMemo(() => {
    return SPORTS_CATALOG.find(s => s.id === selectedSport) || SPORTS_CATALOG[0];
  }, [selectedSport]);

  // Dynamic tree with real matches blended in from the scoring desk
  const treeData = useMemo(() => {
    const rawMatches = matches.filter(
      m => m.sport === selectedSport || getSportName(m.sport).toLowerCase() === sportMeta.name.toLowerCase()
    );

    const base = SPORT_TREES_16[selectedSport] || SPORT_TREES_16['s1'];
    const sportTeams = (teams || []).filter(t => t.sport === selectedSport && t.isActive !== false);

    const maxRound = rawMatches.length > 0 ? Math.max(...rawMatches.map(m => m.roundNumber || 1)) : (sportTeams.length > 8 ? 4 : 3);
    const hasR16 = rawMatches.length > 0
      ? (rawMatches.some(m => {
          const r = (m.round || '').toLowerCase();
          return r.includes('16') || r.includes('r16');
        }) || maxRound >= 4)
      : (sportTeams.length > 8);

    const cleanName = (name?: string | null): string => {
      if (!name) return 'TBD';
      const trimmed = name.trim();
      if (/^(winner|tbd)/i.test(trimmed)) return 'TBD';
      return trimmed;
    };

    const getFinalizedWinner = (m?: Match): string | undefined => {
      if (!m || m.status !== 'finished' || !m.winner) return undefined;
      if (isPlaceholder(m.winner)) return undefined;
      return m.winner;
    };

    // Mutually exclusive stage classification so a Quarter-Final match NEVER falls through to Semi-Finals or Final
    const classifyStage = (m: Match): 'r16' | 'qf' | 'sf' | 'final' => {
      const r = (m.round || '').toLowerCase().trim();
      if (r.includes('16') || r.includes('r16') || r.includes('round of 16')) return 'r16';
      if (r.includes('quarter') || r.includes('qf')) return 'qf';
      if (r.includes('semi') || r.includes('sf')) return 'sf';
      if (
        r.includes('championship') ||
        r.includes('gold') ||
        r === 'final' ||
        r === 'finals' ||
        (r.includes('final') && !r.includes('quarter') && !r.includes('semi'))
      ) {
        return 'final';
      }

      // Fallback to roundNumber ONLY when m.round does not name a specific stage
      const rn = m.roundNumber ?? 1;
      if (hasR16) {
        if (rn === 1) return 'r16';
        if (rn === 2) return 'qf';
        if (rn === 3) return 'sf';
        return 'final';
      }
      if (maxRound >= 3) {
        if (rn === 1) return 'qf';
        if (rn === 2) return 'sf';
        return 'final';
      }
      if (maxRound === 2) {
        if (rn === 1) return 'sf';
        return 'final';
      }
      return 'final';
    };

    // Build deterministic 1-indexed slot maps for each stage so matches without m.slot never collide on slot 1
    const buildStageSlots = (stage: 'r16' | 'qf' | 'sf' | 'final', maxSlots: number): Record<number, Match | undefined> => {
      const stageMatches = rawMatches
        .filter(m => classifyStage(m) === stage)
        .sort((a, b) => (a.slot ?? 999) - (b.slot ?? 999) || (a.matchNumber ?? 999) - (b.matchNumber ?? 999));

      const slotMap: Record<number, Match | undefined> = {};
      const unslotted: Match[] = [];

      for (const m of stageMatches) {
        if (m.slot && m.slot >= 1 && m.slot <= maxSlots && !slotMap[m.slot]) {
          slotMap[m.slot] = m;
        } else {
          unslotted.push(m);
        }
      }

      let nextFree = 1;
      for (const m of unslotted) {
        while (nextFree <= maxSlots && slotMap[nextFree]) {
          nextFree++;
        }
        if (nextFree <= maxSlots) {
          slotMap[nextFree] = m;
          nextFree++;
        }
      }

      return slotMap;
    };

    const r16Slots = buildStageSlots('r16', 8);
    const qfSlots = buildStageSlots('qf', 4);
    const sfSlots = buildStageSlots('sf', 2);
    const finalSlots = buildStageSlots('final', 1);

    // Helper: convert match to bracket pair (strictly from the match's assigned teams; Scorekeeper decides advancement)
    const toPair = (m?: Match): [BracketTeamEntry, BracketTeamEntry] => {
      if (!m) {
        return [{ name: 'TBD' }, { name: 'TBD' }];
      }

      const isFin = m.status === 'finished';
      const isLiv = m.status === 'live';
      const showScore = (isLiv || isFin) && !m.isBye;

      const resolvedA = !isPlaceholder(m.teamA) ? m.teamA : cleanName(m.teamA);
      const resolvedB = !isPlaceholder(m.teamB) ? m.teamB : cleanName(m.teamB);

      return [
        {
          name: resolvedA || 'TBD',
          score: showScore ? m.scoreA : undefined,
          isLive: isLiv,
          isWinner: isFin && m.winner ? m.winner === resolvedA : undefined,
        },
        {
          name: resolvedB || 'TBD',
          score: showScore ? m.scoreB : undefined,
          isLive: isLiv,
          isWinner: isFin && m.winner ? m.winner === resolvedB : undefined,
        },
      ];
    };

    const toSingle = (m?: Match, slot: 'A' | 'B' = 'A'): BracketTeamEntry => {
      if (!m) {
        return { name: 'TBD' };
      }
      const rawTeam = slot === 'A' ? m.teamA : m.teamB;
      const resolvedTeam = !isPlaceholder(rawTeam) ? rawTeam : cleanName(rawTeam);
      const isFin = m.status === 'finished';
      const isLiv = m.status === 'live';
      const showScore = (isLiv || isFin) && !m.isBye;
      const score = slot === 'A' ? m.scoreA : m.scoreB;
      return {
        name: resolvedTeam || 'TBD',
        score: showScore ? score : undefined,
        isLive: isLiv,
        isWinner: isFin && m.winner ? m.winner === resolvedTeam : undefined,
      };
    };

    let leftR16: [BracketTeamEntry, BracketTeamEntry][] = base.leftR16;
    let rightR16: [BracketTeamEntry, BracketTeamEntry][] = base.rightR16;
    let leftQF: [BracketTeamEntry, BracketTeamEntry][] = base.leftQF;
    let rightQF: [BracketTeamEntry, BracketTeamEntry][] = base.rightQF;
    let leftSF: [BracketTeamEntry, BracketTeamEntry] = [base.leftSF[0], base.leftSF[1]];
    let rightSF: [BracketTeamEntry, BracketTeamEntry] = [base.rightSF[0], base.rightSF[1]];

    const mQF1 = qfSlots[1];
    const mQF2 = qfSlots[2];
    const mQF3 = qfSlots[3];
    const mQF4 = qfSlots[4];
    const mSF1 = sfSlots[1];
    const mSF2 = sfSlots[2];

    if (rawMatches.length > 0) {
      if (hasR16) {
        // 16-team bracket: Round of 16 -> Quarter-Finals -> Semi-Finals -> Championship Final
        leftR16 = [
          toPair(r16Slots[1]),
          toPair(r16Slots[2]),
          toPair(r16Slots[3]),
          toPair(r16Slots[4]),
        ];
        rightR16 = [
          toPair(r16Slots[5]),
          toPair(r16Slots[6]),
          toPair(r16Slots[7]),
          toPair(r16Slots[8]),
        ];
        leftQF = [
          toPair(mQF1),
          toPair(mQF2),
        ];
        rightQF = [
          toPair(mQF3),
          toPair(mQF4),
        ];
        leftSF = [toSingle(mSF1, 'A'), toSingle(mSF1, 'B')];
        rightSF = [toSingle(mSF2, 'A'), toSingle(mSF2, 'B')];
      } else {
        // 8-team bracket: Starts directly with Quarter-Finals (matching scoring desk)
        leftQF = [
          toPair(mQF1),
          toPair(mQF2),
        ];
        rightQF = [
          toPair(mQF3),
          toPair(mQF4),
        ];
        leftSF = [toSingle(mSF1, 'A'), toSingle(mSF1, 'B')];
        rightSF = [toSingle(mSF2, 'A'), toSingle(mSF2, 'B')];
      }
    }

    // Final match: strictly from finalSlots[1] so only Scorekeeper-advanced teams appear in the Final
    const finalMatch = finalSlots[1];
    const isFin = finalMatch?.status === 'finished';
    const isLiv = finalMatch?.status === 'live';
    const showFinalScore = Boolean((isLiv || isFin) && finalMatch && !finalMatch.isBye);
    const finalWinner = isFin ? getFinalizedWinner(finalMatch) : undefined;

    const finalTeamAName = finalMatch && !isPlaceholder(finalMatch.teamA)
      ? finalMatch.teamA
      : 'TBD';
    const finalTeamBName = finalMatch && !isPlaceholder(finalMatch.teamB)
      ? finalMatch.teamB
      : 'TBD';

    const finalNode: SportBracketTree['final'] = {
      teamA: {
        name: finalTeamAName,
        score: showFinalScore ? finalMatch?.scoreA : undefined,
        isLive: isLiv,
        isWinner: isFin && finalWinner ? finalWinner === finalTeamAName : undefined,
      },
      teamB: {
        name: finalTeamBName,
        score: showFinalScore ? finalMatch?.scoreB : undefined,
        isLive: isLiv,
        isWinner: isFin && finalWinner ? finalWinner === finalTeamBName : undefined,
      },
      champion: isFin && finalWinner
        ? finalWinner
        : isLiv
          ? `Live (${finalMatch?.scoreA ?? 0} - ${finalMatch?.scoreB ?? 0})`
          : 'To Be Decided',
      isLive: isLiv,
    };

    // Build deterministic, collision-free match numbers and play sequence for every slot on the bracket
    const usedNums = new Set<number>();
    const collectNum = (m?: Match) => {
      if (m?.matchNumber && m.matchNumber > 0) usedNums.add(m.matchNumber);
    };
    if (hasR16) {
      for (let s = 1; s <= 8; s++) collectNum(r16Slots[s]);
    }
    for (let s = 1; s <= 4; s++) collectNum(qfSlots[s]);
    for (let s = 1; s <= 2; s++) collectNum(sfSlots[s]);
    collectNum(finalMatch);

    const allocNum = (preferred: number, m?: Match): number => {
      if (m?.matchNumber && m.matchNumber > 0) return m.matchNumber;
      let candidate = preferred;
      while (usedNums.has(candidate)) candidate++;
      usedNums.add(candidate);
      return candidate;
    };

    const r16Nums = [1, 2, 3, 4, 5, 6, 7, 8].map(s => allocNum(s, r16Slots[s]));
    const qfBaseOffset = hasR16 ? 8 : 0;
    const qfNums = [1, 2, 3, 4].map(s => allocNum(qfBaseOffset + s, qfSlots[s]));
    const sfBaseOffset = hasR16 ? 12 : 4;
    const sfNums = [1, 2].map(s => allocNum(sfBaseOffset + s, sfSlots[s]));
    const finalNum = allocNum(hasR16 ? 15 : 7, finalMatch);

    // Build ordered list of bracket matches from Match #1 onward
    const stageList: { num: number; round: string; match?: Match }[] = [];
    let roundIdx = 1;
    if (hasR16) {
      for (let s = 1; s <= 8; s++) {
        stageList.push({ num: r16Nums[s - 1], round: `Round ${roundIdx}`, match: r16Slots[s] });
      }
      roundIdx++;
    }
    for (let s = 1; s <= 4; s++) {
      stageList.push({ num: qfNums[s - 1], round: `Round ${roundIdx}`, match: qfSlots[s] });
    }
    roundIdx++;
    for (let s = 1; s <= 2; s++) {
      stageList.push({ num: sfNums[s - 1], round: `Round ${roundIdx}`, match: sfSlots[s] });
    }
    roundIdx++;
    stageList.push({ num: finalNum, round: `Round ${roundIdx}`, match: finalMatch });

    stageList.sort((a, b) => a.num - b.num);

    // Determine which match is NEXT UP to play (first scheduled match in numerical order)
    const nextReadyEntry =
      stageList.find(
        item =>
          item.match &&
          item.match.status === 'scheduled' &&
          !isPlaceholder(item.match.teamA) &&
          !isPlaceholder(item.match.teamB)
      ) ||
      stageList.find(item => !item.match || item.match.status === 'scheduled');
    const nextUpMatchNum = nextReadyEntry?.num;

    const matchLabels: NonNullable<SportBracketTree['matchLabels']> = {
      r16: [1, 2, 3, 4, 5, 6, 7, 8].map(s => ({
        num: r16Nums[s - 1],
        status: r16Slots[s]?.status,
        isNextUp: r16Nums[s - 1] === nextUpMatchNum,
      })),
      qf: [1, 2, 3, 4].map(s => ({
        num: qfNums[s - 1],
        status: qfSlots[s]?.status,
        isNextUp: qfNums[s - 1] === nextUpMatchNum,
      })),
      sf: [1, 2].map(s => ({
        num: sfNums[s - 1],
        status: sfSlots[s]?.status,
        isNextUp: sfNums[s - 1] === nextUpMatchNum,
      })),
      final: {
        num: finalNum,
        status: finalMatch?.status,
        isNextUp: finalNum === nextUpMatchNum,
      },
    };

    const orderedMatches: NonNullable<SportBracketTree['orderedMatches']> = stageList.map(item => {
      const m = item.match;
      const tA = m && !isPlaceholder(m.teamA) ? m.teamA : 'TBD';
      const tB = m && !isPlaceholder(m.teamB) ? m.teamB : 'TBD';
      return {
        num: item.num,
        id: m?.id,
        round: m?.round || item.round,
        teamA: tA,
        teamB: tB,
        scoreA: m?.scoreA,
        scoreB: m?.scoreB,
        status: m?.status || 'scheduled',
        venue: m?.venue,
        scheduledTime: m?.scheduledTime,
        isNextUp: item.num === nextUpMatchNum,
      };
    });

    return {
      leftR16,
      leftQF,
      leftSF,
      final: finalNode,
      rightSF,
      rightQF,
      rightR16,
      hasR16,
      totalTeams: hasR16 ? 16 : 8,
      matchLabels,
      orderedMatches,
    };
  }, [matches, teams, selectedSport, sportMeta]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const canvasWidth = treeData.hasR16 ? 1260 : 920;
      const targetScroll = (canvasWidth - el.clientWidth) / 2;
      el.scrollLeft = targetScroll > 0 ? targetScroll : 0;
    }
  }, [selectedSport, treeData.hasR16]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
    }}>
      
      {/* ── Sport Selector Pills for Each Game ───────────────────────────────── */}
      {showSportSelector && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Select Game to View Bracket Tree:
          </div>
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
            }}
          >
            {SPORTS_CATALOG.map(s => {
              const isSelected = selectedSport === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handleSelectSport(s.id)}
                  style={{
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 800 : 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                  }}
                >
                  {s.icon(isSelected ? '#ffffff' : 'var(--text-muted)', 14)}
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Championship Bracket Canvas Card ─────────────────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: '20px 16px',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header - Stays centered and fitted to viewport */}
        <div style={{ textAlign: 'center', marginBottom: '18px', padding: '0 8px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Official Padula Tournament Bracket
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-sports)',
            fontSize: '22px',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            letterSpacing: '0.02em',
          }}>
            {sportMeta.name} — Championship Bracket Tree
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Single Elimination Structure · {treeData.totalTeams ?? 16} Teams
          </p>

          {activeView !== 'public' && !isPublicView && showSportSelector && (currentUser?.role === 'director' || currentUser?.role === 'coordinator') && (
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  if (window.confirm(`Delete the tournament bracket for ${sportMeta.name}? All scheduled matches will be permanently deleted and the bracket will be reset.`)) {
                    deleteBracket(selectedSport);
                  }
                }}
                style={{
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                  fontSize: '11.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                }}
                title={`Delete ${sportMeta.name} tournament bracket`}
              >
                <TrashIcon size={13} color="#38bdf8" />
                <span>Delete Bracket</span>
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Horizontal Scroll Viewport for the Symmetrical Bracket Tree */}
        <div
          ref={scrollContainerRef}
          className="bracket-tree-scroll-container"
          style={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '12px',
          }}
        >
          {(() => {
            const hasR16 = Boolean(treeData.hasR16);
            const xOffset = hasR16 ? 0 : 170;
            const canvasWidth = hasR16 ? 1260 : 920;
            const x = (val: number) => val - xOffset;

            return (
              /* ── Mathematical Symmetrical Canvas (920px for 8-Team / 1260px for 16-Team) ── */
              <div
                style={{
                  position: 'relative',
                  width: `${canvasWidth}px`,
                  minWidth: `${canvasWidth}px`,
                  height: '425px',
                  margin: '0 auto',
                }}
              >
                {/* ── EXACT MATHEMATICAL SVG CONNECTOR NETWORK (ZERO MISALIGNMENT) ── */}
                <svg
                  width={canvasWidth}
                  height="425"
                  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
                >
                  {/* ── LEFT: R16 to QF (Only if Round of 16 exists in this tournament) ── */}
                  {hasR16 && (
                    <>
                      <path d={`M ${x(156)} 33 H ${x(173)} V 73 H ${x(156)} M ${x(88)} 53 H ${x(190)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                      <path d={`M ${x(156)} 127 H ${x(173)} V 167 H ${x(156)} M ${x(88)} 147 H ${x(190)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                      <path d={`M ${x(156)} 253 H ${x(173)} V 293 H ${x(156)} M ${x(88)} 273 H ${x(190)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                      <path d={`M ${x(156)} 347 H ${x(173)} V 387 H ${x(156)} M ${x(88)} 367 H ${x(190)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                    </>
                  )}

                  {/* ── LEFT: QF to SF (Anchored across match badges directly to SF nodes) ── */}
                  <path d={`M ${x(326)} 53 H ${x(345)} V 147 H ${x(326)} M ${x(258)} 100 H ${x(365)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                  <path d={`M ${x(326)} 273 H ${x(345)} V 367 H ${x(326)} M ${x(258)} 320 H ${x(365)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />

                  {/* ── LEFT: SF to Final (Anchored across Match #5 badge directly to Championship Final) ── */}
                  <path d={`M ${x(501)} 100 H ${x(520)} V 320 H ${x(501)} M ${x(433)} 210 H ${x(540)}`} stroke="var(--border)" strokeWidth="2" fill="none" />

                  {/* ── RIGHT: Final to SF (Anchored across Match #6 badge directly to Championship Final) ── */}
                  <path d={`M ${x(759)} 100 H ${x(740)} V 320 H ${x(759)} M ${x(827)} 210 H ${x(720)}`} stroke="var(--border)" strokeWidth="2" fill="none" />

                  {/* ── RIGHT: SF to QF (Anchored across match badges directly to SF nodes) ── */}
                  <path d={`M ${x(934)} 53 H ${x(915)} V 147 H ${x(934)} M ${x(1002)} 100 H ${x(895)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                  <path d={`M ${x(934)} 273 H ${x(915)} V 367 H ${x(934)} M ${x(1002)} 320 H ${x(895)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />

                  {/* ── RIGHT: QF to R16 (Only if Round of 16 exists in this tournament) ── */}
                  {hasR16 && (
                    <>
                      <path d={`M ${x(1104)} 33 H ${x(1087)} V 73 H ${x(1104)} M ${x(1172)} 53 H ${x(1070)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                      <path d={`M ${x(1104)} 127 H ${x(1087)} V 167 H ${x(1104)} M ${x(1172)} 147 H ${x(1070)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                      <path d={`M ${x(1104)} 253 H ${x(1087)} V 293 H ${x(1104)} M ${x(1172)} 273 H ${x(1070)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                      <path d={`M ${x(1104)} 347 H ${x(1087)} V 387 H ${x(1104)} M ${x(1172)} 367 H ${x(1070)}`} stroke="var(--border)" strokeWidth="1.75" fill="none" />
                    </>
                  )}
                </svg>

                {/* ── LEFT COLUMN 1: ROUND OF 16 (Rendered only if R16 exists) ── */}
                {hasR16 && (
                  <>
                    <div style={{ position: 'absolute', left: `${x(20)}px`, top: '16px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[0][0]} /></div>
                    <div style={{ position: 'absolute', left: `${x(20)}px`, top: '56px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[0][1]} /></div>
                    {treeData.matchLabels?.r16[0] && <MatchNumberBadge num={treeData.matchLabels.r16[0].num} status={treeData.matchLabels.r16[0].status} isNextUp={treeData.matchLabels.r16[0].isNextUp} left={x(88)} top={53} />}

                    <div style={{ position: 'absolute', left: `${x(20)}px`, top: '110px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[1][0]} /></div>
                    <div style={{ position: 'absolute', left: `${x(20)}px`, top: '150px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[1][1]} /></div>
                    {treeData.matchLabels?.r16[1] && <MatchNumberBadge num={treeData.matchLabels.r16[1].num} status={treeData.matchLabels.r16[1].status} isNextUp={treeData.matchLabels.r16[1].isNextUp} left={x(88)} top={147} />}

                    <div style={{ position: 'absolute', left: `${x(20)}px`, top: '236px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[2][0]} /></div>
                    <div style={{ position: 'absolute', left: `${x(20)}px`, top: '276px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[2][1]} /></div>
                    {treeData.matchLabels?.r16[2] && <MatchNumberBadge num={treeData.matchLabels.r16[2].num} status={treeData.matchLabels.r16[2].status} isNextUp={treeData.matchLabels.r16[2].isNextUp} left={x(88)} top={273} />}

                    <div style={{ position: 'absolute', left: `${x(20)}px`, top: '330px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[3][0]} /></div>
                    <div style={{ position: 'absolute', left: `${x(20)}px`, top: '370px', zIndex: 2 }}><MatchNodeBox team={treeData.leftR16[3][1]} /></div>
                    {treeData.matchLabels?.r16[3] && <MatchNumberBadge num={treeData.matchLabels.r16[3].num} status={treeData.matchLabels.r16[3].status} isNextUp={treeData.matchLabels.r16[3].isNextUp} left={x(88)} top={367} />}
                  </>
                )}

                {/* ── LEFT COLUMN 2: QUARTER-FINALS ──────────────────────── */}
                <div style={{ position: 'absolute', left: `${x(190)}px`, top: '36px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[0][0]} /></div>
                <div style={{ position: 'absolute', left: `${x(190)}px`, top: '130px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[0][1]} /></div>
                {treeData.matchLabels?.qf[0] && <MatchNumberBadge num={treeData.matchLabels.qf[0].num} status={treeData.matchLabels.qf[0].status} isNextUp={treeData.matchLabels.qf[0].isNextUp} left={x(258)} top={100} />}

                <div style={{ position: 'absolute', left: `${x(190)}px`, top: '256px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[1][0]} /></div>
                <div style={{ position: 'absolute', left: `${x(190)}px`, top: '350px', zIndex: 2 }}><MatchNodeBox team={treeData.leftQF[1][1]} /></div>
                {treeData.matchLabels?.qf[1] && <MatchNumberBadge num={treeData.matchLabels.qf[1].num} status={treeData.matchLabels.qf[1].status} isNextUp={treeData.matchLabels.qf[1].isNextUp} left={x(258)} top={320} />}

                {/* ── LEFT COLUMN 3: SEMI-FINALS ─────────────────────────── */}
                <div style={{ position: 'absolute', left: `${x(365)}px`, top: '83px', zIndex: 2 }}><MatchNodeBox team={treeData.leftSF[0]} /></div>
                <div style={{ position: 'absolute', left: `${x(365)}px`, top: '303px', zIndex: 2 }}><MatchNodeBox team={treeData.leftSF[1]} /></div>
                {treeData.matchLabels?.sf[0] && <MatchNumberBadge num={treeData.matchLabels.sf[0].num} status={treeData.matchLabels.sf[0].status} isNextUp={treeData.matchLabels.sf[0].isNextUp} left={x(433)} top={210} />}

                {/* ── CENTER: CHAMPIONSHIP FINAL & TROPHY ────────────────── */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${x(540)}px`,
                    top: '104px',
                    width: '180px',
                    boxSizing: 'border-box',
                    zIndex: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    background: 'var(--bg-elevated)',
                    padding: '12px 12px',
                    borderRadius: '14px',
                    border: '2px solid var(--accent)',
                    boxShadow: '0 8px 24px rgba(2, 132, 199,0.18)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                    <TrophyIcon size={16} color="#eab308" />
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Champion
                    </span>
                  </div>

                  {treeData.matchLabels?.final && (
                    <div style={{
                      marginBottom: '6px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '9.5px',
                      fontWeight: 900,
                      background: treeData.matchLabels.final.status === 'live'
                        ? '#0284c7'
                        : treeData.matchLabels.final.isNextUp
                        ? '#0ea5e9'
                        : 'rgba(2, 132, 199, 0.14)',
                      color: treeData.matchLabels.final.status === 'live' || treeData.matchLabels.final.isNextUp
                        ? '#ffffff'
                        : 'var(--accent)',
                      border: '1px solid rgba(2, 132, 199, 0.35)',
                    }}>
                      Match #{treeData.matchLabels.final.num}
                      {treeData.matchLabels.final.status === 'live' ? ' • LIVE' : treeData.matchLabels.final.isNextUp ? ' • NEXT' : ''}
                    </div>
                  )}

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <MatchNodeBox team={treeData.final.teamA} align="center" fullWidth />
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.08em', lineHeight: 1 }}>
                      VS
                    </div>
                    <MatchNodeBox team={treeData.final.teamB} align="center" fullWidth />
                  </div>

                  <div style={{
                    background: treeData.final.isLive
                      ? 'linear-gradient(135deg, #38bdf8, #0284c7)'
                      : (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD')
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'var(--bg-card)',
                    color: (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD') || treeData.final.isLive ? '#fff' : 'var(--text-muted)',
                    border: (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD') || treeData.final.isLive ? 'none' : '1px solid var(--border)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    boxShadow: (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD')
                      ? '0 4px 14px rgba(245, 158, 11, 0.35)'
                      : 'none',
                  }}>
                    <span>
                      {treeData.final.isLive
                        ? 'Live in Progress'
                        : (treeData.final.champion && treeData.final.champion !== 'To Be Decided' && treeData.final.champion !== 'TBD')
                          ? treeData.final.champion
                          : 'To Be Decided'}
                    </span>
                  </div>
                </div>

                {/* ── RIGHT COLUMN 3: SEMI-FINALS ────────────────────────── */}
                <div style={{ position: 'absolute', left: `${x(759)}px`, top: '83px', zIndex: 2 }}><MatchNodeBox team={treeData.rightSF[0]} align="right" /></div>
                <div style={{ position: 'absolute', left: `${x(759)}px`, top: '303px', zIndex: 2 }}><MatchNodeBox team={treeData.rightSF[1]} align="right" /></div>
                {treeData.matchLabels?.sf[1] && <MatchNumberBadge num={treeData.matchLabels.sf[1].num} status={treeData.matchLabels.sf[1].status} isNextUp={treeData.matchLabels.sf[1].isNextUp} left={x(827)} top={210} />}

                {/* ── RIGHT COLUMN 2: QUARTER-FINALS ─────────────────────── */}
                <div style={{ position: 'absolute', left: `${x(934)}px`, top: '36px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[0][0]} align="right" /></div>
                <div style={{ position: 'absolute', left: `${x(934)}px`, top: '130px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[0][1]} align="right" /></div>
                {treeData.matchLabels?.qf[2] && <MatchNumberBadge num={treeData.matchLabels.qf[2].num} status={treeData.matchLabels.qf[2].status} isNextUp={treeData.matchLabels.qf[2].isNextUp} left={x(1002)} top={100} />}

                <div style={{ position: 'absolute', left: `${x(934)}px`, top: '256px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[1][0]} align="right" /></div>
                <div style={{ position: 'absolute', left: `${x(934)}px`, top: '350px', zIndex: 2 }}><MatchNodeBox team={treeData.rightQF[1][1]} align="right" /></div>
                {treeData.matchLabels?.qf[3] && <MatchNumberBadge num={treeData.matchLabels.qf[3].num} status={treeData.matchLabels.qf[3].status} isNextUp={treeData.matchLabels.qf[3].isNextUp} left={x(1002)} top={320} />}

                {/* ── RIGHT COLUMN 1: ROUND OF 16 (Rendered only if R16 exists) ── */}
                {hasR16 && (
                  <>
                    <div style={{ position: 'absolute', left: `${x(1104)}px`, top: '16px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[0][0]} align="right" /></div>
                    <div style={{ position: 'absolute', left: `${x(1104)}px`, top: '56px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[0][1]} align="right" /></div>
                    {treeData.matchLabels?.r16[4] && <MatchNumberBadge num={treeData.matchLabels.r16[4].num} status={treeData.matchLabels.r16[4].status} isNextUp={treeData.matchLabels.r16[4].isNextUp} left={x(1172)} top={53} />}

                    <div style={{ position: 'absolute', left: `${x(1104)}px`, top: '110px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[1][0]} align="right" /></div>
                    <div style={{ position: 'absolute', left: `${x(1104)}px`, top: '150px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[1][1]} align="right" /></div>
                    {treeData.matchLabels?.r16[5] && <MatchNumberBadge num={treeData.matchLabels.r16[5].num} status={treeData.matchLabels.r16[5].status} isNextUp={treeData.matchLabels.r16[5].isNextUp} left={x(1172)} top={147} />}

                    <div style={{ position: 'absolute', left: `${x(1104)}px`, top: '236px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[2][0]} align="right" /></div>
                    <div style={{ position: 'absolute', left: `${x(1104)}px`, top: '276px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[2][1]} align="right" /></div>
                    {treeData.matchLabels?.r16[6] && <MatchNumberBadge num={treeData.matchLabels.r16[6].num} status={treeData.matchLabels.r16[6].status} isNextUp={treeData.matchLabels.r16[6].isNextUp} left={x(1172)} top={273} />}

                    <div style={{ position: 'absolute', left: `${x(1104)}px`, top: '330px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[3][0]} align="right" /></div>
                    <div style={{ position: 'absolute', left: `${x(1104)}px`, top: '370px', zIndex: 2 }}><MatchNodeBox team={treeData.rightR16[3][1]} align="right" /></div>
                    {treeData.matchLabels?.r16[7] && <MatchNumberBadge num={treeData.matchLabels.r16[7].num} status={treeData.matchLabels.r16[7].status} isNextUp={treeData.matchLabels.r16[7].isNextUp} left={x(1172)} top={367} />}
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* Mobile / Narrow Screen Pan Hint directly below bracket */}
        <div style={{
          padding: '8px 4px 14px',
          textAlign: 'center',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <span>↔ Scroll or drag horizontally to inspect full tournament bracket</span>
        </div>

        {/* ── Match Play Sequence Guide (Match #1 -> Match #2 -> ...) ──────── */}
        {treeData.orderedMatches && treeData.orderedMatches.length > 0 && (
          <div style={{
            marginTop: '16px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '10px',
            }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official Match Play Sequence (Start from Match #1 in Order)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Blue badge = Next Match to Play · Red = Live · Green = Completed
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))',
              gap: '10px',
              width: '100%',
            }}>
              {treeData.orderedMatches.map((item, idx) => {
                const isLive = item.status === 'live';
                const isFin = item.status === 'finished';
                return (
                  <div
                    key={item.id ?? `${item.round}-${item.num}-${idx}`}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: isLive
                        ? 'rgba(2, 132, 199, 0.12)'
                        : item.isNextUp
                        ? 'rgba(2, 132, 199, 0.12)'
                        : 'var(--bg-elevated)',
                      border: isLive
                        ? '1.5px solid rgba(2, 132, 199, 0.55)'
                        : item.isNextUp
                        ? '1.5px solid rgba(2, 132, 199, 0.65)'
                        : '1px solid var(--border-light)',
                      boxShadow: item.isNextUp
                        ? '0 4px 14px rgba(2, 132, 199, 0.18)'
                        : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      minWidth: 0,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      minWidth: 0,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minWidth: 0,
                        overflow: 'hidden',
                      }}>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 900,
                          color: isLive ? '#38bdf8' : item.isNextUp ? '#0284c7' : isFin ? '#10b981' : 'var(--accent)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: '0.02em',
                        }}>
                          Match #{item.num} <span style={{ opacity: 0.5, fontWeight: 400 }}>·</span> {item.round}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2.5px 7px',
                        borderRadius: '999px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        lineHeight: 1.2,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        background: isLive
                          ? 'linear-gradient(135deg, #38bdf8 0%, #0f2d5c 100%)'
                          : item.isNextUp
                          ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                          : isFin
                          ? 'rgba(16, 185, 129, 0.16)'
                          : 'rgba(148, 163, 184, 0.12)',
                        color: isLive || item.isNextUp ? '#ffffff' : isFin ? '#10b981' : 'var(--text-muted)',
                        boxShadow: item.isNextUp
                          ? '0 0 10px rgba(2, 132, 199, 0.4)'
                          : isLive
                          ? '0 0 10px rgba(56, 189, 248, 0.4)'
                          : 'none',
                      }}>
                        {isLive ? '● LIVE' : item.isNextUp ? '▶ PLAY NEXT' : isFin ? '✓ FINAL' : 'QUEUED'}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      minWidth: 0,
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{item.teamA}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '11px', flexShrink: 0 }}>vs</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{item.teamB}</span>
                      {(isLive || isFin) && item.scoreA !== undefined && item.scoreB !== undefined && (
                        <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontWeight: 800, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          ({item.scoreA}–{item.scoreB})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
